import auth from '../auth/state.js';
import modal from './modal.js';
import showToast from './toast.js';
import loginShowcaseImg from '../assets/login-showcase.jpg';
import loginAccessImg from '../assets/login-access.jpg';
import { renderIcon, renderToolRentMark } from '../utils/icons.js';
import gsap from 'gsap';

export function openAuthModal(initialTab = 'login', initialRole = 'ROLE_CLIENTE') {
  if (auth.isAuthenticated()) {
    showToast('Ya tienes una sesión activa en la plataforma.', 'info');
    if (auth.isProvider()) {
      window.location.hash = '#/provider';
    } else if (auth.isAdmin()) {
      window.location.hash = '#/admin';
    } else {
      window.location.hash = '#/client';
    }
    return;
  }

  let currentTab = initialTab; // 'login' or 'register'
  let selectedRole = initialRole; // 'ROLE_CLIENTE' or 'ROLE_PROVEEDOR'
  let isSwitchingTab = false;

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
        <div class="auth-animated-row grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label class="block text-[11px] font-semibold text-slate-700 mb-1">Nombre y Apellidos *</label>
            <input type="text" id="reg-fullName" required maxlength="60" autocomplete="name" placeholder="ej. Carlos Gómez" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:ring-4 focus:ring-orange-500/10 focus:bg-white hover:border-slate-300 transition-all duration-200" />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-700 mb-1">Documento de identidad *</label>
            <input type="text" id="reg-docNumber" required maxlength="10" inputmode="numeric" placeholder="Cédula (6 a 10 dígitos, ej. 1020304050)" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:ring-4 focus:ring-orange-500/10 focus:bg-white hover:border-slate-300 transition-all duration-200" />
          </div>
        </div>
        <div class="auth-animated-row grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label class="block text-[11px] font-semibold text-slate-700 mb-1">Teléfono de contacto *</label>
            <input type="tel" id="reg-phone" required maxlength="10" inputmode="tel" autocomplete="tel" placeholder="ej. 3001234567 (10 dígitos)" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:ring-4 focus:ring-orange-500/10 focus:bg-white hover:border-slate-300 transition-all duration-200" />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-700 mb-1">Ciudad de operación *</label>
            <input type="text" id="reg-city" required maxlength="40" autocomplete="address-level2" placeholder="ej. Bogotá" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:ring-4 focus:ring-orange-500/10 focus:bg-white hover:border-slate-300 transition-all duration-200" />
          </div>
        </div>
      `;
    } else {
      return `
        <div class="auth-animated-row grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label class="block text-[11px] font-semibold text-slate-700 mb-1">Razón Social / Empresa *</label>
            <input type="text" id="reg-companyName" required maxlength="80" autocomplete="organization" placeholder="ej. Maquinaria y Equipos S.A.S." class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:ring-4 focus:ring-orange-500/10 focus:bg-white hover:border-slate-300 transition-all duration-200" />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-700 mb-1">NIT o RUT *</label>
            <input type="text" id="reg-taxId" required maxlength="12" inputmode="numeric" placeholder="ej. 901234567-8" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:ring-4 focus:ring-orange-500/10 focus:bg-white hover:border-slate-300 transition-all duration-200" />
          </div>
        </div>
        <div class="auth-animated-row grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label class="block text-[11px] font-semibold text-slate-700 mb-1">Contacto o Representante *</label>
            <input type="text" id="reg-fullName" required maxlength="60" autocomplete="name" placeholder="ej. Laura Sánchez" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:ring-4 focus:ring-orange-500/10 focus:bg-white hover:border-slate-300 transition-all duration-200" />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-700 mb-1">Teléfono corporativo *</label>
            <input type="tel" id="reg-phone" required maxlength="10" inputmode="tel" autocomplete="tel" placeholder="ej. 3109876543 (10 dígitos)" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:ring-4 focus:ring-orange-500/10 focus:bg-white hover:border-slate-300 transition-all duration-200" />
          </div>
        </div>
        <div class="auth-animated-row">
          <label class="block text-[11px] font-semibold text-slate-700 mb-1">Ciudad de sede principal *</label>
          <input type="text" id="reg-city" required maxlength="40" autocomplete="address-level2" placeholder="ej. Medellín" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:ring-4 focus:ring-orange-500/10 focus:bg-white hover:border-slate-300 transition-all duration-200" />
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

    // Register: Username
    const userInput = root.querySelector('#reg-username');
    if (userInput && !userInput._filterBound) {
      userInput._filterBound = true;
      userInput.addEventListener('input', (e) => {
        const clean = e.target.value.replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 30);
        if (e.target.value !== clean) e.target.value = clean;
      });
    }

    // Register: Email
    const emailInput = root.querySelector('#reg-email');
    if (emailInput && !emailInput._filterBound) {
      emailInput._filterBound = true;
      emailInput.addEventListener('input', (e) => {
        const clean = e.target.value.replace(/\s+/g, '').replace(/['"<>;]/g, '').slice(0, 60);
        if (e.target.value !== clean) e.target.value = clean;
      });
    }

    // Register: Password
    const passInput = root.querySelector('#reg-password');
    if (passInput && !passInput._filterBound) {
      passInput._filterBound = true;
      passInput.addEventListener('input', (e) => {
        if (e.target.value.length > 50) e.target.value = e.target.value.slice(0, 50);
      });
    }

    // Register: Full Name / Representative
    const nameInput = root.querySelector('#reg-fullName');
    if (nameInput && !nameInput._filterBound) {
      nameInput._filterBound = true;
      nameInput.addEventListener('input', (e) => {
        const clean = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '').slice(0, 60);
        if (e.target.value !== clean) e.target.value = clean;
      });
    }

    // Register: Company Name
    const companyInput = root.querySelector('#reg-companyName');
    if (companyInput && !companyInput._filterBound) {
      companyInput._filterBound = true;
      companyInput.addEventListener('input', (e) => {
        let clean = e.target.value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s.&-]/g, '').slice(0, 80);
        clean = clean.replace(/[.-]{2,}/g, '.');
        if (e.target.value !== clean) e.target.value = clean;
      });
    }

    // Register: Phone
    const phoneInput = root.querySelector('#reg-phone');
    if (phoneInput && !phoneInput._filterBound) {
      phoneInput._filterBound = true;
      phoneInput.addEventListener('input', (e) => {
        const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
        if (e.target.value !== clean) e.target.value = clean;
      });
    }

    // Register: Document Number
    const docInput = root.querySelector('#reg-docNumber');
    if (docInput && !docInput._filterBound) {
      docInput._filterBound = true;
      docInput.addEventListener('input', (e) => {
        const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
        if (e.target.value !== clean) e.target.value = clean;
      });
    }

    // Register: Tax ID / NIT
    const taxInput = root.querySelector('#reg-taxId');
    if (taxInput && !taxInput._filterBound) {
      taxInput._filterBound = true;
      taxInput.addEventListener('input', (e) => {
        let val = e.target.value.replace(/[^0-9-]/g, '').slice(0, 12);
        const parts = val.split('-');
        if (parts.length > 2) val = parts[0] + '-' + parts.slice(1).join('').replace(/-/g, '');
        if (e.target.value !== val) e.target.value = val;
      });
    }

    // Register: City
    const cityInput = root.querySelector('#reg-city');
    if (cityInput && !cityInput._filterBound) {
      cityInput._filterBound = true;
      cityInput.addEventListener('input', (e) => {
        const clean = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '').slice(0, 40);
        if (e.target.value !== clean) e.target.value = clean;
      });
    }
  }

  // Render the persistent dual-panel modal shell ONCE (Zero-flash architecture)
  content.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-12 overflow-hidden w-full">
      
      <!-- Left Side: Forms Container (7 cols on desktop, full width on mobile) -->
      <div class="lg:col-span-7 p-6 sm:p-7 flex flex-col justify-center bg-white max-h-[85vh] overflow-y-auto">
        <div>
          <!-- Brand Header -->
          <div class="flex items-center gap-2.5 mb-3.5 select-none">
            ${renderToolRentMark('w-8 h-8')}
            <div>
              <span class="text-lg font-bold tracking-tight text-slate-900 font-display">ToolRent</span>
              <p class="text-[10px] text-slate-500 leading-tight">Plataforma de alquiler de maquinaria y herramientas</p>
            </div>
          </div>

          <!-- Segmented Tab Switcher (Unified clean segmented control) -->
          <div class="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-3.5 max-w-xs border border-slate-200/80 select-none gap-1" id="auth-tab-wrapper">
            <button 
              type="button" 
              id="auth-tab-login" 
              class="py-2 px-3 text-xs rounded-lg transition-all duration-200 text-center cursor-pointer ${
                currentTab === 'login'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/90 font-bold'
                  : 'text-slate-600 hover:text-slate-900 font-semibold'
              }"
            >
              Iniciar sesión
            </button>
            <button 
              type="button" 
              id="auth-tab-register" 
              class="py-2 px-3 text-xs rounded-lg transition-all duration-200 text-center cursor-pointer ${
                currentTab === 'register'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/90 font-bold'
                  : 'text-slate-600 hover:text-slate-900 font-semibold'
              }"
            >
              Crear cuenta
            </button>
          </div>

          <!-- Views Container with Fluid Motion Transitions -->
          <div id="auth-views-wrapper" class="relative overflow-hidden w-full">
            <!-- VIEW 1: INICIAR SESIÓN (Persistent in DOM) -->
            <div id="view-login" class="${currentTab === 'login' ? 'block' : 'hidden'} space-y-3">
            <div>
              <h2 class="text-lg font-bold text-slate-900 font-display">Acceso a la plataforma</h2>
              <p class="text-xs text-slate-500 mt-0.5">Ingresa tus credenciales corporativas para gestionar tus reservas.</p>
            </div>

            <form id="auth-login-form" class="space-y-2.5" novalidate>
              <div class="auth-animated-row">
                <label class="block text-[11px] font-semibold text-slate-700 mb-1">Usuario o Correo corporativo</label>
                <div class="relative group">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#ea580c] transition-colors duration-200">
                    ${renderIcon('Mail', 'w-4 h-4')}
                  </span>
                  <input type="text" id="login-username" required maxlength="60" autocomplete="username" placeholder="ej. carlos_gomez o cliente@empresa.com" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 min-h-[44px] text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:ring-4 focus:ring-orange-500/10 focus:bg-white hover:border-slate-300 transition-all duration-200" />
                </div>
              </div>

              <div class="auth-animated-row">
                <label class="block text-[11px] font-semibold text-slate-700 mb-1">Contraseña</label>
                <div class="relative group">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#ea580c] transition-colors duration-200">
                    ${renderIcon('Lock', 'w-4 h-4')}
                  </span>
                  <input type="password" id="login-password" required maxlength="50" autocomplete="current-password" placeholder="••••••••" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg pl-9 pr-9 py-2.5 min-h-[44px] text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:ring-4 focus:ring-orange-500/10 focus:bg-white hover:border-slate-300 transition-all duration-200" />
                  <button type="button" id="btn-toggle-login-pass" class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer min-h-[44px] min-w-[44px] justify-center">
                    ${renderIcon('Eye', 'w-4 h-4')}
                  </button>
                </div>
              </div>

              <div id="auth-login-error" class="hidden text-xs text-rose-700 bg-rose-50/90 border border-rose-200/90 p-3 rounded-xl leading-relaxed"></div>

              <div class="auth-animated-row pt-1">
                <button type="submit" id="login-submit-btn" class="w-full py-2.5 px-4 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] hover:shadow-md text-white text-xs font-semibold shadow-sm active:scale-[0.99] transition-all cursor-pointer">
                  Iniciar sesión
                </button>
              </div>
            </form>
          </div>

          <!-- VIEW 2: REGISTRO (Persistent in DOM) -->
          <div id="view-register" class="${currentTab === 'register' ? 'block' : 'hidden'} space-y-3">
            <div>
              <h2 class="text-lg font-bold text-slate-900 font-display">Registro de usuario</h2>
              <p class="text-xs text-slate-500 mt-0.5">Ingresa los datos básicos para habilitar tu cuenta en ToolRent.</p>
            </div>

            <form id="auth-register-form" class="space-y-2.5" novalidate>
              <div class="auth-animated-row grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label class="block text-[11px] font-semibold text-slate-700 mb-1">Nombre de usuario *</label>
                  <input type="text" id="reg-username" required maxlength="30" autocomplete="username" placeholder="ej. carlos_gomez" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:ring-4 focus:ring-orange-500/10 focus:bg-white hover:border-slate-300 transition-all duration-200" />
                </div>
                <div>
                  <label class="block text-[11px] font-semibold text-slate-700 mb-1">Correo electrónico *</label>
                  <input type="email" id="reg-email" required maxlength="60" autocomplete="email" placeholder="carlos@empresa.com" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg px-3.5 py-2.5 min-h-[44px] text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:ring-4 focus:ring-orange-500/10 focus:bg-white hover:border-slate-300 transition-all duration-200" />
                </div>
              </div>

              <div class="auth-animated-row">
                <label class="block text-[11px] font-semibold text-slate-700 mb-1">Contraseña de acceso *</label>
                <div class="relative group">
                  <input type="password" id="reg-password" required minlength="6" maxlength="50" autocomplete="new-password" placeholder="Mínimo 6 caracteres" class="w-full bg-slate-50/70 border border-slate-200 rounded-lg pl-3.5 pr-10 py-2.5 min-h-[44px] text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#ea580c] focus:ring-4 focus:ring-orange-500/10 focus:bg-white hover:border-slate-300 transition-all duration-200" />
                  <button type="button" id="btn-toggle-reg-pass" class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer min-h-[44px] min-w-[44px] justify-center">
                    ${renderIcon('Eye', 'w-4 h-4')}
                  </button>
                </div>
              </div>

              <!-- Selector de Rol Corporativo -->
              <div class="auth-animated-row pt-1.5 space-y-1 select-none">
                <label class="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tipo de cuenta *</label>
                <div class="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200/80 gap-1" id="role-selector-wrapper">
                  <button type="button" id="role-btn-client" class="py-2 px-3 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                    selectedRole === 'ROLE_CLIENTE'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }">
                    ${renderIcon('User', 'w-4 h-4 text-slate-400')}
                    <span>Cliente (Alquilar)</span>
                  </button>
                  <button type="button" id="role-btn-provider" class="py-2 px-3 text-xs font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                    selectedRole === 'ROLE_PROVEEDOR'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }">
                    ${renderIcon('Building2', 'w-4 h-4 text-slate-400')}
                    <span>Proveedor (Publicar)</span>
                  </button>
                </div>
              </div>

              <!-- Dynamic Profile Fields -->
              <div id="dynamic-profile-fields" class="space-y-2.5 pt-1.5 border-t border-slate-100">
                ${renderProfileFieldsHTML(selectedRole)}
              </div>

              <div id="auth-reg-error" class="hidden text-xs text-rose-700 bg-rose-50/90 border border-rose-200/90 p-3 rounded-xl leading-relaxed"></div>

              <div class="auth-animated-row pt-1">
                <button type="submit" id="reg-submit-btn" class="w-full py-2.5 px-4 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] hover:shadow-md text-white text-xs font-semibold shadow-sm active:scale-[0.99] transition-all cursor-pointer">
                  ${selectedRole === 'ROLE_PROVEEDOR' ? 'Crear cuenta de Proveedor' : 'Crear cuenta de Cliente'}
                </button>
              </div>
            </form>
          </div>
          </div>
        </div>

        <!-- Bottom Footer Link (Persistent & toggled with zero flash) -->
        <div class="text-center text-xs text-slate-500 pt-3 border-t border-slate-100 mt-3 select-none">
          <span id="footer-to-register" class="${currentTab === 'login' ? 'inline' : 'hidden'}">
            ¿No tienes una cuenta? <button type="button" id="btn-goto-register" class="font-semibold text-[#ea580c] hover:underline cursor-pointer">Regístrate</button>
          </span>
          <span id="footer-to-login" class="${currentTab === 'register' ? 'inline' : 'hidden'}">
            ¿Ya tienes una cuenta? <button type="button" id="btn-goto-login" class="font-semibold text-[#ea580c] hover:underline cursor-pointer">Inicia sesión</button>
          </span>
        </div>
      </div>

      <!-- Right Side: Dedicated Showcase (Permanent in DOM with Motion Canvas & Dual-Image Crossfade) -->
      <div id="auth-showcase-box" class="lg:col-span-5 relative hidden lg:block overflow-hidden bg-slate-900 select-none min-h-[460px]">
        <!-- Showcase Slide 1: Login (loginAccessImg) -->
        <div id="showcase-login" class="absolute inset-0 transition-opacity duration-300 ease-in-out ${currentTab === 'login' ? 'opacity-100' : 'opacity-0 pointer-events-none'}">
          <img src="${loginAccessImg}" class="w-full h-full object-cover object-center" alt="Acceso a la plataforma ToolRent" />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex flex-col justify-end p-7 text-white">
            <h3 class="text-lg font-bold leading-tight font-display mb-1.5 text-white">
              Acceso a la plataforma
            </h3>
            <p class="text-xs text-slate-300 max-w-sm leading-relaxed">
              Gestiona reservas, consulta disponibilidad y administra tus alquileres en tiempo real.
            </p>
          </div>
        </div>

        <!-- Showcase Slide 2: Register (loginShowcaseImg) -->
        <div id="showcase-register" class="absolute inset-0 transition-opacity duration-300 ease-in-out ${currentTab === 'register' ? 'opacity-100' : 'opacity-0 pointer-events-none'}">
          <img src="${loginShowcaseImg}" class="w-full h-full object-cover object-center" alt="Gestión y alquiler de maquinaria pesada" />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex flex-col justify-end p-7 text-white">
            <h3 class="text-lg font-bold leading-tight font-display mb-1.5 text-white">
              Gestión y alquiler de maquinaria pesada
            </h3>
            <p class="text-xs text-slate-300 max-w-sm leading-relaxed">
              Equipos de construcción certificados, disponibilidad inmediata y entrega coordinada en obra.
            </p>
          </div>
        </div>

      </div>

    </div>
  `;

  // Bind input security sanitizers immediately on the static DOM
  bindInputFilters(content);

  // Helper para renderizar y orquestar el Overlay de Transición Minimalista y Ejecutivo (#auth-transition-overlay)
  function createTransitionOverlay(rootEl, mode = 'login') {
    const isLogin = mode === 'login';
    const overlay = document.createElement('div');
    overlay.id = 'auth-transition-overlay';
    overlay.className = 'fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-modal-in';

    // Ocultar suavemente el contenedor padre para garantizar UNA SOLA tarjeta sin cajas anidadas
    const parentModalBox = document.getElementById('modal-box');
    if (parentModalBox) {
      parentModalBox.style.opacity = '0';
      parentModalBox.style.pointerEvents = 'none';
    }

    function formatRoleName(role) {
      if (!role) return 'Panel Cliente';
      const clean = String(role).toUpperCase().replace('ROLE_', '');
      if (clean === 'ADMIN') return 'Panel Administrador';
      if (clean === 'PROVEEDOR') return 'Panel Proveedor';
      if (clean === 'CLIENTE') return 'Panel Cliente';
      return `Panel ${clean}`;
    }

    function getRoleHumanName(role) {
      if (!role) return 'Cliente';
      const clean = String(role).toUpperCase().replace('ROLE_', '');
      if (clean === 'ADMIN') return 'Administrador';
      if (clean === 'PROVEEDOR') return 'Proveedor';
      if (clean === 'CLIENTE') return 'Cliente';
      return clean.charAt(0) + clean.slice(1).toLowerCase();
    }

    const initialTitle = isLogin ? 'Iniciando sesión...' : 'Creando tu cuenta...';
    const initialSubtitle = 'Configurando tus credenciales...';
    const initialStatus = isLogin ? 'Validando acceso...' : 'Registrando cuenta...';
    const initialRole = isLogin ? 'Acceso Seguro' : formatRoleName(selectedRole);
    const initialPercent = isLogin ? 30 : 35;

    overlay.innerHTML = `
      <div class="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl border border-slate-200/80 text-center animate-modal-in relative overflow-hidden">
        <!-- Icono superior minimalista (48px) -->
        <div id="loader-icon-container" class="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-50 border border-slate-200/70 flex items-center justify-center transition-all duration-300">
          <div id="loader-spinner" class="w-5 h-5 border-2 border-slate-200 border-t-[#0B2239] rounded-full animate-spin"></div>
        </div>

        <!-- Título Principal -->
        <h3 id="loader-title" class="text-base font-semibold text-[#0B2239] tracking-tight">
          ${initialTitle}
        </h3>

        <!-- Subtítulo Dinámico y Humano -->
        <p id="loader-subtitle" class="text-xs text-slate-500 mt-1 leading-relaxed">
          ${initialSubtitle}
        </p>

        <!-- Barra de Progreso Ultra-Sutil (h-1) -->
        <div class="h-1 w-full bg-slate-100 rounded-full overflow-hidden mt-5">
          <div id="loader-progress-fill" class="h-full bg-[#0B2239] transition-all duration-500 ease-out" style="width: ${initialPercent}%;"></div>
        </div>

        <!-- Línea inferior discreta de estado y rol -->
        <div class="mt-3 flex items-center justify-between text-[11px] text-slate-400 font-medium select-none">
          <span id="loader-status-text" class="truncate max-w-[190px] text-left">${initialStatus}</span>
          <span id="loader-role-text" class="text-slate-500 font-semibold text-right">${initialRole}</span>
        </div>

        <!-- Contenedor de Error Minimalista (oculto por defecto) -->
        <div id="loader-error-box" class="hidden mt-4 pt-3 border-t border-slate-100 text-left space-y-2">
          <p id="loader-error-msg" class="text-xs text-rose-600 leading-relaxed"></p>
          <button type="button" id="loader-btn-dismiss" class="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer text-center">
            ${isLogin ? 'Corregir credenciales' : 'Corregir formulario'}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    function restoreParentModal() {
      if (parentModalBox) {
        parentModalBox.style.opacity = '1';
        parentModalBox.style.pointerEvents = '';
      }
    }

    return {
      update(prog) {
        const titleEl = overlay.querySelector('#loader-title');
        const subtitleEl = overlay.querySelector('#loader-subtitle');
        const progressFill = overlay.querySelector('#loader-progress-fill');
        const statusText = overlay.querySelector('#loader-status-text');
        const roleText = overlay.querySelector('#loader-role-text');
        const iconContainer = overlay.querySelector('#loader-icon-container');

        if (progressFill && prog.percent) {
          progressFill.style.width = `${prog.percent}%`;
        }

        if (prog.step === 1) {
          if (titleEl) titleEl.textContent = isLogin ? 'Iniciando sesión...' : 'Creando tu cuenta...';
          if (subtitleEl) subtitleEl.textContent = 'Configurando tus credenciales...';
          if (statusText) statusText.textContent = isLogin ? 'Validando acceso...' : 'Registrando cuenta...';
        } else if (prog.step === 2) {
          if (titleEl) titleEl.textContent = 'Verificando acceso...';
          if (subtitleEl) subtitleEl.textContent = 'Sincronizando tu espacio de trabajo...';
          if (statusText) statusText.textContent = 'Sincronizando perfil...';
        } else if (prog.step === 3) {
          const userName = prog.data?.nombre || prog.data?.username || 'usuario';
          const roleClean = prog.data?.rol || 'CLIENTE';
          const roleHuman = getRoleHumanName(roleClean);
          const friendlyRole = formatRoleName(roleClean);

          if (titleEl) titleEl.textContent = `¡Hola, ${userName}!`;
          if (subtitleEl) subtitleEl.textContent = `Redirigiendo al panel de ${roleHuman}...`;
          if (statusText) {
            statusText.textContent = 'Sesión verificada';
            statusText.className = 'text-emerald-600 font-semibold truncate max-w-[190px] text-left';
          }
          if (roleText) {
            roleText.textContent = friendlyRole;
            roleText.className = 'text-[#0B2239] font-semibold text-right';
          }

          if (progressFill) {
            progressFill.className = 'h-full bg-emerald-500 transition-all duration-500 ease-out';
          }

          if (iconContainer) {
            iconContainer.className = 'w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-50 border border-emerald-200/80 flex items-center justify-center transition-all duration-300';
            iconContainer.innerHTML = `
              <svg class="w-6 h-6 text-emerald-600 animate-check-pop" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            `;
          }
        }
      },
      showError(errText, onDismiss) {
        const errorBox = overlay.querySelector('#loader-error-box');
        const errorMsg = overlay.querySelector('#loader-error-msg');
        const dismissBtn = overlay.querySelector('#loader-btn-dismiss');
        const iconContainer = overlay.querySelector('#loader-icon-container');
        const titleEl = overlay.querySelector('#loader-title');
        const subtitleEl = overlay.querySelector('#loader-subtitle');
        const progressFill = overlay.querySelector('#loader-progress-fill');

        if (progressFill) progressFill.className = 'h-full bg-rose-500 transition-all duration-300';
        if (iconContainer) {
          iconContainer.className = 'w-12 h-12 mx-auto mb-4 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center';
          iconContainer.innerHTML = `
            <svg class="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          `;
        }
        if (titleEl) titleEl.textContent = 'No fue posible continuar';
        if (subtitleEl) subtitleEl.textContent = 'Por favor verifica la información ingresada';

        if (errorMsg) errorMsg.textContent = errText;
        if (errorBox) errorBox.classList.remove('hidden');

        dismissBtn?.addEventListener('click', () => {
          overlay.classList.add('opacity-0');
          setTimeout(() => {
            if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
            restoreParentModal();
            if (typeof onDismiss === 'function') onDismiss();
          }, 150);
        });
      },
      close() {
        overlay.classList.add('opacity-0', 'transition-opacity', 'duration-200');
        setTimeout(() => {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
          restoreParentModal();
        }, 200);
      }
    };
  }

  // Staggered cascade entrance animation for inputs using GSAP
  function triggerInputsEntrance(viewEl) {
    if (!viewEl) return;
    const rows = Array.from(viewEl.querySelectorAll('.auth-animated-row'));
    if (rows.length === 0) return;

    gsap.fromTo(
      rows,
      { opacity: 0, y: 12 },
      {
        opacity: 1,
        y: 0,
        duration: 0.25,
        stagger: 0.035,
        ease: 'power2.out',
        overwrite: 'auto'
      }
    );
  }

  // Fluid Directional Tab Switching with GSAP & Showcase Canvas Wave
  async function switchTab(newTab) {
    if (currentTab === newTab || isSwitchingTab) return;
    const prevTab = currentTab;
    currentTab = newTab;
    isSwitchingTab = true;

    // 1. Wipe all input fields in both forms
    content.querySelectorAll('input').forEach(inp => {
      inp.value = '';
      inp.classList.remove('border-rose-500', 'bg-rose-50/40');
    });

    // 2. Hide error messages
    const loginErr = content.querySelector('#auth-login-error');
    const regErr = content.querySelector('#auth-reg-error');
    if (loginErr) { loginErr.classList.add('hidden'); loginErr.textContent = ''; }
    if (regErr) { regErr.classList.add('hidden'); regErr.textContent = ''; }

    const viewLogin = content.querySelector('#view-login');
    const viewRegister = content.querySelector('#view-register');
    const tabBtnLogin = content.querySelector('#auth-tab-login');
    const tabBtnRegister = content.querySelector('#auth-tab-register');
    const footerToRegister = content.querySelector('#footer-to-register');
    const footerToLogin = content.querySelector('#footer-to-login');
    const showcaseLogin = content.querySelector('#showcase-login');
    const showcaseRegister = content.querySelector('#showcase-register');

    // Update Tab Button Styles & Footer Link
    if (newTab === 'login') {
      tabBtnLogin?.classList.add('bg-white', 'text-slate-900', 'shadow-xs', 'border', 'border-slate-200/90', 'font-bold');
      tabBtnLogin?.classList.remove('text-slate-600');
      tabBtnRegister?.classList.remove('bg-white', 'text-slate-900', 'shadow-xs', 'border', 'border-slate-200/90', 'font-bold');
      tabBtnRegister?.classList.add('text-slate-600');

      footerToRegister?.classList.remove('hidden');
      footerToLogin?.classList.add('hidden');
    } else {
      tabBtnRegister?.classList.add('bg-white', 'text-slate-900', 'shadow-xs', 'border', 'border-slate-200/90', 'font-bold');
      tabBtnRegister?.classList.remove('text-slate-600');
      tabBtnLogin?.classList.remove('bg-white', 'text-slate-900', 'shadow-xs', 'border', 'border-slate-200/90', 'font-bold');
      tabBtnLogin?.classList.add('text-slate-600');

      footerToLogin?.classList.remove('hidden');
      footerToRegister?.classList.add('hidden');
    }

    // 6. Cross-fade showcase panel to appropriate image with micro-zoom GSAP
    if (newTab === 'login') {
      if (showcaseLogin) {
        showcaseLogin.classList.remove('opacity-0', 'pointer-events-none');
        showcaseLogin.classList.add('opacity-100');
        gsap.fromTo(showcaseLogin, { scale: 1.03 }, { scale: 1, duration: 0.32, ease: 'power2.out' });
      }
      if (showcaseRegister) {
        showcaseRegister.classList.remove('opacity-100');
        showcaseRegister.classList.add('opacity-0', 'pointer-events-none');
      }
    } else {
      if (showcaseRegister) {
        showcaseRegister.classList.remove('opacity-0', 'pointer-events-none');
        showcaseRegister.classList.add('opacity-100');
        gsap.fromTo(showcaseRegister, { scale: 1.03 }, { scale: 1, duration: 0.32, ease: 'power2.out' });
      }
      if (showcaseLogin) {
        showcaseLogin.classList.remove('opacity-100');
        showcaseLogin.classList.add('opacity-0', 'pointer-events-none');
      }
    }

    // 7. Directional GSAP Transition between Form Panels
    // login -> register: direction = 1 (exit left, enter from right)
    // register -> login: direction = -1 (exit right, enter from left)
    const direction = newTab === 'register' ? 1 : -1;
    const leavingView = prevTab === 'login' ? viewLogin : viewRegister;
    const enteringView = newTab === 'login' ? viewLogin : viewRegister;

    if (leavingView && enteringView) {
      await new Promise((resolve) => {
        gsap.to(leavingView, {
          opacity: 0,
          x: -22 * direction,
          duration: 0.16,
          ease: 'power2.in',
          onComplete: resolve
        });
      });

      leavingView.classList.add('hidden');
      gsap.set(leavingView, { clearProps: 'transform,opacity' });

      enteringView.classList.remove('hidden');
      gsap.fromTo(
        enteringView,
        { opacity: 0, x: 22 * direction },
        {
          opacity: 1,
          x: 0,
          duration: 0.26,
          ease: 'power2.out'
        }
      );

      triggerInputsEntrance(enteringView);
    }

    isSwitchingTab = false;
  }

  content.querySelector('#auth-tab-login')?.addEventListener('click', () => switchTab('login'));
  content.querySelector('#auth-tab-register')?.addEventListener('click', () => switchTab('register'));
  content.querySelector('#btn-goto-register')?.addEventListener('click', () => switchTab('register'));
  content.querySelector('#btn-goto-login')?.addEventListener('click', () => switchTab('login'));

  // Password visibility toggles
  content.querySelector('#btn-toggle-login-pass')?.addEventListener('click', () => {
    const pass = content.querySelector('#login-password');
    if (pass) pass.type = pass.type === 'password' ? 'text' : 'password';
  });
  content.querySelector('#btn-toggle-reg-pass')?.addEventListener('click', () => {
    const pass = content.querySelector('#reg-password');
    if (pass) pass.type = pass.type === 'password' ? 'text' : 'password';
  });

  // Role switching inside Register
  function updateRoleUI(newRole) {
    if (selectedRole === newRole) return;
    selectedRole = newRole;

    const clientBtn = content.querySelector('#role-btn-client');
    const providerBtn = content.querySelector('#role-btn-provider');
    const dynamicContainer = content.querySelector('#dynamic-profile-fields');
    const regSubmitBtn = content.querySelector('#reg-submit-btn');

    if (selectedRole === 'ROLE_CLIENTE') {
      clientBtn?.classList.add('bg-white', 'text-slate-900', 'shadow-xs', 'border', 'border-slate-200', 'font-bold');
      clientBtn?.classList.remove('text-slate-600');
      providerBtn?.classList.remove('bg-white', 'text-slate-900', 'shadow-xs', 'border', 'border-slate-200', 'font-bold');
      providerBtn?.classList.add('text-slate-600');
      if (regSubmitBtn) regSubmitBtn.textContent = 'Crear cuenta de Cliente';
    } else {
      providerBtn?.classList.add('bg-white', 'text-slate-900', 'shadow-xs', 'border', 'border-slate-200', 'font-bold');
      providerBtn?.classList.remove('text-slate-600');
      clientBtn?.classList.remove('bg-white', 'text-slate-900', 'shadow-xs', 'border', 'border-slate-200', 'font-bold');
      clientBtn?.classList.add('text-slate-600');
      if (regSubmitBtn) regSubmitBtn.textContent = 'Crear cuenta de Proveedor';
    }

    if (dynamicContainer) {
      dynamicContainer.innerHTML = renderProfileFieldsHTML(selectedRole);
      bindInputFilters(dynamicContainer);
      dynamicContainer.querySelectorAll('input').forEach(inp => { inp.value = ''; });

      // Animate newly inserted profile inputs with GSAP stagger
      const dynamicRows = Array.from(dynamicContainer.querySelectorAll('.auth-animated-row'));
      if (dynamicRows.length > 0) {
        gsap.fromTo(
          dynamicRows,
          { opacity: 0, y: 10 },
          {
            opacity: 1,
            y: 0,
            duration: 0.22,
            stagger: 0.03,
            ease: 'power2.out',
            overwrite: 'auto'
          }
        );
      }
    }

    const regErr = content.querySelector('#auth-reg-error');
    if (regErr) { regErr.classList.add('hidden'); regErr.textContent = ''; }
  }

  content.querySelector('#role-btn-client')?.addEventListener('click', () => updateRoleUI('ROLE_CLIENTE'));
  content.querySelector('#role-btn-provider')?.addEventListener('click', () => updateRoleUI('ROLE_PROVEEDOR'));

  // ==========================================
  // 1. SUBMIT LOGIN HANDLER
  // ==========================================
  const loginForm = content.querySelector('#auth-login-form');
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = content.querySelector('#auth-login-error');
    const submitBtn = content.querySelector('#login-submit-btn');
    errorBox.classList.add('hidden');
    errorBox.textContent = '';

    content.querySelectorAll('#view-login input').forEach(inp => {
      inp.classList.remove('border-rose-500', 'bg-rose-50/40');
    });

    function showLoginError(msg, targetInput = null) {
      errorBox.textContent = msg;
      errorBox.classList.remove('hidden');
      if (targetInput) {
        targetInput.classList.add('border-rose-500', 'bg-rose-50/40');
        targetInput.focus();
      }
    }

    const usernameInput = content.querySelector('#login-username');
    const passwordInput = content.querySelector('#login-password');
    const username = usernameInput?.value.trim() || '';
    const password = passwordInput?.value || '';

    if (!username) {
      showLoginError('Por favor ingresa tu nombre de usuario o correo corporativo.', usernameInput);
      return;
    }

    const threat = detectSecurityThreat('Usuario o Correo', username);
    if (threat) {
      showLoginError(threat, usernameInput);
      return;
    }

    if (!password) {
      showLoginError('Por favor ingresa tu contraseña de acceso.', passwordInput);
      return;
    }

    submitBtn.disabled = true;
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = `<span class="inline-block animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full mr-2"></span>Iniciando sesión...`;

    const transition = createTransitionOverlay(content, 'login');

    try {
      const result = await auth.login(username, password, (progress) => {
        transition.update(progress);
      });

      await new Promise((resolve) => setTimeout(resolve, 650));

      showToast(`¡Bienvenido de nuevo, ${result.session?.nombre || username}!`, 'success');
      transition.close();
      modal.close();

      const verifiedRole = (result.rol || '').toUpperCase();
      if (verifiedRole === 'ADMIN' || verifiedRole === 'ROLE_ADMIN') {
        window.location.hash = '#/admin';
      } else if (verifiedRole === 'PROVEEDOR' || verifiedRole === 'ROLE_PROVEEDOR') {
        window.location.hash = '#/provider';
      } else {
        window.location.hash = '#/client';
      }
    } catch (err) {
      transition.showError(translateErrorMessage(err), () => {
        showLoginError(translateErrorMessage(err), passwordInput);
      });
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    }
  });

  // ==========================================
  // 2. SUBMIT REGISTER HANDLER
  // ==========================================
  const registerForm = content.querySelector('#auth-register-form');
  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorBox = content.querySelector('#auth-reg-error');
    const submitBtn = content.querySelector('#reg-submit-btn');
    errorBox.classList.add('hidden');
    errorBox.textContent = '';

    content.querySelectorAll('#view-register input').forEach(inp => {
      inp.classList.remove('border-rose-500', 'bg-rose-50/40');
    });

    function showRegError(msg, targetInput = null) {
      errorBox.textContent = msg;
      errorBox.classList.remove('hidden');
      if (targetInput) {
        targetInput.classList.add('border-rose-500', 'bg-rose-50/40');
        targetInput.focus();
      }
    }

    const userInput = content.querySelector('#reg-username');
    const emailInput = content.querySelector('#reg-email');
    const passInput = content.querySelector('#reg-password');

    const username = userInput?.value.trim() || '';
    const email = emailInput?.value.trim() || '';
    const password = passInput?.value || '';

    // 1. Username
    if (!username || username.length < 3 || username.length > 30) {
      showRegError('El nombre de usuario debe contener entre 3 y 30 caracteres.', userInput);
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      showRegError('El nombre de usuario solo puede incluir letras, números, puntos, guiones y guiones bajos (sin espacios).', userInput);
      return;
    }
    const threatUser = detectSecurityThreat('Nombre de usuario', username);
    if (threatUser) {
      showRegError(threatUser, userInput);
      return;
    }

    // 2. Email
    if (!email || email.length > 60) {
      showRegError('Por favor ingresa un correo electrónico válido (máximo 60 caracteres).', emailInput);
      return;
    }
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email)) {
      showRegError('El formato del correo electrónico es inválido (ej. usuario@dominio.com).', emailInput);
      return;
    }
    const threatEmail = detectSecurityThreat('Correo electrónico', email);
    if (threatEmail) {
      showRegError(threatEmail, emailInput);
      return;
    }

    // 3. Password
    if (!password || password.length < 6 || password.length > 50) {
      showRegError('La contraseña debe tener entre 6 y 50 caracteres para garantizar la seguridad.', passInput);
      return;
    }
    const threatPass = detectSecurityThreat('Contraseña', password);
    if (threatPass) {
      showRegError(threatPass, passInput);
      return;
    }

    // 4. Role specific validations
    let fullName = '';
    let documentNumber = '';
    let phone = '';
    let city = '';
    let companyName = '';
    let taxId = '';
    let documentType = 'CC';

    if (selectedRole === 'ROLE_CLIENTE') {
      const nameInput = content.querySelector('#reg-fullName');
      const docInput = content.querySelector('#reg-docNumber');
      const phoneInput = content.querySelector('#reg-phone');
      const cityInput = content.querySelector('#reg-city');

      fullName = nameInput?.value.trim() || '';
      documentNumber = docInput?.value.trim() || '';
      phone = phoneInput?.value.trim() || '';
      city = cityInput?.value.trim() || '';

      if (!fullName || fullName.length < 3 || fullName.length > 60) {
        showRegError('Por favor ingresa tus nombres y apellidos completos (mínimo 3 letras).', nameInput);
        return;
      }
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]{3,60}$/.test(fullName) || (fullName.match(/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/g) || []).length < 3) {
        showRegError('El nombre completo solo puede contener letras y espacios (sin números, puntos ni caracteres especiales).', nameInput);
        return;
      }
      const threatName = detectSecurityThreat('Nombre completo', fullName);
      if (threatName) {
        showRegError(threatName, nameInput);
        return;
      }

      if (!/^\d{6,10}$/.test(documentNumber)) {
        showRegError('El número de documento debe contener entre 6 y 10 dígitos numéricos (ej. 1020304050).', docInput);
        return;
      }
      const threatDoc = detectSecurityThreat('Número de documento', documentNumber);
      if (threatDoc) {
        showRegError(threatDoc, docInput);
        return;
      }

      if (!/^\d{10}$/.test(phone)) {
        showRegError('El teléfono de contacto debe contener exactamente 10 dígitos numéricos (ej. 3001234567).', phoneInput);
        return;
      }
      const threatPhone = detectSecurityThreat('Teléfono', phone);
      if (threatPhone) {
        showRegError(threatPhone, phoneInput);
        return;
      }

      if (!city || city.length < 3 || city.length > 40) {
        showRegError('Por favor ingresa una ciudad de operación válida (ej. Bogotá).', cityInput);
        return;
      }
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]{3,40}$/.test(city) || (city.match(/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/g) || []).length < 3) {
        showRegError('La ciudad solo puede contener letras y espacios (sin números, puntos ni caracteres especiales, ej. Bogotá).', cityInput);
        return;
      }
      const threatCity = detectSecurityThreat('Ciudad', city);
      if (threatCity) {
        showRegError(threatCity, cityInput);
        return;
      }
    } else {
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

      if (!companyName || companyName.length < 3 || companyName.length > 80) {
        showRegError('La Razón Social / Empresa debe tener entre 3 y 80 caracteres.', companyInput);
        return;
      }
      const compAlpha = (companyName.match(/[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ]/g) || []).length;
      if (compAlpha < 3 || /^[.\s-]+$/.test(companyName)) {
        showRegError('La Razón Social debe contener al menos 3 caracteres alfanuméricos legibles.', companyInput);
        return;
      }
      const threatComp = detectSecurityThreat('Razón Social', companyName);
      if (threatComp) {
        showRegError(threatComp, companyInput);
        return;
      }

      if (!/^\d{8,10}(-\d)?$/.test(taxId)) {
        showRegError('El NIT o RUT de la empresa debe tener entre 8 y 10 dígitos (ej. 901234567-8).', taxInput);
        return;
      }
      const threatTax = detectSecurityThreat('NIT o RUT', taxId);
      if (threatTax) {
        showRegError(threatTax, taxInput);
        return;
      }

      if (!fullName || fullName.length < 3 || fullName.length > 60) {
        showRegError('El nombre del contacto o representante debe tener entre 3 y 60 caracteres.', repInput);
        return;
      }
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]{3,60}$/.test(fullName) || (fullName.match(/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/g) || []).length < 3) {
        showRegError('El nombre del representante solo puede contener letras y espacios.', repInput);
        return;
      }
      const threatRep = detectSecurityThreat('Contacto o Representante', fullName);
      if (threatRep) {
        showRegError(threatRep, repInput);
        return;
      }

      if (!/^\d{10}$/.test(phone)) {
        showRegError('El teléfono corporativo debe contener exactamente 10 dígitos numéricos (ej. 3109876543).', phoneInput);
        return;
      }
      const threatPhone = detectSecurityThreat('Teléfono corporativo', phone);
      if (threatPhone) {
        showRegError(threatPhone, phoneInput);
        return;
      }

      if (!city || city.length < 3 || city.length > 40) {
        showRegError('La ciudad de sede principal debe tener entre 3 y 40 caracteres.', cityInput);
        return;
      }
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]{3,40}$/.test(city) || (city.match(/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/g) || []).length < 3) {
        showRegError('La ciudad solo puede contener letras y espacios (ej. Medellín).', cityInput);
        return;
      }
      const threatCity = detectSecurityThreat('Ciudad', city);
      if (threatCity) {
        showRegError(threatCity, cityInput);
        return;
      }
    }

    const address = `${city}, Colombia`;

    submitBtn.disabled = true;
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = `<span class="inline-block animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full mr-2"></span>Registrando cuenta...`;

    const transition = createTransitionOverlay(content, 'register');

    try {
      const result = await auth.register(
        {
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
        },
        (progress) => {
          transition.update(progress);
        }
      );

      await new Promise((resolve) => setTimeout(resolve, 600));

      showToast(`¡Bienvenido a ToolRent! Sesión iniciada como ${result.rol || 'Cliente'}.`, 'success');
      transition.close();
      modal.close();

      const verifiedRole = (result.rol || '').toUpperCase();
      if (verifiedRole === 'ADMIN' || verifiedRole === 'ROLE_ADMIN') {
        window.location.hash = '#/admin';
      } else if (verifiedRole === 'PROVEEDOR' || verifiedRole === 'ROLE_PROVEEDOR') {
        window.location.hash = '#/provider';
      } else {
        window.location.hash = '#/client';
      }
    } catch (err) {
      transition.showError(translateErrorMessage(err), () => {
        showRegError(translateErrorMessage(err));
      });
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    }
  });

  modal.open({
    title: '',
    content,
    maxWidth: 'max-w-md sm:max-w-xl lg:max-w-4xl',
    hideHeader: true
  });

  // Stagger inputs entrance on initial modal open
  requestAnimationFrame(() => {
    const activeView = currentTab === 'login'
      ? content.querySelector('#view-login')
      : content.querySelector('#view-register');
    triggerInputsEntrance(activeView);
  });
}

export default openAuthModal;
