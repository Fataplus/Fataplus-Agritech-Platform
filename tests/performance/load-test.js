import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

export let options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 50 },  // Ramp up to 50 users
    { duration: '1m', target: 50 },   // Stay at 50 users
    { duration: '30s', target: 100 }, // Ramp up to 100 users
    { duration: '1m', target: 100 },  // Stay at 100 users
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% of requests can fail
    errors: ['rate<0.01'],            // Custom error rate threshold
  },
};

const BASE_URL = 'https://api.fata.plus';

export default function () {
  // Test health endpoint
  let healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
    'health response time < 200ms': (r) => r.timings.duration < 200,
  });
  errorRate.add(healthRes.status !== 200);

  // Test root endpoint
  let rootRes = http.get(`${BASE_URL}/`);
  check(rootRes, {
    'root status is 200': (r) => r.status === 200,
    'root has version': (r) => r.json().version !== undefined,
  });
  errorRate.add(rootRes.status !== 200);

  // Test security endpoint
  let securityRes = http.get(`${BASE_URL}/security/health`);
  check(securityRes, {
    'security status is 200': (r) => r.status === 200,
    'security response time < 300ms': (r) => r.timings.duration < 300,
  });
  errorRate.add(securityRes.status !== 200);

  // Test authentication endpoint (simulate failed login)
  let authRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: 'test@example.com',
    password: 'wrongpassword'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(authRes, {
    'auth returns 401 for wrong password': (r) => r.status === 401,
  });
  errorRate.add(authRes.status !== 401);

  sleep(1);
}

export function handleSummary(data) {
  return {
    'stdout': JSON.stringify(data),
    'performance-summary.json': JSON.stringify(data, null, 2),
  };
}