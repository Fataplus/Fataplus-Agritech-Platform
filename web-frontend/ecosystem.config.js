module.exports = {
  apps: [{
    name: 'fataplus-frontend',
    script: 'npm',
    args: 'run dev',
    cwd: '/home/user/webapp/web-frontend',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },
    watch: false,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
