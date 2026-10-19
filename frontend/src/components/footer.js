import { renderToolRentMark } from '../utils/icons.js';
import { openAuthModal } from './auth-modal.js';
import auth from '../auth/state.js';
import showToast from './toast.js';

export function renderFooter() {
  const container = document.getElementById('footer-container');
  if (!container) return;

  const isAuth = auth.isAuthenticated();
  const user = isAuth ? auth.getUser() : null;
  const isAdmin = isAuth && auth.isAdmin();
  const isProvider = isAuth && auth.isProvider();
  const isClient = isAuth && auth.isClient();

  const userName = user?.nombre || user?.username || (isAdmin ? 'Administrador' : isProvider ? 'Proveedor' : 'Cliente');
  const dashboardRoute = isAdmin ? '#/admin' : (isProvider ? '#/provider' : '#/client');
  const dashboardLabel = isAdmin ? 'Panel de Administración' : (isProvider ? 'Panel de Proveedor' : 'Mis reservas y alquileres');

  // Column 1 CTA depending on session
  let providerCtaHtml = '';
  if (!isAuth) {
    providerCtaHtml = `
      <div class="pt-1.5">
        <button 
          id="btn-footer-provider-register" 
          type="button" 
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-[#ea580c] hover:bg-orange-100 text-xs font-semibold transition-colors cursor-pointer"
        >
          <span>¿Tienes equipos para alquilar? Publica como Proveedor</span>
          <span aria-hidden="true">&rarr;</span>
        </button>
      </div>
    `;
  } else if (isProvider) {
    const isAlreadyOnProvider = window.location.hash.startsWith('#/provider');
    providerCtaHtml = isAlreadyOnProvider ? `
      <div class="pt-1.5">
        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-[#ea580c] text-xs font-semibold border border-orange-200/80">
          <span class="w-2 h-2 rounded-full bg-[#ea580c] animate-pulse"></span>
          <span>Panel de Proveedor activo</span>
        </span>
      </div>
    ` : `
      <div class="pt-1.5">
        <a 
          href="#/provider" 
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-[#ea580c] hover:bg-orange-100 text-xs font-semibold transition-colors cursor-pointer"
        >
          <span>Ir a mi Panel de Proveedor</span>
          <span aria-hidden="true">&rarr;</span>
        </a>
      </div>
    `;
  } else if (isAdmin) {
    const isAlreadyOnAdmin = window.location.hash.startsWith('#/admin');
    providerCtaHtml = isAlreadyOnAdmin ? `
      <div class="pt-1.5">
        <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 text-xs font-semibold border border-amber-200/80">
          <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span>Consola de Administración activa</span>
        </span>
      </div>
    ` : `
      <div class="pt-1.5">
        <a 
          href="#/admin" 
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 hover:bg-amber-100 text-xs font-semibold border border-amber-200/80 transition-colors cursor-pointer"
        >
          <span>Ir a la Consola de Administración</span>
          <span aria-hidden="true">&rarr;</span>
        </a>
      </div>
    `;
  } else {
    providerCtaHtml = `
      <div class="pt-1.5">
        <button 
          id="btn-footer-provider-register" 
          type="button" 
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-[#ea580c] hover:bg-orange-100 text-xs font-semibold transition-colors cursor-pointer"
        >
          <span>¿Tienes equipos para alquilar? Conoce cómo ser Proveedor</span>
          <span aria-hidden="true">&rarr;</span>
        </button>
      </div>
    `;
  }

  // Column 2 Navigation Links depending on session
  let navLinksHtml = `
    <li>
      <a href="#/about" class="text-slate-600 hover:text-[#ea580c] transition-colors">
        Sobre nosotros
      </a>
    </li>
  `;

  if (!isProvider) {
    navLinksHtml += `
      <li>
        <a href="#/catalog" class="text-slate-600 hover:text-[#ea580c] transition-colors">
          Explorar catálogo de equipos
        </a>
      </li>
    `;
  }

  if (isAuth) {
    navLinksHtml += `
      <li>
        <a href="${dashboardRoute}" class="text-slate-600 hover:text-[#ea580c] transition-colors font-medium">
          ${dashboardLabel}
        </a>
      </li>
      <li class="pt-2 border-t border-slate-100 mt-2">
        <div class="flex items-center gap-2 text-[11px] text-slate-500 py-1 px-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
          <span class="truncate">Sesión: <strong class="text-slate-800 font-semibold">${userName}</strong></span>
        </div>
      </li>
      <li>
        <button id="btn-footer-logout" type="button" class="text-rose-600 hover:text-rose-700 font-semibold transition-colors cursor-pointer text-left flex items-center gap-1.5 text-xs py-0.5">
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
          <span>Cerrar sesión activa</span>
        </button>
      </li>
    `;
  } else {
    navLinksHtml += `
      <li>
        <button id="btn-footer-login" type="button" class="text-slate-600 hover:text-[#ea580c] transition-colors cursor-pointer text-left">
          Iniciar sesión
        </button>
      </li>
      <li>
        <button id="btn-footer-register" type="button" class="text-slate-600 hover:text-[#ea580c] transition-colors cursor-pointer text-left">
          Crear cuenta de usuario
        </button>
      </li>
    `;
  }

  container.innerHTML = `
    <footer class="border-t border-slate-200/80 bg-white text-slate-600 py-10 mt-auto select-none">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          
          <!-- Column 1: Identidad y llamada a proveedores (5 cols) -->
          <div class="lg:col-span-5 space-y-3">
            <div class="flex items-center gap-2.5">
              ${renderToolRentMark('w-7 h-7', '#ea580c')}
              <span class="font-display font-extrabold text-lg text-slate-900 tracking-tight">ToolRent</span>
            </div>
            
            <p class="text-xs text-slate-500 leading-relaxed max-w-sm">
              Plataforma para la reserva, alquiler y gestión de maquinaria pesada y herramientas de construcción.
            </p>

            ${providerCtaHtml}
          </div>

          <!-- Column 2: Navegación Funcional (3 cols) -->
          <div class="lg:col-span-3 space-y-2.5">
            <h4 class="text-[11px] font-bold uppercase tracking-wider text-slate-900 font-display">Plataforma</h4>
            <ul class="space-y-2 text-xs">
              ${navLinksHtml}
            </ul>
          </div>

          <!-- Column 3: Categorías Rápidas del Catálogo (4 cols) -->
          <div class="lg:col-span-4 space-y-2.5">
            <h4 class="text-[11px] font-bold uppercase tracking-wider text-slate-900 font-display">Categorías de equipos</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <a href="#/catalog?q=excavadora" class="text-slate-600 hover:text-[#ea580c] transition-colors">Movimiento de tierra</a>
              <a href="#/catalog?q=concreto" class="text-slate-600 hover:text-[#ea580c] transition-colors">Hormigón y concreto</a>
              <a href="#/catalog?q=eléctrica" class="text-slate-600 hover:text-[#ea580c] transition-colors">Herramientas eléctricas</a>
              <a href="#/catalog?q=elevación" class="text-slate-600 hover:text-[#ea580c] transition-colors">Elevación y andamios</a>
              <a href="#/catalog?q=compactadora" class="text-slate-600 hover:text-[#ea580c] transition-colors">Compactación de suelos</a>
              <a href="#/catalog?q=generador" class="text-slate-600 hover:text-[#ea580c] transition-colors">Generación de energía</a>
            </div>
          </div>

        </div>

        <!-- Línea Inferior Simplificada -->
        <div class="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© 2026 ToolRent. Plataforma de Renta de Herramientas y Equipos.</p>
          <div class="flex items-center gap-4 text-xs text-slate-500">
            ${isProvider ? '' : '<a href="#/catalog" class="hover:text-slate-700 transition-colors">Catálogo</a><span>·</span>'}
            <button id="btn-footer-provider-link" type="button" class="hover:text-slate-700 transition-colors cursor-pointer">Proveedores</button>
            <span>·</span>
            <a href="${isAuth ? dashboardRoute : '#/client'}" class="hover:text-slate-700 transition-colors">${isAuth ? 'Mi panel' : 'Mi cuenta'}</a>
          </div>
        </div>

      </div>
    </footer>
  `;

  // Listeners funcionales
  if (!isAuth) {
    container.querySelector('#btn-footer-provider-register')?.addEventListener('click', () => {
      openAuthModal('register', 'ROLE_PROVEEDOR');
    });

    container.querySelector('#btn-footer-login')?.addEventListener('click', () => {
      openAuthModal('login');
    });

    container.querySelector('#btn-footer-register')?.addEventListener('click', () => {
      openAuthModal('register', 'ROLE_CLIENTE');
    });
  } else {
    container.querySelector('#btn-footer-provider-register')?.addEventListener('click', () => {
      showToast('Ya tienes una sesión activa como Cliente. Cierra sesión si deseas registrarte como Proveedor.', 'info');
    });

    container.querySelector('#btn-footer-logout')?.addEventListener('click', () => {
      auth.logout();
      showToast('Has cerrado sesión correctamente.', 'info');
      window.location.hash = '#/catalog';
    });
  }

  container.querySelector('#btn-footer-provider-link')?.addEventListener('click', () => {
    if (isProvider) {
      window.location.hash = '#/provider';
    } else if (isAdmin) {
      window.location.hash = '#/admin';
    } else if (isClient) {
      showToast('Ya tienes una sesión activa como Cliente. Cierra sesión si deseas acceder al portal de Proveedores.', 'info');
    } else {
      openAuthModal('register', 'ROLE_PROVEEDOR');
    }
  });
}

export default renderFooter;
