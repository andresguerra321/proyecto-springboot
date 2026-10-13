import auth from '../auth/state.js';
import { renderIcon } from '../utils/icons.js';
import { openAuthModal } from './auth-modal.js';

export function renderNavbar(activeRoute = 'catalog') {
  const container = document.getElementById('navbar-container');
  if (!container) return;

  const user = auth.getUser();
  const isAuth = auth.isAuthenticated();
  const isAdmin = auth.isAdmin();
  const isProvider = auth.isProvider();
  const isClient = auth.isClient();

  container.innerHTML = `
    <header class="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-18 py-3">
          
          <!-- Logo & Brand -->
          <div class="flex items-center gap-6">
            <a href="#/catalog" class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-[#ea580c] flex items-center justify-center text-white shadow-sm shadow-orange-500/20">
                <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M19.4 4.6a1 1 0 0 0-1.4 0l-4.5 4.5-2.8-2.8a1 1 0 0 0-1.4 0l-5 5a1 1 0 0 0 0 1.4l2.8 2.8-4.5 4.5a1 1 0 1 0 1.4 1.4l4.5-4.5 2.8 2.8a1 1 0 0 0 1.4 0l5-5a1 1 0 0 0 0-1.4l-2.8-2.8 4.5-4.5a1 1 0 0 0 0-1.4z"/>
                </svg>
              </div>
              <span class="text-2xl font-black font-display tracking-tight text-slate-900">
                Tool<span class="text-[#ea580c]">Rent</span>
              </span>
            </a>

            <!-- Central Search Bar (Marketplace style) -->
            <div class="hidden lg:flex items-center relative w-96">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                ${renderIcon('Search', 'w-4 h-4')}
              </span>
              <input type="text" id="navbar-global-search" placeholder="Buscar herramientas o equipos..." class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-all" />
            </div>
          </div>

          <!-- Navigation Links & User Menu -->
          <div class="flex items-center gap-3">
            
            <!-- Navigation Tabs -->
            <div class="hidden md:flex items-center gap-1 mr-2">
              <a href="#/catalog" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeRoute === 'catalog' ? 'text-[#ea580c] bg-orange-50 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }">
                Catálogo
              </a>

              ${isClient || !isAuth ? `
                <a href="#/client" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeRoute === 'client' ? 'text-[#ea580c] bg-orange-50 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }">
                  Mis Alquileres
                </a>
              ` : ''}

              ${isProvider || isAdmin ? `
                <a href="#/provider" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeRoute === 'provider' ? 'text-[#ea580c] bg-orange-50 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }">
                  Panel Proveedor
                </a>
              ` : ''}

              ${isAdmin ? `
                <a href="#/admin" class="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeRoute === 'admin' ? 'text-[#ea580c] bg-orange-50 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }">
                  Panel Admin
                </a>
              ` : ''}
            </div>

            <!-- Mode Tag -->
            <div class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200" title="Funcionando en modo interactivo independiente (Stitch)">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Stitch Mock</span>
            </div>

            ${isAuth ? `
              <!-- Authenticated User Dropdown / Info -->
              <div class="flex items-center gap-3 pl-2 border-l border-slate-200">
                <button class="relative p-1.5 text-slate-500 hover:text-slate-800 transition-colors" title="Notificaciones">
                  ${renderIcon('Bell', 'w-4 h-4')}
                  <span class="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#ea580c]"></span>
                </button>

                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold font-display">
                    ${user?.username ? user.username.substring(0, 2).toUpperCase() : 'JP'}
                  </div>
                  <div class="hidden sm:block text-left text-xs">
                    <div class="font-bold text-slate-900 leading-tight">${user?.username}</div>
                    <div class="text-[10px] text-slate-500 font-medium">
                      ${isAdmin ? 'Administrador' : (isProvider ? 'Proveedor' : 'Cliente')}
                    </div>
                  </div>
                </div>

                <button id="btn-logout" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors" title="Cerrar Sesión">
                  ${renderIcon('LogOut', 'w-4 h-4')}
                </button>
              </div>
            ` : `
              <!-- Guest Login Button -->
              <button id="btn-nav-login" class="btn-primary !px-5 !py-2 text-xs">
                Iniciar sesión
              </button>
            `}

            <!-- Mobile Hamburger Toggle -->
            <button id="mobile-menu-btn" class="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100">
              ${renderIcon('Menu', 'w-5 h-5')}
            </button>

          </div>

        </div>
      </div>

      <!-- Mobile Menu Dropdown -->
      <div id="mobile-menu" class="hidden md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
        <a href="#/catalog" class="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100">Catálogo</a>
        <a href="#/client" class="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100">Mis Alquileres</a>
        ${isProvider || isAdmin ? `<a href="#/provider" class="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100">Panel Proveedor</a>` : ''}
        ${isAdmin ? `<a href="#/admin" class="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100">Panel Administrador</a>` : ''}
        <div class="pt-2 border-t border-slate-200 mt-2">
          ${isAuth ? `
            <button id="mobile-btn-logout" class="w-full text-left px-3 py-2 text-sm text-rose-600 font-medium">Cerrar Sesión</button>
          ` : `
            <button id="mobile-btn-login" class="btn-primary w-full">Iniciar sesión</button>
          `}
        </div>
      </div>
    </header>
  `;

  // Handlers
  container.querySelector('#btn-logout')?.addEventListener('click', () => { auth.logout(); window.location.hash = '#/catalog'; });
  container.querySelector('#mobile-btn-logout')?.addEventListener('click', () => { auth.logout(); window.location.hash = '#/catalog'; });
  container.querySelector('#btn-nav-login')?.addEventListener('click', () => openAuthModal('login'));
  container.querySelector('#mobile-btn-login')?.addEventListener('click', () => openAuthModal('login'));

  const mobToggle = container.querySelector('#mobile-menu-btn');
  const mobMenu = container.querySelector('#mobile-menu');
  if (mobToggle && mobMenu) {
    mobToggle.addEventListener('click', () => mobMenu.classList.toggle('hidden'));
  }

  // Global search enter
  const globalSearch = container.querySelector('#navbar-global-search');
  if (globalSearch) {
    globalSearch.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        window.location.hash = `#/catalog?q=${encodeURIComponent(globalSearch.value)}`;
      }
    });
  }
}
