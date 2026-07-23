// Configuration de l'application
const CONFIG = {
  // Supabase Configuration (à remplir avec vos clés)
  supabase: {
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'sb_publishable_q0Z_7FG0zEVsyNdt3xwuIw__hrLxdHC'
  },

  // Google OAuth Configuration
  google: {
    clientId: 'YOUR_GOOGLE_CLIENT_ID',
    scopes: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/gmail.readonly'
    ]
  },

  // Application Settings
  app: {
    name: 'SoftClaude',
    version: '2.0.0',
    debug: true
  }
};

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
