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
  let providerProfile = user?.profile;
  if (!providerProfile?.id && isProvider) {
    try {
      providerProfile = await api.get('/providers/me');
      user.profile = providerProfile;
      localStorage.setItem('user', JSON.stringify(user));
    } catch (e) {
      console.warn('Could not fetch provider profile from /providers/me', e);
    }
  }

  const providerId = providerProfile?.id || (isAdmin ? null : user?.id);

  // State variables
  let activeTab = 'inventory'; // 'inventory' | 'requests' | 'maintenance' | 'finances' | 'profile'
  let viewMode = 'table'; // default to high-density CRM table
  let inventorySearch = '';
  let inventoryCategory = 'ALL';
  let inventoryStatus = 'ALL';

  let requestsFilterStatus = 'ALL';
  let requestsSearch = '';

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
      const promises = [
        providerId ? api.get('/tools', { providerId }).catch(() => []) : api.get('/tools').catch(() => []),
        providerId ? api.get(`/rentals/provider/${providerId}`).catch(() => []) : (isAdmin ? api.get('/rentals').catch(() => []) : Promise.resolve([])),
        api.get('/tools/categories').catch(() => []),
        api.get('/clients').catch(() => []),
        providerId ? api.get(`/rentals/claims/provider/${providerId}`).catch(() => []) : Promise.resolve([])
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
    if (bReq) bReq.textContent = requestsList.length;
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
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          
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

            <!-- KPI 2: Alquileres Activos -->
            <div class="crm-card p-4 flex items-center justify-between group hover:border-zinc-300 transition-colors">
              <div class="space-y-1">
                <span class="text-xs text-zinc-500 font-normal">Alquileres Activos</span>
                <div id="kpi-active-rentals" class="text-2xl font-semibold text-zinc-900 tabular-nums tracking-tight font-display">
                  ${activeRentals}
                </div>
                <div class="flex items-center gap-1.5 text-xs">
                  <span class="text-emerald-600 font-medium">${rentedTools}</span>
                  <span class="text-zinc-400 text-[11px]">equipos en faena</span>
                </div>
              </div>
              <div class="pl-2">
                ${renderSparkline({ color: 'emerald', points: [4, 8, 7, 12, 16, 19, 24], width: 84, height: 36 })}
              </div>
            </div>

            <!-- KPI 3: Solicitudes Pendientes -->
            <div class="crm-card p-4 flex items-center justify-between group hover:border-zinc-300 transition-colors">
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
                <span>Inventario y Maquinaria</span>
                <span id="badge-count-inventory" class="px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-100 text-zinc-600 border border-zinc-200">
                  ${toolsList.length}
                </span>
              </button>

              <button data-tab="requests" class="crm-tab-btn flex items-center gap-2 text-xs transition-colors cursor-pointer ${activeTab === 'requests' ? 'crm-tab-active' : 'crm-tab-inactive'}">
                <span>Solicitudes y Alquileres</span>
                <span id="badge-count-requests" class="px-1.5 py-0.2 rounded text-[10px] font-mono ${pendingRequests > 0 ? 'bg-orange-50 text-orange-700 border border-orange-200 font-medium' : 'bg-zinc-100 text-zinc-600 border border-zinc-200'}">
                  ${requestsList.length}
                </span>
              </button>

              <button data-tab="maintenance" class="crm-tab-btn flex items-center gap-2 text-xs transition-colors cursor-pointer ${activeTab === 'maintenance' ? 'crm-tab-active' : 'crm-tab-inactive'}">
                <span>Taller y Garantías</span>
                <span id="badge-count-maintenance" class="px-1.5 py-0.2 rounded text-[10px] font-mono ${claimsList.filter(c => c.status !== 'RESOLVED' && c.status !== 'REJECTED').length > 0 ? 'bg-amber-100 text-amber-800 border border-amber-300 font-bold' : 'bg-zinc-100 text-zinc-600 border border-zinc-200'}">
                  ${maintenanceTools + claimsList.filter(c => c.status !== 'RESOLVED' && c.status !== 'REJECTED').length}
                </span>
              </button>

              <button data-tab="finances" class="crm-tab-btn flex items-center gap-2 text-xs transition-colors cursor-pointer ${activeTab === 'finances' ? 'crm-tab-active' : 'crm-tab-inactive'}">
                <span>Facturación e Ingresos</span>
              </button>

              <button data-tab="profile" class="crm-tab-btn flex items-center gap-2 text-xs transition-colors cursor-pointer ${activeTab === 'profile' ? 'crm-tab-active' : 'crm-tab-inactive'}">
                <span>Perfil Comercial</span>
              </button>

            </nav>
          </div>

          <!-- 4. Dynamic Tab Stage -->
          <div id="provider-tab-content"></div>

        </div>
      </div>
    `;

    // Attach global toolbar handlers
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

    // Render active tab content
    renderTabContent();
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
      .filter(r => r.status === 'COMPLETED' || r.status === 'IN_PROGRESS')
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
            <!-- Dense CRM Table -->
            <div class="crm-card overflow-hidden">
              <div class="overflow-x-auto lg:overflow-x-hidden">
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
                    ${filteredTools.map((tool, idx) => {
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

              <div class="px-4 py-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 bg-white">
                <span>Mostrando <strong class="text-zinc-800 font-medium">${filteredTools.length}</strong> de ${toolsList.length} herramientas</span>
                <span class="text-[11px] text-zinc-400">Haz clic en cualquier fila para abrir la Ficha CRM de 2 estados</span>
              </div>
            </div>
          ` : `
            <!-- Cards View -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              ${filteredTools.map(tool => {
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
          `}

        </div>
      `;
    }

    // ===================================================================
    // TAB 2: SOLICITUDES Y ALQUILERES (CRM Requests Table)
    // ===================================================================
    else if (activeTab === 'requests') {
      html = `
        <div class="space-y-4 animate-fade-in">
          
          <!-- Filters Toolbar -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            <!-- Underline Filter Status Pills -->
            <div class="flex flex-wrap items-center gap-1.5">
              <button class="btn-filter-status px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${requestsFilterStatus === 'ALL' ? 'bg-zinc-900 text-white' : 'bg-white border border-zinc-200/80 text-zinc-600 hover:bg-zinc-50'}" data-status="ALL">
                Todas (${requestsList.length})
              </button>
              <button class="btn-filter-status px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${requestsFilterStatus === 'PENDING' ? 'bg-orange-600 text-white' : 'bg-white border border-zinc-200/80 text-zinc-600 hover:bg-zinc-50'}" data-status="PENDING">
                Pendientes (${pendingRequests})
              </button>
              <button class="btn-filter-status px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${requestsFilterStatus === 'CONFIRMED' ? 'bg-blue-600 text-white' : 'bg-white border border-zinc-200/80 text-zinc-600 hover:bg-zinc-50'}" data-status="CONFIRMED">
                Listas Despacho (${requestsList.filter(r => r.status === 'CONFIRMED').length})
              </button>
              <button class="btn-filter-status px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${requestsFilterStatus === 'IN_PROGRESS' ? 'bg-zinc-800 text-white' : 'bg-white border border-zinc-200/80 text-zinc-600 hover:bg-zinc-50'}" data-status="IN_PROGRESS">
                En Curso (${requestsList.filter(r => r.status === 'IN_PROGRESS').length})
              </button>
              <button class="btn-filter-status px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${requestsFilterStatus === 'COMPLETED' ? 'bg-emerald-600 text-white' : 'bg-white border border-zinc-200/80 text-zinc-600 hover:bg-zinc-50'}" data-status="COMPLETED">
                Completadas (${completedRentals})
              </button>
            </div>

            <div class="relative w-full sm:w-64">
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
            <div class="crm-card overflow-hidden">
              <div class="overflow-x-auto lg:overflow-x-hidden">
                <table class="w-full text-left text-xs table-auto">
                  <thead class="crm-table-header border-b border-zinc-200/70 bg-zinc-50/50">
                    <tr>
                      <th class="py-3 px-3 w-8 text-center">
                        <input type="checkbox" id="select-all-requests" class="w-4 h-4 rounded border-zinc-300 text-orange-600 focus:ring-0 cursor-pointer" />
                      </th>
                      <th class="py-3 px-3 whitespace-nowrap">Código / Fecha</th>
                      <th class="py-3 px-3 min-w-0">Cliente</th>
                      <th class="py-3 px-3 min-w-0">Equipos Solicitados</th>
                      <th class="py-3 px-3 whitespace-nowrap">Periodo</th>
                      <th class="py-3 px-3 whitespace-nowrap hidden 2xl:table-cell">Prioridad</th>
                      <th class="py-3 px-3 whitespace-nowrap">Total</th>
                      <th class="py-3 px-3 whitespace-nowrap">Estado</th>
                      <th class="py-3 px-3 text-right whitespace-nowrap w-24">Acciones</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-zinc-100">
                    ${filteredRequests.map(req => {
                      const client = clientsMap.get(req.clientId);
                      const clientName = client?.fullName || 'Constructora Cliente';
                      const clientContact = client?.phone || client?.email || '+57 300 123 4567';

                      const firstItem = req.items?.[0];
                      const tool = firstItem ? toolsMap.get(firstItem.toolId) : null;
                      const toolName = tool?.name || 'Equipo en alquiler';
                      const toolImg = tool?.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=100';

                      const totalFormatted = formatCurrency(req.totalAmount || (req.subtotal ? req.subtotal + (req.deposit || 0) : 0));
                      const priorityScore = req.status === 'PENDING' ? 5 : req.status === 'CONFIRMED' ? 4 : req.status === 'IN_PROGRESS' ? 3 : 1;

                      return `
                        <tr class="crm-request-row hover:bg-zinc-50/80 transition-colors cursor-pointer group" data-req-id="${req.id}">
                          <td class="py-3 px-3 text-center" onclick="event.stopPropagation()">
                            <input type="checkbox" class="crm-row-checkbox w-4 h-4 rounded border-zinc-300 text-orange-600 focus:ring-0 cursor-pointer" data-id="${req.id}" />
                          </td>
                          <td class="py-3 px-3 whitespace-nowrap">
                            <span class="font-mono font-medium text-zinc-900 block">${req.rentalCode || `#TR-${req.id?.slice(0, 6)}`}</span>
                            <span class="text-[10px] text-zinc-400 font-mono">${formatDate(req.createdAt || req.startDate)}</span>
                          </td>
                          <td class="py-3 px-3 min-w-0">
                            <div class="font-medium text-zinc-900 group-hover:text-orange-600 transition-colors truncate max-w-[140px] xl:max-w-none">${clientName}</div>
                            <div class="text-[11px] text-zinc-400 font-mono mt-0.5">${clientContact}</div>
                          </td>
                          <td class="py-3 px-3 min-w-0">
                            <div class="flex items-center gap-2">
                              <img src="${toolImg}" class="w-8 h-8 rounded-lg object-contain bg-zinc-50 border border-zinc-200/80 p-0.5 flex-shrink-0" onerror="this.src='https://images.unsplash.com/photo-1504148455328-c376907d081c?w=100'" />
                              <div class="min-w-0">
                                <div class="font-medium text-zinc-800 text-xs truncate max-w-[150px] xl:max-w-none">${toolName}</div>
                                <div class="text-[10px] text-zinc-400">${req.items?.length > 1 ? `+${req.items.length - 1} ítem(s)` : '1 unidad'}</div>
                              </div>
                            </div>
                          </td>
                          <td class="py-3 px-3 whitespace-nowrap text-zinc-600">
                            <div class="font-medium text-zinc-800">${formatDate(req.startDate)} → ${formatDate(req.endDate)}</div>
                            <div class="text-[10px] text-zinc-400 mt-0.5">${req.totalDays || 1} día(s)</div>
                          </td>
                          <td class="py-3 px-3 whitespace-nowrap hidden 2xl:table-cell">
                            ${renderSegmentedLevel(priorityScore, 5, req.status === 'PENDING' ? 'orange' : req.status === 'CONFIRMED' ? 'blue' : 'emerald')}
                          </td>
                          <td class="py-3 px-3 whitespace-nowrap font-medium text-zinc-900 tabular-nums">
                            ${totalFormatted}
                          </td>
                          <td class="py-3 px-3 whitespace-nowrap">
                            ${renderCrmStatusBadge(req.status)}
                          </td>
                          <td class="py-3 px-3 text-right whitespace-nowrap" onclick="event.stopPropagation()">
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
                                <button class="btn-dispatch-req bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-2.5 py-1 text-xs font-medium shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer" data-id="${req.id}" title="Registrar despacho y salida hacia la obra">
                                  ${renderIcon('Truck', 'w-3.5 h-3.5')}
                                  <span>Despachar a Obra</span>
                                </button>
                                <button class="btn-shipment-tracker p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 transition-colors cursor-pointer" data-id="${req.id}" title="Seguimiento de envío">
                                  ${renderIcon('Navigation', 'w-3.5 h-3.5')}
                                </button>
                              ` : req.status === 'IN_PROGRESS' ? `
                                <button class="btn-return-req bg-amber-600 hover:bg-amber-500 text-white rounded-lg px-2.5 py-1 text-xs font-medium shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer" data-id="${req.id}" title="Registrar devolución técnica e inspección">
                                  ${renderIcon('ClipboardCheck', 'w-3.5 h-3.5')}
                                  <span>Registrar Retorno</span>
                                </button>
                                <button class="btn-shipment-tracker p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 transition-colors cursor-pointer" data-id="${req.id}" title="Seguimiento de envío">
                                  ${renderIcon('Navigation', 'w-3.5 h-3.5')}
                                </button>
                              ` : `
                                <button class="btn-view-invoice border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-lg px-2.5 py-1 text-xs font-medium shadow-2xs flex items-center gap-1 transition-colors cursor-pointer" data-id="${req.id}">
                                  ${renderIcon('FileText', 'w-3 h-3 text-zinc-400')} Factura
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

              <div class="px-4 py-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 bg-white">
                <span>Total de solicitudes: <strong class="text-zinc-800 font-medium">${filteredRequests.length}</strong></span>
                <span class="text-[11px] text-zinc-400">Haz clic en la fila para abrir detalles del cliente y contrato</span>
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
                          <p class="text-zinc-800 truncate" title="${c.deliveryAddress}">📍 ${c.deliveryAddress || 'Dirección de obra'}</p>
                          <p class="text-zinc-600 font-mono text-[11px]">📞 Encargado: <a href="tel:${c.contactPhone}" class="text-blue-600 hover:underline">${c.contactPhone}</a></p>
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
                <p class="text-[11px] text-zinc-500">Comprobantes fiscales y contratos completados.</p>
              </div>
            </div>

            <div class="divide-y divide-zinc-100">
              ${requestsList.filter(r => r.status === 'COMPLETED' || r.status === 'IN_PROGRESS').length === 0 ? `
                <div class="py-10 text-center text-zinc-400">
                  <p class="text-xs">Aún no se han generado facturas contables. Aparecerán aquí al completar alquileres.</p>
                </div>
              ` : requestsList.filter(r => r.status === 'COMPLETED' || r.status === 'IN_PROGRESS').map(r => `
                <div class="px-4 py-3 flex items-center justify-between hover:bg-zinc-50/70 transition-colors">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                      ${renderIcon('FileCheck', 'w-4 h-4')}
                    </div>
                    <div>
                      <div class="font-medium text-zinc-900 text-xs font-mono">Factura #${r.rentalCode || r.id?.slice(0, 8)}</div>
                      <div class="text-[11px] text-zinc-500">${formatDate(r.startDate)} • Cliente: ${clientsMap.get(r.clientId)?.fullName || 'Constructora'}</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <div class="text-right">
                      <div class="font-medium text-zinc-900 text-xs tabular-nums">${formatCurrency(r.totalAmount || 150000)}</div>
                      <span class="text-[10px] text-emerald-600 font-mono font-medium uppercase">EMITIDA</span>
                    </div>
                    <button class="btn-view-invoice border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-lg px-2.5 py-1 text-xs font-medium cursor-pointer shadow-2xs" data-id="${r.id}">
                      ${renderIcon('Eye', 'w-3 h-3 text-zinc-400')}
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
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

    // Search input
    tabContainer.querySelector('#inv-search-input')?.addEventListener('input', (e) => {
      inventorySearch = e.target.value;
      const cursorPos = e.target.selectionStart;
      renderTabContent();
      const reInp = tabContainer.querySelector('#inv-search-input');
      if (reInp) {
        reInp.focus();
        try { reInp.setSelectionRange(cursorPos, cursorPos); } catch (_) {}
      }
    });

    // Category and status select filters
    tabContainer.querySelector('#inv-category-filter')?.addEventListener('change', (e) => {
      inventoryCategory = e.target.value;
      renderTabContent();
    });

    tabContainer.querySelector('#inv-status-filter')?.addEventListener('change', (e) => {
      inventoryStatus = e.target.value;
      renderTabContent();
    });

    // Requests Status Filter Buttons
    tabContainer.querySelectorAll('.btn-filter-status').forEach(b => {
      b.addEventListener('click', () => {
        requestsFilterStatus = b.dataset.status;
        renderTabContent();
      });
    });

    tabContainer.querySelector('#requests-search-input')?.addEventListener('input', (e) => {
      requestsSearch = e.target.value;
      renderTabContent();
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

    // Requests Row Click -> Overview Card
    tabContainer.querySelectorAll('.crm-request-row').forEach(row => {
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
          onPrimary = () => dispatchRental(req.id);
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
            { icon: 'Phone', label: 'Teléfono Contacto', value: client?.phone || '+57 300 123 4567' },
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
            ...(tool ? [
              { icon: 'Layers', label: 'Ver Ficha de la Maquinaria', action: () => { window.location.hash = `#/product/${tool.id}`; } }
            ] : []),
            { icon: 'Phone', label: 'Contactar Cliente Titular', action: () => {
              showToast(`Teléfono cliente: ${client?.phone || '+57 300 123 4567'}`, 'info');
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
        dispatchRental(btn.dataset.id);
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

    // Shipment tracker button
    tabContainer.querySelectorAll('.btn-shipment-tracker').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const req = requestsList.find(r => r.id === btn.dataset.id);
        if (req) openShipmentTrackerModal(req);
      });
    });

    // View invoice button
    tabContainer.querySelectorAll('.btn-view-invoice').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const req = requestsList.find(r => r.id === btn.dataset.id);
        if (req) openInvoiceForRental(req);
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
    if (selectAllRequests) {
      selectAllRequests.addEventListener('change', (e) => {
        tabContainer.querySelectorAll('.crm-row-checkbox').forEach(cb => {
          cb.checked = e.target.checked;
          cb.dispatchEvent(new Event('change', { bubbles: true }));
        });
      });
    }

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
      await api.patch(`/rentals/${reqId}/confirm`);
      const req = requestsList.find(r => r.id === reqId);
      if (req) req.status = 'CONFIRMED';
      notificationsStore.add({
        category: 'RENTAL',
        type: 'success',
        title: 'Solicitud Confirmada',
        message: `Alquiler #${reqId.slice(0, 8)} confirmado. Listo para entrega en obra.`,
        link: '#/provider'
      });
      updateKpis();
      renderTabContent();
      showToast('Solicitud de alquiler confirmada con éxito', 'success');
    } catch (err) {
      showToast(err.message || 'Error al confirmar la solicitud', 'error');
    }
  }

  async function rejectRentalRequest(reqId) {
    if (!confirm('¿Deseas rechazar esta solicitud de alquiler?')) return;
    try {
      await api.patch(`/rentals/${reqId}/cancel`);
      const req = requestsList.find(r => r.id === reqId);
      if (req) req.status = 'CANCELLED';
      updateKpis();
      renderTabContent();
      showToast('Solicitud rechazada', 'info');
    } catch (err) {
      showToast(err.message || 'Error al rechazar solicitud', 'error');
    }
  }

  async function dispatchRental(reqId) {
    try {
      await api.patch(`/rentals/${reqId}/start`);
      const req = requestsList.find(r => r.id === reqId);
      if (req) req.status = 'IN_PROGRESS';
      updateKpis();
      renderTabContent();
      showToast('Entrega física registrada. Estado: En curso', 'success');
    } catch (err) {
      showToast(err.message || 'Error al registrar entrega', 'error');
    }
  }

  function openInvoiceForRental(req) {
    const client = clientsList.find(c => c.id === req?.clientId);
    const firstItem = req?.items?.[0];
    const tool = firstItem ? toolsList.find(t => t.id === firstItem.toolId) : null;
    const totalAmount = req?.totalAmount || 180000;
    const subtotal = Math.round(totalAmount / 1.19);
    const tax = totalAmount - subtotal;

    openInvoiceViewer({
      invoiceNumber: req?.rentalCode || `TR-INV-${req?.id?.slice(0, 6) || '1001'}`,
      issueDate: formatDate(req?.startDate || '2026-10-15'),
      client: {
        name: client?.fullName || 'Constructora Gómez & Asoc.',
        taxId: client?.documentNumber ? `${client.documentType || 'CC'} ${client.documentNumber}` : 'CC 1018234567',
        address: [client?.address, client?.city].filter(Boolean).join(', ') || 'Calle 134 # 19-45, Bogotá D.C.',
        email: client?.email || 'carlos.gomez@constructora.com',
        phone: client?.phone || '+57 300 123 4567'
      },
      provider: {
        name: providerProfile?.companyName || 'Maquinaria y Equipos Bogotá S.A.S.',
        taxId: providerProfile?.taxId || '900123456-1',
        address: providerProfile?.address || 'Av. Boyacá # 68-45, Bogotá D.C.',
        email: user?.email || 'contacto@maquinariabogota.com',
        phone: providerProfile?.phone || '+57 310 111 2233'
      },
      tool: {
        name: tool?.name || 'Maquinaria en Alquiler',
        sku: tool?.serialNumber || 'SKU-2026'
      },
      rentalPeriod: {
        startDate: formatDate(req?.startDate || '2026-10-15'),
        endDate: formatDate(req?.endDate || '2026-10-18'),
        days: req?.totalDays || 3
      },
      dailyRate: firstItem?.dailyPrice || Math.round(subtotal / (req?.totalDays || 1)),
      subtotal: subtotal,
      tax: tax,
      total: totalAmount,
      paymentMethod: 'Transferencia electrónica bancaria',
      bank: 'Bancolombia S.A.',
      reference: req?.rentalCode || 'TR-REF-001',
      paymentDate: formatDate(req?.startDate || '2026-10-15')
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
    content.className = 'space-y-4 text-xs animate-scale-in';

    content.innerHTML = `
      <div class="space-y-4">
        <!-- Preview -->
        <div class="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 flex items-center gap-3">
          <img src="${toolImg}" class="w-11 h-11 rounded-lg object-contain bg-white border border-zinc-200 p-1 flex-shrink-0" />
          <div class="min-w-0">
            <h4 class="font-medium text-zinc-900 text-xs truncate">${tool?.name || 'Equipo en devolución'}</h4>
            <span class="text-[11px] text-zinc-400">${tool?.category?.name || 'Maquinaria'} • Serie: ${tool?.serialNumber || 'N/A'}</span>
          </div>
        </div>

        <div>
          <label class="block font-medium text-zinc-700 uppercase tracking-[0.06em] text-[10px] mb-2">Estado Físico en Devolución</label>
          <div class="grid grid-cols-2 gap-2.5">
            <label class="flex items-center gap-2 p-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 cursor-pointer">
              <input type="radio" name="insp-status" value="GOOD" checked class="text-orange-600 focus:ring-0" />
              <span class="font-medium text-zinc-800 text-xs">Conforme / Sin Daños</span>
            </label>
            <label class="flex items-center gap-2 p-2.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 cursor-pointer">
              <input type="radio" name="insp-status" value="DAMAGED" class="text-orange-600 focus:ring-0" />
              <span class="font-medium text-amber-700 text-xs">Con Averías / Daños</span>
            </label>
          </div>
        </div>

        <div>
          <label class="block font-medium text-zinc-700 mb-1">Notas de la inspección técnica</label>
          <textarea id="insp-notes" class="input-field h-20 text-xs" placeholder="Detalles de horas de uso, limpieza o desgaste..."></textarea>
        </div>

        <div id="damage-box" class="hidden p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-3">
          <span class="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
            ${renderIcon('AlertTriangle', 'w-3.5 h-3.5')} Reporte Técnico de Avería
          </span>
          <div>
            <label class="block text-[11px] font-medium text-zinc-700 mb-1">Descripción del daño</label>
            <input type="text" id="dmg-desc" class="input-field text-xs" placeholder="Ej: Cable cortado, fisura en carcasa..." />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-medium text-zinc-700 mb-1">Costo Estimado Reparación ($ COP)</label>
              <input type="number" id="dmg-cost" class="input-field text-xs font-mono tabular-nums" value="75000" />
            </div>
            <div>
              <label class="block text-[11px] font-medium text-zinc-700 mb-1">Destino del Equipo</label>
              <select id="dmg-action" class="input-field text-xs">
                <option value="MAINTENANCE" selected>Enviar a Taller / Mantenimiento</option>
                <option value="RETIRED">Dar de baja definitiva</option>
              </select>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100">
          <button id="btn-cancel-insp" class="btn-secondary !py-2 !px-4 text-xs cursor-pointer">Cancelar</button>
          <button id="btn-submit-insp" class="btn-primary !py-2 !px-5 text-xs font-medium cursor-pointer">Completar e Inspeccionar</button>
        </div>
      </div>
    `;

    const radioDamaged = content.querySelector('input[value="DAMAGED"]');
    const radioGood = content.querySelector('input[value="GOOD"]');
    const dmgBox = content.querySelector('#damage-box');

    radioDamaged.addEventListener('change', () => dmgBox.classList.remove('hidden'));
    radioGood.addEventListener('change', () => dmgBox.classList.add('hidden'));

    content.querySelector('#btn-cancel-insp').addEventListener('click', () => modal.close());

    content.querySelector('#btn-submit-insp').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.innerHTML = `<span class="inline-flex items-center gap-1.5">${renderIcon('Loader2', 'w-3.5 h-3.5 animate-spin')} Procesando...</span>`;

      try {
        await api.patch(`/rentals/${req.id}/complete`);
        const isDamaged = content.querySelector('input[name="insp-status"]:checked')?.value === 'DAMAGED';
        req.status = 'COMPLETED';
        if (tool) {
          tool.status = isDamaged ? 'MAINTENANCE' : 'AVAILABLE';
        }
        showToast('Devolución e inspección registradas exitosamente', 'success');
        modal.close();
        updateKpis();
        renderTabContent();
      } catch (err) {
        btn.disabled = false;
        btn.innerHTML = 'Completar e Inspeccionar';
        showToast(err.message || 'Error al completar la devolución', 'error');
      }
    });

    modal.open({
      title: `${renderIcon('ClipboardCheck', 'w-4 h-4 text-orange-600')} Acta de Devolución e Inspección`,
      content: content,
      maxWidth: 'max-w-md'
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
                ${isPending ? '1' : renderIcon('Check', 'w-3.5 h-3.5')}
              </div>
              <div class="min-w-0 pt-0.5">
                <span class="font-semibold text-zinc-900 text-xs block">1. Solicitud y Validación de Reserva</span>
                <p class="text-[11px] text-zinc-500">El cliente emitió la orden de alquiler en plataforma.</p>
              </div>
            </div>

            <!-- Step 2: CONFIRMED -->
            <div class="flex items-start gap-3 relative">
              <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isConfirmed ? 'bg-blue-600 text-white shadow-xs' : (isInProgress || isCompleted ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-400 border border-zinc-200')}">
                ${isInProgress || isCompleted ? renderIcon('Check', 'w-3.5 h-3.5') : '2'}
              </div>
              <div class="min-w-0 pt-0.5">
                <span class="font-semibold text-zinc-900 text-xs block">2. Preparación y Despacho en Bodega</span>
                <p class="text-[11px] text-zinc-500">Equipo verificado, alistado y listo para transporte o salida hacia la obra.</p>
              </div>
            </div>

            <!-- Step 3: IN_PROGRESS -->
            <div class="flex items-start gap-3 relative">
              <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isInProgress ? 'bg-emerald-600 text-white shadow-xs animate-pulse' : (isCompleted ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-400 border border-zinc-200')}">
                ${isCompleted ? renderIcon('Check', 'w-3.5 h-3.5') : '3'}
              </div>
              <div class="min-w-0 pt-0.5">
                <span class="font-semibold text-zinc-900 text-xs block">3. Entrega en Obra y Faena Activa</span>
                <p class="text-[11px] text-zinc-500">Maquinaria entregada al cliente y operando durante la vigencia del contrato.</p>
              </div>
            </div>

            <!-- Step 4: COMPLETED -->
            <div class="flex items-start gap-3 relative">
              <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isCompleted ? 'bg-emerald-600 text-white shadow-xs' : 'bg-zinc-100 text-zinc-400 border border-zinc-200'}">
                ${isCompleted ? renderIcon('Check', 'w-3.5 h-3.5') : '4'}
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
            <span class="text-zinc-500">Destino de entrega:</span>
            <span class="font-medium text-zinc-900">${client?.address || 'Obra Principal / Faena Centro'}, ${client?.city || 'Bogotá D.C.'}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-zinc-500">Contacto en obra:</span>
            <span class="font-medium text-zinc-900">${client?.fullName || 'Carlos Gómez'} (${client?.phone || '+57 300 123 4567'})</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-zinc-500">Vigencia contractual:</span>
            <span class="font-medium text-zinc-900">${formatDate(req.startDate)} → ${formatDate(req.endDate)}</span>
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
                ${renderIcon('Truck', 'w-3.5 h-3.5')} Despachar y Registrar Entrega en Obra
              </button>
            ` : isInProgress ? `
              <button id="btn-tracker-advance" class="bg-amber-600 hover:bg-amber-500 text-white rounded-xl px-5 py-2 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer">
                ${renderIcon('ClipboardCheck', 'w-3.5 h-3.5')} Registrar Retorno e Inspeccionar
              </button>
            ` : `
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
          await dispatchRental(req.id);
          modal.close();
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
            <input type="number" id="tf-daily-price" required min="1000" step="1000" class="input-field text-xs font-medium text-zinc-900 tabular-nums font-mono" value="${initial.dailyPrice || 85000}" />
          </div>
          <div>
            <label class="block font-medium text-zinc-800 mb-1">Valor Reposición ($ COP) *</label>
            <input type="number" id="tf-replacement" required min="10000" step="10000" class="input-field text-xs font-medium text-zinc-700 tabular-nums font-mono" value="${initial.replacementValue || 3000000}" />
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
      estDep.textContent = formatCurrency(p * 35);
      if (!replInput.value || replInput.value === '3000000') {
        replInput.value = p * 35;
      }
    };
    priceInput.addEventListener('input', updatePriceCalculations);
    updatePriceCalculations();

    content.querySelector('#btn-cancel-tool').addEventListener('click', () => modal.close());

    if (isEdit) {
      content.querySelector('#btn-duplicate-unit')?.addEventListener('click', async () => {
        const dupBtn = content.querySelector('#btn-duplicate-unit');
        dupBtn.disabled = true;
        dupBtn.innerHTML = `<span class="inline-flex items-center gap-1">${renderIcon('Loader2', 'w-3 h-3 animate-spin')} Creando...</span>`;

        const currentToolsOfModel = toolsList.filter(t => t.name === existingTool.name || (t.brand === existingTool.brand && t.model === existingTool.model));
        const nextUnitNum = currentToolsOfModel.length + 1;
        const baseSn = existingTool.serialNumber || `SN-${Date.now().toString().slice(-6)}`;
        const nextSn = baseSn.includes('-U') ? baseSn.replace(/-U\d+$/, `-U${nextUnitNum}`) : `${baseSn}-U${nextUnitNum}`;

        const duplicatePayload = {
          providerId: providerId || 'd0000000-0000-0000-0000-000000000001',
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

      // Validation 3: Pricing integrity
      if (isNaN(dailyPrice) || dailyPrice < 1000) {
        showToast('La tarifa diaria debe ser de al menos $1.000 COP.', 'warning');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        content.querySelector('#tf-daily-price')?.focus();
        return;
      }

      if (isNaN(replacementValue) || replacementValue < dailyPrice) {
        showToast('El valor de reposición debe ser mayor o igual a la tarifa diaria.', 'warning');
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
        providerId: providerId || 'd0000000-0000-0000-0000-000000000001',
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
