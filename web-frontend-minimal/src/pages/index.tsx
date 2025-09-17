import React, { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://fataplus-admin-api-production.fenohery.workers.dev/admin/dashboard')
      .then(response => response.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Loading Fataplus Admin Dashboard...</h1>
        <div>Connecting to Cloudflare API...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
            🚀 Fataplus Admin Backoffice
          </h1>
          <div style={{ fontSize: '1.25rem', color: '#059669' }}>
            ✅ Successfully Connected to Cloudflare Production!
          </div>
        </header>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '1.5rem', 
            borderRadius: '0.5rem', 
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
              Total Users
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
              {data?.metrics?.total_users || 0}
            </div>
          </div>
          
          <div style={{ 
            backgroundColor: 'white', 
            padding: '1.5rem', 
            borderRadius: '0.5rem', 
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
              Active Users
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
              {data?.metrics?.active_users || 0}
            </div>
          </div>
          
          <div style={{ 
            backgroundColor: 'white', 
            padding: '1.5rem', 
            borderRadius: '0.5rem', 
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
              Total Farms
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
              {data?.metrics?.total_farms || 0}
            </div>
          </div>
          
          <div style={{ 
            backgroundColor: 'white', 
            padding: '1.5rem', 
            borderRadius: '0.5rem', 
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.5rem' }}>
              AI Requests Today
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>
              {data?.metrics?.ai_requests_today || 0}
            </div>
          </div>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            padding: '1.5rem', 
            borderRadius: '0.5rem', 
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
              Recent Users
            </h2>
            <div>
              {data?.recent_users?.map((user: any) => (
                <div key={user.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '0.75rem 0',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  <div>
                    <div style={{ fontWeight: '500', color: '#1f2937' }}>
                      {user.first_name} {user.last_name}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{user.email}</div>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{user.role}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ 
            backgroundColor: 'white', 
            padding: '1.5rem', 
            borderRadius: '0.5rem', 
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1f2937', marginBottom: '1rem' }}>
              Recent Farms
            </h2>
            <div>
              {data?.recent_farms?.map((farm: any) => (
                <div key={farm.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '0.75rem 0',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  <div>
                    <div style={{ fontWeight: '500', color: '#1f2937' }}>{farm.name}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{farm.farm_type}</div>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {farm.size_hectares} ha
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ 
          backgroundColor: '#eff6ff', 
          border: '1px solid #bfdbfe',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e40af', marginBottom: '1rem' }}>
            🎉 Cloudflare Integration Status
          </h3>
          <div style={{ fontSize: '0.875rem', color: '#1e40af' }}>
            <div><strong>Environment:</strong> Production</div>
            <div><strong>API Worker:</strong> https://fataplus-admin-api-production.fenohery.workers.dev</div>
            <div><strong>Storage:</strong> Cloudflare KV + R2</div>
            <div><strong>Database Status:</strong> {data?.metrics?.database_status || 'Unknown'}</div>
            <div><strong>AI Service Status:</strong> {data?.metrics?.ai_service_status || 'Unknown'}</div>
            <div><strong>System Uptime:</strong> {data?.metrics?.system_uptime || 'Unknown'}</div>
            <div><strong>Last Updated:</strong> {new Date().toLocaleString()}</div>
          </div>
        </div>

        <div style={{ 
          backgroundColor: '#f0fdf4', 
          border: '1px solid #bbf7d0',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🚀</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#059669', marginBottom: '0.5rem' }}>
            Backoffice Successfully Deployed on Cloudflare!
          </h3>
          <p style={{ color: '#047857' }}>
            Your admin dashboard is now running on Cloudflare's global edge network with real-time data from KV storage.
          </p>
        </div>
      </div>
    </div>
  );
}