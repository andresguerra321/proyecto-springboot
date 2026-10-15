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
      <div class="grid grid-cols-1 md:grid-cols-2 max-h-[88vh] overflow-hidden">
        
        <!-- Left Side: Auth Form -->
        <div class="p-5 sm:p-7 flex flex-col justify-between bg-white overflow-y-auto max-h-[88vh]">
          <div>
            <!-- Brand Header -->
            <div class="flex items-center gap-2.5 mb-4 select-none">
              ${renderToolRentMark('w-8 h-8')}
              <div>
                <span class="text-lg font-bold tracking-tight text-slate-900 font-display">ToolRent</span>
                <p class="text-[10px] text-slate-500 leading-tight">Plataforma de alquiler de maquinaria y herramientas</p>
              </div>
            </div>

            <!-- Tab Switcher (Corporate Segmented Pill) -->
            <div class="flex bg-slate-100 p-1 rounded-xl mb-4 max-w-xs border border-slate-200/80">
              <button type="button" id="auth-tab-login" class="flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                currentTab === 'login' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }">
                Iniciar sesión
              </button>
              <button type="button" id="auth-tab-register" class="flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                currentTab === 'register' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }">
                Crear cuenta
              </button>
            </div>

            <!-- Header Title -->
            <div class="mb-3.5">
              <h2 class="text-lg font-bold text-slate-900 font-display">
                ${currentTab === 'login' ? 'Acceso a la plataforma' : 'Registro de usuario'}
              </h2>
              <p class="text-xs text-slate-500 mt-0.5">
                ${currentTab === 'login'
                  ? 'Ingresa tus credenciales corporativas para gestionar tus reservas.'
                  : 'Ingresa los datos básicos para habilitar tu cuenta en ToolRent.'}
              </p>
            </div>

            <!-- Form -->
            <form id="toolrent-auth-form" class="space-y-2.5" novalidate>
              ${currentTab === 'login' ? `
                <!-- Login Fields -->
                <div>
                  <label class="block text-[11px] font-semibold text-slate-700 mb-1">Usuario o Correo corporativo</label>
                  <div class="relative">
                    <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      ${renderIcon('Mail', 'w-4 h-4')}
                    </span>
                    <input type="text" id="login-username" required autocomplete="username" placeholder="ej. carlos_gomez o cliente@empresa.com" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
                  </div>
                </div>

                <div>
                  <label class="block text-[11px] font-semibold text-slate-700 mb-1">Contraseña</label>
                  <div class="relative">
                    <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      ${renderIcon('Lock', 'w-4 h-4')}
                    </span>
                    <input type="password" id="login-password" required autocomplete="current-password" placeholder="••••••••" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg pl-9 pr-9 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
                    <button type="button" id="btn-toggle-login-pass" class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer">
                      ${renderIcon('Eye', 'w-4 h-4')}
                    </button>
                  </div>
                </div>
              ` : `
                <!-- Registration: Credenciales de acceso -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label class="block text-[11px] font-semibold text-slate-700 mb-0.5">Nombre de usuario *</label>
                    <input type="text" id="reg-username" required maxlength="30" autocomplete="username" placeholder="ej. carlos_gomez" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors" />
                  </div>

                  <div>
                    <label class="block text-[11px] font-semibold text-slate-700 mb-0.5">Correo electrónico *</label>
                    <input type="email" id="reg-email" required maxlength="60" autocomplete="email" placeholder="carlos@empresa.com" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors" />
                  </div>
                </div>

                <div>
                  <label class="block text-[11px] font-semibold text-slate-700 mb-0.5">Contraseña *</label>
                  <div class="relative">
                    <input type="password" id="reg-password" required maxlength="50" autocomplete="new-password" placeholder="Mínimo 6 caracteres" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg pl-2.5 pr-8 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors" />
                    <button type="button" id="btn-toggle-reg-pass" class="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer">
                      ${renderIcon('Eye', 'w-3.5 h-3.5')}
                    </button>
                  </div>
                </div>

                <!-- Selector de Rol Corporativo (Minimalista, sin emojis) -->
                <div class="pt-1 space-y-1">
                  <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tipo de cuenta *</label>
                  <div class="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200/80 gap-1 select-none" id="role-selector-wrapper">
                    
                    <button 
                      type="button" 
                      id="role-btn-client" 
                      class="py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        selectedRole === 'ROLE_CLIENTE'
                          ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }"
                    >
                      ${renderIcon('User', 'w-3.5 h-3.5 text-slate-400')}
                      <span>Cliente (Alquilar)</span>
                    </button>

                    <button 
                      type="button" 
                      id="role-btn-provider" 
                      class="py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        selectedRole === 'ROLE_PROVEEDOR'
                          ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }"
                    >
                      ${renderIcon('Building2', 'w-3.5 h-3.5 text-slate-400')}
                      <span>Proveedor (Publicar)</span>
                    </button>

                  </div>
                </div>

                <!-- Campos de Perfil Simplificados -->
                <div id="dynamic-profile-fields" class="space-y-2 pt-1 border-t border-slate-100">
                  ${renderProfileFieldsHTML(selectedRole)}
                </div>
              `}

              <div id="auth-error-msg" class="hidden text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg"></div>

              <button type="submit" id="auth-submit-btn" class="w-full py-2.5 px-4 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer mt-2">
                ${currentTab === 'login' 
                  ? 'Iniciar sesión' 
                  : (selectedRole === 'ROLE_PROVEEDOR' ? 'Crear cuenta de Proveedor' : 'Crear cuenta de Cliente')}
              </button>
            </form>
          </div>

          <!-- Bottom Footer Link -->
          <div class="text-center text-xs text-slate-500 pt-3 border-t border-slate-100 mt-2">
            ${currentTab === 'login'
              ? '¿No tienes una cuenta? <button type="button" id="btn-switch-tab" class="font-semibold text-[#ea580c] hover:underline cursor-pointer">Regístrate</button>'
              : '¿Ya tienes una cuenta? <button type="button" id="btn-switch-tab" class="font-semibold text-[#ea580c] hover:underline cursor-pointer">Inicia sesión</button>'}
          </div>
        </div>

        <!-- Right Side: Heavy Machinery Hero Showcase -->
        <div class="relative hidden md:block overflow-hidden bg-slate-900 select-none">
          <img src="${loginImg}" class="w-full h-full object-cover object-center" alt="ToolRent Maquinaria y Equipos" />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent flex flex-col justify-end p-8 text-white">
            <h3 class="text-xl font-bold leading-tight font-display mb-1.5 text-white">
              Alquiler industrial con garantía y contrato digital
            </h3>
            <p class="text-xs text-slate-300 max-w-sm leading-relaxed">
              Disponibilidad inmediata, entrega en obra y facturación electrónica oficial en toda Colombia.
            </p>
          </div>
        </div>

      </div>
    `;

    // Dynamic Profile Fields Generator (Simplificado & Corporativo)
    function renderProfileFieldsHTML(role) {
      if (role === 'ROLE_CLIENTE') {
        return `
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] font-semibold text-slate-700 mb-0.5">Nombre y Apellidos *</label>
              <input type="text" id="reg-fullName" required maxlength="60" autocomplete="name" placeholder="ej. Carlos Gómez" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors" />
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-700 mb-0.5">Teléfono de contacto *</label>
              <input type="tel" id="reg-phone" required maxlength="15" inputmode="tel" autocomplete="tel" placeholder="ej. 3001234567" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors" />
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] font-semibold text-slate-700 mb-0.5">Documento de identidad *</label>
              <input type="text" id="reg-docNumber" required maxlength="20" inputmode="numeric" placeholder="C.C. o NIT (ej. 1020304050)" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors" />
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-700 mb-0.5">Ciudad de operación *</label>
              <input type="text" id="reg-city" required maxlength="40" autocomplete="address-level2" placeholder="ej. Bogotá" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors" />
            </div>
          </div>
        `;
      } else {
        return `
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] font-semibold text-slate-700 mb-0.5">Razón Social / Empresa *</label>
              <input type="text" id="reg-companyName" required maxlength="80" autocomplete="organization" placeholder="ej. Maquinaria y Equipos S.A.S." class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors" />
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-700 mb-0.5">NIT o RUT *</label>
              <input type="text" id="reg-taxId" required maxlength="20" inputmode="numeric" placeholder="ej. 901234567-8" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors" />
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] font-semibold text-slate-700 mb-0.5">Contacto o Representante *</label>
              <input type="text" id="reg-fullName" required maxlength="60" autocomplete="name" placeholder="ej. Laura Sánchez" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors" />
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-700 mb-0.5">Teléfono corporativo *</label>
              <input type="tel" id="reg-phone" required maxlength="15" inputmode="tel" autocomplete="tel" placeholder="ej. 3109876543" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors" />
            </div>
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-700 mb-0.5">Ciudad de sede principal *</label>
            <input type="text" id="reg-city" required maxlength="40" autocomplete="address-level2" placeholder="ej. Medellín" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors" />
          </div>
        `;
      }
    }

    // Input sanitizers
    function bindInputFilters(root) {
      if (!root) return;

      const userInput = root.querySelector('#reg-username');
      if (userInput && !userInput._filterBound) {
        userInput._filterBound = true;
        userInput.addEventListener('input', (e) => {
          const clean = e.target.value.replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 30);
          if (e.target.value !== clean) e.target.value = clean;
        });
      }

      const emailInput = root.querySelector('#reg-email');
      if (emailInput && !emailInput._filterBound) {
        emailInput._filterBound = true;
        emailInput.addEventListener('input', (e) => {
          const clean = e.target.value.replace(/\s+/g, '').slice(0, 60);
          if (e.target.value !== clean) e.target.value = clean;
        });
      }

      const passInput = root.querySelector('#reg-password');
      if (passInput && !passInput._filterBound) {
        passInput._filterBound = true;
        passInput.addEventListener('input', (e) => {
          if (e.target.value.length > 50) e.target.value = e.target.value.slice(0, 50);
        });
      }

      const nameInput = root.querySelector('#reg-fullName');
      if (nameInput && !nameInput._filterBound) {
        nameInput._filterBound = true;
        nameInput.addEventListener('input', (e) => {
          const clean = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]/g, '').slice(0, 60);
          if (e.target.value !== clean) e.target.value = clean;
        });
      }

      const phoneInput = root.querySelector('#reg-phone');
      if (phoneInput && !phoneInput._filterBound) {
        phoneInput._filterBound = true;
        phoneInput.addEventListener('input', (e) => {
          const clean = e.target.value.replace(/[^0-9+\s()-]/g, '').slice(0, 15);
          if (e.target.value !== clean) e.target.value = clean;
        });
      }

      const docInput = root.querySelector('#reg-docNumber');
      if (docInput && !docInput._filterBound) {
        docInput._filterBound = true;
        docInput.addEventListener('input', (e) => {
          const clean = e.target.value.replace(/[^a-zA-Z0-9.-]/g, '').slice(0, 20);
          if (e.target.value !== clean) e.target.value = clean;
        });
      }

      const taxInput = root.querySelector('#reg-taxId');
      if (taxInput && !taxInput._filterBound) {
        taxInput._filterBound = true;
        taxInput.addEventListener('input', (e) => {
          const clean = e.target.value.replace(/[^0-9.-]/g, '').slice(0, 20);
          if (e.target.value !== clean) e.target.value = clean;
        });
      }

      const cityInput = root.querySelector('#reg-city');
      if (cityInput && !cityInput._filterBound) {
        cityInput._filterBound = true;
        cityInput.addEventListener('input', (e) => {
          const clean = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.-]/g, '').slice(0, 40);
          if (e.target.value !== clean) e.target.value = clean;
        });
      }
    }

    // Tab switching
    content.querySelector('#auth-tab-login')?.addEventListener('click', () => { currentTab = 'login'; renderView(); });
    content.querySelector('#auth-tab-register')?.addEventListener('click', () => { currentTab = 'register'; renderView(); });
    content.querySelector('#btn-switch-tab')?.addEventListener('click', () => {
      currentTab = currentTab === 'login' ? 'register' : 'login';
      renderView();
    });

    // Password toggles
    content.querySelector('#btn-toggle-login-pass')?.addEventListener('click', () => {
      const pass = content.querySelector('#login-password');
      if (pass) pass.type = pass.type === 'password' ? 'text' : 'password';
    });
    content.querySelector('#btn-toggle-reg-pass')?.addEventListener('click', () => {
      const pass = content.querySelector('#reg-password');
      if (pass) pass.type = pass.type === 'password' ? 'text' : 'password';
    });

    // Role switcher events
    content.querySelector('#role-btn-client')?.addEventListener('click', () => {
      if (selectedRole !== 'ROLE_CLIENTE') {
        selectedRole = 'ROLE_CLIENTE';
        renderView();
      }
    });
    content.querySelector('#role-btn-provider')?.addEventListener('click', () => {
      if (selectedRole !== 'ROLE_PROVEEDOR') {
        selectedRole = 'ROLE_PROVEEDOR';
        renderView();
      }
    });

    // Form submit
    content.querySelector('#toolrent-auth-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      submitForm();
    });

    // Apply live input restrictions
    bindInputFilters(content);
  }

  async function submitForm() {
    const errorBox = content.querySelector('#auth-error-msg');
    const submitBtn = content.querySelector('#auth-submit-btn');
    errorBox.classList.add('hidden');
    errorBox.textContent = '';

    if (currentTab === 'login') {
      const username = content.querySelector('#login-username')?.value.trim();
      const password = content.querySelector('#login-password')?.value;

      if (!username || !password) {
        errorBox.textContent = 'Por favor ingresa tu usuario y contraseña.';
        errorBox.classList.remove('hidden');
        return;
      }

      submitBtn.disabled = true;
      try {
        const result = await auth.login(username, password);
        showToast(`¡Bienvenido de nuevo, ${username}!`, 'success');
        modal.close();

        if (result.roles?.some(r => r.includes('ADMIN'))) {
          window.location.hash = '#/admin';
        } else if (result.roles?.some(r => r.includes('PROVEEDOR'))) {
          window.location.hash = '#/provider';
        } else {
          window.location.hash = '#/catalog';
        }
      } catch (err) {
        errorBox.textContent = err.message || 'Credenciales inválidas o error de conexión';
        errorBox.classList.remove('hidden');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    } else {
      // REGISTRATION VALIDATION
      const username = content.querySelector('#reg-username')?.value.trim();
      const email = content.querySelector('#reg-email')?.value.trim();
      const password = content.querySelector('#reg-password')?.value;
      const fullName = content.querySelector('#reg-fullName')?.value.trim();
      const phone = content.querySelector('#reg-phone')?.value.trim();
      const city = content.querySelector('#reg-city')?.value.trim();

      if (!username || username.length < 3 || username.length > 30) {
        errorBox.textContent = 'El nombre de usuario debe tener entre 3 y 30 caracteres.';
        errorBox.classList.remove('hidden');
        return;
      }
      if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
        errorBox.textContent = 'El nombre de usuario no puede contener espacios ni caracteres especiales.';
        errorBox.classList.remove('hidden');
        return;
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 60) {
        errorBox.textContent = 'Por favor ingresa un correo electrónico válido.';
        errorBox.classList.remove('hidden');
        return;
      }
      if (!password || password.length < 6 || password.length > 50) {
        errorBox.textContent = 'La contraseña debe contener al menos 6 caracteres.';
        errorBox.classList.remove('hidden');
        return;
      }
      if (!fullName || fullName.length < 3 || fullName.length > 60) {
        errorBox.textContent = 'El nombre o persona de contacto es obligatorio (mínimo 3 caracteres).';
        errorBox.classList.remove('hidden');
        return;
      }
      const phoneDigits = phone ? phone.replace(/\D/g, '') : '';
      if (!phone || phoneDigits.length < 7 || phoneDigits.length > 15) {
        errorBox.textContent = 'El teléfono debe contener entre 7 y 15 dígitos numéricos.';
        errorBox.classList.remove('hidden');
        return;
      }
      if (!city || city.length < 2 || city.length > 40) {
        errorBox.textContent = 'La ciudad es obligatoria.';
        errorBox.classList.remove('hidden');
        return;
      }

      let documentType = 'CC';
      let documentNumber = '';
      let companyName = '';
      let taxId = '';
      const address = `${city}, Colombia`;

      if (selectedRole === 'ROLE_CLIENTE') {
        documentNumber = content.querySelector('#reg-docNumber')?.value.trim();
        if (!documentNumber || documentNumber.length < 5 || documentNumber.length > 20) {
          errorBox.textContent = 'El número de documento debe tener entre 5 y 20 caracteres.';
          errorBox.classList.remove('hidden');
          return;
        }
      } else {
        companyName = content.querySelector('#reg-companyName')?.value.trim();
        taxId = content.querySelector('#reg-taxId')?.value.trim();
        if (!companyName || companyName.length < 3 || companyName.length > 80) {
          errorBox.textContent = 'La razón social o nombre de la empresa es obligatorio.';
          errorBox.classList.remove('hidden');
          return;
        }
        if (!taxId || taxId.length < 5 || taxId.length > 20) {
          errorBox.textContent = 'El NIT o RUT de la empresa es obligatorio (ej. 901234567-8).';
          errorBox.classList.remove('hidden');
          return;
        }
      }

      submitBtn.disabled = true;
      try {
        await auth.register({
          username,
          email,
          password,
          role: selectedRole,
          fullName,
          documentType,
          documentNumber: documentNumber || `CLI-${Date.now().toString().slice(-6)}`,
          phone,
          address,
          city,
          companyName: companyName || fullName,
          taxId: taxId || documentNumber || '900000000-1'
        });

        showToast(`¡Cuenta ${selectedRole === 'ROLE_PROVEEDOR' ? 'de Proveedor' : 'de Cliente'} creada exitosamente!`, 'success');
        modal.close();

        if (selectedRole === 'ROLE_PROVEEDOR') {
          window.location.hash = '#/provider';
        } else {
          window.location.hash = '#/catalog';
        }
      } catch (err) {
        errorBox.textContent = err.message || 'Error al crear la cuenta en el servidor.';
        errorBox.classList.remove('hidden');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
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
