import auth from '../auth/state.js';
import modal from './modal.js';
import showToast from './toast.js';
import { renderIcon } from '../utils/icons.js';

export function openAuthModal(initialTab = 'login') {
  let currentTab = initialTab;

  const content = document.createElement('div');
  content.className = 'space-y-6';

  function renderTabs() {
    content.innerHTML = `
      <!-- Tab Switcher -->
      <div class="flex border-b border-slate-800 mb-6">
        <button id="tab-btn-login" class="flex-1 pb-3 text-center text-sm font-semibold transition-all border-b-2 ${
          currentTab === 'login'
            ? 'border-brand-500 text-brand-400'
            : 'border-transparent text-slate-400 hover:text-slate-200'
        }">
          ${renderIcon('LogIn', 'w-4 h-4 inline mr-1.5')} Iniciar Sesión
        </button>
        <button id="tab-btn-register" class="flex-1 pb-3 text-center text-sm font-semibold transition-all border-b-2 ${
          currentTab === 'register'
            ? 'border-brand-500 text-brand-400'
            : 'border-transparent text-slate-400 hover:text-slate-200'
        }">
          ${renderIcon('UserPlus', 'w-4 h-4 inline mr-1.5')} Crear Cuenta
        </button>
      </div>

      <!-- Quick Demo Login Presets -->
      ${currentTab === 'login' ? `
        <div class="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <p class="text-xs text-slate-400 font-medium mb-2.5 flex items-center justify-between">
            <span>⚡ Acceso Rápido para Pruebas (Credenciales Demo):</span>
          </p>
          <div class="grid grid-cols-3 gap-2">
            <button type="button" id="quick-login-admin" class="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-xs font-semibold rounded-lg text-rose-300 border border-rose-500/30 flex items-center justify-center gap-1 transition-colors">
              ${renderIcon('Shield', 'w-3.5 h-3.5')} Admin
            </button>
            <button type="button" id="quick-login-provider" class="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-xs font-semibold rounded-lg text-amber-300 border border-amber-500/30 flex items-center justify-center gap-1 transition-colors">
              ${renderIcon('Truck', 'w-3.5 h-3.5')} Proveedor
            </button>
            <button type="button" id="quick-login-client" class="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-xs font-semibold rounded-lg text-sky-300 border border-sky-500/30 flex items-center justify-center gap-1 transition-colors">
              ${renderIcon('User', 'w-3.5 h-3.5')} Cliente
            </button>
          </div>
        </div>
      ` : ''}

      <!-- Form Container -->
      <form id="auth-form" class="space-y-4">
        ${currentTab === 'login' ? `
          <!-- Login Fields -->
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1.5" for="auth-username">Usuario o Correo</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                ${renderIcon('User', 'w-4 h-4')}
              </span>
              <input type="text" id="auth-username" required class="input-field pl-10" placeholder="admin_principal" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1.5" for="auth-password">Contraseña</label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                ${renderIcon('Lock', 'w-4 h-4')}
              </span>
              <input type="password" id="auth-password" required class="input-field pl-10" placeholder="••••••••••••" />
            </div>
          </div>
        ` : `
          <!-- Register Fields -->
          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1.5">Tipo de Cuenta</label>
            <div class="grid grid-cols-2 gap-3">
              <label class="relative flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-700 bg-slate-900/60 cursor-pointer hover:border-brand-500 transition-colors">
                <input type="radio" name="auth-role" value="ROLE_CLIENTE" checked class="text-brand-500 focus:ring-brand-500">
                <span class="text-xs font-semibold text-slate-200">Cliente Particular / Obra</span>
              </label>
              <label class="relative flex items-center justify-center gap-2 p-3 rounded-xl border border-slate-700 bg-slate-900/60 cursor-pointer hover:border-brand-500 transition-colors">
                <input type="radio" name="auth-role" value="ROLE_PROVEEDOR" class="text-brand-500 focus:ring-brand-500">
                <span class="text-xs font-semibold text-slate-200">Empresa Proveedora</span>
              </label>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1.5" for="reg-username">Nombre de Usuario</label>
              <input type="text" id="reg-username" required class="input-field" placeholder="ej: constructora_norte" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1.5" for="reg-email">Correo Electrónico</label>
              <input type="email" id="reg-email" required class="input-field" placeholder="contacto@empresa.com" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1.5" for="reg-fullname">Nombre / Razón Social</label>
              <input type="text" id="reg-fullname" class="input-field" placeholder="Constructora del Norte S.A.S." />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-300 mb-1.5" for="reg-phone">Teléfono de Contacto</label>
              <input type="tel" id="reg-phone" class="input-field" placeholder="+57 310 999 8888" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-slate-300 mb-1.5" for="reg-password">Contraseña Segura</label>
            <input type="password" id="reg-password" required minlength="6" class="input-field" placeholder="Al menos 6 caracteres" />
          </div>
        `}

        <div id="auth-error-msg" class="hidden text-xs text-rose-400 bg-rose-950/50 border border-rose-900 p-2.5 rounded-xl"></div>

        <button type="submit" id="auth-submit-btn" class="btn-primary w-full mt-4 !py-3">
          ${currentTab === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta y Continuar'}
        </button>
      </form>
    `;

    // Event listeners
    content.querySelector('#tab-btn-login')?.addEventListener('click', () => { currentTab = 'login'; renderTabs(); });
    content.querySelector('#tab-btn-register')?.addEventListener('click', () => { currentTab = 'register'; renderTabs(); });

    // Quick demo buttons
    content.querySelector('#quick-login-admin')?.addEventListener('click', () => {
      content.querySelector('#auth-username').value = 'admin_principal';
      content.querySelector('#auth-password').value = 'Password123*';
      submitForm();
    });

    content.querySelector('#quick-login-provider')?.addEventListener('click', () => {
      content.querySelector('#auth-username').value = 'prov_maquinaria_bog';
      content.querySelector('#auth-password').value = 'Password123*';
      submitForm();
    });

    content.querySelector('#quick-login-client')?.addEventListener('click', () => {
      content.querySelector('#auth-username').value = 'cli_constructora_col';
      content.querySelector('#auth-password').value = 'Password123*';
      submitForm();
    });

    content.querySelector('#auth-form').addEventListener('submit', (e) => {
      e.preventDefault();
      submitForm();
    });
  }

  async function submitForm() {
    const errorBox = content.querySelector('#auth-error-msg');
    const submitBtn = content.querySelector('#auth-submit-btn');
    errorBox.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `${renderIcon('Loader2', 'w-4 h-4 animate-spin inline mr-1')} Procesando...`;

    try {
      if (currentTab === 'login') {
        const username = content.querySelector('#auth-username').value.trim();
        const password = content.querySelector('#auth-password').value;
        const user = await auth.login(username, password);
        showToast(`¡Bienvenido de nuevo, ${user.username}!`, 'success');
        modal.close();

        // Redirect based on role
        if (auth.isAdmin()) {
          window.location.hash = '#/admin';
        } else if (auth.isProvider()) {
          window.location.hash = '#/provider';
        } else {
          window.location.hash = '#/catalog';
        }
      } else {
        const role = content.querySelector('input[name="auth-role"]:checked')?.value || 'ROLE_CLIENTE';
        const username = content.querySelector('#reg-username').value.trim();
        const email = content.querySelector('#reg-email').value.trim();
        const password = content.querySelector('#reg-password').value;
        const fullName = content.querySelector('#reg-fullname').value.trim();
        const phone = content.querySelector('#reg-phone').value.trim();

        await auth.register({
          username,
          email,
          password,
          roles: [role],
          fullName,
          phone,
          companyName: fullName,
        });

        showToast('¡Cuenta creada exitosamente!', 'success');
        modal.close();

        if (role.includes('PROVEEDOR')) {
          window.location.hash = '#/provider';
        } else {
          window.location.hash = '#/catalog';
        }
      }
    } catch (err) {
      errorBox.textContent = err.message || 'Error en la solicitud de autenticación';
      errorBox.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = currentTab === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta y Continuar';
    }
  }

  renderTabs();

  modal.open({
    title: `${renderIcon('ShieldCheck', 'w-5 h-5 text-brand-400')} Acceso a la Plataforma`,
    content: content,
    maxWidth: 'max-w-md',
  });
}
