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
                      <input type="text" id="reg-username" required maxlength="30" autocomplete="username" placeholder="ej. carlos_gomez" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
                    </div>
                  </div>

                  <div>
                    <label class="block text-[11px] font-semibold text-slate-700 mb-1">Correo electrónico *</label>
                    <div class="relative">
                      <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                        ${renderIcon('Mail', 'w-3.5 h-3.5')}
                      </span>
                      <input type="email" id="reg-email" required maxlength="60" autocomplete="email" placeholder="carlos@empresa.com" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
                    </div>
                  </div>
                </div>

                <div>
                  <label class="block text-[11px] font-semibold text-slate-700 mb-1">Contraseña segura *</label>
                  <div class="relative">
                    <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                      ${renderIcon('Lock', 'w-3.5 h-3.5')}
                    </span>
                    <input type="password" id="reg-password" required maxlength="50" autocomplete="new-password" placeholder="Mínimo 6 caracteres" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg pl-8 pr-8 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
                    <button type="button" id="btn-toggle-reg-pass" class="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600">
                      ${renderIcon('Eye', 'w-3.5 h-3.5')}
                    </button>
                  </div>
                </div>

                <!-- Explicit Role Selection with Radio Labels -->
                <div class="pt-1 space-y-2">
                  <div class="flex items-center justify-between">
                    <label class="block text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                      ¿Qué tipo de cuenta deseas crear? *
                    </label>
                    <span id="role-active-indicator" class="text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedRole === 'ROLE_PROVEEDOR' ? 'bg-orange-100 text-[#ea580c] border border-orange-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
                    }">
                      ${selectedRole === 'ROLE_PROVEEDOR' ? '🏢 Proveedor Seleccionado' : '👤 Cliente Seleccionado'}
                    </span>
                  </div>

                  <div class="grid grid-cols-2 gap-2.5" id="role-cards-wrapper">
                    
                    <!-- Option Cliente -->
                    <label id="role-card-client" class="border-2 ${
                      selectedRole === 'ROLE_CLIENTE' ? 'border-[#ea580c] bg-orange-50/40 shadow-xs ring-2 ring-[#ea580c]/20' : 'border-slate-200 bg-white hover:border-slate-300'
                    } rounded-xl p-3 cursor-pointer flex flex-col justify-between transition-all select-none">
                      <div class="flex items-center justify-between mb-2">
                        <div class="role-icon-wrapper ${selectedRole === 'ROLE_CLIENTE' ? 'text-[#ea580c]' : 'text-slate-500'}">
                          ${renderIcon('User', 'w-5 h-5')}
                        </div>
                        <input type="radio" name="accountRole" value="ROLE_CLIENTE" ${selectedRole === 'ROLE_CLIENTE' ? 'checked' : ''} class="w-4 h-4 text-[#ea580c] focus:ring-[#ea580c] cursor-pointer" />
                      </div>
                      <div>
                        <div class="text-xs font-bold text-slate-900">Cliente Arrendatario</div>
                        <div class="text-[10px] text-slate-500 mt-0.5 leading-snug">Quiero alquilar herramientas y maquinaria para mis obras</div>
                      </div>
                    </label>

                    <!-- Option Proveedor -->
                    <label id="role-card-provider" class="border-2 ${
                      selectedRole === 'ROLE_PROVEEDOR' ? 'border-[#ea580c] bg-orange-50/40 shadow-xs ring-2 ring-[#ea580c]/20' : 'border-slate-200 bg-white hover:border-slate-300'
                    } rounded-xl p-3 cursor-pointer flex flex-col justify-between transition-all select-none">
                      <div class="flex items-center justify-between mb-2">
                        <div class="role-icon-wrapper ${selectedRole === 'ROLE_PROVEEDOR' ? 'text-[#ea580c]' : 'text-slate-500'}">
                          ${renderIcon('Building2', 'w-5 h-5')}
                        </div>
                        <input type="radio" name="accountRole" value="ROLE_PROVEEDOR" ${selectedRole === 'ROLE_PROVEEDOR' ? 'checked' : ''} class="w-4 h-4 text-[#ea580c] focus:ring-[#ea580c] cursor-pointer" />
                      </div>
                      <div>
                        <div class="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span>Proveedor Aliado</span>
                          <span class="text-[9px] font-bold px-1.5 py-0.2 rounded bg-orange-100 text-[#ea580c]">Empresas</span>
                        </div>
                        <div class="text-[10px] text-slate-500 mt-0.5 leading-snug">Quiero publicar equipos y generar ingresos por alquiler</div>
                      </div>
                    </label>

                  </div>

                  <!-- Role Description Callout -->
                  <div id="role-info-callout" class="p-2.5 rounded-xl text-[11px] leading-relaxed transition-all ${
                    selectedRole === 'ROLE_PROVEEDOR'
                      ? 'bg-orange-50 text-orange-950 border border-orange-200/90'
                      : 'bg-blue-50 text-blue-950 border border-blue-200/90'
                  }">
                    ${selectedRole === 'ROLE_PROVEEDOR'
                      ? '<strong>🏢 Cuenta de Proveedor:</strong> Registrarás tu empresa con Razón Social y NIT. Tendrás acceso directo al <strong>Panel de Proveedor</strong> para publicar herramientas, fijar precios diarios y cobrar alquileres.'
                      : '<strong>👤 Cuenta de Cliente:</strong> Registrarás tu cuenta personal para buscar equipos, reservar en línea y recibir facturas electrónicas oficiales.'
                    }
                  </div>
                </div>

                <!-- Dynamic Profile Fields Container -->
                <div id="dynamic-profile-fields" class="space-y-2 pt-2 border-t border-slate-100">
                  ${renderProfileFieldsHTML(selectedRole)}
                </div>
              `}

              <div id="auth-error-msg" class="hidden text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg"></div>

              <button type="submit" id="auth-submit-btn" class="btn-primary w-full !py-2.5 text-xs font-semibold shadow-sm mt-3">
                ${currentTab === 'login' 
                  ? 'Iniciar sesión' 
                  : (selectedRole === 'ROLE_PROVEEDOR' ? '🏢 Registrar y Crear Cuenta de Proveedor Aliado' : '👤 Registrar y Crear Cuenta de Cliente Arrendatario')}
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
            <input type="text" id="reg-fullName" required maxlength="60" autocomplete="name" placeholder="ej. Carlos Gómez Pérez" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
            <p class="text-[10px] text-slate-400 mt-0.5">Solo letras y espacios (máx. 60 caracteres)</p>
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
              <input type="text" id="reg-docNumber" required maxlength="20" inputmode="numeric" placeholder="ej. 1020304050" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] font-semibold text-slate-700 mb-1">Teléfono móvil *</label>
              <input type="tel" id="reg-phone" required maxlength="15" inputmode="tel" autocomplete="tel" placeholder="ej. 3001234567" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-700 mb-1">Ciudad *</label>
              <input type="text" id="reg-city" required maxlength="40" autocomplete="address-level2" placeholder="ej. Bogotá" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
            </div>
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-700 mb-1">Dirección de entrega *</label>
            <input type="text" id="reg-address" required maxlength="100" autocomplete="street-address" placeholder="ej. Cra 7 # 120-45" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
          </div>
        `;
      } else {
        return `
          <div>
            <label class="block text-[11px] font-semibold text-slate-700 mb-1">Razón Social / Nombre Comercial *</label>
            <input type="text" id="reg-companyName" required maxlength="80" autocomplete="organization" placeholder="ej. Maquinaria y Equipos del Norte S.A.S." class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] font-semibold text-slate-700 mb-1">NIT / RUT *</label>
              <input type="text" id="reg-taxId" required maxlength="20" inputmode="numeric" placeholder="ej. 901.234.567-8" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-700 mb-1">Teléfono corporativo *</label>
              <input type="tel" id="reg-phone" required maxlength="15" inputmode="tel" autocomplete="tel" placeholder="ej. 3109876543" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[11px] font-semibold text-slate-700 mb-1">Contacto / Representante *</label>
              <input type="text" id="reg-fullName" required maxlength="60" autocomplete="name" placeholder="ej. Laura Sánchez" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
              <p class="text-[10px] text-slate-400 mt-0.5">Solo letras y espacios (sin números)</p>
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-700 mb-1">Ciudad de sede *</label>
              <input type="text" id="reg-city" required maxlength="40" autocomplete="address-level2" placeholder="ej. Medellín" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
            </div>
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-700 mb-1">Dirección de despacho / Bodega *</label>
            <input type="text" id="reg-address" required maxlength="100" autocomplete="street-address" placeholder="ej. Zona Industrial Calle 15 # 40-10" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
          </div>
        `;
      }
    }

    // Input sanitizers & character-type filters
    function bindInputFilters(root) {
      if (!root) return;

      // 1. Username: no spaces, only alphanumeric, dot, underscore, dash, max 30 chars
      const userInput = root.querySelector('#reg-username');
      if (userInput && !userInput._filterBound) {
        userInput._filterBound = true;
        userInput.addEventListener('input', (e) => {
          const clean = e.target.value.replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 30);
          if (e.target.value !== clean) e.target.value = clean;
        });
      }

      // 2. Email: no spaces, max 60 chars
      const emailInput = root.querySelector('#reg-email');
      if (emailInput && !emailInput._filterBound) {
        emailInput._filterBound = true;
        emailInput.addEventListener('input', (e) => {
          const clean = e.target.value.replace(/\s+/g, '').slice(0, 60);
          if (e.target.value !== clean) e.target.value = clean;
        });
      }

      // 3. Password: max 50 chars
      const passInput = root.querySelector('#reg-password');
      if (passInput && !passInput._filterBound) {
        passInput._filterBound = true;
        passInput.addEventListener('input', (e) => {
          if (e.target.value.length > 50) e.target.value = e.target.value.slice(0, 50);
        });
      }

      // 4. Phone: only digits, +, spaces, hyphens. Max 15 chars. (Rejects letters like edd and symbols like /*)
      const phoneInput = root.querySelector('#reg-phone');
      if (phoneInput && !phoneInput._filterBound) {
        phoneInput._filterBound = true;
        phoneInput.addEventListener('input', (e) => {
          const clean = e.target.value.replace(/[^0-9+\s-]/g, '').slice(0, 15);
          if (e.target.value !== clean) e.target.value = clean;
        });
      }

      // 5. Contact / Full Name: only letters, accents, spaces, apostrophes. (Rejects digits like 0201321 and symbols)
      const nameInput = root.querySelector('#reg-fullName');
      if (nameInput && !nameInput._filterBound) {
        nameInput._filterBound = true;
        nameInput.addEventListener('input', (e) => {
          const clean = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]/g, '').slice(0, 60);
          if (e.target.value !== clean) e.target.value = clean;
        });
      }

      // 6. City: only letters, accents, spaces, hyphens. (Rejects semicolons like Cale;as, digits, etc.)
      const cityInput = root.querySelector('#reg-city');
      if (cityInput && !cityInput._filterBound) {
        cityInput._filterBound = true;
        cityInput.addEventListener('input', (e) => {
          const clean = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s-]/g, '').slice(0, 40);
          if (e.target.value !== clean) e.target.value = clean;
        });
      }

      // 7. NIT / RUT: only numbers, dots, hyphens. Max 20 chars.
      const taxInput = root.querySelector('#reg-taxId');
      if (taxInput && !taxInput._filterBound) {
        taxInput._filterBound = true;
        taxInput.addEventListener('input', (e) => {
          const clean = e.target.value.replace(/[^0-9.-]/g, '').slice(0, 20);
          if (e.target.value !== clean) e.target.value = clean;
        });
      }

      // 8. Document number: only numbers, letters, hyphens. Max 20 chars.
      const docInput = root.querySelector('#reg-docNumber');
      if (docInput && !docInput._filterBound) {
        docInput._filterBound = true;
        docInput.addEventListener('input', (e) => {
          const clean = e.target.value.replace(/[^0-9A-Za-z-]/g, '').slice(0, 20);
          if (e.target.value !== clean) e.target.value = clean;
        });
      }

      // 9. Company Name: letters, numbers, spaces, dots, hyphens, commas, &, apostrophe. Max 80 chars.
      const companyInput = root.querySelector('#reg-companyName');
      if (companyInput && !companyInput._filterBound) {
        companyInput._filterBound = true;
        companyInput.addEventListener('input', (e) => {
          const clean = e.target.value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s.,&'-]/g, '').slice(0, 80);
          if (e.target.value !== clean) e.target.value = clean;
        });
      }

      // 10. Address: letters, numbers, spaces, #, -, ., ,, / Max 100 chars.
      const addressInput = root.querySelector('#reg-address');
      if (addressInput && !addressInput._filterBound) {
        addressInput._filterBound = true;
        addressInput.addEventListener('input', (e) => {
          const clean = e.target.value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s#.,\/-]/g, '').slice(0, 100);
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

    // Role selector in register tab
    function updateRoleUI() {
      const clientCard = content.querySelector('#role-card-client');
      const providerCard = content.querySelector('#role-card-provider');
      const indicator = content.querySelector('#role-active-indicator');
      const callout = content.querySelector('#role-info-callout');
      const submitBtn = content.querySelector('#auth-submit-btn');
      if (!clientCard || !providerCard) return;

      const isClient = selectedRole === 'ROLE_CLIENTE';

      // Update Client Card
      clientCard.className = `border-2 ${
        isClient
          ? 'border-[#ea580c] bg-orange-50/40 shadow-xs ring-2 ring-[#ea580c]/20'
          : 'border-slate-200 bg-white hover:border-slate-300'
      } rounded-xl p-3 cursor-pointer flex flex-col justify-between transition-all select-none`;

      const clientRadio = clientCard.querySelector('input[type="radio"]');
      if (clientRadio) clientRadio.checked = isClient;

      const clientIcon = clientCard.querySelector('.role-icon-wrapper');
      if (clientIcon) clientIcon.className = `role-icon-wrapper ${isClient ? 'text-[#ea580c]' : 'text-slate-500'}`;

      // Update Provider Card
      providerCard.className = `border-2 ${
        !isClient
          ? 'border-[#ea580c] bg-orange-50/40 shadow-xs ring-2 ring-[#ea580c]/20'
          : 'border-slate-200 bg-white hover:border-slate-300'
      } rounded-xl p-3 cursor-pointer flex flex-col justify-between transition-all select-none`;

      const providerRadio = providerCard.querySelector('input[type="radio"]');
      if (providerRadio) providerRadio.checked = !isClient;

      const providerIcon = providerCard.querySelector('.role-icon-wrapper');
      if (providerIcon) providerIcon.className = `role-icon-wrapper ${!isClient ? 'text-[#ea580c]' : 'text-slate-500'}`;

      // Update Indicator Badge
      if (indicator) {
        indicator.className = `text-[10px] font-bold px-2 py-0.5 rounded-full ${
          !isClient ? 'bg-orange-100 text-[#ea580c] border border-orange-200' : 'bg-blue-100 text-blue-700 border border-blue-200'
        }`;
        indicator.textContent = !isClient ? '🏢 Proveedor Seleccionado' : '👤 Cliente Seleccionado';
      }

      // Update Callout
      if (callout) {
        callout.className = `p-2.5 rounded-xl text-[11px] leading-relaxed transition-all ${
          !isClient ? 'bg-orange-50 text-orange-950 border border-orange-200/90' : 'bg-blue-50 text-blue-950 border border-blue-200/90'
        }`;
        callout.innerHTML = !isClient
          ? '<strong>🏢 Cuenta de Proveedor:</strong> Registrarás tu empresa con Razón Social y NIT. Tendrás acceso directo al <strong>Panel de Proveedor</strong> para publicar herramientas, fijar precios diarios y cobrar alquileres.'
          : '<strong>👤 Cuenta de Cliente:</strong> Registrarás tu cuenta personal para buscar equipos, reservar en línea y recibir facturas electrónicas oficiales.';
      }

      // Update Submit Button Label
      if (submitBtn && currentTab === 'register') {
        submitBtn.textContent = !isClient 
          ? '🏢 Registrar y Crear Cuenta de Proveedor Aliado' 
          : '👤 Registrar y Crear Cuenta de Cliente Arrendatario';
      }

      // Update dynamic fields
      const dynContainer = content.querySelector('#dynamic-profile-fields');
      if (dynContainer) {
        dynContainer.innerHTML = renderProfileFieldsHTML(selectedRole);
        bindInputFilters(content);
      }
    }

    content.querySelectorAll('input[name="accountRole"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        selectedRole = e.target.value;
        updateRoleUI();
      });
    });

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
      selectedRole = content.querySelector('input[name="accountRole"]:checked')?.value || selectedRole;
      const username = content.querySelector('#reg-username')?.value.trim();
      const email = content.querySelector('#reg-email')?.value.trim();
      const password = content.querySelector('#reg-password')?.value;
      const fullName = content.querySelector('#reg-fullName')?.value.trim();
      const phone = content.querySelector('#reg-phone')?.value.trim();
      const city = content.querySelector('#reg-city')?.value.trim();
      const address = content.querySelector('#reg-address')?.value.trim();

      // Client-side validations
      if (!username || username.length < 3 || username.length > 30) {
        errorBox.textContent = 'El nombre de usuario debe tener entre 3 y 30 caracteres.';
        errorBox.classList.remove('hidden');
        return;
      }
      if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
        errorBox.textContent = 'El nombre de usuario no puede contener espacios ni caracteres especiales (solo letras, números, guiones y puntos).';
        errorBox.classList.remove('hidden');
        return;
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 60) {
        errorBox.textContent = 'Por favor ingresa un correo electrónico válido (máx. 60 caracteres).';
        errorBox.classList.remove('hidden');
        return;
      }
      if (!password || password.length < 6 || password.length > 50) {
        errorBox.textContent = 'La contraseña debe contener entre 6 y 50 caracteres.';
        errorBox.classList.remove('hidden');
        return;
      }
      if (!fullName || fullName.length < 3 || fullName.length > 60) {
        errorBox.textContent = 'El nombre o persona de contacto es obligatorio (entre 3 y 60 caracteres).';
        errorBox.classList.remove('hidden');
        return;
      }
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(fullName)) {
        errorBox.textContent = 'El nombre o persona de contacto solo puede contener letras y espacios (no se permiten números ni caracteres especiales).';
        errorBox.classList.remove('hidden');
        return;
      }
      const phoneDigits = phone ? phone.replace(/\D/g, '') : '';
      if (!phone || phoneDigits.length < 7 || phoneDigits.length > 15) {
        errorBox.textContent = 'El teléfono debe contener entre 7 y 15 dígitos numéricos (ej. 3001234567 o +57 3001234567).';
        errorBox.classList.remove('hidden');
        return;
      }
      if (!city || city.length < 2 || city.length > 40) {
        errorBox.textContent = 'La ciudad es obligatoria (entre 2 y 40 caracteres).';
        errorBox.classList.remove('hidden');
        return;
      }
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s-]+$/.test(city)) {
        errorBox.textContent = 'La ciudad solo puede contener letras (sin números ni caracteres como punto y coma).';
        errorBox.classList.remove('hidden');
        return;
      }
      if (!address || address.length < 5 || address.length > 100) {
        errorBox.textContent = 'La dirección es obligatoria (entre 5 y 100 caracteres).';
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
        if (!documentNumber || documentNumber.length < 5 || documentNumber.length > 20) {
          errorBox.textContent = 'El número de documento debe tener entre 5 y 20 caracteres.';
          errorBox.classList.remove('hidden');
          return;
        }
      } else {
        companyName = content.querySelector('#reg-companyName')?.value.trim();
        taxId = content.querySelector('#reg-taxId')?.value.trim();
        if (!companyName || companyName.length < 3 || companyName.length > 80) {
          errorBox.textContent = 'La razón social de la empresa debe tener entre 3 y 80 caracteres.';
          errorBox.classList.remove('hidden');
          return;
        }
        if (!taxId || taxId.length < 5 || taxId.length > 20) {
          errorBox.textContent = 'El NIT o RUT de la empresa debe tener entre 5 y 20 caracteres (ej. 901.234.567-8).';
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
