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
      <div class="grid grid-cols-1 md:grid-cols-2 min-h-[580px] max-h-[85vh] overflow-hidden">
        
        <!-- Left Side: Auth Form -->
        <div class="p-6 sm:p-8 flex flex-col justify-between bg-white overflow-y-auto">
          <div>
            <!-- ToolRent Brand Header -->
            <div class="flex items-center gap-3 mb-5">
              ${renderToolRentMark('w-9 h-9')}
              <div>
                <span class="text-xl font-bold tracking-tight text-slate-900 font-display">ToolRent</span>
                <p class="text-[10px] text-slate-500 leading-tight">Herramientas y maquinaria para construir grandes proyectos</p>
              </div>
            </div>

            <!-- Tab Switcher (Pill style) -->
            <div class="flex bg-slate-100 p-1 rounded-xl mb-5 max-w-xs">
              <button type="button" id="auth-tab-login" class="flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentTab === 'login' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }">
                Login
              </button>
              <button type="button" id="auth-tab-register" class="flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                currentTab === 'register' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }">
                Registro
              </button>
            </div>

            <!-- Header Titles -->
            <div class="mb-4">
              <h2 class="text-xl font-bold text-slate-900 font-display">
                ${currentTab === 'login' ? 'Inicia sesión en tu cuenta' : 'Crea tu cuenta empresarial o personal'}
              </h2>
              <p class="text-xs text-slate-500 mt-0.5">
                ${currentTab === 'login'
                  ? 'Ingresa tus credenciales para acceder a la plataforma y gestionar tus alquileres.'
                  : 'Únete a ToolRent y comienza a alquilar o publicar equipos de construcción en todo Colombia.'}
              </p>
            </div>

            <!-- Form -->
            <form id="toolrent-auth-form" class="space-y-3" novalidate>
              ${currentTab === 'login' ? `
                <!-- Login Fields -->
                <div>
                  <label class="block text-[11px] font-semibold text-slate-700 mb-1">Usuario o Correo electrónico</label>
                  <div class="relative">
                    <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      ${renderIcon('Mail', 'w-4 h-4')}
                    </span>
                    <input type="text" id="login-username" required placeholder="ej. carlos_gomez o cliente@correo.com" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
                  </div>
                </div>

                <div>
                  <label class="block text-[11px] font-semibold text-slate-700 mb-1">Contraseña</label>
                  <div class="relative">
                    <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      ${renderIcon('Lock', 'w-4 h-4')}
                    </span>
                    <input type="password" id="login-password" required placeholder="••••••••" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg pl-9 pr-9 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
                    <button type="button" id="btn-toggle-login-pass" class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                      ${renderIcon('Eye', 'w-4 h-4')}
                    </button>
                  </div>
                </div>
              ` : `
                <!-- Registration Fields -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label class="block text-[11px] font-semibold text-slate-700 mb-1">Nombre de usuario *</label>
                    <div class="relative">
                      <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                        ${renderIcon('User', 'w-3.5 h-3.5')}
                      </span>
                      <input type="text" id="reg-username" required placeholder="ej. carlos_gomez" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
                    </div>
                  </div>

                  <div>
                    <label class="block text-[11px] font-semibold text-slate-700 mb-1">Correo electrónico *</label>
                    <div class="relative">
                      <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                        ${renderIcon('Mail', 'w-3.5 h-3.5')}
                      </span>
                      <input type="email" id="reg-email" required placeholder="carlos@empresa.com" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
                    </div>
                  </div>
                </div>

                <div>
                  <label class="block text-[11px] font-semibold text-slate-700 mb-1">Contraseña segura *</label>
                  <div class="relative">
                    <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      ${renderIcon('Lock', 'w-3.5 h-3.5')}
                    </span>
                    <input type="password" id="reg-password" required placeholder="Mínimo 6 caracteres" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg pl-8 pr-8 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
                    <button type="button" id="btn-toggle-reg-pass" class="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600">
                      ${renderIcon('Eye', 'w-3.5 h-3.5')}
                    </button>
                  </div>
                </div>

                <!-- Role Selection -->
                <div class="pt-1">
                  <label class="block text-[11px] font-semibold text-slate-700 mb-1.5">¿Qué rol tendrás en la plataforma? *</label>
                  <div class="grid grid-cols-2 gap-2.5" id="role-cards-wrapper">
                    
                    <!-- Card Cliente -->
                    <div id="role-card-client" class="border-2 ${
                      selectedRole === 'ROLE_CLIENTE' ? 'border-[#ea580c] bg-orange-50/30 shadow-xs ring-1 ring-[#ea580c]/20' : 'border-slate-200 bg-white hover:border-slate-300'
                    } rounded-xl p-2.5 cursor-pointer flex flex-col justify-between transition-all select-none">
                      <div class="flex items-center justify-between mb-1.5">
                        <div class="role-icon-wrapper ${selectedRole === 'ROLE_CLIENTE' ? 'text-[#ea580c]' : 'text-slate-600'}">
                          ${renderIcon('User', 'w-4 h-4')}
                        </div>
                        <div class="role-radio-circle w-4 h-4 rounded-full border-2 ${
                          selectedRole === 'ROLE_CLIENTE' ? 'border-[#ea580c] bg-white ring-2 ring-orange-500/20' : 'border-slate-300 bg-white'
                        } flex items-center justify-center transition-all">
                          ${selectedRole === 'ROLE_CLIENTE' ? '<span class="w-2 h-2 rounded-full bg-[#ea580c] shadow-xs block"></span>' : ''}
                        </div>
                      </div>
                      <div>
                        <div class="text-xs font-bold text-slate-900">Cliente</div>
                        <div class="text-[10px] text-slate-500">Alquilar herramientas y maquinaria</div>
                      </div>
                    </div>

                    <!-- Card Proveedor -->
                    <div id="role-card-provider" class="border-2 ${
                      selectedRole === 'ROLE_PROVEEDOR' ? 'border-[#ea580c] bg-orange-50/30 shadow-xs ring-1 ring-[#ea580c]/20' : 'border-slate-200 bg-white hover:border-slate-300'
                    } rounded-xl p-2.5 cursor-pointer flex flex-col justify-between transition-all select-none">
                      <div class="flex items-center justify-between mb-1.5">
                        <div class="role-icon-wrapper ${selectedRole === 'ROLE_PROVEEDOR' ? 'text-[#ea580c]' : 'text-slate-600'}">
                          ${renderIcon('Building2', 'w-4 h-4')}
                        </div>
                        <div class="role-radio-circle w-4 h-4 rounded-full border-2 ${
                          selectedRole === 'ROLE_PROVEEDOR' ? 'border-[#ea580c] bg-white ring-2 ring-orange-500/20' : 'border-slate-300 bg-white'
                        } flex items-center justify-center transition-all">
                          ${selectedRole === 'ROLE_PROVEEDOR' ? '<span class="w-2 h-2 rounded-full bg-[#ea580c] shadow-xs block"></span>' : ''}
                        </div>
                      </div>
                      <div>
                        <div class="text-xs font-bold text-slate-900">Proveedor</div>
                        <div class="text-[10px] text-slate-500">Publicar y rentar mis equipos</div>
                      </div>
                    </div>

                  </div>
                </div>

                <!-- Dynamic Profile Fields Container -->
                <div id="dynamic-profile-fields" class="space-y-2 pt-1 border-t border-slate-100">
                  ${renderProfileFieldsHTML(selectedRole)}
                </div>
              `}

              <div id="auth-error-msg" class="hidden text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg"></div>

              <button type="submit" id="auth-submit-btn" class="btn-primary w-full !py-2.5 text-xs font-semibold shadow-sm mt-3">
                ${currentTab === 'login' ? 'Iniciar sesión' : 'Registrar y Crear Cuenta'}
              </button>
            </form>
          </div>

          <!-- Bottom Footer Link -->
          <div class="text-center text-xs text-slate-500 pt-3 border-t border-slate-100 mt-3">
            ${currentTab === 'login'
              ? '¿No tienes una cuenta? <button type="button" id="btn-switch-tab" class="font-semibold text-brand-600 hover:text-brand-700">Regístrate</button>'
              : '¿Ya tienes una cuenta? <button type="button" id="btn-switch-tab" class="font-semibold text-brand-600 hover:text-brand-700">Inicia sesión</button>'}
          </div>
        </div>

        <!-- Right Side: Heavy Machinery Hero Showcase matching img/web/login.png -->
        <div class="relative hidden md:block overflow-hidden bg-slate-900 select-none">
          <img src="${loginImg}" class="w-full h-full object-cover object-center" alt="ToolRent Maquinaria y Equipos" />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent flex flex-col justify-end p-8 text-white">
            <h2 class="text-xl lg:text-2xl font-extrabold leading-tight font-display mb-2 text-white">
              La maquinaria que tu proyecto necesita, cuando la necesitas.
            </h2>
            <p class="text-xs text-slate-200 max-w-sm">
              Alquila equipos de construcción con respaldo contractual, facturación legal y disponibilidad en tiempo real.
            </p>
          </div>
        </div>

      </div>
    `;

    // Dynamic Profile Fields Generator
    function renderProfileFieldsHTML(role) {
      if (role === 'ROLE_CLIENTE') {
        return `
          <div>
            <label class="block text-[11px] font-semibold text-slate-700 mb-1">Nombre y Apellidos completos *</label>
            <input type="text" id="reg-fullName" required placeholder="ej. Carlos Gómez Pérez" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div>
              <label class="block text-[11px] font-semibold text-slate-700 mb-1">Tipo Doc *</label>
              <select id="reg-docType" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-brand-500">
                <option value="CC">C.C.</option>
                <option value="CE">C.E.</option>
                <option value="NIT">NIT</option>
                <option value="PASAPORTE">Pasaporte</option>
              </select>
            </div>
            <div class="col-span-2">
              <label class="block text-[11px] font-semibold text-slate-700 mb-1">Número de documento *</label>
              <input type="text" id="reg-docNumber" required placeholder="ej. 1020304050" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] font-semibold text-slate-700 mb-1">Teléfono móvil *</label>
              <input type="tel" id="reg-phone" required placeholder="3001234567" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-700 mb-1">Ciudad *</label>
              <input type="text" id="reg-city" required placeholder="ej. Bogotá" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
            </div>
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-700 mb-1">Dirección de entrega *</label>
            <input type="text" id="reg-address" required placeholder="ej. Cra 7 # 120-45" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
          </div>
        `;
      } else {
        return `
          <div>
            <label class="block text-[11px] font-semibold text-slate-700 mb-1">Razón Social / Nombre Comercial *</label>
            <input type="text" id="reg-companyName" required placeholder="ej. Maquinaria y Equipos del Norte S.A.S." class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] font-semibold text-slate-700 mb-1">NIT / RUT *</label>
              <input type="text" id="reg-taxId" required placeholder="901.234.567-8" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-700 mb-1">Teléfono corporativo *</label>
              <input type="tel" id="reg-phone" required placeholder="3109876543" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] font-semibold text-slate-700 mb-1">Contacto / Representante *</label>
              <input type="text" id="reg-fullName" required placeholder="ej. Laura Sánchez" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-700 mb-1">Ciudad de sede *</label>
              <input type="text" id="reg-city" required placeholder="ej. Medellín" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
            </div>
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-700 mb-1">Dirección de despacho / Bodega *</label>
            <input type="text" id="reg-address" required placeholder="ej. Zona Industrial Calle 15 # 40-10" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
          </div>
        `;
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

    // Role selector in register tab
    function updateRoleUI() {
      const clientCard = content.querySelector('#role-card-client');
      const providerCard = content.querySelector('#role-card-provider');
      if (!clientCard || !providerCard) return;

      const isClient = selectedRole === 'ROLE_CLIENTE';

      // Update Client Card
      clientCard.className = `border-2 ${
        isClient
          ? 'border-[#ea580c] bg-orange-50/30 shadow-xs ring-1 ring-[#ea580c]/20'
          : 'border-slate-200 bg-white hover:border-slate-300'
      } rounded-xl p-2.5 cursor-pointer flex flex-col justify-between transition-all select-none`;

      const clientIcon = clientCard.querySelector('.role-icon-wrapper');
      if (clientIcon) clientIcon.className = `role-icon-wrapper ${isClient ? 'text-[#ea580c]' : 'text-slate-600'}`;

      const clientCircle = clientCard.querySelector('.role-radio-circle');
      if (clientCircle) {
        clientCircle.className = `role-radio-circle w-4 h-4 rounded-full border-2 ${
          isClient ? 'border-[#ea580c] bg-white ring-2 ring-orange-500/20' : 'border-slate-300 bg-white'
        } flex items-center justify-center transition-all`;
        clientCircle.innerHTML = isClient ? '<span class="w-2 h-2 rounded-full bg-[#ea580c] shadow-xs block"></span>' : '';
      }

      // Update Provider Card
      providerCard.className = `border-2 ${
        !isClient
          ? 'border-[#ea580c] bg-orange-50/30 shadow-xs ring-1 ring-[#ea580c]/20'
          : 'border-slate-200 bg-white hover:border-slate-300'
      } rounded-xl p-2.5 cursor-pointer flex flex-col justify-between transition-all select-none`;

      const providerIcon = providerCard.querySelector('.role-icon-wrapper');
      if (providerIcon) providerIcon.className = `role-icon-wrapper ${!isClient ? 'text-[#ea580c]' : 'text-slate-600'}`;

      const providerCircle = providerCard.querySelector('.role-radio-circle');
      if (providerCircle) {
        providerCircle.className = `role-radio-circle w-4 h-4 rounded-full border-2 ${
          !isClient ? 'border-[#ea580c] bg-white ring-2 ring-orange-500/20' : 'border-slate-300 bg-white'
        } flex items-center justify-center transition-all`;
        providerCircle.innerHTML = !isClient ? '<span class="w-2 h-2 rounded-full bg-[#ea580c] shadow-xs block"></span>' : '';
      }

      // Update dynamic fields
      const dynContainer = content.querySelector('#dynamic-profile-fields');
      if (dynContainer) {
        dynContainer.innerHTML = renderProfileFieldsHTML(selectedRole);
      }
    }

    content.querySelector('#role-card-client')?.addEventListener('click', () => {
      selectedRole = 'ROLE_CLIENTE';
      updateRoleUI();
    });
    content.querySelector('#role-card-provider')?.addEventListener('click', () => {
      selectedRole = 'ROLE_PROVEEDOR';
      updateRoleUI();
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
      const address = content.querySelector('#reg-address')?.value.trim();

      // Client-side validations
      if (!username || username.length < 3) {
        errorBox.textContent = 'El nombre de usuario debe tener al menos 3 caracteres.';
        errorBox.classList.remove('hidden');
        return;
      }
      if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
        errorBox.textContent = 'El nombre de usuario solo puede contener letras, números, guiones y puntos.';
        errorBox.classList.remove('hidden');
        return;
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errorBox.textContent = 'Por favor ingresa un correo electrónico válido.';
        errorBox.classList.remove('hidden');
        return;
      }
      if (!password || password.length < 6) {
        errorBox.textContent = 'La contraseña debe contener al menos 6 caracteres.';
        errorBox.classList.remove('hidden');
        return;
      }
      if (!fullName) {
        errorBox.textContent = 'El nombre o persona de contacto es obligatorio.';
        errorBox.classList.remove('hidden');
        return;
      }
      if (!phone || phone.length < 7) {
        errorBox.textContent = 'Por favor ingresa un número de teléfono de contacto válido (mínimo 7 dígitos).';
        errorBox.classList.remove('hidden');
        return;
      }
      if (!city || !address) {
        errorBox.textContent = 'La ciudad y dirección son obligatorias.';
        errorBox.classList.remove('hidden');
        return;
      }

      let documentType = 'CC';
      let documentNumber = '';
      let companyName = '';
      let taxId = '';

      if (selectedRole === 'ROLE_CLIENTE') {
        documentType = content.querySelector('#reg-docType')?.value || 'CC';
        documentNumber = content.querySelector('#reg-docNumber')?.value.trim();
        if (!documentNumber) {
          errorBox.textContent = 'El número de documento del cliente es obligatorio.';
          errorBox.classList.remove('hidden');
          return;
        }
      } else {
        companyName = content.querySelector('#reg-companyName')?.value.trim();
        taxId = content.querySelector('#reg-taxId')?.value.trim();
        if (!companyName) {
          errorBox.textContent = 'La razón social de la empresa es obligatoria.';
          errorBox.classList.remove('hidden');
          return;
        }
        if (!taxId) {
          errorBox.textContent = 'El NIT o RUT de la empresa proveedora es obligatorio.';
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
          documentNumber,
          phone,
          address,
          city,
          companyName,
          taxId
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
