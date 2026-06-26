module.exports = {
  apps: [{
    name: 'truxz',
    script: '.next/standalone/server.js',
    cwd: '/var/www/truxz',
    instances: 2,
    exec_mode: 'cluster',
    env: { NODE_ENV: 'production', PORT: 3333, HOSTNAME: '0.0.0.0' },
    max_memory_restart: '512M',
    error_file: '/var/www/truxz/logs/pm2-error.log',
    out_file:   '/var/www/truxz/logs/pm2-out.log',
    autorestart: true,
    watch: false,
  }]
}
