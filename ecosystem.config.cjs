module.exports = {
  apps: [
    {
      name: 'budget-app',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        DATABASE_URL: 'mysql://budget_user:YOUR_PASSWORD@localhost:3306/budget_app',
        SESSION_SECRET: 'your-session-secret-here',
        ENCRYPTION_KEY: 'your-64-character-hex-encryption-key',
        GOOGLE_CLIENT_ID: 'your-google-client-id.apps.googleusercontent.com',
        GOOGLE_CLIENT_SECRET: 'your-google-client-secret',
        APP_URL: 'https://your-domain.com',
        STRIPE_PUBLIC_KEY: 'pk_live_your_stripe_public_key',
        STRIPE_SECRET_KEY: 'sk_live_your_stripe_secret_key',
        VITE_STRIPE_PUBLIC_KEY: 'pk_live_your_stripe_public_key',
      },
    },
  ],
};
