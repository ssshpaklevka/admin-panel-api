module.exports = {
    apps: [{
      name: 'media-player',
      script: 'npm',
      args: 'run start --port 3004',
      interpreter: '/home/front/.nvm/versions/node/v20.20.0/bin/node',
      cwd: '/home/front/media-player', // ОБНОВИТЬ НА СЕРВЕРЕ - путь к проекту
      env: {
        NODE_ENV: 'production',
        PORT: 3004
      },
      instances: 1,
      autorestart: true,
      watch: false
    }]
  }