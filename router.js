// Router pour la navigation SPA
class Router {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
  }

  // Enregistrer une route
  register(path, handler) {
    this.routes[path] = handler;
  }

  // Naviguer vers une route
  async navigate(path) {
    if (this.routes[path]) {
      this.currentRoute = path;
      await this.routes[path]();
      this.updateURL(path);
    } else {
      console.error(`Route non trouvée: ${path}`);
    }
  }

  // Mettre à jour l'URL sans recharger
  updateURL(path) {
    history.pushState({ path }, '', `#${path}`);
  }

  // Gérer les événements de navigation
  init() {
    // Gérer le bouton retour
    window.addEventListener('popstate', (event) => {
      if (event.state && event.state.path) {
        this.navigate(event.state.path);
      }
    });

    // Gérer l'URL initiale
    const initialPath = this.getPathFromURL();
    if (initialPath && this.routes[initialPath]) {
      this.navigate(initialPath);
    }
  }

  getPathFromURL() {
    const hash = window.location.hash.slice(1);
    return hash || 'home';
  }
}

// Instance globale
const router = new Router();
