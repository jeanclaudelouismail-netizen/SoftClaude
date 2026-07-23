// Gestion de l'authentification
class AuthManager {
  constructor() {
    this.user = null;
    this.session = null;
  }

  async init() {
    try {
      await supabaseClient.init();
      const client = supabaseClient.getClient();

      // Vérifier la session actuelle
      const { data: { session } } = await client.auth.getSession();
      this.session = session;
      this.user = session?.user ?? null;

      // Écouter les changements d'auth
      client.auth.onAuthStateChange((event, session) => {
        this.session = session;
        this.user = session?.user ?? null;
        console.log('Auth state changed:', event, this.user);
      });

      return this.user;
    } catch (error) {
      console.error('Erreur init auth:', error);
      return null;
    }
  }

  async signIn(email, password) {
    try {
      const client = supabaseClient.getClient();
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      this.user = data.user;
      this.session = data.session;
      return data;
    } catch (error) {
      console.error('Erreur sign in:', error);
      throw error;
    }
  }

  async signUp(email, password) {
    try {
      const client = supabaseClient.getClient();
      const { data, error } = await client.auth.signUp({
        email,
        password
      });

      if (error) throw error;
      this.user = data.user;
      this.session = data.session;
      return data;
    } catch (error) {
      console.error('Erreur sign up:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      const client = supabaseClient.getClient();
      const { error } = await client.auth.signOut();
      if (error) throw error;
      this.user = null;
      this.session = null;
    } catch (error) {
      console.error('Erreur sign out:', error);
      throw error;
    }
  }

  async signInWithGoogle() {
    try {
      const client = supabaseClient.getClient();
      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur Google sign in:', error);
      throw error;
    }
  }

  isAuthenticated() {
    return !!this.user;
  }

  getUser() {
    return this.user;
  }
}

// Instance globale
const authManager = new AuthManager();
