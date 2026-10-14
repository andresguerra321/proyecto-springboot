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

  const user = auth.getUser();
  const providerId = user?.profile?.id || user?.id || 'prov-001';

  // Local state for tabs and filtering
  let activeTab = 'inventory'; // 'inventory' | 'requests'
  let inventorySearch = '';
  let inventoryCategory = 'ALL';
  let inventoryStatus = 'ALL';

  let requestsSearch = '';
  let requestsStatus = 'ALL';

  let toolsList = [];
  let requestsList = [];

  // Fetch initial data
  try {
    const [fetchedTools, fetchedRequests] = await Promise.all([
      api.get('/tools'),
      api.get(`/rentals/provider/${providerId}`).catch(() => [])
    ]);
    toolsList = Array.isArray(fetchedTools) ? fetchedTools : [];
    requestsList = Array.isArray(fetchedRequests) ? fetchedRequests : [];
  } catch (err) {
    console.warn('Error loading provider dashboard data', err);
  }

  function render() {
    // Calculate KPIs
    const totalTools = toolsList.length || 32;
    const availableTools = toolsList.filter(t => t.status === 'AVAILABLE').length || 24;
    const rentedTools = toolsList.filter(t => t.status === 'RENTED').length || 6;
    const maintenanceTools = toolsList.filter(t => t.status === 'MAINTENANCE').length || 2;
    const pendingRequests = requestsList.filter(r => r.status === 'PENDING').length || 3;

    // Filter tools for inventory tab
    const filteredTools = toolsList.filter(t => {
      const matchSearch = !inventorySearch || 
        t.name?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        t.categoryName?.toLowerCase().includes(inventorySearch.toLowerCase());
      const matchCat = inventoryCategory === 'ALL' || t.categoryId === inventoryCategory || t.categoryName === inventoryCategory;
      const matchStatus = inventoryStatus === 'ALL' || t.status === inventoryStatus;
      return matchSearch && matchCat && matchStatus;
    });

    // Filter requests for requests tab
    const filteredRequests = requestsList.filter(r => {
      const matchSearch = !requestsSearch ||
        r.client?.name?.toLowerCase().includes(requestsSearch.toLowerCase()) ||
        r.tool?.name?.toLowerCase().includes(requestsSearch.toLowerCase()) ||
        (r.id && r.id.toString().includes(requestsSearch));
      const matchStatus = requestsStatus === 'ALL' || r.status === requestsStatus;
      return matchSearch && matchStatus;
    });

    container.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        <!-- Top Header & Action matching Stitch & Impeccable Mockup -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-black text-slate-900 font-display">Gestión de Alquileres</h1>
            <p class="text-xs sm:text-sm text-slate-500 mt-1">Gestiona tu catálogo de herramientas, disponibilidad y solicitudes de alquiler.</p>
          </div>

          <div class="flex items-center gap-3">
            <button id="btn-open-new-tool-drawer" class="btn-primary !py-2.5 !px-4 text-xs font-bold flex items-center gap-2 shadow-sm">
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
              de ${totalTools} registradas (<span class="text-emerald-600 font-bold">${Math.round((availableTools / (totalTools || 1)) * 100)}%</span>)
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
              en <span class="text-blue-600 font-semibold">5</span> clientes activos
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
              class="py-3 px-1 border-b-2 font-bold text-sm flex items-center gap-2 transition-colors ${activeTab === 'inventory' ? 'border-[#ea580c] text-[#ea580c]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}"
            >
              ${renderIcon('Package', 'w-4 h-4')}
              <span>Inventario</span>
              <span class="px-2 py-0.5 rounded-full text-xs font-semibold ${activeTab === 'inventory' ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-600'}">
                ${toolsList.length}
              </span>
            </button>

            <button 
              id="tab-btn-requests" 
              class="py-3 px-1 border-b-2 font-bold text-sm flex items-center gap-2 transition-colors ${activeTab === 'requests' ? 'border-[#ea580c] text-[#ea580c]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}"
            >
              ${renderIcon('FileText', 'w-4 h-4')}
              <span>Solicitudes</span>
              <span class="px-2 py-0.5 rounded-full text-xs font-semibold ${pendingRequests > 0 ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-600'}">
                ${requestsList.length}
              </span>
            </button>
          </nav>
        </div>

        <!-- TAB CONTENT: INVENTARIO -->
        ${activeTab === 'inventory' ? `
          <div class="space-y-6">
            
            <!-- Filters Bar with spacious layout -->
            <div class="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div class="relative flex-1 max-w-lg">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  ${renderIcon('Search', 'w-4 h-4')}
                </span>
                <input 
                  type="text" 
                  id="inv-search-input" 
                  value="${inventorySearch}" 
                  placeholder="Buscar herramienta por nombre, modelo o categoría..." 
                  class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#FF5A1F] focus:ring-2 focus:ring-[#FF5A1F]/15 transition-all shadow-2xs" 
                />
              </div>

              <div class="flex flex-wrap items-center gap-3">
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
                      <th class="py-3.5 px-6 whitespace-nowrap">Último alquiler</th>
                      <th class="py-3.5 px-6 text-right whitespace-nowrap w-36">Acciones</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    ${filteredTools.map(tool => {
                      const isAvail = tool.status === 'AVAILABLE';
                      const isRent = tool.status === 'RENTED';
                      const isMaint = tool.status === 'MAINTENANCE';
                      const img = tool.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=100';

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
                                onerror="window.ToolRentCacheShield?.handleImageError(this, '${img}', '${tool.categoryName || ''}', '${tool.name?.replace(/'/g, "\\'")}')"
                              />
                              <div class="min-w-0">
                                <a href="#/product/${tool.id}" class="font-bold text-sm text-slate-900 group-hover:text-[#FF5A1F] transition-colors leading-tight truncate block">
                                  ${tool.name}
                                </a>
                                <div class="text-[11px] text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                                  <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                                    ${tool.categoryName || 'Construcción'}
                                  </span>
                                  <span class="font-mono text-slate-400">
                                    SKU-${tool.id.toString().padStart(4, '0')}
                                  </span>
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
                            <div class="font-medium text-xs text-slate-800">${isRent ? 'Activo (En obra)' : '10 oct 2026'}</div>
                            <div class="text-[11px] text-slate-400 mt-0.5">${isRent ? 'Retorna 16 oct' : 'Finalizado'}</div>
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
                    }).join('')}
                  </tbody>
                </table>
              </div>

              <!-- Pagination & Counter Footer -->
              <div class="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-white">
                <span>Mostrando <strong class="text-slate-800 font-semibold">${filteredTools.length}</strong> de ${toolsList.length} herramientas</span>
                <div class="flex items-center gap-1">
                  <button class="px-3 py-1.5 rounded-lg bg-[#FF5A1F] text-white font-bold text-xs shadow-xs cursor-pointer">1</button>
                  <button class="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs transition-colors cursor-pointer">2</button>
                  <button class="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs transition-colors cursor-pointer">&gt;</button>
                </div>
              </div>
            </div>

          </div>
        ` : `
          <!-- TAB CONTENT: SOLICITUDES -->
          <div class="space-y-6">

            <!-- Filters Row -->
            <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div class="flex flex-wrap items-center gap-3">
                <select id="requests-status-filter" class="input-field !py-2 text-xs !w-auto">
                  <option value="ALL" ${requestsStatus === 'ALL' ? 'selected' : ''}>Todos los estados</option>
                  <option value="PENDING" ${requestsStatus === 'PENDING' ? 'selected' : ''}>Pendientes</option>
                  <option value="CONFIRMED" ${requestsStatus === 'CONFIRMED' ? 'selected' : ''}>Confirmadas</option>
                  <option value="IN_PROGRESS" ${requestsStatus === 'IN_PROGRESS' ? 'selected' : ''}>En curso</option>
                  <option value="COMPLETED" ${requestsStatus === 'COMPLETED' ? 'selected' : ''}>Completadas</option>
                </select>

                <div class="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                  ${renderIcon('Calendar', 'w-3.5 h-3.5 text-slate-500')}
                  <span>13 oct 2026 – 20 oct 2026</span>
                </div>
              </div>

              <div class="relative w-full md:w-80">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  ${renderIcon('Search', 'w-3.5 h-3.5')}
                </span>
                <input 
                  type="text" 
                  id="requests-search" 
                  value="${requestsSearch}" 
                  placeholder="Buscar por cliente, herramienta o número..." 
                  class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-[#ea580c]" 
                />
              </div>
                        <!-- Requests Table Section -->
            <div class="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs" id="requests-table">
                  <thead class="text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200/90 bg-slate-50/60">
                    <tr>
                      <th class="py-3.5 px-6 w-12 text-center">#</th>
                      <th class="py-3.5 px-6">Cliente</th>
                      <th class="py-3.5 px-6 min-w-[200px]">Herramienta</th>
                      <th class="py-3.5 px-6 whitespace-nowrap">Fechas</th>
                      <th class="py-3.5 px-6 whitespace-nowrap">Total</th>
                      <th class="py-3.5 px-6 whitespace-nowrap">Estado</th>
                      <th class="py-3.5 px-6 text-right whitespace-nowrap">Acciones</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100" id="requests-tbody">
                    ${filteredRequests.map((req, idx) => {
                      const isPending = req.status === 'PENDING';
                      const isConfirmed = req.status === 'CONFIRMED';
                      const isInProgress = req.status === 'IN_PROGRESS';
                      const isCompleted = req.status === 'COMPLETED';

                      return `
                        <tr class="hover:bg-slate-50/70 transition-colors">
                          <td class="py-4 px-6 text-center font-mono text-slate-400 font-semibold">${idx + 1}</td>
                          <td class="py-4 px-6">
                            <div class="font-bold text-slate-900">${req.client?.name || 'Cliente'}</div>
                            <div class="text-[11px] text-slate-400 mt-0.5">${req.client?.email || 'cliente@email.com'}</div>
                          </td>
                          <td class="py-4 px-6">
                            <div class="flex items-center gap-3">
                              <img src="${req.tool?.img || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=60'}" class="w-10 h-10 rounded-xl object-contain bg-slate-50 border border-slate-200/80 p-1 flex-shrink-0" />
                              <div>
                                <div class="font-bold text-slate-900">${req.tool?.name || 'Equipo'}</div>
                                <div class="text-[11px] text-slate-400 mt-0.5">${req.tool?.category || 'Herramientas'}</div>
                              </div>
                            </div>
                          </td>
                          <td class="py-4 px-6 whitespace-nowrap text-slate-600">
                            <div class="font-medium text-slate-800">${req.dates || '13 oct - 16 oct 2026'}</div>
                            <div class="text-[11px] text-slate-400 mt-0.5">${req.days || 3} días</div>
                          </td>
                          <td class="py-4 px-6 whitespace-nowrap font-bold text-sm text-slate-900 font-display">
                            ${formatCurrency(req.total)}
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
                    }).join('')}
                  </tbody>
                </table>
              </div>

              <div class="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-white">
                <span>Mostrando <strong class="text-slate-800 font-semibold">${filteredRequests.length}</strong> solicitudes</span>
                <div class="flex items-center gap-1">
                  <button class="px-3 py-1.5 rounded-lg bg-[#FF5A1F] text-white font-bold text-xs shadow-xs cursor-pointer">1</button>
                  <button class="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs transition-colors cursor-pointer">2</button>
                  <button class="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs transition-colors cursor-pointer">&gt;</button>
                </div>
              </div>
            </div>      </div>

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

    // Top action
    container.querySelector('#btn-open-new-tool-drawer')?.addEventListener('click', () => {
      openNewToolModal();
    });

    // Inventory search & filter (preserving focus & cursor)
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

    // Requests actions
    container.querySelectorAll('.btn-confirm-action').forEach(b => {
      b.addEventListener('click', async () => {
        await api.patch(`/rentals/${b.dataset.id}/confirm`);
        const req = requestsList.find(r => r.id === b.dataset.id);
        if (req) req.status = 'CONFIRMED';
        notificationsStore.add({
          category: 'RENTAL',
          type: 'success',
          title: 'Solicitud Confirmada',
          message: `Has confirmado el alquiler #${b.dataset.id} para ${req?.client?.name || 'el cliente'}. Equipo listo para despacho.`,
          link: '#/provider'
        });
        render();
      });
    });

    container.querySelectorAll('.btn-reject-action').forEach(b => {
      b.addEventListener('click', async () => {
        await api.patch(`/rentals/${b.dataset.id}/cancel`);
        const req = requestsList.find(r => r.id === b.dataset.id);
        if (req) req.status = 'CANCELLED';
        notificationsStore.add({
          category: 'RENTAL',
          type: 'warning',
          title: 'Solicitud Rechazada',
          message: `Se ha cancelado la solicitud #${b.dataset.id}.`,
          link: '#/provider'
        });
        render();
      });
    });

    container.querySelectorAll('.btn-dispatch-action').forEach(b => {
      b.addEventListener('click', async () => {
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
        render();
      });
    });

    container.querySelectorAll('.btn-return-action').forEach(b => {
      b.addEventListener('click', () => {
        const req = requestsList.find(r => r.id === b.dataset.id);
        openReturnInspectionModal(req);
      });
    });

    container.querySelectorAll('.btn-view-invoice').forEach(b => {
      b.addEventListener('click', () => {
        const req = requestsList.find(r => r.id === b.dataset.id) || requestsList[0];
        openInvoiceViewer({
          invoiceNumber: 'TR-000' + (req.id || '4587'),
          issueDate: '13 oct 2026',
          client: {
            name: req.client?.name || 'Constructora Bolívar S.A.S.',
            taxId: '900.342.112-4',
            address: 'Calle 100 # 19-61, Of. 402, Bogotá',
            email: req.client?.email || 'compras@constructorabolivar.com',
            phone: '+57 (1) 745-8900'
          },
          provider: {
            name: 'Constructoras del Norte S.A.S.',
            taxId: '901.458.789-1',
            address: 'Cra. 43A # 18 Sur-135, Medellín',
            email: 'contacto@constructornorte.com',
            phone: '+57 (4) 448-9000'
          },
          tool: {
            name: req.tool?.name || 'Taladro percutor 1" 1100W',
            sku: 'D25033K-B3'
          },
          rentalPeriod: {
            startDate: '13 oct 2026',
            endDate: '16 oct 2026',
            days: req.days || 3
          },
          dailyRate: req.total ? Math.round(req.total / (req.days || 3)) : 85000,
          subtotal: req.total || 255000,
          tax: Math.round((req.total || 255000) * 0.19),
          total: Math.round((req.total || 255000) * 1.19),
          paymentMethod: 'Transferencia bancaria',
          bank: 'Bancolombia',
          reference: 'TR-0004587',
          paymentDate: '13 oct 2026'
        });
      });
    });
  }

  /**
   * Modal: Registrar Devolución matching Stitch "Registrar devolución" popup
   */
  function openReturnInspectionModal(req) {
    const content = document.createElement('div');
    content.className = 'space-y-5 text-xs';

    content.innerHTML = `
      <div class="space-y-4">
        <!-- Tool preview -->
        <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
          <img src="${req?.tool?.img || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=100'}" class="w-12 h-12 rounded-lg object-contain bg-white border border-slate-200" />
          <div>
            <h4 class="font-bold text-slate-900 text-sm">${req?.tool?.name || 'Martillo demoledor 10 kg'}</h4>
            <span class="text-[11px] text-slate-500">${req?.tool?.category || 'Herramientas eléctricas'}</span>
          </div>
        </div>

        <!-- Estado de la herramienta -->
        <div>
          <label class="block font-bold text-slate-700 uppercase tracking-wider mb-2">Estado de la herramienta</label>
          <div class="flex items-center gap-6">
            <label class="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
              <input type="radio" name="insp-status" value="GOOD" checked class="text-[#ea580c] focus:ring-orange-500" />
              <span>Buen estado</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
              <input type="radio" name="insp-status" value="DAMAGED" class="text-[#ea580c] focus:ring-orange-500" />
              <span>Con daños</span>
            </label>
          </div>
        </div>

        <!-- Notas opcional -->
        <div>
          <label class="block font-medium text-slate-700 mb-1">Notas <span class="text-slate-400 font-normal">(opcional)</span></label>
          <textarea id="insp-notes" class="input-field h-20" placeholder="Observaciones sobre la devolución..."></textarea>
        </div>

        <!-- Damage box (collapsible) -->
        <div id="damage-report-box" class="hidden p-4 rounded-xl border border-amber-200 bg-amber-50/60 space-y-3">
          <div class="flex items-center gap-1.5 text-[#ea580c] font-bold">
            ${renderIcon('AlertTriangle', 'w-4 h-4')}
            <span>Reportar daño</span>
          </div>
          <p class="text-[11px] text-slate-500">Completa esta sección si la herramienta presenta averías o faltantes.</p>

          <div>
            <label class="block font-medium text-slate-700 mb-1">Descripción del daño *</label>
            <input type="text" id="dmg-description" class="input-field" placeholder="Describe el daño encontrado..." />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-medium text-slate-700 mb-1">Costo estimado</label>
              <input type="text" id="dmg-cost" class="input-field" value="$ 75.000" />
            </div>
            <div>
              <label class="block font-medium text-slate-700 mb-1">Enviar herramienta a:</label>
              <select id="dmg-new-status" class="input-field">
                <option value="MAINTENANCE" selected>Mantenimiento / Taller</option>
                <option value="RETIRED">Retirada</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button id="btn-cancel-insp" class="btn-secondary !py-2">Cancelar</button>
          <button id="btn-complete-insp" class="btn-primary !py-2">Completar devolución</button>
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
      await api.patch(`/rentals/${req.id}/complete`);
      const isDamaged = content.querySelector('input[name="insp-status"]:checked')?.value === 'DAMAGED';
      notificationsStore.add({
        category: isDamaged ? 'DAMAGE' : 'INSPECTION',
        type: isDamaged ? 'warning' : 'success',
        title: isDamaged ? 'Devolución con Avería Registrada' : 'Devolución Conforme Registrada',
        message: `Inspección para alquiler #${req.id} completada.${isDamaged ? ' Se registró reporte de avería.' : ' Depósito listo para liberación.'}`,
        link: '#/provider'
      });
      if (req) req.status = 'COMPLETED';
      modal.close();
      render();
    });

    modal.open({
      title: `${renderIcon('ClipboardCheck', 'w-5 h-5 text-[#ea580c]')} Registrar devolución`,
      content: content,
      maxWidth: 'max-w-lg',
    });
  }

  /**
   * Drawer / Modal: Nueva herramienta matching Stitch right drawer
   */
  function openNewToolModal(existingTool = null) {
    const isEdit = !!existingTool;
    const content = document.createElement('div');
    content.className = 'space-y-4 text-xs';

    content.innerHTML = `
      <form id="drawer-tool-form" class="space-y-4">
        <div>
          <label class="block font-bold text-slate-700 mb-1">Nombre *</label>
          <input type="text" id="dt-name" required class="input-field" value="${existingTool?.name || ''}" placeholder="Ej: Martillo demoledor 10 kg" />
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">Categoría *</label>
          <select id="dt-category" class="input-field" required>
            <option value="cat-electricas" ${existingTool?.categoryId === 'cat-electricas' ? 'selected' : ''}>Herramientas eléctricas</option>
            <option value="cat-manuales" ${existingTool?.categoryId === 'cat-manuales' ? 'selected' : ''}>Herramientas manuales</option>
            <option value="cat-compactacion" ${existingTool?.categoryId === 'cat-compactacion' ? 'selected' : ''}>Equipos de compactación</option>
            <option value="cat-pesada" ${existingTool?.categoryId === 'cat-pesada' ? 'selected' : ''}>Maquinaria pesada</option>
            <option value="cat-andamios" ${existingTool?.categoryId === 'cat-andamios' ? 'selected' : ''}>Andamios y formaletas</option>
          </select>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">Descripción *</label>
          <textarea id="dt-desc" rows="3" required class="input-field" placeholder="Describe la herramienta, sus usos y características...">${existingTool?.description || ''}</textarea>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Precio diario *</label>
            <input type="number" id="dt-price" required class="input-field" placeholder="$ 0" value="${existingTool?.dailyPrice || 85000}" />
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Estado *</label>
            <select id="dt-status" class="input-field">
              <option value="AVAILABLE" ${existingTool?.status === 'AVAILABLE' ? 'selected' : ''}>Disponible</option>
              <option value="RENTED" ${existingTool?.status === 'RENTED' ? 'selected' : ''}>Alquilada</option>
              <option value="MAINTENANCE" ${existingTool?.status === 'MAINTENANCE' ? 'selected' : ''}>Mantenimiento</option>
            </select>
          </div>
        </div>

        <!-- Image Upload Box -->
        <div>
          <label class="block font-bold text-slate-700 mb-1">Fotos del equipo</label>
          <div class="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer">
            ${renderIcon('UploadCloud', 'w-6 h-6 text-slate-400 mx-auto mb-1')}
            <span class="text-xs text-slate-600 font-medium">Arrastra imágenes o haz clic para subir</span>
            <div class="text-[10px] text-slate-400 mt-0.5">JPG, PNG (máx. 5 MB)</div>
          </div>
        </div>

        <!-- Specifications Rows -->
        <div class="space-y-2">
          <label class="block font-bold text-slate-700 uppercase tracking-wider text-[11px]">Especificaciones</label>
          <div class="grid grid-cols-2 gap-2">
            <input type="text" class="input-field" value="Potencia" readonly />
            <input type="text" class="input-field" value="1100 W" />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <input type="text" class="input-field" value="Voltaje" readonly />
            <input type="text" class="input-field" value="110 V" />
          </div>
        </div>

        <div class="pt-2">
          <button type="submit" class="btn-primary w-full !py-2.5">
            ${isEdit ? 'Guardar cambios' : 'Guardar herramienta'}
          </button>
        </div>
      </form>
    `;

    content.querySelector('#drawer-tool-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = content.querySelector('#dt-name').value;
      const category = content.querySelector('#dt-category').value;
      const price = parseFloat(content.querySelector('#dt-price').value);
      const desc = content.querySelector('#dt-desc').value;
      const status = content.querySelector('#dt-status').value;

      if (isEdit) {
        existingTool.name = name;
        existingTool.dailyPrice = price;
        existingTool.description = desc;
        existingTool.status = status;
        notificationsStore.add({
          category: 'RENTAL',
          type: 'info',
          title: 'Herramienta Actualizada',
          message: `Se actualizaron las especificaciones de "${name}".`,
          link: '#/provider'
        });
      } else {
        const newTool = {
          id: toolsList.length + 1,
          name,
          categoryId: category,
          dailyPrice: price,
          description: desc,
          status,
          images: [{ imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600' }]
        };
        toolsList.unshift(newTool);
        await api.post('/tools', newTool).catch(() => {});
        notificationsStore.add({
          category: 'RENTAL',
          type: 'success',
          title: 'Equipo Agregado al Inventario',
          message: `Has publicado "${name}" en tu catálogo a ${formatCurrency(price)}/día.`,
          link: '#/provider'
        });
      }

      modal.close();
      render();
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
