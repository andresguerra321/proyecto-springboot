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
    <nav class="sticky top-0 z-40 bg-surface-950/80 backdrop-blur-xl border-b border-slate-800/80 transition-all duration-300">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          
          <!-- Logo & Brand -->
          <div class="flex items-center gap-8">
            <a href="#/catalog" class="flex items-center gap-3 group">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                ${renderIcon('Wrench', 'w-5 h-5')}
              </div>
              <div>
                <span class="text-xl font-extrabold tracking-tight font-display text-white group-hover:text-brand-400 transition-colors">
                  Renta<span class="text-brand-500">Maq</span>
                </span>
                <span class="hidden sm:block text-[10px] font-semibold text-slate-400 tracking-wider uppercase -mt-1">
                  Equipos Industriales
                </span>
              </div>
            </a>

            <!-- Navigation Links (Desktop) -->
            <div class="hidden md:flex items-center gap-1">
              <a href="#/catalog" id="nav-catalog" class="px-3.5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                activeRoute === 'catalog' 
                  ? 'bg-slate-800/80 text-brand-400 border border-slate-700/60 shadow-inner' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }">
                ${renderIcon('LayoutGrid', 'w-4 h-4')} Catálogo
              </a>

              ${isClient || !isAuth ? `
                <a href="#/client" id="nav-client" class="px-3.5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeRoute === 'client' 
                    ? 'bg-slate-800/80 text-brand-400 border border-slate-700/60 shadow-inner' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                }">
                  ${renderIcon('Calendar', 'w-4 h-4')} Mis Alquileres
                </a>
              ` : ''}

              ${isProvider || isAdmin ? `
                <a href="#/provider" id="nav-provider" class="px-3.5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeRoute === 'provider' 
                    ? 'bg-slate-800/80 text-brand-400 border border-slate-700/60 shadow-inner' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                }">
                  ${renderIcon('Truck', 'w-4 h-4')} Panel Proveedor
                </a>
              ` : ''}

              ${isAdmin ? `
                <a href="#/admin" id="nav-admin" class="px-3.5 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeRoute === 'admin' 
                    ? 'bg-slate-800/80 text-brand-400 border border-slate-700/60 shadow-inner' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                }">
                  ${renderIcon('ShieldCheck', 'w-4 h-4')} Panel Admin
                </a>
              ` : ''}
            </div>
          </div>

          <!-- User Session / Action Buttons -->
          <div class="hidden md:flex items-center gap-3">
            ${isAuth ? `
              <!-- Authenticated User Menu -->
              <div class="flex items-center gap-3 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl">
                <div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-brand-400 font-bold text-xs uppercase border border-slate-700">
                  ${user?.username ? user.username.substring(0, 2) : 'US'}
                </div>
                <div class="text-left text-xs">
                  <div class="font-semibold text-white truncate max-w-[120px]">${user?.username}</div>
                  <div class="text-[10px] text-brand-400 font-mono">
                    ${isAdmin ? 'ADMIN' : (isProvider ? 'PROVEEDOR' : 'CLIENTE')}
                  </div>
                </div>
                <button id="btn-logout" class="ml-2 text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800/60 transition-colors" title="Cerrar Sesión">
                  ${renderIcon('LogOut', 'w-4 h-4')}
                </button>
              </div>
            ` : `
              <!-- Guest Action Buttons -->
              <button id="btn-nav-login" class="btn-secondary !py-2 text-xs">
                ${renderIcon('LogIn', 'w-3.5 h-3.5')} Iniciar Sesión
              </button>
              <button id="btn-nav-register" class="btn-primary !py-2 text-xs">
                ${renderIcon('UserPlus', 'w-3.5 h-3.5')} Registrarse
              </button>
            `}
          </div>

          <!-- Mobile Hamburger Toggle -->
          <div class="flex md:hidden items-center">
            <button id="mobile-menu-btn" class="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 focus:outline-none">
              ${renderIcon('Menu', 'w-6 h-6')}
            </button>
          </div>

        </div>
      </div>

      <!-- Mobile Dropdown Menu -->
      <div id="mobile-menu" class="hidden md:hidden border-t border-slate-800 bg-surface-950 px-4 pt-2 pb-4 space-y-1">
        <a href="#/catalog" class="block px-3 py-2 rounded-xl text-base font-medium text-slate-200 hover:bg-slate-800">
          Catálogo de Herramientas
        </a>
        <a href="#/client" class="block px-3 py-2 rounded-xl text-base font-medium text-slate-200 hover:bg-slate-800">
          Mis Alquileres
        </a>
        ${isProvider || isAdmin ? `
          <a href="#/provider" class="block px-3 py-2 rounded-xl text-base font-medium text-slate-200 hover:bg-slate-800">
            Panel Proveedor
          </a>
        ` : ''}
        ${isAdmin ? `
          <a href="#/admin" class="block px-3 py-2 rounded-xl text-base font-medium text-slate-200 hover:bg-slate-800">
            Panel Administrador
          </a>
        ` : ''}
        
        <div class="pt-4 border-t border-slate-800 flex flex-col gap-2">
          ${isAuth ? `
            <div class="flex items-center justify-between px-3 py-2 text-sm text-slate-300">
              <span>Sesión activa: <strong class="text-white">${user?.username}</strong></span>
              <button id="mobile-btn-logout" class="text-rose-400 font-medium">Cerrar Sesión</button>
            </div>
          ` : `
            <button id="mobile-btn-login" class="btn-secondary w-full">Iniciar Sesión</button>
            <button id="mobile-btn-register" class="btn-primary w-full">Registrarse</button>
          `}
        </div>
      </div>
    </nav>
  `;

  // Attach event handlers
  const logoutBtn = container.querySelector('#btn-logout');
  if (logoutBtn) logoutBtn.addEventListener('click', () => { auth.logout(); window.location.hash = '#/catalog'; });

  const mobileLogoutBtn = container.querySelector('#mobile-btn-logout');
  if (mobileLogoutBtn) mobileLogoutBtn.addEventListener('click', () => { auth.logout(); window.location.hash = '#/catalog'; });

  const loginBtn = container.querySelector('#btn-nav-login');
  if (loginBtn) loginBtn.addEventListener('click', () => openAuthModal('login'));

  const registerBtn = container.querySelector('#btn-nav-register');
  if (registerBtn) registerBtn.addEventListener('click', () => openAuthModal('register'));

  const mobileLoginBtn = container.querySelector('#mobile-btn-login');
  if (mobileLoginBtn) mobileLoginBtn.addEventListener('click', () => openAuthModal('login'));

  const mobileRegisterBtn = container.querySelector('#mobile-btn-register');
  if (mobileRegisterBtn) mobileRegisterBtn.addEventListener('click', () => openAuthModal('register'));

  const mobileToggle = container.querySelector('#mobile-menu-btn');
  const mobileMenu = container.querySelector('#mobile-menu');
  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }
}
