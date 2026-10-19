import './style.css';
import 'preline/preline';
import anime, { animateViewEntrance } from './utils/animations.js';
import { renderNavbar } from './components/navbar.js';
import { renderFooter } from './components/footer.js';
import { renderHomeView } from './views/home.js';
import { renderCatalogView } from './views/catalog.js';
import { renderClientDashboard } from './views/client-dashboard.js';
import { renderProviderDashboard } from './views/provider-dashboard.js';
import { renderAdminDashboard } from './views/admin-dashboard.js';
import { renderProductPageView } from './views/product-detail.js';
import { renderAboutView } from './views/about.js';
import error404Img from './assets/error-404.png';
import showToast from './components/toast.js';
import { initImageCacheShield } from './utils/image-cache.js';
import auth from './auth/state.js';

// Expose anime globally for custom scripts, devtools, and view modules
window.anime = anime;

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
  '#/': renderHomeView,
  '#/home': renderHomeView,
  '#/catalog': renderCatalogView,
  '#/about': renderAboutView,
  '#/how-it-works': async () => {
    await renderAboutView();
    setTimeout(() => {
      document.getElementById('how-it-works-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  },
  '#/como-funciona': async () => {
    await renderAboutView();
    setTimeout(() => {
      document.getElementById('how-it-works-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  },
  '#/client': renderClientDashboard,
  '#/provider': renderProviderDashboard,
  '#/admin': renderAdminDashboard,
  '#/404': render404View,
};

let currentNavId = 0;

async function router() {
  const navId = ++currentNavId;
  const hash = window.location.hash || '#/';
  const cleanRoute = hash.split('?')[0];

  // Section anchor redirection for how-it-works
  if (cleanRoute === '#how-it-works-section' || cleanRoute === '#/how-it-works-section') {
    window.location.hash = '#/about';
    setTimeout(() => {
      document.getElementById('how-it-works-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
    return;
  }
  
  // Providers cannot browse catalog or book equipment
  if (cleanRoute === '#/catalog' && auth.isAuthenticated() && auth.isProvider() && !auth.isAdmin()) {
    showToast('Los proveedores no tienen acceso al catálogo comercial. Redirigiendo a tu panel.', 'info');
    window.location.hash = '#/provider';
    return;
  }
  
  // Handle dynamic product detail route: #/product/:id
  if (cleanRoute.startsWith('#/product/')) {
    const parts = cleanRoute.split('/');
    const rawId = parts[2];
    const toolId = rawId && !isNaN(Number(rawId)) ? Number(rawId) : rawId;
    renderNavbar('catalog');
    renderFooter();
    await renderProductPageView(toolId);
    if (navId === currentNavId) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      animateViewEntrance('#app-content');
      setTimeout(() => window.HSStaticMethods?.autoInit(), 50);
    }
    return;
  }

  // 404 Handler for unknown routes
  if (hash && hash !== '#/' && !(cleanRoute in routes) && !cleanRoute.startsWith('#/product/')) {
    render404View();
    renderFooter();
    if (navId === currentNavId) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      animateViewEntrance('#app-content');
    }
    return;
  }

  const routeKey = cleanRoute in routes ? cleanRoute : '#/';
  
  const activeRouteName = (routeKey === '#/' || routeKey === '#/home') ? 'home' : routeKey.replace('#/', '');
  renderNavbar(activeRouteName);
  renderFooter();

  const viewHandler = routes[routeKey] || renderHomeView;
  await viewHandler();

  // If user navigated away while view was fetching/rendering, discard stale animation
  if (navId !== currentNavId) return;

  window.scrollTo({ top: 0, behavior: 'instant' });
  animateViewEntrance('#app-content');
  setTimeout(() => window.HSStaticMethods?.autoInit(), 50);
}

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
  initImageCacheShield();
  renderFooter();
  router();

  window.addEventListener('hashchange', router);

  // Reactive updates on authentication events
  window.addEventListener('auth:change', () => {
    renderFooter();
    router();
  });

  window.addEventListener('auth:expired', () => {
    showToast('Tu sesión ha finalizado. Por favor ingresa de nuevo.', 'warning');
    window.location.hash = '#/catalog';
  });

  // Global enhancer: Suppress ugly native browser history dropdown popups on search/filter inputs
  document.addEventListener('focusin', (e) => {
    const target = e.target;
    if (target && target.tagName === 'INPUT') {
      const isSearchOrFilter = target.type === 'search' || 
        /search|filter|buscar|query|q/i.test(target.id || target.name || target.className || target.placeholder);
      if (isSearchOrFilter && !target.hasAttribute('autocomplete')) {
        target.setAttribute('autocomplete', 'off');
        target.setAttribute('autocorrect', 'off');
        target.setAttribute('autocapitalize', 'off');
        target.setAttribute('spellcheck', 'false');
      }
    }
  }, true);
});

