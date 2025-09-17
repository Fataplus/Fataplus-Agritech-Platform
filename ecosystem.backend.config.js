module.exports = {
  apps: [
    {
      name: 'fataplus-backend',
      cwd: './web-backend/src',
      script: 'main_demo.py',
      interpreter: 'python3',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PYTHONPATH: '/home/user/webapp/web-backend/src',
        MOTIA_SERVICE_URL: 'http://localhost:8001'
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true
    }
  ]
};