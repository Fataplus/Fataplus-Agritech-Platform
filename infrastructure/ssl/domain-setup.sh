#!/bin/bash

# Fataplus Domain and SSL Setup Script
# Multi-region domain configuration for African deployment

set -e

# Configuration
DOMAIN="fata.plus"
STAGING_DOMAIN="staging.fata.plus"
REGIONS=("kenya" "south_africa" "nigeria" "ghana")
EMAIL="admin@fata.plus"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if domain exists
check_domain() {
    local domain=$1
    if nslookup "$domain" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to setup DNS records
setup_dns_records() {
    print_status "Setting up DNS records for $DOMAIN"

    # Create DNS records file
    cat > dns-records.txt << EOF
; Fataplus DNS Records for $DOMAIN
; Generated on $(date)

; A Records for main services
@           IN    A     192.168.1.100
api         IN    A     192.168.1.101
admin       IN    A     192.168.1.102
mcp         IN    A     192.168.1.103
app         IN    A     192.168.1.104

; CNAME Records
www         IN    CNAME @
staging     IN    CNAME @
api.staging IN    CNAME @
admin.staging IN  CNAME @
mcp.staging IN    CNAME @

; Regional domains
EOF

    # Add regional DNS records
    for region in "${REGIONS[@]}"; do
        echo "${region} IN A 192.168.1.10${#REGIONS[@]}" >> dns-records.txt
        echo "api.${region} IN A 192.168.1.11${#REGIONS[@]}" >> dns-records.txt
    done

    # MX Records for email
    cat >> dns-records.txt << EOF

; MX Records
@           IN    MX    10 mail.fata.plus

; TXT Records
@           IN    TXT   "v=spf1 include:_spf.google.com ~all"
@           IN    TXT   "google-site-verification=your-verification-code"

; DMARC
_dmarc      IN    TXT   "v=DMARC1; p=quarantine; rua=mailto:dmarc@fata.plus"

; Security
@           IN    CAA   0 issue "letsencrypt.org"

EOF

    print_status "DNS records saved to dns-records.txt"
    print_warning "Please manually add these records to your DNS provider"
}

# Function to setup SSL certificates
setup_ssl_certificates() {
    print_status "Setting up SSL certificates"

    # Create SSL directory structure
    mkdir -p ssl/live
    mkdir -p ssl/archive

    # Generate private key for main domain
    print_status "Generating private key for $DOMAIN"
    openssl genrsa -out ssl/live/$DOMAIN.key 2048

    # Generate CSR
    print_status "Generating Certificate Signing Request"
    openssl req -new -key ssl/live/$DOMAIN.key -out ssl/$DOMAIN.csr -subj "/C=KE/ST=Nairobi/L=Nairobi/O=Fataplus/CN=$DOMAIN"

    # Generate self-signed certificate for development
    print_status "Generating self-signed certificate for development"
    openssl req -x509 -new -nodes -key ssl/live/$DOMAIN.key -sha256 -days 365 -out ssl/live/$DOMAIN.crt -subj "/C=KE/ST=Nairobi/L=Nairobi/O=Fataplus/CN=$DOMAIN"

    # Create certificate bundle
    cat ssl/live/$DOMAIN.crt > ssl/live/$DOMAIN-fullchain.crt

    print_status "SSL certificates generated successfully"
}

# Function to setup Kubernetes Ingress
setup_k8s_ingress() {
    print_status "Setting up Kubernetes Ingress configuration"

    # Create namespace for ingress
    kubectl create namespace ingress-nginx --dry-run=client -o yaml | kubectl apply -f -

    # Install NGINX Ingress Controller
    print_status "Installing NGINX Ingress Controller"
    helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
    helm repo update

    # Install ingress controller
    helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
        --namespace ingress-nginx \
        --set controller.service.type=LoadBalancer \
        --set controller.service.annotations."service\.beta\.kubernetes\.io/aws-load-balancer-type"=nlb

    # Install Cert-Manager
    print_status "Installing Cert-Manager"
    helm repo add jetstack https://charts.jetstack.io
    helm repo update

    helm upgrade --install cert-manager jetstack/cert-manager \
        --namespace cert-manager \
        --create-namespace \
        --version v1.11.0

    # Wait for cert-manager to be ready
    kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=cert-manager -n cert-manager --timeout=300s

    print_status "Kubernetes Ingress setup completed"
}

# Function to setup regional routing
setup_regional_routing() {
    print_status "Setting up regional routing configuration"

    # Create regional routing configuration
    cat > regional-routing.yaml << EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: regional-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/affinity: "cookie"
    nginx.ingress.kubernetes.io/session-cookie-name: "route"
    nginx.ingress.kubernetes.io/session-cookie-expires: "172800"
    nginx.ingress.kubernetes.io/session-cookie-max-age: "172800"
spec:
  rules:
EOF

    # Add regional rules
    for region in "${REGIONS[@]}"; do
        cat >> regional-routing.yaml << EOF
  - host: ${region}.fata.plus
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-frontend-service-${region}
            port:
              number: 3000
EOF
    done

    print_status "Regional routing configuration saved to regional-routing.yaml"
}

# Function to validate SSL configuration
validate_ssl() {
    print_status "Validating SSL configuration"

    # Check if certificate is valid
    if openssl x509 -in ssl/live/$DOMAIN.crt -text -noout > /dev/null 2>&1; then
        print_status "SSL certificate is valid"
    else
        print_error "SSL certificate is invalid"
        exit 1
    fi

    # Check certificate expiration
    expiration_date=$(openssl x509 -enddate -noout -in ssl/live/$DOMAIN.crt | cut -d= -f2)
    print_status "Certificate expires on: $expiration_date"

    # Test HTTPS connection (if domain is live)
    if check_domain "$DOMAIN"; then
        print_status "Testing HTTPS connection to $DOMAIN"
        if curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN | grep -q "200\|301\|302"; then
            print_status "HTTPS connection successful"
        else
            print_warning "HTTPS connection failed - this is expected for new domains"
        fi
    fi
}

# Function to setup monitoring for SSL
setup_ssl_monitoring() {
    print_status "Setting up SSL monitoring"

    # Create SSL monitoring configuration
    cat > ssl-monitoring.yaml << EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: ssl-monitoring-config
  namespace: monitoring
data:
  ssl-check.sh: |
    #!/bin/bash
    # SSL Certificate monitoring script

    DOMAINS=("$DOMAIN" "api.$DOMAIN" "staging.$DOMAIN")

    for domain in "\${DOMAINS[@]}"; do
        if openssl s_client -connect \$domain:443 -servername \$domain < /dev/null 2>/dev/null | openssl x509 -noout -checkend 2592000; then
            echo "SSL certificate for \$domain is valid for more than 30 days"
        else
            echo "SSL certificate for \$domain expires in less than 30 days"
            # Send alert (in production, integrate with your monitoring system)
        fi
    done
EOF

    print_status "SSL monitoring configuration saved to ssl-monitoring.yaml"
}

# Main execution
main() {
    print_status "Starting Fataplus Domain and SSL Setup"
    print_status "This script will configure multi-region domains and SSL certificates"

    # Check prerequisites
    if ! command -v openssl &> /dev/null; then
        print_error "OpenSSL is required but not installed"
        exit 1
    fi

    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is required but not installed"
        exit 1
    fi

    if ! command -v helm &> /dev/null; then
        print_error "helm is required but not installed"
        exit 1
    fi

    # Execute setup steps
    setup_dns_records
    setup_ssl_certificates
    setup_k8s_ingress
    setup_regional_routing
    validate_ssl
    setup_ssl_monitoring

    print_status "Domain and SSL setup completed successfully"
    print_warning "Please review and manually apply DNS records to your provider"
    print_warning "Update configuration files with your actual values"

    echo
    echo "Next steps:"
    echo "1. Apply DNS records to your domain provider"
    echo "2. Update configuration files with actual values"
    echo "3. Apply Kubernetes manifests: kubectl apply -f ssl-config.yaml"
    echo "4. Monitor certificate issuance: kubectl get certificates"
    echo "5. Test HTTPS connectivity once DNS propagates"
}

# Run main function
main "$@"