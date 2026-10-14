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

  container.innerHTML = `
    <header class="bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-xs">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-20 py-3 gap-4 lg:gap-8">
          
          <!-- 1. Logo & Brand Mark matching img/esquema visual de navegacion.png & img/image.png -->
          <a href="#/catalog" class="flex items-center gap-3 group select-none flex-shrink-0" title="ToolRent - Inicio">
            ${renderToolRentMark('w-9 h-9 transition-transform duration-200 group-hover:scale-105', '#FF5A1F')}
            <span class="text-2xl font-black font-display tracking-tight text-slate-900 leading-none">
              ToolRent
            </span>
          </a>

          <!-- 2. Functional Navigation Titles ("con los títulos correspondientes que lleven a cada función") -->
          <nav class="hidden md:flex items-center gap-1 lg:gap-2">
            <a href="#/catalog" class="relative px-3.5 py-2 text-sm font-semibold transition-all ${
              activeRoute === 'catalog'
                ? 'text-slate-900 font-bold after:absolute after:bottom-0 after:left-3.5 after:right-3.5 after:h-0.5 after:bg-[#FF5A1F] after:rounded-full'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl'
            }">
              Inicio
            </a>

            <a href="#/client" class="relative px-3.5 py-2 text-sm font-semibold transition-all ${
              activeRoute === 'client'
                ? 'text-slate-900 font-bold after:absolute after:bottom-0 after:left-3.5 after:right-3.5 after:h-0.5 after:bg-[#FF5A1F] after:rounded-full'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl'
            }">
              Mis Alquileres
            </a>

            <a href="#/provider" class="relative px-3.5 py-2 text-sm font-semibold transition-all ${
              activeRoute === 'provider'
                ? 'text-slate-900 font-bold after:absolute after:bottom-0 after:left-3.5 after:right-3.5 after:h-0.5 after:bg-[#FF5A1F] after:rounded-full'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl'
            }">
              Para Proveedores
            </a>

            <a href="#/admin" class="relative px-3.5 py-2 text-sm font-semibold transition-all ${
              activeRoute === 'admin'
                ? 'text-slate-900 font-bold after:absolute after:bottom-0 after:left-3.5 after:right-3.5 after:h-0.5 after:bg-[#FF5A1F] after:rounded-full'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl'
            }">
              Administración
            </a>
          </nav>

          <!-- 3. Right: Pill Search Bar & User Session Controls (matching esquema visual de navegacion.png) -->
          <div class="flex items-center gap-3 lg:gap-4 flex-shrink-0">
            
            <!-- Rounded Pill Search Bar -->
            <div class="hidden sm:flex items-center relative w-48 md:w-56 lg:w-72">
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

            <!-- Notifications Bell with Dropdown Menu -->
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
              <!-- Authenticated User Menu -->
              <div class="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold font-display shadow-xs">
                    ${user?.username ? user.username.substring(0, 2).toUpperCase() : 'US'}
                  </div>
                  <div class="hidden lg:block text-left text-xs">
                    <div class="font-bold text-slate-900 leading-tight">${user?.username}</div>
                    <div class="text-[10px] text-slate-500 font-medium">
                      ${isAdmin ? 'Administrador' : (isProvider ? 'Proveedor' : 'Cliente')}
                    </div>
                  </div>
                </div>

                <button id="btn-logout" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer" title="Cerrar Sesión">
                  ${renderIcon('LogOut', 'w-4 h-4')}
                </button>
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

        <a href="#/catalog" class="block px-3 py-2 rounded-lg text-sm font-semibold ${activeRoute === 'catalog' ? 'text-[#FF5A1F] bg-orange-50/70 font-bold' : 'text-slate-700 hover:bg-slate-50'}">
          Inicio / Catálogo
        </a>
        <a href="#/client" class="block px-3 py-2 rounded-lg text-sm font-semibold ${activeRoute === 'client' ? 'text-[#FF5A1F] bg-orange-50/70 font-bold' : 'text-slate-700 hover:bg-slate-50'}">
          Mis Alquileres
        </a>
        <a href="#/provider" class="block px-3 py-2 rounded-lg text-sm font-semibold ${activeRoute === 'provider' ? 'text-[#FF5A1F] bg-orange-50/70 font-bold' : 'text-slate-700 hover:bg-slate-50'}">
          Para Proveedores
        </a>
        <a href="#/admin" class="block px-3 py-2 rounded-lg text-sm font-semibold ${activeRoute === 'admin' ? 'text-[#FF5A1F] bg-orange-50/70 font-bold' : 'text-slate-700 hover:bg-slate-50'}">
          Administración
        </a>

        <!-- Mobile Notifications Link -->
        <button id="mobile-btn-notifs" class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer">
          <span class="flex items-center gap-2">
            ${renderIcon('Bell', 'w-4 h-4 text-slate-500')}
            <span>Notificaciones</span>
          </span>
          <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FF5A1F] text-white ${unreadCount > 0 ? '' : 'hidden'}">
            ${unreadCount}
          </span>
        </button>

        <div class="pt-2 border-t border-slate-100 mt-2">
          ${isAuth ? `
            <div class="flex items-center justify-between px-3 py-2">
              <span class="text-xs text-slate-600 font-medium">${user?.username} (${isAdmin ? 'Admin' : (isProvider ? 'Proveedor' : 'Cliente')})</span>
              <button id="mobile-btn-logout" class="text-xs text-rose-600 font-bold">Cerrar Sesión</button>
            </div>
          ` : `
            <button id="mobile-btn-login" class="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-[#FF5A1F] hover:bg-[#e04e18] shadow-sm">
              Iniciar sesión
            </button>
          `}
        </div>
      </div>
    </header>
  `;

  // Handlers
  container.querySelector('#btn-logout')?.addEventListener('click', () => { 
    auth.logout(); 
    window.location.hash = '#/catalog'; 
  });
  container.querySelector('#mobile-btn-logout')?.addEventListener('click', () => { 
    auth.logout(); 
    window.location.hash = '#/catalog'; 
  });
  container.querySelector('#btn-nav-login')?.addEventListener('click', () => openAuthModal('login'));
  container.querySelector('#mobile-btn-login')?.addEventListener('click', () => openAuthModal('login'));

  // Notification Menu Toggles
  container.querySelector('#btn-navbar-notifications')?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleNotificationsMenu();
  });

  container.querySelector('#mobile-btn-notifs')?.addEventListener('click', (e) => {
    e.stopPropagation();
    container.querySelector('#mobile-menu')?.classList.add('hidden');
    toggleNotificationsMenu();
  });

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
