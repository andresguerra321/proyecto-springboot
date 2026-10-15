import auth from '../auth/state.js';
import modal from './modal.js';
import showToast from './toast.js';
import loginShowcaseImg from '../assets/login-showcase.jpg';
import loginAccessImg from '../assets/login-access.jpg';
import { renderIcon, renderToolRentMark } from '../utils/icons.js';

export function openAuthModal(initialTab = 'login', initialRole = 'ROLE_CLIENTE') {
  let currentTab = initialTab; // 'login' or 'register'
  let selectedRole = initialRole; // 'ROLE_CLIENTE' or 'ROLE_PROVEEDOR'

  const content = document.createElement('div');
  content.className = 'w-full';

  // Anti-SQL injection & XSS threat scanner
  function detectSecurityThreat(label, value) {
    if (!value) return null;
    const trimmed = String(value).trim();

    // SQL Injection patterns: keywords, comment markers, single/double quotes, boolean tautologies
    const sqlThreatPattern = /('|"|;|--|\/\*|\*\/|\b(SELECT|UNION|INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|EXEC|EXECUTE|DECLARE|CAST|XP_)\b|OR\s+['"\d\w]+\s*=\s*['"\d\w]+)/i;
    if (sqlThreatPattern.test(trimmed)) {
      return `Se detectaron caracteres o secuencias no permitidas en el campo "${label}". Por motivos de seguridad del sistema, no se admiten comandos ni operadores de consulta.`;
    }

    // XSS / Script injection patterns
    const xssThreatPattern = /(<script|javascript:|onerror\s*=|onload\s*=|iframe|<svg|<img|eval\(|alert\(|document\.cookie)/i;
    if (xssThreatPattern.test(trimmed)) {
      return `No se permiten etiquetas HTML ni secuencias ejecutables en el campo "${label}".`;
    }

    return null;
  }

  // Friendly error mapper for backend business rules and database constraints
  function translateErrorMessage(err) {
    const raw = (err && (err.message || err.error || (typeof err === 'string' ? err : ''))) || '';
    const status = err?.status;

    if (status === 401 || raw.includes('Invalid credentials') || raw.includes('Bad credentials')) {
      return 'Usuario o contraseña incorrectos. Por favor verifica tus credenciales.';
    }
    if (raw.includes('Account is disabled')) {
      return 'Esta cuenta se encuentra temporalmente inactiva. Contacta al administrador.';
    }
    if (raw.includes('Username is already taken') || raw.includes('nombre de usuario ya está en uso')) {
      return 'El nombre de usuario ya se encuentra registrado. Por favor elige otro diferente.';
    }
    if (raw.includes('Email is already taken') || raw.includes('correo electrónico ya está registrado')) {
      return 'Este correo electrónico ya está asociado a otra cuenta. Si ya estás registrado, por favor inicia sesión.';
    }
    if (raw.includes('número de documento') || raw.includes('client_profiles_document_number_key') || raw.includes('document_number')) {
      return 'El documento de identidad ingresado ya se encuentra registrado por otro cliente en la plataforma.';
    }
    if (raw.includes('NIT o RUT') || raw.includes('provider_profiles_tax_id_key') || raw.includes('tax_id')) {
      return 'El NIT o RUT ingresado ya se encuentra registrado por otra empresa proveedora.';
    }
    if (raw.includes('regla de integridad') || raw.includes('DataIntegrityViolation') || raw.includes('duplicate key') || raw.includes('violates unique constraint')) {
      return 'Uno de los datos ingresados (usuario, correo, documento o NIT) ya existe en la base de datos.';
    }
    if (raw.includes('no permite la asignación de roles administrativos')) {
      return 'El registro público solo admite cuentas de Cliente o Proveedor.';
    }
    if (raw.includes('contiene caracteres o secuencias no permitidas')) {
      return raw;
    }
    return raw || 'Ocurrió un error inesperado al procesar la solicitud. Verifica la información ingresada.';
  }

  function renderProfileFieldsHTML(role) {
    if (role === 'ROLE_CLIENTE') {
      return `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label class="block text-[11px] font-semibold text-slate-700 mb-1">Nombre y Apellidos *</label>
            <input type="text" id="reg-fullName" required maxlength="60" autocomplete="name" placeholder="ej. Carlos Gómez" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors" />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-700 mb-1">Documento de identidad *</label>
            <input type="text" id="reg-docNumber" required maxlength="20" inputmode="numeric" placeholder="C.C. o Documento (ej. 1020304050)" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors" />
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label class="block text-[11px] font-semibold text-slate-700 mb-1">Teléfono de contacto *</label>
            <input type="tel" id="reg-phone" required maxlength="15" inputmode="tel" autocomplete="tel" placeholder="ej. 3001234567" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors" />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-700 mb-1">Ciudad de operación *</label>
            <input type="text" id="reg-city" required maxlength="40" autocomplete="address-level2" placeholder="ej. Bogotá" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors" />
          </div>
        </div>
      `;
    } else {
      return `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label class="block text-[11px] font-semibold text-slate-700 mb-1">Razón Social / Empresa *</label>
            <input type="text" id="reg-companyName" required maxlength="80" autocomplete="organization" placeholder="ej. Maquinaria y Equipos S.A.S." class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors" />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-700 mb-1">NIT o RUT *</label>
            <input type="text" id="reg-taxId" required maxlength="20" inputmode="numeric" placeholder="ej. 901234567-8" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors" />
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label class="block text-[11px] font-semibold text-slate-700 mb-1">Contacto o Representante *</label>
            <input type="text" id="reg-fullName" required maxlength="60" autocomplete="name" placeholder="ej. Laura Sánchez" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors" />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-700 mb-1">Teléfono corporativo *</label>
            <input type="tel" id="reg-phone" required maxlength="15" inputmode="tel" autocomplete="tel" placeholder="ej. 3109876543" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors" />
          </div>
        </div>
        <div>
          <label class="block text-[11px] font-semibold text-slate-700 mb-1">Ciudad de sede principal *</label>
          <input type="text" id="reg-city" required maxlength="40" autocomplete="address-level2" placeholder="ej. Medellín" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors" />
        </div>
      `;
    }
  }

  // Bind real-time input sanitizers
  function bindInputFilters(root) {
    if (!root) return;

    // Login: username or corporate email
    const loginUserInput = root.querySelector('#login-username');
    if (loginUserInput && !loginUserInput._filterBound) {
      loginUserInput._filterBound = true;
      loginUserInput.addEventListener('input', (e) => {
        const clean = e.target.value.replace(/[^a-zA-Z0-9_.@-]/g, '').slice(0, 60);
        if (e.target.value !== clean) e.target.value = clean;
      });
    }

    // Register: Username (Alphanumeric, underscores, hyphens, dots. No spaces, no quotes, max 30)
    const userInput = root.querySelector('#reg-username');
    if (userInput && !userInput._filterBound) {
      userInput._filterBound = true;
      userInput.addEventListener('input', (e) => {
        const clean = e.target.value.replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 30);
        if (e.target.value !== clean) e.target.value = clean;
      });
    }

    // Register: Email (No whitespace, max 60)
    const emailInput = root.querySelector('#reg-email');
    if (emailInput && !emailInput._filterBound) {
      emailInput._filterBound = true;
      emailInput.addEventListener('input', (e) => {
        const clean = e.target.value.replace(/\s+/g, '').replace(/['"<>;]/g, '').slice(0, 60);
        if (e.target.value !== clean) e.target.value = clean;
      });
    }

    // Register: Password (Max 50)
    const passInput = root.querySelector('#reg-password');
    if (passInput && !passInput._filterBound) {
      passInput._filterBound = true;
      passInput.addEventListener('input', (e) => {
        if (e.target.value.length > 50) e.target.value = e.target.value.slice(0, 50);
      });
    }

    // Register: Full Name / Representative (Letters, Spanish accents, spaces, dots, hyphens only. No digits, max 60)
    const nameInput = root.querySelector('#reg-fullName');
    if (nameInput && !nameInput._filterBound) {
      nameInput._filterBound = true;
      nameInput.addEventListener('input', (e) => {
        const clean = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.-]/g, '').slice(0, 60);
        if (e.target.value !== clean) e.target.value = clean;
      });
    }

    // Register: Company Name (Letters, numbers, spanish accents, spaces, dots, commas, ampersand, hyphens, slashes)
    const companyInput = root.querySelector('#reg-companyName');
    if (companyInput && !companyInput._filterBound) {
      companyInput._filterBound = true;
      companyInput.addEventListener('input', (e) => {
        const clean = e.target.value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s.,&/-]/g, '').slice(0, 80);
        if (e.target.value !== clean) e.target.value = clean;
      });
    }

    // Register: Phone (Digits and +, -, (, ), max 15)
    const phoneInput = root.querySelector('#reg-phone');
    if (phoneInput && !phoneInput._filterBound) {
      phoneInput._filterBound = true;
      phoneInput.addEventListener('input', (e) => {
        const clean = e.target.value.replace(/[^0-9+\s()-]/g, '').slice(0, 15);
        if (e.target.value !== clean) e.target.value = clean;
      });
    }

    // Register: Document Number (Digits and hyphen only, max 20)
    const docInput = root.querySelector('#reg-docNumber');
    if (docInput && !docInput._filterBound) {
      docInput._filterBound = true;
      docInput.addEventListener('input', (e) => {
        const clean = e.target.value.replace(/[^0-9-]/g, '').slice(0, 20);
        if (e.target.value !== clean) e.target.value = clean;
      });
    }

    // Register: Tax ID / NIT (Digits and hyphen only, max 20)
    const taxInput = root.querySelector('#reg-taxId');
    if (taxInput && !taxInput._filterBound) {
      taxInput._filterBound = true;
      taxInput.addEventListener('input', (e) => {
        const clean = e.target.value.replace(/[^0-9-]/g, '').slice(0, 20);
        if (e.target.value !== clean) e.target.value = clean;
      });
    }

    // Register: City (Letters, spanish accents, spaces, dots, hyphens only, max 40)
    const cityInput = root.querySelector('#reg-city');
    if (cityInput && !cityInput._filterBound) {
      cityInput._filterBound = true;
      cityInput.addEventListener('input', (e) => {
        const clean = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.-]/g, '').slice(0, 40);
        if (e.target.value !== clean) e.target.value = clean;
      });
    }
  }

  function renderView() {
    const isLogin = currentTab === 'login';
    const activeShowcaseImg = isLogin ? loginAccessImg : loginShowcaseImg;
    const activeShowcaseTitle = isLogin ? 'Acceso a la plataforma' : 'Gestión y alquiler de maquinaria pesada';
    const activeShowcaseDesc = isLogin 
      ? 'Gestiona reservas, consulta disponibilidad y administra tus alquileres en tiempo real.'
      : 'Equipos de construcción certificados, disponibilidad inmediata y entrega coordinada en obra.';

    content.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 overflow-hidden w-full">
        
        <!-- Left Side: Auth Form (7 cols on desktop, full width on mobile/tablet) -->
        <div class="lg:col-span-7 p-6 sm:p-7 flex flex-col justify-center bg-white ${!isLogin ? 'max-h-[85vh] overflow-y-auto' : ''}">
          <div>
            <!-- Brand Header -->
            <div class="flex items-center gap-2.5 mb-3.5 select-none">
              ${renderToolRentMark('w-8 h-8')}
              <div>
                <span class="text-lg font-bold tracking-tight text-slate-900 font-display">ToolRent</span>
                <p class="text-[10px] text-slate-500 leading-tight">Plataforma de alquiler de maquinaria y herramientas</p>
              </div>
            </div>

            <!-- Tab Switcher (Corporate Segmented Pill) -->
            <div class="flex bg-slate-100 p-1 rounded-xl mb-3.5 max-w-xs border border-slate-200/80">
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
            <div class="mb-3">
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
                    <input type="text" id="login-username" required maxlength="60" autocomplete="username" placeholder="ej. carlos_gomez o cliente@empresa.com" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors" />
                  </div>
                </div>

                <div>
                  <label class="block text-[11px] font-semibold text-slate-700 mb-1">Contraseña</label>
                  <div class="relative">
                    <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      ${renderIcon('Lock', 'w-4 h-4')}
                    </span>
                    <input type="password" id="login-password" required maxlength="50" autocomplete="current-password" placeholder="••••••••" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg pl-9 pr-9 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors" />
                    <button type="button" id="btn-toggle-login-pass" class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer">
                      ${renderIcon('Eye', 'w-4 h-4')}
                    </button>
                  </div>
                </div>
              ` : `
                <!-- Registration: Credenciales de acceso -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label class="block text-[11px] font-semibold text-slate-700 mb-1">Nombre de usuario *</label>
                    <input type="text" id="reg-username" required maxlength="30" autocomplete="username" placeholder="ej. carlos_gomez" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors" />
                  </div>

                  <div>
                    <label class="block text-[11px] font-semibold text-slate-700 mb-1">Correo electrónico *</label>
                    <input type="email" id="reg-email" required maxlength="60" autocomplete="email" placeholder="carlos@empresa.com" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors" />
                  </div>
                </div>

                <div>
                  <label class="block text-[11px] font-semibold text-slate-700 mb-1">Contraseña *</label>
                  <div class="relative">
                    <input type="password" id="reg-password" required maxlength="50" autocomplete="new-password" placeholder="Mínimo 6 caracteres" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg pl-3 pr-9 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors" />
                    <button type="button" id="btn-toggle-reg-pass" class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer">
                      ${renderIcon('Eye', 'w-4 h-4')}
                    </button>
                  </div>
                </div>

                <!-- Selector de Rol Corporativo (Apple / Linear Aesthetic) -->
                <div class="pt-1.5 space-y-1">
                  <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tipo de cuenta *</label>
                  <div class="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200/80 gap-1 select-none" id="role-selector-wrapper">
                    
                    <button 
                      type="button" 
                      id="role-btn-client" 
                      class="py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        selectedRole === 'ROLE_CLIENTE'
                          ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }"
                    >
                      ${renderIcon('User', 'w-4 h-4 text-slate-400')}
                      <span>Cliente (Alquilar)</span>
                    </button>

                    <button 
                      type="button" 
                      id="role-btn-provider" 
                      class="py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        selectedRole === 'ROLE_PROVEEDOR'
                          ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }"
                    >
                      ${renderIcon('Building2', 'w-4 h-4 text-slate-400')}
                      <span>Proveedor (Publicar)</span>
                    </button>

                  </div>
                </div>

                <!-- Campos de Perfil Dinámicos según Rol -->
                <div id="dynamic-profile-fields" class="space-y-2.5 pt-1.5 border-t border-slate-100">
                  ${renderProfileFieldsHTML(selectedRole)}
                </div>
              `}

              <!-- Error Box con estilos corporativos limpios -->
              <div id="auth-error-msg" class="hidden text-xs text-rose-700 bg-rose-50/90 border border-rose-200/90 p-3 rounded-xl leading-relaxed"></div>

              <!-- Botón de Envío -->
              <button type="submit" id="auth-submit-btn" class="w-full py-2.5 px-4 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-semibold shadow-sm transition-all cursor-pointer mt-3">
                ${currentTab === 'login' 
                  ? 'Iniciar sesión' 
                  : (selectedRole === 'ROLE_PROVEEDOR' ? 'Crear cuenta de Proveedor' : 'Crear cuenta de Cliente')}
              </button>
            </form>
          </div>

          <!-- Bottom Footer Link -->
          <div class="text-center text-xs text-slate-500 pt-3 border-t border-slate-100 mt-3 select-none">
            ${currentTab === 'login'
              ? '¿No tienes una cuenta? <button type="button" id="btn-switch-tab" class="font-semibold text-[#ea580c] hover:underline cursor-pointer">Regístrate</button>'
              : '¿Ya tienes una cuenta? <button type="button" id="btn-switch-tab" class="font-semibold text-[#ea580c] hover:underline cursor-pointer">Inicia sesión</button>'}
          </div>
        </div>

        <!-- Right Side: Dedicated Showcase (5 cols on desktop, hidden on mobile/tablet to avoid overflow) -->
        <div class="lg:col-span-5 relative hidden lg:block overflow-hidden bg-slate-900 select-none min-h-[460px]">
          <img src="${activeShowcaseImg}" class="w-full h-full object-cover object-center transition-all duration-300" alt="ToolRent Maquinaria y Equipos" />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex flex-col justify-end p-7 text-white">
            <h3 class="text-lg font-bold leading-tight font-display mb-1.5 text-white">
              ${activeShowcaseTitle}
            </h3>
            <p class="text-xs text-slate-300 max-w-sm leading-relaxed">
              ${activeShowcaseDesc}
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

    // Password visibility toggles
    content.querySelector('#btn-toggle-login-pass')?.addEventListener('click', () => {
      const pass = content.querySelector('#login-password');
      if (pass) pass.type = pass.type === 'password' ? 'text' : 'password';
    });
    content.querySelector('#btn-toggle-reg-pass')?.addEventListener('click', () => {
      const pass = content.querySelector('#reg-password');
      if (pass) pass.type = pass.type === 'password' ? 'text' : 'password';
    });

    // Role switcher events without wiping user-typed credentials
    function updateRoleUI(newRole) {
      if (selectedRole === newRole) return;
      selectedRole = newRole;

      const clientBtn = content.querySelector('#role-btn-client');
      const providerBtn = content.querySelector('#role-btn-provider');
      const dynamicContainer = content.querySelector('#dynamic-profile-fields');
      const submitBtn = content.querySelector('#auth-submit-btn');

      if (selectedRole === 'ROLE_CLIENTE') {
        clientBtn?.classList.add('bg-white', 'text-slate-900', 'shadow-xs', 'border', 'border-slate-200', 'font-bold');
        clientBtn?.classList.remove('text-slate-600');
        providerBtn?.classList.remove('bg-white', 'text-slate-900', 'shadow-xs', 'border', 'border-slate-200', 'font-bold');
        providerBtn?.classList.add('text-slate-600');
        if (submitBtn) submitBtn.textContent = 'Crear cuenta de Cliente';
      } else {
        providerBtn?.classList.add('bg-white', 'text-slate-900', 'shadow-xs', 'border', 'border-slate-200', 'font-bold');
        providerBtn?.classList.remove('text-slate-600');
        clientBtn?.classList.remove('bg-white', 'text-slate-900', 'shadow-xs', 'border', 'border-slate-200', 'font-bold');
        clientBtn?.classList.add('text-slate-600');
        if (submitBtn) submitBtn.textContent = 'Crear cuenta de Proveedor';
      }

      if (dynamicContainer) {
        dynamicContainer.innerHTML = renderProfileFieldsHTML(selectedRole);
        bindInputFilters(dynamicContainer);
      }

      const errorBox = content.querySelector('#auth-error-msg');
      if (errorBox) {
        errorBox.classList.add('hidden');
        errorBox.textContent = '';
      }
    }

    content.querySelector('#role-btn-client')?.addEventListener('click', () => updateRoleUI('ROLE_CLIENTE'));
    content.querySelector('#role-btn-provider')?.addEventListener('click', () => updateRoleUI('ROLE_PROVEEDOR'));

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

    // Clear previous input validation errors
    content.querySelectorAll('input').forEach(inp => {
      inp.classList.remove('border-rose-500', 'bg-rose-50/40');
    });

    function showError(message, targetInput = null) {
      errorBox.textContent = message;
      errorBox.classList.remove('hidden');
      if (targetInput) {
        targetInput.classList.add('border-rose-500', 'bg-rose-50/40');
        targetInput.focus();
      }
    }

    if (currentTab === 'login') {
      const usernameInput = content.querySelector('#login-username');
      const passwordInput = content.querySelector('#login-password');
      const username = usernameInput?.value.trim() || '';
      const password = passwordInput?.value || '';

      if (!username) {
        showError('Por favor ingresa tu nombre de usuario o correo corporativo.', usernameInput);
        return;
      }

      // Security scanner on login inputs
      const threat = detectSecurityThreat('Usuario o Correo', username);
      if (threat) {
        showError(threat, usernameInput);
        return;
      }

      if (!password) {
        showError('Por favor ingresa tu contraseña de acceso.', passwordInput);
        return;
      }

      submitBtn.disabled = true;
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.innerHTML = `<span class="inline-block animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full mr-2"></span>Iniciando sesión...`;

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
        showError(translateErrorMessage(err), usernameInput);
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      }
    } else {
      // REGISTRATION VALIDATION & SECURITY SCANNING
      const userInput = content.querySelector('#reg-username');
      const emailInput = content.querySelector('#reg-email');
      const passInput = content.querySelector('#reg-password');

      const username = userInput?.value.trim() || '';
      const email = emailInput?.value.trim() || '';
      const password = passInput?.value || '';

      // 1. Username
      if (!username || username.length < 3 || username.length > 30) {
        showError('El nombre de usuario debe contener entre 3 y 30 caracteres.', userInput);
        return;
      }
      if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
        showError('El nombre de usuario solo puede incluir letras, números, puntos, guiones y guiones bajos (sin espacios).', userInput);
        return;
      }
      const threatUser = detectSecurityThreat('Nombre de usuario', username);
      if (threatUser) {
        showError(threatUser, userInput);
        return;
      }

      // 2. Email
      if (!email || email.length > 60 || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        showError('Por favor ingresa un correo electrónico corporativo válido (ej. usuario@empresa.com).', emailInput);
        return;
      }
      const threatEmail = detectSecurityThreat('Correo electrónico', email);
      if (threatEmail) {
        showError(threatEmail, emailInput);
        return;
      }

      // 3. Password
      if (!password || password.length < 6 || password.length > 50) {
        showError('La contraseña debe contener al menos 6 caracteres (máximo 50).', passInput);
        return;
      }

      // Profile variables according to role
      let fullName = '';
      let phone = '';
      let city = '';
      let documentType = 'CC';
      let documentNumber = '';
      let companyName = '';
      let taxId = '';

      if (selectedRole === 'ROLE_CLIENTE') {
        const nameInput = content.querySelector('#reg-fullName');
        const docInput = content.querySelector('#reg-docNumber');
        const phoneInput = content.querySelector('#reg-phone');
        const cityInput = content.querySelector('#reg-city');

        fullName = nameInput?.value.trim() || '';
        documentNumber = docInput?.value.trim() || '';
        phone = phoneInput?.value.trim() || '';
        city = cityInput?.value.trim() || '';

        // Full name check
        if (!fullName || fullName.length < 3 || fullName.length > 60) {
          showError('El nombre y apellidos deben tener entre 3 y 60 caracteres.', nameInput);
          return;
        }
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.-]+$/.test(fullName)) {
          showError('El nombre solo puede contener letras y espacios.', nameInput);
          return;
        }
        const threatName = detectSecurityThreat('Nombre y Apellidos', fullName);
        if (threatName) {
          showError(threatName, nameInput);
          return;
        }

        // Document number check
        const docClean = documentNumber.replace(/\D/g, '');
        if (!documentNumber || docClean.length < 6 || documentNumber.length > 20) {
          showError('El número de documento de identidad debe contener entre 6 y 20 dígitos numéricos.', docInput);
          return;
        }
        const threatDoc = detectSecurityThreat('Documento de identidad', documentNumber);
        if (threatDoc) {
          showError(threatDoc, docInput);
          return;
        }

        // Phone check
        const phoneDigits = phone.replace(/\D/g, '');
        if (!phone || phoneDigits.length < 7 || phoneDigits.length > 15) {
          showError('El teléfono de contacto debe contener entre 7 y 15 dígitos.', phoneInput);
          return;
        }
        const threatPhone = detectSecurityThreat('Teléfono', phone);
        if (threatPhone) {
          showError(threatPhone, phoneInput);
          return;
        }

        // City check
        if (!city || city.length < 2 || city.length > 40) {
          showError('La ciudad de operación es obligatoria (mínimo 2 caracteres).', cityInput);
          return;
        }
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.-]+$/.test(city)) {
          showError('La ciudad solo puede contener letras y espacios.', cityInput);
          return;
        }
        const threatCity = detectSecurityThreat('Ciudad', city);
        if (threatCity) {
          showError(threatCity, cityInput);
          return;
        }

      } else {
        // ROLE_PROVEEDOR
        const companyInput = content.querySelector('#reg-companyName');
        const taxInput = content.querySelector('#reg-taxId');
        const repInput = content.querySelector('#reg-fullName');
        const phoneInput = content.querySelector('#reg-phone');
        const cityInput = content.querySelector('#reg-city');

        companyName = companyInput?.value.trim() || '';
        taxId = taxInput?.value.trim() || '';
        fullName = repInput?.value.trim() || '';
        phone = phoneInput?.value.trim() || '';
        city = cityInput?.value.trim() || '';

        // Company Name
        if (!companyName || companyName.length < 3 || companyName.length > 80) {
          showError('La Razón Social / Empresa debe tener entre 3 y 80 caracteres.', companyInput);
          return;
        }
        const threatComp = detectSecurityThreat('Razón Social', companyName);
        if (threatComp) {
          showError(threatComp, companyInput);
          return;
        }

        // Tax ID / NIT
        const taxDigits = taxId.replace(/\D/g, '');
        if (!taxId || taxDigits.length < 7 || taxId.length > 20) {
          showError('El NIT o RUT de la empresa es obligatorio (ej. 901234567-8).', taxInput);
          return;
        }
        const threatTax = detectSecurityThreat('NIT o RUT', taxId);
        if (threatTax) {
          showError(threatTax, taxInput);
          return;
        }

        // Contact / Representative
        if (!fullName || fullName.length < 3 || fullName.length > 60) {
          showError('El nombre del contacto o representante debe tener entre 3 y 60 caracteres.', repInput);
          return;
        }
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.-]+$/.test(fullName)) {
          showError('El nombre del representante solo puede contener letras y espacios.', repInput);
          return;
        }
        const threatRep = detectSecurityThreat('Contacto o Representante', fullName);
        if (threatRep) {
          showError(threatRep, repInput);
          return;
        }

        // Corporate Phone
        const phoneDigits = phone.replace(/\D/g, '');
        if (!phone || phoneDigits.length < 7 || phoneDigits.length > 15) {
          showError('El teléfono corporativo debe contener entre 7 y 15 dígitos.', phoneInput);
          return;
        }
        const threatPhone = detectSecurityThreat('Teléfono corporativo', phone);
        if (threatPhone) {
          showError(threatPhone, phoneInput);
          return;
        }

        // City
        if (!city || city.length < 2 || city.length > 40) {
          showError('La ciudad de sede principal es obligatoria (mínimo 2 caracteres).', cityInput);
          return;
        }
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.-]+$/.test(city)) {
          showError('La ciudad solo puede contener letras y espacios.', cityInput);
          return;
        }
        const threatCity = detectSecurityThreat('Ciudad', city);
        if (threatCity) {
          showError(threatCity, cityInput);
          return;
        }
      }

      // Safe address construction
      const address = `${city}, Colombia`;

      submitBtn.disabled = true;
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.innerHTML = `<span class="inline-block animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full mr-2"></span>Registrando cuenta...`;

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
        showError(translateErrorMessage(err));
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      }
    }
  }

  renderView();

  modal.open({
    title: '',
    content,
    maxWidth: 'max-w-md sm:max-w-xl lg:max-w-4xl',
    hideHeader: true
  });
}

export default openAuthModal;
