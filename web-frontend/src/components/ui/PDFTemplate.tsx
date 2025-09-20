import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font
} from '@react-pdf/renderer';

// Enregistrer des polices personnalisées (optionnel)
// Font.register({
//   family: 'Montserrat',
//   fonts: [
//     { src: '/fonts/Montserrat-Regular.ttf' },
//     { src: '/fonts/Montserrat-Bold.ttf', fontWeight: 'bold' },
//   ],
// });

// Styles pour le PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottom: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 20,
  },
  logo: {
    width: 60,
    height: 60,
  },
  companyInfo: {
    textAlign: 'right',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 9,
    color: '#6b7280',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 10,
    borderBottom: 1,
    borderBottomColor: '#059669',
    paddingBottom: 5,
  },
  table: {
    border: 1,
    borderColor: '#e5e7eb',
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottom: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: 1,
    borderBottomColor: '#e5e7eb',
  },
  tableCell: {
    padding: 8,
    fontSize: 9,
  },
  tableCellHeader: {
    fontWeight: 'bold',
    color: '#374151',
  },
  serviceCell: {
    flex: 2,
  },
  daysCell: {
    flex: 1,
    textAlign: 'center',
  },
  costCell: {
    flex: 1,
    textAlign: 'right',
  },
  totalSection: {
    backgroundColor: '#f9fafb',
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
  },
  grandTotal: {
    fontSize: 16,
    color: '#059669',
    marginTop: 10,
    paddingTop: 10,
    borderTop: 2,
    borderTopColor: '#059669',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#6b7280',
    borderTop: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  disclaimer: {
    fontSize: 8,
    color: '#6b7280',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  badge: {
    backgroundColor: '#dbeafe',
    color: '#1d4ed8',
    padding: '2 6',
    borderRadius: 3,
    fontSize: 7,
    fontWeight: 'bold',
  },
  complexityCell: {
    flex: 1,
    textAlign: 'center',
  },
  sdgCell: {
    flex: 2,
  },
});

// Interface pour les données du PDF
export interface PDFData {
  selectedServices: Array<{
    id: string;
    name: string;
    description: string;
    days: number;
    costEUR: number;
    costMGA: number;
    complexity: string;
    sdg: string;
  }>;
  agencyTotalEUR: number;
  agencyTotalMGA: number;
  saasUsers: number;
  saasMonths: number;
  saasTotalEUR: number;
  saasTotalMGA: number;
  grandTotalEUR: number;
  grandTotalMGA: number;
  includeSaaS: boolean;
  currency: 'EUR' | 'MGA';
  agencyTotalDays: number;
}

// Composant pour le badge de complexité
const ComplexityBadge: React.FC<{ complexity: string }> = ({ complexity }) => {
  const colors = {
    low: '#dbeafe',
    medium: '#fef3c7',
    high: '#fee2e2'
  };

  const textColors = {
    low: '#1d4ed8',
    medium: '#92400e',
    high: '#dc2626'
  };

  return (
    <Text style={[styles.badge, { backgroundColor: colors[complexity as keyof typeof colors], color: textColors[complexity as keyof typeof textColors] }]}>
      {complexity.toUpperCase()}
    </Text>
  );
};

