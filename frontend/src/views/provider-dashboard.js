import api from '../api/client.js';
import auth from '../auth/state.js';
import showToast from '../components/toast.js';
import modal from '../components/modal.js';
import { formatCurrency, formatDate, getRentalStatusBadge, getToolStatusBadge } from '../utils/formatters.js';
import { renderIcon } from '../utils/icons.js';
import { openInvoiceViewer } from './rental-modal.js';
import { openAuthModal } from '../components/auth-modal.js';
import { notificationsStore } from '../utils/notifications-store.js';

export async function renderProviderDashboard() {
  const container = document.getElementById('app-content');
  if (!container) return;

  // 1. Guard: Check if user is authenticated
  if (!auth.isAuthenticated()) {
    container.innerHTML = `
      <section class="max-w-4xl mx-auto px-4 py-20 text-center">
        <div class="bg-white rounded-2xl border border-slate-200/80 p-10 max-w-lg mx-auto shadow-sm space-y-4">
          <div class="w-14 h-14 rounded-full bg-orange-50 text-[#ea580c] border border-orange-200 flex items-center justify-center mx-auto">
            ${renderIcon('Lock', 'w-7 h-7')}
          </div>
          <h2 class="text-xl font-bold text-slate-900 font-display">Portal para Proveedores de Maquinaria</h2>
          <p class="text-xs text-slate-500">Inicia sesión con tu cuenta comercial para gestionar tu catálogo de herramientas, tarifas diarias y solicitudes de alquiler en tiempo real.</p>
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

  // 2. Guard: Check role (must be PROVEEDOR or ADMIN)
  const user = auth.getUser();
  const isAdmin = auth.isAdmin();
  let isProvider = auth.isProvider();

  // If user doesn't appear as provider locally, check backend /users/me in case role was updated
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
      <section class="max-w-4xl mx-auto px-4 py-20 text-center">
        <div class="bg-white rounded-2xl border border-slate-200/80 p-10 max-w-lg mx-auto shadow-sm space-y-4">
          <div class="w-14 h-14 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto">
            ${renderIcon('Truck', 'w-7 h-7')}
          </div>
          <h2 class="text-xl font-bold text-slate-900 font-display">Portal Exclusivo para Proveedores</h2>
          <p class="text-xs text-slate-500">Tu cuenta actual (<strong>${user?.username || 'usuario'}</strong>) tiene perfil de <strong>Cliente</strong>. Esta sección es para empresas arrendadoras que ofrecen maquinaria y herramientas en alquiler.</p>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <a href="#/client" class="btn-secondary !py-2.5 !px-6 text-xs font-semibold">
              Ir a Mis Alquileres
            </a>
            <button id="btn-switch-provider-account" class="btn-primary !py-2.5 !px-6 text-xs font-semibold flex items-center gap-2 shadow-sm cursor-pointer">
              ${renderIcon('LogIn', 'w-4 h-4')} Iniciar Sesión con otra cuenta
            </button>
          </div>
        </div>
      </section>
    `;
    container.querySelector('#btn-switch-provider-account')?.addEventListener('click', () => openAuthModal('login'));
    return;
  }

  // 3. Resolve Provider Profile ID
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

  // Local state for tabs and filtering
  let activeTab = 'inventory'; // 'inventory' | 'requests'
  let inventorySearch = '';
  let inventoryCategory = 'ALL';
  let inventoryStatus = 'ALL';

  let requestsSearch = '';
  let requestsStatus = 'ALL';

  let toolsList = [];
  let requestsList = [];
  let categoriesList = [];
  let clientsList = [];

  // Show loading indicator
  container.innerHTML = `
    <div class="min-h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-3">
      ${renderIcon('Loader2', 'w-8 h-8 animate-spin text-[#FF5A1F]')}
      <span class="text-xs font-medium">Cargando panel de gestión de alquileres...</span>
    </div>
  `;

  // Fetch real data from backend
  try {
    const promises = [
      providerId ? api.get('/tools', { providerId }) : api.get('/tools'),
      providerId ? api.get(`/rentals/provider/${providerId}`).catch(() => []) : (isAdmin ? api.get('/rentals').catch(() => []) : Promise.resolve([])),
      api.get('/tools/categories').catch(() => []),
      api.get('/clients').catch(() => [])
    ];

    const [fetchedTools, fetchedRequests, fetchedCats, fetchedClients] = await Promise.all(promises);

    toolsList = Array.isArray(fetchedTools) ? fetchedTools : [];
    requestsList = Array.isArray(fetchedRequests) ? fetchedRequests : [];
    categoriesList = Array.isArray(fetchedCats) ? fetchedCats : [];
    clientsList = Array.isArray(fetchedClients) ? fetchedClients : [];
  } catch (err) {
    console.warn('Error loading provider dashboard data', err);
  }

  const clientsMap = new Map(clientsList.map(c => [c.id, c]));
  const toolsMap = new Map(toolsList.map(t => [t.id, t]));

  function render() {
    // Calculate KPIs
    const totalTools = toolsList.length;
    const availableTools = toolsList.filter(t => t.status === 'AVAILABLE').length;
    const rentedTools = toolsList.filter(t => t.status === 'RENTED').length;
    const maintenanceTools = toolsList.filter(t => t.status === 'MAINTENANCE').length;
    const pendingRequests = requestsList.filter(r => r.status === 'PENDING').length;
    const activeClientsCount = new Set(
      requestsList
        .filter(r => r.status === 'ACTIVE' || r.status === 'IN_PROGRESS' || r.status === 'CONFIRMED' || r.status === 'RENTED')
        .map(r => r.clientId)
    ).size;

    // Filter tools for inventory tab
    const filteredTools = toolsList.filter(t => {
      const catName = t.category?.name || t.categoryName || '';
      const catId = t.category?.id || t.categoryId || '';
      const matchSearch = !inventorySearch || 
        t.name?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        (t.brand && t.brand.toLowerCase().includes(inventorySearch.toLowerCase())) ||
        catName.toLowerCase().includes(inventorySearch.toLowerCase());
      const matchCat = inventoryCategory === 'ALL' || catId === inventoryCategory || catName === inventoryCategory;
      const matchStatus = inventoryStatus === 'ALL' || t.status === inventoryStatus;
      return matchSearch && matchCat && matchStatus;
    });

    // Filter requests for requests tab
    const filteredRequests = requestsList.filter(r => {
      const client = clientsMap.get(r.clientId);
      const clientName = client?.fullName || r.client?.name || '';
      const clientEmail = client?.email || r.client?.email || '';
      const rentalCode = r.rentalCode || r.id?.toString() || '';

      const matchSearch = !requestsSearch ||
        clientName.toLowerCase().includes(requestsSearch.toLowerCase()) ||
        clientEmail.toLowerCase().includes(requestsSearch.toLowerCase()) ||
        rentalCode.toLowerCase().includes(requestsSearch.toLowerCase());
      const matchStatus = requestsStatus === 'ALL' || r.status === requestsStatus;
      return matchSearch && matchStatus;
    });

    container.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        <!-- Top Header & Actions -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 text-[#ea580c] text-xs font-bold mb-2 border border-orange-200">
              ${renderIcon('Building2', 'w-3.5 h-3.5')} ${providerProfile?.companyName || user?.username || 'Proveedor'}
            </div>
            <h1 class="text-2xl sm:text-3xl font-black text-slate-900 font-display">Gestión de Alquileres</h1>
            <p class="text-xs sm:text-sm text-slate-500 mt-1">Supervisa tu catálogo de maquinaria, disponibilidad y confirma solicitudes de clientes.</p>
          </div>

          <div class="flex items-center gap-3">
            <button id="btn-open-new-tool-drawer" class="btn-primary !py-2.5 !px-4 text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer">
              ${renderIcon('Plus', 'w-4 h-4')}
              <span>Nueva herramienta</span>
            </button>
          </div>
        </div>

        <!-- 4 Top KPI Cards matching 'img/ToolRent Rental Management Dashboard.png' -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="provider-kpis-grid">
          
          <!-- Card 1: Disponibles -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-500">Herramientas disponibles</span>
              <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                ${renderIcon('CheckCircle2', 'w-4 h-4')}
              </div>
            </div>
            <div class="text-3xl font-black text-slate-900 font-display">${availableTools}</div>
            <div class="text-[11px] text-slate-500">
              de ${totalTools} registradas (<span class="text-emerald-600 font-bold">${totalTools > 0 ? Math.round((availableTools / totalTools) * 100) : 0}%</span>)
            </div>
          </div>

          <!-- Card 2: Alquiladas -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-500">Alquiladas</span>
              <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                ${renderIcon('Calendar', 'w-4 h-4')}
              </div>
            </div>
            <div class="text-3xl font-black text-slate-900 font-display">${rentedTools}</div>
            <div class="text-[11px] text-slate-500">
              en <span class="text-blue-600 font-semibold">${activeClientsCount}</span> clientes activos
            </div>
          </div>

          <!-- Card 3: En mantenimiento -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-500">En mantenimiento</span>
              <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                ${renderIcon('Wrench', 'w-4 h-4')}
              </div>
            </div>
            <div class="text-3xl font-black text-slate-900 font-display">${maintenanceTools}</div>
            <div class="text-[11px] text-amber-700 font-medium">
              revisión programada
            </div>
          </div>

          <!-- Card 4: Solicitudes pendientes -->
          <div class="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-semibold text-slate-500">Solicitudes pendientes</span>
              <div class="w-8 h-8 rounded-lg bg-orange-50 text-[#ea580c] flex items-center justify-center relative">
                ${renderIcon('Clock', 'w-4 h-4')}
                ${pendingRequests > 0 ? '<span class="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#ea580c] ring-2 ring-white"></span>' : ''}
              </div>
            </div>
            <div class="text-3xl font-black text-slate-900 font-display">${pendingRequests}</div>
            <div class="text-[11px] text-[#ea580c] font-semibold">
              por confirmar hoy
            </div>
          </div>

        </div>

        <!-- Navigation Tabs: Inventario vs Solicitudes -->
        <div class="border-b border-slate-200">
          <nav class="flex space-x-8" aria-label="Tabs">
            <button 
              id="tab-btn-inventory" 
              class="py-3 px-1 border-b-2 font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer ${activeTab === 'inventory' ? 'border-[#ea580c] text-[#ea580c]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}"
            >
              ${renderIcon('Package', 'w-4 h-4')}
              <span>Inventario</span>
              <span class="px-2 py-0.5 rounded-full text-xs font-semibold ${activeTab === 'inventory' ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-600'}">
                ${toolsList.length}
              </span>
            </button>

            <button 
              id="tab-btn-requests" 
              class="py-3 px-1 border-b-2 font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer ${activeTab === 'requests' ? 'border-[#ea580c] text-[#ea580c]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}"
            >
              ${renderIcon('FileText', 'w-4 h-4')}
              <span>Solicitudes</span>
              <span class="px-2 py-0.5 rounded-full text-xs font-semibold ${pendingRequests > 0 ? 'bg-[#FF5A1F] text-white' : 'bg-slate-100 text-slate-600'}">
                ${requestsList.length}
              </span>
            </button>
          </nav>
        </div>

        <!-- TAB CONTENT: INVENTARIO -->
        ${activeTab === 'inventory' ? `
          <div class="space-y-6">
            
            <!-- Filters Bar with Category & Status selection -->
            <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div class="relative flex-1 max-w-lg">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  ${renderIcon('Search', 'w-4 h-4')}
                </span>
                <input 
                  type="text" 
                  id="inv-search-input" 
                  value="${inventorySearch}" 
                  placeholder="Buscar herramienta por nombre, marca o modelo..." 
                  class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#FF5A1F] focus:ring-2 focus:ring-[#FF5A1F]/15 transition-all shadow-2xs" 
                />
              </div>

              <div class="flex flex-wrap items-center gap-3">
                <select id="inv-category-filter" class="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#FF5A1F] cursor-pointer shadow-2xs">
                  <option value="ALL" ${inventoryCategory === 'ALL' ? 'selected' : ''}>Todas las categorías</option>
                  ${categoriesList.map(c => `
                    <option value="${c.id}" ${inventoryCategory === c.id ? 'selected' : ''}>${c.name}</option>
                  `).join('')}
                </select>

                <select id="inv-status-filter" class="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#FF5A1F] cursor-pointer shadow-2xs">
                  <option value="ALL" ${inventoryStatus === 'ALL' ? 'selected' : ''}>Todos los estados</option>
                  <option value="AVAILABLE" ${inventoryStatus === 'AVAILABLE' ? 'selected' : ''}>Disponible</option>
                  <option value="RENTED" ${inventoryStatus === 'RENTED' ? 'selected' : ''}>Alquilada</option>
                  <option value="MAINTENANCE" ${inventoryStatus === 'MAINTENANCE' ? 'selected' : ''}>En mantenimiento</option>
                </select>
              </div>
            </div>

            <!-- Inventory Table: Generous Spacing, Clean Typography & Simplified Actions -->
            <div class="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead class="text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200/90 bg-slate-50/60">
                    <tr>
                      <th class="py-3.5 px-6 w-12 text-center">
                        <input type="checkbox" class="rounded text-[#FF5A1F] focus:ring-0 cursor-pointer" />
                      </th>
                      <th class="py-3.5 px-6 min-w-[320px]">Herramienta</th>
                      <th class="py-3.5 px-6 whitespace-nowrap">Tarifa Diaria</th>
                      <th class="py-3.5 px-6 whitespace-nowrap">Estado</th>
                      <th class="py-3.5 px-6 whitespace-nowrap">Código / Serie</th>
                      <th class="py-3.5 px-6 text-right whitespace-nowrap w-36">Acciones</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    ${filteredTools.length > 0 ? filteredTools.map(tool => {
                      const isAvail = tool.status === 'AVAILABLE';
                      const isRent = tool.status === 'RENTED';
                      const isMaint = tool.status === 'MAINTENANCE';
                      const img = tool.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=100';
                      const catName = tool.category?.name || tool.categoryName || 'Construcción';
                      const sku = tool.serialNumber || (tool.id ? `SKU-${tool.id.toString().slice(0, 8).toUpperCase()}` : 'SKU-0000');

                      return `
                        <tr class="hover:bg-slate-50/70 transition-colors group">
                          <td class="py-4 px-6 text-center">
                            <input type="checkbox" class="rounded text-[#FF5A1F] focus:ring-0 cursor-pointer" />
                          </td>
                          <td class="py-4 px-6">
                            <div class="flex items-center gap-3.5">
                              <img 
                                src="${img}" 
                                class="w-12 h-12 rounded-xl object-contain bg-slate-50/80 border border-slate-200/80 p-1.5 flex-shrink-0 shadow-2xs" 
                                onerror="window.ToolRentCacheShield?.handleImageError(this, '${img}', '${catName}', '${tool.name?.replace(/'/g, "\\'")}')" 
                              />
                              <div class="min-w-0">
                                <a href="#/product/${tool.id}" class="font-bold text-sm text-slate-900 group-hover:text-[#FF5A1F] transition-colors leading-tight truncate block">
                                  ${tool.name}
                                </a>
                                <div class="text-[11px] text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                                  <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                                    ${catName}
                                  </span>
                                  ${tool.brand ? `<span class="text-slate-400 font-medium">${tool.brand}</span>` : ''}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td class="py-4 px-6 whitespace-nowrap font-bold text-sm text-slate-900 font-display">
                            ${formatCurrency(tool.dailyPrice)} <span class="text-[11px] text-slate-400 font-normal">/ día</span>
                          </td>
                          <td class="py-4 px-6 whitespace-nowrap">
                            ${isAvail ? `
                              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Disponible
                              </span>
                            ` : isRent ? `
                              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Alquilada
                              </span>
                            ` : `
                              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> En mantenimiento
                              </span>
                            `}
                          </td>
                          <td class="py-4 px-6 whitespace-nowrap text-slate-600">
                            <span class="font-mono text-xs text-slate-500 font-semibold bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                              ${sku}
                            </span>
                          </td>
                          <td class="py-4 px-6 text-right whitespace-nowrap">
                            <div class="inline-flex items-center justify-end gap-1.5">
                              <button 
                                class="btn-edit-tool inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:text-[#FF5A1F] hover:border-orange-200 text-xs font-semibold text-slate-700 transition-all shadow-2xs cursor-pointer" 
                                data-id="${tool.id}"
                                title="Editar especificaciones y precio"
                              >
                                ${renderIcon('Edit3', 'w-3.5 h-3.5 text-slate-400')}
                                <span>Editar</span>
                              </button>
                              <button 
                                class="btn-toggle-maint p-1.5 rounded-lg ${isMaint ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200' : 'text-slate-400 hover:text-amber-600 hover:bg-slate-100'} transition-colors cursor-pointer" 
                                data-id="${tool.id}"
                                title="${isMaint ? 'Habilitar herramienta para alquiler' : 'Marcar en mantenimiento'}"
                              >
                                ${renderIcon(isMaint ? 'CheckCircle2' : 'Wrench', 'w-4 h-4')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      `;
                    }).join('') : `
                      <tr>
                        <td colspan="6" class="py-12 text-center text-slate-400">
                          <div class="flex flex-col items-center justify-center gap-2">
                            ${renderIcon('PackageX', 'w-8 h-8 text-slate-300')}
                            <p class="font-bold text-slate-700 text-sm">No se encontraron herramientas</p>
                            <p class="text-xs text-slate-400">No hay equipos registrados que coincidan con los filtros seleccionados.</p>
                          </div>
                        </td>
                      </tr>
                    `}
                  </tbody>
                </table>
              </div>

              <!-- Pagination & Counter Footer -->
              <div class="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-white">
                <span>Mostrando <strong class="text-slate-800 font-semibold">${filteredTools.length}</strong> de ${toolsList.length} herramientas</span>
                <div class="flex items-center gap-1">
                  <span class="px-3 py-1.5 rounded-lg bg-[#FF5A1F] text-white font-bold text-xs shadow-xs">1</span>
                </div>
              </div>
            </div>

          </div>
        ` : `
          <!-- TAB CONTENT: SOLICITUDES -->
          <div class="space-y-6">

            <!-- Filters Row: PROPERLY CLOSED CONTAINER -->
            <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div class="flex flex-wrap items-center gap-3">
                <select id="requests-status-filter" class="px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#FF5A1F] cursor-pointer shadow-2xs">
                  <option value="ALL" ${requestsStatus === 'ALL' ? 'selected' : ''}>Todos los estados</option>
                  <option value="PENDING" ${requestsStatus === 'PENDING' ? 'selected' : ''}>Pendientes</option>
                  <option value="CONFIRMED" ${requestsStatus === 'CONFIRMED' ? 'selected' : ''}>Confirmadas</option>
                  <option value="IN_PROGRESS" ${requestsStatus === 'IN_PROGRESS' ? 'selected' : ''}>En curso</option>
                  <option value="COMPLETED" ${requestsStatus === 'COMPLETED' ? 'selected' : ''}>Completadas</option>
                </select>

                <div class="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 font-medium">
                  ${renderIcon('Calendar', 'w-3.5 h-3.5 text-slate-500')}
                  <span>Historial activo</span>
                </div>
              </div>

              <div class="relative w-full md:w-80">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  ${renderIcon('Search', 'w-3.5 h-3.5')}
                </span>
                <input 
                  type="text" 
                  id="requests-search" 
                  value="${requestsSearch}" 
                  placeholder="Buscar por cliente, código o teléfono..." 
                  class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#FF5A1F] focus:ring-2 focus:ring-[#FF5A1F]/15 transition-all" 
                />
              </div>
            </div>

            <!-- Requests Table Section: SIBLING OF THE FILTERS ROW -->
            <div class="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs" id="requests-table">
                  <thead class="text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200/90 bg-slate-50/60">
                    <tr>
                      <th class="py-3.5 px-6 w-12 text-center">#</th>
                      <th class="py-3.5 px-6">Cliente</th>
                      <th class="py-3.5 px-6 min-w-[200px]">Equipos Alquilados</th>
                      <th class="py-3.5 px-6 whitespace-nowrap">Vigencia</th>
                      <th class="py-3.5 px-6 whitespace-nowrap">Total</th>
                      <th class="py-3.5 px-6 whitespace-nowrap">Estado</th>
                      <th class="py-3.5 px-6 text-right whitespace-nowrap">Acciones</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100" id="requests-tbody">
                    ${filteredRequests.length > 0 ? filteredRequests.map((req, idx) => {
                      const isPending = req.status === 'PENDING';
                      const isConfirmed = req.status === 'CONFIRMED';
                      const isInProgress = req.status === 'IN_PROGRESS';
                      const isCompleted = req.status === 'COMPLETED';

                      const client = clientsMap.get(req.clientId);
                      const clientName = client?.fullName || 'Constructora Cliente';
                      const clientContact = client?.phone || client?.email || 'cliente@toolrent.co';

                      const firstItem = req.items?.[0];
                      const tool = firstItem ? toolsMap.get(firstItem.toolId) : null;
                      const toolName = tool?.name || 'Equipo de Construcción';
                      const toolCat = tool?.category?.name || 'Herramientas';
                      const toolImg = tool?.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=100';

                      const datesLabel = req.startDate && req.endDate ? `${formatDate(req.startDate)} - ${formatDate(req.endDate)}` : 'Fecha acordada';
                      const daysCount = req.totalDays || 1;
                      const totalFormatted = formatCurrency(req.totalAmount || (req.subtotal ? req.subtotal + (req.deposit || 0) : 0));

                      return `
                        <tr class="hover:bg-slate-50/70 transition-colors">
                          <td class="py-4 px-6 text-center font-mono text-slate-400 font-semibold">${idx + 1}</td>
                          <td class="py-4 px-6">
                            <div class="font-bold text-slate-900">${clientName}</div>
                            <div class="text-[11px] text-slate-500 mt-0.5">${clientContact}</div>
                          </td>
                          <td class="py-4 px-6">
                            <div class="flex items-center gap-3">
                              <img src="${toolImg}" class="w-10 h-10 rounded-xl object-contain bg-slate-50 border border-slate-200/80 p-1 flex-shrink-0" />
                              <div>
                                <div class="font-bold text-slate-900">${toolName}</div>
                                <div class="text-[11px] text-slate-400 mt-0.5">${toolCat} ${req.items?.length > 1 ? `(+${req.items.length - 1} más)` : ''}</div>
                              </div>
                            </div>
                          </td>
                          <td class="py-4 px-6 whitespace-nowrap text-slate-600">
                            <div class="font-medium text-slate-800">${datesLabel}</div>
                            <div class="text-[11px] text-slate-400 mt-0.5">${daysCount} día${daysCount === 1 ? '' : 's'}</div>
                          </td>
                          <td class="py-4 px-6 whitespace-nowrap font-bold text-sm text-slate-900 font-display">
                            ${totalFormatted}
                          </td>
                          <td class="py-4 px-6 whitespace-nowrap">
                            ${getRentalStatusBadge(req.status)}
                          </td>
                          <td class="py-4 px-6 text-right whitespace-nowrap space-x-1.5">
                            ${isPending ? `
                              <button class="btn-confirm-action px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FF5A1F] hover:bg-[#e04e18] text-white shadow-xs cursor-pointer" data-id="${req.id}">
                                Confirmar
                              </button>
                              <button class="btn-reject-action px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer" data-id="${req.id}">
                                Rechazar
                              </button>
                            ` : ''}

                            ${isConfirmed ? `
                              <button class="btn-dispatch-action px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FF5A1F] hover:bg-[#e04e18] text-white shadow-xs cursor-pointer" data-id="${req.id}">
                                Registrar entrega
                              </button>
                            ` : ''}

                            ${isInProgress ? `
                              <button class="btn-return-action px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#FF5A1F] hover:bg-[#e04e18] text-white shadow-xs cursor-pointer" data-id="${req.id}">
                                Registrar devolución
                              </button>
                            ` : ''}

                            ${isCompleted ? `
                              <button class="btn-view-invoice inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs cursor-pointer" data-id="${req.id}">
                                ${renderIcon('FileText', 'w-3.5 h-3.5 text-slate-400')} Ver factura
                              </button>
                            ` : ''}
                          </td>
                        </tr>
                      `;
                    }).join('') : `
                      <tr>
                        <td colspan="7" class="py-12 text-center text-slate-400">
                          <div class="flex flex-col items-center justify-center gap-2">
                            ${renderIcon('Inbox', 'w-8 h-8 text-slate-300')}
                            <p class="font-bold text-slate-700 text-sm">No tienes solicitudes pendientes</p>
                            <p class="text-xs text-slate-400">Cuando los clientes reserven tus herramientas, aparecerán aquí para tu confirmación y despacho.</p>
                          </div>
                        </td>
                      </tr>
                    `}
                  </tbody>
                </table>
              </div>

              <div class="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-white">
                <span>Mostrando <strong class="text-slate-800 font-semibold">${filteredRequests.length}</strong> solicitudes</span>
                <div class="flex items-center gap-1">
                  <span class="px-3 py-1.5 rounded-lg bg-[#FF5A1F] text-white font-bold text-xs shadow-xs">1</span>
                </div>
              </div>
            </div>

          </div>
        `}

      </div>
    `;

    attachEventHandlers();
  }

  function attachEventHandlers() {
    // Tab switching
    container.querySelector('#tab-btn-inventory')?.addEventListener('click', () => {
      activeTab = 'inventory';
      render();
    });

    container.querySelector('#tab-btn-requests')?.addEventListener('click', () => {
      activeTab = 'requests';
      render();
    });

    // Top action: Nueva herramienta
    container.querySelector('#btn-open-new-tool-drawer')?.addEventListener('click', () => {
      openNewToolModal();
    });

    // Inventory search & filters
    container.querySelector('#inv-search-input')?.addEventListener('input', (e) => {
      inventorySearch = e.target.value;
      const cursorPos = e.target.selectionStart;
      render();
      const reInp = container.querySelector('#inv-search-input');
      if (reInp) {
        reInp.focus();
        try { reInp.setSelectionRange(cursorPos, cursorPos); } catch (_) {}
      }
    });

    container.querySelector('#inv-category-filter')?.addEventListener('change', (e) => {
      inventoryCategory = e.target.value;
      render();
    });

    container.querySelector('#inv-status-filter')?.addEventListener('change', (e) => {
      inventoryStatus = e.target.value;
      render();
    });

    // Inventory actions
    container.querySelectorAll('.btn-edit-tool').forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = toolsList.find(t => t.id.toString() === btn.dataset.id);
        openNewToolModal(tool);
      });
    });

    container.querySelectorAll('.btn-toggle-maint').forEach(btn => {
      btn.addEventListener('click', async () => {
        const tool = toolsList.find(t => t.id.toString() === btn.dataset.id);
        if (!tool) return;
        const newStatus = tool.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';
        tool.status = newStatus;
        showToast(`Estado de "${tool.name}" actualizado a ${newStatus === 'AVAILABLE' ? 'Disponible' : 'Mantenimiento'}`, 'success');
        render();
      });
    });

    // Requests search & filter
    container.querySelector('#requests-search')?.addEventListener('input', (e) => {
      requestsSearch = e.target.value;
      render();
    });

    container.querySelector('#requests-status-filter')?.addEventListener('change', (e) => {
      requestsStatus = e.target.value;
      render();
    });

    // Requests actions: Confirm
    container.querySelectorAll('.btn-confirm-action').forEach(b => {
      b.addEventListener('click', async () => {
        try {
          await api.patch(`/rentals/${b.dataset.id}/confirm`);
          const req = requestsList.find(r => r.id === b.dataset.id);
          if (req) req.status = 'CONFIRMED';
          notificationsStore.add({
            category: 'RENTAL',
            type: 'success',
            title: 'Solicitud Confirmada',
            message: `Has confirmado el alquiler #${b.dataset.id}. Equipo listo para despacho.`,
            link: '#/provider'
          });
          showToast('Solicitud confirmada exitosamente', 'success');
          render();
        } catch (err) {
          showToast(err.message || 'Error al confirmar la solicitud', 'error');
        }
      });
    });

    // Requests actions: Reject / Cancel
    container.querySelectorAll('.btn-reject-action').forEach(b => {
      b.addEventListener('click', async () => {
        if (!confirm('¿Deseas rechazar esta solicitud de alquiler?')) return;
        try {
          await api.patch(`/rentals/${b.dataset.id}/cancel`);
          const req = requestsList.find(r => r.id === b.dataset.id);
          if (req) req.status = 'CANCELLED';
          notificationsStore.add({
            category: 'RENTAL',
            type: 'warning',
            title: 'Solicitud Rechazada',
            message: `Se canceló la solicitud #${b.dataset.id}.`,
            link: '#/provider'
          });
          showToast('Solicitud rechazada', 'info');
          render();
        } catch (err) {
          showToast(err.message || 'Error al rechazar la solicitud', 'error');
        }
      });
    });

    // Requests actions: Dispatch
    container.querySelectorAll('.btn-dispatch-action').forEach(b => {
      b.addEventListener('click', async () => {
        try {
          await api.patch(`/rentals/${b.dataset.id}/start`);
          const req = requestsList.find(r => r.id === b.dataset.id);
          if (req) req.status = 'IN_PROGRESS';
          notificationsStore.add({
            category: 'ALERT',
            type: 'info',
            title: 'Entrega de Equipo Registrada',
            message: `El equipo del alquiler #${b.dataset.id} fue entregado al cliente. Estado: En curso.`,
            link: '#/provider'
          });
          showToast('Entrega registrada correctamente. Estado: En curso', 'success');
          render();
        } catch (err) {
          showToast(err.message || 'Error al registrar entrega', 'error');
        }
      });
    });

    // Requests actions: Return
    container.querySelectorAll('.btn-return-action').forEach(b => {
      b.addEventListener('click', () => {
        const req = requestsList.find(r => r.id === b.dataset.id);
        openReturnInspectionModal(req);
      });
    });

    // Requests actions: View Invoice
    container.querySelectorAll('.btn-view-invoice').forEach(b => {
      b.addEventListener('click', () => {
        const req = requestsList.find(r => r.id === b.dataset.id) || requestsList[0];
        const client = clientsMap.get(req.clientId);
        const firstItem = req.items?.[0];
        const tool = firstItem ? toolsMap.get(firstItem.toolId) : null;

        const totalAmount = req.totalAmount || 255000;
        const subtotal = Math.round(totalAmount / 1.19);
        const tax = totalAmount - subtotal;

        openInvoiceViewer({
          invoiceNumber: req.rentalCode || 'TR-000' + (req.id?.slice(0, 4) || '4587'),
          issueDate: formatDate(req.startDate || '2026-10-13'),
          client: {
            name: client?.fullName || 'Constructora Bolívar S.A.S.',
            taxId: client?.documentNumber || '900.342.112-4',
            address: client?.address || 'Calle 100 # 19-61, Of. 402, Bogotá',
            email: client?.email || 'compras@cliente.com',
            phone: client?.phone || '+57 (1) 745-8900'
          },
          provider: {
            name: providerProfile?.companyName || 'ToolRent Equipos Pro S.A.S.',
            taxId: providerProfile?.taxId || '901.458.789-1',
            address: providerProfile?.address || 'Cra. 43A # 18 Sur-135',
            email: user?.email || 'contacto@proveedor.com',
            phone: providerProfile?.phone || '+57 (4) 448-9000'
          },
          tool: {
            name: tool?.name || 'Equipo de Construcción',
            sku: tool?.serialNumber || 'SKU-001'
          },
          rentalPeriod: {
            startDate: formatDate(req.startDate || '2026-10-13'),
            endDate: formatDate(req.endDate || '2026-10-16'),
            days: req.totalDays || 3
          },
          dailyRate: firstItem?.dailyPrice || Math.round(subtotal / (req.totalDays || 1)),
          subtotal: subtotal,
          tax: tax,
          total: totalAmount,
          paymentMethod: 'Transferencia electrónica',
          bank: 'Bancolombia',
          reference: req.rentalCode || 'TR-REF-001',
          paymentDate: formatDate(req.startDate || '2026-10-13')
        });
      });
    });
  }

  /**
   * Modal: Registrar Devolución con inspección técnica
   */
  function openReturnInspectionModal(req) {
    const firstItem = req?.items?.[0];
    const tool = firstItem ? toolsMap.get(firstItem.toolId) : null;
    const toolImg = tool?.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=100';

    const content = document.createElement('div');
    content.className = 'space-y-5 text-xs';

    content.innerHTML = `
      <div class="space-y-4">
        <!-- Tool preview -->
        <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
          <img src="${toolImg}" class="w-12 h-12 rounded-lg object-contain bg-white border border-slate-200" />
          <div>
            <h4 class="font-bold text-slate-900 text-sm">${tool?.name || 'Equipo en devolución'}</h4>
            <span class="text-[11px] text-slate-500">${tool?.category?.name || 'Herramientas de construcción'}</span>
          </div>
        </div>

        <!-- Estado de la herramienta -->
        <div>
          <label class="block font-bold text-slate-700 uppercase tracking-wider mb-2">Estado de la herramienta</label>
          <div class="flex items-center gap-6">
            <label class="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
              <input type="radio" name="insp-status" value="GOOD" checked class="text-[#ea580c] focus:ring-orange-500" />
              <span>Buen estado / Conforme</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
              <input type="radio" name="insp-status" value="DAMAGED" class="text-[#ea580c] focus:ring-orange-500" />
              <span>Con averías o daños</span>
            </label>
          </div>
        </div>

        <!-- Observaciones -->
        <div>
          <label class="block font-medium text-slate-700 mb-1">Notas técnicas <span class="text-slate-400 font-normal">(opcional)</span></label>
          <textarea id="insp-notes" class="input-field h-20" placeholder="Observaciones de la devolución..."></textarea>
        </div>

        <!-- Damage box (collapsible) -->
        <div id="damage-report-box" class="hidden p-4 rounded-xl border border-amber-200 bg-amber-50/60 space-y-3">
          <div class="flex items-center gap-1.5 text-[#ea580c] font-bold">
            ${renderIcon('AlertTriangle', 'w-4 h-4')}
            <span>Reportar daño o avería</span>
          </div>
          <p class="text-[11px] text-slate-500">Registra el costo estimado y envía la herramienta a mantenimiento.</p>

          <div>
            <label class="block font-medium text-slate-700 mb-1">Descripción del daño *</label>
            <input type="text" id="dmg-description" class="input-field" placeholder="Describe el daño encontrado..." />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-medium text-slate-700 mb-1">Costo estimado reparación</label>
              <input type="text" id="dmg-cost" class="input-field" value="$ 75.000" />
            </div>
            <div>
              <label class="block font-medium text-slate-700 mb-1">Enviar herramienta a:</label>
              <select id="dmg-new-status" class="input-field">
                <option value="MAINTENANCE" selected>Mantenimiento / Taller</option>
                <option value="RETIRED">Retirada de catálogo</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button id="btn-cancel-insp" class="btn-secondary !py-2 cursor-pointer">Cancelar</button>
          <button id="btn-complete-insp" class="btn-primary !py-2 cursor-pointer">Completar devolución</button>
        </div>
      </div>
    `;

    const radioDamaged = content.querySelector('input[name="insp-status"][value="DAMAGED"]');
    const radioGood = content.querySelector('input[name="insp-status"][value="GOOD"]');
    const dmgBox = content.querySelector('#damage-report-box');

    radioDamaged.addEventListener('change', () => dmgBox.classList.remove('hidden'));
    radioGood.addEventListener('change', () => dmgBox.classList.add('hidden'));

    content.querySelector('#btn-cancel-insp').addEventListener('click', () => modal.close());

    content.querySelector('#btn-complete-insp').addEventListener('click', async () => {
      try {
        await api.patch(`/rentals/${req.id}/complete`);
        const isDamaged = content.querySelector('input[name="insp-status"]:checked')?.value === 'DAMAGED';
        notificationsStore.add({
          category: isDamaged ? 'DAMAGE' : 'INSPECTION',
          type: isDamaged ? 'warning' : 'success',
          title: isDamaged ? 'Devolución con Avería Registrada' : 'Devolución Conforme Registrada',
          message: `Inspección de alquiler #${req.id} completada.${isDamaged ? ' Se envió reporte a mantenimiento.' : ' Depósito listo para liberación.'}`,
          link: '#/provider'
        });
        if (req) req.status = 'COMPLETED';
        showToast('Devolución completada exitosamente', 'success');
        modal.close();
        render();
      } catch (err) {
        showToast(err.message || 'Error al completar devolución', 'error');
      }
    });

    modal.open({
      title: `${renderIcon('ClipboardCheck', 'w-5 h-5 text-[#ea580c]')} Registrar devolución`,
      content: content,
      maxWidth: 'max-w-lg',
    });
  }

  /**
   * Drawer / Modal: Nueva herramienta / Editar herramienta
   */
  function openNewToolModal(existingTool = null) {
    const isEdit = !!existingTool;
    const content = document.createElement('div');
    content.className = 'space-y-4 text-xs';

    const currentCatId = existingTool?.category?.id || existingTool?.categoryId || categoriesList[0]?.id;

    content.innerHTML = `
      <form id="drawer-tool-form" class="space-y-4">
        <div>
          <label class="block font-bold text-slate-700 mb-1">Nombre de la herramienta *</label>
          <input type="text" id="dt-name" required class="input-field" value="${existingTool?.name || ''}" placeholder="Ej: Martillo Demoledor Hexagonal 30kg" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Categoría *</label>
            <select id="dt-category" class="input-field cursor-pointer" required>
              ${categoriesList.map(c => `
                <option value="${c.id}" ${currentCatId === c.id ? 'selected' : ''}>${c.name}</option>
              `).join('')}
            </select>
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Marca</label>
            <input type="text" id="dt-brand" class="input-field" value="${existingTool?.brand || 'Bosch'}" placeholder="Ej: DeWalt, Bosch, Layher" />
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">Descripción técnica *</label>
          <textarea id="dt-desc" rows="3" required class="input-field" placeholder="Describe la herramienta, características y potencia...">${existingTool?.description || ''}</textarea>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Tarifa diaria ($ COP) *</label>
            <input type="number" id="dt-price" required min="1000" step="1000" class="input-field" placeholder="85000" value="${existingTool?.dailyPrice || 85000}" />
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Valor de reposición ($ COP) *</label>
            <input type="number" id="dt-replacement" required min="10000" step="10000" class="input-field" placeholder="3000000" value="${existingTool?.replacementValue || (existingTool?.dailyPrice ? existingTool.dailyPrice * 35 : 3000000)}" />
          </div>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">URL de Imagen del equipo</label>
          <input type="url" id="dt-image" class="input-field" placeholder="https://..." value="${existingTool?.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1000'}" />
        </div>

        <div class="pt-2">
          <button type="submit" class="btn-primary w-full !py-2.5 cursor-pointer font-bold">
            ${isEdit ? 'Guardar cambios' : 'Publicar en catálogo'}
          </button>
        </div>
      </form>
    `;

    content.querySelector('#drawer-tool-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = content.querySelector('#dt-name').value.trim();
      const categoryId = content.querySelector('#dt-category').value;
      const brand = content.querySelector('#dt-brand').value.trim();
      const price = parseFloat(content.querySelector('#dt-price').value);
      const replacement = parseFloat(content.querySelector('#dt-replacement').value);
      const desc = content.querySelector('#dt-desc').value.trim();
      const imageUrl = content.querySelector('#dt-image').value.trim();

      const selectedCat = categoriesList.find(c => c.id === categoryId);

      const payload = {
        providerId: providerId || 'd0000000-0000-0000-0000-000000000001',
        categoryId: categoryId,
        name: name,
        brand: brand || 'ToolRent Pro',
        model: existingTool?.model || 'Modelo 2026',
        serialNumber: existingTool?.serialNumber || `SN-${Date.now().toString().slice(-6)}`,
        description: desc,
        dailyPrice: price,
        replacementValue: replacement || price * 35,
        images: [{ imageUrl: imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1000', isPrimary: true }],
        specifications: [
          { specName: 'Potencia', specValue: '1200 W' },
          { specName: 'Voltaje', specValue: '110 V' }
        ]
      };

      try {
        if (isEdit) {
          const updated = await api.put(`/tools/${existingTool.id}`, payload);
          existingTool.name = name;
          existingTool.brand = brand;
          existingTool.dailyPrice = price;
          existingTool.description = desc;
          existingTool.category = selectedCat || existingTool.category;
          if (imageUrl) {
            existingTool.images = [{ imageUrl, isPrimary: true }];
          }
          notificationsStore.add({
            category: 'RENTAL',
            type: 'info',
            title: 'Herramienta Actualizada',
            message: `Se actualizaron las especificaciones de "${name}".`,
            link: '#/provider'
          });
          showToast(`"${name}" actualizado con éxito`, 'success');
        } else {
          const created = await api.post('/tools', payload);
          const newTool = {
            id: created?.id || `tool-${Date.now()}`,
            name,
            brand: brand || 'ToolRent Pro',
            category: selectedCat || { id: categoryId, name: 'Construcción' },
            dailyPrice: price,
            description: desc,
            status: 'AVAILABLE',
            serialNumber: payload.serialNumber,
            images: [{ imageUrl: imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1000', isPrimary: true }]
          };
          toolsList.unshift(newTool);
          toolsMap.set(newTool.id, newTool);
          notificationsStore.add({
            category: 'RENTAL',
            type: 'success',
            title: 'Equipo Agregado al Inventario',
            message: `Has publicado "${name}" en tu catálogo a ${formatCurrency(price)}/día.`,
            link: '#/provider'
          });
          showToast(`"${name}" publicado en el catálogo`, 'success');
        }

        modal.close();
        render();
      } catch (err) {
        showToast(err.message || 'Error al guardar la herramienta', 'error');
      }
    });

    modal.open({
      title: `${renderIcon(isEdit ? 'Edit3' : 'Plus', 'w-5 h-5 text-[#ea580c]')} ${isEdit ? 'Editar herramienta' : 'Nueva herramienta'}`,
      content: content,
      maxWidth: 'max-w-md',
    });
  }

  // Initial render
  render();
}

export default renderProviderDashboard;
