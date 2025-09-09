const http = require('http');

console.log('🚀 Starting Fataplus AgriTech Platform (Local Development)...');

const server = http.createServer((req, res) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    
    // Handle health check endpoints (matching Cloudron server)
    if (req.url === '/health' || req.url === '/healthcheck') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            service: 'Fataplus AgriTech Platform',
            version: '1.0.0',
            timestamp: timestamp,
            environment: 'production'
        }));
        return;
    }
    
    // Handle main application (matching Cloudron server design)
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fataplus AgriTech Platform</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container { 
            max-width: 1000px; 
            background: white; 
            padding: 50px; 
            border-radius: 20px; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
            text-align: center;
        }
        h1 { 
            color: #2c5530; 
            text-align: center; 
            margin-bottom: 15px;
            font-size: 3em;
        }
        .status { 
            background: linear-gradient(45deg, #28a745, #20c997);
            color: white;
            padding: 20px;
            border-radius: 15px;
            margin-bottom: 30px;
            text-align: center;
            font-weight: 600;
        }
        .tagline {
            font-size: 1.2em;
            color: #666;
            margin-bottom: 30px;
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .feature {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            border-left: 4px solid #28a745;
        }
        .feature h3 {
            color: #2c5530;
            margin-bottom: 10px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
        }
        .environment-badge {
            display: inline-block;
            background: #17a2b8;
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
            font-size: 0.8em;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="environment-badge">🌍 LOCAL DEVELOPMENT</div>
        <h1>🌾 Fataplus AgriTech Platform</h1>
        <div class="status">✅ Platform Successfully Running Locally!</div>
        <p class="tagline">Building the future of African Agriculture</p>
        
        <div class="features">
            <div class="feature">
                <h3>🌤️ Weather Intelligence</h3>
                <p>AI-powered weather predictions and crop recommendations</p>
            </div>
            <div class="feature">
                <h3>🐄 Livestock Management</h3>
                <p>Complete health tracking and breeding management</p>
            </div>
            <div class="feature">
                <h3>🛒 E-commerce Platform</h3>
                <p>Direct-to-consumer agricultural marketplace</p>
            </div>
            <div class="feature">
                <h3>📱 Mobile Money</h3>
                <p>M-Pesa and Airtel Money integration</p>
            </div>
            <div class="feature">
                <h3>🎓 Learning Management</h3>
                <p>Agricultural education and training modules</p>
            </div>
            <div class="feature">
                <h3>🗺️ GPS Mapping</h3>
                <p>Farm boundary tracking and spatial analytics</p>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>🌍 Supporting farmers across Africa with innovative technology</strong></p>
            <p style="margin-top: 15px;">
                <strong>Services:</strong> Redis (6379) | PostgreSQL (5432) | LDAP Authentication
            </p>
            <p style="margin-top: 10px;">
                Contact: <a href="mailto:contact@yourdomain.com">contact@yourdomain.com</a> | 
                Visit: <a href="https://yourdomain.com">yourdomain.com</a>
            </p>
        </div>
    </div>
</body>
</html>`);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Fataplus AgriTech Platform running on port ${PORT}`);
    console.log(`📍 Local URL: http://localhost:${PORT}`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
});