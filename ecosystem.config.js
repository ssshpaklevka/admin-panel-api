module.exports = {
    apps: [{
      name: 'media-player',
      script: 'bun',
      args: 'run start --port 3004',
      interpreter: '/home/front/.nvm/versions/node/v20.11.0/bin/node', // ОБНОВИТЬ НА СЕРВЕРЕ
      cwd: '/home/front/path/to/your/project', // ОБНОВИТЬ НА СЕРВЕРЕ - путь к проекту
      env: {
        NODE_ENV: 'production',
        PORT: 3004
      },
      instances: 1,
      autorestart: true,
      watch: false
    }]
  }