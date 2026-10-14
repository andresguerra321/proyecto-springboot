import auth from '../auth/state.js';
import modal from './modal.js';
import showToast from './toast.js';
import loginImg from '../assets/login.png';
import { renderIcon, renderToolRentMark } from '../utils/icons.js';

export function openAuthModal(initialTab = 'login', initialRole = 'ROLE_CLIENTE') {
  let currentTab = initialTab; // 'login' or 'register'
  let selectedRole = initialRole; // ROLE_CLIENTE or ROLE_PROVEEDOR

  const content = document.createElement('div');
  content.className = 'w-full';

  function renderView() {
    content.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 min-h-[580px] overflow-hidden">
        
        <!-- Left Side: Auth Form -->
        <div class="p-8 sm:p-10 flex flex-col justify-between bg-white">
          <div>
            <!-- ToolRent Brand Header (Official Architectural Mark) -->
            <div class="flex items-center gap-3 mb-6">
              ${renderToolRentMark('w-9 h-9')}
              <div>
                <span class="text-xl font-bold tracking-tight text-slate-900 font-display">ToolRent</span>
                <p class="text-[10px] text-slate-500 leading-tight">Herramientas y maquinaria para construir grandes proyectos</p>
              </div>
            </div>

            <!-- Tab Switcher (Pill style) -->
            <div class="flex bg-slate-100 p-1 rounded-xl mb-6 max-w-xs">
              <button id="auth-tab-login" class="flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentTab === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }">
                Login
              </button>
              <button id="auth-tab-register" class="flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentTab === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }">
                Registro
              </button>
            </div>

            <!-- Header Titles -->
            <div class="mb-5">
              <h2 class="text-xl font-bold text-slate-900 font-display">
                ${currentTab === 'login' ? 'Inicia sesión en tu cuenta' : 'Crea tu cuenta'}
              </h2>
              <p class="text-xs text-slate-500 mt-1">
                ${currentTab === 'login'
                  ? 'Ingresa tus credenciales para acceder a la plataforma y gestionar tus alquileres.'
                  : 'Únete a ToolRent y comienza a alquilar o publicar equipos de construcción en todo Colombia.'}
              </p>
            </div>

            <!-- Form -->
            <form id="toolrent-auth-form" class="space-y-3.5">
              ${currentTab === 'register' ? `
                <div>
                  <div class="relative">
                    <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      ${renderIcon('User', 'w-4 h-4')}
                    </span>
                    <input type="text" id="reg-name" required placeholder="Nombre completo" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
                  </div>
                </div>
              ` : ''}

              <div>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    ${renderIcon('Mail', 'w-4 h-4')}
                  </span>
                  <input type="text" id="auth-email" required placeholder="Correo electrónico o usuario" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
                </div>
              </div>

              <div>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    ${renderIcon('Lock', 'w-4 h-4')}
                  </span>
                  <input type="password" id="auth-pass" required placeholder="Contraseña" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg pl-9 pr-9 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
                  <button type="button" id="btn-toggle-pass" class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                    ${renderIcon('Eye', 'w-4 h-4')}
                  </button>
                </div>
              </div>

              ${currentTab === 'register' ? `
                <div class="pt-1">
                  <label class="block text-xs font-semibold text-slate-700 mb-2">¿Qué rol te identifica?</label>
                  <div class="grid grid-cols-2 gap-3" id="role-cards-wrapper">
                    
                    <!-- Card Cliente -->
                    <div id="role-card-client" class="border-2 ${
                      selectedRole === 'ROLE_CLIENTE' ? 'border-brand-500 bg-orange-50/20' : 'border-slate-200 bg-white'
                    } rounded-xl p-3 cursor-pointer flex flex-col justify-between transition-all">
                      <div class="flex items-center justify-between mb-2">
                        <div class="text-slate-700">
                          ${renderIcon('User', 'w-4 h-4')}
                        </div>
                        <div class="w-4 h-4 rounded-full border ${
                          selectedRole === 'ROLE_CLIENTE' ? 'border-brand-500 flex items-center justify-center' : 'border-slate-300'
                        }">
                          ${selectedRole === 'ROLE_CLIENTE' ? '<span class="w-2 h-2 rounded-full bg-brand-500"></span>' : ''}
                        </div>
                      </div>
                      <div>
                        <div class="text-xs font-bold text-slate-900">Cliente</div>
                        <div class="text-[10px] text-slate-500">Quiero alquilar equipos</div>
                      </div>
                    </div>

                    <!-- Card Proveedor -->
                    <div id="role-card-provider" class="border-2 ${
                      selectedRole === 'ROLE_PROVEEDOR' ? 'border-brand-500 bg-orange-50/20' : 'border-slate-200 bg-white'
                    } rounded-xl p-3 cursor-pointer flex flex-col justify-between transition-all">
                      <div class="flex items-center justify-between mb-2">
                        <div class="text-slate-700">
                          ${renderIcon('Building2', 'w-4 h-4')}
                        </div>
                        <div class="w-4 h-4 rounded-full border ${
                          selectedRole === 'ROLE_PROVEEDOR' ? 'border-brand-500 flex items-center justify-center' : 'border-slate-300'
                        }">
                          ${selectedRole === 'ROLE_PROVEEDOR' ? '<span class="w-2 h-2 rounded-full bg-brand-500"></span>' : ''}
                        </div>
                      </div>
                      <div>
                        <div class="text-xs font-bold text-slate-900">Proveedor</div>
                        <div class="text-[10px] text-slate-500">Quiero publicar mis equipos</div>
                      </div>
                    </div>

                  </div>
                </div>
              ` : ''}

              <div id="auth-error-msg" class="hidden text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg"></div>

              <button type="submit" id="auth-submit-btn" class="btn-primary w-full !py-2.5 text-xs font-semibold shadow-sm mt-2">
                ${currentTab === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </button>
            </form>
          </div>

          <!-- Bottom Footer Link -->
          <div class="text-center text-xs text-slate-500 pt-4 border-t border-slate-100 mt-4">
            ${currentTab === 'login'
              ? '¿No tienes una cuenta? <button id="btn-switch-tab" class="font-semibold text-brand-600 hover:text-brand-700">Regístrate</button>'
              : '¿Ya tienes una cuenta? <button id="btn-switch-tab" class="font-semibold text-brand-600 hover:text-brand-700">Inicia sesión</button>'}
          </div>
        </div>

        <!-- Right Side: Heavy Machinery Hero Showcase matching img/web/login.png -->
        <div class="relative hidden md:block overflow-hidden bg-slate-900 select-none">
          <img src="${loginImg}" class="w-full h-full object-cover object-center" alt="ToolRent Maquinaria y Equipos" />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex flex-col justify-end p-10 text-white">
            <h2 class="text-2xl lg:text-3xl font-extrabold leading-tight font-display mb-3 text-white">
              La maquinaria que tu proyecto necesita, cuando la necesitas.
            </h2>
            <p class="text-xs lg:text-sm text-slate-200 max-w-md">
              Alquila equipos de construcción de forma segura, rápida y sin complicaciones en toda Colombia.
            </p>
          </div>
        </div>

      </div>
    `;

    // Tab switching
    content.querySelector('#auth-tab-login')?.addEventListener('click', () => { currentTab = 'login'; renderView(); });
    content.querySelector('#auth-tab-register')?.addEventListener('click', () => { currentTab = 'register'; renderView(); });
    content.querySelector('#btn-switch-tab')?.addEventListener('click', () => {
      currentTab = currentTab === 'login' ? 'register' : 'login';
      renderView();
    });

    // Password toggle
    content.querySelector('#btn-toggle-pass')?.addEventListener('click', () => {
      const pass = content.querySelector('#auth-pass');
      if (pass) pass.type = pass.type === 'password' ? 'text' : 'password';
    });

    // Role selector in register tab
    content.querySelector('#role-card-client')?.addEventListener('click', () => {
      selectedRole = 'ROLE_CLIENTE';
      renderView();
    });
    content.querySelector('#role-card-provider')?.addEventListener('click', () => {
      selectedRole = 'ROLE_PROVEEDOR';
      renderView();
    });

    // Form submit
    content.querySelector('#toolrent-auth-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      submitForm();
    });
  }

  async function submitForm() {
    const errorBox = content.querySelector('#auth-error-msg');
    const submitBtn = content.querySelector('#auth-submit-btn');
    errorBox.classList.add('hidden');
    submitBtn.disabled = true;

    try {
      const username = content.querySelector('#auth-email')?.value.trim();
      const password = content.querySelector('#auth-pass')?.value;

      if (currentTab === 'login') {
        const result = await auth.login(username, password);
        showToast(`¡Bienvenido de nuevo, ${username}!`, 'success');
        modal.close();

        // Redirect based on role
        if (result.roles?.includes('ROLE_ADMIN')) {
          window.location.hash = '#/admin';
        } else if (result.roles?.includes('ROLE_PROVEEDOR')) {
          window.location.hash = '#/provider';
        } else {
          window.location.hash = '#/catalog';
        }
      } else {
        const fullName = content.querySelector('#reg-name')?.value.trim();
        await auth.register({
          username,
          email: username.includes('@') ? username : `${username}@ejemplo.com`,
          password,
          role: selectedRole,
          fullName
        });
        showToast('¡Cuenta creada exitosamente en ToolRent!', 'success');
        modal.close();
      }
    } catch (err) {
      errorBox.textContent = err.message || 'Error durante la autenticación';
      errorBox.classList.remove('hidden');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  }

  renderView();

  modal.open({
    title: '',
    content,
    maxWidth: 'max-w-4xl',
    hideHeader: true
  });
}

export default openAuthModal;
