import './style.css';
import { renderNavbar } from './components/navbar.js';
import { renderFooter } from './components/footer.js';
import { renderCatalogView } from './views/catalog.js';
import { renderClientDashboard } from './views/client-dashboard.js';
import { renderProviderDashboard } from './views/provider-dashboard.js';
import { renderAdminDashboard } from './views/admin-dashboard.js';
import { renderProductPageView } from './views/product-detail.js';
import showToast from './components/toast.js';

// Router mapping
const routes = {
  '#/catalog': renderCatalogView,
  '#/client': renderClientDashboard,
  '#/provider': renderProviderDashboard,
  '#/admin': renderAdminDashboard,
};

function router() {
  const hash = window.location.hash || '#/catalog';
  const cleanRoute = hash.split('?')[0];
  
  // Handle dynamic product detail route: #/product/:id
  if (cleanRoute.startsWith('#/product/')) {
    const parts = cleanRoute.split('/');
    const rawId = parts[2];
    const toolId = rawId && !isNaN(Number(rawId)) ? Number(rawId) : rawId;
    renderNavbar('catalog');
    renderProductPageView(toolId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  const routeKey = cleanRoute in routes ? cleanRoute : '#/catalog';
  
  const activeRouteName = routeKey.replace('#/', '');
  renderNavbar(activeRouteName);

  const viewHandler = routes[routeKey] || renderCatalogView;
  viewHandler();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
  renderFooter();
  router();

  window.addEventListener('hashchange', router);

  // Reactive updates on authentication events
  window.addEventListener('auth:change', () => {
    router();
  });

  window.addEventListener('auth:expired', () => {
    showToast('Tu sesión ha finalizado. Por favor ingresa de nuevo.', 'warning');
    window.location.hash = '#/catalog';
  });
});
