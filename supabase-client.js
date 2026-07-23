// Client Supabase
class SupabaseClient {
  constructor() {
    this.client = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return this.client;

    try {
      // Charger le SDK Supabase depuis CDN
      if (typeof supabase === 'undefined') {
        await this.loadSupabaseSDK();
      }

      this.client = supabase.createClient(
        CONFIG.supabase.url,
        CONFIG.supabase.anonKey
      );
      
      this.initialized = true;
      console.log('Supabase client initialisé');
      return this.client;
    } catch (error) {
      console.error('Erreur initialisation Supabase:', error);
      throw error;
    }
  }

  async loadSupabaseSDK() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  getClient() {
    if (!this.initialized) {
      throw new Error('Supabase client non initialisé. Appelez init() d\'abord.');
    }
    return this.client;
  }

  // Méthodes helpers pour les opérations courantes
  async select(table, columns = '*', filters = {}) {
    const client = this.getClient();
    let query = client.from(table).select(columns);

    if (filters.eq) {
      Object.entries(filters.eq).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    if (filters.order) {
      query = query.order(filters.order.column, { 
        ascending: filters.order.ascending ?? true 
      });
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async insert(table, data) {
    const client = this.getClient();
    const { data: result, error } = await client.from(table).insert(data).select();
    if (error) throw error;
    return result;
  }

  async update(table, data, filters) {
    const client = this.getClient();
    let query = client.from(table).update(data);

    if (filters.eq) {
      Object.entries(filters.eq).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    const { data: result, error } = await query.select();
    if (error) throw error;
    return result;
  }

  async delete(table, filters) {
    const client = this.getClient();
    let query = client.from(table).delete();

    if (filters.eq) {
      Object.entries(filters.eq).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    const { error } = await query;
    if (error) throw error;
    return true;
  }
}

// Instance globale
const supabaseClient = new SupabaseClient();
