// Application principale
class App {
  constructor() {
    this.debugMode = false;
  }

  async init() {
    console.log('Initialisation de SoftClaude v' + CONFIG.app.version);

    // Initialiser Supabase
    try {
      await supabaseClient.init();
    } catch (error) {
      console.error('Erreur initialisation Supabase:', error);
      // Continuer sans Supabase pour le mode développement
    }

    // Initialiser l'auth
    try {
      await authManager.init();
    } catch (error) {
      console.error('Erreur initialisation auth:', error);
    }

    // Initialiser le router
    this.setupRoutes();
    router.init();

    // Initialiser l'UI
    this.setupUI();
    this.loadTheme();

    // Charger la page par défaut
    await router.navigate('home');
  }

  setupRoutes() {
    // Page d'accueil
    router.register('home', async () => {
      await this.loadPage('home');
    });

    // Communication
    router.register('communication', async () => {
      await this.loadPage('communication');
    });

    router.register('contact', async () => {
      await this.loadPage('contact');
    });

    router.register('mail', async () => {
      await this.loadPage('mail');
    });

    // Gestion
    router.register('finance', async () => {
      await this.loadPage('finance');
    });

    router.register('agenda', async () => {
      await this.loadPage('agenda');
    });

    // Média
    router.register('video', async () => {
      await this.loadPage('video');
    });

    router.register('musique', async () => {
      await this.loadPage('musique');
    });

    // Autres
    router.register('ia', async () => {
      await this.loadPage('ia');
    });

    router.register('store', async () => {
      await this.loadPage('store');
    });

    router.register('siphon', async () => {
      await this.loadPage('siphon');
    });

    router.register('recherche-emploi', async () => {
      await this.loadPage('recherche-emploi');
    });

    router.register('parametres', async () => {
      await this.loadPage('parametres');
    });
  }

  async loadPage(pageName) {
    const content = document.getElementById('page-content');
    content.innerHTML = '<div class="loading"></div>';

    try {
      const response = await fetch(`pages/${pageName}.html`);
      if (!response.ok) throw new Error(`Page ${pageName} non trouvée`);
      
      const html = await response.text();
      content.innerHTML = html;

      // Charger le script spécifique à la page s'il existe
      await this.loadPageScript(pageName);
      
      this.logDebug(`Page chargée: ${pageName}`);
    } catch (error) {
      console.error(`Erreur chargement page ${pageName}:`, error);
      content.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <h2>Erreur</h2>
          <p>Impossible de charger la page "${pageName}"</p>
          <button class="btn-oval" onclick="router.navigate('home')">Retour à l'accueil</button>
        </div>
      `;
    }
  }

  async loadPageScript(pageName) {
    try {
      const response = await fetch(`js/pages/${pageName}.js`);
      if (!response.ok) return; // Pas de script pour cette page
      
      const scriptContent = await response.text();
      const script = document.createElement('script');
      script.textContent = scriptContent;
      document.body.appendChild(script);
    } catch (error) {
      // Pas de script pour cette page, ce n'est pas une erreur
    }
  }

  setupUI() {
    // Toggle sidebar
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    menuToggle.addEventListener('click', () => {
      document.body.classList.toggle('sidebar-open');
    });

    sidebarOverlay.addEventListener('click', () => {
      document.body.classList.remove('sidebar-open');
    });

    // Navigation
    document.querySelectorAll('[data-page]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const page = el.getAttribute('data-page');
        document.body.classList.remove('sidebar-open');
        router.navigate(page);
      });
    });

    // Flyout menus
    document.querySelectorAll('.nav-group.flyout').forEach(group => {
      const link = group.querySelector('.nav-link-text');
      const chevron = group.querySelector('.chevron');

      const toggleFlyout = (e) => {
        e.stopPropagation();
        // Fermer les autres flyouts
        document.querySelectorAll('.nav-group.flyout.active').forEach(g => {
          if (g !== group) g.classList.remove('active');
        });
        group.classList.toggle('active');
      };

      link.addEventListener('click', toggleFlyout);
      chevron.addEventListener('click', toggleFlyout);
    });

    // Fermer les flyouts au clic ailleurs
    document.addEventListener('click', () => {
      document.querySelectorAll('.nav-group.flyout.active').forEach(g => {
        g.classList.remove('active');
      });
    });

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
      this.toggleTheme();
    });

    // Debug console
    const debugClose = document.getElementById('debug-close');
    debugClose.addEventListener('click', () => {
      this.setDebugMode(false);
    });

    // Logo click
    const logo = document.getElementById('top-bar-logo');
    const brandName = document.getElementById('brand-name');
    logo.addEventListener('click', () => router.navigate('home'));
    brandName.addEventListener('click', () => router.navigate('home'));
  }

  loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
    }
  }

  toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }

  setDebugMode(enabled) {
    this.debugMode = enabled;
    const console = document.getElementById('debug-console');
    console.style.display = enabled ? 'block' : 'none';
  }

  logDebug(message) {
    if (this.debugMode) {
      const logs = document.getElementById('debug-logs');
      const time = new Date().toLocaleTimeString();
      logs.innerHTML += `<div>[${time}] ${message}</div>`;
      logs.scrollTop = logs.scrollHeight;
    }
    console.log(message);
  }

  showHome() {
    router.navigate('home');
  }
}

// Fonctions globales pour les pages
window.toggleFullScreen = (elementId) => {
  const element = document.getElementById(elementId);
  if (!document.fullscreenElement) {
    element.requestFullscreen().catch(err => {
      console.error(`Erreur fullscreen: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
};

window.showHome = () => {
  window.app.showHome();
};

window.logDebug = (message) => {
  window.app.logDebug(message);
};

window.setDebugMode = (enabled) => {
  window.app.setDebugMode(enabled);
};

// Démarrer l'application
document.addEventListener('DOMContentLoaded', async () => {
  window.app = new App();
  await window.app.init();
});
