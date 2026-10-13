import './style.css';
import 'preline/preline';
import { renderNavbar } from './components/navbar.js';
import { renderFooter } from './components/footer.js';
import { renderCatalogView } from './views/catalog.js';
import { renderClientDashboard } from './views/client-dashboard.js';
import { renderProviderDashboard } from './views/provider-dashboard.js';
import { renderAdminDashboard } from './views/admin-dashboard.js';
import { renderProductPageView } from './views/product-detail.js';
import error404Img from './assets/error-404.png';
import showToast from './components/toast.js';
import { renderAllSystemStatesShowcase } from './components/system-states.js';
import { initImageCacheShield } from './utils/image-cache.js';
import { curatedCatalogImageUrls } from './api/mock-store.js';

export function render404View() {
  renderNavbar('catalog');
  const container = document.getElementById('app-content');
  if (!container) return;

  container.innerHTML = `
    <section class="min-h-[85vh] bg-[#f8fafc] flex flex-col items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
      <div class="max-w-5xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 relative select-none">
        <img 
          src="${error404Img}" 
          alt="Error 404 - Página no encontrada" 
          class="w-full h-auto object-cover select-none block" 
        />
        
        <!-- Hotspot over 'Volver al inicio' button in image -->
        <a 
          href="#/catalog" 
          class="absolute cursor-pointer rounded-xl transition-all hover:bg-white/10 active:scale-95" 
          style="left: 5.6%; top: 64.6%; width: 22.5%; height: 7.2%;" 
          title="Volver al inicio"
          aria-label="Volver al inicio"
        ></a>

        <!-- Hotspot over 'Ir a la página anterior' in image -->
        <button 
          id="btn-404-history-back" 
          type="button"
          class="absolute cursor-pointer rounded-lg transition-all hover:bg-white/10 active:scale-95 text-transparent" 
          style="left: 5.6%; top: 73.8%; width: 17%; height: 4.2%;" 
          title="Ir a la página anterior"
          aria-label="Ir a la página anterior"
        ></button>
      </div>

      <!-- Mobile friendly buttons bar for small screens -->
      <div class="sm:hidden flex items-center justify-center gap-3 mt-4 w-full max-w-sm">
        <a href="#/catalog" class="btn-primary flex-1 !py-2.5 text-xs text-center font-bold">
          Volver al inicio &rarr;
        </a>
        <button id="btn-404-mobile-back" class="btn-secondary flex-1 !py-2.5 text-xs font-semibold">
          &larr; Página anterior
        </button>
      </div>
    </section>
  `;

  container.querySelectorAll('#btn-404-history-back, #btn-404-mobile-back').forEach(btn => {
    btn.addEventListener('click', () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.hash = '#/catalog';
      }
    });
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Router mapping
const routes = {
  '#/catalog': renderCatalogView,
  '#/client': renderClientDashboard,
  '#/provider': renderProviderDashboard,
  '#/admin': renderAdminDashboard,
  '#/404': render404View,
  '#/system-states': renderAllSystemStatesShowcase,
  '#/states': renderAllSystemStatesShowcase,
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
    setTimeout(() => window.HSStaticMethods?.autoInit(), 50);
    return;
  }

  // 404 Handler for unknown routes
  if (hash && !(cleanRoute in routes) && !cleanRoute.startsWith('#/product/')) {
    render404View();
    return;
  }

  const routeKey = cleanRoute in routes ? cleanRoute : '#/catalog';
  
  const activeRouteName = routeKey.replace('#/', '');
  renderNavbar(activeRouteName);

  const viewHandler = routes[routeKey] || renderCatalogView;
  viewHandler();

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => window.HSStaticMethods?.autoInit(), 50);
}

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
  initImageCacheShield(curatedCatalogImageUrls);
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
