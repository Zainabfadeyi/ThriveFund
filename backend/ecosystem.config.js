module.exports = {
  apps: [
    {
      name: 'thrivefund-api',
      script: 'dist/server.js',
      cwd: '/home/ubuntu/ThriveFund/backend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',

      env_production: {
        NODE_ENV: 'production',
        PORT: 3002,
      },

      // Logging
      out_file: '/home/ubuntu/logs/thrivefund-out.log',
      error_file: '/home/ubuntu/logs/thrivefund-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
  ],
};
