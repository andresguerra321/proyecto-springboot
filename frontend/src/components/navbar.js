import auth from '../auth/state.js';
import { renderIcon, renderToolRentMark } from '../utils/icons.js';
import { openAuthModal } from './auth-modal.js';
import { toggleNotificationsMenu, closeNotificationsMenu } from './notifications-menu.js';
import { notificationsStore } from '../utils/notifications-store.js';

export function renderNavbar(activeRoute = 'catalog') {
  const container = document.getElementById('navbar-container');
  if (!container) return;

  const user = auth.getUser();
  const isAuth = auth.isAuthenticated();
  const isAdmin = auth.isAdmin();
  const isProvider = auth.isProvider();
  const isClient = auth.isClient();
  const unreadCount = isAuth ? notificationsStore.getUnreadCount() : 0;

  const userInitials = user?.username ? user.username.substring(0, 2).toUpperCase() : 'US';
  const roleTitle = isAdmin ? 'Administrador' : (isProvider ? 'Proveedor' : 'Cliente');
  
  const roleBadgeHtml = isAdmin 
    ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">${renderIcon('ShieldCheck', 'w-3 h-3')} Administrador</span>`
    : (isProvider 
        ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">${renderIcon('Building2', 'w-3 h-3')} Proveedor Aliado</span>`
        : `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">${renderIcon('CheckCircle2', 'w-3 h-3')} Cliente Verificado</span>`);

  container.innerHTML = `
    <header class="bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-xs">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-20 py-3 gap-4 lg:gap-8">
          
          <!-- 1. Logo & Brand Mark -->
          <a href="#/catalog" class="flex items-center gap-3 group select-none flex-shrink-0" title="ToolRent - Inicio">
            ${renderToolRentMark('w-9 h-9 transition-transform duration-200 group-hover:scale-105', '#FF5A1F')}
            <span class="text-2xl font-black font-display tracking-tight text-slate-900 leading-none">
              ToolRent
            </span>
          </a>

          <!-- 2. Dynamic, Role-Aware Navigation Links -->
          <nav class="hidden md:flex items-center gap-1 lg:gap-2">
            <!-- Inicio / Catálogo (Visible for everyone) -->
            <a href="#/catalog" class="relative px-3.5 py-2 text-sm font-semibold transition-all ${
              activeRoute === 'catalog'
                ? 'text-slate-900 font-bold after:absolute after:bottom-0 after:left-3.5 after:right-3.5 after:h-0.5 after:bg-[#FF5A1F] after:rounded-full'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl'
            }">
              Inicio
            </a>

            ${!isAuth ? `
              <!-- Guest Partner Invitation Link -->
              <button 
                id="btn-guest-provider-cta" 
                type="button" 
                class="group px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-[#FF5A1F] hover:bg-orange-50/60 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                title="Publica y monetiza tus herramientas en ToolRent"
              >
                ${renderIcon('Building2', 'w-4 h-4 text-slate-400 group-hover:text-[#FF5A1F] transition-colors')}
                <span>¿Tienes equipos? Publica aquí</span>
                <span class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-orange-100 text-[#ea580c] group-hover:bg-[#FF5A1F] group-hover:text-white transition-colors">Aliados</span>
              </button>
            ` : ''}

            ${isAuth && isClient && !isAdmin ? `
              <!-- Client Rentals Link -->
              <a href="#/client" class="relative px-3.5 py-2 text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeRoute === 'client'
                  ? 'text-slate-900 font-bold after:absolute after:bottom-0 after:left-3.5 after:right-3.5 after:h-0.5 after:bg-[#FF5A1F] after:rounded-full'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl'
              }">
                ${renderIcon('ClipboardList', 'w-4 h-4 text-slate-400')}
                <span>Mis Alquileres</span>
              </a>
            ` : ''}

            ${isAuth && isProvider && !isAdmin ? `
              <!-- Provider Portal Link -->
              <a href="#/provider" class="relative px-3.5 py-2 text-sm font-semibold transition-all flex items-center gap-1.5 ${
                activeRoute === 'provider'
                  ? 'text-slate-900 font-bold after:absolute after:bottom-0 after:left-3.5 after:right-3.5 after:h-0.5 after:bg-[#FF5A1F] after:rounded-full'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl'
              }">
                ${renderIcon('Building2', 'w-4 h-4 text-slate-400')}
                <span>Panel de Proveedor</span>
              </a>
            ` : ''}

            ${isAuth && isAdmin ? `
              <!-- Protected Admin Console Link -->
              <a href="#/admin" class="relative px-3.5 py-2 text-sm font-semibold transition-all flex items-center gap-1.5 rounded-xl ${
                activeRoute === 'admin'
                  ? 'bg-amber-100/80 text-amber-900 font-bold border border-amber-300 shadow-xs'
                  : 'text-amber-800 bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200/80'
              }">
                ${renderIcon('ShieldCheck', 'w-4 h-4 text-amber-600')}
                <span>Administración</span>
                <span class="text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded-md bg-amber-200/90 text-amber-900">Admin</span>
              </a>
            ` : ''}
          </nav>

          <!-- 3. Right: Search Bar, Notifications & User Session Controls -->
          <div class="flex items-center gap-3 lg:gap-4 flex-shrink-0">
            
            <!-- Rounded Pill Search Bar -->
            <div class="hidden sm:flex items-center relative w-48 md:w-56 lg:w-64">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                ${renderIcon('Search', 'w-4 h-4')}
              </span>
              <input 
                type="text" 
                id="navbar-global-search" 
                placeholder="Buscar herramientas, equipos..." 
                class="w-full pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-[#FF5A1F] rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/15 transition-all shadow-xs" 
              />
            </div>

            <!-- Notifications Bell with Popover Menu -->
            <div class="relative" id="notifications-wrapper">
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
              <div class="relative" id="user-dropdown-wrapper">
                <button 
                  id="btn-user-menu-toggle" 
                  type="button" 
                  class="flex items-center gap-2.5 p-1.5 pl-2 pr-3 rounded-full hover:bg-slate-100/80 border border-slate-200/90 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/20 select-none shadow-xs"
                  aria-expanded="false"
                  aria-haspopup="true"
                  aria-label="Menú de usuario"
                >
                  <div class="w-8 h-8 rounded-full ${isAdmin ? 'bg-gradient-to-tr from-amber-600 to-amber-500' : (isProvider ? 'bg-gradient-to-tr from-blue-600 to-cyan-500' : 'bg-gradient-to-tr from-[#FF5A1F] to-orange-400')} text-white flex items-center justify-center text-xs font-bold font-display shadow-xs flex-shrink-0">
                    ${userInitials}
                  </div>
                  <div class="hidden lg:block text-left text-xs">
                    <div class="font-bold text-slate-900 leading-tight truncate max-w-[110px]">${user?.username}</div>
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
                  <div class="p-2 space-y-1 text-xs">
                    <a href="#/catalog" class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 font-medium transition-colors">
                      ${renderIcon('Store', 'w-4 h-4 text-slate-400')}
                      <span>Explorar Catálogo</span>
                    </a>

                    ${isClient ? `
                      <a href="#/client" class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 font-medium transition-colors">
                        ${renderIcon('ClipboardList', 'w-4 h-4 text-slate-400')}
                        <span>Mis Alquileres y Facturas</span>
                      </a>
                    ` : ''}

                    ${isProvider ? `
                      <a href="#/provider" class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 font-medium transition-colors">
                        ${renderIcon('Building2', 'w-4 h-4 text-slate-400')}
                        <span>Panel de Proveedor</span>
                      </a>
                    ` : ''}

                    ${isAdmin ? `
                      <a href="#/admin" class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-amber-900 bg-amber-50/70 hover:bg-amber-100 font-semibold transition-colors">
                        ${renderIcon('ShieldCheck', 'w-4 h-4 text-amber-600')}
                        <span>Consola de Administración</span>
                      </a>
                      <a href="#/provider" class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 font-medium transition-colors">
                        ${renderIcon('Building2', 'w-4 h-4 text-slate-400')}
                        <span>Panel de Proveedor</span>
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
              <button id="btn-nav-login" class="inline-flex items-center justify-center px-4 sm:px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#FF5A1F] hover:bg-[#e04e18] shadow-sm hover:shadow transition-all duration-150 active:scale-95 cursor-pointer">
                Iniciar sesión
              </button>
            `}

            <!-- Mobile Hamburger Toggle -->
            <button id="mobile-menu-btn" class="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer" aria-label="Abrir menú de navegación">
              ${renderIcon('Menu', 'w-5 h-5')}
            </button>

          </div>

        </div>
      </div>

      <!-- Mobile Navigation Drawer -->
      <div id="mobile-menu" class="hidden md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 shadow-lg animate-in fade-in duration-150">
        <!-- Mobile Search Input -->
        <div class="relative py-1 mb-2">
          <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            ${renderIcon('Search', 'w-4 h-4')}
          </span>
          <input 
            type="text" 
            id="mobile-global-search" 
            placeholder="Buscar herramientas..." 
            class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF5A1F]" 
          />
        </div>

        <a href="#/catalog" class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold ${activeRoute === 'catalog' ? 'text-[#FF5A1F] bg-orange-50/70 font-bold' : 'text-slate-700 hover:bg-slate-50'}">
          ${renderIcon('Store', 'w-4 h-4')}
          <span>Inicio / Catálogo</span>
        </a>

        ${!isAuth ? `
          <button id="mobile-btn-guest-provider" type="button" class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer text-left">
            <span class="flex items-center gap-2.5">
              ${renderIcon('Building2', 'w-4 h-4 text-slate-500')}
              <span>¿Tienes equipos? Publica aquí</span>
            </span>
            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-[#ea580c]">Aliados</span>
          </button>
        ` : ''}

        ${isAuth && isClient && !isAdmin ? `
          <a href="#/client" class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold ${activeRoute === 'client' ? 'text-[#FF5A1F] bg-orange-50/70 font-bold' : 'text-slate-700 hover:bg-slate-50'}">
            ${renderIcon('ClipboardList', 'w-4 h-4')}
            <span>Mis Alquileres</span>
          </a>
        ` : ''}

        ${isAuth && isProvider && !isAdmin ? `
          <a href="#/provider" class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold ${activeRoute === 'provider' ? 'text-[#FF5A1F] bg-orange-50/70 font-bold' : 'text-slate-700 hover:bg-slate-50'}">
            ${renderIcon('Building2', 'w-4 h-4')}
            <span>Panel de Proveedor</span>
          </a>
        ` : ''}

        ${isAuth && isAdmin ? `
          <a href="#/admin" class="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold ${activeRoute === 'admin' ? 'text-amber-900 bg-amber-100 font-bold' : 'text-amber-800 bg-amber-50 hover:bg-amber-100/70'}">
            <span class="flex items-center gap-2.5">
              ${renderIcon('ShieldCheck', 'w-4 h-4 text-amber-600')}
              <span>Administración</span>
            </span>
            <span class="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-amber-200 text-amber-900">Admin</span>
          </a>
        ` : ''}

        <!-- Mobile Notifications Link -->
        <button id="mobile-btn-notifs" class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
          <span class="flex items-center gap-2.5">
            ${renderIcon('Bell', 'w-4 h-4 text-slate-500')}
            <span>Notificaciones</span>
          </span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FF5A1F] text-white ${unreadCount > 0 ? '' : 'hidden'}">
            ${unreadCount}
          </span>
        </button>

        <div class="pt-2 border-t border-slate-100 mt-2">
          ${isAuth ? `
            <div class="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl mb-1">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-7 h-7 rounded-full ${isAdmin ? 'bg-amber-600' : (isProvider ? 'bg-blue-600' : 'bg-[#FF5A1F]')} text-white flex items-center justify-center text-xs font-bold font-display flex-shrink-0">
                  ${userInitials}
                </div>
                <div class="min-w-0">
                  <div class="text-xs text-slate-800 font-bold truncate">${user?.username}</div>
                  <div class="text-[10px] text-slate-500">${roleTitle}</div>
                </div>
              </div>
              <button id="mobile-btn-logout" class="text-xs text-rose-600 font-bold px-2 py-1 rounded hover:bg-rose-50 cursor-pointer">Cerrar Sesión</button>
            </div>
          ` : `
            <button id="mobile-btn-login" class="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-[#FF5A1F] hover:bg-[#e04e18] shadow-sm cursor-pointer">
              Iniciar sesión
            </button>
          `}
        </div>
      </div>
    </header>
  `;

  // --- Handlers & Interactivity ---

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
    if (badge) {
      badge.textContent = count.toString();
      if (count > 0) {
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
  });

  // Global search enter
  const handleSearchSubmit = (inputEl) => {
    if (!inputEl) return;
    inputEl.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        const query = inputEl.value.trim();
        window.location.hash = `#/catalog${query ? `?q=${encodeURIComponent(query)}` : ''}`;
      }
    });
  };

  handleSearchSubmit(container.querySelector('#navbar-global-search'));
  handleSearchSubmit(container.querySelector('#mobile-global-search'));
}
