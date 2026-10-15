import api from '../api/client.js';
import auth from '../auth/state.js';
import showToast from '../components/toast.js';
import { formatCurrency } from '../utils/formatters.js';
import { renderIcon } from '../utils/icons.js';
import { openAuthModal } from '../components/auth-modal.js';

export async function renderAdminDashboard() {
  const container = document.getElementById('app-content');
  if (!container) return;

  if (!auth.isAuthenticated() || !auth.isAdmin()) {
    container.innerHTML = `
      <section class="max-w-4xl mx-auto px-4 py-20 text-center">
        <div class="bg-white rounded-2xl border border-slate-200/80 p-10 max-w-lg mx-auto shadow-sm space-y-4">
          <div class="w-14 h-14 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
            ${renderIcon('ShieldAlert', 'w-7 h-7')}
          </div>
          <h2 class="text-xl font-bold text-slate-900 font-display">Área Restringida a Administradores</h2>
          <p class="text-xs text-slate-500">Inicia sesión con credenciales de Administrador para acceder a métricas, inventario global y usuarios.</p>
          <div class="flex justify-center pt-2">
            <button id="btn-login-admin" class="btn-primary !py-2.5 !px-8 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm">
              ${renderIcon('LogIn', 'w-4 h-4')} Iniciar Sesión como Administrador
            </button>
          </div>
        </div>
      </section>
    `;
    container.querySelector('#btn-login-admin')?.addEventListener('click', () => openAuthModal('login'));
    return;
  }

  // Initial local state for admin view
  let currentTab = 'all'; // all, client, provider, admin
  let searchQuery = '';
  let usersList = [];
  let incomeReport = null;
  let toolAvail = null;
  let topTools = [];
  let topClients = [];
  let allTools = [];

  try {
    const [rawUsers, rawIncome, rawAvail, rawTopTools, rawTopClients, rawTools] = await Promise.all([
      api.get('/users').catch(() => []),
      api.get('/reporting/income').catch(() => null),
      api.get('/reporting/tool-availability').catch(() => null),
      api.get('/reporting/most-rented-tools', { limit: 5 }).catch(() => []),
      api.get('/reporting/frequent-clients', { limit: 5 }).catch(() => []),
      api.get('/tools').catch(() => [])
    ]);

    incomeReport = rawIncome;
    toolAvail = rawAvail;
    topTools = Array.isArray(rawTopTools) ? rawTopTools : [];
    topClients = Array.isArray(rawTopClients) ? rawTopClients : [];
    allTools = Array.isArray(rawTools) ? rawTools : [];

    if (Array.isArray(rawUsers) && rawUsers.length > 0) {
      usersList = rawUsers.map(u => {
        const isClient = u.roles?.some(r => r.includes('CLIENTE'));
        const isProvider = u.roles?.some(r => r.includes('PROVEEDOR'));
        const isAdmin = u.roles?.some(r => r.includes('ADMIN'));
        const roleLabel = isAdmin ? 'Administrador' : isProvider ? 'Proveedor' : 'Cliente';
        return {
          id: u.id,
          name: u.username,
          email: u.email,
          role: roleLabel,
          date: '13 oct 2026',
          active: u.enabled !== false,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.username)}`
        };
      });
    }
  } catch (err) {
    console.warn('Error loading admin dashboard real metrics', err);
  }

  // Compute inventory distribution metrics
  const totalT = toolAvail?.totalTools ?? allTools.length ?? 0;
  const availT = toolAvail?.availableTools ?? allTools.filter(t => t.status === 'AVAILABLE').length ?? 0;
  const rentT = toolAvail?.rentedTools ?? allTools.filter(t => t.status === 'RENTED').length ?? 0;
  const maintT = toolAvail?.maintenanceTools ?? allTools.filter(t => t.status === 'MAINTENANCE').length ?? 0;

  const availPct = totalT > 0 ? Math.round((availT / totalT) * 100) : 0;
  const rentPct = totalT > 0 ? Math.round((rentT / totalT) * 100) : 0;
  const maintPct = totalT > 0 ? Math.round((maintT / totalT) * 100) : 0;

  const circ = 238.76;
  const dashAvail = totalT > 0 ? (availT / totalT) * circ : circ;
  const dashRent = totalT > 0 ? (rentT / totalT) * circ : 0;
  const dashMaint = totalT > 0 ? (maintT / totalT) * circ : 0;
  const offsetRent = -dashAvail;
  const offsetMaint = -(dashAvail + dashRent);

  container.innerHTML = `
    <div class="min-h-screen bg-[#f8fafc] text-slate-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Resumen</h1>
            <p class="text-xs text-slate-500 mt-1">Vista general del estado de la plataforma.</p>
          </div>
          <div class="flex items-center gap-3">
            <div class="relative hidden sm:block">
              <input type="text" id="admin-global-search" placeholder="Buscar en el panel de administración..." class="bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs w-72 focus:outline-none focus:border-brand-500 transition-colors" />
              <div class="absolute left-3 top-2.5 text-slate-400">
                ${renderIcon('Search', 'w-3.5 h-3.5')}
              </div>
            </div>
            <a href="http://localhost:8085/swagger-ui.html" target="_blank" rel="noopener noreferrer" class="btn-secondary !py-2 !px-3 text-xs flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50">
              ${renderIcon('ExternalLink', 'w-3.5 h-3.5')} Swagger API
            </a>
          </div>
        </div>

        <!-- 4 Top KPI Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-cards-container">
          <!-- Ingresos Totales -->
          <div class="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-slate-500">Ingresos facturados</span>
              <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                ${renderIcon('DollarSign', 'w-4 h-4')}
              </div>
            </div>
            <div class="text-2xl font-bold text-slate-900 mt-2">${formatCurrency(incomeReport?.totalIncome || 0)}</div>
            <div class="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-1">
              <span>${incomeReport?.totalPayments || 0} transacciones</span>
              <span class="text-slate-400 font-normal">en PostgreSQL</span>
            </div>
          </div>

          <!-- Alquileres Totales -->
          <div class="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-slate-500">Alquileres registrados</span>
              <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                ${renderIcon('CalendarCheck', 'w-4 h-4')}
              </div>
            </div>
            <div class="text-2xl font-bold text-slate-900 mt-2">${incomeReport?.totalRentals || 0}</div>
            <div class="flex items-center gap-1 text-[11px] text-blue-600 font-medium mt-1">
              <span>Historial consolidado</span>
            </div>
          </div>

          <!-- Usuarios Registrados -->
          <div class="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-slate-500">Usuarios registrados</span>
              <div class="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                ${renderIcon('Users', 'w-4 h-4')}
              </div>
            </div>
            <div class="text-2xl font-bold text-slate-900 mt-2">${usersList.length}</div>
            <div class="flex items-center gap-1 text-[11px] text-purple-600 font-medium mt-1">
              <span>Clientes y proveedores</span>
            </div>
          </div>

          <!-- Herramientas disponibles -->
          <div class="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-slate-500">Herramientas en catálogo</span>
              <div class="w-8 h-8 rounded-lg bg-orange-50 text-brand-600 flex items-center justify-center">
                ${renderIcon('Wrench', 'w-4 h-4')}
              </div>
            </div>
            <div class="text-2xl font-bold text-slate-900 mt-2">${availT}</div>
            <div class="text-[11px] text-slate-400 font-normal mt-1">de ${totalT} disponibles</div>
          </div>
        </div>

        <!-- 3 Middle Analytics Cards -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Herramientas más alquiladas (Real Backend) -->
          <div class="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h2 class="text-sm font-bold text-slate-900">Herramientas más alquiladas</h2>
              <p class="text-[11px] text-slate-400 mt-0.5">Métricas en tiempo real desde la base de datos.</p>
              
              <div class="space-y-3.5 mt-5">
                ${topTools.length > 0 ? topTools.slice(0, 5).map(tool => `
                  <div>
                    <div class="flex justify-between text-xs mb-1">
                      <span class="text-slate-700 font-medium truncate max-w-[200px]" title="${tool.toolName}">${tool.toolName}</span>
                      <span class="text-slate-900 font-bold">${tool.timesRented}</span>
                    </div>
                    <div class="w-full bg-slate-100 rounded-full h-2">
                      <div class="bg-brand-500 h-2 rounded-full" style="width: ${Math.min(100, (tool.timesRented / 3) * 100)}%"></div>
                    </div>
                  </div>
                `).join('') : `
                  <div class="py-6 text-center text-xs text-slate-400">Sin datos de rotación aún</div>
                `}
              </div>
            </div>
          </div>

          <!-- Clientes frecuentes (Real Backend) -->
          <div class="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h2 class="text-sm font-bold text-slate-900">Clientes frecuentes</h2>
              <p class="text-[11px] text-slate-400 mt-0.5">Top clientes con reservas registradas.</p>

              <div class="divide-y divide-slate-100 mt-3">
                ${topClients.length > 0 ? topClients.slice(0, 5).map((client, idx) => `
                  <div class="py-2.5 flex items-center justify-between text-xs">
                    <div class="flex items-center gap-3">
                      <span class="w-5 text-slate-400 font-bold text-[11px]">${idx + 1}</span>
                      <span class="text-slate-800 font-medium truncate max-w-[170px]" title="${client.clientEmail}">${client.clientEmail}</span>
                    </div>
                    <span class="text-slate-500 font-semibold text-[11px]">${client.totalRentals} alquiler${client.totalRentals === 1 ? '' : 'es'}</span>
                  </div>
                `).join('') : `
                  <div class="py-6 text-center text-xs text-slate-400">Sin clientes registrados aún</div>
                `}
              </div>
            </div>
          </div>

          <!-- Estado del inventario (Donut Breakdown) -->
          <div class="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h2 class="text-sm font-bold text-slate-900">Estado del inventario</h2>
              <p class="text-[11px] text-slate-400 mt-0.5">Distribución de herramientas.</p>

              <div class="flex items-center justify-around mt-4">
                <!-- SVG Donut Chart -->
                <div class="relative w-32 h-32 flex items-center justify-center">
                  <svg class="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="38" stroke="#f1f5f9" stroke-width="12" fill="none" />
                    <!-- Green Disponible -->
                    <circle cx="50" cy="50" r="38" stroke="#22c55e" stroke-width="12" stroke-dasharray="${dashAvail} ${circ}" stroke-dashoffset="0" fill="none" stroke-linecap="round" />
                    <!-- Blue Alquilada -->
                    <circle cx="50" cy="50" r="38" stroke="#3b82f6" stroke-width="12" stroke-dasharray="${dashRent} ${circ}" stroke-dashoffset="${offsetRent}" fill="none" stroke-linecap="round" />
                    <!-- Amber Mantenimiento -->
                    <circle cx="50" cy="50" r="38" stroke="#f59e0b" stroke-width="12" stroke-dasharray="${dashMaint} ${circ}" stroke-dashoffset="${offsetMaint}" fill="none" stroke-linecap="round" />
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <span class="text-xl font-bold text-slate-900">${totalT}</span>
                    <span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total</span>
                  </div>
                </div>

                <!-- Legend -->
                <div class="space-y-3 text-xs">
                  <div class="flex items-center gap-2">
                    <div class="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                    <div>
                      <div class="font-medium text-slate-700">Disponible</div>
                      <div class="text-[11px] text-slate-400">${availT} (${availPct}%)</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                    <div>
                      <div class="font-medium text-slate-700">Alquilada</div>
                      <div class="text-[11px] text-slate-400">${rentT} (${rentPct}%)</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                    <div>
                      <div class="font-medium text-slate-700">Mantenimiento</div>
                      <div class="text-[11px] text-slate-400">${maintT} (${maintPct}%)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Section: Gestión de Usuarios -->
        <div class="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div class="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 class="text-base font-bold text-slate-900">Usuarios</h2>
              <p class="text-xs text-slate-500 mt-0.5">Gestiona los usuarios de la plataforma.</p>
            </div>
            <div class="flex items-center gap-3 w-full sm:w-auto">
              <div class="relative flex-1 sm:w-64">
                <input type="text" id="user-search-input" placeholder="Buscar usuario..." class="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors" />
                <div class="absolute left-2.5 top-2 text-slate-400">
                  ${renderIcon('Search', 'w-3.5 h-3.5')}
                </div>
              </div>
              <button id="btn-open-new-user-drawer" class="btn-primary !py-2 !px-4 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shadow-sm">
                ${renderIcon('Plus', 'w-3.5 h-3.5')} Nuevo usuario
              </button>
            </div>
          </div>

          <!-- Tabs -->
          <div class="flex border-b border-slate-100 px-6 gap-6 text-xs font-medium text-slate-500">
            <button class="admin-tab-btn py-3 border-b-2 border-brand-500 text-brand-600 font-semibold" data-tab="all">
              Todos (<span id="count-all">${usersList.length}</span>)
            </button>
            <button class="admin-tab-btn py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900" data-tab="client">
              Clientes (<span id="count-clients">${usersList.filter(u => u.role === 'Cliente').length}</span>)
            </button>
            <button class="admin-tab-btn py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900" data-tab="provider">
              Proveedores (<span id="count-providers">${usersList.filter(u => u.role === 'Proveedor').length}</span>)
            </button>
            <button class="admin-tab-btn py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900" data-tab="admin">
              Administradores (<span id="count-admins">${usersList.filter(u => u.role === 'Administrador').length}</span>)
            </button>
          </div>

          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50/70 text-slate-400 font-semibold text-[11px] border-b border-slate-100">
                <tr>
                  <th class="py-3 px-6 w-10">
                    <input type="checkbox" class="rounded border-slate-300 text-brand-500 focus:ring-brand-400" />
                  </th>
                  <th class="py-3 px-4">Nombre</th>
                  <th class="py-3 px-4">Correo electrónico</th>
                  <th class="py-3 px-4">Rol</th>
                  <th class="py-3 px-4">Fecha de registro</th>
                  <th class="py-3 px-4">Estado</th>
                  <th class="py-3 px-6 text-right whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700" id="users-table-body">
                <!-- Dynamically rendered -->
              </tbody>
            </table>
          </div>
        </div>

        <!-- Section: Herramientas (Collapsible global catalog management) -->
        <div class="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div class="p-6 border-b border-slate-100 flex items-center justify-between cursor-pointer select-none" id="tools-accordion-toggle">
            <div>
              <h2 class="text-base font-bold text-slate-900">Herramientas</h2>
              <p class="text-xs text-slate-500 mt-0.5">Gestiona el inventario global de herramientas (${allTools.length} registradas).</p>
            </div>
            <div class="text-slate-400 hover:text-slate-600">
              ${renderIcon('ChevronDown', 'w-5 h-5 transition-transform', 'id="tools-accordion-chevron"')}
            </div>
          </div>

          <div id="tools-accordion-content" class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50/70 text-slate-400 font-semibold text-[11px] border-b border-slate-100">
                <tr>
                  <th class="py-3 px-6">Imagen</th>
                  <th class="py-3 px-4">Nombre</th>
                  <th class="py-3 px-4">Proveedor</th>
                  <th class="py-3 px-4">Categoría</th>
                  <th class="py-3 px-4">Precio diario</th>
                  <th class="py-3 px-4">Estado</th>
                  <th class="py-3 px-6 text-right whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">
                ${allTools.length > 0 ? allTools.map(t => {
                  const isAvail = t.status === 'AVAILABLE';
                  const isRent = t.status === 'RENTED';
                  const img = t.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=120';
                  return `
                    <tr class="hover:bg-slate-50/50 transition-colors">
                      <td class="py-3 px-6">
                        <img src="${img}" class="w-12 h-10 object-contain bg-slate-50 rounded-md border border-slate-200" onerror="window.ToolRentCacheShield?.handleImageError(this, '${img}', '${t.categoryName || ''}', '${t.name?.replace(/'/g, "\\'")}')" />
                      </td>
                      <td class="py-3 px-4 font-semibold text-slate-900">${t.name}</td>
                      <td class="py-3 px-4 text-slate-500">${t.provider?.name || 'Proveedor Registrado'}</td>
                      <td class="py-3 px-4 text-slate-500">${t.categoryName || 'Construcción'}</td>
                      <td class="py-3 px-4 font-semibold text-slate-900">${formatCurrency(t.dailyPrice)}</td>
                      <td class="py-3 px-4">
                        ${isAvail ? `
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Disponible
                          </span>
                        ` : isRent ? `
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Alquilada
                          </span>
                        ` : `
                          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> En mantenimiento
                          </span>
                        `}
                      </td>
                      <td class="py-3 px-6 text-right whitespace-nowrap">
                        <a href="#/product/${t.id}" class="inline-flex p-1.5 text-slate-400 hover:text-brand-600 rounded-lg transition-colors mr-1" title="Ver detalle">
                          ${renderIcon('ExternalLink', 'w-4 h-4')}
                        </a>
                      </td>
                    </tr>
                  `;
                }).join('') : `
                  <tr>
                    <td colspan="7" class="py-8 text-center text-slate-400 text-xs">
                      No hay herramientas registradas en el catálogo.
                    </td>
                  </tr>
                `}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>

    <!-- Right Drawer: Nuevo Usuario -->
    <div id="drawer-new-user" class="fixed inset-0 z-50 overflow-hidden hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" id="drawer-new-user-backdrop"></div>
      <div class="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div class="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          <div class="p-6 overflow-y-auto space-y-6 flex-1">
            <div class="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 class="text-base font-bold text-slate-900 font-display">Nuevo usuario</h3>
              <button id="btn-close-new-user-drawer" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                ${renderIcon('X', 'w-5 h-5')}
              </button>
            </div>

            <form id="form-new-user" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Nombre completo *</label>
                <input type="text" id="nu-name" required maxlength="60" placeholder="Ej. María González" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-500" />
                <p class="text-[10px] text-slate-400 mt-0.5">Solo letras y espacios (máx. 60 caracteres)</p>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Correo electrónico *</label>
                <input type="email" id="nu-email" required maxlength="60" placeholder="ejemplo@correo.com" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-500" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Contraseña *</label>
                <div class="relative">
                  <input type="password" id="nu-password" required maxlength="50" placeholder="Mín. 8 caracteres" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-500" />
                  <button type="button" class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                    ${renderIcon('Eye', 'w-3.5 h-3.5')}
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-2">Rol *</label>
                <div class="grid grid-cols-2 gap-3" id="role-selector-cards">
                  <label class="relative border-2 border-brand-500 bg-orange-50/30 rounded-xl p-3 cursor-pointer flex flex-col justify-between transition-all" id="card-role-cliente">
                    <div class="flex items-center justify-between mb-2">
                      <div class="w-7 h-7 rounded-lg bg-orange-100 text-brand-600 flex items-center justify-center">
                        ${renderIcon('User', 'w-4 h-4')}
                      </div>
                      <input type="radio" name="nu-role" value="Cliente" checked class="text-brand-500 focus:ring-brand-400" />
                    </div>
                    <div>
                      <div class="text-xs font-bold text-slate-900">Cliente</div>
                      <div class="text-[10px] text-slate-500">Puede alquilar herramientas</div>
                    </div>
                  </label>

                  <label class="relative border-2 border-slate-200 bg-white rounded-xl p-3 cursor-pointer flex flex-col justify-between hover:border-slate-300 transition-all" id="card-role-proveedor">
                    <div class="flex items-center justify-between mb-2">
                      <div class="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                        ${renderIcon('Truck', 'w-4 h-4')}
                      </div>
                      <input type="radio" name="nu-role" value="Proveedor" class="text-brand-500 focus:ring-brand-400" />
                    </div>
                    <div>
                      <div class="text-xs font-bold text-slate-900">Proveedor</div>
                      <div class="text-[10px] text-slate-500">Puede publicar sus herramientas</div>
                    </div>
                  </label>
                </div>
              </div>
            </form>
          </div>

          <div class="p-6 border-t border-slate-100 bg-slate-50/50 space-y-2">
            <button type="submit" form="form-new-user" class="btn-primary w-full !py-2.5 text-xs font-semibold shadow-sm">
              Crear usuario
            </button>
            <button type="button" id="btn-cancel-new-user-drawer" class="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-2 rounded-lg text-xs font-semibold transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Editar Usuario -->
    <div id="modal-edit-user" class="fixed inset-0 z-50 overflow-y-auto hidden flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" id="modal-edit-user-backdrop"></div>
      <div class="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 class="text-base font-bold text-slate-900">Editar usuario</h3>
          <button id="btn-close-edit-user-modal" class="text-slate-400 hover:text-slate-600">
            ${renderIcon('X', 'w-5 h-5')}
          </button>
        </div>

        <form id="form-edit-user" class="space-y-4">
          <input type="hidden" id="eu-id" />
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Nombre completo</label>
            <input type="text" id="eu-name" required maxlength="60" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-500" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Correo electrónico</label>
            <input type="email" id="eu-email" required maxlength="60" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-500" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Rol</label>
            <select id="eu-role" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-500">
              <option value="Cliente">Cliente</option>
              <option value="Proveedor">Proveedor</option>
              <option value="Administrador">Administrador</option>
            </select>
          </div>

          <div class="flex gap-3 pt-2">
            <button type="submit" class="btn-primary flex-1 !py-2.5 text-xs font-semibold shadow-sm">
              Guardar cambios
            </button>
            <button type="button" id="btn-cancel-edit-user" class="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-2 rounded-lg text-xs font-semibold transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal: Eliminar Usuario -->
    <div id="modal-delete-user" class="fixed inset-0 z-50 overflow-y-auto hidden flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" id="modal-delete-user-backdrop"></div>
      <div class="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-base font-bold text-slate-900">Eliminar usuario</h3>
          <button id="btn-close-delete-user-modal" class="text-slate-400 hover:text-slate-600">
            ${renderIcon('X', 'w-5 h-5')}
          </button>
        </div>

        <p class="text-xs text-slate-500">
          ¿Estás seguro de que deseas eliminar a este usuario? Esta acción no se puede deshacer.
        </p>

        <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <img id="du-avatar" src="" class="w-9 h-9 rounded-full object-cover" />
          <div>
            <div id="du-name" class="text-xs font-bold text-slate-900"></div>
            <div id="du-email" class="text-[11px] text-slate-500"></div>
          </div>
        </div>

        <div class="flex gap-3 pt-2">
          <button type="button" id="btn-cancel-delete-user" class="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-2 rounded-lg text-xs font-semibold transition-colors">
            Cancelar
          </button>
          <button type="button" id="btn-confirm-delete-user" class="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2 rounded-lg text-xs font-semibold transition-colors shadow-sm">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  `;

  // Render users table with filtering
  function renderUsersTable() {
    const tbody = container.querySelector('#users-table-body');
    if (!tbody) return;

    // Dynamically update tab badges
    const countAll = container.querySelector('#count-all');
    const countClients = container.querySelector('#count-clients');
    const countProviders = container.querySelector('#count-providers');
    const countAdmins = container.querySelector('#count-admins');
    if (countAll) countAll.textContent = usersList.length;
    if (countClients) countClients.textContent = usersList.filter(u => u.role === 'Cliente').length;
    if (countProviders) countProviders.textContent = usersList.filter(u => u.role === 'Proveedor').length;
    if (countAdmins) countAdmins.textContent = usersList.filter(u => u.role === 'Administrador').length;

    let filtered = [...usersList];

    // Filter by tab
    if (currentTab === 'client') filtered = filtered.filter(u => u.role === 'Cliente');
    if (currentTab === 'provider') filtered = filtered.filter(u => u.role === 'Proveedor');
    if (currentTab === 'admin') filtered = filtered.filter(u => u.role === 'Administrador');

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="py-10 text-center text-slate-400 text-xs">
            No se encontraron usuarios con el criterio seleccionado.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(u => {
      const roleColor = u.role === 'Cliente'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : u.role === 'Proveedor'
        ? 'bg-blue-50 text-blue-700 border-blue-200'
        : 'bg-purple-50 text-purple-700 border-purple-200';

      const statusBadge = `
        <button type="button" class="btn-toggle-user-status inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border cursor-pointer transition-colors ${
          u.active
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
        }" data-id="${u.id}" data-active="${u.active}" title="Haz clic para alternar activación del usuario">
          <span class="w-1.5 h-1.5 rounded-full ${u.active ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
          ${u.active ? 'Activo' : 'Inactivo'}
        </button>
      `;

      return `
        <tr class="hover:bg-slate-50/50 transition-colors">
          <td class="py-3 px-6">
            <input type="checkbox" class="rounded border-slate-300 text-brand-500 focus:ring-brand-400" />
          </td>
          <td class="py-3 px-4">
            <div class="flex items-center gap-3">
              <img src="${u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}" class="w-8 h-8 rounded-full object-cover border border-slate-200" />
              <span class="font-semibold text-slate-900">${u.name}</span>
            </div>
          </td>
          <td class="py-3 px-4 text-slate-500 font-mono text-[11px]">${u.email}</td>
          <td class="py-3 px-4">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${roleColor}">
              ${u.role}
            </span>
          </td>
          <td class="py-3 px-4 text-slate-500">${u.date}</td>
          <td class="py-3 px-4">${statusBadge}</td>
          <td class="py-3 px-6 text-right whitespace-nowrap">
            <button class="btn-edit-user p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors mr-1" data-id="${u.id}">
              ${renderIcon('Edit', 'w-4 h-4')}
            </button>
            <button class="btn-delete-user p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors" data-id="${u.id}">
              ${renderIcon('Trash2', 'w-4 h-4')}
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Wire status toggle buttons to backend
    tbody.querySelectorAll('.btn-toggle-user-status').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const currentActive = btn.dataset.active === 'true';
        const newStatus = !currentActive;
        try {
          btn.disabled = true;
          await api.patch(`/users/${id}/status`, { enabled: newStatus });
          const u = usersList.find(x => x.id === id);
          if (u) u.active = newStatus;
          renderUsersTable();
          showToast(`Usuario ${newStatus ? 'habilitado' : 'desactivado'} con éxito en PostgreSQL`, 'success');
        } catch (err) {
          showToast(err.message || 'No se pudo alternar el estado del usuario', 'error');
          btn.disabled = false;
        }
      });
    });

    // Wire edit buttons
    tbody.querySelectorAll('.btn-edit-user').forEach(btn => {
      btn.addEventListener('click', () => {
        const u = usersList.find(x => x.id === btn.dataset.id);
        if (!u) return;
        openEditUserModal(u);
      });
    });

    // Wire delete buttons
    tbody.querySelectorAll('.btn-delete-user').forEach(btn => {
      btn.addEventListener('click', () => {
        const u = usersList.find(x => x.id === btn.dataset.id);
        if (!u) return;
        openDeleteUserModal(u);
      });
    });
  }

  renderUsersTable();

  // Search input binding
  container.querySelector('#user-search-input')?.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderUsersTable();
  });

  // Tab filtering
  container.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.admin-tab-btn').forEach(b => {
        b.className = 'admin-tab-btn py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900';
      });
      btn.className = 'admin-tab-btn py-3 border-b-2 border-brand-500 text-brand-600 font-semibold';
      currentTab = btn.dataset.tab;
      renderUsersTable();
    });
  });

  // Accordion toggle for Herramientas
  const accToggle = container.querySelector('#tools-accordion-toggle');
  const accContent = container.querySelector('#tools-accordion-content');
  const accChevron = container.querySelector('#tools-accordion-chevron');
  if (accToggle && accContent) {
    accToggle.addEventListener('click', () => {
      accContent.classList.toggle('hidden');
      accChevron?.classList.toggle('rotate-180');
    });
  }

  // Drawer: Nuevo Usuario
  const drawerNewUser = container.querySelector('#drawer-new-user');
  const btnOpenDrawer = container.querySelector('#btn-open-new-user-drawer');
  const btnCloseDrawer = container.querySelector('#btn-close-new-user-drawer');
  const btnCancelDrawer = container.querySelector('#btn-cancel-new-user-drawer');
  const backdropDrawer = container.querySelector('#drawer-new-user-backdrop');

  function openDrawer() {
    drawerNewUser?.classList.remove('hidden');
  }
  function closeDrawer() {
    drawerNewUser?.classList.add('hidden');
  }

  btnOpenDrawer?.addEventListener('click', openDrawer);
  btnCloseDrawer?.addEventListener('click', closeDrawer);
  btnCancelDrawer?.addEventListener('click', closeDrawer);
  backdropDrawer?.addEventListener('click', closeDrawer);

  // Role selector cards inside Drawer
  const cardRoleCliente = container.querySelector('#card-role-cliente');
  const cardRoleProveedor = container.querySelector('#card-role-proveedor');
  cardRoleCliente?.addEventListener('click', () => {
    cardRoleCliente.className = 'relative border-2 border-brand-500 bg-orange-50/30 rounded-xl p-3 cursor-pointer flex flex-col justify-between transition-all';
    cardRoleProveedor.className = 'relative border-2 border-slate-200 bg-white rounded-xl p-3 cursor-pointer flex flex-col justify-between hover:border-slate-300 transition-all';
  });
  cardRoleProveedor?.addEventListener('click', () => {
    cardRoleProveedor.className = 'relative border-2 border-brand-500 bg-orange-50/30 rounded-xl p-3 cursor-pointer flex flex-col justify-between transition-all';
    cardRoleCliente.className = 'relative border-2 border-slate-200 bg-white rounded-xl p-3 cursor-pointer flex flex-col justify-between hover:border-slate-300 transition-all';
  });

  // Live input sanitizers for admin forms
  const nuName = container.querySelector('#nu-name');
  if (nuName) {
    nuName.addEventListener('input', (e) => {
      const clean = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]/g, '').slice(0, 60);
      if (e.target.value !== clean) e.target.value = clean;
    });
  }
  const euName = container.querySelector('#eu-name');
  if (euName) {
    euName.addEventListener('input', (e) => {
      const clean = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]/g, '').slice(0, 60);
      if (e.target.value !== clean) e.target.value = clean;
    });
  }

  // Form submit: Nuevo Usuario
  container.querySelector('#form-new-user')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = container.querySelector('#nu-name')?.value.trim();
    const email = container.querySelector('#nu-email')?.value.trim();
    const password = container.querySelector('#nu-password')?.value || 'ToolRent2026*';
    const roleRadio = container.querySelector('input[name="nu-role"]:checked')?.value || 'Cliente';
    const roleCode = roleRadio === 'Proveedor' ? 'ROLE_PROVEEDOR' : 'ROLE_CLIENTE';

    // Generar un username limpio a partir del nombre o email
    const baseUsername = email ? email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_') : fullName.toLowerCase().replace(/\s+/g, '_');
    const username = `${baseUsername}_${Date.now().toString().slice(-4)}`;

    try {
      await api.post('/auth/register', {
        username,
        email,
        password,
        roles: [roleCode],
        fullName
      });

      // Recargar lista completa de usuarios desde backend
      const rawUsers = await api.get('/users').catch(() => []);
      if (Array.isArray(rawUsers) && rawUsers.length > 0) {
        usersList = rawUsers.map(u => {
          const isClient = u.roles?.some(r => r.includes('CLIENTE'));
          const isProvider = u.roles?.some(r => r.includes('PROVEEDOR'));
          const isAdmin = u.roles?.some(r => r.includes('ADMIN'));
          const roleLabel = isAdmin ? 'Administrador' : isProvider ? 'Proveedor' : 'Cliente';
          return {
            id: u.id,
            name: u.username,
            email: u.email,
            role: roleLabel,
            date: '14 oct 2026',
            active: u.enabled !== false,
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.username)}`
          };
        });
      }

      renderUsersTable();
      closeDrawer();
      e.target.reset();
      showToast(`Usuario ${username} creado con éxito en PostgreSQL`, 'success');
    } catch (err) {
      showToast(err.message || 'Error al crear usuario en el servidor', 'error');
    }
  });

  // Modal: Editar Usuario
  const modalEdit = container.querySelector('#modal-edit-user');
  const btnCloseEdit = container.querySelector('#btn-close-edit-user-modal');
  const btnCancelEdit = container.querySelector('#btn-cancel-edit-user');
  const backdropEdit = container.querySelector('#modal-edit-user-backdrop');

  function openEditUserModal(u) {
    container.querySelector('#eu-id').value = u.id;
    container.querySelector('#eu-name').value = u.name;
    container.querySelector('#eu-email').value = u.email;
    container.querySelector('#eu-role').value = u.role;
    modalEdit?.classList.remove('hidden');
  }

  function closeEditModal() {
    modalEdit?.classList.add('hidden');
  }

  btnCloseEdit?.addEventListener('click', closeEditModal);
  btnCancelEdit?.addEventListener('click', closeEditModal);
  backdropEdit?.addEventListener('click', closeEditModal);

  container.querySelector('#form-edit-user')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = container.querySelector('#eu-id').value;
    const email = container.querySelector('#eu-email').value.trim();
    const roleVal = container.querySelector('#eu-role').value;
    const roleMap = {
      'Administrador': 'ROLE_ADMIN',
      'Proveedor': 'ROLE_PROVEEDOR',
      'Cliente': 'ROLE_CLIENTE'
    };
    const roleCode = roleMap[roleVal] || 'ROLE_CLIENTE';

    try {
      await api.put(`/users/${id}`, {
        email,
        roles: [roleCode]
      });

      const u = usersList.find(x => x.id === id);
      if (u) {
        u.email = email;
        u.role = roleVal;
      }
      renderUsersTable();
      closeEditModal();
      showToast('Usuario actualizado exitosamente en PostgreSQL', 'success');
    } catch (err) {
      showToast(err.message || 'Error al actualizar usuario', 'error');
    }
  });

  // Modal: Eliminar / Desactivar Usuario
  let userToDelete = null;
  const modalDelete = container.querySelector('#modal-delete-user');
  const btnCloseDelete = container.querySelector('#btn-close-delete-user-modal');
  const btnCancelDelete = container.querySelector('#btn-cancel-delete-user');
  const btnConfirmDelete = container.querySelector('#btn-confirm-delete-user');
  const backdropDelete = container.querySelector('#modal-delete-user-backdrop');

  function openDeleteUserModal(u) {
    userToDelete = u;
    container.querySelector('#du-avatar').src = u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100';
    container.querySelector('#du-name').textContent = u.name;
    container.querySelector('#du-email').textContent = u.email;
    modalDelete?.classList.remove('hidden');
  }

  function closeDeleteModal() {
    userToDelete = null;
    modalDelete?.classList.add('hidden');
  }

  btnCloseDelete?.addEventListener('click', closeDeleteModal);
  btnCancelDelete?.addEventListener('click', closeDeleteModal);
  backdropDelete?.addEventListener('click', closeDeleteModal);

  btnConfirmDelete?.addEventListener('click', async () => {
    if (userToDelete) {
      try {
        await api.patch(`/users/${userToDelete.id}/status`, { enabled: false });
        userToDelete.active = false;
        renderUsersTable();
        closeDeleteModal();
        showToast(`Acceso del usuario ${userToDelete.name} revocado (desactivado en PostgreSQL)`, 'success');
      } catch (err) {
        showToast(err.message || 'Error al desactivar el usuario', 'error');
      }
    }
  });
}