// Fonction principale pour générer le PDF
const PDFTemplate: React.FC<{ data: PDFData }> = ({ data }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* En-tête */}
      <View style={styles.header}>
        <View>
          {/* Logo Fataplus */}
          <Image
            src="/logo.png"
            style={styles.logo}
          />
        </View>
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>Fataplus</Text>
          <Text style={styles.companyDetails}>AgriTech Solutions</Text>
          <Text style={styles.companyDetails}>Antananarivo, Madagascar</Text>
          <Text style={styles.companyDetails}>contact@fataplus.mg</Text>
        </View>
      </View>

      {/* Titre */}
      <Text style={styles.title}>Estimation de Projet AgriTech</Text>

      {/* Original Prompt */}
      {data.originalPrompt && (
        <View style={[styles.section, { marginBottom: 15 }]}>
          <Text style={[styles.sectionTitle, { fontSize: 12 }]}>Description du Projet</Text>
          <Text style={{ fontSize: 9, color: '#374151', lineHeight: 1.4 }}>
            {data.originalPrompt}
          </Text>
        </View>
      )}

      {/* Services Agence */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Services de Développement</Text>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={[styles.tableCell, styles.serviceCell]}>
              <Text style={styles.tableCellHeader}>Service</Text>
            </View>
            <View style={[styles.tableCell, styles.daysCell]}>
              <Text style={styles.tableCellHeader}>Jours</Text>
            </View>
            <View style={[styles.tableCell, styles.complexityCell]}>
              <Text style={styles.tableCellHeader}>Complexité</Text>
            </View>
            {data.selectedServices.some(s => s.aiReasoning) && (
              <View style={[styles.tableCell, { flex: 1.5 }]}>
                <Text style={styles.tableCellHeader}>Raison IA</Text>
              </View>
            )}
            <View style={[styles.tableCell, styles.costCell]}>
              <Text style={styles.tableCellHeader}>
                Coût ({data.currency === 'EUR' ? '€' : 'MGA'})
              </Text>
            </View>
          </View>

          {data.selectedServices.map((service, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={[styles.tableCell, styles.serviceCell]}>
                <Text style={{ fontWeight: 'bold', marginBottom: 3 }}>{service.name}</Text>
                <Text style={{ fontSize: 8, color: '#6b7280' }}>{service.description}</Text>
              </View>
              <View style={[styles.tableCell, styles.daysCell]}>
                <Text>{service.days}</Text>
              </View>
              <View style={[styles.tableCell, styles.complexityCell]}>
                <ComplexityBadge complexity={service.complexity} />
              </View>
              {data.selectedServices.some(s => s.aiReasoning) && (
                <View style={[styles.tableCell, { flex: 1.5 }]}>
                  <Text style={{ fontSize: 7, color: '#6b7280' }}>
                    {service.aiReasoning || '-'}
                  </Text>
                </View>
              )}
              <View style={[styles.tableCell, styles.costCell]}>
                <Text>{data.currency === 'EUR' ? service.costEUR.toLocaleString() : service.costMGA.toLocaleString()}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={{ fontSize: 9, color: '#6b7280', marginTop: 5 }}>
          Total jours de développement: {data.agencyTotalDays} jours
        </Text>
      </View>

      {/* Services SaaS */}
      {data.includeSaaS && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plateforme SaaS</Text>
          <Text style={{ fontSize: 10, marginBottom: 10 }}>
            Configuration: {data.saasUsers} utilisateurs × {data.saasMonths} mois
          </Text>
          <Text style={{ fontSize: 10 }}>
            Tarif mensuel: €1 par utilisateur
          </Text>
        </View>
      )}

      {/* Section des totaux */}
      <View style={styles.totalSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Services Agence:</Text>
          <Text style={styles.totalAmount}>
            {data.currency === 'EUR'
              ? `${data.agencyTotalEUR.toLocaleString()} €`
              : `${data.agencyTotalMGA.toLocaleString()} MGA`
            }
          </Text>
        </View>

        {data.includeSaaS && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Plateforme SaaS:</Text>
            <Text style={styles.totalAmount}>
              {data.currency === 'EUR'
                ? `${data.saasTotalEUR.toLocaleString()} €`
                : `${data.saasTotalMGA.toLocaleString()} MGA`
              }
            </Text>
          </View>
        )}

        <View style={[styles.totalRow, styles.grandTotal]}>
          <Text style={styles.totalLabel}>TOTAL ESTIMÉ:</Text>
          <Text style={styles.totalAmount}>
            {data.currency === 'EUR'
              ? `${data.grandTotalEUR.toLocaleString()} €`
              : `${data.grandTotalMGA.toLocaleString()} MGA`
            }
          </Text>
        </View>
      </View>

      {/* Pied de page */}
      <View style={styles.footer}>
        <Text style={styles.disclaimer}>
          * Cette estimation est fournie à titre indicatif. Le prix final peut varier selon les spécifications détaillées du projet.
        </Text>
        <Text>
          Document généré le {new Date().toLocaleDateString('fr-FR')} - Fataplus AgriTech Solutions
        </Text>
      </View>
    </Page>
  </Document>
);

export default PDFTemplate;
