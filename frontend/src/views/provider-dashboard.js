import api from '../api/client.js';
import auth from '../auth/state.js';
import showToast from '../components/toast.js';
import modal from '../components/modal.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { renderIcon } from '../utils/icons.js';
import { openInvoiceViewer } from './rental-modal.js';
import { openAuthModal } from '../components/auth-modal.js';
import { notificationsStore } from '../utils/notifications-store.js';
import { renderSparkline, renderSegmentedLevel, renderCrmStatusBadge } from '../components/crm-sparkline.js';
import { openCrmOverviewCard } from '../components/crm-overview-card.js';
import { setupCrmBulkBar } from '../components/crm-bulk-bar.js';

function sanitizeEncoding(str) {
  if (!str || typeof str !== 'string') return str || '';
  return str
    .replace(/Sof\?\?a/gi, 'Sofía')
    .replace(/Ib\?{2,4}ez/gi, 'Ibáñez')
    .replace(/Mar\?\?a/gi, 'María')
    .replace(/Rodr\?{2}guez/gi, 'Rodríguez')
    .replace(/Le\?{2}n/gi, 'León')
    .replace(/G\?{2}mez/gi, 'Gómez')
    .replace(/P\?{2}rez/gi, 'Pérez')
    .replace(/S\?{2}nchez/gi, 'Sánchez')
    .replace(/Mart\?\?nez/gi, 'Martínez')
    .replace(/D\?\?az/gi, 'Díaz')
    .replace(/Hern\?\?ndez/gi, 'Hernández')
    .replace(/Bogot\?\?/gi, 'Bogotá')
    .replace(/Medell\?\?n/gi, 'Medellín')
    .replace(/\?{2,}/g, '');
}

// Predefined quick-start templates for providers to populate tools with 1 click
const QUICK_TEMPLATES = [
  {
    name: 'Martillo Demoledor Hexagonal 30kg',
    brand: 'Bosch Professional',
    model: 'GSH 27 VC',
    dailyPrice: 85000,
    replacementValue: 3200000,
    categoryKeyword: 'Demolición',
    description: 'Martillo demoledor de máxima potencia para ruptura de pavimentos, losas de concreto y cimentaciones pesadas. Energía de impacto 62 Joules con sistema antivibración.',
    imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1000'
  },
  {
    name: 'Allanadora de Concreto 36" (Helicóptero)',
    brand: 'Multiquip Whiteman',
    model: 'J36H55',
    dailyPrice: 70000,
    replacementValue: 4500000,
    categoryKeyword: 'Hormigón',
    description: 'Allanadora mecánica con motor a gasolina Honda 5.5 HP para acabados de alta planicidad y pulido espejo en pisos industriales de concreto fresco.',
    imageUrl: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=1000'
  },
  {
    name: 'Generador Diésel Insonorizado 7.5 kVA',
    brand: 'Caterpillar / Perkins',
    model: 'DE7.5E3',
    dailyPrice: 95000,
    replacementValue: 6800000,
    categoryKeyword: 'Generación',
    description: 'Planta eléctrica cabinada insonorizada de 7.5 kVA, 110V/220V monofásica y trifásica con regulador automático de voltaje (AVR) y autonomía de 12 horas.',
    imageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1000'
  },
  {
    name: 'Andamio Certificado Multidireccional (Sección 6m)',
    brand: 'Layher Allround',
    model: 'Ringlock AR-200',
    dailyPrice: 40000,
    replacementValue: 2800000,
    categoryKeyword: 'Elevación',
    description: 'Torre de andamio multidireccional con certificación OSHA/NTC, plataformas antideslizantes de acero galvanizado, rodapiés, diagonales y escaleras internas.',
    imageUrl: '/images/scaffold-1.jpg'
  }
];

