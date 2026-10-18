import auth from '../auth/state.js';
import api from '../api/client.js';
import { renderIcon, renderToolRentMark } from '../utils/icons.js';
import { openAuthModal } from './auth-modal.js';
import { toggleNotificationsMenu, closeNotificationsMenu } from './notifications-menu.js';
import { notificationsStore } from '../utils/notifications-store.js';
import anime from '../utils/animations.js';

// Cache for navbar DOM persistence across route changes
let lastNavbarUserId = Symbol('uninitialized');
let lastNavbarIsAuth = Symbol('uninitialized');
let lastNavbarRoles = Symbol('uninitialized');
let currentActiveRoute = null;


/**
 * Applies route-specific active indicators and Magic UI / Anime.js transitions
 */
function applyRouteVisuals(container, activeRoute, isInitial = false) {
  currentActiveRoute = activeRoute;

  // 1. Sliding Active Indicator for Floating Pill Menu
  const floatingNav = container.querySelector('#navbar-floating-pill');
  const activePill = container.querySelector('#nav-active-pill');

  if (floatingNav && activePill) {
    const allLinks = floatingNav.querySelectorAll('.nav-item');
    const targetLink = floatingNav.querySelector(`.nav-item[data-route="${activeRoute}"]`);

    allLinks.forEach((link) => {
      const isTarget = link === targetLink;
      const icon = link.querySelector('svg');
      if (isTarget) {
        link.className = 'nav-item relative z-10 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-bold text-white transition-colors duration-200 select-none cursor-pointer flex items-center gap-1.5';
        if (icon) {
          icon.classList.remove('text-slate-400');
          icon.classList.add('text-white');
        }
      } else {
        link.className = 'nav-item relative z-10 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-colors duration-200 select-none cursor-pointer flex items-center gap-1.5';
        if (icon) {
          icon.classList.remove('text-white');
          icon.classList.add('text-slate-400');
        }
      }
    });

    requestAnimationFrame(() => {
      if (!targetLink) {
        activePill.style.display = 'none';
        return;
      }

      activePill.style.display = 'block';
      const targetLeft = targetLink.offsetLeft;
      const targetWidth = targetLink.offsetWidth;

      if (targetWidth === 0) return;

      if (isInitial || activePill.style.opacity === '0' || !activePill.dataset.positioned) {
        activePill.style.left = `${targetLeft}px`;
        activePill.style.width = `${targetWidth}px`;
        activePill.style.opacity = '1';
        activePill.dataset.positioned = 'true';
        anime(activePill, {
          scale: [0.85, 1],
          opacity: [0, 1],
          duration: 350,
          ease: 'outBack'
        });
      } else {
        anime(activePill, {
          left: `${targetLeft}px`,
          width: `${targetWidth}px`,
          duration: 380,
          ease: 'outBack'
        });
      }
    });
  }

  // 3. User Dropdown Menu Active Highlighting
  const userDropdownNav = container.querySelector('#user-dropdown-nav-list');
  if (userDropdownNav) {
    userDropdownNav.querySelectorAll('a').forEach((link) => {
      const href = link.getAttribute('href') || '';
      const linkRoute = href.replace('#/', '');
      const isTarget = (linkRoute === activeRoute) || (activeRoute === 'home' && href === '#/');
      const icon = link.querySelector('svg');
      const dot = link.querySelector('.user-nav-dot');

      if (isTarget) {
        link.className = 'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200/70 shadow-2xs transition-all duration-150 group/item';
        if (icon) icon.setAttribute('class', 'w-4 h-4 text-orange-600');
        if (dot) dot.classList.remove('hidden');
      } else {
        link.className = 'flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 border border-transparent transition-all duration-150 group/item';
        if (icon) icon.setAttribute('class', 'w-4 h-4 text-zinc-400 group-hover/item:text-zinc-700');
        if (dot) dot.classList.add('hidden');
      }
    });
  }

  // 4. Mobile Drawer Route Styling & Mobile Search Visibility
  const mobileMenu = container.querySelector('#mobile-menu');
  if (mobileMenu) {
    mobileMenu.querySelectorAll('a').forEach((link) => {
      const href = link.getAttribute('href') || '';
      const linkRoute = href.replace('#/', '');
      const isTarget = (linkRoute === activeRoute) || (activeRoute === 'home' && href === '#/');

      if (isTarget) {
        link.className = 'flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-bold text-[#FF5A1F] bg-orange-50/80';
      } else {
        link.className = 'flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50';
      }
    });
  }

  // 5. Mobile Bottom Tab Bar Active Highlighting
  const bottomTabBar = container.querySelector('#mobile-bottom-tab-bar');
  if (bottomTabBar) {
    bottomTabBar.querySelectorAll('.bottom-tab-item').forEach((item) => {
      const itemRoute = item.getAttribute('data-bottom-route');
      const isTarget = itemRoute === activeRoute || (activeRoute === 'home' && itemRoute === 'home');
      const icon = item.querySelector('svg');
      const dot = item.querySelector('.bottom-active-dot');

      if (isTarget) {
        item.classList.add('text-[#ea580c]', 'font-bold');
        item.classList.remove('text-slate-500', 'font-medium');
        if (icon) {
          icon.classList.add('text-[#ea580c]');
          icon.classList.remove('text-slate-400');
        }
        if (dot) dot.classList.remove('hidden');
      } else {
        item.classList.remove('text-[#ea580c]', 'font-bold');
        item.classList.add('text-slate-500', 'font-medium');
        if (icon) {
          icon.classList.remove('text-[#ea580c]');
          icon.classList.add('text-slate-400');
        }
        if (dot) dot.classList.add('hidden');
      }
    });
  }
}