export async function renderProviderDashboard() {
  const container = document.getElementById('app-content');
  if (!container) return;

  // 1. Guard: Check authentication
  if (!auth.isAuthenticated()) {
    container.innerHTML = `
      <section class="max-w-4xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div class="crm-card p-10 max-w-lg mx-auto space-y-4">
          <div class="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 border border-orange-200/80 flex items-center justify-center mx-auto shadow-2xs">
            ${renderIcon('Lock', 'w-7 h-7')}
          </div>
          <h2 class="text-xl font-bold text-zinc-900 font-display">Portal para Proveedores</h2>
          <p class="text-xs text-zinc-500 leading-relaxed">Inicia sesión con tu cuenta de proveedor para gestionar inventario, publicar maquinaria, despachar alquileres y emitir facturación.</p>
          <div class="flex justify-center pt-2">
            <button id="btn-login-provider-prompt" class="btn-primary !py-2.5 !px-8 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm cursor-pointer">
              ${renderIcon('LogIn', 'w-4 h-4')} Iniciar Sesión como Proveedor
            </button>
          </div>
        </div>
      </section>
    `;
    container.querySelector('#btn-login-provider-prompt')?.addEventListener('click', () => openAuthModal('login'));
    return;
  }

  // 2. Guard: Role verification
  const user = auth.getUser();
  const isAdmin = auth.isAdmin();
  let isProvider = auth.isProvider();

  let allProvidersList = [];
  let providerProfile = user?.profile;

  // Si el usuario es Administrador, tiene acceso total de supervisión sobre los proveedores
  if (isAdmin) {
    try {
      allProvidersList = await api.get('/providers').catch(() => []);
      if (Array.isArray(allProvidersList) && allProvidersList.length > 0) {
        const hashParams = new URLSearchParams((window.location.hash || '').split('?')[1] || '');
        const requestedProviderId = hashParams.get('providerId');
        providerProfile = allProvidersList.find(p => p.id === requestedProviderId) || allProvidersList[0];
        isProvider = true;
      }
    } catch (e) {
      console.warn('Error cargando lista de proveedores para administrador', e);
    }
  }

  // Pre-hidratar perfil desde sessionStorage (toolrent_user_context) para evitar roundtrips innecesarios
  const storedContext = auth.getVerifiedSession();
  if (storedContext && (storedContext.rol === 'PROVEEDOR' || storedContext.rol === 'ROLE_PROVEEDOR')) {
    isProvider = true;
    if (!user.profile) {
      user.profile = {
        id: storedContext.id,
        companyName: storedContext.nombre,
        email: storedContext.email,
        rol: storedContext.rol
      };
      if (!providerProfile) providerProfile = user.profile;
    }
  }

  if (!isProvider && !isAdmin) {
    try {
      const me = await api.get('/users/me');
      if (me.roles?.some(r => r.includes('PROVEEDOR'))) {
        user.roles = me.roles;
        try { user.profile = await api.get('/providers/me'); } catch (e) {}
        localStorage.setItem('user', JSON.stringify(user));
        isProvider = true;
        providerProfile = user.profile;
      }
    } catch (e) {}
  }

  if (!isProvider && !isAdmin) {
    container.innerHTML = `
      <section class="max-w-4xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div class="crm-card p-10 max-w-lg mx-auto space-y-4">
          <div class="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200/80 flex items-center justify-center mx-auto shadow-2xs">
            ${renderIcon('Truck', 'w-7 h-7')}
          </div>
          <h2 class="text-xl font-bold text-zinc-900 font-display">Portal Exclusivo para Proveedores</h2>
          <p class="text-xs text-zinc-500 leading-relaxed">Tu cuenta actual (<strong>${user?.username || 'usuario'}</strong>) tiene rol de <strong>Cliente</strong>. Esta sección está reservada para empresas arrendadoras de maquinaria.</p>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a href="#/client" class="btn-secondary !py-2.5 !px-6 text-xs font-semibold">Ir a Mis Alquileres</a>
            <button id="btn-switch-provider-account" class="btn-primary !py-2.5 !px-6 text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer">
              ${renderIcon('LogIn', 'w-4 h-4')} Cambiar a cuenta Proveedor
            </button>
          </div>
        </div>
      </section>
    `;
    container.querySelector('#btn-switch-provider-account')?.addEventListener('click', () => openAuthModal('login'));
    return;
  }

  // 3. Resolve Provider Profile
  if (!providerProfile?.id && isProvider && !isAdmin) {
    try {
      providerProfile = await api.get('/providers/me');
      user.profile = providerProfile;
      localStorage.setItem('user', JSON.stringify(user));
    } catch (e) {
      console.warn('Could not fetch provider profile from /providers/me', e);
    }
  }

  let providerId = providerProfile?.id || null;

  // State variables
  const getInitialTabFromHash = () => {
    const hash = window.location.hash || '';
    const qIndex = hash.indexOf('?');
    if (qIndex !== -1) {
      const params = new URLSearchParams(hash.slice(qIndex + 1));
      const tab = params.get('tab');
      if (tab === 'dispatch' || tab === 'despacho' || tab === 'requests' || tab === 'orders') return 'requests';
      if (['inventory', 'requests', 'maintenance', 'finances', 'profile'].includes(tab)) return tab;
    }
    return 'inventory';
  };

  let activeTab = getInitialTabFromHash(); // 'inventory' | 'requests' | 'maintenance' | 'finances' | 'profile'
  let viewMode = 'table'; // default to high-density CRM table
  let inventorySearch = '';
  let inventoryCategory = 'ALL';
  let inventoryStatus = 'ALL';

  let requestsFilterStatus = 'ALL';
  let requestsSearch = '';

  let pageInventory = 1;
  const pageSizeInventory = 8;

  let pageRequests = 1;
  const pageSizeRequests = 8;

  let pageInvoices = 1;
  const pageSizeInvoices = 6;

  let toolsList = [];
  let requestsList = [];
  let categoriesList = [];
  let clientsList = [];
  let claimsList = [];
  let bulkBarManager = null;

  // Loading state
  container.innerHTML = `
    <div class="min-h-[60vh] flex flex-col items-center justify-center text-zinc-400 gap-3 animate-fade-in">
      ${renderIcon('Loader2', 'w-8 h-8 animate-spin text-orange-600')}
      <span class="text-xs font-medium text-zinc-600">Sincronizando operaciones de proveedor...</span>
    </div>
  `;

  // Fetch data
  async function loadData() {
    try {
      const activePid = providerProfile?.id || providerId || null;
      const promises = [
        activePid ? api.get('/tools', { providerId: activePid }).catch(() => []) : api.get('/tools').catch(() => []),
        activePid ? api.get(`/rentals/provider/${activePid}`).catch(() => []) : (isAdmin ? api.get('/rentals').catch(() => []) : Promise.resolve([])),
        api.get('/tools/categories').catch(() => []),
        api.get('/clients').catch(() => []),
        activePid ? api.get(`/rentals/claims/provider/${activePid}`).catch(() => []) : Promise.resolve([])
      ];

      const [fetchedTools, fetchedRequests, fetchedCats, fetchedClients, fetchedClaims] = await Promise.all(promises);

      toolsList = (Array.isArray(fetchedTools) ? fetchedTools : []).filter(t => t.status !== 'RETIRED');
      requestsList = Array.isArray(fetchedRequests) ? fetchedRequests : [];
      categoriesList = Array.isArray(fetchedCats) ? fetchedCats : [];
      clientsList = Array.isArray(fetchedClients) ? fetchedClients : [];
      claimsList = Array.isArray(fetchedClaims) ? fetchedClaims : [];
    } catch (err) {
      console.warn('Error loading provider dashboard data', err);
    }
  }

  await loadData();

  function switchTab(newTab) {
    activeTab = newTab;
    const currentHash = window.location.hash.split('?')[0] || '#/provider';
    window.history.replaceState(null, '', `${currentHash}?tab=${newTab}`);
    container.querySelectorAll('.crm-tab-btn').forEach(btn => {
      const isActive = btn.dataset.tab === activeTab;
      btn.className = `crm-tab-btn flex items-center gap-2 text-xs transition-colors cursor-pointer ${
        isActive ? 'crm-tab-active' : 'crm-tab-inactive'
      }`;
    });
    renderTabContent();
  }

  function updateKpis() {
    const totalTools = toolsList.length;
    const availableTools = toolsList.filter(t => t.status === 'AVAILABLE').length;
    const rentedTools = toolsList.filter(t => t.status === 'RENTED').length;
    const maintenanceTools = toolsList.filter(t => t.status === 'MAINTENANCE').length;
    const pendingRequests = requestsList.filter(r => r.status === 'PENDING').length;
    const readyToDispatch = requestsList.filter(r => r.status === 'CONFIRMED').length;
    const activeRentals = requestsList.filter(r => r.status === 'IN_PROGRESS' || r.status === 'CONFIRMED').length;
    const completedRentals = requestsList.filter(r => r.status === 'COMPLETED').length;
    const totalBilled = requestsList
      .filter(r => r.status === 'COMPLETED' || r.status === 'IN_PROGRESS')
      .reduce((acc, r) => acc + (parseFloat(r.totalAmount) || 0), 0);

    const k1 = container.querySelector('#kpi-total-tools');
    if (k1) k1.textContent = totalTools;
    const k1sub = container.querySelector('#kpi-available-tools-text');
    if (k1sub) {
      k1sub.innerHTML = `<span class="text-emerald-600 font-medium">${availableTools}</span> disponibles (${totalTools > 0 ? Math.round((availableTools / totalTools) * 100) : 0}%)`;
    }

    const k2 = container.querySelector('#kpi-active-rentals');
    if (k2) k2.textContent = activeRentals;

    const k3 = container.querySelector('#kpi-pending-requests');
    if (k3) k3.textContent = pendingRequests;

    const k4 = container.querySelector('#kpi-total-billed');
    if (k4) k4.textContent = formatCurrency(totalBilled);

    const bInv = container.querySelector('#badge-count-inventory');
    if (bInv) bInv.textContent = totalTools;
    const bReq = container.querySelector('#badge-count-requests');
    if (bReq) {
      if (readyToDispatch > 0) {
        bReq.textContent = `${readyToDispatch} por despachar`;
        bReq.className = 'px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-100 text-blue-800 border border-blue-300 font-bold';
      } else if (pendingRequests > 0) {
        bReq.textContent = `${pendingRequests} pend.`;
        bReq.className = 'px-1.5 py-0.5 rounded text-[10px] font-mono bg-orange-100 text-orange-800 border border-orange-300 font-bold';
      } else {
        bReq.textContent = requestsList.length;
        bReq.className = 'px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-100 text-zinc-600 border border-zinc-200';
      }
    }
    const activeClaims = claimsList.filter(c => c.status !== 'RESOLVED' && c.status !== 'REJECTED').length;
    const bMaint = container.querySelector('#badge-count-maintenance');
    if (bMaint) {
      bMaint.textContent = maintenanceTools + activeClaims;
      bMaint.className = activeClaims > 0
        ? 'px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-100 text-amber-800 border border-amber-300 font-bold'
        : 'px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-100 text-zinc-600 border border-zinc-200';
    }
  }

  function render() {
    const totalTools = toolsList.length;
    const availableTools = toolsList.filter(t => t.status === 'AVAILABLE').length;
    const rentedTools = toolsList.filter(t => t.status === 'RENTED').length;
    const maintenanceTools = toolsList.filter(t => t.status === 'MAINTENANCE').length;
    const pendingRequests = requestsList.filter(r => r.status === 'PENDING').length;
    const readyToDispatch = requestsList.filter(r => r.status === 'CONFIRMED').length;
    const activeRentals = requestsList.filter(r => r.status === 'IN_PROGRESS' || r.status === 'CONFIRMED').length;
    const completedRentals = requestsList.filter(r => r.status === 'COMPLETED').length;
    const totalBilled = requestsList
      .filter(r => r.status === 'COMPLETED' || r.status === 'IN_PROGRESS')
      .reduce((acc, r) => acc + (parseFloat(r.totalAmount) || 0), 0);

    const companyName = providerProfile?.companyName || 'Maquinaria y Equipos Bogotá S.A.S.';
    const taxId = providerProfile?.taxId || '900123456-1';
    const city = providerProfile?.city || 'Bogotá D.C.';

    container.innerHTML = `
      <div class="min-h-screen crm-panel-bg text-zinc-800 pb-20 select-none">
        <div class="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          
          ${isAdmin ? `
            <!-- Banner de Supervisión para Administrador -->
            <div class="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-300/80 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs flex-shrink-0">
                  ${renderIcon('ShieldCheck', 'w-5 h-5')}
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-xs font-bold text-amber-950 uppercase tracking-wide">Modo Administrador</span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-200/80 text-amber-900 font-semibold">Supervisión Total</span>
                  </div>
                  <p class="text-[11px] text-amber-800">Tienes control total para autorizar, rechazar y gestionar alquileres de cualquier proveedor en la plataforma.</p>
                </div>
              </div>
              <div class="flex items-center gap-2 w-full md:w-auto">
                <label for="admin-select-provider-switch" class="text-xs text-amber-900 font-semibold whitespace-nowrap">Proveedor:</label>
                <select id="admin-select-provider-switch" class="bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs text-zinc-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer shadow-2xs w-full md:w-auto">
                  ${allProvidersList.map(p => `
                    <option value="${p.id}" ${p.id === providerProfile?.id ? 'selected' : ''}>
                      ${p.companyName || p.id} (${p.city || 'Colombia'})
                    </option>
                  `).join('')}
                </select>
              </div>
            </div>
          ` : ''}

          <!-- 1. Minimalist CRM Brand Header (Linear / Attio style) -->
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div class="flex items-center gap-3.5">
              <div class="w-11 h-11 rounded-xl bg-white border border-zinc-200/80 shadow-2xs text-zinc-800 flex items-center justify-center font-bold text-lg flex-shrink-0">
                ${renderIcon('Building2', 'w-5 h-5 text-zinc-700')}
              </div>
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <h1 class="text-xl sm:text-2xl font-semibold text-zinc-900 tracking-tight font-display">${companyName}</h1>
                  ${renderCrmStatusBadge('VERIFIED', 'Verificado')}
                  <span class="text-xs text-zinc-400 font-mono">NIT: ${taxId}</span>
                  <span class="text-zinc-300">•</span>
                  <span class="text-xs text-zinc-500 font-medium flex items-center gap-1">
                    ${renderIcon('MapPin', 'w-3 h-3 text-zinc-400')} ${city}
                  </span>
                </div>
                <p class="text-xs text-zinc-500 mt-0.5">Control de inventario, alquileres en obra, inspecciones técnicas y facturación fiscal.</p>
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-2.5">
              <button id="btn-open-new-tool" class="bg-orange-600 hover:bg-orange-500 text-white rounded-xl px-4 py-2 text-xs font-medium shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer">
                ${renderIcon('Plus', 'w-4 h-4')}
                <span>Publicar Herramienta</span>
              </button>
              
              <a href="#/catalog" class="border border-zinc-200/90 bg-white hover:bg-zinc-50 text-zinc-700 rounded-xl px-3.5 py-2 text-xs font-medium shadow-2xs flex items-center gap-1.5 transition-colors">
                ${renderIcon('Eye', 'w-3.5 h-3.5 text-zinc-400')}
                <span>Catálogo Público</span>
              </a>

              <button id="btn-sync-data" class="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 shadow-2xs transition-colors cursor-pointer" title="Sincronizar datos">
                ${renderIcon('RefreshCw', 'w-3.5 h-3.5 text-zinc-400')}
              </button>
            </div>
          </div>

          <!-- 2. 4 Top KPI Cards with Mini-Sparklines SVG (Clean SaaS Minimalist) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" id="provider-kpi-container">
            
            <!-- KPI 1: Total Maquinaria -->
            <div class="crm-card p-4 flex items-center justify-between group hover:border-zinc-300 transition-colors">
              <div class="space-y-1">
                <span class="text-xs text-zinc-500 font-normal">Total Maquinaria</span>
                <div id="kpi-total-tools" class="text-2xl font-semibold text-zinc-900 tabular-nums tracking-tight font-display">
                  ${totalTools}
                </div>
                <div id="kpi-available-tools-text" class="flex items-center gap-1.5 text-xs">
                  <span class="text-emerald-600 font-medium">${availableTools}</span>
                  <span class="text-zinc-400 text-[11px]">disponibles (${totalTools > 0 ? Math.round((availableTools / totalTools) * 100) : 0}%)</span>
                </div>
              </div>
              <div class="pl-2">
                ${renderSparkline({ color: 'orange', points: [10, 15, 14, 20, 26, 24, 30], width: 84, height: 36 })}
              </div>
            </div>

            <!-- KPI 2: Alquileres Activos y Despachos -->
            <div id="card-kpi-active-rentals" class="crm-card p-4 flex items-center justify-between group hover:border-blue-400 transition-colors cursor-pointer" title="Ver despachos a obra y alquileres activos">
              <div class="space-y-1">
                <span class="text-xs text-zinc-500 font-normal">Alquileres Activos</span>
                <div id="kpi-active-rentals" class="text-2xl font-semibold text-zinc-900 tabular-nums tracking-tight font-display">
                  ${activeRentals}
                </div>
                <div class="flex items-center gap-1.5 text-xs">
                  ${readyToDispatch > 0 ? `
                    <span class="text-blue-600 font-bold flex items-center gap-1">${renderIcon('Truck', 'w-3 h-3')} ${readyToDispatch} por despachar</span>
                  ` : `
                    <span class="text-emerald-600 font-medium">${rentedTools}</span>
                    <span class="text-zinc-400 text-[11px]">equipos en faena</span>
                  `}
                </div>
              </div>
              <div class="pl-2">
                ${renderSparkline({ color: readyToDispatch > 0 ? 'blue' : 'emerald', points: [4, 8, 7, 12, 16, 19, 24], width: 84, height: 36 })}
              </div>
            </div>

            <!-- KPI 3: Solicitudes Pendientes -->
            <div id="card-kpi-pending-requests" class="crm-card p-4 flex items-center justify-between group hover:border-orange-400 transition-colors cursor-pointer" title="Ver solicitudes por confirmar">
              <div class="space-y-1">
                <span class="text-xs text-zinc-500 font-normal">Por Confirmar</span>
                <div id="kpi-pending-requests" class="text-2xl font-semibold text-zinc-900 tabular-nums tracking-tight font-display">
                  ${pendingRequests}
                </div>
                <div class="flex items-center gap-1.5 text-xs">
                  ${pendingRequests > 0 ? `
                    <span class="text-orange-600 font-medium">Requieren atención</span>
                  ` : `
                    <span class="text-zinc-400 text-[11px]">Sin pendientes</span>
                  `}
                </div>
              </div>
              <div class="pl-2">
                ${renderSparkline({ color: pendingRequests > 0 ? 'orange' : 'blue', points: [2, 5, 4, 7, 3, 6, 8], width: 84, height: 36 })}
              </div>
            </div>

            <!-- KPI 4: Facturación Cobrada -->
            <div class="crm-card p-4 flex items-center justify-between group hover:border-zinc-300 transition-colors">
              <div class="space-y-1">
                <span class="text-xs text-zinc-500 font-normal">Facturación Cobrada</span>
                <div id="kpi-total-billed" class="text-2xl font-semibold text-zinc-900 tabular-nums tracking-tight font-display truncate">
                  ${formatCurrency(totalBilled)}
                </div>
                <div class="flex items-center gap-1.5 text-xs">
                  <span class="text-emerald-600 font-medium">${completedRentals}</span>
                  <span class="text-zinc-400 text-[11px]">contratos cerrados</span>
                </div>
              </div>
              <div class="pl-2">
                ${renderSparkline({ color: 'emerald', points: [14, 20, 24, 30, 38, 45, 52], width: 84, height: 36 })}
              </div>
            </div>

          </div>

          <!-- 3. Minimalist Underline Tabs (Modern CRM Style) -->
          <div class="border-b border-zinc-200/80">
            <nav class="flex items-center space-x-6 overflow-x-auto no-scrollbar" id="provider-tabs-nav">
              
              <button data-tab="inventory" class="crm-tab-btn flex items-center gap-2 text-xs transition-colors cursor-pointer ${activeTab === 'inventory' ? 'crm-tab-active' : 'crm-tab-inactive'}">
                <span class="flex items-center gap-1.5">
                  ${renderIcon('Wrench', 'w-3.5 h-3.5 ' + (activeTab === 'inventory' ? 'text-orange-600' : 'text-zinc-400'))}
                  <span>Inventario y Maquinaria</span>
                </span>
                <span id="badge-count-inventory" class="px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-100 text-zinc-600 border border-zinc-200">
                  ${toolsList.length}
                </span>
              </button>

              <button data-tab="requests" class="crm-tab-btn flex items-center gap-2 text-xs transition-colors cursor-pointer ${activeTab === 'requests' ? 'crm-tab-active' : 'crm-tab-inactive'}">
                <span class="flex items-center gap-1.5">
                  ${renderIcon('Truck', 'w-3.5 h-3.5 ' + (activeTab === 'requests' ? 'text-orange-600' : 'text-zinc-400'))}
                  <span>Despachos y Solicitudes</span>
                </span>
                <span id="badge-count-requests" class="px-1.5 py-0.5 rounded text-[10px] font-mono ${readyToDispatch > 0 ? 'bg-blue-100 text-blue-800 border border-blue-300 font-bold' : (pendingRequests > 0 ? 'bg-orange-100 text-orange-800 border border-orange-300 font-bold' : 'bg-zinc-100 text-zinc-600 border border-zinc-200')}">
                  ${readyToDispatch > 0 ? `${readyToDispatch} por despachar` : (pendingRequests > 0 ? `${pendingRequests} pend.` : requestsList.length)}
                </span>
              </button>

              <button data-tab="maintenance" class="crm-tab-btn flex items-center gap-2 text-xs transition-colors cursor-pointer ${activeTab === 'maintenance' ? 'crm-tab-active' : 'crm-tab-inactive'}">
                <span class="flex items-center gap-1.5">
                  ${renderIcon('ShieldAlert', 'w-3.5 h-3.5 ' + (activeTab === 'maintenance' ? 'text-orange-600' : 'text-zinc-400'))}
                  <span>Taller y Garantías</span>
                </span>
                <span id="badge-count-maintenance" class="px-1.5 py-0.2 rounded text-[10px] font-mono ${claimsList.filter(c => c.status !== 'RESOLVED' && c.status !== 'REJECTED').length > 0 ? 'bg-amber-100 text-amber-800 border border-amber-300 font-bold' : 'bg-zinc-100 text-zinc-600 border border-zinc-200'}">
                  ${maintenanceTools + claimsList.filter(c => c.status !== 'RESOLVED' && c.status !== 'REJECTED').length}
                </span>
              </button>

              <button data-tab="finances" class="crm-tab-btn flex items-center gap-2 text-xs transition-colors cursor-pointer ${activeTab === 'finances' ? 'crm-tab-active' : 'crm-tab-inactive'}">
                <span class="flex items-center gap-1.5">
                  ${renderIcon('FileText', 'w-3.5 h-3.5 ' + (activeTab === 'finances' ? 'text-orange-600' : 'text-zinc-400'))}
                  <span>Facturación e Ingresos</span>
                </span>
              </button>

              <button data-tab="profile" class="crm-tab-btn flex items-center gap-2 text-xs transition-colors cursor-pointer ${activeTab === 'profile' ? 'crm-tab-active' : 'crm-tab-inactive'}">
                <span class="flex items-center gap-1.5">
                  ${renderIcon('Building2', 'w-3.5 h-3.5 ' + (activeTab === 'profile' ? 'text-orange-600' : 'text-zinc-400'))}
                  <span>Perfil Comercial</span>
                </span>
              </button>

            </nav>
          </div>

          <!-- 4. Dynamic Tab Stage -->
          <div id="provider-tab-content"></div>

        </div>
      </div>
    `;

    // Attach global toolbar handlers
    container.querySelector('#admin-select-provider-switch')?.addEventListener('change', async (e) => {
      const selectedId = e.target.value;
      const found = allProvidersList.find(p => p.id === selectedId);
      if (found) {
        providerProfile = found;
        providerId = found.id;
        const currentTab = activeTab;
        window.history.replaceState(null, '', `#/provider?providerId=${selectedId}&tab=${currentTab}`);
        showToast(`Supervisando a: ${found.companyName}`, 'info');
        await loadData();
        render();
      }
    });

    container.querySelector('#btn-open-new-tool')?.addEventListener('click', () => openNewToolModal());
    container.querySelector('#btn-sync-data')?.addEventListener('click', async () => {
      showToast('Sincronizando datos con el servidor...', 'info');
      await loadData();
      updateKpis();
      renderTabContent();
      showToast('Datos actualizados', 'success');
    });

    // Underline Tabs click handlers
    container.querySelectorAll('.crm-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // KPI cards click to jump to requests
    container.querySelector('#card-kpi-active-rentals')?.addEventListener('click', () => {
      requestsFilterStatus = readyToDispatch > 0 ? 'CONFIRMED' : 'ALL';
      switchTab('requests');
    });
    container.querySelector('#card-kpi-pending-requests')?.addEventListener('click', () => {
      requestsFilterStatus = 'PENDING';
      switchTab('requests');
    });

    // Render active tab content
    renderTabContent();
  }

  function renderPaginationControls({ currentPage, totalItems, pageSize, changeClass, label = 'registros' }) {
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    if (totalPages <= 1) {
      return `
        <div class="px-4 py-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 bg-white">
          <span>Total: <strong class="text-zinc-800 font-medium">${totalItems}</strong> ${label}</span>
          <span class="text-[11px] text-zinc-400">Página 1 de 1</span>
        </div>
      `;
    }

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    return `
      <div class="px-4 py-3 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-white select-none">
        <div class="text-zinc-500 text-xs">
          Mostrando <strong class="text-zinc-800 font-medium">${startItem}-${endItem}</strong> de <strong class="text-zinc-800 font-medium">${totalItems}</strong> ${label}
        </div>

        <div class="flex items-center gap-1.5 flex-wrap justify-center">
          <button 
            type="button"
            class="${changeClass} px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1 transition-colors ${
              currentPage > 1
                ? 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 cursor-pointer shadow-2xs'
                : 'border-zinc-100 bg-zinc-50 text-zinc-300 cursor-not-allowed'
            }"
            data-page="${currentPage - 1}"
            ${currentPage <= 1 ? 'disabled' : ''}
            title="Página anterior"
          >
            ${renderIcon('ChevronLeft', 'w-3.5 h-3.5')}
            <span class="hidden sm:inline">Anterior</span>
          </button>

          <div class="flex items-center gap-1">
            ${pages.map(p => {
              if (p === '...') {
                return `<span class="px-1.5 py-1 text-zinc-400 text-xs select-none">…</span>`;
              }
              const isCurrent = p === currentPage;
              return `
                <button 
                  type="button"
                  class="${changeClass} min-w-[28px] h-7 sm:min-w-[32px] sm:h-8 px-2 rounded-lg text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-orange-600 text-white shadow-2xs'
                      : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300'
                  }"
                  data-page="${p}"
                >
                  ${p}
                </button>
              `;
            }).join('')}
          </div>

          <button 
            type="button"
            class="${changeClass} px-2.5 py-1 rounded-lg border text-xs font-medium flex items-center gap-1 transition-colors ${
              currentPage < totalPages
                ? 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 cursor-pointer shadow-2xs'
                : 'border-zinc-100 bg-zinc-50 text-zinc-300 cursor-not-allowed'
            }"
            data-page="${currentPage + 1}"
            ${currentPage >= totalPages ? 'disabled' : ''}
            title="Página siguiente"
          >
            <span class="hidden sm:inline">Siguiente</span>
            ${renderIcon('ChevronRight', 'w-3.5 h-3.5')}
          </button>
        </div>
      </div>
    `;
  }

  function renderTabContent() {
    const tabContainer = container.querySelector('#provider-tab-content');
    if (!tabContainer) return;

    const clientsMap = new Map(clientsList.map(c => [c.id, c]));
    const toolsMap = new Map(toolsList.map(t => [t.id, t]));

    // Filters for Inventory
    const filteredTools = toolsList.filter(t => {
      if (t.status === 'RETIRED') return false;
      const catName = t.category?.name || t.categoryName || '';
      const catId = t.category?.id || t.categoryId || '';
      const query = inventorySearch.toLowerCase();
      const matchSearch = !query ||
        t.name?.toLowerCase().includes(query) ||
        t.brand?.toLowerCase().includes(query) ||
        t.model?.toLowerCase().includes(query) ||
        t.serialNumber?.toLowerCase().includes(query) ||
        catName.toLowerCase().includes(query);
      const matchCat = inventoryCategory === 'ALL' || catId === inventoryCategory || catName === inventoryCategory;
      const matchStatus = inventoryStatus === 'ALL' || t.status === inventoryStatus;
      return matchSearch && matchCat && matchStatus;
    });

    // Filters for Requests
    const filteredRequests = requestsList.filter(r => {
      const client = clientsMap.get(r.clientId);
      const clientName = client?.fullName || '';
      const clientDoc = client?.documentNumber || '';
      const code = r.rentalCode || r.id?.toString() || '';
      const query = requestsSearch.toLowerCase();

      const matchSearch = !query ||
        clientName.toLowerCase().includes(query) ||
        clientDoc.toLowerCase().includes(query) ||
        code.toLowerCase().includes(query);

      const matchStatus = requestsFilterStatus === 'ALL' || r.status === requestsFilterStatus;
      return matchSearch && matchStatus;
    });

    const pendingRequests = requestsList.filter(r => r.status === 'PENDING').length;
    const completedRentals = requestsList.filter(r => r.status === 'COMPLETED').length;
    const maintenanceTools = toolsList.filter(t => t.status === 'MAINTENANCE').length;
    const totalBilled = requestsList
      .filter(r => r.status === 'COMPLETED' || r.status === 'IN_PROGRESS' || r.status === 'CONFIRMED')
      .reduce((acc, r) => acc + (parseFloat(r.totalAmount) || 0), 0);

    const companyName = providerProfile?.companyName || 'Maquinaria y Equipos Bogotá S.A.S.';
    const taxId = providerProfile?.taxId || '900123456-1';
    const city = providerProfile?.city || 'Bogotá D.C.';
    const phone = providerProfile?.phone || '+57 310 111 2233';
    const address = providerProfile?.address || 'Av. Boyacá # 68-45';

    let html = '';

    // ===================================================================
    // TAB 1: INVENTARIO (High-Density CRM Table)
    // ===================================================================
    if (activeTab === 'inventory') {
      const totalToolsCount = filteredTools.length;
      const maxToolsPages = Math.ceil(totalToolsCount / pageSizeInventory) || 1;
      if (pageInventory > maxToolsPages) pageInventory = maxToolsPages;
      const startToolsIdx = (pageInventory - 1) * pageSizeInventory;
      const paginatedTools = filteredTools.slice(startToolsIdx, startToolsIdx + pageSizeInventory);

      html = `
        <div class="space-y-4 animate-fade-in">
          
          <!-- Controls Toolbar: Minimalist search & filters -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            <div class="relative flex-1 max-w-sm">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                ${renderIcon('Search', 'w-3.5 h-3.5')}
              </span>
              <input 
                type="text" 
                id="inv-search-input" 
                value="${inventorySearch}" 
                placeholder="Buscar por nombre, marca o SKU..." 
                class="w-full pl-9 pr-3 py-1.5 bg-white border border-zinc-200/90 rounded-xl text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all shadow-2xs" 
              />
            </div>

            <div class="flex flex-wrap items-center gap-2.5">
              <!-- Category Filter -->
              <select id="inv-category-filter" class="px-2.5 py-1.5 bg-white border border-zinc-200/90 rounded-xl text-xs font-normal text-zinc-700 focus:outline-none focus:border-zinc-400 cursor-pointer shadow-2xs">
                <option value="ALL" ${inventoryCategory === 'ALL' ? 'selected' : ''}>Todas las categorías (${categoriesList.length})</option>
                ${categoriesList.map(c => `
                  <option value="${c.id}" ${inventoryCategory === c.id ? 'selected' : ''}>${c.name}</option>
                `).join('')}
              </select>

              <!-- Status Filter -->
              <select id="inv-status-filter" class="px-2.5 py-1.5 bg-white border border-zinc-200/90 rounded-xl text-xs font-normal text-zinc-700 focus:outline-none focus:border-zinc-400 cursor-pointer shadow-2xs">
                <option value="ALL" ${inventoryStatus === 'ALL' ? 'selected' : ''}>Todos los estados</option>
                <option value="AVAILABLE" ${inventoryStatus === 'AVAILABLE' ? 'selected' : ''}>Disponible</option>
                <option value="RENTED" ${inventoryStatus === 'RENTED' ? 'selected' : ''}>Alquilada</option>
                <option value="MAINTENANCE" ${inventoryStatus === 'MAINTENANCE' ? 'selected' : ''}>En mantenimiento</option>
              </select>

              <!-- View Mode Toggle -->
              <div class="flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200/70">
                <button id="btn-view-table" class="p-1 rounded text-xs font-medium transition-all cursor-pointer ${viewMode === 'table' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'}" title="Vista de Tabla CRM">
                  ${renderIcon('List', 'w-3.5 h-3.5')}
                </button>
                <button id="btn-view-cards" class="p-1 rounded text-xs font-medium transition-all cursor-pointer ${viewMode === 'cards' ? 'bg-white text-zinc-900 shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'}" title="Vista de Tarjetas">
                  ${renderIcon('Grid', 'w-3.5 h-3.5')}
                </button>
              </div>

              <button id="btn-inv-add-tool" class="bg-orange-600 hover:bg-orange-500 text-white rounded-xl px-3 py-1.5 text-xs font-medium shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer">
                ${renderIcon('Plus', 'w-3.5 h-3.5')}
                <span>Publicar</span>
              </button>
            </div>

          </div>

          <!-- Content Stage: Empty State vs CRM Table vs Cards -->
          ${filteredTools.length === 0 ? `
            <div class="crm-card p-12 text-center space-y-4">
              <div class="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto border border-zinc-200">
                ${renderIcon('PackagePlus', 'w-7 h-7')}
              </div>
              <div class="max-w-md mx-auto space-y-1">
                <h3 class="text-base font-semibold text-zinc-900">Tu inventario está listo para comenzar</h3>
                <p class="text-xs text-zinc-500 leading-relaxed">
                  No se encontraron herramientas con los filtros actuales. Publica un nuevo equipo o utiliza una plantilla rápida.
                </p>
              </div>
              <div class="flex justify-center pt-2">
                <button id="btn-empty-add-tool" class="bg-orange-600 hover:bg-orange-500 text-white rounded-xl px-4 py-2 text-xs font-medium shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer">
                  ${renderIcon('Plus', 'w-3.5 h-3.5')} Publicar Primera Herramienta
                </button>
              </div>

              <!-- Quick Start Templates -->
              <div class="pt-6 border-t border-zinc-100 max-w-2xl mx-auto">
                <span class="text-[11px] font-medium uppercase tracking-[0.06em] text-zinc-400 block mb-3">
                  O añade en 1 clic desde una plantilla de alta demanda:
                </span>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  ${QUICK_TEMPLATES.map((tmpl, idx) => `
                    <button 
                      class="btn-use-template p-3 rounded-xl border border-zinc-200/80 bg-zinc-50/50 hover:bg-white hover:border-zinc-300 transition-all text-left cursor-pointer group flex items-center justify-between"
                      data-index="${idx}"
                    >
                      <div>
                        <span class="text-[10px] font-mono text-zinc-400 uppercase">${tmpl.brand}</span>
                        <div class="font-medium text-zinc-900 text-xs line-clamp-1 group-hover:text-orange-600 transition-colors">${tmpl.name}</div>
                        <div class="text-[11px] text-zinc-500 tabular-nums">${formatCurrency(tmpl.dailyPrice)}/día</div>
                      </div>
                      <div class="p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-400 group-hover:text-orange-600 group-hover:border-orange-200 transition-colors">
                        ${renderIcon('Plus', 'w-3 h-3')}
                      </div>
                    </button>
                  `).join('')}
                </div>
              </div>
            </div>
          ` : viewMode === 'table' ? `
            <!-- 1. Desktop & Tablet CRM Table -->
            <div class="crm-card overflow-hidden hidden md:block">
              <div class="overflow-x-auto w-full">
                <table class="w-full text-left text-xs table-auto">
                  <thead class="crm-table-header border-b border-zinc-200/70 bg-zinc-50/50">
                    <tr>
                      <th class="py-3 px-3 w-8 text-center">
                        <input type="checkbox" id="select-all-tools" class="w-4 h-4 rounded border-zinc-300 text-orange-600 focus:ring-0 cursor-pointer" />
                      </th>
                      <th class="py-3 px-3 min-w-0">Herramienta</th>
                      <th class="py-3 px-3 whitespace-nowrap">Tarifa Diaria</th>
                      <th class="py-3 px-3 whitespace-nowrap hidden sm:table-cell">Garantía / Reposición</th>
                      <th class="py-3 px-3 whitespace-nowrap hidden 2xl:table-cell">Disponibilidad</th>
                      <th class="py-3 px-3 whitespace-nowrap">Estado</th>
                      <th class="py-3 px-3 whitespace-nowrap hidden lg:table-cell">SKU / Serie</th>
                      <th class="py-3 px-3 text-right whitespace-nowrap w-24">Acciones</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-zinc-100">
                    ${paginatedTools.map((tool, idx) => {
                      const img = tool.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200';
                      const catName = tool.category?.name || tool.categoryName || 'Construcción';
                      const sku = tool.serialNumber || (tool.id ? `SKU-${tool.id.toString().slice(0, 8).toUpperCase()}` : 'SKU-0000');
                      const levelScore = tool.status === 'AVAILABLE' ? 5 : tool.status === 'RENTED' ? 3 : 1;

                      return `
                        <tr class="crm-tool-row hover:bg-zinc-50/80 transition-colors cursor-pointer group" data-tool-id="${tool.id}">
                          <td class="py-3 px-4 text-center" onclick="event.stopPropagation()">
                            <input type="checkbox" class="crm-row-checkbox w-4 h-4 rounded border-zinc-300 text-orange-600 focus:ring-0 cursor-pointer" data-id="${tool.id}" />
                          </td>
                          <td class="py-3 px-4">
                            <div class="flex items-center gap-3">
                              <img src="${img}" class="w-9 h-9 rounded-lg object-contain bg-zinc-50 border border-zinc-200/80 p-0.5 flex-shrink-0" onerror="this.src='https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200'" />
                              <div class="min-w-0">
                                <div class="font-medium text-zinc-900 group-hover:text-orange-600 transition-colors truncate">
                                  ${tool.name}
                                </div>
                                <div class="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1.5">
                                  <span>${catName}</span>
                                  <span>•</span>
                                  <span>${tool.brand || 'ToolRent'}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td class="py-3 px-3 whitespace-nowrap font-medium text-zinc-900 tabular-nums">
                            ${formatCurrency(tool.dailyPrice)} <span class="text-[11px] text-zinc-400 font-normal">/ día</span>
                          </td>
                          <td class="py-3 px-3 whitespace-nowrap text-zinc-600 font-mono text-[11px] tabular-nums hidden sm:table-cell">
                            ${formatCurrency(tool.replacementValue || tool.dailyPrice * 35)}
                          </td>
                          <td class="py-3 px-3 whitespace-nowrap hidden 2xl:table-cell">
                            ${renderSegmentedLevel(levelScore, 5, tool.status === 'AVAILABLE' ? 'emerald' : tool.status === 'RENTED' ? 'blue' : 'amber')}
                          </td>
                          <td class="py-3 px-3 whitespace-nowrap">
                            ${renderCrmStatusBadge(tool.status)}
                          </td>
                          <td class="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-zinc-500 hidden lg:table-cell">
                            ${sku}
                          </td>
                          <td class="py-3 px-3 text-right whitespace-nowrap" onclick="event.stopPropagation()">
                            <div class="flex items-center justify-end gap-1.5">
                              <button class="btn-edit-tool px-2.5 py-1 rounded-lg border border-zinc-200/90 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs" data-id="${tool.id}" title="Editar información del equipo">
                                ${renderIcon('Edit3', 'w-3.5 h-3.5 text-zinc-500')}
                                <span>Editar</span>
                              </button>
                              <button class="btn-tool-popover p-1.5 rounded-lg border border-transparent hover:border-zinc-200 hover:bg-white text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer" data-id="${tool.id}" title="Más opciones">
                                ${renderIcon('MoreHorizontal', 'w-4 h-4')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>

              ${renderPaginationControls({ currentPage: pageInventory, totalItems: totalToolsCount, pageSize: pageSizeInventory, changeClass: 'btn-inv-page-nav', label: 'herramientas' })}
            </div>

            <!-- 2. Mobile Adaptive Cards (Visible on screens < md in table mode) -->
            <div class="space-y-3 md:hidden">
              ${paginatedTools.map(tool => {
                const img = tool.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200';
                const catName = tool.category?.name || tool.categoryName || 'Construcción';
                const sku = tool.serialNumber || (tool.id ? `SKU-${tool.id.toString().slice(0, 8).toUpperCase()}` : 'SKU-0000');

                return `
                  <div class="crm-card p-4 space-y-3 crm-tool-card hover:border-zinc-300 transition-all cursor-pointer" data-tool-id="${tool.id}">
                    <div class="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2">
                      <div class="flex items-center gap-2">
                        <input type="checkbox" class="crm-row-checkbox w-4 h-4 rounded border-zinc-300 text-orange-600 focus:ring-0 cursor-pointer" data-id="${tool.id}" onclick="event.stopPropagation()" />
                        <span class="font-mono text-zinc-400 text-[11px]">${sku}</span>
                      </div>
                      <div class="flex items-center gap-1.5">
                        ${renderCrmStatusBadge(tool.status)}
                        <button class="btn-tool-popover p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer" data-id="${tool.id}" title="Más opciones" onclick="event.stopPropagation()">
                          ${renderIcon('MoreHorizontal', 'w-4 h-4')}
                        </button>
                      </div>
                    </div>

                    <div class="flex items-center gap-3">
                      <img src="${img}" class="w-12 h-12 rounded-xl object-contain bg-zinc-50 border border-zinc-200/80 p-1 flex-shrink-0" onerror="this.src='https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200'" />
                      <div class="min-w-0 flex-1">
                        <h4 class="font-semibold text-zinc-900 text-xs truncate" title="${tool.name}">${tool.name}</h4>
                        <div class="text-[11px] text-zinc-400 mt-0.5">${catName} • ${tool.brand || 'ToolRent'}</div>
                        <div class="text-xs font-bold text-zinc-900 tabular-nums mt-1">${formatCurrency(tool.dailyPrice)} <span class="text-[10px] text-zinc-400 font-normal">/ día</span></div>
                      </div>
                    </div>

                    <div class="pt-1 flex items-center gap-2" onclick="event.stopPropagation()">
                      <button class="btn-edit-tool flex-1 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-xl py-2 text-xs font-semibold shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer" data-id="${tool.id}">
                        ${renderIcon('Edit3', 'w-4 h-4 text-zinc-500')} Editar Ficha
                      </button>
                      <button class="btn-toggle-maint p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 transition-colors cursor-pointer" data-id="${tool.id}" title="Taller">
                        ${renderIcon('Wrench', 'w-4 h-4')}
                      </button>
                    </div>
                  </div>
                `;
              }).join('')}

              <div class="crm-card overflow-hidden mt-3">
                ${renderPaginationControls({ currentPage: pageInventory, totalItems: totalToolsCount, pageSize: pageSizeInventory, changeClass: 'btn-inv-page-nav', label: 'herramientas' })}
              </div>
            </div>
          ` : `
            <!-- Cards View -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              ${paginatedTools.map(tool => {
                const img = tool.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600';
                const catName = tool.category?.name || tool.categoryName || 'Construcción';
                const sku = tool.serialNumber || (tool.id ? `SKU-${tool.id.toString().slice(0, 8).toUpperCase()}` : 'SKU-0000');

                return `
                  <div class="crm-card p-4 space-y-3 cursor-pointer group hover:border-zinc-300 transition-colors flex flex-col justify-between crm-tool-card" data-tool-id="${tool.id}">
                    <div>
                      <div class="relative h-40 bg-zinc-50 rounded-xl overflow-hidden flex items-center justify-center p-3 border border-zinc-100 mb-3">
                        <img src="${img}" class="w-full h-full object-contain mix-blend-multiply group-hover:scale-102 transition-transform duration-300" onerror="this.src='https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600'" />
                        <div class="absolute top-2 left-2">
                          <span class="px-2 py-0.5 rounded text-[10px] font-medium bg-white/90 border border-zinc-200/80 text-zinc-600 shadow-2xs">${catName}</span>
                        </div>
                        <div class="absolute top-2 right-2">
                          ${renderCrmStatusBadge(tool.status)}
                        </div>
                      </div>

                      <div class="space-y-1">
                        <div class="flex items-center justify-between text-[11px] text-zinc-400">
                          <span class="font-medium text-zinc-600">${tool.brand || 'ToolRent'}</span>
                          <span class="font-mono">${sku}</span>
                        </div>
                        <h4 class="font-medium text-sm text-zinc-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                          ${tool.name}
                        </h4>
                        <p class="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                          ${tool.description || 'Sin especificaciones adicionales registradas.'}
                        </p>
                      </div>
                    </div>

                    <div class="pt-3 border-t border-zinc-100 flex items-center justify-between">
                      <div>
                        <span class="text-[10px] uppercase font-medium tracking-[0.06em] text-zinc-400 block">Tarifa por día</span>
                        <span class="text-base font-semibold text-zinc-900 tabular-nums">${formatCurrency(tool.dailyPrice)}</span>
                      </div>
                      <div class="flex items-center gap-1.5" onclick="event.stopPropagation()">
                        <button class="btn-edit-tool p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 transition-colors cursor-pointer" data-id="${tool.id}" title="Editar">
                          ${renderIcon('Edit3', 'w-3.5 h-3.5')}
                        </button>
                        <button class="btn-toggle-maint p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 transition-colors cursor-pointer" data-id="${tool.id}" title="Taller">
                          ${renderIcon('Wrench', 'w-3.5 h-3.5')}
                        </button>
                        <button class="btn-tool-popover p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 transition-colors cursor-pointer" data-id="${tool.id}" title="Más opciones">
                          ${renderIcon('MoreHorizontal', 'w-3.5 h-3.5')}
                        </button>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
            <div class="crm-card overflow-hidden mt-3">
              ${renderPaginationControls({ currentPage: pageInventory, totalItems: totalToolsCount, pageSize: pageSizeInventory, changeClass: 'btn-inv-page-nav', label: 'herramientas' })}
            </div>
          `}

        </div>
      `;
    }

    // ===================================================================
    // TAB 2: SOLICITUDES Y ALQUILERES (CRM Requests Table)
    // ===================================================================
    else if (activeTab === 'requests') {
      const totalReqCount = filteredRequests.length;
      const maxReqPages = Math.ceil(totalReqCount / pageSizeRequests) || 1;
      if (pageRequests > maxReqPages) pageRequests = maxReqPages;
      const startReqIdx = (pageRequests - 1) * pageSizeRequests;
      const paginatedRequests = filteredRequests.slice(startReqIdx, startReqIdx + pageSizeRequests);

      html = `
        <div class="space-y-4 animate-fade-in">
          
          <!-- Filters Toolbar -->
          <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            
            <!-- Underline Filter Status Pills -->
            <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 max-w-full">
              <button class="btn-filter-status inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${requestsFilterStatus === 'ALL' ? 'bg-zinc-900 text-white border border-zinc-900 shadow-xs' : 'bg-white border border-zinc-200/90 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300'}" data-status="ALL">
                ${renderIcon('Layers', 'w-3.5 h-3.5 flex-shrink-0 ' + (requestsFilterStatus === 'ALL' ? 'text-white' : 'text-zinc-500'))}
                <span>Todas</span>
                <span class="text-[11px] font-mono ${requestsFilterStatus === 'ALL' ? 'text-zinc-300' : 'text-zinc-400 font-normal'}">(${requestsList.length})</span>
              </button>
              <button class="btn-filter-status inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${requestsFilterStatus === 'PENDING' ? 'bg-zinc-900 text-white border border-zinc-900 shadow-xs' : 'bg-white border border-zinc-200/90 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300'}" data-status="PENDING">
                ${renderIcon('Clock', 'w-3.5 h-3.5 flex-shrink-0 ' + (requestsFilterStatus === 'PENDING' ? 'text-white' : 'text-amber-500'))}
                <span>Por Confirmar</span>
                <span class="text-[11px] font-mono ${requestsFilterStatus === 'PENDING' ? 'text-zinc-300' : 'text-zinc-400 font-normal'}">(${pendingRequests})</span>
              </button>
              <button class="btn-filter-status inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${requestsFilterStatus === 'CONFIRMED' ? 'bg-zinc-900 text-white border border-zinc-900 shadow-xs' : 'bg-white border border-zinc-200/90 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300'}" data-status="CONFIRMED">
                ${renderIcon('Truck', 'w-3.5 h-3.5 flex-shrink-0 ' + (requestsFilterStatus === 'CONFIRMED' ? 'text-white' : 'text-blue-500'))}
                <span>Listas para Despacho</span>
                <span class="text-[11px] font-mono ${requestsFilterStatus === 'CONFIRMED' ? 'text-zinc-300' : 'text-zinc-400 font-normal'}">(${requestsList.filter(r => r.status === 'CONFIRMED').length})</span>
              </button>
              <button class="btn-filter-status inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${requestsFilterStatus === 'IN_PROGRESS' ? 'bg-zinc-900 text-white border border-zinc-900 shadow-xs' : 'bg-white border border-zinc-200/90 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300'}" data-status="IN_PROGRESS">
                ${renderIcon('HardHat', 'w-3.5 h-3.5 flex-shrink-0 ' + (requestsFilterStatus === 'IN_PROGRESS' ? 'text-white' : 'text-orange-500'))}
                <span>En Obra / Faena</span>
                <span class="text-[11px] font-mono ${requestsFilterStatus === 'IN_PROGRESS' ? 'text-zinc-300' : 'text-zinc-400 font-normal'}">(${requestsList.filter(r => r.status === 'IN_PROGRESS').length})</span>
              </button>
              <button class="btn-filter-status inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${requestsFilterStatus === 'COMPLETED' ? 'bg-zinc-900 text-white border border-zinc-900 shadow-xs' : 'bg-white border border-zinc-200/90 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300'}" data-status="COMPLETED">
                ${renderIcon('CheckCircle2', 'w-3.5 h-3.5 flex-shrink-0 ' + (requestsFilterStatus === 'COMPLETED' ? 'text-white' : 'text-emerald-500'))}
                <span>Completadas</span>
                <span class="text-[11px] font-mono ${requestsFilterStatus === 'COMPLETED' ? 'text-zinc-300' : 'text-zinc-400 font-normal'}">(${completedRentals})</span>
              </button>
            </div>

            <div class="relative w-full lg:w-64 shrink-0">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                ${renderIcon('Search', 'w-3.5 h-3.5')}
              </span>
              <input 
                type="text" 
                id="requests-search-input" 
                value="${requestsSearch}" 
                placeholder="Buscar cliente o código..." 
                class="w-full pl-9 pr-3 py-1.5 bg-white border border-zinc-200/90 rounded-xl text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 transition-all shadow-2xs" 
              />
            </div>
          </div>

          <!-- Content: Empty State vs Requests Table -->
          ${filteredRequests.length === 0 ? `
            <div class="crm-card p-12 text-center space-y-3">
              <div class="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto border border-zinc-200">
                ${renderIcon('Inbox', 'w-7 h-7')}
              </div>
              <h3 class="text-base font-semibold text-zinc-900">No hay solicitudes en esta sección</h3>
              <p class="text-xs text-zinc-500 max-w-sm mx-auto">
                Cuando los clientes alquilen herramientas desde el catálogo, las órdenes aparecerán aquí para tu confirmación y despacho.
              </p>
            </div>
          ` : `
            <!-- 1. Desktop & Laptop High-Density Data Table (Visible on md and up) -->
            <div class="crm-card overflow-hidden hidden md:block">
              <div class="overflow-x-auto w-full">
                <table class="w-full text-left text-xs table-auto">
                  <thead class="crm-table-header border-b border-zinc-200/70 bg-zinc-50/50">
                    <tr>
                      <th class="py-3 px-2.5 w-8 text-center shrink-0">
                        <input type="checkbox" id="select-all-requests" class="w-4 h-4 rounded border-zinc-300 text-orange-600 focus:ring-0 cursor-pointer" />
                      </th>
                      <th class="py-3 px-2.5 whitespace-nowrap w-28 lg:w-32">
                        <div class="inline-flex items-center gap-1.5 text-zinc-600 font-semibold">
                          ${renderIcon('Hash', 'w-3.5 h-3.5 text-zinc-400')}
                          <span>Código / Fecha</span>
                        </div>
                      </th>
                      <th class="py-3 px-2.5 min-w-0 max-w-[170px] lg:max-w-[210px]">
                        <div class="inline-flex items-center gap-1.5 text-zinc-600 font-semibold">
                          ${renderIcon('User', 'w-3.5 h-3.5 text-zinc-400')}
                          <span>Cliente / Destino en Obra</span>
                        </div>
                      </th>
                      <th class="py-3 px-2.5 min-w-0 max-w-[180px] lg:max-w-[220px]">
                        <div class="inline-flex items-center gap-1.5 text-zinc-600 font-semibold">
                          ${renderIcon('Package', 'w-3.5 h-3.5 text-zinc-400')}
                          <span>Equipos Solicitados</span>
                        </div>
                      </th>
                      <th class="py-3 px-2.5 whitespace-nowrap w-28 lg:w-36">
                        <div class="inline-flex items-center gap-1.5 text-zinc-600 font-semibold">
                          ${renderIcon('Calendar', 'w-3.5 h-3.5 text-zinc-400')}
                          <span>Periodo</span>
                        </div>
                      </th>
                      <th class="py-3 px-2.5 whitespace-nowrap hidden 2xl:table-cell w-20">
                        <div class="inline-flex items-center gap-1.5 text-zinc-600 font-semibold">
                          ${renderIcon('ShieldAlert', 'w-3.5 h-3.5 text-zinc-400')}
                          <span>Prioridad</span>
                        </div>
                      </th>
                      <th class="py-3 px-2.5 whitespace-nowrap w-24">
                        <div class="inline-flex items-center gap-1.5 text-zinc-600 font-semibold">
                          ${renderIcon('DollarSign', 'w-3.5 h-3.5 text-zinc-400')}
                          <span>Total</span>
                        </div>
                      </th>
                      <th class="py-3 px-2.5 whitespace-nowrap w-28">
                        <div class="inline-flex items-center gap-1.5 text-zinc-600 font-semibold">
                          ${renderIcon('Activity', 'w-3.5 h-3.5 text-zinc-400')}
                          <span>Estado</span>
                        </div>
                      </th>
                      <th class="py-3 px-3 text-right whitespace-nowrap w-auto pr-3">
                        <div class="inline-flex items-center justify-end gap-1.5 text-zinc-600 font-semibold">
                          ${renderIcon('Sliders', 'w-3.5 h-3.5 text-zinc-400')}
                          <span>Acciones</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-zinc-100">
                    ${paginatedRequests.map(req => {
                      const client = clientsMap.get(req.clientId);
                      const rawClientName = client?.fullName || 'Constructora Cliente';
                      const clientName = sanitizeEncoding(rawClientName);
                      const clientContact = client?.phone || client?.email || '+57 300 123 4567';

                      const firstItem = req.items?.[0];
                      const tool = firstItem ? toolsMap.get(firstItem.toolId) : null;
                      const toolName = tool?.name || 'Equipo en alquiler';
                      const toolImg = tool?.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=100';

                      const totalFormatted = formatCurrency(req.totalAmount || (req.subtotal ? req.subtotal + (req.deposit || 0) : 0));
                      const priorityScore = req.status === 'PENDING' ? 5 : req.status === 'CONFIRMED' ? 4 : req.status === 'IN_PROGRESS' ? 3 : 1;

                      return `
                        <tr class="crm-request-row hover:bg-zinc-50/80 transition-colors cursor-pointer group" data-req-id="${req.id}">
                          <td class="py-2.5 px-2.5 text-center shrink-0" onclick="event.stopPropagation()">
                            <input type="checkbox" class="crm-row-checkbox w-4 h-4 rounded border-zinc-300 text-orange-600 focus:ring-0 cursor-pointer" data-id="${req.id}" />
                          </td>
                          <td class="py-2.5 px-2.5 whitespace-nowrap">
                            <span class="font-mono font-medium text-zinc-900 block">${req.rentalCode || `#TR-${req.id?.slice(0, 6)}`}</span>
                            <span class="text-[10px] text-zinc-400 font-mono inline-flex items-center gap-1 mt-0.5">
                              ${renderIcon('Calendar', 'w-2.5 h-2.5 text-zinc-400')}
                              ${formatDate(req.createdAt || req.startDate)}
                            </span>
                          </td>
                          <td class="py-2.5 px-2.5 min-w-0 max-w-[170px] lg:max-w-[210px]">
                            <div class="font-medium text-zinc-900 group-hover:text-orange-600 transition-colors truncate" title="${clientName}">${clientName}</div>
                            <div class="text-[11px] text-zinc-500 flex items-center gap-1 mt-0.5 truncate" title="${sanitizeEncoding(req.deliveryAddress || client?.address || 'Obra Principal')}">
                              ${renderIcon('MapPin', 'w-3 h-3 text-orange-600 flex-shrink-0')}
                              <span class="truncate">${sanitizeEncoding(req.deliveryAddress || client?.address || 'Obra Principal')}</span>
                            </div>
                            <div class="text-[10px] text-zinc-400 font-mono mt-0.5 flex items-center gap-1">
                              ${renderIcon('Phone', 'w-2.5 h-2.5 text-zinc-400 flex-shrink-0')}
                              <span>${req.contactPhone || clientContact}</span>
                            </div>
                          </td>
                          <td class="py-2.5 px-2.5 min-w-0 max-w-[180px] lg:max-w-[220px]">
                            <div class="flex items-center gap-2">
                              <img src="${toolImg}" class="w-8 h-8 rounded-lg object-contain bg-zinc-50 border border-zinc-200/80 p-0.5 flex-shrink-0" onerror="this.src='https://images.unsplash.com/photo-1504148455328-c376907d081c?w=100'" />
                              <div class="min-w-0">
                                <div class="font-medium text-zinc-800 text-xs truncate" title="${toolName}">${toolName}</div>
                                <div class="text-[10px] text-zinc-400">${req.items?.length > 1 ? `+${req.items.length - 1} ítem(s)` : '1 unidad'}</div>
                              </div>
                            </div>
                          </td>
                          <td class="py-2.5 px-2.5 whitespace-nowrap text-zinc-600">
                            <div class="font-medium text-zinc-800">${formatDate(req.startDate)} → ${formatDate(req.endDate)}</div>
                            <div class="text-[10px] text-zinc-400 mt-0.5 inline-flex items-center gap-1">
                              ${renderIcon('Clock', 'w-2.5 h-2.5 text-zinc-400')}
                              <span>${req.totalDays || 1} día(s)</span>
                            </div>
                          </td>
                          <td class="py-2.5 px-2.5 whitespace-nowrap hidden 2xl:table-cell">
                            ${renderSegmentedLevel(priorityScore, 5, req.status === 'PENDING' ? 'orange' : req.status === 'CONFIRMED' ? 'blue' : 'emerald')}
                          </td>
                          <td class="py-2.5 px-2.5 whitespace-nowrap font-medium text-zinc-900 tabular-nums">
                            ${totalFormatted}
                          </td>
                          <td class="py-2.5 px-2.5 whitespace-nowrap">
                            ${renderCrmStatusBadge(req.status)}
                          </td>
                          <td class="py-2.5 px-3 text-right whitespace-nowrap pr-3" onclick="event.stopPropagation()">
                            <div class="flex items-center justify-end gap-1.5">
                              ${req.status === 'PENDING' ? `
                                <button class="btn-confirm-req bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-2.5 py-1 text-xs font-medium shadow-2xs flex items-center gap-1 transition-colors cursor-pointer" data-id="${req.id}" title="Aceptar y confirmar solicitud">
                                  ${renderIcon('Check', 'w-3.5 h-3.5')}
                                  <span>Confirmar</span>
                                </button>
                                <button class="btn-reject-req p-1 rounded-lg border border-zinc-200 hover:bg-rose-50 hover:text-rose-600 text-zinc-400 transition-colors cursor-pointer" data-id="${req.id}" title="Rechazar solicitud">
                                  ${renderIcon('X', 'w-3.5 h-3.5')}
                                </button>
                              ` : req.status === 'CONFIRMED' ? `
                                <button class="btn-dispatch-req bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-2.5 py-1 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer" data-id="${req.id}" title="Registrar despacho y generar remisión técnica hacia obra">
                                  ${renderIcon('Truck', 'w-3.5 h-3.5')}
                                  <span class="hidden lg:inline">Despachar</span>
                                </button>
                                <button class="btn-shipment-tracker p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 transition-colors cursor-pointer" data-id="${req.id}" title="Seguimiento de envío">
                                  ${renderIcon('Navigation', 'w-3.5 h-3.5')}
                                </button>
                              ` : req.status === 'IN_PROGRESS' ? `
                                <button class="btn-return-req bg-amber-600 hover:bg-amber-500 text-white rounded-lg px-2.5 py-1 text-xs font-medium shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer" data-id="${req.id}" title="Registrar devolución técnica e inspección">
                                  ${renderIcon('ClipboardCheck', 'w-3.5 h-3.5')}
                                  <span class="hidden lg:inline">Retorno</span>
                                </button>
                                <button class="btn-view-remission p-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer" data-id="${req.id}" title="Ver Remisión de Despacho">
                                  ${renderIcon('FileText', 'w-3.5 h-3.5 text-blue-600')}
                                </button>
                                <button class="btn-shipment-tracker p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 transition-colors cursor-pointer" data-id="${req.id}" title="Seguimiento de envío">
                                  ${renderIcon('Navigation', 'w-3.5 h-3.5')}
                                </button>
                              ` : `
                                <button class="btn-view-invoice border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-lg px-2.5 py-1 text-xs font-medium shadow-2xs flex items-center gap-1 transition-colors cursor-pointer" data-id="${req.id}">
                                  ${renderIcon('FileText', 'w-3 h-3 text-zinc-400')} <span class="hidden lg:inline">Factura</span>
                                </button>
                                <button class="btn-view-return-acta border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg px-2.5 py-1 text-xs font-semibold shadow-2xs flex items-center gap-1 transition-colors cursor-pointer" data-id="${req.id}" title="Ver Acta de Recepción Técnica y Retorno">
                                  ${renderIcon('FileCheck', 'w-3.5 h-3.5 text-emerald-600')} <span class="hidden lg:inline">Acta Retorno</span>
                                </button>
                                <button class="btn-view-remission p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 transition-colors cursor-pointer" data-id="${req.id}" title="Ver Remisión de Despacho">
                                  ${renderIcon('FileText', 'w-3.5 h-3.5 text-zinc-500')}
                                </button>
                                <button class="btn-shipment-tracker p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 transition-colors cursor-pointer" data-id="${req.id}" title="Ver historial de entrega">
                                  ${renderIcon('Navigation', 'w-3.5 h-3.5')}
                                </button>
                              `}
                              <button class="btn-req-popover p-1.5 rounded-lg border border-transparent hover:border-zinc-200 hover:bg-white text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer" data-id="${req.id}" title="Más opciones">
                                ${renderIcon('MoreHorizontal', 'w-4 h-4')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>

              ${renderPaginationControls({ currentPage: pageRequests, totalItems: totalReqCount, pageSize: pageSizeRequests, changeClass: 'btn-req-page-nav', label: 'solicitudes' })}
            </div>

            <!-- 2. Mobile & Tablet Adaptive Card View (Visible on screens < md) -->
            <div class="space-y-3 md:hidden">
              <div class="flex items-center justify-between px-1 py-1 text-xs text-zinc-500">
                <label class="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" id="select-all-requests-mobile" class="w-4 h-4 rounded border-zinc-300 text-orange-600 focus:ring-0 cursor-pointer" />
                  <span class="font-medium text-zinc-700">Seleccionar todas (${filteredRequests.length})</span>
                </label>
                <span class="text-[11px] text-zinc-400">Pág. ${pageRequests} de ${maxReqPages}</span>
              </div>

              ${paginatedRequests.map(req => {
                const client = clientsMap.get(req.clientId);
                const rawClientName = client?.fullName || 'Constructora Cliente';
                const clientName = sanitizeEncoding(rawClientName);
                const clientContact = client?.phone || client?.email || '+57 300 123 4567';

                const firstItem = req.items?.[0];
                const tool = firstItem ? toolsMap.get(firstItem.toolId) : null;
                const toolName = tool?.name || 'Equipo en alquiler';
                const toolImg = tool?.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=100';

                const totalFormatted = formatCurrency(req.totalAmount || (req.subtotal ? req.subtotal + (req.deposit || 0) : 0));

                return `
                  <div class="crm-card p-4 space-y-3 crm-request-card hover:border-zinc-300 transition-all cursor-pointer" data-req-id="${req.id}">
                    <div class="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2.5">
                      <div class="flex items-center gap-2">
                        <input type="checkbox" class="crm-row-checkbox w-4 h-4 rounded border-zinc-300 text-orange-600 focus:ring-0 cursor-pointer" data-id="${req.id}" onclick="event.stopPropagation()" />
                        <div>
                          <span class="font-mono font-bold text-zinc-900 text-xs">${req.rentalCode || `#TR-${req.id?.slice(0, 6)}`}</span>
                          <span class="text-[10px] text-zinc-400 block font-mono">${formatDate(req.createdAt || req.startDate)}</span>
                        </div>
                      </div>
                      <div class="flex items-center gap-1.5">
                        ${renderCrmStatusBadge(req.status)}
                        <button class="btn-req-popover p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer" data-id="${req.id}" title="Más opciones" onclick="event.stopPropagation()">
                          ${renderIcon('MoreHorizontal', 'w-4 h-4')}
                        </button>
                      </div>
                    </div>

                    <div class="space-y-2">
                      <div class="flex items-center gap-2.5">
                        <img src="${toolImg}" class="w-10 h-10 rounded-lg object-contain bg-zinc-50 border border-zinc-200/80 p-0.5 flex-shrink-0" onerror="this.src='https://images.unsplash.com/photo-1504148455328-c376907d081c?w=100'" />
                        <div class="min-w-0 flex-1">
                          <h4 class="font-semibold text-zinc-900 text-xs truncate" title="${toolName}">${toolName}</h4>
                          <span class="text-[11px] text-zinc-500">${req.items?.length > 1 ? `+${req.items.length - 1} ítem(s)` : '1 unidad asignada'}</span>
                        </div>
                      </div>

                      <div class="bg-zinc-50/70 rounded-lg p-2.5 space-y-1 text-xs">
                        <div class="flex items-center gap-1.5 text-zinc-800 font-medium truncate">
                          ${renderIcon('User', 'w-3 h-3 text-zinc-400 flex-shrink-0')}
                          <span class="truncate">${clientName}</span>
                        </div>
                        <div class="flex items-center gap-1.5 text-zinc-500 text-[11px] truncate">
                          ${renderIcon('MapPin', 'w-3 h-3 text-orange-600 flex-shrink-0')}
                          <span class="truncate">${sanitizeEncoding(req.deliveryAddress || client?.address || 'Obra Principal')}</span>
                        </div>
                        <div class="flex items-center justify-between pt-1 border-t border-zinc-200/50 text-[11px]">
                          <span class="text-zinc-500">${formatDate(req.startDate)} → ${formatDate(req.endDate)} (${req.totalDays || 1} d)</span>
                          <span class="font-bold text-zinc-900 tabular-nums">${totalFormatted}</span>
                        </div>
                      </div>
                    </div>

                    <div class="pt-1 flex items-center gap-2" onclick="event.stopPropagation()">
                      ${req.status === 'PENDING' ? `
                        <button class="btn-confirm-req flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2 text-xs font-semibold shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer" data-id="${req.id}">
                          ${renderIcon('Check', 'w-4 h-4')} Confirmar Solicitud
                        </button>
                        <button class="btn-reject-req p-2 rounded-xl border border-zinc-200 hover:bg-rose-50 hover:text-rose-600 text-zinc-400 transition-colors cursor-pointer" data-id="${req.id}" title="Rechazar">
                          ${renderIcon('X', 'w-4 h-4')}
                        </button>
                      ` : req.status === 'CONFIRMED' ? `
                        <button class="btn-dispatch-req flex-1 bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-2 text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer" data-id="${req.id}">
                          ${renderIcon('Truck', 'w-4 h-4')} Despachar a Obra
                        </button>
                        <button class="btn-shipment-tracker p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 transition-colors cursor-pointer" data-id="${req.id}" title="Seguimiento">
                          ${renderIcon('Navigation', 'w-4 h-4')}
                        </button>
                      ` : req.status === 'IN_PROGRESS' ? `
                        <button class="btn-return-req flex-1 bg-amber-600 hover:bg-amber-500 text-white rounded-xl py-2 text-xs font-semibold shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer" data-id="${req.id}">
                          ${renderIcon('ClipboardCheck', 'w-4 h-4')} Registrar Retorno
                        </button>
                        <button class="btn-view-remission p-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 transition-colors cursor-pointer" data-id="${req.id}" title="Remisión">
                          ${renderIcon('FileText', 'w-4 h-4 text-blue-600')}
                        </button>
                        <button class="btn-shipment-tracker p-2 rounded-xl border border-zinc-200 bg-white text-zinc-600 transition-colors cursor-pointer" data-id="${req.id}" title="Seguimiento">
                          ${renderIcon('Navigation', 'w-4 h-4')}
                        </button>
                      ` : `
                        <button class="btn-view-invoice flex-1 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 rounded-xl py-2 text-xs font-semibold shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer" data-id="${req.id}">
                          ${renderIcon('FileText', 'w-4 h-4 text-zinc-500')} Factura
                        </button>
                        <button class="btn-view-return-acta flex-1 border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl py-2 text-xs font-semibold shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer" data-id="${req.id}">
                          ${renderIcon('FileCheck', 'w-4 h-4 text-emerald-600')} Acta Retorno
                        </button>
                        <button class="btn-view-remission p-2 rounded-xl border border-zinc-200 bg-white text-zinc-600 transition-colors cursor-pointer" data-id="${req.id}" title="Remisión">
                          ${renderIcon('FileText', 'w-4 h-4 text-zinc-500')}
                        </button>
                        <button class="btn-shipment-tracker p-2 rounded-xl border border-zinc-200 bg-white text-zinc-600 transition-colors cursor-pointer" data-id="${req.id}" title="Seguimiento">
                          ${renderIcon('Navigation', 'w-4 h-4')}
                        </button>
                      `}
                    </div>
                  </div>
                `;
              }).join('')}

              <div class="crm-card overflow-hidden mt-3">
                ${renderPaginationControls({ currentPage: pageRequests, totalItems: totalReqCount, pageSize: pageSizeRequests, changeClass: 'btn-req-page-nav', label: 'solicitudes' })}
              </div>
            </div>
          `}

        </div>
      `;
    }

    // ===================================================================
    // TAB 3: TALLER Y GARANTÍAS EN OBRA (<24H)
    // ===================================================================
    else if (activeTab === 'maintenance') {
      const activeClaims = claimsList.filter(c => c.status !== 'RESOLVED' && c.status !== 'REJECTED');

      html = `
        <div class="space-y-6 animate-fade-in">
          
          <!-- Banner -->
          <div class="crm-card p-4 flex items-start gap-3 bg-amber-50/50 border-amber-200/80">
            <div class="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0">
              ${renderIcon('ShieldAlert', 'w-4 h-4')}
            </div>
            <div>
              <h3 class="font-semibold text-amber-950 text-xs sm:text-sm">Mesa de Ayuda, Sustitución en Faena (&lt;24h) y Taller Mecánico</h3>
              <p class="text-xs text-amber-800/80 mt-0.5 leading-relaxed">
                Gestiona en tiempo real los reemplazos de maquinaria solicitados por constructoras en obra y habilita equipos restaurados en taller.
              </p>
            </div>
          </div>

          <!-- Section 1: Solicitudes de Cambio y Garantías en Faena -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <h4 class="font-semibold text-zinc-900 text-xs sm:text-sm">Solicitudes de Cambio por Falla Técnica</h4>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${activeClaims.length > 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-zinc-100 text-zinc-600'}">
                  ${claimsList.length} radicados (${activeClaims.length} pendientes)
                </span>
              </div>
            </div>

            ${claimsList.length === 0 ? `
              <div class="crm-card p-8 text-center space-y-2">
                <div class="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
                  ${renderIcon('CheckCircle2', 'w-5 h-5 text-emerald-600')}
                </div>
                <h5 class="text-xs font-semibold text-zinc-800">Cero Incidencias Técnicas en Faena</h5>
                <p class="text-[11px] text-zinc-500 max-w-sm mx-auto">
                  No se han radicado solicitudes de cambio ni reportes de avería en obra para tus equipos.
                </p>
              </div>
            ` : `
              <div class="grid grid-cols-1 gap-3">
                ${claimsList.map(c => {
                  const isUrgent = c.urgency === 'URGENT';
                  const isOpen = c.status === 'OPEN';
                  const isDispatched = c.status === 'DISPATCHED';
                  const isResolved = c.status === 'RESOLVED';

                  return `
                    <div class="crm-card p-4 space-y-3 border-l-4 ${isUrgent ? 'border-l-rose-500' : 'border-l-blue-500'}">
                      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-100 text-xs">
                        <div class="flex items-center gap-2">
                          <span class="font-mono font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded text-[11px]">${c.ticketNumber}</span>
                          <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isUrgent ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }">
                            ${isUrgent ? 'URGENCIA CRÍTICA (&lt;4h)' : 'ESTÁNDAR (&lt;24h)'}
                          </span>
                          <span class="text-[11px] text-zinc-400 font-mono">${formatDate(c.createdAt)}</span>
                        </div>
                        <div>
                          ${isOpen ? `
                            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                              PENDIENTE DE ATENCIÓN
                            </span>
                          ` : isDispatched ? `
                            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              UNIDAD EN RUTA A FAENA
                            </span>
                          ` : isResolved ? `
                            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              REEMPLAZO RESUELTO EN OBRA
                            </span>
                          ` : `
                            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
                              ${c.status}
                            </span>
                          `}
                        </div>
                      </div>

                      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                        <div class="space-y-1">
                          <span class="text-[10px] font-bold uppercase text-zinc-400">Equipo en Faena</span>
                          <p class="font-medium text-zinc-900">${c.toolName || 'Maquinaria de construcción'}</p>
                          <span class="text-[11px] text-zinc-500 font-mono">Alquiler: ${c.rentalCode || `#TR-${c.rentalId?.slice(0, 8)}`}</span>
                        </div>

                        <div class="space-y-1">
                          <span class="text-[10px] font-bold uppercase text-zinc-400">Falla Operativa Reportada</span>
                          <p class="text-zinc-800 leading-snug">
                            <strong class="text-orange-700 font-semibold">[${c.faultType || 'TÉCNICA'}]</strong>: ${c.description}
                          </p>
                        </div>

                        <div class="space-y-1">
                          <span class="text-[10px] font-bold uppercase text-zinc-400">Logística de Entrega</span>
                          <p class="text-zinc-800 truncate flex items-center gap-1.5" title="${c.deliveryAddress}">
                            ${renderIcon('MapPin', 'w-3 h-3 text-orange-600 flex-shrink-0')}
                            <span class="truncate">${c.deliveryAddress || 'Dirección de obra'}</span>
                          </p>
                          <p class="text-zinc-600 font-mono text-[11px] flex items-center gap-1.5">
                            ${renderIcon('Phone', 'w-3 h-3 text-zinc-500 flex-shrink-0')}
                            <span>Encargado: <a href="tel:${c.contactPhone}" class="text-blue-600 hover:underline">${c.contactPhone}</a></span>
                          </p>
                        </div>
                      </div>

                      <div class="pt-2 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2">
                        <span class="text-[11px] text-zinc-400">
                          ${c.resolutionNotes ? `Nota de logística: <strong class="text-zinc-700">${c.resolutionNotes}</strong>` : 'Póliza: Sustitución directa de equipo con retiro de la unidad averiada.'}
                        </span>

                        <div class="flex items-center gap-2">
                          ${isOpen ? `
                            <button class="btn-update-claim-status px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer" data-claim-id="${c.id}" data-next-status="DISPATCHED">
                              ${renderIcon('Truck', 'w-3.5 h-3.5')}
                              Aprobar y Despachar Reemplazo
                            </button>
                          ` : isDispatched ? `
                            <button class="btn-update-claim-status px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer" data-claim-id="${c.id}" data-next-status="RESOLVED">
                              ${renderIcon('CheckCircle2', 'w-3.5 h-3.5')}
                              Confirmar Sustitución en Obra
                            </button>
                          ` : `
                            <span class="text-xs text-emerald-600 font-medium flex items-center gap-1">
                              ${renderIcon('CheckCheck', 'w-3.5 h-3.5')} Caso Completado
                            </span>
                          `}
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>

          <!-- Section 2: Maquinaria en Taller Mecánico -->
          <div class="space-y-3 pt-4 border-t border-zinc-200/80">
            <div class="flex items-center justify-between">
              <h4 class="font-semibold text-zinc-900 text-xs sm:text-sm">Flota en Taller de Reparación Preventiva</h4>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-600">
                ${maintenanceTools} herramientas
              </span>
            </div>

            ${maintenanceTools === 0 ? `
              <div class="crm-card p-6 text-center space-y-1">
                <span class="text-xs font-medium text-zinc-700">Flota 100% Operativa</span>
                <p class="text-[11px] text-zinc-400">No hay maquinaria pausada por inspección o reparación en bodega.</p>
              </div>
            ` : `
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${toolsList.filter(t => t.status === 'MAINTENANCE').map(t => `
                  <div class="crm-card p-4 space-y-3">
                    <div class="flex items-center justify-between">
                      ${renderCrmStatusBadge('MAINTENANCE', 'En Taller')}
                      <span class="text-xs font-mono text-zinc-400">${t.serialNumber || 'SN-000'}</span>
                    </div>
                    <div>
                      <div class="font-medium text-zinc-900 text-sm">${t.name}</div>
                      <p class="text-xs text-zinc-500 mt-0.5">${t.brand} • ${t.category?.name || 'Maquinaria'}</p>
                    </div>
                    <div class="pt-2 border-t border-zinc-100 flex items-center justify-between">
                      <span class="text-xs text-zinc-500 tabular-nums">Tarifa: ${formatCurrency(t.dailyPrice)}/d</span>
                      <button class="btn-toggle-maint bg-orange-600 hover:bg-orange-500 text-white rounded-lg px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors" data-id="${t.id}">
                        Habilitar a Disponible
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

        </div>
      `;
    }

    // ===================================================================
    // TAB 4: FACTURACIÓN E INGRESOS
    // ===================================================================
    else if (activeTab === 'finances') {
      html = `
        <div class="space-y-4 animate-fade-in">
          
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="crm-card p-4 space-y-1">
              <span class="text-xs text-zinc-500">Facturación Total Cobrada</span>
              <div class="text-2xl font-semibold text-zinc-900 tabular-nums">${formatCurrency(totalBilled)}</div>
              <div class="text-[11px] text-zinc-400">Total liquidado a través de ToolRent</div>
            </div>

            <div class="crm-card p-4 space-y-1">
              <span class="text-xs text-zinc-500">Subtotal Neto (Antes IVA 19%)</span>
              <div class="text-2xl font-semibold text-zinc-900 tabular-nums">${formatCurrency(Math.round(totalBilled / 1.19))}</div>
              <div class="text-[11px] text-zinc-400">Base gravable de servicios</div>
            </div>

            <div class="crm-card p-4 space-y-1">
              <span class="text-xs text-zinc-500">IVA 19% Generado</span>
              <div class="text-2xl font-semibold text-zinc-900 tabular-nums">${formatCurrency(totalBilled - Math.round(totalBilled / 1.19))}</div>
              <div class="text-[11px] text-zinc-400">Impuesto sobre las ventas</div>
            </div>
          </div>

          <!-- Invoices List -->
          <div class="crm-card overflow-hidden">
            <div class="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 class="font-medium text-zinc-900 text-xs sm:text-sm">Historial de Facturas Emitidas</h3>
                <p class="text-[11px] text-zinc-500">Comprobantes fiscales y contratos comerciales con factura emitida.</p>
              </div>
              <span class="text-xs font-medium text-zinc-500 bg-zinc-50 border border-zinc-200/80 px-2.5 py-1 rounded-lg">
                ${(() => {
                  const invs = requestsList.filter(r => r.status === 'COMPLETED' || r.status === 'IN_PROGRESS' || r.status === 'CONFIRMED');
                  return `${invs.length} factura${invs.length === 1 ? '' : 's'}`;
                })()}
              </span>
            </div>

            <div class="divide-y divide-zinc-100">
              ${(() => {
                const invoiceRentals = requestsList.filter(r => r.status === 'COMPLETED' || r.status === 'IN_PROGRESS' || r.status === 'CONFIRMED');
                const totalInvoicesCount = invoiceRentals.length;
                const maxInvPages = Math.ceil(totalInvoicesCount / pageSizeInvoices) || 1;
                if (pageInvoices > maxInvPages) pageInvoices = maxInvPages;
                const startInvIdx = (pageInvoices - 1) * pageSizeInvoices;
                const paginatedInvoices = invoiceRentals.slice(startInvIdx, startInvIdx + pageSizeInvoices);

                if (totalInvoicesCount === 0) {
                  return `
                    <div class="py-10 text-center text-zinc-400">
                      <p class="text-xs">Aún no se han generado facturas contables. Aparecerán aquí al completar alquileres o recibir pagos.</p>
                    </div>
                  `;
                }

                return paginatedInvoices.map(r => `
                  <div class="crm-invoice-row px-4 py-3 flex items-center justify-between hover:bg-zinc-50/70 transition-colors cursor-pointer group" data-id="${r.id}">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                        ${renderIcon('FileCheck', 'w-4 h-4')}
                      </div>
                      <div class="min-w-0">
                        <div class="font-medium text-zinc-900 text-xs font-mono group-hover:text-orange-600 transition-colors truncate">Factura #${r.rentalCode || r.id?.slice(0, 8)}</div>
                        <div class="text-[11px] text-zinc-500 truncate max-w-[140px] sm:max-w-xs">${formatDate(r.startDate)} • Cliente: ${clientsMap.get(r.clientId)?.fullName || 'Constructora Cliente'}</div>
                      </div>
                    </div>
                    <div class="flex items-center gap-3">
                      <div class="text-right">
                        <div class="font-medium text-zinc-900 text-xs tabular-nums">${formatCurrency(r.totalAmount || 150000)}</div>
                        <span class="text-[10px] text-emerald-600 font-mono font-medium uppercase">EMITIDA</span>
                      </div>
                      <button class="btn-view-invoice border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-lg px-2.5 py-1 text-xs font-medium cursor-pointer shadow-2xs hover:border-zinc-300" data-id="${r.id}" title="Ver Factura Electrónica">
                        ${renderIcon('Eye', 'w-3 h-3 text-zinc-400')}
                      </button>
                    </div>
                  </div>
                `).join('');
              })()}
            </div>

            ${(() => {
              const invoiceRentals = requestsList.filter(r => r.status === 'COMPLETED' || r.status === 'IN_PROGRESS' || r.status === 'CONFIRMED');
              return renderPaginationControls({ currentPage: pageInvoices, totalItems: invoiceRentals.length, pageSize: pageSizeInvoices, changeClass: 'btn-invoice-page-nav', label: 'facturas' });
            })()}
          </div>

        </div>
      `;
    }

    // ===================================================================
    // TAB 5: PERFIL COMERCIAL
    // ===================================================================
    else if (activeTab === 'profile') {
      html = `
        <div class="crm-card p-6 max-w-2xl space-y-5 animate-fade-in">
          
          <div class="flex items-center justify-between border-b border-zinc-100 pb-4">
            <div>
              <h3 class="text-base font-semibold text-zinc-900">Datos Comerciales del Proveedor</h3>
              <p class="text-xs text-zinc-500">Esta información se refleja en contratos, facturas y tu catálogo público.</p>
            </div>
            <button id="btn-edit-company-profile" class="border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-xl px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-2xs">
              ${renderIcon('Edit3', 'w-3.5 h-3.5 text-zinc-400')}
              <span>Editar Datos</span>
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="space-y-0.5">
              <span class="text-zinc-400 font-medium uppercase text-[10px] tracking-wider">Razón Social</span>
              <p class="text-zinc-900 font-medium">${companyName}</p>
            </div>

            <div class="space-y-0.5">
              <span class="text-zinc-400 font-medium uppercase text-[10px] tracking-wider">NIT / RUT</span>
              <p class="text-zinc-900 font-medium font-mono">${taxId}</p>
            </div>

            <div class="space-y-0.5">
              <span class="text-zinc-400 font-medium uppercase text-[10px] tracking-wider">Ciudad</span>
              <p class="text-zinc-900 font-medium">${city}</p>
            </div>

            <div class="space-y-0.5">
              <span class="text-zinc-400 font-medium uppercase text-[10px] tracking-wider">Dirección de Bodega</span>
              <p class="text-zinc-900 font-medium">${address}</p>
            </div>

            <div class="space-y-0.5">
              <span class="text-zinc-400 font-medium uppercase text-[10px] tracking-wider">Teléfono de Contacto</span>
              <p class="text-zinc-900 font-medium font-mono">${phone}</p>
            </div>

            <div class="space-y-0.5">
              <span class="text-zinc-400 font-medium uppercase text-[10px] tracking-wider">Correo Notificaciones</span>
              <p class="text-zinc-900 font-medium">${user?.email || 'contacto@proveedor.com'}</p>
            </div>
          </div>

          <div class="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              ${renderIcon('ShieldCheck', 'w-4 h-4')}
            </div>
            <div class="text-xs">
              <span class="font-medium text-zinc-900">Verificación Oficial ToolRent: Aprobada</span>
              <p class="text-zinc-500 text-[11px] mt-0.5">Póliza de arrendamiento y depósito de garantía habilitado en plataforma.</p>
            </div>
          </div>

        </div>
      `;
    }

    tabContainer.innerHTML = html;
    attachTabEventHandlers(tabContainer);
  }

  function attachTabEventHandlers(tabContainer) {
    // Inventory view mode toggle
    tabContainer.querySelector('#btn-view-cards')?.addEventListener('click', () => { viewMode = 'cards'; renderTabContent(); });
    tabContainer.querySelector('#btn-view-table')?.addEventListener('click', () => { viewMode = 'table'; renderTabContent(); });

    // Open add tool modal buttons
    tabContainer.querySelector('#btn-empty-add-tool')?.addEventListener('click', () => openNewToolModal());
    tabContainer.querySelector('#btn-inv-add-tool')?.addEventListener('click', () => openNewToolModal());

    // Quick Templates
    tabContainer.querySelectorAll('.btn-use-template').forEach(b => {
      b.addEventListener('click', () => {
        const idx = parseInt(b.dataset.index, 10);
        const tmpl = QUICK_TEMPLATES[idx];
        if (tmpl) openNewToolModal(null, tmpl);
      });
    });

    // Search input (debounced to avoid layout thrashing)
    let invSearchDebounce = null;
    tabContainer.querySelector('#inv-search-input')?.addEventListener('input', (e) => {
      const val = e.target.value;
      const cursorPos = e.target.selectionStart;
      clearTimeout(invSearchDebounce);
      invSearchDebounce = setTimeout(() => {
        inventorySearch = val;
        pageInventory = 1;
        renderTabContent();
        const reInp = tabContainer.querySelector('#inv-search-input');
        if (reInp) {
          reInp.focus();
          try { reInp.setSelectionRange(cursorPos, cursorPos); } catch (_) {}
        }
      }, 150);
    });

    // Category and status select filters
    tabContainer.querySelector('#inv-category-filter')?.addEventListener('change', (e) => {
      inventoryCategory = e.target.value;
      pageInventory = 1;
      renderTabContent();
    });

    tabContainer.querySelector('#inv-status-filter')?.addEventListener('change', (e) => {
      inventoryStatus = e.target.value;
      pageInventory = 1;
      renderTabContent();
    });

    // Requests Status Filter Buttons
    tabContainer.querySelectorAll('.btn-filter-status').forEach(b => {
      b.addEventListener('click', () => {
        requestsFilterStatus = b.dataset.status;
        pageRequests = 1;
        renderTabContent();
      });
    });

    let reqSearchDebounce = null;
    tabContainer.querySelector('#requests-search-input')?.addEventListener('input', (e) => {
      const val = e.target.value;
      clearTimeout(reqSearchDebounce);
      reqSearchDebounce = setTimeout(() => {
        requestsSearch = val;
        pageRequests = 1;
        renderTabContent();
      }, 150);
    });

    // ===================================================================
    // ROW CLICK TRIGGER: Floating Expandable CRM Card (2 States)
    // ===================================================================
    
    // Tools Row Click -> Overview Card
    tabContainer.querySelectorAll('.crm-tool-row, .crm-tool-card').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('input[type="checkbox"]') || e.target.closest('.btn-tool-popover')) return;
        const toolId = row.dataset.toolId;
        const tool = toolsList.find(t => t.id.toString() === toolId);
        if (!tool) return;

        openCrmOverviewCard({
          type: 'tool',
          title: tool.name,
          subtitle: `${tool.brand || 'ToolRent'} • ${tool.category?.name || 'Maquinaria'}`,
          avatar: tool.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200',
          status: tool.status,
          primaryActionText: 'Editar Herramienta',
          onPrimaryAction: () => openNewToolModal(tool),
          onSecondaryAction: () => {
            const isMaint = tool.status === 'MAINTENANCE';
            toggleToolMaintenance(tool);
          },
          properties: [
            { icon: 'DollarSign', label: 'Tarifa por Día', value: `${formatCurrency(tool.dailyPrice)} COP` },
            { icon: 'Shield', label: 'Depósito Garantía', value: `${formatCurrency(tool.replacementValue || tool.dailyPrice * 35)} COP` },
            { icon: 'Tag', label: 'Categoría', value: tool.category?.name || 'General' },
            { icon: 'Box', label: 'Modelo / SKU', value: tool.serialNumber || `SKU-${tool.id.slice(0, 8)}` },
            { icon: 'CheckCircle2', label: 'Estado Operativo', value: tool.status === 'AVAILABLE' ? 'Disponible' : tool.status === 'RENTED' ? 'En Faena' : 'En Taller' },
            { icon: 'Activity', label: 'Nivel Disponibilidad', value: tool.status === 'AVAILABLE' ? '5/5 Óptimo' : '3/5 Ocupado' }
          ],
          menuItems: [
            { icon: 'Eye', label: 'Ver en Catálogo Público', action: () => { window.location.hash = `#/product/${tool.id}`; } },
            { icon: 'Copy', label: 'Copiar Enlace de Publicación', action: () => {
              navigator.clipboard.writeText(`${window.location.origin}/#/product/${tool.id}`).catch(() => {});
              showToast('Enlace de la herramienta copiado al portapapeles', 'success');
            } },
            { icon: 'Printer', label: 'Imprimir Ficha de Inventario', action: () => window.print() },
            { divider: true },
            { icon: 'Trash2', label: 'Eliminar del Catálogo', danger: true, action: () => deleteTool(tool) }
          ]
        });
      });
    });

    // Requests Row or Card Click -> Overview Card
    tabContainer.querySelectorAll('.crm-request-row, .crm-request-card').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('input[type="checkbox"]') || 
            e.target.closest('.btn-req-popover') || 
            e.target.closest('.btn-confirm-req') || 
            e.target.closest('.btn-reject-req') || 
            e.target.closest('.btn-dispatch-req') || 
            e.target.closest('.btn-return-req') || 
            e.target.closest('.btn-shipment-tracker') || 
            e.target.closest('.btn-view-invoice')) return;
        const reqId = row.dataset.reqId;
        const req = requestsList.find(r => r.id === reqId);
        if (!req) return;

        const client = clientsList.find(c => c.id === req.clientId);
        const firstItem = req.items?.[0];
        const tool = firstItem ? toolsList.find(t => t.id === firstItem.toolId) : null;
        const isPending = req.status === 'PENDING';
        const isConfirmed = req.status === 'CONFIRMED';
        const isInProgress = req.status === 'IN_PROGRESS';
        const isCompleted = req.status === 'COMPLETED';

        let primaryText = 'Ver Factura';
        let onPrimary = () => openInvoiceForRental(req);

        if (isPending) {
          primaryText = 'Confirmar Solicitud';
          onPrimary = () => confirmRentalRequest(req.id);
        } else if (isConfirmed) {
          primaryText = 'Despachar a Obra';
          onPrimary = () => openDispatchModal(req);
        } else if (isInProgress) {
          primaryText = 'Registrar Retorno';
          onPrimary = () => openReturnInspectionModal(req);
        }

        openCrmOverviewCard({
          type: 'rental',
          title: client?.fullName || 'Constructora Cliente',
          subtitle: `Código ${req.rentalCode || `#TR-${req.id.slice(0, 6)}`} • ${tool?.name || 'Equipo en alquiler'}`,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(client?.fullName || 'Cliente')}&backgroundColor=f4f4f5&textColor=18181b`,
          status: req.status,
          primaryActionText: primaryText,
          onPrimaryAction: onPrimary,
          onSecondaryAction: () => openShipmentTrackerModal(req),
          properties: [
            { icon: 'FileText', label: 'Código de Reserva', value: req.rentalCode || `#TR-${req.id.slice(0, 8)}` },
            { icon: 'User', label: 'Cliente Titular', value: client?.fullName || 'Cliente' },
            { icon: 'MapPin', label: 'Destino en Obra', value: req.deliveryAddress || client?.address || 'Calle 134 # 19-45, Bogotá D.C.' },
            { icon: 'Phone', label: 'Contacto en Obra', value: req.contactPhone || client?.phone || '+57 300 123 4567' },
            { icon: 'Calendar', label: 'Periodo Alquiler', value: `${formatDate(req.startDate)} → ${formatDate(req.endDate)} (${req.totalDays || 1} días)` },
            { icon: 'DollarSign', label: 'Total Transacción', value: formatCurrency(req.totalAmount || 180000) },
            { icon: 'Layers', label: 'Herramienta', value: tool?.name || 'Equipo Industrial' },
            { icon: 'CheckCircle2', label: 'Estado Actual', value: req.status }
          ],
          menuItems: [
            { icon: 'Copy', label: 'Copiar Código de Reserva', action: () => {
              const code = req.rentalCode || `#TR-${req.id.slice(0, 8)}`;
              navigator.clipboard.writeText(code).catch(() => {});
              showToast(`Código ${code} copiado al portapapeles`, 'success');
            } },
            { icon: 'FileText', label: 'Ver Remisión de Despacho', action: () => openDispatchRemissionViewer(buildRemissionData(req)) },
            ...(isCompleted ? [
              { icon: 'FileCheck', label: 'Ver Acta de Recepción Técnica y Retorno', action: () => openCompletedReturnReceipt(req) }
            ] : []),
            ...(tool ? [
              { icon: 'Layers', label: 'Ver Ficha de la Maquinaria', action: () => { window.location.hash = `#/product/${tool.id}`; } }
            ] : []),
            { icon: 'Phone', label: 'Contactar Cliente Titular', action: () => {
              showToast(`Teléfono cliente: ${req.contactPhone || client?.phone || '+57 300 123 4567'}`, 'info');
            } },
            { icon: 'Printer', label: 'Imprimir Resumen de Reserva', action: () => window.print() },
            ...(req.status === 'COMPLETED' ? [
              { icon: 'FileCheck', label: 'Ver Acta de Recepción Técnica y Retorno', action: () => openCompletedReturnReceipt(req) }
            ] : []),
            ...(isPending ? [
              { divider: true },
              { icon: 'XCircle', label: 'Rechazar Solicitud', danger: true, action: () => rejectRentalRequest(req.id) }
            ] : [])
          ]
        });
      });
    });

    // ===================================================================
    // CONTEXTUAL POPOVER MENUS (3-dots button)
    // ===================================================================

    // Tool 3-dots popover
    tabContainer.querySelectorAll('.btn-tool-popover').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tool = toolsList.find(t => t.id.toString() === btn.dataset.id);
        if (!tool) return;

        openCrmOverviewCard({
          type: 'tool',
          title: tool.name,
          subtitle: `${tool.brand || 'ToolRent'} • ${tool.category?.name || 'Maquinaria'}`,
          avatar: tool.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200',
          status: tool.status,
          primaryActionText: 'Editar Herramienta',
          onPrimaryAction: () => openNewToolModal(tool),
          properties: [
            { icon: 'DollarSign', label: 'Tarifa', value: `${formatCurrency(tool.dailyPrice)} COP` },
            { icon: 'Shield', label: 'Depósito', value: `${formatCurrency(tool.replacementValue || tool.dailyPrice * 35)} COP` }
          ],
          menuItems: [
            { icon: 'Eye', label: 'Ver en Catálogo Público', action: () => { window.location.hash = `#/product/${tool.id}`; } },
            { icon: 'Copy', label: 'Copiar Enlace de Publicación', action: () => {
              navigator.clipboard.writeText(`${window.location.origin}/#/product/${tool.id}`).catch(() => {});
              showToast('Enlace de la herramienta copiado al portapapeles', 'success');
            } },
            { icon: 'Printer', label: 'Imprimir Ficha de Inventario', action: () => window.print() },
            { divider: true },
            { icon: 'Trash2', label: 'Eliminar del Catálogo', danger: true, action: () => deleteTool(tool) }
          ]
        });
      });
    });

    // Request 3-dots popover
    tabContainer.querySelectorAll('.btn-req-popover').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const req = requestsList.find(r => r.id === btn.dataset.id);
        if (!req) return;

        const isPending = req.status === 'PENDING';
        const isConfirmed = req.status === 'CONFIRMED';
        const isInProgress = req.status === 'IN_PROGRESS';

        let primaryText = 'Ver Factura';
        let onPrimary = () => openInvoiceForRental(req);

        if (isPending) {
          primaryText = 'Confirmar Solicitud';
          onPrimary = () => confirmRentalRequest(req.id);
        } else if (isConfirmed) {
          primaryText = 'Despachar a Obra';
          onPrimary = () => dispatchRental(req.id);
        } else if (isInProgress) {
          primaryText = 'Registrar Retorno';
          onPrimary = () => openReturnInspectionModal(req);
        }

        openCrmOverviewCard({
          type: 'rental',
          title: `Alquiler ${req.rentalCode || `#TR-${req.id.slice(0, 6)}`}`,
          subtitle: `Estado: ${req.status}`,
          status: req.status,
          primaryActionText: primaryText,
          onPrimaryAction: onPrimary,
          onSecondaryAction: () => openShipmentTrackerModal(req),
          properties: [
            { icon: 'FileText', label: 'Código', value: req.rentalCode || `#TR-${req.id.slice(0, 8)}` },
            { icon: 'DollarSign', label: 'Total', value: formatCurrency(req.totalAmount || 180000) }
          ],
          menuItems: [
            { icon: 'Copy', label: 'Copiar Código de Reserva', action: () => {
              const code = req.rentalCode || `#TR-${req.id.slice(0, 8)}`;
              navigator.clipboard.writeText(code).catch(() => {});
              showToast(`Código ${code} copiado al portapapeles`, 'success');
            } },
            { icon: 'Phone', label: 'Contactar al Cliente', action: () => {
              showToast('Línea de contacto con el cliente disponible en el panel de detalle', 'info');
            } },
            { icon: 'Printer', label: 'Imprimir Resumen de Reserva', action: () => window.print() },
            ...(isPending ? [
              { divider: true },
              { icon: 'XCircle', label: 'Rechazar Solicitud', danger: true, action: () => rejectRentalRequest(req.id) }
            ] : [])
          ]
        });
      });
    });

    // Edit tool button (both table & card view)
    tabContainer.querySelectorAll('.btn-edit-tool').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tool = toolsList.find(t => t.id.toString() === btn.dataset.id);
        if (tool) openNewToolModal(tool);
      });
    });

    // Toggle maintenance button
    tabContainer.querySelectorAll('.btn-toggle-maint').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tool = toolsList.find(t => t.id.toString() === btn.dataset.id);
        if (tool) toggleToolMaintenance(tool);
      });
    });

    // Confirm request button
    tabContainer.querySelectorAll('.btn-confirm-req').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        confirmRentalRequest(btn.dataset.id);
      });
    });

    // Reject request button
    tabContainer.querySelectorAll('.btn-reject-req').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        rejectRentalRequest(btn.dataset.id);
      });
    });

    // Dispatch request button
    tabContainer.querySelectorAll('.btn-dispatch-req').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const req = requestsList.find(r => r.id === btn.dataset.id);
        if (req) openDispatchModal(req);
      });
    });

    // View remission button
    tabContainer.querySelectorAll('.btn-view-remission').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const req = requestsList.find(r => r.id === btn.dataset.id);
        if (req) openDispatchRemissionViewer(buildRemissionData(req));
      });
    });

    // Return request button
    tabContainer.querySelectorAll('.btn-return-req').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const req = requestsList.find(r => r.id === btn.dataset.id);
        if (req) openReturnInspectionModal(req);
      });
    });

    // View Return Acta button (Acta de Devolución e Inspección Técnica completada)
    tabContainer.querySelectorAll('.btn-view-return-acta').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const req = requestsList.find(r => r.id === btn.dataset.id);
        if (req) openCompletedReturnReceipt(req);
      });
    });

    // Shipment tracker button
    tabContainer.querySelectorAll('.btn-shipment-tracker').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const req = requestsList.find(r => r.id === btn.dataset.id);
        if (req) openShipmentTrackerModal(req);
      });
    });

    // View invoice button & invoice row click
    tabContainer.querySelectorAll('.crm-invoice-row, .btn-view-invoice').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const req = requestsList.find(r => r.id === btn.dataset.id);
        if (req) openInvoiceForRental(req);
      });
    });

    // Pagination handlers
    tabContainer.querySelectorAll('.btn-inv-page-nav').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const p = parseInt(btn.dataset.page, 10);
        if (p && p >= 1) {
          pageInventory = p;
          renderTabContent();
          tabContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    tabContainer.querySelectorAll('.btn-req-page-nav').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const p = parseInt(btn.dataset.page, 10);
        if (p && p >= 1) {
          pageRequests = p;
          renderTabContent();
          tabContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    tabContainer.querySelectorAll('.btn-invoice-page-nav').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const p = parseInt(btn.dataset.page, 10);
        if (p && p >= 1) {
          pageInvoices = p;
          renderTabContent();
          tabContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    // Edit Company Profile button
    tabContainer.querySelector('#btn-edit-company-profile')?.addEventListener('click', () => {
      openCompanyProfileModal();
    });

    // Update Warranty Claim Status button
    tabContainer.querySelectorAll('.btn-update-claim-status').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const claimId = btn.dataset.claimId;
        const nextStatus = btn.dataset.nextStatus;
        try {
          btn.disabled = true;
          btn.innerHTML = `${renderIcon('Loader2', 'w-3 h-3 animate-spin')} Procesando...`;
          await api.patch(`/rentals/claims/${claimId}/status`, {
            status: nextStatus,
            notes: nextStatus === 'DISPATCHED' ? 'Unidad de reemplazo despachada hacia faena' : 'Sustitución técnica verificada y resuelta en obra'
          });
          showToast(nextStatus === 'DISPATCHED' ? 'Unidad de reemplazo despachada' : 'Garantía marcada como resuelta en obra', 'success');
          await loadData();
          updateKpis();
          renderTabContent();
        } catch (err) {
          showToast('Error al actualizar reclamo: ' + (err.message || 'Error del servidor'), 'error');
          btn.disabled = false;
        }
      });
    });

    // Select All Checkboxes
    const selectAllTools = tabContainer.querySelector('#select-all-tools');
    if (selectAllTools) {
      selectAllTools.addEventListener('change', (e) => {
        tabContainer.querySelectorAll('.crm-row-checkbox').forEach(cb => {
          cb.checked = e.target.checked;
          cb.dispatchEvent(new Event('change', { bubbles: true }));
        });
      });
    }

    const selectAllRequests = tabContainer.querySelector('#select-all-requests');
    const selectAllRequestsMobile = tabContainer.querySelector('#select-all-requests-mobile');
    const handleSelectAllRequests = (e) => {
      const isChecked = e.target.checked;
      tabContainer.querySelectorAll('.crm-row-checkbox').forEach(cb => {
        cb.checked = isChecked;
        cb.dispatchEvent(new Event('change', { bubbles: true }));
      });
      if (selectAllRequests && selectAllRequests !== e.target) selectAllRequests.checked = isChecked;
      if (selectAllRequestsMobile && selectAllRequestsMobile !== e.target) selectAllRequestsMobile.checked = isChecked;
    };
    if (selectAllRequests) selectAllRequests.addEventListener('change', handleSelectAllRequests);
    if (selectAllRequestsMobile) selectAllRequestsMobile.addEventListener('change', handleSelectAllRequests);

    // ===================================================================
    // FLOATING BULK ACTION BAR SETUP
    // ===================================================================
    if (bulkBarManager) bulkBarManager.destroy();
    bulkBarManager = setupCrmBulkBar({
      container: document.body,
      selector: '.crm-row-checkbox',
      onAction: (action, selectedIds) => {
        if (action === 'export') {
          showToast(`Exportando ${selectedIds.length} registros seleccionados a CSV...`, 'info');
        } else if (action === 'verify' || action === 'confirm') {
          showToast(`Procesando confirmación en lote para ${selectedIds.length} elementos...`, 'success');
        } else if (action === 'archive') {
          showToast(`${selectedIds.length} elementos archivados`, 'info');
        } else {
          showToast(`Acción "${action}" aplicada a ${selectedIds.length} filas`, 'info');
        }
      }
    });
  }

  // Helper actions
  async function toggleToolMaintenance(tool) {
    const newStatus = tool.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';
    try {
      await api.put(`/tools/${tool.id}`, {
        categoryId: tool.category?.id || categoriesList[0]?.id,
        name: tool.name,
        brand: tool.brand || 'ToolRent',
        model: tool.model || 'Modelo 2026',
        serialNumber: tool.serialNumber,
        description: tool.description || '',
        dailyPrice: tool.dailyPrice,
        replacementValue: tool.replacementValue || tool.dailyPrice * 35,
        status: newStatus,
        images: tool.images || []
      });
      tool.status = newStatus;
      updateKpis();
      renderTabContent();
      showToast(`"${tool.name}" cambiado a ${newStatus === 'AVAILABLE' ? 'Disponible' : 'Mantenimiento'}`, 'success');
    } catch (err) {
      tool.status = newStatus;
      updateKpis();
      renderTabContent();
      showToast('Estado actualizado localmente', 'success');
    }
  }

  async function deleteTool(tool) {
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente "${tool.name}" del catálogo?`)) return;
    try {
      await api.delete(`/tools/${tool.id}`);
      toolsList = toolsList.filter(t => t.id !== tool.id);
      updateKpis();
      renderTabContent();
      showToast(`"${tool.name}" eliminada del catálogo`, 'success');
    } catch (err) {
      showToast(err.message || 'Error al eliminar herramienta', 'error');
    }
  }

  async function confirmRentalRequest(reqId) {
    try {
      try {
        await api.post(`/reservas/${reqId}/aprobar`);
      } catch (errApi) {
        await api.patch(`/rentals/${reqId}/confirm`);
      }
      const req = requestsList.find(r => r.id === reqId);
      if (req) req.status = 'CONFIRMED';
      notificationsStore.add({
        category: 'RENTAL',
        type: 'success',
        title: 'Solicitud Confirmada / Aprobada',
        message: `Alquiler #${reqId.slice(0, 8)} aprobado. Listo para entrega en obra.`,
        link: '#/provider'
      });
      updateKpis();
      renderTabContent();
      showToast('Solicitud de alquiler aprobada con éxito', 'success');
    } catch (err) {
      showToast(err.message || 'Error al aprobar la solicitud', 'error');
    }
  }

  async function rejectRentalRequest(reqId) {
    if (!confirm('¿Deseas rechazar esta solicitud de alquiler?')) return;
    try {
      try {
        await api.post(`/reservas/${reqId}/rechazar`);
      } catch (errApi) {
        await api.patch(`/rentals/${reqId}/cancel`);
      }
      const req = requestsList.find(r => r.id === reqId);
      if (req) req.status = 'REJECTED';
      updateKpis();
      renderTabContent();
      showToast('Solicitud rechazada correctamente', 'info');
    } catch (err) {
      showToast(err.message || 'Error al rechazar solicitud', 'error');
    }
  }

  function buildRemissionData(req, customLogistics = {}) {
    const client = clientsList.find(c => c.id === req.clientId);
    const firstItem = req?.items?.[0];
    const tool = firstItem ? toolsList.find(t => t.id === firstItem.toolId) : null;
    const remissionNumber = customLogistics.remissionNumber || `REM-2026-${(req.rentalCode?.replace(/[^a-zA-Z0-9]/g, '') || req.id.slice(0, 6)).toUpperCase()}`;

    return {
      remissionNumber,
      issueDate: formatDate(new Date().toISOString().split('T')[0]),
      rentalCode: req.rentalCode || `#TR-${req.id.slice(0, 8)}`,
      provider: {
        name: providerProfile?.companyName || 'Maquinaria y Equipos Bogotá S.A.S.',
        taxId: providerProfile?.taxId || '900.123.456-1',
        address: providerProfile?.address || 'Av. Boyacá # 68-45, Bogotá D.C.',
        phone: providerProfile?.phone || '+57 310 111 2233',
        email: user?.email || 'contacto@maquinariabogota.com'
      },
      client: {
        name: client?.fullName || 'Constructora Cliente S.A.S.',
        taxId: client?.documentNumber ? `${client.documentType || 'CC'} ${client.documentNumber}` : 'CC 1018234567',
        deliveryAddress: req.deliveryAddress || client?.address || 'Calle 134 # 19-45, Bogotá D.C.',
        contactPhone: req.contactPhone || client?.phone || '+57 300 123 4567',
        email: client?.email || 'cliente@constructora.com'
      },
      tool: {
        name: tool?.name || firstItem?.toolName || 'Maquinaria Industrial',
        brand: tool?.brand || 'Industrial',
        model: tool?.model || 'Modelo Estándar',
        serialNumber: tool?.serialNumber || 'SN-2026-BOG-01',
        replacementValue: tool?.replacementValue || (tool?.dailyPrice ? tool.dailyPrice * 35 : 2500000)
      },
      rentalPeriod: {
        startDate: formatDate(req.startDate),
        endDate: formatDate(req.endDate),
        days: req.totalDays || 1
      },
      logistics: {
        carrier: customLogistics.carrier || 'Flota Logística ToolRent - Cuadrilla de Despacho',
        driver: customLogistics.driver || 'Jorge Rivas (C.C. 79.845.120)',
        plate: customLogistics.plate || 'WXZ-482 (Furgón NPR)',
        driverPhone: customLogistics.driverPhone || '+57 312 456 7890',
        notes: customLogistics.notes || 'Equipo probado en banco de prueba. Aceite, filtros y batería verificados al 100%. Sin fugas ni averías mecánicas. Accesorios y arneses de anclaje entregados completos.'
      }
    };
  }

  function openDispatchRemissionViewer(remission) {
    const content = document.createElement('div');
    content.className = 'bg-[#f1f5f9] p-4 sm:p-8 min-h-screen';

    content.innerHTML = `
      <div class="max-w-4xl mx-auto space-y-4">
        <!-- Top Action Bar -->
        <div class="flex items-center justify-between">
          <button id="remission-btn-back" class="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer">
            ${renderIcon('ArrowLeft', 'w-4 h-4')} Volver
          </button>
          <div class="flex items-center gap-2">
            <button id="remission-btn-print" class="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer">
              ${renderIcon('Printer', 'w-3.5 h-3.5')} Imprimir Remisión Oficial
            </button>
          </div>
        </div>

        <!-- Printable Remission Paper Card -->
        <div id="printable-remission-sheet" class="bg-white rounded-2xl shadow-xl border border-slate-200/90 p-6 sm:p-12 space-y-6 font-sans text-slate-800">
          
          <!-- Header -->
          <div class="flex flex-col sm:flex-row justify-between items-start gap-4 pb-5 border-b border-slate-200">
            <div class="space-y-1.5">
              <div class="flex items-center gap-2.5">
                <span class="w-8 h-8 rounded-lg bg-[#ea580c] flex items-center justify-center text-white font-black text-base shadow-xs">T</span>
                <div>
                  <span class="text-lg font-black tracking-tight text-slate-900 font-display">ToolRent<span class="text-[#ea580c]">.co</span></span>
                  <span class="block text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Sistema de Remisiones y Despacho</span>
                </div>
              </div>
              <p class="text-xs text-slate-500 font-medium">Comprobante Oficial de Salida de Bodega y Entrega en Obra</p>
            </div>
            <div class="text-left sm:text-right">
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 mb-1">
                ${renderIcon('Truck', 'w-3.5 h-3.5')} Remisión de Entrega
              </span>
              <p class="text-xl font-black text-slate-900 font-mono tracking-tight">${remission.remissionNumber}</p>
              <p class="text-[11px] text-slate-400">Fecha de Despacho: <strong class="text-slate-700">${remission.issueDate}</strong></p>
              <p class="text-[11px] text-slate-400">Contrato: <strong class="text-slate-700 font-mono">${remission.rentalCode}</strong></p>
            </div>
          </div>

          <!-- Parties Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
            <!-- Provider Info -->
            <div class="space-y-1.5">
              <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Proveedor / Bodega de Salida</span>
              <p class="font-bold text-slate-900 text-sm">${remission.provider.name}</p>
              <p class="text-slate-600 font-mono">NIT: ${remission.provider.taxId}</p>
              <p class="text-slate-600">${remission.provider.address}</p>
              <p class="text-slate-600">Tel: ${remission.provider.phone} • ${remission.provider.email}</p>
            </div>

            <!-- Client & Obra Destination -->
            <div class="space-y-1.5 border-t sm:border-t-0 sm:border-l sm:pl-6 border-slate-200 pt-3 sm:pt-0">
              <span class="text-[10px] font-bold uppercase tracking-wider text-orange-600 block">Cliente Titular y Destino en Obra</span>
              <p class="font-bold text-slate-900 text-sm">${remission.client.name}</p>
              <p class="text-slate-600 font-mono">${remission.client.taxId}</p>
              <p class="font-semibold text-slate-900 flex items-center gap-1">
                ${renderIcon('MapPin', 'w-3.5 h-3.5 text-orange-600 flex-shrink-0')}
                ${remission.client.deliveryAddress}
              </p>
              <p class="text-slate-600">Contacto en obra: <strong class="text-slate-900">${remission.client.contactPhone}</strong></p>
            </div>
          </div>

          <!-- Equipment Table -->
          <div class="space-y-2">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-700 block">Maquinaria Despachada para Alquiler</span>
            <div class="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table class="w-full text-left">
                <thead class="bg-slate-100 text-slate-700 font-semibold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th class="py-2.5 px-3">Equipo / Descripción</th>
                    <th class="py-2.5 px-3">Marca / Modelo</th>
                    <th class="py-2.5 px-3">Serial / Chasis</th>
                    <th class="py-2.5 px-3 text-center">Periodo en Obra</th>
                    <th class="py-2.5 px-3 text-right">Estado de Salida</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr>
                    <td class="py-3 px-3 font-semibold text-slate-900">
                      ${remission.tool.name}
                    </td>
                    <td class="py-3 px-3 text-slate-600">
                      ${remission.tool.brand} • ${remission.tool.model}
                    </td>
                    <td class="py-3 px-3 font-mono text-slate-600">
                      ${remission.tool.serialNumber}
                    </td>
                    <td class="py-3 px-3 text-center text-slate-700 font-medium">
                      ${remission.rentalPeriod.startDate} → ${remission.rentalPeriod.endDate} (${remission.rentalPeriod.days} días)
                    </td>
                    <td class="py-3 px-3 text-right">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        100% Operativo
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Logistics Info -->
          <div class="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Datos del Transporte y Despacho Logístico</span>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-700">
              <div>
                <span class="text-slate-400 block text-[10px]">Transportista / Cuadrilla:</span>
                <span class="font-semibold text-slate-900">${remission.logistics.carrier}</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px]">Conductor y Teléfono:</span>
                <span class="font-semibold text-slate-900">${remission.logistics.driver} (${remission.logistics.driverPhone})</span>
              </div>
              <div>
                <span class="text-slate-400 block text-[10px]">Placa del Vehículo:</span>
                <span class="font-mono font-bold text-slate-900">${remission.logistics.plate}</span>
              </div>
            </div>
            <div class="pt-1.5 border-t border-slate-200/80">
              <span class="text-slate-400 block text-[10px]">Observaciones Técnicas de Salida:</span>
              <p class="text-slate-600 text-[11px] italic mt-0.5">${remission.logistics.notes}</p>
            </div>
          </div>

          <!-- Legal & Signatures -->
          <div class="space-y-4 pt-4 border-t border-slate-200">
            <p class="text-[10px] text-slate-400 leading-relaxed text-justify">
              El receptor en obra certifica haber recibido a satisfacción la maquinaria detallada en este documento, en perfecto estado mecánico, de seguridad y con sus accesorios completos. A partir de este momento, asume la custodia, operación conforme al manual del fabricante y reporte inmediato ante cualquier eventualidad o falla técnica dentro de la garantía establecida.
            </p>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 text-center text-xs">
              <div class="border-t border-slate-300 pt-2 space-y-0.5">
                <span class="font-bold text-slate-900 block">Despachador de Bodega</span>
                <span class="text-[10px] text-slate-500 block">Firma y Sello de Salida</span>
              </div>
              <div class="border-t border-slate-300 pt-2 space-y-0.5">
                <span class="font-bold text-slate-900 block">${remission.logistics.driver.split('(')[0]}</span>
                <span class="text-[10px] text-slate-500 block">Transportista Responsable</span>
              </div>
              <div class="border-t border-slate-300 pt-2 space-y-0.5">
                <span class="font-bold text-slate-900 block">Residente / Receptor en Obra</span>
                <span class="text-[10px] text-slate-500 block">Firma, C.C. y Fecha de Recepción</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;

    content.querySelector('#remission-btn-back')?.addEventListener('click', () => modal.close());
    content.querySelector('#remission-btn-print')?.addEventListener('click', () => window.print());

    modal.open({
      title: '',
      content: content,
      maxWidth: 'max-w-4xl',
      hideHeader: true
    });
  }

  function openDispatchModal(req) {
    const firstItem = req?.items?.[0];
    const tool = firstItem ? toolsList.find(t => t.id === firstItem.toolId) : null;
    const client = clientsList.find(c => c.id === req.clientId);
    const toolImg = tool?.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200';

    const deliveryAddress = req.deliveryAddress || client?.address || 'Calle 134 # 19-45, Bogotá D.C.';
    const contactPhone = req.contactPhone || client?.phone || '+57 300 123 4567';
    const clientName = client?.fullName || 'Constructora Cliente';
    const defaultRemission = `REM-2026-${(req.rentalCode?.replace(/[^a-zA-Z0-9]/g, '') || req.id.slice(0, 6)).toUpperCase()}`;

    const content = document.createElement('div');
    content.className = 'space-y-4 text-xs animate-scale-in';

    content.innerHTML = `
      <div class="space-y-4 text-xs text-zinc-700">
        <!-- Order Header Badge -->
        <div class="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200/80 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <img src="${toolImg}" class="w-12 h-12 rounded-xl object-contain bg-white border border-zinc-200 p-1 flex-shrink-0" />
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-mono text-[11px] text-zinc-500 font-bold">${req.rentalCode || `#TR-${req.id.slice(0, 8)}`}</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">Listo para Despacho</span>
              </div>
              <h4 class="font-bold text-zinc-900 text-xs truncate mt-0.5">${tool?.name || 'Maquinaria de Construcción'}</h4>
              <span class="text-[11px] text-zinc-500 font-medium">${tool?.brand || 'Industrial'} • Serie: ${tool?.serialNumber || 'N/A'}</span>
            </div>
          </div>
          <div class="text-right flex-shrink-0">
            <span class="text-[10px] text-zinc-400 block uppercase tracking-wider font-semibold">Periodo Alquiler</span>
            <span class="font-medium text-zinc-800 text-[11px] block">${formatDate(req.startDate)} → ${formatDate(req.endDate)}</span>
            <span class="text-[10px] text-orange-600 font-mono font-bold">${req.totalDays || 1} días en obra</span>
          </div>
        </div>

        <!-- Obra Destination Card (from contract) -->
        <div class="p-3.5 bg-orange-50/60 border border-orange-200/80 rounded-2xl space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-orange-900 flex items-center gap-1.5">
              ${renderIcon('MapPin', 'w-3.5 h-3.5 text-orange-600')}
              Destino y Residente en Obra (Contrato)
            </span>
            <span class="text-[10px] bg-white px-2 py-0.5 rounded-md border border-orange-200 text-orange-700 font-mono font-semibold">Validado en Pago</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-zinc-800">
            <div class="bg-white/80 p-2.5 rounded-xl border border-orange-100">
              <span class="text-[10px] text-zinc-400 block uppercase tracking-wide">Dirección de la Faena</span>
              <span class="font-semibold text-zinc-900 text-xs flex items-center gap-1 mt-0.5">
                ${deliveryAddress}
              </span>
            </div>
            <div class="bg-white/80 p-2.5 rounded-xl border border-orange-100">
              <span class="text-[10px] text-zinc-400 block uppercase tracking-wide">Contacto / Residente en Obra</span>
              <span class="font-semibold text-zinc-900 text-xs flex items-center gap-1 mt-0.5">
                ${clientName} • <span class="font-mono text-orange-700">${contactPhone}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Logistics & Dispatch Form -->
        <div class="space-y-3 bg-white p-3.5 border border-zinc-200/90 rounded-2xl shadow-2xs">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
              ${renderIcon('Truck', 'w-4 h-4 text-blue-600')}
              Datos de Despacho y Transporte
            </span>
            <span class="font-mono text-[11px] text-zinc-500 font-semibold">Guía: <strong id="disp-remission-label" class="text-zinc-900">${defaultRemission}</strong></span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-medium text-zinc-700 text-[11px] mb-1">Empresa / Transportista</label>
              <input type="text" id="dispatch-carrier" class="input-field text-xs" value="Flota Logística ToolRent - Cuadrilla de Despacho" placeholder="Nombre empresa transportista..." />
            </div>
            <div>
              <label class="block font-medium text-zinc-700 text-[11px] mb-1">Nombre del Conductor</label>
              <input type="text" id="dispatch-driver" class="input-field text-xs" value="Jorge Rivas (C.C. 79.845.120)" placeholder="Conductor responsable..." />
            </div>
            <div>
              <label class="block font-medium text-zinc-700 text-[11px] mb-1">Placa Vehículo / Móvil</label>
              <input type="text" id="dispatch-plate" class="input-field text-xs font-mono uppercase" value="WXZ-482 (Furgón NPR)" placeholder="Ej: WXZ-482..." />
            </div>
            <div>
              <label class="block font-medium text-zinc-700 text-[11px] mb-1">Teléfono Conductor Móvil</label>
              <input type="text" id="dispatch-driver-phone" class="input-field text-xs font-mono" value="+57 312 456 7890" placeholder="+57 300 000 0000" />
            </div>
          </div>

          <div>
            <label class="block font-medium text-zinc-700 text-[11px] mb-1">Observaciones de Inspección Pre-Despacho</label>
            <textarea id="dispatch-notes" class="input-field h-16 text-xs" placeholder="Estado del equipo al salir de bodega, nivel de fluidos, accesorios entregados...">Equipo probado en banco y 100% operativo. Fluidos verificados al máximo nivel, sin fugas ni defectos. Accesorios completos y manual técnico entregados.</textarea>
          </div>

          <!-- Quality Checklist -->
          <div class="p-3 bg-zinc-50 rounded-xl border border-zinc-200/70 space-y-1.5">
            <span class="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Checklist de Salida de Bodega</span>
            <label class="flex items-center gap-2 text-[11px] text-zinc-700 cursor-pointer">
              <input type="checkbox" checked class="w-3.5 h-3.5 rounded text-orange-600 focus:ring-0" />
              <span>Inspección mecánica y prueba de encendido superadas</span>
            </label>
            <label class="flex items-center gap-2 text-[11px] text-zinc-700 cursor-pointer">
              <input type="checkbox" checked class="w-3.5 h-3.5 rounded text-orange-600 focus:ring-0" />
              <span>Arneses, anclajes y accesorios de seguridad incluidos</span>
            </label>
            <label class="flex items-center gap-2 text-[11px] text-zinc-700 cursor-pointer">
              <input type="checkbox" checked class="w-3.5 h-3.5 rounded text-orange-600 focus:ring-0" />
              <span>Acta de entrega física lista para firma del receptor en obra</span>
            </label>
          </div>
        </div>

        <!-- Modal Actions -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-zinc-100">
          <button id="btn-cancel-dispatch" class="btn-secondary !py-2 !px-4 text-xs cursor-pointer">
            Cancelar
          </button>
          <div class="flex items-center gap-2">
            <button id="btn-preview-remission" class="px-3 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs">
              ${renderIcon('FileText', 'w-3.5 h-3.5 text-zinc-500')}
              <span>Vista Previa Acta</span>
            </button>
            <button id="btn-confirm-dispatch-exec" class="btn-primary !py-2 !px-5 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer">
              ${renderIcon('Truck', 'w-4 h-4')}
              <span>Confirmar Despacho a Obra</span>
            </button>
          </div>
        </div>
      </div>
    `;

    const getFormLogistics = () => ({
      remissionNumber: defaultRemission,
      carrier: content.querySelector('#dispatch-carrier')?.value?.trim() || 'Flota Logística ToolRent',
      driver: content.querySelector('#dispatch-driver')?.value?.trim() || 'Jorge Rivas',
      plate: content.querySelector('#dispatch-plate')?.value?.trim() || 'WXZ-482',
      driverPhone: content.querySelector('#dispatch-driver-phone')?.value?.trim() || '+57 312 456 7890',
      notes: content.querySelector('#dispatch-notes')?.value?.trim() || 'Salida conforme.'
    });

    content.querySelector('#btn-cancel-dispatch')?.addEventListener('click', () => modal.close());

    content.querySelector('#btn-preview-remission')?.addEventListener('click', () => {
      const remissionData = buildRemissionData(req, getFormLogistics());
      openDispatchRemissionViewer(remissionData);
    });

    content.querySelector('#btn-confirm-dispatch-exec')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.innerHTML = `<span class="inline-flex items-center gap-1.5">${renderIcon('Loader2', 'w-4 h-4 animate-spin')} Despachando...</span>`;

      try {
        await api.patch(`/rentals/${req.id}/start`);
        req.status = 'IN_PROGRESS';
        updateKpis();
        renderTabContent();
        modal.close();
        showToast('¡Despacho registrado con éxito! El equipo ahora figura En Obra.', 'success');
        const remissionData = buildRemissionData(req, getFormLogistics());
        openDispatchRemissionViewer(remissionData);
      } catch (err) {
        btn.disabled = false;
        btn.innerHTML = `${renderIcon('Truck', 'w-4 h-4')} <span>Confirmar Despacho a Obra</span>`;
        showToast(err.message || 'Error al registrar despacho', 'error');
      }
    });

    modal.open({
      title: `${renderIcon('Truck', 'w-4 h-4 text-blue-600')} Despacho y Remisión de Maquinaria hacia Obra`,
      content: content,
      maxWidth: 'max-w-2xl'
    });
  }

  async function dispatchRental(reqId) {
    const req = requestsList.find(r => r.id === reqId);
    if (req) {
      openDispatchModal(req);
    } else {
      try {
        await api.patch(`/rentals/${reqId}/start`);
        updateKpis();
        renderTabContent();
        showToast('Entrega física registrada', 'success');
      } catch (err) {
        showToast(err.message || 'Error al registrar entrega', 'error');
      }
    }
  }

  async function openInvoiceForRental(req) {
    if (!req) return;

    let backendInvoice = null;
    try {
      backendInvoice = await api.get(`/billing/invoices/rental/${req.id}`);
    } catch (_) {}

    const client = clientsList.find(c => c.id === req.clientId);
    const firstItem = req.items?.[0];
    const tool = firstItem ? toolsList.find(t => t.id === firstItem.toolId) : null;
    const totalAmount = backendInvoice?.totalAmount || req.totalAmount || 180000;
    const subtotal = backendInvoice?.subtotal || Math.round(totalAmount / 1.19);
    const tax = backendInvoice?.tax !== undefined ? backendInvoice.tax : (totalAmount - subtotal);
    const totalDays = req.totalDays || 1;

    const items = (req.items && req.items.length > 0)
      ? req.items.map(it => {
          const t = toolsList.find(x => x.id === it.toolId);
          return {
            name: t?.name || it.toolName || 'Maquinaria en Alquiler',
            days: totalDays,
            dailyPrice: it.dailyPrice || Math.round(subtotal / totalDays),
            subtotal: it.totalPrice || subtotal
          };
        })
      : [
          {
            name: tool?.name || 'Maquinaria en Alquiler',
            days: totalDays,
            dailyPrice: firstItem?.dailyPrice || Math.round(subtotal / totalDays),
            subtotal: subtotal
          }
        ];

    openInvoiceViewer({
      rawInvoiceId: backendInvoice?.id,
      invoiceNumber: backendInvoice?.invoiceNumber || req.rentalCode || `TR-INV-${req.id.slice(0, 8).toUpperCase()}`,
      issueDate: backendInvoice?.issueDate ? formatDate(backendInvoice.issueDate.split('T')[0]) : formatDate(req.startDate || '2026-10-15'),
      client: {
        name: client?.fullName || 'Constructora Gómez & Asoc.',
        taxId: client?.documentNumber ? `${client.documentType || 'CC'} ${client.documentNumber}` : 'CC 1018234567',
        address: [client?.address, client?.city].filter(Boolean).join(', ') || req.deliveryAddress || 'Calle 134 # 19-45, Bogotá D.C.',
        email: client?.email || 'carlos.gomez@constructora.com',
        phone: client?.phone || req.contactPhone || '+57 300 123 4567'
      },
      provider: {
        name: providerProfile?.companyName || 'Maquinaria y Equipos Bogotá S.A.S.',
        taxId: providerProfile?.taxId || '900123456-1',
        address: providerProfile?.address || 'Av. Boyacá # 68-45, Bogotá D.C.',
        email: user?.email || 'contacto@maquinariabogota.com',
        phone: providerProfile?.phone || '+57 310 111 2233'
      },
      items: items,
      tool: {
        name: tool?.name || 'Maquinaria en Alquiler',
        sku: tool?.serialNumber || 'SKU-2026'
      },
      rentalPeriod: {
        startDate: formatDate(req.startDate || '2026-10-15'),
        endDate: formatDate(req.endDate || '2026-10-18'),
        days: totalDays
      },
      dailyRate: firstItem?.dailyPrice || Math.round(subtotal / totalDays),
      subtotal: subtotal,
      tax: tax,
      total: totalAmount,
      paymentMethod: backendInvoice?.paymentMethod || 'Transferencia electrónica bancaria',
      bank: 'Bancolombia S.A.',
      reference: backendInvoice?.paymentReference || req.rentalCode || `TR-REF-${req.id.slice(0, 6)}`,
      paymentDate: formatDate(req.startDate || '2026-10-15')
    });
  }

  // ===================================================================
  // MODALS (Return Inspection, New/Edit Tool, Company Profile)
  // ===================================================================

  function openReturnInspectionModal(req) {
    const firstItem = req?.items?.[0];
    const tool = firstItem ? toolsList.find(t => t.id === firstItem.toolId) : null;
    const toolImg = tool?.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200';

    const content = document.createElement('div');
    content.className = 'space-y-4 text-xs animate-scale-in text-zinc-700';

    const scheduledEndDate = req.endDate ? req.endDate.split('T')[0] : '';
    const todayStr = new Date().toISOString().split('T')[0];
    const isOverdue = scheduledEndDate && todayStr > scheduledEndDate;
    const client = clientsList.find(c => c.id === req.clientId);
    const depositAmount = req.deposit || 150000;

    content.innerHTML = `
      <div class="space-y-4">
        <!-- Preview and Contract Information -->
        <div class="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/80 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <img src="${toolImg}" class="w-12 h-12 rounded-lg object-contain bg-white border border-zinc-200 p-1 flex-shrink-0" onerror="this.src='https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200'" />
            <div class="min-w-0">
              <h4 class="font-bold text-zinc-900 text-xs truncate">${tool?.name || 'Equipo en devolución'}</h4>
              <span class="text-[11px] text-zinc-500">${tool?.brand || 'Industrial'} • Serie: ${tool?.serialNumber || 'N/A'}</span>
              <p class="text-[10px] text-zinc-500 mt-0.5">Cliente: <strong class="text-zinc-800">${client?.fullName || 'Constructora Cliente'}</strong></p>
            </div>
          </div>
          <div class="text-right flex-shrink-0">
            <span class="text-[10px] text-zinc-400 block uppercase font-semibold">Fecha Límite Asignada</span>
            <span class="font-bold text-xs ${isOverdue ? 'text-rose-600' : 'text-zinc-900'}">${formatDate(req.endDate)}</span>
            <span id="insp-schedule-badge" class="inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${isOverdue ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}">
              ${isOverdue ? 'Retorno con retraso' : 'Dentro de la fecha asignada'}
            </span>
          </div>
        </div>

        <!-- Date Compliance Selector -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-white border border-zinc-200/90 rounded-xl">
          <div>
            <label class="block text-[11px] font-semibold text-zinc-700 mb-1">Fecha Asignada en Contrato</label>
            <div class="p-2 bg-zinc-50 rounded-lg border border-zinc-200 text-xs font-mono font-medium text-zinc-700 flex items-center justify-between">
              <span>${formatDate(req.endDate)}</span>
              <span class="text-[10px] text-zinc-400 font-sans">(${req.totalDays || 1} d contratados)</span>
            </div>
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-zinc-700 mb-1">Fecha Efectiva de Recepción en Bodega *</label>
            <input type="date" id="insp-return-date" class="input-field text-xs font-mono font-medium w-full" value="${todayStr}" />
          </div>
        </div>

        <!-- Technical Reception Checklist -->
        <div class="space-y-2 p-3 bg-zinc-50 rounded-xl border border-zinc-200/80">
          <div class="flex items-center justify-between">
            <span class="font-semibold text-zinc-800 text-xs flex items-center gap-1.5">
              ${renderIcon('CheckSquare', 'w-3.5 h-3.5 text-orange-600')}
              Protocolo de Inspección Técnica en Bodega
            </span>
            <span class="text-[10px] text-zinc-400">Verificación 5 puntos</span>
          </div>
          <div class="space-y-2 pt-1 text-xs">
            <label class="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" id="chk-motor" checked class="mt-0.5 text-orange-600 rounded focus:ring-0" />
              <span class="text-zinc-700 text-[11px]">Sistema motriz, motor eléctrico u oleohidráulico 100% operativo sin fugas ni sobrecalentamiento.</span>
            </label>
            <label class="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" id="chk-accessories" checked class="mt-0.5 text-orange-600 rounded focus:ring-0" />
              <span class="text-zinc-700 text-[11px]">Accesorios, adaptadores, mandriles, llaves y cableado entregados completos según remisión de despacho.</span>
            </label>
            <label class="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" id="chk-clean" checked class="mt-0.5 text-orange-600 rounded focus:ring-0" />
              <span class="text-zinc-700 text-[11px]">Limpieza en bodega verificada (equipo despresurizado, sin sedimentos de hormigón fraguado ni sustancias corrosivas).</span>
            </label>
            <label class="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" id="chk-structure" checked class="mt-0.5 text-orange-600 rounded focus:ring-0" />
              <span class="text-zinc-700 text-[11px]">Estructura, guardas de seguridad, interruptores de parada y chasis íntegros sin fracturas.</span>
            </label>
            <div class="pt-1.5 border-t border-zinc-200/60 flex items-center justify-between gap-3">
              <label for="insp-horometer" class="text-[11px] font-semibold text-zinc-700 whitespace-nowrap">Horómetro final / Horas registradas:</label>
              <input type="text" id="insp-horometer" class="input-field text-xs font-mono max-w-[180px] text-right" value="38.5 Horas" placeholder="Ej: 38.5 hrs" />
            </div>
          </div>
        </div>

        <!-- Escrow Guarantee & Physical Status -->
        <div>
          <label class="block font-medium text-zinc-700 uppercase tracking-[0.06em] text-[10px] mb-2">Dictamen de Estado Físico y Garantía</label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <label class="flex items-center gap-2 p-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 cursor-pointer">
              <input type="radio" name="insp-status" value="GOOD" checked class="text-orange-600 focus:ring-0" />
              <div>
                <span class="font-bold text-zinc-800 text-xs block">Conforme y Operativo</span>
                <span class="text-[10px] text-emerald-600 font-medium">Liberar 100% garantía (${formatCurrency(depositAmount)})</span>
              </div>
            </label>
            <label class="flex items-center gap-2 p-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 cursor-pointer">
              <input type="radio" name="insp-status" value="DAMAGED" class="text-orange-600 focus:ring-0" />
              <div>
                <span class="font-bold text-amber-700 text-xs block">Con Averías / Daños</span>
                <span class="text-[10px] text-amber-600 font-medium">Deducir costo técnico de la custodia</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Damage box (conditional) -->
        <div id="damage-box" class="hidden p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-3">
          <span class="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
            ${renderIcon('AlertTriangle', 'w-3.5 h-3.5')} Reporte Técnico de Avería en Obra
          </span>
          <div>
            <label class="block text-[11px] font-medium text-zinc-700 mb-1">Descripción de la novedad técnica</label>
            <input type="text" id="dmg-desc" class="input-field text-xs" placeholder="Ej: Desgaste anómalo en corona, cable seccionado..." />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-medium text-zinc-700 mb-1">Costo Deducible de Reparación ($ COP)</label>
              <input type="number" id="dmg-cost" class="input-field text-xs font-mono tabular-nums" value="85000" />
            </div>
            <div>
              <label class="block text-[11px] font-medium text-zinc-700 mb-1">Destino Post-Retorno</label>
              <select id="dmg-action" class="input-field text-xs">
                <option value="MAINTENANCE" selected>Enviar a Taller / Mantenimiento</option>
                <option value="RETIRED">Dar de baja definitiva</option>
              </select>
            </div>
          </div>
          <div class="p-2 bg-white rounded-lg border border-amber-200/80 flex items-center justify-between text-xs">
            <span class="text-zinc-600 text-[11px]">Saldo de garantía a reembolsar al cliente:</span>
            <span id="dmg-refund-preview" class="font-bold text-emerald-700 font-mono">${formatCurrency(Math.max(0, depositAmount - 85000))}</span>
          </div>
        </div>

        <!-- Escrow Guarantee Status Box -->
        <div class="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl flex items-center justify-between gap-2 text-xs">
          <div class="flex items-center gap-2">
            ${renderIcon('ShieldCheck', 'w-4 h-4 text-emerald-600 flex-shrink-0')}
            <span class="text-emerald-950 font-medium text-[11px]">
              Garantía en custodia ToolRent: <strong>${formatCurrency(depositAmount)} COP</strong>.
            </span>
          </div>
          <span class="text-[10px] text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200 font-semibold shrink-0">
            Liberación al cerrar
          </span>
        </div>

        <div>
          <label class="block font-medium text-zinc-700 mb-1 text-[11px]">Observaciones del Técnico de Recepción</label>
          <textarea id="insp-notes" class="input-field h-16 text-xs leading-relaxed" placeholder="Anotaciones sobre desgaste normal, estado de pintura, horas de uso en faena..."></textarea>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
          <button id="btn-cancel-insp" class="btn-secondary !py-2 !px-4 text-xs cursor-pointer">Cancelar</button>
          <button id="btn-submit-insp" class="btn-primary !py-2 !px-5 text-xs font-semibold cursor-pointer flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 border-emerald-700">
            ${renderIcon('CheckCircle2', 'w-3.5 h-3.5')}
            <span>Confirmar Recepción y Cerrar Alquiler</span>
          </button>
        </div>
      </div>
    `;

    const radioDamaged = content.querySelector('input[value="DAMAGED"]');
    const radioGood = content.querySelector('input[value="GOOD"]');
    const dmgBox = content.querySelector('#damage-box');
    const dmgCostInput = content.querySelector('#dmg-cost');
    const dmgRefundPreview = content.querySelector('#dmg-refund-preview');

    const updateDmgRefund = () => {
      const cost = parseFloat(dmgCostInput?.value) || 0;
      const refund = Math.max(0, depositAmount - cost);
      if (dmgRefundPreview) dmgRefundPreview.textContent = formatCurrency(refund);
    };

    radioDamaged?.addEventListener('change', () => {
      dmgBox.classList.remove('hidden');
      updateDmgRefund();
    });
    radioGood?.addEventListener('change', () => dmgBox.classList.add('hidden'));
    dmgCostInput?.addEventListener('input', updateDmgRefund);

    const dateInput = content.querySelector('#insp-return-date');
    const scheduleBadge = content.querySelector('#insp-schedule-badge');
    dateInput?.addEventListener('change', (e) => {
      const sel = e.target.value;
      if (!sel || !scheduledEndDate || !scheduleBadge) return;
      if (sel <= scheduledEndDate) {
        scheduleBadge.className = 'inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200';
        scheduleBadge.textContent = sel === scheduledEndDate ? '✓ Retorno exacto en fecha asignada' : '✓ Retorno anticipado en fecha asignada';
      } else {
        scheduleBadge.className = 'inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200';
        scheduleBadge.textContent = '⚠ Retorno posterior a fecha asignada';
      }
    });

    content.querySelector('#btn-cancel-insp').addEventListener('click', () => modal.close());

    content.querySelector('#btn-submit-insp').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.innerHTML = `<span class="inline-flex items-center gap-1.5">${renderIcon('Loader2', 'w-3.5 h-3.5 animate-spin')} Procesando Recepción...</span>`;

      const isDamaged = content.querySelector('input[name="insp-status"]:checked')?.value === 'DAMAGED';
      const effectiveDate = dateInput?.value || todayStr;
      const horometer = content.querySelector('#insp-horometer')?.value || '38.5 Horas';
      const notes = content.querySelector('#insp-notes')?.value || (isDamaged ? 'Equipo recibido con novedades técnicas.' : 'Equipo recibido conforme a contrato en fecha asignada.');
      const deductionCost = isDamaged ? (parseFloat(dmgCostInput?.value) || 0) : 0;
      const dmgDesc = content.querySelector('#dmg-desc')?.value || '';

      try {
        await api.patch(`/rentals/${req.id}/complete`);
        req.status = 'COMPLETED';

        if (tool) {
          tool.status = isDamaged ? 'MAINTENANCE' : 'AVAILABLE';
        }

        notificationsStore.addNotification({
          type: 'RENTAL_RETURNED',
          title: `Recepción de Maquinaria: ${req.rentalCode || req.id.slice(0, 8)}`,
          message: `Recepción técnica y retorno completado para ${tool?.name || 'maquinaria'}. Estado ${isDamaged ? 'con avería técnica' : 'conforme y operativo'}. Depósito liquidado.`,
          date: new Date().toISOString()
        });

        showToast('Devolución e inspección técnica registradas exitosamente', 'success');
        modal.close();
        updateKpis();
        renderTabContent();

        // Open official return receipt for provider
        openProviderReturnReceiptModal({
          req,
          tool,
          client,
          inspectionData: {
            returnDate: effectiveDate,
            horometer: horometer,
            isDamaged: isDamaged,
            deduction: deductionCost,
            dmgDesc: dmgDesc,
            notes: notes
          }
        });

      } catch (err) {
        btn.disabled = false;
        btn.innerHTML = `${renderIcon('CheckCircle2', 'w-3.5 h-3.5')} Confirmar Recepción y Cerrar Alquiler`;
        showToast(err.message || 'Error al completar la devolución', 'error');
      }
    });

    modal.open({
      title: `${renderIcon('ClipboardCheck', 'w-4 h-4 text-orange-600')} Recepción Técnica y Retorno de Maquinaria`,
      content: content,
      maxWidth: 'max-w-xl'
    });
  }

  function openProviderReturnReceiptModal(data) {
    const { req, tool, client, inspectionData } = data;
    const toolName = tool?.name || req.items?.[0]?.toolName || 'Maquinaria de Construcción';
    const rentalCode = req.rentalCode || `#TR-${req.id?.slice(0, 8)}`;
    const company = providerProfile?.companyName || 'Maquinaria y Equipos Bogotá S.A.S.';
    const taxId = providerProfile?.taxId || '900123456-1';
    const clientName = client?.fullName || 'Constructora Cliente';
    const receiptCode = `ACTA-RET-${(req.rentalCode?.replace(/[^a-zA-Z0-9]/g, '') || req.id.slice(0, 6)).toUpperCase()}`;
    const returnDate = inspectionData.returnDate || new Date().toISOString().split('T')[0];
    const isDamaged = inspectionData.isDamaged || false;
    const depositTotal = req.deposit || 150000;
    const deduction = inspectionData.deduction || 0;
    const netRefund = Math.max(0, depositTotal - deduction);

    const scheduledEndDate = req.endDate ? req.endDate.split('T')[0] : '';
    const isOnTime = !scheduledEndDate || returnDate <= scheduledEndDate;

    const content = document.createElement('div');
    content.className = 'space-y-4 text-xs animate-scale-in text-zinc-800';

    content.innerHTML = `
      <!-- Action Bar -->
      <div class="flex items-center justify-between pb-3 border-b border-zinc-200">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <h3 class="font-bold text-sm text-zinc-900 font-display">Acta Digital de Recepción y Retorno Técnico</h3>
        </div>
        <div class="flex items-center gap-2">
          <button id="btn-print-prov-return-receipt" class="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5 cursor-pointer">
            ${renderIcon('Printer', 'w-3.5 h-3.5')} Imprimir Acta
          </button>
          <button id="btn-close-prov-return-receipt" class="btn-primary !py-1.5 !px-3 text-xs cursor-pointer">
            Cerrar
          </button>
        </div>
      </div>

      <!-- Printable Certificate Card -->
      <div id="printable-prov-return-receipt" class="p-6 bg-white border border-zinc-200 rounded-2xl space-y-4 shadow-xs">
        <!-- Certificate Header -->
        <div class="flex items-start justify-between border-b border-zinc-100 pb-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-base font-black text-zinc-900 tracking-tight font-display">ToolRent<span class="text-orange-600">.co</span></span>
              <span class="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold border border-emerald-200">
                RECEPCIÓN EN BODEGA APROBADA
              </span>
            </div>
            <p class="text-[11px] text-zinc-500 mt-1">${company} • NIT ${taxId}</p>
          </div>
          <div class="text-right">
            <span class="text-[10px] text-zinc-400 uppercase font-mono block">Nº Acta Retorno</span>
            <span class="font-mono font-bold text-sm text-zinc-800">${receiptCode}</span>
            <span class="text-[10px] text-zinc-500 block mt-0.5">Fecha: ${formatDate(returnDate)}</span>
          </div>
        </div>

        <!-- Info Grid -->
        <div class="grid grid-cols-2 gap-3 text-xs">
          <div class="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
            <span class="text-[10px] text-zinc-400 uppercase font-bold block">Cliente Titular</span>
            <strong class="text-zinc-900 block truncate">${clientName}</strong>
            <span class="text-[11px] text-zinc-500 block">Contrato: ${rentalCode}</span>
            <span class="text-[10px] text-zinc-400 block truncate">Destino: ${req.deliveryAddress || 'Obra Principal'}</span>
          </div>
          <div class="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
            <span class="text-[10px] text-zinc-400 uppercase font-bold block">Equipo Reincorporado</span>
            <strong class="text-zinc-900 block truncate">${toolName}</strong>
            <span class="text-[11px] text-zinc-500 block">Serie: ${tool?.serialNumber || 'N/A'}</span>
            <span class="text-[10px] text-zinc-400 block">Horómetro: ${inspectionData.horometer || '38.5 Horas'}</span>
          </div>
        </div>

        <!-- Schedule Compliance Banner -->
        <div class="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 flex items-center justify-between text-xs">
          <div>
            <span class="text-[10px] text-zinc-400 uppercase font-bold block">Cronograma Asignado en Contrato</span>
            <span class="font-medium text-zinc-800">${formatDate(req.startDate)} → ${formatDate(req.endDate)}</span>
          </div>
          <div class="text-right">
            <span class="text-[10px] text-zinc-400 uppercase font-bold block">Fecha Efectiva de Retorno</span>
            <span class="font-bold text-xs ${isOnTime ? 'text-emerald-700' : 'text-rose-600'}">${formatDate(returnDate)}</span>
            <span class="inline-block mt-0.5 text-[9px] font-bold px-2 py-0.5 rounded-full ${isOnTime ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}">
              ${isOnTime ? 'Retorno en Fecha Asignada' : 'Retorno Posterior a Plazo'}
            </span>
          </div>
        </div>

        <!-- Escrow Guarantee Settlement Table -->
        <div class="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-2 text-xs text-emerald-950">
          <div class="flex items-center justify-between font-bold border-b border-emerald-200/60 pb-1.5">
            <span>Liquidación de Depósito en Custodia</span>
            <span class="font-mono text-emerald-800">${formatCurrency(depositTotal)} COP</span>
          </div>
          <div class="space-y-1 text-[11px] text-emerald-900">
            <div class="flex items-center justify-between">
              <span>Depósito inicial en custodia:</span>
              <span class="font-mono font-medium">${formatCurrency(depositTotal)}</span>
            </div>
            ${isDamaged ? `
              <div class="flex items-center justify-between text-amber-900 font-medium">
                <span>Deducción técnica por avería / reparaciones:</span>
                <span class="font-mono">-${formatCurrency(deduction)}</span>
              </div>
            ` : ''}
            <div class="flex items-center justify-between font-bold text-xs pt-1 border-t border-emerald-200/60 text-emerald-950">
              <span>Monto total liberado y desembolsado al cliente:</span>
              <span class="font-mono text-emerald-700">${formatCurrency(netRefund)} COP</span>
            </div>
          </div>
          <p class="text-[10px] text-emerald-800/80 pt-0.5">
            Estado de la maquinaria: <strong>${isDamaged ? 'Enviada a mantenimiento técnico de taller' : '100% Conforme - Reintegrada a inventario disponible'}</strong>.
          </p>
        </div>

        <!-- Observations -->
        <div class="text-[11px] text-zinc-600 bg-zinc-50 p-2.5 rounded-lg border border-zinc-100">
          <strong>Dictamen técnico:</strong> ${inspectionData.notes || 'Recepción técnica completada a satisfacción conforme a contrato.'}
        </div>

        <!-- Signatures -->
        <div class="grid grid-cols-2 gap-6 pt-5 text-center text-xs">
          <div class="border-t border-zinc-300 pt-2">
            <span class="font-bold text-zinc-800 block">${company}</span>
            <span class="text-[10px] text-zinc-400 block">Técnico de Recepción en Bodega</span>
          </div>
          <div class="border-t border-zinc-300 pt-2">
            <span class="font-bold text-zinc-800 block">${clientName}</span>
            <span class="text-[10px] text-zinc-400 block">Responsable de Entrega / Transporte</span>
          </div>
        </div>
      </div>
    `;

    content.querySelector('#btn-close-prov-return-receipt')?.addEventListener('click', () => modal.close());
    content.querySelector('#btn-print-prov-return-receipt')?.addEventListener('click', () => window.print());

    modal.open({
      title: '',
      content: content,
      maxWidth: 'max-w-xl',
      hideHeader: true
    });
  }

  function openCompletedReturnReceipt(req) {
    const firstItem = req?.items?.[0];
    const tool = firstItem ? toolsList.find(t => t.id === firstItem.toolId) : null;
    const client = clientsList.find(c => c.id === req.clientId);
    openProviderReturnReceiptModal({
      req,
      tool,
      client,
      inspectionData: {
        returnDate: req.updatedAt || req.endDate || new Date().toISOString().split('T')[0],
        horometer: 'Verificado conforme',
        isDamaged: false,
        deduction: 0,
        notes: 'Devolución técnica e inspección en bodega completada conforme a contrato en fecha asignada.'
      }
    });
  }

  function openShipmentTrackerModal(req) {
    const firstItem = req?.items?.[0];
    const tool = firstItem ? toolsList.find(t => t.id === firstItem.toolId) : null;
    const client = clientsList.find(c => c.id === req.clientId);
    const toolImg = tool?.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200';

    const isPending = req.status === 'PENDING';
    const isConfirmed = req.status === 'CONFIRMED';
    const isInProgress = req.status === 'IN_PROGRESS';
    const isCompleted = req.status === 'COMPLETED';

    let currentStepNum = isPending ? 1 : isConfirmed ? 2 : isInProgress ? 3 : 4;

    const content = document.createElement('div');
    content.className = 'space-y-4 text-xs animate-scale-in';

    content.innerHTML = `
      <div class="space-y-4">
        <!-- Order & Tool Header -->
        <div class="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 min-w-0">
            <img src="${toolImg}" class="w-12 h-12 rounded-lg object-contain bg-white border border-zinc-200 p-1 flex-shrink-0" />
            <div class="min-w-0">
              <span class="font-mono text-[11px] text-zinc-400 font-semibold block">${req.rentalCode || `#TR-${req.id.slice(0, 8)}`}</span>
              <h4 class="font-semibold text-zinc-900 text-xs truncate">${tool?.name || 'Equipo en despacho'}</h4>
              <span class="text-[11px] text-zinc-500">${client?.fullName || 'Cliente'} • ${client?.phone || '+57 300 123 4567'}</span>
            </div>
          </div>
          <div class="text-right flex-shrink-0">
            ${renderCrmStatusBadge(req.status)}
            <span class="text-[10px] text-zinc-400 block mt-1 font-mono">${req.totalDays || 1} días en obra</span>
          </div>
        </div>

        <!-- Shipment Stepper (Visual 4-Stage Timeline) -->
        <div class="p-4 bg-white border border-zinc-200/90 rounded-2xl space-y-3.5 shadow-2xs">
          <div class="flex items-center justify-between text-xs font-semibold text-zinc-800">
            <span class="flex items-center gap-1.5">
              ${renderIcon('Truck', 'w-4 h-4 text-orange-600')}
              Línea de Vida y Envío de Maquinaria
            </span>
            <span class="text-xs text-orange-600 font-bold font-mono">Etapa ${currentStepNum} de 4</span>
          </div>

          <div class="space-y-3 relative pl-1">
            <!-- Step 1: PENDING -->
            <div class="flex items-start gap-3 relative">
              <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isPending ? 'bg-orange-600 text-white shadow-xs' : 'bg-emerald-600 text-white'}">
                ${isPending ? renderIcon('Clock', 'w-3.5 h-3.5') : renderIcon('Check', 'w-3.5 h-3.5')}
              </div>
              <div class="min-w-0 pt-0.5">
                <span class="font-semibold text-zinc-900 text-xs block">1. Solicitud y Validación de Reserva</span>
                <p class="text-[11px] text-zinc-500">El cliente emitió la orden de alquiler en plataforma.</p>
              </div>
            </div>

            <!-- Step 2: CONFIRMED -->
            <div class="flex items-start gap-3 relative">
              <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isConfirmed ? 'bg-blue-600 text-white shadow-xs' : (isInProgress || isCompleted ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-400 border border-zinc-200')}">
                ${isInProgress || isCompleted ? renderIcon('Check', 'w-3.5 h-3.5') : renderIcon('Truck', 'w-3.5 h-3.5')}
              </div>
              <div class="min-w-0 pt-0.5">
                <span class="font-semibold text-zinc-900 text-xs block">2. Preparación y Despacho en Bodega</span>
                <p class="text-[11px] text-zinc-500">Equipo verificado, alistado y listo para transporte o salida hacia la obra.</p>
              </div>
            </div>

            <!-- Step 3: IN_PROGRESS -->
            <div class="flex items-start gap-3 relative">
              <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isInProgress ? 'bg-emerald-600 text-white shadow-xs animate-pulse' : (isCompleted ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-400 border border-zinc-200')}">
                ${isCompleted ? renderIcon('Check', 'w-3.5 h-3.5') : renderIcon('HardHat', 'w-3.5 h-3.5')}
              </div>
              <div class="min-w-0 pt-0.5">
                <span class="font-semibold text-zinc-900 text-xs block">3. Entrega en Obra y Faena Activa</span>
                <p class="text-[11px] text-zinc-500">Maquinaria entregada al cliente y operando durante la vigencia del contrato.</p>
              </div>
            </div>

            <!-- Step 4: COMPLETED -->
            <div class="flex items-start gap-3 relative">
              <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isCompleted ? 'bg-emerald-600 text-white shadow-xs' : 'bg-zinc-100 text-zinc-400 border border-zinc-200'}">
                ${isCompleted ? renderIcon('CheckCircle2', 'w-3.5 h-3.5') : renderIcon('ClipboardCheck', 'w-3.5 h-3.5')}
              </div>
              <div class="min-w-0 pt-0.5">
                <span class="font-semibold text-zinc-900 text-xs block">4. Retorno a Bodega e Inspección Técnica</span>
                <p class="text-[11px] text-zinc-500">Recepción de maquinaria devuelta, verificación de desgaste y cierre de contrato.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Shipment Address & Contact Info -->
        <div class="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl space-y-1.5 text-xs text-zinc-600">
          <div class="flex items-center justify-between">
            <span class="text-zinc-500 flex items-center gap-1.5">${renderIcon('MapPin', 'w-3.5 h-3.5 text-orange-600 flex-shrink-0')} Destino de entrega en obra:</span>
            <span class="font-medium text-zinc-900">${req.deliveryAddress || client?.address || 'Calle 134 # 19-45, Bogotá D.C.'}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-zinc-500 flex items-center gap-1.5">${renderIcon('User', 'w-3.5 h-3.5 text-zinc-400 flex-shrink-0')} Contacto / Residente en faena:</span>
            <span class="font-medium text-zinc-900">${client?.fullName || 'Carlos Gómez'} (${req.contactPhone || client?.phone || '+57 300 123 4567'})</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-zinc-500 flex items-center gap-1.5">${renderIcon('Calendar', 'w-3.5 h-3.5 text-zinc-400 flex-shrink-0')} Vigencia contractual:</span>
            <span class="font-medium text-zinc-900">${formatDate(req.startDate)} → ${formatDate(req.endDate)} (${req.totalDays || 1} días)</span>
          </div>
        </div>

        <!-- Next Action Transition CTA -->
        <div class="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
          <button id="btn-close-tracker" class="btn-secondary !py-2 !px-4 text-xs cursor-pointer">Cerrar</button>

          <div class="flex items-center gap-2">
            ${isPending ? `
              <button id="btn-tracker-reject" class="btn-secondary !py-2 !px-3 text-xs text-rose-600 hover:bg-rose-50 cursor-pointer">Rechazar</button>
              <button id="btn-tracker-advance" class="btn-primary !py-2 !px-5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                ${renderIcon('Check', 'w-3.5 h-3.5')} Confirmar Solicitud
              </button>
            ` : isConfirmed ? `
              <button id="btn-tracker-advance" class="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-5 py-2 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer">
                ${renderIcon('Truck', 'w-3.5 h-3.5')} Despachar y Generar Remisión a Obra
              </button>
            ` : isInProgress ? `
              <button id="btn-tracker-remission" class="px-3 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                ${renderIcon('FileText', 'w-3.5 h-3.5 text-blue-600')} Ver Remisión
              </button>
              <button id="btn-tracker-advance" class="bg-amber-600 hover:bg-amber-500 text-white rounded-xl px-5 py-2 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer">
                ${renderIcon('ClipboardCheck', 'w-3.5 h-3.5')} Registrar Retorno e Inspeccionar
              </button>
            ` : `
              <button id="btn-tracker-remission" class="px-3 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                ${renderIcon('FileText', 'w-3.5 h-3.5 text-zinc-500')} Ver Remisión
              </button>
              <button id="btn-tracker-invoice" class="btn-primary !py-2 !px-5 text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                ${renderIcon('FileText', 'w-3.5 h-3.5')} Ver Factura Oficial
              </button>
            `}
          </div>
        </div>
      </div>
    `;

    content.querySelector('#btn-close-tracker')?.addEventListener('click', () => modal.close());

    content.querySelector('#btn-tracker-reject')?.addEventListener('click', async () => {
      modal.close();
      await rejectRentalRequest(req.id);
    });

    content.querySelector('#btn-tracker-remission')?.addEventListener('click', () => {
      openDispatchRemissionViewer(buildRemissionData(req));
    });

    content.querySelector('#btn-tracker-invoice')?.addEventListener('click', () => {
      modal.close();
      openInvoiceForRental(req);
    });

    content.querySelector('#btn-tracker-advance')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.innerHTML = `<span class="inline-flex items-center gap-1.5">${renderIcon('Loader2', 'w-3.5 h-3.5 animate-spin')} Procesando...</span>`;

      try {
        if (isPending) {
          await confirmRentalRequest(req.id);
          modal.close();
        } else if (isConfirmed) {
          modal.close();
          openDispatchModal(req);
        } else if (isInProgress) {
          modal.close();
          openReturnInspectionModal(req);
        }
      } catch (err) {
        btn.disabled = false;
        showToast(err.message || 'Error en la transición de envío', 'error');
      }
    });

    modal.open({
      title: `${renderIcon('Navigation', 'w-4 h-4 text-orange-600')} Seguimiento y Control de Envío`,
      content: content,
      maxWidth: 'max-w-lg'
    });
  }

  function openNewToolModal(existingTool = null, template = null) {
    const isEdit = !!existingTool;
    const initial = existingTool || template || {};
    
    let defaultCatId = categoriesList[0]?.id;
    if (initial.categoryKeyword) {
      const match = categoriesList.find(c => c.name.toLowerCase().includes(initial.categoryKeyword.toLowerCase()));
      if (match) defaultCatId = match.id;
    } else if (existingTool?.category?.id || existingTool?.categoryId) {
      defaultCatId = existingTool.category?.id || existingTool.categoryId;
    }

    const defaultImg = initial.imageUrl || initial.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1000';
    const spec1 = initial.specifications?.[0] || { specName: 'Potencia / Motor', specValue: '2200W / Eléctrico' };
    const spec2 = initial.specifications?.[1] || { specName: 'Alimentación / Voltaje', specValue: '110V / 220V' };

    const content = document.createElement('div');
    content.className = 'space-y-4 text-xs animate-scale-in';

    content.innerHTML = `
      <form id="tool-form" class="space-y-3.5">
        <div>
          <label class="block font-medium text-zinc-800 mb-1">Nombre Comercial de la Herramienta *</label>
          <input type="text" id="tf-name" required minlength="4" maxlength="100" class="input-field text-xs font-medium" value="${initial.name || ''}" placeholder="Ej: Martillo Demoledor Hexagonal 30kg (mínimo 4 caracteres)" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-medium text-zinc-800 mb-1">Categoría *</label>
            <select id="tf-category" required class="input-field text-xs cursor-pointer">
              ${categoriesList.map(c => `
                <option value="${c.id}" ${defaultCatId === c.id ? 'selected' : ''}>${c.name}</option>
              `).join('')}
            </select>
          </div>
          <div>
            <label class="block font-medium text-zinc-800 mb-1">Marca del Fabricante *</label>
            <input type="text" id="tf-brand" required class="input-field text-xs" value="${initial.brand || 'Bosch Professional'}" placeholder="Ej: DeWalt, Bosch, Caterpillar" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-medium text-zinc-800 mb-1">Modelo Comercial</label>
            <input type="text" id="tf-model" class="input-field text-xs" value="${initial.model || 'Modelo Pro'}" placeholder="Ej: GSH 27 VC" />
          </div>
          <div>
            <label class="block font-medium text-zinc-800 mb-1">Número de Serie / SKU Interno</label>
            <input type="text" id="tf-serial" class="input-field text-xs font-mono" value="${initial.serialNumber || `SN-${Date.now().toString().slice(-6)}`}" placeholder="SN-12345" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-medium text-zinc-800 mb-1">Tarifa Diaria ($ COP) *</label>
            <input type="number" id="tf-daily-price" required min="1000" max="50000000" step="1000" class="input-field text-xs font-medium text-zinc-900 tabular-nums font-mono" value="${initial.dailyPrice || 85000}" />
          </div>
          <div>
            <label class="block font-medium text-zinc-800 mb-1">Valor Reposición ($ COP) *</label>
            <input type="number" id="tf-replacement" required min="10000" max="1000000000" step="10000" class="input-field text-xs font-medium text-zinc-700 tabular-nums font-mono" value="${initial.replacementValue || 3000000}" />
          </div>
        </div>

        <!-- Dynamic Price Breakdown -->
        <div id="live-price-summary" class="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 text-[11px] text-zinc-700 flex items-center justify-between">
          <span>Estimado Semanal (7d): <strong id="est-weekly" class="font-medium text-orange-600 tabular-nums">$595.000 COP</strong></span>
          <span>Depósito sugerido: <strong id="est-dep" class="font-medium text-zinc-800 tabular-nums">$2.975.000 COP</strong></span>
        </div>

        <!-- Control de Stock y Disponibilidad Operativa -->
        <div class="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl space-y-2.5">
          <div class="flex items-center justify-between">
            <span class="text-[10px] uppercase font-medium text-zinc-500 block tracking-wider">Gestión de Stock y Disponibilidad</span>
            ${isEdit ? `
              <button type="button" id="btn-duplicate-unit" class="text-[11px] font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-100/70 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200 flex items-center gap-1 transition-colors cursor-pointer" title="Crea una nueva unidad física en el inventario con número de serie consecutivo (+1 unidad en stock)">
                ${renderIcon('CopyPlus', 'w-3 h-3')} +1 Stock (Duplicar Unidad)
              </button>
            ` : ''}
          </div>
          <div>
            <label class="block font-medium text-zinc-800 mb-1">Estado Operativo de esta Unidad</label>
            <select id="tf-status" class="input-field text-xs font-medium cursor-pointer">
              <option value="AVAILABLE" ${initial.status === 'AVAILABLE' ? 'selected' : ''}>Disponible para Alquiler (En Stock Activo)</option>
              <option value="MAINTENANCE" ${initial.status === 'MAINTENANCE' ? 'selected' : ''}>En Taller / Mantenimiento (Pausada de Catálogo)</option>
              ${isEdit && initial.status === 'RENTED' ? '<option value="RENTED" selected>Alquilada (En Obra de Cliente)</option>' : ''}
            </select>
            <p class="text-[10px] text-zinc-500 mt-1">
              Las unidades en "Mantenimiento" se pausan del catálogo público para evitar sobre-alquileres.
            </p>
          </div>
        </div>

        <!-- Technical Specifications -->
        <div class="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl space-y-2">
          <span class="text-[10px] uppercase font-medium text-zinc-400 block tracking-wider">Especificaciones Técnicas</span>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <input type="text" id="tf-spec-name-1" class="input-field text-xs mb-1" value="${spec1.specName || 'Potencia / Motor'}" placeholder="Propiedad (ej: Potencia)" />
              <input type="text" id="tf-spec-val-1" class="input-field text-xs" value="${spec1.specValue || '2200W'}" placeholder="Valor (ej: 2200W / 62J)" />
            </div>
            <div>
              <input type="text" id="tf-spec-name-2" class="input-field text-xs mb-1" value="${spec2.specName || 'Alimentación'}" placeholder="Propiedad (ej: Voltaje)" />
              <input type="text" id="tf-spec-val-2" class="input-field text-xs" value="${spec2.specValue || '110V / 220V'}" placeholder="Valor (ej: 110V / Diésel)" />
            </div>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="font-medium text-zinc-800">Descripción Técnica * (mínimo 15 caracteres)</label>
            <span class="text-[11px] font-mono text-zinc-400" id="tf-desc-counter"><strong id="tf-desc-len">0</strong>/1000 car.</span>
          </div>
          <textarea id="tf-desc" rows="3" required minlength="15" maxlength="1000" class="input-field text-xs leading-relaxed" placeholder="Capacidades técnicas, potencia, voltaje, peso y condiciones de entrega (mínimo 15 caracteres)...">${initial.description || ''}</textarea>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="font-medium text-zinc-800">Fotografía del Equipo</label>
            <span class="text-[10px] text-zinc-400">Pega un enlace o sube un archivo</span>
          </div>
          <div class="flex items-center gap-2">
            <input type="url" id="tf-image" class="input-field text-xs font-mono flex-1" value="${defaultImg}" placeholder="https://..." />
            <label class="btn-secondary !py-1.5 !px-3 text-xs font-medium cursor-pointer whitespace-nowrap flex items-center gap-1.5 border border-zinc-200 hover:bg-zinc-50 transition-colors">
              ${renderIcon('UploadCloud', 'w-3.5 h-3.5 text-zinc-500')}
              <span>Subir Archivo</span>
              <input type="file" id="tf-image-file" accept="image/jpeg,image/png,image/webp" class="hidden" />
            </label>
          </div>
          
          <!-- Preset Switcher -->
          <div class="flex items-center gap-1.5 mt-2 overflow-x-auto no-scrollbar py-0.5">
            <span class="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Muestras:</span>
            <button type="button" class="btn-preset-img px-2 py-0.5 rounded bg-zinc-100 hover:bg-orange-50 hover:text-orange-600 text-[10px] font-medium text-zinc-600 border border-zinc-200 transition-colors cursor-pointer" data-url="https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1000">Demolición</button>
            <button type="button" class="btn-preset-img px-2 py-0.5 rounded bg-zinc-100 hover:bg-orange-50 hover:text-orange-600 text-[10px] font-medium text-zinc-600 border border-zinc-200 transition-colors cursor-pointer" data-url="https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=1000">Hormigón</button>
            <button type="button" class="btn-preset-img px-2 py-0.5 rounded bg-zinc-100 hover:bg-orange-50 hover:text-orange-600 text-[10px] font-medium text-zinc-600 border border-zinc-200 transition-colors cursor-pointer" data-url="https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1000">Generador</button>
            <button type="button" class="btn-preset-img px-2 py-0.5 rounded bg-zinc-100 hover:bg-orange-50 hover:text-orange-600 text-[10px] font-medium text-zinc-600 border border-zinc-200 transition-colors cursor-pointer" data-url="/images/scaffold-1.jpg">Andamio</button>
          </div>

          <!-- Preview -->
          <div class="mt-2.5 p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 flex items-center gap-3">
            <div class="w-14 h-14 rounded-lg bg-white border border-zinc-200 p-1 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-2xs">
              <img id="live-tool-preview-img" src="${defaultImg}" class="w-full h-full object-contain mix-blend-multiply" />
            </div>
            <div class="min-w-0 flex-1">
              <span class="text-[10px] uppercase font-medium text-zinc-400 block tracking-wider">Vista Previa</span>
              <span id="live-tool-preview-name" class="text-xs font-medium text-zinc-800 truncate block">${initial.name || 'Herramienta'}</span>
              <span id="live-tool-preview-status" class="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                ${renderIcon('Check', 'w-3 h-3')} Fotografía cargada correctamente
              </span>
            </div>
          </div>
        </div>

        <div class="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
          <button type="button" id="btn-cancel-tool" class="btn-secondary !py-2 !px-4 text-xs cursor-pointer">Cancelar</button>
          <button type="submit" id="btn-submit-tool" class="btn-primary !py-2 !px-6 text-xs font-medium shadow-xs cursor-pointer">
            ${isEdit ? 'Guardar Cambios' : 'Publicar en Catálogo'}
          </button>
        </div>
      </form>
    `;

    const nameInput = content.querySelector('#tf-name');
    const previewName = content.querySelector('#live-tool-preview-name');
    nameInput?.addEventListener('input', (e) => {
      // Disallow symbols like .+}[*!@#$%^&*()
      const clean = e.target.value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s-]/g, '').slice(0, 100);
      if (e.target.value !== clean) e.target.value = clean;
      previewName.textContent = clean.trim() || 'Herramienta';
    });

    const descInput = content.querySelector('#tf-desc');
    const descLen = content.querySelector('#tf-desc-len');
    const updateDescCounter = () => {
      if (!descInput || !descLen) return;
      const len = descInput.value.length;
      descLen.textContent = len;
      if (len < 15) {
        descLen.className = 'text-amber-600 font-bold';
      } else {
        descLen.className = 'text-emerald-600 font-bold';
      }
    };
    descInput?.addEventListener('input', updateDescCounter);
    updateDescCounter();

    const brandInput = content.querySelector('#tf-brand');
    brandInput?.addEventListener('input', (e) => {
      const clean = e.target.value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s-]/g, '').slice(0, 50);
      if (e.target.value !== clean) e.target.value = clean;
    });

    const modelInput = content.querySelector('#tf-model');
    modelInput?.addEventListener('input', (e) => {
      const clean = e.target.value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s.-]/g, '').slice(0, 50);
      if (e.target.value !== clean) e.target.value = clean;
    });

    const serialInput = content.querySelector('#tf-serial');
    serialInput?.addEventListener('input', (e) => {
      const clean = e.target.value.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 50);
      if (e.target.value !== clean) e.target.value = clean;
    });

    const imgInput = content.querySelector('#tf-image');
    const previewImg = content.querySelector('#live-tool-preview-img');
    const previewStatus = content.querySelector('#live-tool-preview-status');
    const fallbackImage = 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600';

    let validationToken = 0;
    let debounceTimer = null;

    const validateAndApplyImage = (rawUrl) => {
      const url = (rawUrl || '').trim();
      validationToken++;
      const currentToken = validationToken;

      if (!url) {
        previewStatus.innerHTML = `${renderIcon('AlertCircle', 'w-3 h-3 text-zinc-400')} Pega una URL o sube una fotografía`;
        previewStatus.className = 'text-[11px] text-zinc-500 font-medium flex items-center gap-1 mt-0.5';
        previewImg.src = fallbackImage;
        return;
      }

      previewImg.src = url;
      previewStatus.innerHTML = `${renderIcon('Loader2', 'w-3 h-3 animate-spin text-zinc-500')} Validando imagen...`;
      previewStatus.className = 'text-[11px] text-zinc-500 font-medium flex items-center gap-1 mt-0.5';

      const tester = new Image();
      tester.onload = () => {
        if (currentToken !== validationToken) return;
        previewImg.src = url;
        previewStatus.innerHTML = `${renderIcon('Check', 'w-3 h-3 text-emerald-600')} Enlace verificado y listo`;
        previewStatus.className = 'text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5';
      };

      tester.onerror = () => {
        if (currentToken !== validationToken) return;
        previewStatus.innerHTML = `${renderIcon('AlertCircle', 'w-3 h-3 text-amber-600')} No se pudo cargar (usando fallback)`;
        previewStatus.className = 'text-[11px] text-amber-600 font-medium flex items-center gap-1 mt-0.5';
        previewImg.src = fallbackImage;
      };

      tester.src = url;
    };

    imgInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => validateAndApplyImage(e.target.value), 250);
    });

    imgInput.addEventListener('paste', () => setTimeout(() => validateAndApplyImage(imgInput.value), 40));
    imgInput.addEventListener('change', () => validateAndApplyImage(imgInput.value));

    const fileInput = content.querySelector('#tf-image-file');
    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        showToast('La imagen supera el límite máximo de 5MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (re) => {
        const base64Url = re.target.result;
        imgInput.value = base64Url;
        validateAndApplyImage(base64Url);
      };
      reader.readAsDataURL(file);
    });

    content.querySelectorAll('.btn-preset-img').forEach(btn => {
      btn.addEventListener('click', () => {
        const url = btn.dataset.url;
        imgInput.value = url;
        validateAndApplyImage(url);
      });
    });

    if (defaultImg) validateAndApplyImage(defaultImg);

    const priceInput = content.querySelector('#tf-daily-price');
    const replInput = content.querySelector('#tf-replacement');
    const estWeekly = content.querySelector('#est-weekly');
    const estDep = content.querySelector('#est-dep');

    const updatePriceCalculations = () => {
      const p = parseFloat(priceInput.value) || 0;
      estWeekly.textContent = formatCurrency(p * 7);
      const calculatedDep = Math.min(1000000000, p * 35);
      estDep.textContent = formatCurrency(calculatedDep);
      if (!replInput.value || replInput.value === '3000000') {
        replInput.value = calculatedDep;
      }
    };
    priceInput.addEventListener('input', updatePriceCalculations);
    updatePriceCalculations();

    content.querySelector('#btn-cancel-tool').addEventListener('click', () => modal.close());

    if (isEdit) {
      content.querySelector('#btn-duplicate-unit')?.addEventListener('click', async () => {
        if (!providerId) {
          showToast('Debes tener un perfil comercial activo para duplicar unidades.', 'error');
          return;
        }

        const dupBtn = content.querySelector('#btn-duplicate-unit');
        dupBtn.disabled = true;
        dupBtn.innerHTML = `<span class="inline-flex items-center gap-1">${renderIcon('Loader2', 'w-3 h-3 animate-spin')} Creando...</span>`;

        const currentToolsOfModel = toolsList.filter(t => t.name === existingTool.name || (t.brand === existingTool.brand && t.model === existingTool.model));
        const nextUnitNum = currentToolsOfModel.length + 1;
        const baseSn = existingTool.serialNumber || `SN-${Date.now().toString().slice(-6)}`;
        const nextSn = baseSn.includes('-U') ? baseSn.replace(/-U\d+$/, `-U${nextUnitNum}`) : `${baseSn}-U${nextUnitNum}`;

        const duplicatePayload = {
          providerId,
          categoryId: existingTool.categoryId || existingTool.category?.id || categoriesList[0]?.id,
          name: existingTool.name,
          brand: existingTool.brand,
          model: existingTool.model,
          serialNumber: nextSn,
          dailyPrice: existingTool.dailyPrice,
          replacementValue: existingTool.replacementValue,
          description: existingTool.description,
          status: 'AVAILABLE',
          images: existingTool.images && existingTool.images.length ? existingTool.images : [{ imageUrl: defaultImg, isPrimary: true }],
          specifications: existingTool.specifications || []
        };

        try {
          const created = await api.post('/tools', duplicatePayload);
          const newTool = {
            ...duplicatePayload,
            id: created?.id || `tool-${Date.now()}`,
            category: existingTool.category,
            categoryName: existingTool.categoryName || existingTool.category?.name
          };
          toolsList.unshift(newTool);
          modal.close();
          updateKpis();
          renderTabContent();
          showToast(`Stock ampliado: Nueva unidad de "${existingTool.name}" registrada (${nextSn})`, 'success');
        } catch (err) {
          dupBtn.disabled = false;
          dupBtn.innerHTML = `${renderIcon('CopyPlus', 'w-3 h-3')} +1 Stock (Duplicar Unidad)`;
          showToast(err.message || 'Error al duplicar unidad', 'error');
        }
      });
    }

    content.querySelector('#tool-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = content.querySelector('#btn-submit-tool');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="inline-flex items-center gap-2">${renderIcon('Loader2', 'w-3.5 h-3.5 animate-spin')} Procesando...</span>`;

      if (!providerId) {
        showToast('No tienes un perfil comercial de proveedor configurado. Por favor diligencia los datos de tu empresa.', 'warning');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        modal.close();
        openCompanyProfileModal();
        return;
      }

      const name = content.querySelector('#tf-name').value.trim();
      const categoryId = content.querySelector('#tf-category').value;
      const brand = content.querySelector('#tf-brand').value.trim();
      const model = content.querySelector('#tf-model').value.trim();
      const serialNumber = content.querySelector('#tf-serial').value.trim();
      const dailyPrice = parseFloat(content.querySelector('#tf-daily-price').value);
      const replacementValue = parseFloat(content.querySelector('#tf-replacement').value);
      const description = content.querySelector('#tf-desc').value.trim();
      const imageUrl = content.querySelector('#tf-image').value.trim();
      const selectedStatus = content.querySelector('#tf-status')?.value || (isEdit ? existingTool.status : 'AVAILABLE');

      // Validation 1: Tool name length & meaningful content (no symbol junk like .+}[*)
      if (!name || name.length < 4 || name.length > 100) {
        showToast('El nombre de la herramienta debe tener entre 4 y 100 caracteres.', 'warning');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        content.querySelector('#tf-name')?.focus();
        return;
      }

      const letterCount = (name.match(/[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ]/g) || []).length;
      if (letterCount < 3 || /^[.\s-]+$/.test(name)) {
        showToast('El nombre del equipo no puede ser una secuencia de caracteres o símbolos sin sentido. Debe incluir palabras comprensibles.', 'warning');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        content.querySelector('#tf-name')?.focus();
        return;
      }

      // Validation 2: Technical description length (min 15, max 1000, at least 10 letters)
      if (!description || description.length < 15 || description.length > 1000) {
        showToast('La descripción técnica debe ser detallada y tener entre 15 y 1000 caracteres.', 'warning');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        content.querySelector('#tf-desc')?.focus();
        return;
      }

      const descAlphaCount = (description.match(/[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ]/g) || []).length;
      if (descAlphaCount < 10) {
        showToast('La descripción debe contener al menos 10 caracteres legibles con detalles del equipo.', 'warning');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        content.querySelector('#tf-desc')?.focus();
        return;
      }

      // Validation 3: Pricing integrity and maximum bounds
      if (isNaN(dailyPrice) || dailyPrice < 1000 || dailyPrice > 50000000) {
        showToast('La tarifa diaria debe ser entre $1.000 y $50.000.000 COP.', 'warning');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        content.querySelector('#tf-daily-price')?.focus();
        return;
      }

      if (isNaN(replacementValue) || replacementValue < dailyPrice || replacementValue > 1000000000) {
        showToast('El valor de reposición debe ser mayor a la tarifa diaria y no exceder $1.000.000.000 COP.', 'warning');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        content.querySelector('#tf-replacement')?.focus();
        return;
      }

      const selectedCat = categoriesList.find(c => c.id === categoryId);

      const specs = [];
      const s1n = content.querySelector('#tf-spec-name-1')?.value.trim();
      const s1v = content.querySelector('#tf-spec-val-1')?.value.trim();
      if (s1n && s1v) specs.push({ specName: s1n, specValue: s1v });
      const s2n = content.querySelector('#tf-spec-name-2')?.value.trim();
      const s2v = content.querySelector('#tf-spec-val-2')?.value.trim();
      if (s2n && s2v) specs.push({ specName: s2n, specValue: s2v });
      if (specs.length === 0) {
        specs.push({ specName: 'Disponibilidad', specValue: 'Inmediata' });
        specs.push({ specName: 'Mantenimiento al día', specValue: 'Certificado' });
      }

      const payload = {
        providerId,
        categoryId,
        name,
        brand,
        model,
        serialNumber,
        dailyPrice,
        replacementValue,
        description,
        status: selectedStatus,
        images: [{ imageUrl: imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1000', isPrimary: true }],
        specifications: specs
      };

      try {
        if (isEdit) {
          await api.put(`/tools/${existingTool.id}`, payload);
          if (existingTool.status !== selectedStatus) {
            try {
              await api.patch(`/tools/${existingTool.id}/status`, { status: selectedStatus });
            } catch (ignored) {}
          }
          existingTool.name = name;
          existingTool.brand = brand;
          existingTool.model = model;
          existingTool.serialNumber = serialNumber;
          existingTool.dailyPrice = dailyPrice;
          existingTool.replacementValue = replacementValue;
          existingTool.description = description;
          existingTool.category = selectedCat;
          existingTool.categoryId = categoryId;
          existingTool.categoryName = selectedCat?.name;
          existingTool.status = selectedStatus;
          existingTool.specifications = specs;
          if (imageUrl) existingTool.images = [{ imageUrl, isPrimary: true }];

          const idx = toolsList.findIndex(t => t.id === existingTool.id);
          if (idx !== -1) {
            toolsList[idx] = { ...toolsList[idx], ...existingTool };
          }
          showToast(`"${name}" actualizada con éxito`, 'success');
        } else {
          const created = await api.post('/tools', payload);
          const newTool = {
            id: created?.id || `tool-${Date.now()}`,
            name,
            brand,
            model,
            serialNumber,
            dailyPrice,
            replacementValue,
            description,
            status: 'AVAILABLE',
            category: selectedCat,
            categoryId: categoryId,
            categoryName: selectedCat?.name,
            images: [{ imageUrl: imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1000', isPrimary: true }],
            specifications: specs
          };
          toolsList.unshift(newTool);
          showToast(`"${name}" publicada en tu catálogo`, 'success');
        }
        modal.close();
        updateKpis();
        renderTabContent();
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        showToast(err.message || 'Error al guardar herramienta', 'error');
      }
    });

    modal.open({
      title: `${renderIcon(isEdit ? 'Edit3' : 'PlusCircle', 'w-4 h-4 text-orange-600')} ${isEdit ? `Modificar Herramienta: ${initial.name || ''}` : 'Publicar Nueva Herramienta'}`,
      content: content,
      maxWidth: 'max-w-lg'
    });
  }

  function openCompanyProfileModal() {
    const content = document.createElement('div');
    content.className = 'space-y-4 text-xs animate-scale-in';

    content.innerHTML = `
      <form id="company-form" class="space-y-3.5">
        <div>
          <label class="block font-medium text-zinc-800 mb-1">Razón Social * (3 a 80 caracteres)</label>
          <input type="text" id="cp-name" required minlength="3" maxlength="80" class="input-field text-xs font-medium" value="${providerProfile?.companyName || 'Maquinaria y Equipos Bogotá S.A.S.'}" placeholder="ej. Ferretería y Equipos Central S.A.S." />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-medium text-zinc-800 mb-1">NIT / RUT * (ej. 900123456-1)</label>
            <input type="text" id="cp-tax" required maxlength="12" class="input-field text-xs font-mono" value="${providerProfile?.taxId || '900123456-1'}" placeholder="ej. 900123456-1" />
          </div>
          <div>
            <label class="block font-medium text-zinc-800 mb-1">Ciudad * (solo letras)</label>
            <input type="text" id="cp-city" required minlength="3" maxlength="40" class="input-field text-xs" value="${providerProfile?.city || 'Bogotá'}" placeholder="ej. Bogotá" />
          </div>
        </div>

        <div>
          <label class="block font-medium text-zinc-800 mb-1">Dirección de Bodega Principal * (mínimo 5 caracteres)</label>
          <input type="text" id="cp-address" required minlength="5" maxlength="100" class="input-field text-xs" value="${providerProfile?.address || 'Av. Boyacá # 68-45'}" placeholder="ej. Av. Boyacá # 68-45" />
        </div>

        <div>
          <label class="block font-medium text-zinc-800 mb-1">Teléfono de Despacho * (10 dígitos)</label>
          <input type="tel" id="cp-phone" required maxlength="10" inputmode="tel" class="input-field text-xs font-mono" value="${providerProfile?.phone ? providerProfile.phone.replace(/\D/g, '').slice(-10) : '3101112233'}" placeholder="ej. 3101112233" />
        </div>

        <div class="pt-3 border-t border-zinc-100 flex items-center justify-end gap-2">
          <button type="button" id="btn-cancel-cp" class="btn-secondary !py-2 !px-4 text-xs cursor-pointer">Cancelar</button>
          <button type="submit" id="btn-save-cp" class="btn-primary !py-2 !px-6 text-xs font-medium shadow-xs cursor-pointer">Guardar Datos</button>
        </div>
      </form>
    `;

    // Real-time input filters
    const nameInp = content.querySelector('#cp-name');
    nameInp?.addEventListener('input', (e) => {
      let val = e.target.value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s.&-]/g, '').slice(0, 80);
      val = val.replace(/[.-]{2,}/g, '.');
      e.target.value = val;
    });

    const taxInp = content.querySelector('#cp-tax');
    taxInp?.addEventListener('input', (e) => {
      let val = e.target.value.replace(/[^0-9-]/g, '').slice(0, 12);
      const parts = val.split('-');
      if (parts.length > 2) val = parts[0] + '-' + parts.slice(1).join('').replace(/-/g, '');
      e.target.value = val;
    });

    const cityInp = content.querySelector('#cp-city');
    cityInp?.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '').slice(0, 40);
    });

    const addrInp = content.querySelector('#cp-address');
    addrInp?.addEventListener('input', (e) => {
      let val = e.target.value.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s#.,-]/g, '').slice(0, 100);
      val = val.replace(/[-.#,]{2,}/g, '-');
      e.target.value = val;
    });

    const phoneInp = content.querySelector('#cp-phone');
    phoneInp?.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
    });

    content.querySelector('#btn-cancel-cp').addEventListener('click', () => modal.close());

    content.querySelector('#company-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = content.querySelector('#btn-save-cp');
      const originalText = saveBtn.innerHTML;

      const companyName = content.querySelector('#cp-name').value.trim();
      const taxId = content.querySelector('#cp-tax').value.trim();
      const city = content.querySelector('#cp-city').value.trim();
      const address = content.querySelector('#cp-address').value.trim();
      const phone = content.querySelector('#cp-phone').value.trim();

      // Validate 1: Razón social
      if (!companyName || companyName.length < 3 || companyName.length > 80) {
        showToast('La razón social debe tener entre 3 y 80 caracteres.', 'warning');
        nameInp?.focus();
        return;
      }
      const compAlpha = (companyName.match(/[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ]/g) || []).length;
      if (compAlpha < 3 || /^[.\s-]+$/.test(companyName)) {
        showToast('La razón social debe contener al menos 3 caracteres alfanuméricos legibles (no puede ser solo puntos o símbolos).', 'warning');
        nameInp?.focus();
        return;
      }

      // Validate 2: NIT / RUT (8 to 10 digits, optional -X)
      if (!/^\d{8,10}(-\d)?$/.test(taxId)) {
        showToast('El NIT o RUT debe tener entre 8 y 10 dígitos (ej. 900123456-1 o 900123456). No puede terminar con guion suelto.', 'warning');
        taxInp?.focus();
        return;
      }

      // Validate 3: Ciudad (Strictly letters and spaces)
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]{3,40}$/.test(city) || (city.match(/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/g) || []).length < 3) {
        showToast('La ciudad solo puede contener letras y espacios (entre 3 y 40 caracteres, ej. Bogotá).', 'warning');
        cityInp?.focus();
        return;
      }

      // Validate 4: Dirección (Valid street format without repetitive symbols)
      if (address.length < 5 || address.length > 100 || (address.match(/[a-zA-Z0-9]/g) || []).length < 4 || /[-.#,]{2,}/.test(address) || /^[.\s#-]+$/.test(address)) {
        showToast('La dirección debe tener un formato válido de al menos 5 caracteres (ej. Calle 100 # 15-20) sin secuencias de símbolos.', 'warning');
        addrInp?.focus();
        return;
      }

      // Validate 5: Teléfono (Strictly 10 digits)
      if (!/^\d{10}$/.test(phone)) {
        showToast('El teléfono debe contener exactamente 10 dígitos numéricos (ej. 3101112233).', 'warning');
        phoneInp?.focus();
        return;
      }

      saveBtn.disabled = true;
      saveBtn.innerHTML = `<span class="inline-flex items-center gap-2">${renderIcon('Loader2', 'w-3.5 h-3.5 animate-spin')} Guardando...</span>`;

      try {
        if (providerProfile?.id) {
          await api.put(`/providers/${providerProfile.id}`, { companyName, taxId, city, address, phone });
        }
        providerProfile = { ...(providerProfile || {}), companyName, taxId, city, address, phone };
        user.profile = providerProfile;
        localStorage.setItem('user', JSON.stringify(user));
        showToast('Perfil comercial actualizado exitosamente', 'success');
        modal.close();
        render();
      } catch (err) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = 'Guardar Datos';
        showToast(err.message || 'Error al actualizar perfil de empresa', 'error');
      }
    });

    modal.open({
      title: `${renderIcon('Building2', 'w-4 h-4 text-orange-600')} Modificar Perfil Comercial`,
      content: content,
      maxWidth: 'max-w-md'
    });
  }

  // Initial render
  render();
}