export function renderNavbar(activeRoute = 'catalog') {
  const container = document.getElementById('navbar-container');
  if (!container) return;

  const user = auth.getUser();
  const isAuth = auth.isAuthenticated();
  const isAdmin = auth.isAdmin();
  const isProvider = auth.isProvider();
  const isClient = auth.isClient();
  const unreadCount = isAuth ? notificationsStore.getUnreadCount() : 0;

  const currentUserId = user?.id || user?.username || null;
  const currentIsAuth = isAuth;
  const currentRoles = (user?.roles || []).join(',');

  // Check if existing navbar DOM can be preserved without tearing down
  const existingHeader = container.querySelector('header');
  const needsFullRebuild = !existingHeader ||
    lastNavbarUserId !== currentUserId ||
    lastNavbarIsAuth !== currentIsAuth ||
    lastNavbarRoles !== currentRoles;

  if (!needsFullRebuild) {
    applyRouteVisuals(container, activeRoute, false);
    return;
  }

  // Update cached auth state
  lastNavbarUserId = currentUserId;
  lastNavbarIsAuth = currentIsAuth;
  lastNavbarRoles = currentRoles;

  const userInitials = user?.username ? user.username.substring(0, 2).toUpperCase() : 'US';
  const roleTitle = isAdmin ? 'Administrador' : (isProvider ? 'Proveedor' : 'Cliente');
  
  const roleBadgeHtml = isAdmin 
    ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">${renderIcon('ShieldCheck', 'w-3 h-3')} Administrador</span>`
    : (isProvider 
        ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">${renderIcon('Building2', 'w-3 h-3')} Proveedor Aliado</span>`
        : `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">${renderIcon('CheckCircle2', 'w-3 h-3')} Cliente Verificado</span>`);

  const oldSidebar = document.getElementById('admin-sidebar-container');
  if (oldSidebar) oldSidebar.remove();

  container.innerHTML = `
    <header class="bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-40 shadow-xs transition-all">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-20 py-3 gap-2 sm:gap-4 lg:gap-6 min-w-0">
          
          <!-- 1. Left: Logo & Brand Mark -->
          <a href="#/" class="flex items-center gap-2.5 sm:gap-3 group select-none flex-shrink-0" title="ToolRent - Inicio">
            ${renderToolRentMark('w-8 h-8 sm:w-9 sm:h-9 transition-transform duration-200 group-hover:scale-105', '#FF5A1F')}
            <span class="text-xl sm:text-2xl font-black font-display tracking-tight text-slate-900 leading-none">
              ToolRent
            </span>
          </a>

          <!-- 2. Center: Floating Nav Pill (Natural flex-centered with spring layout adaptation) -->
          <div id="navbar-center-container" class="hidden md:flex items-center justify-center flex-shrink-0 transition-transform duration-300">
            <nav id="navbar-floating-pill" class="relative flex items-center gap-0.5 sm:gap-1 p-1 bg-slate-100/90 backdrop-blur-md rounded-full border border-slate-200/80 shadow-xs">
              
              <!-- Magic UI Sliding Active Pill Background -->
              <div 
                id="nav-active-pill" 
                class="absolute bg-[#ea580c] rounded-full shadow-xs pointer-events-none transition-none" 
                style="top: 4px; bottom: 4px; left: 0px; width: 0px; opacity: 0;"
              ></div>

              <!-- Inicio -->
              <a 
                href="#/" 
                data-route="home" 
                class="nav-item relative z-10 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors select-none cursor-pointer"
              >
                Inicio
              </a>

              <!-- Sobre Nosotros -->
              <a 
                href="#/about" 
                data-route="about" 
                class="nav-item relative z-10 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors select-none cursor-pointer"
              >
                Sobre Nosotros
              </a>

              ${!(isAuth && isProvider && !isAdmin) ? `
                <!-- Catálogo de Equipos -->
                <a 
                  href="#/catalog" 
                  data-route="catalog" 
                  class="nav-item relative z-10 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors select-none cursor-pointer"
                >
                  Catálogo
                </a>
              ` : ''}

              ${isAuth && (isProvider || isAdmin) ? `
                <!-- Panel Proveedor -->
                <a 
                  href="#/provider" 
                  data-route="provider" 
                  class="nav-item relative z-10 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5 select-none cursor-pointer"
                >
                  ${renderIcon('Building2', 'w-3.5 h-3.5 text-slate-400')}
                  <span>Proveedor</span>
                </a>
              ` : ''}

              ${isAuth && isAdmin ? `
                <!-- Consola Admin -->
                <a 
                  href="#/admin" 
                  data-route="admin" 
                  class="nav-item relative z-10 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5 select-none cursor-pointer"
                >
                  ${renderIcon('ShieldCheck', 'w-3.5 h-3.5 text-slate-400')}
                  <span>Administración</span>
                </a>
              ` : ''}

              ${isAuth && isClient && !isAdmin ? `
                <!-- Mis Alquileres -->
                <a 
                  href="#/client" 
                  data-route="client" 
                  class="nav-item relative z-10 px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5 select-none cursor-pointer"
                >
                  ${renderIcon('ClipboardList', 'w-3.5 h-3.5 text-slate-400')}
                  <span>Mis Alquileres</span>
                </a>
              ` : ''}

              ${!isAuth ? `
                <!-- Aliados CTA Button -->
                <button 
                  id="btn-guest-provider-cta" 
                  type="button" 
                  class="group relative z-10 px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#ea580c] hover:bg-white/90 rounded-full transition-all flex items-center gap-1.5 cursor-pointer select-none"
                  title="Publica y monetiza tus herramientas en ToolRent"
                >
                  ${renderIcon('Building2', 'w-3.5 h-3.5 text-slate-400 group-hover:text-[#ea580c] transition-colors')}
                  <span>¿Tienes equipos?</span>
                  <span class="text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-orange-100 text-[#ea580c]">Aliados</span>
                </button>
              ` : ''}
            </nav>
          </div>

          <!-- 3. Right: Notifications & User Session Controls -->
          <div class="flex items-center justify-end gap-2 sm:gap-2.5 lg:gap-3 flex-shrink-0 min-w-0">
            
            <!-- Notifications Bell with Popover Menu -->
            <div class="relative flex-shrink-0" id="notifications-wrapper">
              <button 
                id="btn-navbar-notifications" 
                class="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100/80 transition-all cursor-pointer flex items-center justify-center" 
                title="Notificaciones"
                aria-label="Abrir panel de notificaciones"
              >
                ${renderIcon('Bell', 'w-4 h-4')}
                <span 
                  id="navbar-unread-badge" 
                  class="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#FF5A1F] text-white text-[9px] font-extrabold flex items-center justify-center ring-2 ring-white shadow-xs ${unreadCount > 0 ? '' : 'hidden'}"
                >
                  ${unreadCount}
                </span>
              </button>

              <!-- Notifications Popover Container -->
              <div id="notifications-menu-container" class="hidden"></div>
            </div>

            ${isAuth ? `
              <!-- Authenticated User Menu Dropdown -->
              <div class="relative flex-shrink-0" id="user-dropdown-wrapper">
                <button 
                  id="btn-user-menu-toggle" 
                  type="button" 
                  class="flex items-center gap-2 p-1.5 pl-2 pr-2.5 rounded-full hover:bg-slate-100/80 border border-slate-200/90 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/20 select-none shadow-xs"
                  aria-expanded="false"
                  aria-haspopup="true"
                  aria-label="Menú de usuario"
                >
                  <div class="w-8 h-8 rounded-full ${isAdmin ? 'bg-gradient-to-tr from-amber-600 to-amber-500' : (isProvider ? 'bg-gradient-to-tr from-blue-600 to-cyan-500' : 'bg-gradient-to-tr from-[#FF5A1F] to-orange-400')} text-white flex items-center justify-center text-xs font-bold font-display shadow-xs flex-shrink-0">
                    ${userInitials}
                  </div>
                  <div class="hidden xl:block text-left text-xs">
                    <div class="font-bold text-slate-900 leading-tight truncate max-w-[100px]">${user?.username}</div>
                    <div class="text-[10px] text-slate-500 font-medium leading-none mt-0.5">
                      ${roleTitle}
                    </div>
                  </div>
                  <span id="user-menu-chevron" class="text-slate-400 transition-transform duration-150 inline-flex items-center">
                    ${renderIcon('ChevronDown', 'w-3.5 h-3.5')}
                  </span>
                </button>

                <!-- Floating User Dropdown Popover Card -->
                <div 
                  id="user-dropdown-menu" 
                  class="hidden absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                  style="transform-origin: top right;"
                >
                  <!-- User Info Card Header -->
                  <div class="p-4 bg-slate-50/90 border-b border-slate-100 flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full ${isAdmin ? 'bg-amber-600' : (isProvider ? 'bg-blue-600' : 'bg-[#FF5A1F]')} text-white flex items-center justify-center text-sm font-bold font-display shadow-xs flex-shrink-0">
                      ${userInitials}
                    </div>
                    <div class="min-w-0 flex-1">
                      <div class="font-bold text-slate-900 text-sm truncate font-display">${user?.username}</div>
                      <div class="text-[11px] text-slate-500 truncate">${user?.email || 'Usuario registrado'}</div>
                      <div class="mt-1">
                        ${roleBadgeHtml}
                      </div>
                    </div>
                  </div>

                  <!-- Role-Specific Navigation Links -->
                  <div class="p-2 space-y-1 text-xs" id="user-dropdown-nav-list">
                    <a href="#/catalog" class="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 border border-transparent transition-all duration-150 group/item">
                      <div class="flex items-center gap-2.5">
                        ${renderIcon('Store', 'w-4 h-4 text-zinc-400 group-hover/item:text-zinc-700')}
                        <span>Explorar Catálogo</span>
                      </div>
                      <span class="user-nav-dot hidden w-1.5 h-1.5 rounded-full bg-orange-600"></span>
                    </a>

                    ${isClient || isAdmin ? `
                      <a href="#/client" class="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 border border-transparent transition-all duration-150 group/item">
                        <div class="flex items-center gap-2.5">
                          ${renderIcon('ClipboardList', 'w-4 h-4 text-zinc-400 group-hover/item:text-zinc-700')}
                          <span>Mis Alquileres y Facturas</span>
                        </div>
                        <span class="user-nav-dot hidden w-1.5 h-1.5 rounded-full bg-orange-600"></span>
                      </a>
                    ` : ''}

                    ${isProvider || isAdmin ? `
                      <a href="#/provider" class="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 border border-transparent transition-all duration-150 group/item">
                        <div class="flex items-center gap-2.5">
                          ${renderIcon('Building2', 'w-4 h-4 text-zinc-400 group-hover/item:text-zinc-700')}
                          <span>Panel de Proveedor</span>
                        </div>
                        <span class="user-nav-dot hidden w-1.5 h-1.5 rounded-full bg-orange-600"></span>
                      </a>
                    ` : ''}

                    ${isAdmin ? `
                      <a href="#/admin" class="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 border border-transparent transition-all duration-150 group/item">
                        <div class="flex items-center gap-2.5">
                          ${renderIcon('ShieldCheck', 'w-4 h-4 text-zinc-400 group-hover/item:text-zinc-700')}
                          <span>Consola de Administración</span>
                        </div>
                        <span class="user-nav-dot hidden w-1.5 h-1.5 rounded-full bg-orange-600"></span>
                      </a>
                    ` : ''}
                  </div>

                  <!-- Footer / Logout Option -->
                  <div class="p-2 border-t border-slate-100 bg-slate-50/40">
                    <button 
                      id="btn-dropdown-logout" 
                      type="button" 
                      class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer text-left"
                    >
                      ${renderIcon('LogOut', 'w-4 h-4 text-rose-500')}
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              </div>
            ` : `
              <!-- Guest Iniciar Sesión Button -->
              <button id="btn-nav-login" class="inline-flex items-center justify-center px-3.5 sm:px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#FF5A1F] hover:bg-[#e04e18] shadow-sm hover:shadow transition-all duration-150 active:scale-95 cursor-pointer flex-shrink-0">
                Iniciar sesión
              </button>
            `}

            <!-- Mobile Hamburger Toggle -->
            <button id="mobile-menu-btn" class="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer flex-shrink-0" aria-label="Abrir menú de navegación">
              ${renderIcon('Menu', 'w-5 h-5')}
            </button>

          </div>

        </div>
      </div>

      <!-- Mobile Navigation Drawer (Drop-down with full-width touch buttons) -->
      <div id="mobile-menu" class="hidden md:hidden border-t border-slate-200/90 bg-white/95 backdrop-blur-md px-4 py-4 space-y-1.5 shadow-xl animate-in fade-in duration-150">
        <a href="#/" class="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 min-h-[44px]">
          ${renderIcon('Home', 'w-4 h-4')}
          <span>Inicio</span>
        </a>

        <a href="#/about" class="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 min-h-[44px]">
          ${renderIcon('Info', 'w-4 h-4')}
          <span>Sobre Nosotros</span>
        </a>

        ${!(isAuth && isProvider && !isAdmin) ? `
          <a href="#/catalog" class="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 min-h-[44px]">
            ${renderIcon('Store', 'w-4 h-4')}
            <span>Catálogo de Equipos</span>
          </a>
        ` : ''}

        ${!isAuth ? `
          <button id="mobile-btn-guest-provider" type="button" class="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer text-left min-h-[44px]">
            <span class="flex items-center gap-3">
              ${renderIcon('Building2', 'w-4 h-4 text-slate-500')}
              <span>¿Tienes equipos? Publica aquí</span>
            </span>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-[#ea580c]">Aliados</span>
          </button>
        ` : ''}

        ${isAuth && isClient && !isAdmin ? `
          <a href="#/client" class="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 min-h-[44px]">
            ${renderIcon('ClipboardList', 'w-4 h-4')}
            <span>Mis Alquileres</span>
          </a>
        ` : ''}

        ${isAuth && isProvider && !isAdmin ? `
          <a href="#/provider" class="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 min-h-[44px]">
            ${renderIcon('Building2', 'w-4 h-4')}
            <span>Panel de Proveedor</span>
          </a>
        ` : ''}

        ${isAuth && isAdmin ? `
          <a href="#/admin" class="flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 min-h-[44px]">
            <span class="flex items-center gap-3">
              ${renderIcon('ShieldCheck', 'w-4 h-4 text-slate-500')}
              <span>Consola Administración</span>
            </span>
            <span class="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-orange-100 text-orange-700">Admin</span>
          </a>
          <a href="#/provider" class="flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 min-h-[44px]">
            <span class="flex items-center gap-3">
              ${renderIcon('Building2', 'w-4 h-4 text-slate-500')}
              <span>Panel Proveedor</span>
            </span>
            <span class="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-blue-100 text-blue-700">Ops</span>
          </a>
        ` : ''}

        <!-- Mobile Notifications Link -->
        <button id="mobile-btn-notifs" class="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer min-h-[44px]">
          <span class="flex items-center gap-3">
            ${renderIcon('Bell', 'w-4 h-4 text-slate-500')}
            <span>Notificaciones</span>
          </span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FF5A1F] text-white ${unreadCount > 0 ? '' : 'hidden'}">
            ${unreadCount}
          </span>
        </button>

        <div class="pt-3 border-t border-slate-100 mt-2">
          ${isAuth ? `
            <div class="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 rounded-xl mb-1 min-h-[44px]">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-8 h-8 rounded-full ${isAdmin ? 'bg-amber-600' : (isProvider ? 'bg-blue-600' : 'bg-[#FF5A1F]')} text-white flex items-center justify-center text-xs font-bold font-display flex-shrink-0">
                  ${userInitials}
                </div>
                <div class="min-w-0">
                  <div class="text-xs text-slate-800 font-bold truncate">${user?.username}</div>
                  <div class="text-[10px] text-slate-500">${roleTitle}</div>
                </div>
              </div>
              <button id="mobile-btn-logout" class="text-xs text-rose-600 font-bold px-3 py-1.5 rounded-lg hover:bg-rose-50 cursor-pointer min-h-[44px] flex items-center">Cerrar Sesión</button>
            </div>
          ` : `
            <button id="mobile-btn-login" class="w-full py-3 min-h-[44px] rounded-xl text-xs font-bold text-white bg-[#FF5A1F] hover:bg-[#e04e18] shadow-sm cursor-pointer flex items-center justify-center">
              Iniciar sesión
            </button>
          `}
        </div>
      </div>
    </header>

    <!-- Mobile Bottom Tab Bar (Barra de Navegación Inferior Fija para Móviles < 768px) -->
    <nav 
      id="mobile-bottom-tab-bar" 
      class="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] flex items-center justify-around select-none"
      aria-label="Navegación principal móvil"
    >
      ${!isAuth ? `
        <a href="#/" data-bottom-route="home" class="bottom-tab-item flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[11px] font-semibold text-slate-500 transition-all cursor-pointer active:scale-95 touch-target">
          ${renderIcon('Home', 'w-5 h-5 mb-0.5 text-slate-400')}
          <span class="tab-label leading-tight">Inicio</span>
          <span class="bottom-active-dot hidden w-1.5 h-1.5 rounded-full bg-[#ea580c] mt-0.5"></span>
        </a>
        <a href="#/catalog" data-bottom-route="catalog" class="bottom-tab-item flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[11px] font-semibold text-slate-500 transition-all cursor-pointer active:scale-95 touch-target">
          ${renderIcon('Store', 'w-5 h-5 mb-0.5 text-slate-400')}
          <span class="tab-label leading-tight">Catálogo</span>
          <span class="bottom-active-dot hidden w-1.5 h-1.5 rounded-full bg-[#ea580c] mt-0.5"></span>
        </a>
        <a href="#/about" data-bottom-route="about" class="bottom-tab-item flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[11px] font-semibold text-slate-500 transition-all cursor-pointer active:scale-95 touch-target">
          ${renderIcon('Info', 'w-5 h-5 mb-0.5 text-slate-400')}
          <span class="tab-label leading-tight">Nosotros</span>
          <span class="bottom-active-dot hidden w-1.5 h-1.5 rounded-full bg-[#ea580c] mt-0.5"></span>
        </a>
        <button id="bottom-btn-login" type="button" class="bottom-tab-item flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[11px] font-semibold text-orange-600 transition-all cursor-pointer active:scale-95 touch-target">
          ${renderIcon('LogIn', 'w-5 h-5 mb-0.5')}
          <span class="tab-label leading-tight">Acceder</span>
        </button>
      ` : isAdmin ? `
        <a href="#/admin" data-bottom-route="admin" class="bottom-tab-item flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[11px] font-semibold text-slate-500 transition-all cursor-pointer active:scale-95 touch-target">
          ${renderIcon('ShieldCheck', 'w-5 h-5 mb-0.5 text-slate-400')}
          <span class="tab-label leading-tight">Admin</span>
          <span class="bottom-active-dot hidden w-1.5 h-1.5 rounded-full bg-[#ea580c] mt-0.5"></span>
        </a>
        <a href="#/provider" data-bottom-route="provider" class="bottom-tab-item flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[11px] font-semibold text-slate-500 transition-all cursor-pointer active:scale-95 touch-target">
          ${renderIcon('Building2', 'w-5 h-5 mb-0.5 text-slate-400')}
          <span class="tab-label leading-tight">Proveedor</span>
          <span class="bottom-active-dot hidden w-1.5 h-1.5 rounded-full bg-[#ea580c] mt-0.5"></span>
        </a>
        <a href="#/catalog" data-bottom-route="catalog" class="bottom-tab-item flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[11px] font-semibold text-slate-500 transition-all cursor-pointer active:scale-95 touch-target">
          ${renderIcon('Store', 'w-5 h-5 mb-0.5 text-slate-400')}
          <span class="tab-label leading-tight">Catálogo</span>
          <span class="bottom-active-dot hidden w-1.5 h-1.5 rounded-full bg-[#ea580c] mt-0.5"></span>
        </a>
        <a href="#/about" data-bottom-route="about" class="bottom-tab-item flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[11px] font-semibold text-slate-500 transition-all cursor-pointer active:scale-95 touch-target">
          ${renderIcon('Info', 'w-5 h-5 mb-0.5 text-slate-400')}
          <span class="tab-label leading-tight">Nosotros</span>
          <span class="bottom-active-dot hidden w-1.5 h-1.5 rounded-full bg-[#ea580c] mt-0.5"></span>
        </a>
      ` : isProvider ? `
        <a href="#/provider" data-bottom-route="provider" class="bottom-tab-item flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[11px] font-semibold text-slate-500 transition-all cursor-pointer active:scale-95 touch-target">
          ${renderIcon('Wrench', 'w-5 h-5 mb-0.5 text-slate-400')}
          <span class="tab-label leading-tight">Inventario</span>
          <span class="bottom-active-dot hidden w-1.5 h-1.5 rounded-full bg-[#ea580c] mt-0.5"></span>
        </a>
        <a href="#/catalog" data-bottom-route="catalog" class="bottom-tab-item flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[11px] font-semibold text-slate-500 transition-all cursor-pointer active:scale-95 touch-target">
          ${renderIcon('Store', 'w-5 h-5 mb-0.5 text-slate-400')}
          <span class="tab-label leading-tight">Catálogo</span>
          <span class="bottom-active-dot hidden w-1.5 h-1.5 rounded-full bg-[#ea580c] mt-0.5"></span>
        </a>
        <a href="#/about" data-bottom-route="about" class="bottom-tab-item flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[11px] font-semibold text-slate-500 transition-all cursor-pointer active:scale-95 touch-target">
          ${renderIcon('Info', 'w-5 h-5 mb-0.5 text-slate-400')}
          <span class="tab-label leading-tight">Nosotros</span>
          <span class="bottom-active-dot hidden w-1.5 h-1.5 rounded-full bg-[#ea580c] mt-0.5"></span>
        </a>
        <button id="bottom-btn-notifs" type="button" class="bottom-tab-item relative flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[11px] font-semibold text-slate-500 transition-all cursor-pointer active:scale-95 touch-target">
          ${renderIcon('Bell', 'w-5 h-5 mb-0.5 text-slate-400')}
          <span class="tab-label leading-tight">Avisos</span>
          <span id="bottom-unread-badge" class="absolute top-1 right-3 min-w-[15px] h-3.5 px-1 rounded-full bg-[#FF5A1F] text-white text-[8px] font-extrabold flex items-center justify-center ring-2 ring-white shadow-xs ${unreadCount > 0 ? '' : 'hidden'}">
            ${unreadCount}
          </span>
        </button>
      ` : `
        <a href="#/catalog" data-bottom-route="catalog" class="bottom-tab-item flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[11px] font-semibold text-slate-500 transition-all cursor-pointer active:scale-95 touch-target">
          ${renderIcon('Store', 'w-5 h-5 mb-0.5 text-slate-400')}
          <span class="tab-label leading-tight">Explorar</span>
          <span class="bottom-active-dot hidden w-1.5 h-1.5 rounded-full bg-[#ea580c] mt-0.5"></span>
        </a>
        <a href="#/client" data-bottom-route="client" class="bottom-tab-item flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[11px] font-semibold text-slate-500 transition-all cursor-pointer active:scale-95 touch-target">
          ${renderIcon('ClipboardList', 'w-5 h-5 mb-0.5 text-slate-400')}
          <span class="tab-label leading-tight">Reservas</span>
          <span class="bottom-active-dot hidden w-1.5 h-1.5 rounded-full bg-[#ea580c] mt-0.5"></span>
        </a>
        <a href="#/about" data-bottom-route="about" class="bottom-tab-item flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[11px] font-semibold text-slate-500 transition-all cursor-pointer active:scale-95 touch-target">
          ${renderIcon('Info', 'w-5 h-5 mb-0.5 text-slate-400')}
          <span class="tab-label leading-tight">Nosotros</span>
          <span class="bottom-active-dot hidden w-1.5 h-1.5 rounded-full bg-[#ea580c] mt-0.5"></span>
        </a>
        <button id="bottom-btn-notifs" type="button" class="bottom-tab-item relative flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[11px] font-semibold text-slate-500 transition-all cursor-pointer active:scale-95 touch-target">
          ${renderIcon('Bell', 'w-5 h-5 mb-0.5 text-slate-400')}
          <span class="tab-label leading-tight">Avisos</span>
          <span id="bottom-unread-badge" class="absolute top-1 right-3 min-w-[15px] h-3.5 px-1 rounded-full bg-[#FF5A1F] text-white text-[8px] font-extrabold flex items-center justify-center ring-2 ring-white shadow-xs ${unreadCount > 0 ? '' : 'hidden'}">
            ${unreadCount}
          </span>
        </button>
      `}
    </nav>
  `;

  // --- Handlers & Interactivity ---

  // Instant response on nav link click for snappy micro-interaction
  container.querySelectorAll('#navbar-floating-pill .nav-item').forEach((link) => {
    link.addEventListener('click', () => {
      const route = link.getAttribute('data-route');
      if (route) {
        applyRouteVisuals(container, route, false);
      }
    });
  });

  // User Dropdown Logic
  const userMenuBtn = container.querySelector('#btn-user-menu-toggle');
  const userDropdown = container.querySelector('#user-dropdown-menu');
  const userMenuChevron = container.querySelector('#user-menu-chevron');

  function toggleUserDropdown(open) {
    if (!userDropdown) return;
    const shouldOpen = open !== undefined ? open : userDropdown.classList.contains('hidden');
    if (shouldOpen) {
      closeNotificationsMenu();
      userDropdown.classList.remove('hidden');
      userMenuBtn?.setAttribute('aria-expanded', 'true');
      userMenuChevron?.classList.add('rotate-180');
    } else {
      userDropdown.classList.add('hidden');
      userMenuBtn?.setAttribute('aria-expanded', 'false');
      userMenuChevron?.classList.remove('rotate-180');
    }
  }

  userMenuBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleUserDropdown();
  });

  // Close dropdown on click outside
  document.addEventListener('click', (e) => {
    if (userDropdown && !userDropdown.contains(e.target) && !userMenuBtn?.contains(e.target)) {
      toggleUserDropdown(false);
    }
  });

  // Close dropdown on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      toggleUserDropdown(false);
    }
  });

  // Close dropdown when any internal anchor is clicked
  userDropdown?.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => toggleUserDropdown(false));
  });

  // Logout Handlers
  const handleLogout = () => {
    toggleUserDropdown(false);
    auth.logout();
    window.location.hash = '#/catalog';
  };

  container.querySelector('#btn-dropdown-logout')?.addEventListener('click', handleLogout);
  container.querySelector('#mobile-btn-logout')?.addEventListener('click', handleLogout);

  // Login Handlers
  container.querySelector('#btn-nav-login')?.addEventListener('click', () => openAuthModal('login'));
  container.querySelector('#mobile-btn-login')?.addEventListener('click', () => openAuthModal('login'));
  container.querySelector('#bottom-btn-login')?.addEventListener('click', () => openAuthModal('login'));

  // Guest Partner CTA Handlers
  container.querySelector('#btn-guest-provider-cta')?.addEventListener('click', () => {
    openAuthModal('register', 'ROLE_PROVEEDOR');
  });

  container.querySelector('#mobile-btn-guest-provider')?.addEventListener('click', () => {
    container.querySelector('#mobile-menu')?.classList.add('hidden');
    openAuthModal('register', 'ROLE_PROVEEDOR');
  });

  // Notification Menu Toggles
  container.querySelector('#btn-navbar-notifications')?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleUserDropdown(false);
    toggleNotificationsMenu();
  });

  container.querySelector('#mobile-btn-notifs')?.addEventListener('click', (e) => {
    e.stopPropagation();
    container.querySelector('#mobile-menu')?.classList.add('hidden');
    toggleNotificationsMenu();
  });

  container.querySelector('#bottom-btn-notifs')?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleUserDropdown(false);
    toggleNotificationsMenu();
  });

  // Mobile Hamburger Toggle
  const mobToggle = container.querySelector('#mobile-menu-btn');
  const mobMenu = container.querySelector('#mobile-menu');
  if (mobToggle && mobMenu) {
    mobToggle.addEventListener('click', () => mobMenu.classList.toggle('hidden'));
  }

  // Reactive badge updates on notifications:change
  window.addEventListener('notifications:change', (e) => {
    const count = e.detail?.unreadCount ?? notificationsStore.getUnreadCount();
    const badge = container.querySelector('#navbar-unread-badge');
    const bottomBadge = container.querySelector('#bottom-unread-badge');
    if (badge) {
      badge.textContent = count.toString();
      if (count > 0) {
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
    if (bottomBadge) {
      bottomBadge.textContent = count.toString();
      if (count > 0) {
        bottomBadge.classList.remove('hidden');
      } else {
        bottomBadge.classList.add('hidden');
      }
    }
  });

  // Responsive resize handler to keep active pill perfectly calibrated
  window.addEventListener('resize', () => {
    const activePill = container.querySelector('#nav-active-pill');
    const targetLink = container.querySelector(`.nav-item[data-route="${currentActiveRoute}"]`);
    if (activePill && targetLink && targetLink.offsetWidth > 0) {
      activePill.style.left = `${targetLink.offsetLeft}px`;
      activePill.style.width = `${targetLink.offsetWidth}px`;
    }
  });

  // Apply route visuals with initial entrance animation
  applyRouteVisuals(container, activeRoute, true);

  // Silent background health verification
  api.checkHealth().catch(() => {});
}
