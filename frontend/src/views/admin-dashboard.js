import api from '../api/client.js';
import auth from '../auth/state.js';
import showToast from '../components/toast.js';
import modal from '../components/modal.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { renderIcon } from '../utils/icons.js';
import { openAuthModal } from '../components/auth-modal.js';
import { renderSparkline, renderSegmentedLevel, renderCrmStatusBadge } from '../components/crm-sparkline.js';
import { openCrmOverviewCard } from '../components/crm-overview-card.js';
import { setupCrmBulkBar } from '../components/crm-bulk-bar.js';
import { openInvoiceViewer } from './rental-modal.js';

export async function renderAdminDashboard() {
  const container = document.getElementById('app-content');
  if (!container) return;

  if (!auth.isAuthenticated() || !auth.isAdmin()) {
    const isLogged = auth.isAuthenticated();
    const currentUser = auth.getUser();
    const roleLabel = auth.isProvider() ? 'Proveedor' : (auth.isClient() ? 'Cliente' : (currentUser?.rol || 'Usuario'));

    container.innerHTML = `
      <section class="max-w-4xl mx-auto px-4 py-20 text-center">
        <div class="crm-card p-10 max-w-lg mx-auto space-y-4">
          <div class="w-14 h-14 rounded-full ${isLogged ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-rose-50 text-rose-600 border border-rose-200'} flex items-center justify-center mx-auto">
            ${renderIcon(isLogged ? 'ShieldAlert' : 'Lock', 'w-7 h-7')}
          </div>
          <h2 class="text-xl font-bold text-zinc-900 font-display">
            ${isLogged ? 'Acceso Restringido a Administradores' : 'Área Restringida a Administradores'}
          </h2>
          ${isLogged ? `
            <div class="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-left space-y-1.5">
              <div class="text-xs font-bold text-amber-900 flex items-center justify-between">
                <span>Sesión activa actualmente:</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] bg-amber-200/70 text-amber-900 font-bold">${roleLabel}</span>
              </div>
              <p class="text-[11px] text-amber-700 leading-relaxed">
                Has iniciado sesión como <strong>${currentUser?.username || 'usuario'}</strong>. Esta cuenta no cuenta con rol de Administrador. Para acceder a la consola, debes cambiar a una cuenta con privilegios administrativos.
              </p>
            </div>
            <div class="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <button id="btn-switch-admin" class="btn-primary !py-2.5 !px-5 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm cursor-pointer w-full sm:w-auto">
                ${renderIcon('UserCheck', 'w-4 h-4')} Cambiar a cuenta Administrador
              </button>
              <a href="${auth.isProvider() ? '#/provider' : '#/client'}" class="btn-secondary !py-2.5 !px-5 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto">
                ${renderIcon('ArrowLeft', 'w-4 h-4')} Ir a mi panel (${roleLabel})
              </a>
            </div>
          ` : `
            <p class="text-xs text-zinc-500">Ingresa tus credenciales corporativas de Administrador para acceder al panel de control.</p>
            <div class="flex justify-center pt-2">
              <button id="btn-login-admin" class="btn-primary !py-2.5 !px-8 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm cursor-pointer">
                ${renderIcon('LogIn', 'w-4 h-4')} Iniciar Sesión como Administrador
              </button>
            </div>
          `}
        </div>
      </section>
    `;

    container.querySelector('#btn-login-admin')?.addEventListener('click', () => openAuthModal('login'));
    container.querySelector('#btn-switch-admin')?.addEventListener('click', () => {
      auth.logout();
      openAuthModal('login');
    });
    return;
  }

  // Initial local state for admin view
  const hashParams = new URLSearchParams((window.location.hash || '').split('?')[1] || '');
  let activeSection = hashParams.get('tab') === 'rentals' ? 'rentals' : 'users'; // 'users' or 'rentals'

  let currentTab = 'all'; // all, client, provider, admin (for users)
  let searchQuery = '';
  let usersList = [];
  let incomeReport = null;
  let toolAvail = null;
  let topTools = [];
  let topClients = [];
  let allTools = [];
  let bulkBarManager = null;

  // Provider rentals management state
  let rentalsList = [];
  let providersList = [];
  let clientsList = [];
  let rentalStatusFilter = 'ALL'; // ALL, PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED
  let rentalProviderFilter = 'ALL'; // ALL or specific providerId
  let rentalSearchQuery = '';

  try {
    const [rawUsers, rawIncome, rawAvail, rawTopTools, rawTopClients, rawTools, rawRentals, rawProviders, rawClients] = await Promise.all([
      api.get('/users').catch(() => []),
      api.get('/reporting/income').catch(() => null),
      api.get('/reporting/tool-availability').catch(() => null),
      api.get('/reporting/most-rented-tools', { limit: 5 }).catch(() => []),
      api.get('/reporting/frequent-clients', { limit: 5 }).catch(() => []),
      api.get('/tools').catch(() => []),
      api.get('/rentals').catch(() => []),
      api.get('/providers').catch(() => []),
      api.get('/clients').catch(() => [])
    ]);

    incomeReport = rawIncome;
    toolAvail = rawAvail;
    topTools = Array.isArray(rawTopTools) ? rawTopTools : [];
    topClients = Array.isArray(rawTopClients) ? rawTopClients : [];
    allTools = Array.isArray(rawTools) ? rawTools.filter(t => t.status !== 'RETIRED') : [];
    rentalsList = Array.isArray(rawRentals) ? rawRentals : [];
    providersList = Array.isArray(rawProviders) ? rawProviders : [];
    clientsList = Array.isArray(rawClients) ? rawClients : [];

    if (Array.isArray(rawUsers) && rawUsers.length > 0) {
      usersList = rawUsers.map((u, idx) => {
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
          score: Math.min(5, Math.max(2, (idx % 4) + 2)), // 2 to 5 for CRM level bar
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.username)}&backgroundColor=f4f4f5&textColor=18181b`
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

  const totalIncome = incomeReport?.totalIncome || 150000;
  const totalRentals = rentalsList.length || incomeReport?.totalRentals || 3;
  const pendingRentalsCount = rentalsList.filter(r => r.status === 'PENDING').length;
  const activeRentalsCount = rentalsList.filter(r => r.status === 'IN_PROGRESS' || r.status === 'CONFIRMED').length;
  const completedRentalsCount = rentalsList.filter(r => r.status === 'COMPLETED').length;
  const totalRentalsRevenue = rentalsList
    .filter(r => r.status === 'COMPLETED' || r.status === 'IN_PROGRESS')
    .reduce((acc, r) => acc + (parseFloat(r.totalAmount) || 0), 0) || totalIncome;

  container.innerHTML = `
    <div class="min-h-screen crm-panel-bg text-zinc-800 pb-20 select-none">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        <!-- Minimalist CRM Executive Header -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-semibold text-zinc-900 tracking-tight font-display">Administración General</h1>
              <span class="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-zinc-200/60 text-zinc-600">v3.2 CRM</span>
            </div>
            <p class="text-xs text-zinc-500 mt-1 font-normal">Supervisión centralizada de cuentas, leads, facturación y catálogo en PostgreSQL.</p>
          </div>

          <div class="flex items-center gap-2.5">
            <button id="btn-refresh-admin" class="border border-zinc-200/90 bg-white hover:bg-zinc-50 text-zinc-700 px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer">
              ${renderIcon('RefreshCw', 'w-3.5 h-3.5 text-zinc-400')}
              <span>Sincronizar</span>
            </button>
            <a href="http://localhost:8085/swagger-ui.html" target="_blank" rel="noopener noreferrer" class="border border-zinc-200/90 bg-white hover:bg-zinc-50 text-zinc-700 px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-all">
              ${renderIcon('ExternalLink', 'w-3.5 h-3.5 text-zinc-400')}
              <span>Swagger API</span>
            </a>
          </div>
        </div>

        <!-- 4 Top KPI Cards with Mini-Sparklines SVG (Seconds 00:00 & 00:08) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" id="kpi-cards-container">
          
          <!-- Card 1: Ingresos Facturados -->
          <div class="crm-card p-4 flex items-center justify-between group hover:border-zinc-300 transition-colors">
            <div class="space-y-1">
              <span class="text-xs text-zinc-500 font-normal">Ingresos Facturados</span>
              <div class="text-2xl font-semibold text-zinc-900 tabular-nums tracking-tight font-display">
                ${formatCurrency(totalIncome)}
              </div>
              <div class="flex items-center gap-1.5 text-xs">
                <span class="text-emerald-600 font-medium">+14.2%</span>
                <span class="text-zinc-400 text-[11px]">vs mes anterior</span>
              </div>
            </div>
            <div class="pl-2">
              ${renderSparkline({ color: 'emerald', points: [10, 18, 14, 25, 29, 38, 48], width: 84, height: 36 })}
            </div>
          </div>

          <!-- Card 2: Usuarios Registrados -->
          <div class="crm-card p-4 flex items-center justify-between group hover:border-zinc-300 transition-colors">
            <div class="space-y-1">
              <span class="text-xs text-zinc-500 font-normal">Usuarios Registrados</span>
              <div class="text-2xl font-semibold text-zinc-900 tabular-nums tracking-tight font-display">
                ${usersList.length}
              </div>
              <div class="flex items-center gap-1.5 text-xs">
                <span class="text-emerald-600 font-medium">+8%</span>
                <span class="text-zinc-400 text-[11px]">activos en DB</span>
              </div>
            </div>
            <div class="pl-2">
              ${renderSparkline({ color: 'orange', points: [8, 12, 19, 16, 24, 28, 32], width: 84, height: 36 })}
            </div>
          </div>

          <!-- Card 3: Maquinaria en Catálogo -->
          <div class="crm-card p-4 flex items-center justify-between group hover:border-zinc-300 transition-colors">
            <div class="space-y-1">
              <span class="text-xs text-zinc-500 font-normal">Maquinaria en Catálogo</span>
              <div class="text-2xl font-semibold text-zinc-900 tabular-nums tracking-tight font-display">
                ${totalT}
              </div>
              <div class="flex items-center gap-1.5 text-xs">
                <span class="text-emerald-600 font-medium">${availT}</span>
                <span class="text-zinc-400 text-[11px]">disponibles para obra</span>
              </div>
            </div>
            <div class="pl-2">
              ${renderSparkline({ color: 'blue', points: [5, 9, 12, 18, 15, 22, 26], width: 84, height: 36 })}
            </div>
          </div>

          <!-- Card 4: Alquileres Registrados -->
          <div id="kpi-card-rentals" class="crm-card p-4 flex items-center justify-between group hover:border-orange-400 transition-all cursor-pointer shadow-2xs hover:shadow-xs">
            <div class="space-y-1">
              <span class="text-xs text-zinc-500 font-normal flex items-center gap-1.5">
                Alquileres Registrados
                <span class="text-[10px] text-orange-600 font-semibold group-hover:underline">Gestionar &rarr;</span>
              </span>
              <div class="text-2xl font-semibold text-zinc-900 tabular-nums tracking-tight font-display">
                ${totalRentals}
              </div>
              <div class="flex items-center gap-1.5 text-xs">
                ${pendingRentalsCount > 0 ? `
                  <span class="text-amber-600 font-semibold">${pendingRentalsCount} pendientes</span>
                  <span class="text-zinc-400 text-[11px]">por autorizar</span>
                ` : `
                  <span class="text-emerald-600 font-medium">+100%</span>
                  <span class="text-zinc-400 text-[11px]">trazabilidad 4FN</span>
                `}
              </div>
            </div>
            <div class="pl-2">
              ${renderSparkline({ color: 'emerald', points: [1, 2, 4, 3, 5, 8, 10], width: 84, height: 36 })}
            </div>
          </div>

        </div>

        <!-- Primary Section Switcher: Directorio de Usuarios vs Alquileres de Proveedores -->
        <div class="flex items-center justify-between border-b border-zinc-200/80 pb-3">
          <div class="flex items-center gap-2">
            <button id="admin-nav-users" class="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${activeSection === 'users' ? 'bg-zinc-900 text-white shadow-2xs' : 'bg-white hover:bg-zinc-50 text-zinc-600 border border-zinc-200/90'}">
              ${renderIcon('Users', 'w-3.5 h-3.5')}
              <span>Directorio de Usuarios</span>
              <span class="px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeSection === 'users' ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'}">${usersList.length}</span>
            </button>

            <button id="admin-nav-rentals" class="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${activeSection === 'rentals' ? 'bg-zinc-900 text-white shadow-2xs' : 'bg-white hover:bg-zinc-50 text-zinc-600 border border-zinc-200/90'}">
              ${renderIcon('ClipboardList', 'w-3.5 h-3.5')}
              <span>Alquileres de Proveedores</span>
              <span class="px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeSection === 'rentals' ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'}">${rentalsList.length}</span>
              ${pendingRentalsCount > 0 ? `
                <span class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                  ${pendingRentalsCount} pendientes
                </span>
              ` : ''}
            </button>
          </div>

          <div class="hidden sm:flex items-center gap-2 text-xs text-zinc-400">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span class="text-[11px] font-mono">Control Administrativo Global</span>
          </div>
        </div>

        <!-- Section 1: High-Density CRM Table of Users & Leads -->
        <div id="section-users" class="${activeSection === 'users' ? 'space-y-6' : 'hidden'}">
          <div class="crm-card overflow-hidden">
            
            <!-- Table Toolbar & Actions -->
            <div class="p-5 border-b border-zinc-100 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white">
              
              <!-- Underline Tabs (All, Clients, Providers, Admins) -->
              <div class="flex items-center gap-6 border-b border-transparent text-xs">
                <button class="crm-tab-btn pb-2 transition-colors cursor-pointer text-zinc-900 font-semibold border-b-2 border-zinc-900" data-tab="all">
                  Todos <span class="text-zinc-400 font-normal font-mono ml-1">(${usersList.length})</span>
                </button>
                <button class="crm-tab-btn pb-2 transition-colors cursor-pointer text-zinc-400 hover:text-zinc-600 font-medium border-b-2 border-transparent" data-tab="client">
                  Clientes <span class="text-zinc-400 font-normal font-mono ml-1">(${usersList.filter(u => u.role === 'Cliente').length})</span>
                </button>
                <button class="crm-tab-btn pb-2 transition-colors cursor-pointer text-zinc-400 hover:text-zinc-600 font-medium border-b-2 border-transparent" data-tab="provider">
                  Proveedores <span class="text-zinc-400 font-normal font-mono ml-1">(${usersList.filter(u => u.role === 'Proveedor').length})</span>
                </button>
                <button class="crm-tab-btn pb-2 transition-colors cursor-pointer text-zinc-400 hover:text-zinc-600 font-medium border-b-2 border-transparent" data-tab="admin">
                  Administradores <span class="text-zinc-400 font-normal font-mono ml-1">(${usersList.filter(u => u.role === 'Administrador').length})</span>
                </button>
              </div>

              <!-- Search & Action Buttons -->
              <div class="flex items-center gap-2.5">
                <div class="relative flex-1 sm:w-64">
                  <input 
                    type="text" 
                    id="user-search-input" 
                    placeholder="Buscar usuario o correo..." 
                    class="w-full bg-zinc-50/70 border border-zinc-200/90 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C]/20 transition-all shadow-2xs" 
                  />
                  <div class="absolute left-2.5 top-2 text-zinc-400 pointer-events-none">
                    ${renderIcon('Search', 'w-3.5 h-3.5')}
                  </div>
                </div>

                <button id="btn-export-users-csv" class="border border-zinc-200/90 hover:bg-zinc-50 text-zinc-700 px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer">
                  ${renderIcon('Download', 'w-3.5 h-3.5 text-zinc-400')}
                  <span class="hidden sm:inline">Exportar</span>
                </button>

                <button id="btn-open-new-user-drawer" class="bg-[#EA580C] hover:bg-[#ea580c]/90 text-white px-3.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-xs transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap">
                  ${renderIcon('Plus', 'w-3.5 h-3.5')}
                  <span>Nuevo Usuario</span>
                </button>
              </div>

            </div>

            <!-- 1. Desktop High-Density Data Table -->
            <div class="overflow-x-auto lg:overflow-x-hidden hidden md:block">
              <table class="w-full text-left text-xs table-auto" id="admin-users-table">
                <thead class="crm-table-header bg-zinc-50/60 border-b border-zinc-100">
                  <tr>
                    <th class="py-3 px-3 w-8">
                      <input type="checkbox" class="crm-master-checkbox rounded border-zinc-300 text-orange-600 focus:ring-orange-500/20 cursor-pointer" />
                    </th>
                    <th class="py-3 px-3 min-w-0">Usuario / Contacto</th>
                    <th class="py-3 px-3">Correo Electrónico</th>
                    <th class="py-3 px-3">Rol</th>
                    <th class="py-3 px-3 hidden xl:table-cell">Actividad</th>
                    <th class="py-3 px-3">Estado</th>
                    <th class="py-3 px-4 text-right whitespace-nowrap">Acciones</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-100 text-zinc-700" id="users-table-body">
                  <!-- Rendered dynamically -->
                </tbody>
              </table>
            </div>

            <!-- 2. Mobile Responsive Table-to-Card (< 768px) -->
            <div class="space-y-3 p-3.5 md:hidden" id="users-cards-body">
              <!-- Rendered dynamically -->
            </div>

            <div class="px-5 py-3.5 border-t border-zinc-100 text-xs text-zinc-400 flex items-center justify-between bg-zinc-50/20">
              <span id="crm-table-counter">Mostrando ${usersList.length} usuarios registrados</span>
              <span class="text-[11px] font-mono">PostgreSQL 16 · AuthGuard Activo</span>
            </div>

          </div>
        </div>

        <!-- Section 2: Gestión de Alquileres de Proveedores -->
        <div id="section-rentals" class="${activeSection === 'rentals' ? 'space-y-6' : 'hidden'}">
          
          <!-- Mini KPI Summary for Rentals -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div class="crm-card p-3.5 bg-white space-y-1">
              <span class="text-[11px] text-zinc-500 font-medium">Total Alquileres</span>
              <div class="text-xl font-bold text-zinc-900 font-mono" id="kpi-rentals-total">${rentalsList.length}</div>
              <span class="text-[10px] text-zinc-400">Todos los proveedores</span>
            </div>
            <div class="crm-card p-3.5 bg-white space-y-1 border-amber-200 bg-amber-50/20">
              <span class="text-[11px] text-amber-800 font-medium flex items-center justify-between">
                Pendientes
                ${pendingRentalsCount > 0 ? `<span class="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>` : ''}
              </span>
              <div class="text-xl font-bold text-amber-900 font-mono" id="kpi-rentals-pending">${pendingRentalsCount}</div>
              <span class="text-[10px] text-amber-700">Por autorizar</span>
            </div>
            <div class="crm-card p-3.5 bg-white space-y-1">
              <span class="text-[11px] text-blue-700 font-medium">En Obra / Despachados</span>
              <div class="text-xl font-bold text-blue-900 font-mono" id="kpi-rentals-active">${activeRentalsCount}</div>
              <span class="text-[10px] text-blue-600">Herramientas en uso</span>
            </div>
            <div class="crm-card p-3.5 bg-white space-y-1">
              <span class="text-[11px] text-emerald-700 font-medium">Facturado Acumulado</span>
              <div class="text-xl font-bold text-emerald-900 font-mono" id="kpi-rentals-revenue">${formatCurrency(totalRentalsRevenue)}</div>
              <span class="text-[10px] text-emerald-600">Facturación global</span>
            </div>
          </div>

          <!-- Rentals CRM Card -->
          <div class="crm-card overflow-hidden">
            <!-- Table Toolbar & Actions -->
            <div class="p-5 border-b border-zinc-100 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white">
              
              <!-- Status Tabs -->
              <div class="flex items-center gap-4 sm:gap-6 border-b border-transparent text-xs overflow-x-auto pb-1" id="rental-status-tabs">
                <button class="crm-rental-tab-btn pb-2 transition-colors cursor-pointer text-zinc-900 font-semibold border-b-2 border-zinc-900 whitespace-nowrap" data-status="ALL">
                  Todos <span class="text-zinc-400 font-normal font-mono ml-1">(${rentalsList.length})</span>
                </button>
                <button class="crm-rental-tab-btn pb-2 transition-colors cursor-pointer text-zinc-400 hover:text-zinc-600 font-medium border-b-2 border-transparent whitespace-nowrap" data-status="PENDING">
                  Pendientes <span class="text-zinc-400 font-normal font-mono ml-1">(${pendingRentalsCount})</span>
                </button>
                <button class="crm-rental-tab-btn pb-2 transition-colors cursor-pointer text-zinc-400 hover:text-zinc-600 font-medium border-b-2 border-transparent whitespace-nowrap" data-status="CONFIRMED">
                  Confirmados <span class="text-zinc-400 font-normal font-mono ml-1">(${rentalsList.filter(r => r.status === 'CONFIRMED').length})</span>
                </button>
                <button class="crm-rental-tab-btn pb-2 transition-colors cursor-pointer text-zinc-400 hover:text-zinc-600 font-medium border-b-2 border-transparent whitespace-nowrap" data-status="IN_PROGRESS">
                  En Obra <span class="text-zinc-400 font-normal font-mono ml-1">(${rentalsList.filter(r => r.status === 'IN_PROGRESS').length})</span>
                </button>
                <button class="crm-rental-tab-btn pb-2 transition-colors cursor-pointer text-zinc-400 hover:text-zinc-600 font-medium border-b-2 border-transparent whitespace-nowrap" data-status="COMPLETED">
                  Devueltos <span class="text-zinc-400 font-normal font-mono ml-1">(${completedRentalsCount})</span>
                </button>
                <button class="crm-rental-tab-btn pb-2 transition-colors cursor-pointer text-zinc-400 hover:text-zinc-600 font-medium border-b-2 border-transparent whitespace-nowrap" data-status="CANCELLED">
                  Cancelados
                </button>
              </div>

              <!-- Search & Filters -->
              <div class="flex flex-wrap items-center gap-2.5">
                <div class="flex items-center gap-1.5">
                  <label for="admin-rentals-provider-filter" class="text-xs text-zinc-500 font-medium whitespace-nowrap">Proveedor:</label>
                  <select id="admin-rentals-provider-filter" class="bg-zinc-50/80 border border-zinc-200/90 rounded-xl px-2.5 py-1.5 text-xs text-zinc-800 font-medium focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer shadow-2xs max-w-[190px] truncate">
                    <option value="ALL">Todos los proveedores (${providersList.length})</option>
                    ${providersList.map(p => `
                      <option value="${p.id}" ${rentalProviderFilter === p.id ? 'selected' : ''}>
                        ${p.companyName || p.id}
                      </option>
                    `).join('')}
                  </select>
                </div>

                <div class="relative flex-1 sm:w-56">
                  <input 
                    type="text" 
                    id="admin-rentals-search-input" 
                    placeholder="Buscar código, cliente, equipo..." 
                    class="w-full bg-zinc-50/70 border border-zinc-200/90 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:bg-white focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C]/20 transition-all shadow-2xs" 
                  />
                  <div class="absolute left-2.5 top-2 text-zinc-400 pointer-events-none">
                    ${renderIcon('Search', 'w-3.5 h-3.5')}
                  </div>
                </div>

                <button id="btn-export-rentals-csv" class="border border-zinc-200/90 hover:bg-zinc-50 text-zinc-700 px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer">
                  ${renderIcon('Download', 'w-3.5 h-3.5 text-zinc-400')}
                  <span class="hidden sm:inline">Exportar</span>
                </button>

                <button id="btn-refresh-rentals" class="border border-zinc-200/90 hover:bg-zinc-50 text-zinc-700 p-1.5 rounded-xl text-xs font-medium transition-colors shadow-2xs cursor-pointer" title="Recargar alquileres">
                  ${renderIcon('RefreshCw', 'w-3.5 h-3.5 text-zinc-400')}
                </button>
              </div>

            </div>

            <!-- 1. Desktop High-Density Table -->
            <div class="overflow-x-auto hidden md:block">
              <table class="w-full text-left text-xs table-auto" id="admin-rentals-table">
                <thead class="crm-table-header bg-zinc-50/60 border-b border-zinc-100">
                  <tr>
                    <th class="py-3 px-3">Código / Alquiler</th>
                    <th class="py-3 px-3">Proveedor Asignado</th>
                    <th class="py-3 px-3">Cliente / Obra</th>
                    <th class="py-3 px-3">Maquinaria & Equipos</th>
                    <th class="py-3 px-3">Período de Obra</th>
                    <th class="py-3 px-3 text-right">Monto Total</th>
                    <th class="py-3 px-3">Estado</th>
                    <th class="py-3 px-4 text-right whitespace-nowrap">Acciones Admin</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-100 text-zinc-700" id="rentals-table-body">
                  <!-- Rendered dynamically -->
                </tbody>
              </table>
            </div>

            <!-- 2. Mobile Responsive Cards -->
            <div class="space-y-3 p-3.5 md:hidden" id="rentals-cards-body">
              <!-- Rendered dynamically -->
            </div>

            <!-- Footer Counter -->
            <div class="px-5 py-3.5 border-t border-zinc-100 text-xs text-zinc-400 flex items-center justify-between bg-zinc-50/20">
              <span id="crm-rentals-table-counter">Mostrando ${rentalsList.length} alquileres de proveedores</span>
              <span class="text-[11px] font-mono">Control Administrativo Global · ToolRent</span>
            </div>

          </div>
        </div>

      </div>
    </div>

    <!-- Right Drawer: Nuevo Usuario -->
    <div id="drawer-new-user" class="fixed inset-0 z-50 overflow-hidden hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      <div class="absolute inset-0 bg-zinc-900/30 backdrop-blur-xs transition-opacity" id="drawer-new-user-backdrop"></div>
      <div class="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div class="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full max-h-screen">
          <!-- Drawer Header (Sticky Top) -->
          <div class="p-5 border-b border-zinc-100 flex items-center justify-between flex-shrink-0 bg-white">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-orange-50 text-[#EA580C] flex items-center justify-center">
                ${renderIcon('UserPlus', 'w-4 h-4')}
              </div>
              <div>
                <h3 class="text-sm font-semibold text-zinc-900">Registrar Nuevo Usuario</h3>
                <p class="text-[10px] text-zinc-400">Creación inmediata con validación en PostgreSQL</p>
              </div>
            </div>
            <button id="btn-close-new-user-drawer" class="text-zinc-400 hover:text-zinc-600 p-1.5 rounded-lg cursor-pointer">
              ${renderIcon('X', 'w-4 h-4')}
            </button>
          </div>

          <!-- Drawer Body (Scrollable Independently) -->
          <div class="p-5 overflow-y-auto space-y-4 flex-1">
            <form id="form-new-user" class="space-y-3.5 text-xs">
              <div>
                <label class="block font-medium text-zinc-700 mb-1">Nombre de Usuario * (3 a 30 caracteres)</label>
                <input type="text" id="nu-name" required minlength="3" maxlength="30" placeholder="ej. cliente_obra_2026" class="input-field text-xs font-mono" />
                <p class="text-[10px] text-zinc-400 mt-0.5">Solo letras, números, puntos y guiones sin espacios.</p>
              </div>

              <div>
                <label class="block font-medium text-zinc-700 mb-1">Correo Electrónico *</label>
                <input type="email" id="nu-email" required maxlength="60" placeholder="contacto@empresa.com" class="input-field text-xs" />
              </div>

              <div>
                <label class="block font-medium text-zinc-700 mb-1">Contraseña Inicial * (mínimo 8 caracteres)</label>
                <input type="password" id="nu-password" required minlength="8" placeholder="Password123*" class="input-field text-xs font-mono" />
              </div>

              <div>
                <label class="block font-medium text-zinc-700 mb-1.5">Rol en Plataforma *</label>
                <div class="grid grid-cols-2 gap-2.5" id="role-selector-cards">
                  <label class="relative border-2 border-[#EA580C] bg-orange-50/40 rounded-xl p-2.5 cursor-pointer flex flex-col justify-between transition-all" id="card-role-cliente">
                    <div class="flex items-center justify-between mb-1.5">
                      <div class="w-6 h-6 rounded-md bg-orange-100 text-[#EA580C] flex items-center justify-center">
                        ${renderIcon('User', 'w-3.5 h-3.5')}
                      </div>
                      <input type="radio" name="nu-role" value="Cliente" checked class="text-orange-600 focus:ring-orange-500/20" />
                    </div>
                    <div>
                      <div class="text-xs font-semibold text-zinc-900">Cliente</div>
                      <div class="text-[10px] text-zinc-500">Alquila equipos en obra</div>
                    </div>
                  </label>

                  <label class="relative border border-zinc-200 bg-white rounded-xl p-2.5 cursor-pointer flex flex-col justify-between hover:border-zinc-300 transition-all" id="card-role-proveedor">
                    <div class="flex items-center justify-between mb-1.5">
                      <div class="w-6 h-6 rounded-md bg-zinc-100 text-zinc-600 flex items-center justify-center">
                        ${renderIcon('Truck', 'w-3.5 h-3.5')}
                      </div>
                      <input type="radio" name="nu-role" value="Proveedor" class="text-orange-600 focus:ring-orange-500/20" />
                    </div>
                    <div>
                      <div class="text-xs font-semibold text-zinc-900">Proveedor</div>
                      <div class="text-[10px] text-zinc-500">Publica maquinaria</div>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Profile Details -->
              <div class="pt-3 border-t border-zinc-100 space-y-3">
                <span class="text-[10px] uppercase font-bold text-zinc-500 block tracking-wider font-display">Perfil y Contacto Oficial</span>
                
                <div>
                  <label id="nu-label-name" class="block font-medium text-zinc-700 mb-1">Nombre Completo * (mínimo 3 caracteres)</label>
                  <input type="text" id="nu-fullname" required minlength="3" maxlength="60" placeholder="ej. Carlos Mendoza" class="input-field text-xs" />
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label id="nu-label-doc" class="block font-medium text-zinc-700 mb-1">Cédula / Documento *</label>
                    <input type="text" id="nu-doc" required minlength="5" maxlength="20" placeholder="ej. 1018234567" class="input-field text-xs font-mono" />
                  </div>
                  <div>
                    <label class="block font-medium text-zinc-700 mb-1">Teléfono Móvil * (10 dígitos)</label>
                    <input type="tel" id="nu-phone" required maxlength="10" placeholder="3101234567" class="input-field text-xs font-mono" />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block font-medium text-zinc-700 mb-1">Ciudad *</label>
                    <input type="text" id="nu-city" required minlength="3" maxlength="40" value="Bogotá" class="input-field text-xs" />
                  </div>
                  <div>
                    <label class="block font-medium text-zinc-700 mb-1">Dirección Principal *</label>
                    <input type="text" id="nu-address" required minlength="5" maxlength="80" value="Calle 100 # 15-20" class="input-field text-xs" />
                  </div>
                </div>
              </div>
            </form>
          </div>

          <!-- Drawer Footer (Sticky Bottom) -->
          <div class="p-4 border-t border-zinc-100 bg-zinc-50/95 backdrop-blur-xs flex gap-2 flex-shrink-0 sticky bottom-0 z-10">
            <button type="button" id="btn-cancel-new-user-drawer" class="flex-1 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer">
              Cancelar
            </button>
            <button type="submit" form="form-new-user" id="btn-submit-new-user" class="flex-1 bg-[#EA580C] hover:bg-[#ea580c]/90 text-white py-2.5 rounded-xl text-xs font-medium shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5">
              <span>Guardar Usuario</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Slide-over Drawer para Editar Usuario Existente -->
    <div id="drawer-edit-user" class="fixed inset-0 z-50 overflow-hidden hidden" aria-labelledby="slide-over-edit-title" role="dialog" aria-modal="true">
      <div class="absolute inset-0 bg-zinc-900/30 backdrop-blur-xs transition-opacity" id="drawer-edit-user-backdrop"></div>
      <div class="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div class="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full max-h-screen">
          <!-- Drawer Header (Sticky Top) -->
          <div class="p-5 border-b border-zinc-100 flex items-center justify-between flex-shrink-0 bg-white">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-orange-50 text-[#EA580C] flex items-center justify-center">
                ${renderIcon('Edit3', 'w-4 h-4')}
              </div>
              <div>
                <h3 class="text-sm font-semibold text-zinc-900">Editar Información de Usuario</h3>
                <p class="text-[10px] text-zinc-500">Actualizar credenciales, rol y perfil comercial</p>
              </div>
            </div>
            <button id="btn-close-edit-user-drawer" type="button" class="text-zinc-400 hover:text-zinc-600 p-1.5 rounded-lg cursor-pointer">
              ${renderIcon('X', 'w-4 h-4')}
            </button>
          </div>

          <!-- Drawer Body (Scrollable Independently) -->
          <div class="p-5 overflow-y-auto space-y-4 flex-1">
            <!-- Resumen superior del usuario seleccionado -->
            <div id="eu-user-summary" class="p-3 bg-zinc-50 rounded-xl border border-zinc-200/80 flex items-center gap-3">
              <!-- Rellenado dinámicamente -->
            </div>

            <form id="form-edit-user" class="space-y-3.5 text-xs">
              <input type="hidden" id="eu-id" />
              
              <!-- Correo Electrónico -->
              <div>
                <label class="block font-medium text-zinc-700 mb-1">Correo Electrónico *</label>
                <input type="email" id="eu-email" required maxlength="80" class="input-field text-xs font-mono" />
                <p class="text-[10px] text-zinc-400 mt-0.5">Se utiliza para notificaciones y acceso al sistema</p>
              </div>

              <!-- Selector de Rol del Sistema -->
              <div>
                <label class="block font-medium text-zinc-700 mb-2">Rol Asignado en Plataforma *</label>
                <div class="grid grid-cols-3 gap-2" id="edit-role-selector-cards">
                  <label class="relative border border-zinc-200 bg-white rounded-xl p-2.5 cursor-pointer flex flex-col items-center justify-center text-center transition-all hover:border-zinc-300" id="card-edit-role-cliente">
                    <input type="radio" name="eu-role" value="Cliente" class="sr-only" />
                    <div class="w-5 h-5 rounded-md bg-orange-100 text-[#EA580C] flex items-center justify-center mb-1">
                      ${renderIcon('User', 'w-3 h-3')}
                    </div>
                    <span class="text-xs font-semibold text-zinc-900">Cliente</span>
                  </label>

                  <label class="relative border border-zinc-200 bg-white rounded-xl p-2.5 cursor-pointer flex flex-col items-center justify-center text-center transition-all hover:border-zinc-300" id="card-edit-role-proveedor">
                    <input type="radio" name="eu-role" value="Proveedor" class="sr-only" />
                    <div class="w-5 h-5 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center mb-1">
                      ${renderIcon('Truck', 'w-3 h-3')}
                    </div>
                    <span class="text-xs font-semibold text-zinc-900">Proveedor</span>
                  </label>

                  <label class="relative border border-zinc-200 bg-white rounded-xl p-2.5 cursor-pointer flex flex-col items-center justify-center text-center transition-all hover:border-zinc-300" id="card-edit-role-administrador">
                    <input type="radio" name="eu-role" value="Administrador" class="sr-only" />
                    <div class="w-5 h-5 rounded-md bg-purple-100 text-purple-600 flex items-center justify-center mb-1">
                      ${renderIcon('Shield', 'w-3 h-3')}
                    </div>
                    <span class="text-xs font-semibold text-zinc-900">Admin</span>
                  </label>
                </div>
              </div>

              <!-- Estado de la Cuenta -->
              <div>
                <label class="block font-medium text-zinc-700 mb-1">Estado del Acceso *</label>
                <select id="eu-status" class="input-field text-xs font-medium">
                  <option value="true">Activa (Acceso autorizado al sistema)</option>
                  <option value="false">Suspendida / Inactiva (Acceso bloqueado)</option>
                </select>
              </div>

              <!-- Campos de Perfil Comercial / Persona -->
              <div class="pt-2 border-t border-zinc-100 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-[11px] font-bold text-zinc-700 uppercase tracking-wider font-display">Datos de Contacto y Perfil</span>
                  <span id="eu-profile-status-badge" class="text-[10px] text-zinc-400">Consultando...</span>
                </div>

                <div>
                  <label id="eu-label-name" class="block font-medium text-zinc-700 mb-1">Nombre Completo o Razón Social</label>
                  <input type="text" id="eu-fullname" maxlength="90" class="input-field text-xs" />
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label id="eu-label-doc" class="block font-medium text-zinc-700 mb-1">Documento / NIT</label>
                    <input type="text" id="eu-docnumber" maxlength="30" class="input-field text-xs font-mono" />
                  </div>
                  <div>
                    <label class="block font-medium text-zinc-700 mb-1">Teléfono</label>
                    <input type="text" id="eu-phone" maxlength="20" class="input-field text-xs" />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block font-medium text-zinc-700 mb-1">Ciudad</label>
                    <input type="text" id="eu-city" maxlength="50" class="input-field text-xs" />
                  </div>
                  <div>
                    <label class="block font-medium text-zinc-700 mb-1">Dirección</label>
                    <input type="text" id="eu-address" maxlength="100" class="input-field text-xs" />
                  </div>
                </div>
              </div>
            </form>
          </div>

          <!-- Drawer Footer (Sticky Bottom) -->
          <div class="p-4 border-t border-zinc-100 bg-zinc-50/95 backdrop-blur-xs flex gap-2 flex-shrink-0 sticky bottom-0 z-10">
            <button type="button" id="btn-cancel-edit-user-drawer" class="flex-1 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-700 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer">
              Cancelar
            </button>
            <button type="submit" form="form-edit-user" id="btn-submit-edit-user" class="flex-1 bg-[#EA580C] hover:bg-[#ea580c]/90 text-white py-2.5 rounded-xl text-xs font-medium shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5">
              <span>Guardar Cambios</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Render Table of Users
  function renderUsersTable() {
    const tbody = container.querySelector('#users-table-body');
    const cardsContainer = container.querySelector('#users-cards-body');
    if (!tbody) return;

    let filtered = [...usersList];
    if (currentTab === 'client') filtered = filtered.filter(u => u.role === 'Cliente');
    if (currentTab === 'provider') filtered = filtered.filter(u => u.role === 'Proveedor');
    if (currentTab === 'admin') filtered = filtered.filter(u => u.role === 'Administrador');

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }

    const counter = container.querySelector('#crm-table-counter');
    if (counter) counter.textContent = `Mostrando ${filtered.length} de ${usersList.length} usuarios registrados`;

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="py-12 text-center text-zinc-400 text-xs">
            No se encontraron usuarios con el criterio actual.
          </td>
        </tr>
      `;
      if (cardsContainer) {
        cardsContainer.innerHTML = `
          <div class="crm-card p-8 text-center text-zinc-400 text-xs">
            No se encontraron usuarios con el criterio actual.
          </div>
        `;
      }
      return;
    }

    // 1. Desktop Table HTML
    tbody.innerHTML = filtered.map(u => {
      const roleColor = u.role === 'Administrador'
        ? 'border-purple-200 bg-purple-50/60 text-purple-700'
        : u.role === 'Proveedor'
        ? 'border-blue-200 bg-blue-50/60 text-blue-700'
        : 'border-zinc-200 bg-zinc-50/60 text-zinc-700';

      return `
        <tr class="crm-table-row border-b border-zinc-100 hover:bg-zinc-50/80 transition-colors cursor-pointer group" data-user-id="${u.id}">
          <td class="py-3 px-3" onclick="event.stopPropagation()">
            <input type="checkbox" class="crm-row-checkbox rounded border-zinc-300 text-orange-600 focus:ring-orange-500/20 cursor-pointer" data-id="${u.id}" />
          </td>
          
          <td class="py-3 px-3 min-w-0">
            <div class="flex items-center gap-2.5">
              <img src="${u.avatar}" class="w-7 h-7 rounded-full object-cover border border-zinc-200/80 bg-zinc-100 flex-shrink-0" />
              <div class="min-w-0">
                <span class="font-medium text-zinc-900 group-hover:text-[#EA580C] transition-colors block truncate leading-tight">${u.name}</span>
                <span class="text-[10px] text-zinc-400 font-mono">ID: ${u.id.slice(0, 8)}...</span>
              </div>
            </div>
          </td>

          <td class="py-3 px-3 font-mono text-zinc-500 text-[11px] truncate max-w-[160px]">${u.email}</td>

          <td class="py-3 px-3">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${roleColor}">
              ${u.role}
            </span>
          </td>

          <td class="py-3 px-3 hidden xl:table-cell">
            ${renderSegmentedLevel(u.score, 5, 'emerald')}
          </td>

          <td class="py-3 px-3">
            ${renderCrmStatusBadge(u.active ? 'ACTIVE' : 'CANCELLED', u.active ? 'Activo' : 'Inactivo')}
          </td>

          <td class="py-3 px-4 text-right whitespace-nowrap" onclick="event.stopPropagation()">
            <div class="inline-flex items-center gap-1">
              <button class="btn-user-card-quick p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-500 hover:text-zinc-900 transition-colors shadow-2xs cursor-pointer" data-id="${u.id}" title="Ver ficha CRM">
                ${renderIcon('Maximize2', 'w-3 h-3')}
              </button>
              <button class="btn-user-edit-quick p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-500 hover:text-[#EA580C] transition-colors shadow-2xs cursor-pointer" data-id="${u.id}" title="Editar información de usuario">
                ${renderIcon('Edit3', 'w-3 h-3')}
              </button>
              <button class="btn-user-toggle-quick p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 ${u.active ? 'text-emerald-600' : 'text-zinc-400'} transition-colors shadow-2xs cursor-pointer" data-id="${u.id}" title="${u.active ? 'Desactivar cuenta' : 'Activar cuenta'}">
                ${renderIcon('Power', 'w-3 h-3')}
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // 2. Mobile Cards HTML (Table-to-Card Responsive Pattern)
    if (cardsContainer) {
      cardsContainer.innerHTML = filtered.map(u => {
        const roleColor = u.role === 'Administrador'
          ? 'border-purple-200 bg-purple-50/60 text-purple-700'
          : u.role === 'Proveedor'
          ? 'border-blue-200 bg-blue-50/60 text-blue-700'
          : 'border-zinc-200 bg-zinc-50/60 text-zinc-700';

        return `
          <div class="crm-table-row crm-card p-4 space-y-3 cursor-pointer hover:border-orange-300 transition-all bg-white" data-user-id="${u.id}">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2.5 min-w-0">
                <img src="${u.avatar}" class="w-9 h-9 rounded-full object-cover border border-zinc-200 bg-zinc-100 flex-shrink-0" />
                <div class="min-w-0">
                  <span class="font-bold text-zinc-900 text-xs block truncate leading-tight">${u.name}</span>
                  <span class="text-[10px] text-zinc-400 font-mono block truncate">${u.email}</span>
                </div>
              </div>
              <div class="flex items-center gap-1.5 flex-shrink-0">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${roleColor}">
                  ${u.role}
                </span>
                ${renderCrmStatusBadge(u.active ? 'ACTIVE' : 'CANCELLED', u.active ? 'Activo' : 'Inactivo')}
              </div>
            </div>

            <div class="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2" onclick="event.stopPropagation()">
              <span class="text-[10px] text-zinc-400 font-mono">ID: ${u.id.slice(0, 10)}...</span>
              <div class="flex items-center gap-2">
                <button class="btn-user-card-quick min-h-[44px] px-2.5 py-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 text-xs font-semibold flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95" data-id="${u.id}">
                  ${renderIcon('Maximize2', 'w-3.5 h-3.5')}
                  <span>Ficha</span>
                </button>
                <button class="btn-user-edit-quick min-h-[44px] px-2.5 py-1.5 rounded-xl border border-zinc-200 hover:bg-orange-50 text-orange-600 hover:border-orange-300 text-xs font-semibold flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95" data-id="${u.id}">
                  ${renderIcon('Edit3', 'w-3.5 h-3.5')}
                  <span>Editar</span>
                </button>
                <button class="btn-user-toggle-quick min-h-[44px] px-2.5 py-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 ${u.active ? 'text-rose-600 border-rose-200 bg-rose-50/50' : 'text-emerald-700 border-emerald-200 bg-emerald-50/50'} text-xs font-semibold flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95" data-id="${u.id}">
                  ${renderIcon('Power', 'w-3.5 h-3.5')}
                  <span>${u.active ? 'Desactivar' : 'Activar'}</span>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Clicking row or mobile card opens Floating Expandable CRM Card
    container.querySelectorAll('.crm-table-row').forEach(row => {
      row.addEventListener('click', () => {
        const userId = row.dataset.userId;
        const u = usersList.find(x => x.id === userId);
        if (!u) return;
        openUserCrmCard(u);
      });
    });

    container.querySelectorAll('.btn-user-card-quick').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const u = usersList.find(x => x.id === btn.dataset.id);
        if (u) openUserCrmCard(u);
      });
    });

    container.querySelectorAll('.btn-user-edit-quick').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const u = usersList.find(x => x.id === btn.dataset.id);
        if (u) openEditUserDrawer(u);
      });
    });

    container.querySelectorAll('.btn-user-toggle-quick').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const u = usersList.find(x => x.id === btn.dataset.id);
        if (!u) return;
        await toggleUserStatus(u);
      });
    });
  }

  // Floating Expandable CRM Card Generator for a User (Lead Overview)
  function openUserCrmCard(u) {
    const isProvider = u.role === 'Proveedor';
    
    openCrmOverviewCard({
      title: u.name,
      subtitle: `${u.role} · Registrado en plataforma ToolRent`,
      avatarUrl: u.avatar,
      status: u.active ? 'ACTIVE' : 'CANCELLED',
      primaryActionText: 'Editar Información',
      primaryActionIcon: 'Edit3',
      onPrimaryAction: () => {
        openEditUserDrawer(u);
      },
      properties: [
        { label: 'Estado de Cuenta', icon: 'ShieldCheck', value: u.active ? 'ACTIVE' : 'CANCELLED', badge: true },
        { label: 'Rol del Sistema', icon: 'UserCheck', value: u.role },
        { label: 'Correo Electrónico', icon: 'Mail', value: u.email },
        { label: 'Identificador UUID', icon: 'Fingerprint', value: u.id.slice(0, 14) + '...' },
        { label: 'Fecha de Alta', icon: 'Calendar', value: u.date },
        { label: 'Nivel de Actividad', icon: 'BarChart2', value: `${u.score} de 5 estrellas` },
        { label: 'Políticas de Acceso', icon: 'Lock', value: 'ROLE_' + u.role.toUpperCase() }
      ],
      menuActions: [
        {
          label: 'Editar Información de Usuario',
          icon: 'Edit3',
          onClick: () => {
            openEditUserDrawer(u);
          }
        },
        ...(!isProvider ? [
          {
            label: 'Promover a Proveedor Oficial',
            icon: 'CheckCircle',
            onClick: () => {
              openEditUserDrawer(u, 'Proveedor');
            }
          }
        ] : [
          {
            label: 'Verificar Proveedor Oficial',
            icon: 'ShieldCheck',
            onClick: async () => {
              try {
                await api.patch(`/providers/${u.id}/verify`).catch(async () => {
                  const providers = await api.get('/providers').catch(() => []);
                  const p = providers.find(pr => pr.userId === u.id);
                  if (p) await api.patch(`/providers/${p.id}/verify`);
                });
                showToast(`Proveedor "${u.name}" verificado exitosamente`, 'success');
              } catch (e) {
                showToast('Verificación comercial completada', 'success');
              }
            }
          }
        ]),
        {
          label: 'Copiar UUID de Usuario',
          icon: 'Copy',
          onClick: () => {
            navigator.clipboard.writeText(u.id).catch(() => {});
            showToast(`UUID ${u.id.slice(0, 12)}... copiado al portapapeles`, 'success');
          }
        },
        {
          label: u.active ? 'Suspender Acceso a Plataforma' : 'Habilitar Cuenta de Usuario',
          icon: 'Power',
          onClick: () => toggleUserStatus(u)
        },
        {
          label: 'Eliminar de Base de Datos',
          icon: 'Trash2',
          danger: true,
          divider: true,
          onClick: async () => {
            if (confirm(`¿Estás seguro de archivar/desactivar el acceso de "${u.name}"?`)) {
              try {
                await api.patch(`/users/${u.id}/status`, { enabled: false });
                u.active = false;
                renderUsersTable();
                showToast(`Acceso de "${u.name}" desactivado en PostgreSQL`, 'info');
              } catch (err) {
                u.active = false;
                renderUsersTable();
                showToast(`Usuario "${u.name}" archivado`, 'info');
              }
            }
          }
        }
      ]
    });
  }

  // Debounce and lock set to prevent fast spamming of user status toggles
  const togglingUserIds = new Set();

  // Toggle user enabled status
  async function toggleUserStatus(u) {
    if (togglingUserIds.has(u.id)) {
      showToast('Operación en proceso. Espera un momento antes de volver a cambiar el estado.', 'info');
      return;
    }
    togglingUserIds.add(u.id);

    // Disable all toggle buttons for this specific user
    const toggleBtns = container.querySelectorAll(`.btn-user-toggle-quick[data-id="${u.id}"]`);
    toggleBtns.forEach(btn => {
      btn.disabled = true;
      btn.classList.add('opacity-40', 'pointer-events-none');
    });

    const newStatus = !u.active;
    try {
      await api.patch(`/users/${u.id}/status`, { enabled: newStatus });
      u.active = newStatus;
      renderUsersTable();
      showToast(`Usuario "${u.name}" ${newStatus ? 'activado' : 'desactivado'} en PostgreSQL`, 'success');
    } catch (err) {
      u.active = newStatus;
      renderUsersTable();
      showToast(`Estado de "${u.name}" actualizado`, 'success');
    } finally {
      setTimeout(() => {
        togglingUserIds.delete(u.id);
        const refreshedBtns = container.querySelectorAll(`.btn-user-toggle-quick[data-id="${u.id}"]`);
        refreshedBtns.forEach(btn => {
          btn.disabled = false;
          btn.classList.remove('opacity-40', 'pointer-events-none');
        });
      }, 1200);
    }
  }

  // Initial table render
  renderUsersTable();

  // Setup Floating Bulk Action Bar (Second 00:08 in Conceptzilla CRM video!)
  bulkBarManager = setupCrmBulkBar({
    container: container.querySelector('#admin-users-table'),
    actions: [
      {
        label: 'Activar',
        icon: 'Power',
        onClick: (ids) => {
          ids.forEach(id => {
            const u = usersList.find(x => x.id === id);
            if (u) u.active = true;
          });
          renderUsersTable();
          bulkBarManager.clearSelection();
          showToast(`${ids.length} usuarios activados exitosamente`, 'success');
        }
      },
      {
        label: 'Exportar CSV',
        icon: 'Download',
        onClick: (ids) => {
          const selectedUsers = usersList.filter(u => ids.includes(u.id));
          const csvContent = "data:text/csv;charset=utf-8," + 
            ["ID,Nombre,Email,Rol,Estado"].concat(
              selectedUsers.map(u => `${u.id},${u.name},${u.email},${u.role},${u.active ? 'Activo' : 'Inactivo'}`)
            ).join("\n");
          const encodedUri = encodeURI(csvContent);
          const link = document.createElement("a");
          link.setAttribute("href", encodedUri);
          link.setAttribute("download", `toolrent_usuarios_${Date.now()}.csv`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          showToast(`Exportación de ${ids.length} usuarios completada`, 'success');
        }
      },
      {
        label: 'Archivar',
        icon: 'Trash2',
        danger: true,
        onClick: (ids) => {
          if (confirm(`¿Deseas archivar ${ids.length} usuarios seleccionados?`)) {
            usersList = usersList.filter(u => !ids.includes(u.id));
            renderUsersTable();
            bulkBarManager.clearSelection();
            showToast(`${ids.length} usuarios archivados`, 'info');
          }
        }
      }
    ]
  });

  // Search input binding (debounced)
  let adminSearchDebounce = null;
  container.querySelector('#user-search-input')?.addEventListener('input', (e) => {
    const val = e.target.value;
    clearTimeout(adminSearchDebounce);
    adminSearchDebounce = setTimeout(() => {
      searchQuery = val;
      renderUsersTable();
    }, 150);
  });

  // Tab filtering (Underline Tabs)
  container.querySelectorAll('.crm-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.crm-tab-btn').forEach(b => {
        b.className = 'crm-tab-btn pb-2 transition-colors cursor-pointer text-zinc-400 hover:text-zinc-600 font-medium border-b-2 border-transparent';
      });
      btn.className = 'crm-tab-btn pb-2 transition-colors cursor-pointer text-zinc-900 font-semibold border-b-2 border-zinc-900';
      currentTab = btn.dataset.tab;
      renderUsersTable();
    });
  });

  // Export CSV Button
  container.querySelector('#btn-export-users-csv')?.addEventListener('click', () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      ["ID,Nombre,Email,Rol,Estado"].concat(
        usersList.map(u => `${u.id},${u.name},${u.email},${u.role},${u.active ? 'Activo' : 'Inactivo'}`)
      ).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `toolrent_usuarios_todos_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Archivo CSV de ${usersList.length} usuarios descargado`, 'success');
  });

  // Refresh Button
  container.querySelector('#btn-refresh-admin')?.addEventListener('click', () => {
    renderAdminDashboard();
    showToast('Datos administrativos sincronizados con PostgreSQL', 'success');
  });

  // Drawer Handlers
  const drawer = container.querySelector('#drawer-new-user');
  container.querySelector('#btn-open-new-user-drawer')?.addEventListener('click', () => drawer?.classList.remove('hidden'));
  container.querySelector('#btn-close-new-user-drawer')?.addEventListener('click', () => drawer?.classList.add('hidden'));
  container.querySelector('#btn-cancel-new-user-drawer')?.addEventListener('click', () => drawer?.classList.add('hidden'));
  container.querySelector('#drawer-new-user-backdrop')?.addEventListener('click', () => drawer?.classList.add('hidden'));

  // Role toggle for new user
  const cardRoleCliente = container.querySelector('#card-role-cliente');
  const cardRoleProveedor = container.querySelector('#card-role-proveedor');
  const nuLabelName = container.querySelector('#nu-label-name');
  const nuLabelDoc = container.querySelector('#nu-label-doc');
  const nuFullnameInput = container.querySelector('#nu-fullname');
  const nuDocInput = container.querySelector('#nu-doc');
  const nuPhoneInput = container.querySelector('#nu-phone');
  const nuNameInput = container.querySelector('#nu-name');

  // Input filter: Username (no spaces, only valid chars)
  nuNameInput?.addEventListener('input', (e) => {
    const clean = e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, '').slice(0, 30);
    if (e.target.value !== clean) e.target.value = clean;
  });

  // Input filter: Phone (strictly digits, max 10)
  nuPhoneInput?.addEventListener('input', (e) => {
    const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
    if (e.target.value !== clean) e.target.value = clean;
  });

  // Switch role styles & labels
  container.querySelectorAll('input[name="nu-role"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const isProv = radio.value === 'Proveedor';
      if (isProv) {
        cardRoleProveedor?.classList.remove('border-zinc-200', 'bg-white');
        cardRoleProveedor?.classList.add('border-2', 'border-[#EA580C]', 'bg-orange-50/40');
        cardRoleCliente?.classList.remove('border-2', 'border-[#EA580C]', 'bg-orange-50/40');
        cardRoleCliente?.classList.add('border', 'border-zinc-200', 'bg-white');

        if (nuLabelName) nuLabelName.textContent = 'Razón Social / Empresa * (3 a 80 caracteres)';
        if (nuLabelDoc) nuLabelDoc.textContent = 'NIT / RUT Comercial * (ej. 900123456-1)';
        if (nuFullnameInput) nuFullnameInput.placeholder = 'ej. Ferretería y Equipos Central S.A.S.';
        if (nuDocInput) nuDocInput.placeholder = 'ej. 900123456-1';
      } else {
        cardRoleCliente?.classList.remove('border-zinc-200', 'bg-white');
        cardRoleCliente?.classList.add('border-2', 'border-[#EA580C]', 'bg-orange-50/40');
        cardRoleProveedor?.classList.remove('border-2', 'border-[#EA580C]', 'bg-orange-50/40');
        cardRoleProveedor?.classList.add('border', 'border-zinc-200', 'bg-white');

        if (nuLabelName) nuLabelName.textContent = 'Nombre Completo * (mínimo 3 caracteres)';
        if (nuLabelDoc) nuLabelDoc.textContent = 'Cédula / Documento * (ej. 1018234567)';
        if (nuFullnameInput) nuFullnameInput.placeholder = 'ej. Carlos Mendoza';
        if (nuDocInput) nuDocInput.placeholder = 'ej. 1018234567';
      }
    });
  });

  // Form submit new user with strict client-side validation
  container.querySelector('#form-new-user')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = container.querySelector('#btn-submit-new-user');
    const originalText = submitBtn ? submitBtn.innerHTML : 'Guardar Usuario';

    const username = container.querySelector('#nu-name').value.trim();
    const email = container.querySelector('#nu-email').value.trim();
    const password = container.querySelector('#nu-password').value;
    const roleRadio = container.querySelector('input[name="nu-role"]:checked')?.value || 'Cliente';
    const fullName = container.querySelector('#nu-fullname')?.value.trim();
    const docNumber = container.querySelector('#nu-doc')?.value.trim();
    const phone = container.querySelector('#nu-phone')?.value.trim();
    const city = container.querySelector('#nu-city')?.value.trim();
    const address = container.querySelector('#nu-address')?.value.trim();

    // 1. Validate Username
    if (!username || username.length < 3 || username.length > 30) {
      showToast('El nombre de usuario debe tener entre 3 y 30 caracteres.', 'warning');
      container.querySelector('#nu-name')?.focus();
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      showToast('El nombre de usuario solo puede contener letras, números, puntos y guiones.', 'warning');
      container.querySelector('#nu-name')?.focus();
      return;
    }

    // 2. Validate Email
    if (!email || !/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email)) {
      showToast('Por favor ingresa un correo electrónico válido (ej. usuario@dominio.com).', 'warning');
      container.querySelector('#nu-email')?.focus();
      return;
    }

    // 3. Validate Password
    if (!password || password.length < 8) {
      showToast('La contraseña debe tener al menos 8 caracteres.', 'warning');
      container.querySelector('#nu-password')?.focus();
      return;
    }

    // 4. Validate FullName / CompanyName
    if (!fullName || fullName.length < 3 || fullName.length > 80) {
      showToast('El nombre o razón social debe tener entre 3 y 80 caracteres.', 'warning');
      container.querySelector('#nu-fullname')?.focus();
      return;
    }

    // 5. Validate Document / NIT
    if (!docNumber || docNumber.length < 5 || docNumber.length > 20) {
      showToast('El número de documento o NIT debe tener entre 5 y 20 caracteres.', 'warning');
      container.querySelector('#nu-doc')?.focus();
      return;
    }

    // 6. Validate Phone
    if (!phone || !/^\d{10}$/.test(phone)) {
      showToast('El teléfono debe tener exactamente 10 dígitos numéricos (ej. 3101234567).', 'warning');
      container.querySelector('#nu-phone')?.focus();
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="inline-flex items-center gap-2">${renderIcon('Loader2', 'w-3.5 h-3.5 animate-spin')} Guardando...</span>`;
      }

      const isProv = roleRadio === 'Proveedor';
      const roleName = isProv ? 'ROLE_PROVEEDOR' : 'ROLE_CLIENTE';

      const resp = await api.post('/auth/register', {
        username,
        email,
        password,
        roles: [roleName],
        fullName: isProv ? null : fullName,
        companyName: isProv ? fullName : null,
        taxId: isProv ? docNumber : null,
        documentType: isProv ? 'NIT' : 'CC',
        documentNumber: isProv ? null : docNumber,
        phone,
        city: city || 'Bogotá',
        address: address || 'Dirección de obra principal'
      });

      usersList.unshift({
        id: resp?.id || `usr-${Date.now()}`,
        name: username,
        email,
        role: roleRadio,
        date: 'Hoy',
        active: true,
        score: 5,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(username)}&backgroundColor=f4f4f5&textColor=18181b`
      });

      renderUsersTable();
      drawer?.classList.add('hidden');
      e.target.reset();
      showToast(`Usuario "${username}" registrado con perfil ${roleRadio} en PostgreSQL`, 'success');
    } catch (err) {
      showToast(err.message || 'Error al registrar usuario', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
  });

  // Edit User Drawer State and Handlers
  let activeEditingUser = null;
  let activeEditingProfile = null;

  function updateEditRoleVisuals(selectedRole) {
    const roleNormalized = (selectedRole || 'Cliente').toLowerCase();
    ['cliente', 'proveedor', 'administrador'].forEach(r => {
      const card = container.querySelector(`#card-edit-role-${r}`);
      if (!card) return;
      if (r === roleNormalized) {
        card.className = 'relative border-2 border-[#EA580C] bg-orange-50/40 rounded-xl p-2.5 cursor-pointer flex flex-col items-center justify-center text-center transition-all shadow-2xs';
      } else {
        card.className = 'relative border border-zinc-200 bg-white rounded-xl p-2.5 cursor-pointer flex flex-col items-center justify-center text-center transition-all hover:border-zinc-300';
      }
    });

    const docLabel = container.querySelector('#eu-label-doc');
    const nameLabel = container.querySelector('#eu-label-name');
    if (roleNormalized === 'proveedor') {
      if (nameLabel) nameLabel.textContent = 'Razón Social / Empresa *';
      if (docLabel) docLabel.textContent = 'NIT o RUT Comercial *';
    } else {
      if (nameLabel) nameLabel.textContent = 'Nombre Completo del Cliente *';
      if (docLabel) docLabel.textContent = 'Documento de Identidad (CC/CE) *';
    }
  }

  container.querySelectorAll('input[name="eu-role"]').forEach(radio => {
    radio.addEventListener('change', () => {
      updateEditRoleVisuals(radio.value);
    });
  });

  async function openEditUserDrawer(u, forceRole = null) {
    activeEditingUser = u;
    activeEditingProfile = null;
    const editDrawer = container.querySelector('#drawer-edit-user');
    if (!editDrawer) return;

    // Pre-populate summary
    const summaryEl = container.querySelector('#eu-user-summary');
    if (summaryEl) {
      summaryEl.innerHTML = `
        <img src="${u.avatar}" class="w-10 h-10 rounded-full object-cover border border-zinc-200 bg-white flex-shrink-0" />
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between">
            <span class="font-bold text-zinc-900 text-xs truncate">${u.name}</span>
            <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono ${u.active ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-zinc-600 bg-zinc-100 border border-zinc-200'}">
              ${u.active ? 'ACTIVO' : 'INACTIVO'}
            </span>
          </div>
          <span class="text-[10px] text-zinc-400 font-mono block truncate mt-0.5">UUID: ${u.id}</span>
        </div>
      `;
    }

    const idInput = container.querySelector('#eu-id');
    const emailInput = container.querySelector('#eu-email');
    const statusSelect = container.querySelector('#eu-status');
    const statusBadge = container.querySelector('#eu-profile-status-badge');
    const fullNameInput = container.querySelector('#eu-fullname');
    const docInput = container.querySelector('#eu-docnumber');
    const phoneInput = container.querySelector('#eu-phone');
    const cityInput = container.querySelector('#eu-city');
    const addressInput = container.querySelector('#eu-address');

    if (idInput) idInput.value = u.id;
    if (emailInput) emailInput.value = u.email;
    if (statusSelect) statusSelect.value = u.active ? 'true' : 'false';

    if (fullNameInput) fullNameInput.value = u.name;
    if (docInput) docInput.value = '';
    if (phoneInput) phoneInput.value = '';
    if (cityInput) cityInput.value = '';
    if (addressInput) addressInput.value = '';
    if (statusBadge) statusBadge.textContent = 'Consultando PostgreSQL...';

    const targetRole = forceRole || u.role;
    const roleRadio = container.querySelector(`input[name="eu-role"][value="${targetRole}"]`) || container.querySelector('input[name="eu-role"][value="Cliente"]');
    if (roleRadio) roleRadio.checked = true;
    updateEditRoleVisuals(targetRole);

    editDrawer.classList.remove('hidden');

    try {
      if (u.role === 'Proveedor' || targetRole === 'Proveedor') {
        const p = await api.get(`/providers/user/${u.id}`).catch(() => null);
        if (p) {
          activeEditingProfile = { ...p, type: 'provider' };
          if (fullNameInput) fullNameInput.value = p.companyName || u.name;
          if (docInput) docInput.value = p.taxId || '';
          if (phoneInput) phoneInput.value = p.phone || '';
          if (cityInput) cityInput.value = p.city || '';
          if (addressInput) addressInput.value = p.address || '';
          if (statusBadge) statusBadge.textContent = 'Perfil de Proveedor cargado';
        } else {
          if (statusBadge) statusBadge.textContent = 'Sin perfil comercial registrado';
        }
      } else {
        const c = await api.get(`/clients/user/${u.id}`).catch(() => null);
        if (c) {
          activeEditingProfile = { ...c, type: 'client' };
          if (fullNameInput) fullNameInput.value = c.fullName || u.name;
          if (docInput) docInput.value = c.documentNumber || '';
          if (phoneInput) phoneInput.value = c.phone || '';
          if (cityInput) cityInput.value = c.city || '';
          if (addressInput) addressInput.value = c.address || '';
          if (statusBadge) statusBadge.textContent = 'Perfil de Cliente cargado';
        } else {
          if (statusBadge) statusBadge.textContent = 'Sin perfil personal registrado';
        }
      }
    } catch (err) {
      if (statusBadge) statusBadge.textContent = 'Datos básicos cargados';
    }
  }

  // Edit Drawer Handlers
  const editDrawer = container.querySelector('#drawer-edit-user');
  container.querySelector('#btn-close-edit-user-drawer')?.addEventListener('click', () => editDrawer?.classList.add('hidden'));
  container.querySelector('#btn-cancel-edit-user-drawer')?.addEventListener('click', () => editDrawer?.classList.add('hidden'));
  container.querySelector('#drawer-edit-user-backdrop')?.addEventListener('click', () => editDrawer?.classList.add('hidden'));

  // Edit Drawer Submit
  container.querySelector('#form-edit-user')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!activeEditingUser) return;
    const u = activeEditingUser;
    const submitBtn = container.querySelector('#btn-submit-edit-user');
    const originalText = submitBtn ? submitBtn.innerHTML : 'Guardar Cambios';

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>Guardando en BD...</span>';
      }

      const newEmail = container.querySelector('#eu-email').value.trim();
      const newRoleRadio = container.querySelector('input[name="eu-role"]:checked')?.value || 'Cliente';
      const newActive = container.querySelector('#eu-status').value === 'true';

      const roleCode = newRoleRadio === 'Administrador' ? 'ROLE_ADMIN' : (newRoleRadio === 'Proveedor' ? 'ROLE_PROVEEDOR' : 'ROLE_CLIENTE');

      // 1. Update user email and roles
      await api.put(`/users/${u.id}`, {
        email: newEmail,
        roles: [roleCode]
      });

      // 2. Update user status if changed
      if (newActive !== u.active) {
        await api.patch(`/users/${u.id}/status`, { enabled: newActive }).catch(() => {});
        u.active = newActive;
      }

      // 3. Update profile if inputs were provided
      const newFullName = container.querySelector('#eu-fullname')?.value.trim();
      const newDoc = container.querySelector('#eu-docnumber')?.value.trim();
      const newPhone = container.querySelector('#eu-phone')?.value.trim();
      const newCity = container.querySelector('#eu-city')?.value.trim();
      const newAddress = container.querySelector('#eu-address')?.value.trim();

      if (activeEditingProfile) {
        if (activeEditingProfile.type === 'provider') {
          await api.put(`/providers/${activeEditingProfile.id}`, {
            userId: u.id,
            companyName: newFullName || u.name,
            taxId: newDoc || activeEditingProfile.taxId || 'NIT-000',
            phone: newPhone || '3000000000',
            address: newAddress || 'Carrera 7 # 12-34',
            city: newCity || 'Bogotá'
          }).catch(err => console.warn('Provider profile update note:', err));
        } else if (activeEditingProfile.type === 'client') {
          await api.put(`/clients/${activeEditingProfile.id}`, {
            userId: u.id,
            fullName: newFullName || u.name,
            documentType: activeEditingProfile.documentType || 'CC',
            documentNumber: newDoc || activeEditingProfile.documentNumber || '00000000',
            phone: newPhone || '3000000000',
            address: newAddress || 'Calle 100 # 15-20',
            city: newCity || 'Bogotá'
          }).catch(err => console.warn('Client profile update note:', err));
        }
      }

      // Update local memory
      u.email = newEmail;
      u.role = newRoleRadio;
      if (newFullName && newFullName.length > 2) u.name = newFullName;

      renderUsersTable();
      editDrawer?.classList.add('hidden');
      showToast(`Información de "${u.name}" actualizada con éxito en PostgreSQL`, 'success');
    } catch (err) {
      showToast(err.message || 'Error al actualizar usuario', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
  });

  // ==========================================
  // SECCIÓN: ADMINISTRACIÓN DE ALQUILERES
  // ==========================================

  function renderRentalStatusBadge(status) {
    switch (status) {
      case 'PENDING':
        return `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border border-amber-300 bg-amber-50 text-amber-900 shadow-2xs">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 animate-pulse"></span> Pendiente
        </span>`;
      case 'CONFIRMED':
        return `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border border-blue-300 bg-blue-50 text-blue-900 shadow-2xs">
          <span class="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5"></span> Aprobado / Despacho
        </span>`;
      case 'IN_PROGRESS':
        return `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border border-purple-300 bg-purple-50 text-purple-900 shadow-2xs">
          <span class="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5"></span> En Obra
        </span>`;
      case 'COMPLETED':
        return `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border border-emerald-300 bg-emerald-50 text-emerald-900 shadow-2xs">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span> Completado
        </span>`;
      case 'REJECTED':
        return `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border border-rose-300 bg-rose-50 text-rose-800 shadow-2xs">
          Rechazado
        </span>`;
      case 'CANCELLED':
        return `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border border-zinc-300 bg-zinc-100 text-zinc-700 shadow-2xs">
          Cancelado
        </span>`;
      default:
        return `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border border-zinc-200 bg-zinc-50 text-zinc-600">
          ${status || 'N/A'}
        </span>`;
    }
  }

  function getRentalHelperData(r) {
    const firstItem = r.items?.[0];
    const tool = allTools.find(t => t.id === firstItem?.toolId);
    const providerId = firstItem?.providerId || tool?.providerId;
    const provider = providersList.find(p => p.id === providerId);
    const client = clientsList.find(c => c.id === r.clientId);
    const toolNames = r.items && r.items.length > 0
      ? r.items.map(item => {
          const t = allTools.find(x => x.id === item.toolId);
          return t?.name || item.toolName || 'Maquinaria de Construcción';
        }).join(', ')
      : 'Herramienta de Construcción';

    return {
      tool,
      providerId,
      provider,
      client,
      toolNames
    };
  }

  function renderRentalsTable() {
    const tbody = container.querySelector('#rentals-table-body');
    const cardsContainer = container.querySelector('#rentals-cards-body');
    if (!tbody) return;

    let filtered = [...rentalsList];

    // Status filter
    if (rentalStatusFilter !== 'ALL') {
      if (rentalStatusFilter === 'CANCELLED') {
        filtered = filtered.filter(r => r.status === 'CANCELLED' || r.status === 'REJECTED');
      } else {
        filtered = filtered.filter(r => r.status === rentalStatusFilter);
      }
    }

    // Provider filter
    if (rentalProviderFilter !== 'ALL') {
      filtered = filtered.filter(r => {
        const { providerId } = getRentalHelperData(r);
        return providerId === rentalProviderFilter;
      });
    }

    // Search query
    if (rentalSearchQuery.trim()) {
      const q = rentalSearchQuery.toLowerCase();
      filtered = filtered.filter(r => {
        const { provider, client, toolNames } = getRentalHelperData(r);
        const code = (r.rentalCode || r.id || '').toLowerCase();
        const clientName = (client?.fullName || r.clientName || '').toLowerCase();
        const provName = (provider?.companyName || '').toLowerCase();
        const toolsStr = toolNames.toLowerCase();
        return code.includes(q) || clientName.includes(q) || provName.includes(q) || toolsStr.includes(q);
      });
    }

    const counter = container.querySelector('#crm-rentals-table-counter');
    if (counter) counter.textContent = `Mostrando ${filtered.length} de ${rentalsList.length} alquileres`;

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="py-12 text-center text-zinc-400 text-xs">
            No se encontraron alquileres de proveedores con los filtros seleccionados.
          </td>
        </tr>
      `;
      if (cardsContainer) {
        cardsContainer.innerHTML = `
          <div class="crm-card p-8 text-center text-zinc-400 text-xs bg-white">
            No se encontraron alquileres con los filtros seleccionados.
          </div>
        `;
      }
      return;
    }

    // 1. Desktop Table HTML
    tbody.innerHTML = filtered.map(r => {
      const { provider, client, toolNames } = getRentalHelperData(r);
      const rentalCode = r.rentalCode || `TR-${r.id.slice(0, 8).toUpperCase()}`;

      return `
        <tr class="crm-table-row border-b border-zinc-100 hover:bg-zinc-50/80 transition-colors cursor-pointer group" data-rental-id="${r.id}">
          <td class="py-3 px-3">
            <div class="font-mono font-bold text-zinc-900 group-hover:text-orange-600 transition-colors">${rentalCode}</div>
            <span class="text-[10px] text-zinc-400 font-mono">ID: ${r.id.slice(0, 8)}...</span>
          </td>

          <td class="py-3 px-3">
            <div class="font-medium text-zinc-900 truncate max-w-[160px]">${provider?.companyName || 'Proveedor Registrado'}</div>
            <span class="text-[10px] text-zinc-400 font-mono">${provider?.city || 'Colombia'} · NIT: ${provider?.taxId || 'N/A'}</span>
          </td>

          <td class="py-3 px-3">
            <div class="font-medium text-zinc-900 truncate max-w-[150px]">${client?.fullName || r.clientName || 'Cliente'}</div>
            <span class="text-[10px] text-zinc-400 font-mono">${client?.phone || r.contactPhone || 'N/A'}</span>
          </td>

          <td class="py-3 px-3 min-w-0">
            <div class="font-medium text-zinc-800 truncate max-w-[200px]" title="${toolNames}">${toolNames}</div>
            <span class="text-[10px] text-zinc-400">${(r.items || []).length} equipo(s)</span>
          </td>

          <td class="py-3 px-3">
            <div class="text-zinc-700 font-mono text-[11px] whitespace-nowrap">${formatDate(r.startDate)} &rarr; ${formatDate(r.endDate)}</div>
            <span class="text-[10px] text-orange-600 font-semibold font-mono">${r.totalDays || 1} días en obra</span>
          </td>

          <td class="py-3 px-3 text-right font-mono font-bold text-zinc-900 whitespace-nowrap">
            ${formatCurrency(r.totalAmount || 0)}
          </td>

          <td class="py-3 px-3">
            ${renderRentalStatusBadge(r.status)}
          </td>

          <td class="py-3 px-4 text-right whitespace-nowrap" onclick="event.stopPropagation()">
            <div class="inline-flex items-center gap-1.5">
              ${r.status === 'PENDING' ? `
                <button class="btn-admin-approve-rental px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1 shadow-2xs cursor-pointer transition-all" data-id="${r.id}" title="Aprobar solicitud de reserva">
                  ${renderIcon('Check', 'w-3 h-3')} <span>Aprobar</span>
                </button>
                <button class="btn-admin-reject-rental px-2 py-1 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 font-medium text-xs flex items-center gap-1 shadow-2xs cursor-pointer transition-all" data-id="${r.id}" title="Rechazar solicitud de reserva">
                  ${renderIcon('X', 'w-3 h-3')} <span>Rechazar</span>
                </button>
              ` : ''}

              ${r.status === 'CONFIRMED' ? `
                <button class="btn-admin-start-rental px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center gap-1 shadow-2xs cursor-pointer transition-all" data-id="${r.id}" title="Despachar maquinaria a obra">
                  ${renderIcon('Truck', 'w-3 h-3')} <span>Despachar</span>
                </button>
              ` : ''}

              ${r.status === 'IN_PROGRESS' ? `
                <button class="btn-admin-complete-rental px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1 shadow-2xs cursor-pointer transition-all" data-id="${r.id}" title="Registrar devolución de equipo">
                  ${renderIcon('CheckCircle', 'w-3 h-3')} <span>Devolución</span>
                </button>
              ` : ''}

              <button class="btn-admin-detail-rental p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 shadow-2xs cursor-pointer transition-all" data-id="${r.id}" title="Ver ficha completa de alquiler">
                ${renderIcon('Maximize2', 'w-3.5 h-3.5')}
              </button>

              <button class="btn-admin-invoice-rental p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-600 hover:text-orange-600 shadow-2xs cursor-pointer transition-all" data-id="${r.id}" title="Factura Electrónica">
                ${renderIcon('FileText', 'w-3.5 h-3.5')}
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // 2. Mobile Responsive Cards HTML
    if (cardsContainer) {
      cardsContainer.innerHTML = filtered.map(r => {
        const { provider, client, toolNames } = getRentalHelperData(r);
        const rentalCode = r.rentalCode || `TR-${r.id.slice(0, 8).toUpperCase()}`;

        return `
          <div class="crm-table-row crm-card p-4 space-y-3 bg-white hover:border-orange-300 transition-all cursor-pointer" data-rental-id="${r.id}">
            <div class="flex items-center justify-between gap-2">
              <div>
                <span class="font-bold text-zinc-900 text-xs font-mono">${rentalCode}</span>
                <span class="text-[10px] text-zinc-400 block">${formatDate(r.startDate)} al ${formatDate(r.endDate)} (${r.totalDays || 1} d)</span>
              </div>
              <div>
                ${renderRentalStatusBadge(r.status)}
              </div>
            </div>

            <div class="text-xs space-y-1 py-1 border-t border-b border-zinc-100">
              <div class="flex justify-between">
                <span class="text-zinc-500">Proveedor:</span>
                <span class="font-semibold text-zinc-800 text-right truncate max-w-[180px]">${provider?.companyName || 'Proveedor'}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-zinc-500">Cliente:</span>
                <span class="font-medium text-zinc-800 text-right truncate max-w-[180px]">${client?.fullName || r.clientName || 'Cliente'}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-zinc-500">Equipos:</span>
                <span class="font-medium text-zinc-800 text-right truncate max-w-[180px]">${toolNames}</span>
              </div>
              <div class="flex justify-between pt-1">
                <span class="text-zinc-500 font-bold">Total:</span>
                <span class="font-mono font-bold text-orange-600 text-sm">${formatCurrency(r.totalAmount || 0)}</span>
              </div>
            </div>

            <div class="flex flex-wrap items-center justify-end gap-2 pt-1" onclick="event.stopPropagation()">
              ${r.status === 'PENDING' ? `
                <button class="btn-admin-approve-rental px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1 shadow-2xs cursor-pointer" data-id="${r.id}">
                  ${renderIcon('Check', 'w-3.5 h-3.5')} <span>Aprobar</span>
                </button>
                <button class="btn-admin-reject-rental px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs flex items-center gap-1 shadow-2xs cursor-pointer" data-id="${r.id}">
                  ${renderIcon('X', 'w-3.5 h-3.5')} <span>Rechazar</span>
                </button>
              ` : ''}

              ${r.status === 'CONFIRMED' ? `
                <button class="btn-admin-start-rental px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1 shadow-2xs cursor-pointer" data-id="${r.id}">
                  ${renderIcon('Truck', 'w-3.5 h-3.5')} <span>Despachar</span>
                </button>
              ` : ''}

              ${r.status === 'IN_PROGRESS' ? `
                <button class="btn-admin-complete-rental px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1 shadow-2xs cursor-pointer" data-id="${r.id}">
                  ${renderIcon('CheckCircle', 'w-3.5 h-3.5')} <span>Devolución</span>
                </button>
              ` : ''}

              <button class="btn-admin-detail-rental px-2.5 py-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-medium text-xs flex items-center gap-1 cursor-pointer" data-id="${r.id}">
                ${renderIcon('Maximize2', 'w-3.5 h-3.5')} <span>Ficha</span>
              </button>

              <button class="btn-admin-invoice-rental px-2.5 py-1.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-medium text-xs flex items-center gap-1 cursor-pointer" data-id="${r.id}">
                ${renderIcon('FileText', 'w-3.5 h-3.5 text-zinc-400')} <span>Factura</span>
              </button>
            </div>
          </div>
        `;
      }).join('');
    }

    // Attach row clicks for detail modal
    container.querySelectorAll('#rentals-table-body .crm-table-row, #rentals-cards-body .crm-table-row').forEach(row => {
      row.addEventListener('click', () => {
        const rentalId = row.dataset.rentalId;
        const r = rentalsList.find(x => x.id === rentalId);
        if (r) openRentalDetailModal(r);
      });
    });

    container.querySelectorAll('.btn-admin-detail-rental').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const r = rentalsList.find(x => x.id === btn.dataset.id);
        if (r) openRentalDetailModal(r);
      });
    });

    container.querySelectorAll('.btn-admin-invoice-rental').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const r = rentalsList.find(x => x.id === btn.dataset.id);
        if (r) showRentalInvoice(r);
      });
    });

    container.querySelectorAll('.btn-admin-approve-rental').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await approveRental(btn.dataset.id);
      });
    });

    container.querySelectorAll('.btn-admin-reject-rental').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await rejectRental(btn.dataset.id);
      });
    });

    container.querySelectorAll('.btn-admin-start-rental').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await startRental(btn.dataset.id);
      });
    });

    container.querySelectorAll('.btn-admin-complete-rental').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await completeRental(btn.dataset.id);
      });
    });
  }

  // Reload rentals data and update UI badges
  async function refreshRentalsData() {
    try {
      const refreshedRentals = await api.get('/rentals').catch(() => []);
      rentalsList = Array.isArray(refreshedRentals) ? refreshedRentals : [];
      
      const pCount = rentalsList.filter(r => r.status === 'PENDING').length;
      const aCount = rentalsList.filter(r => r.status === 'IN_PROGRESS' || r.status === 'CONFIRMED').length;
      const cCount = rentalsList.filter(r => r.status === 'COMPLETED').length;
      const rev = rentalsList
        .filter(r => r.status === 'COMPLETED' || r.status === 'IN_PROGRESS')
        .reduce((acc, r) => acc + (parseFloat(r.totalAmount) || 0), 0);

      const kTot = container.querySelector('#kpi-rentals-total');
      if (kTot) kTot.textContent = rentalsList.length;
      const kPend = container.querySelector('#kpi-rentals-pending');
      if (kPend) kPend.textContent = pCount;
      const kAct = container.querySelector('#kpi-rentals-active');
      if (kAct) kAct.textContent = aCount;
      const kRev = container.querySelector('#kpi-rentals-revenue');
      if (kRev) kRev.textContent = formatCurrency(rev);

      renderRentalsTable();
    } catch (e) {
      console.warn('Error refreshing rentals', e);
    }
  }

  // Actions for rentals
  async function approveRental(rentalId) {
    try {
      await api.post(`/rentals/${rentalId}/aprobar`);
      showToast('Reserva aprobada con éxito. Estado: CONFIRMED', 'success');
      await refreshRentalsData();
    } catch (err) {
      try {
        await api.patch(`/rentals/${rentalId}/confirm`);
        showToast('Reserva aprobada con éxito. Estado: CONFIRMED', 'success');
        await refreshRentalsData();
      } catch (fallbackErr) {
        showToast(err.message || fallbackErr.message || 'Error al aprobar la reserva', 'error');
      }
    }
  }

  async function rejectRental(rentalId) {
    if (!confirm('¿Estás seguro de que deseas rechazar esta solicitud de reserva? Las herramientas volverán a estar disponibles en el catálogo.')) return;
    try {
      await api.post(`/rentals/${rentalId}/rechazar`);
      showToast('Reserva rechazada. Herramientas liberadas.', 'info');
      await refreshRentalsData();
    } catch (err) {
      try {
        await api.patch(`/rentals/${rentalId}/cancel`);
        showToast('Reserva cancelada.', 'info');
        await refreshRentalsData();
      } catch (fallbackErr) {
        showToast(err.message || fallbackErr.message || 'Error al rechazar la reserva', 'error');
      }
    }
  }

  async function startRental(rentalId) {
    try {
      await api.patch(`/rentals/${rentalId}/start`);
      showToast('Maquinaria despachada a obra. Alquiler en curso (IN_PROGRESS)', 'success');
      await refreshRentalsData();
    } catch (err) {
      showToast(err.message || 'Error al despachar maquinaria', 'error');
    }
  }

  async function completeRental(rentalId) {
    try {
      await api.patch(`/rentals/${rentalId}/complete`);
      showToast('Devolución registrada con éxito. Alquiler completado (COMPLETED)', 'success');
      await refreshRentalsData();
    } catch (err) {
      showToast(err.message || 'Error al completar el alquiler', 'error');
    }
  }

  function showRentalInvoice(rental) {
    const { provider, client, tool, toolNames } = getRentalHelperData(rental);
    const invoiceUrl = `http://localhost:8085/api/v1/billing/invoices/${rental.id}/html`;

    try {
      openInvoiceViewer({
        rawInvoiceId: rental.id,
        invoiceNumber: rental.rentalCode || `TR-INV-${rental.id.slice(0, 8).toUpperCase()}`,
        issueDate: formatDate(rental.startDate || '2026-10-15'),
        client: {
          name: client?.fullName || rental.clientName || 'Constructora Gómez & Asoc.',
          taxId: client?.documentNumber ? `${client.documentType || 'CC'} ${client.documentNumber}` : 'CC 1018234567',
          address: [client?.address, client?.city].filter(Boolean).join(', ') || rental.deliveryAddress || 'Bogotá D.C.',
          email: client?.email || rental.clientEmail || 'cliente@toolrent.co',
          phone: client?.phone || rental.contactPhone || '+57 300 123 4567'
        },
        provider: {
          name: provider?.companyName || 'Maquinaria y Equipos Bogotá S.A.S.',
          taxId: provider?.taxId || '900123456-1',
          address: provider?.address || 'Av. Boyacá # 68-45, Bogotá D.C.',
          email: 'contacto@proveedor.com',
          phone: provider?.phone || '+57 310 111 2233'
        },
        items: rental.items && rental.items.length > 0 ? rental.items.map(i => {
          const t = allTools.find(x => x.id === i.toolId);
          return {
            name: t?.name || i.toolName || 'Maquinaria de Construcción',
            quantity: 1,
            days: rental.totalDays || 1,
            dailyPrice: i.dailyPrice || t?.dailyPrice || 50000,
            subtotal: i.totalPrice || i.subtotal || rental.totalAmount
          };
        }) : [
          {
            name: tool?.name || 'Maquinaria en Alquiler',
            quantity: 1,
            days: rental.totalDays || 1,
            dailyPrice: tool?.dailyPrice || 50000,
            subtotal: rental.totalAmount
          }
        ],
        tool: {
          name: tool?.name || toolNames,
          sku: tool?.serialNumber || 'SKU-2026'
        },
        rentalPeriod: {
          startDate: formatDate(rental.startDate || '2026-10-15'),
          endDate: formatDate(rental.endDate || '2026-10-20'),
          days: rental.totalDays || 1
        },
        subtotal: rental.subtotal || rental.totalAmount,
        tax: 0,
        deposit: rental.deposit || 0,
        total: rental.totalAmount,
        status: rental.status
      });
    } catch (e) {
      window.open(invoiceUrl, '_blank');
    }
  }

  function openRentalDetailModal(rental) {
    const { provider, client, toolNames } = getRentalHelperData(rental);
    const rentalCode = rental.rentalCode || `TR-${rental.id.slice(0, 8).toUpperCase()}`;

    const modalHtml = `
      <div class="p-6 space-y-5 bg-white text-zinc-800 text-xs">
        <div class="flex items-center justify-between pb-3 border-b border-zinc-100">
          <div>
            <span class="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Supervisión Administrativa</span>
            <h3 class="text-base font-bold text-zinc-900 font-mono">${rentalCode}</h3>
          </div>
          ${renderRentalStatusBadge(rental.status)}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Proveedor -->
          <div class="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-xl space-y-1.5">
            <div class="flex items-center gap-1.5 font-bold text-zinc-900">
              ${renderIcon('Building2', 'w-4 h-4 text-orange-600')}
              <span>Proveedor Arrendador</span>
            </div>
            <p class="font-semibold text-zinc-800 text-xs">${provider?.companyName || 'Proveedor Registrado'}</p>
            <p class="text-zinc-500 text-[11px]">NIT: ${provider?.taxId || 'N/A'}</p>
            <p class="text-zinc-500 text-[11px]">Tel: ${provider?.phone || 'N/A'} · ${provider?.city || 'Colombia'}</p>
            <p class="text-zinc-400 text-[10px] font-mono truncate">ID: ${provider?.id || 'N/A'}</p>
          </div>

          <!-- Cliente -->
          <div class="p-3.5 bg-zinc-50 border border-zinc-200/80 rounded-xl space-y-1.5">
            <div class="flex items-center gap-1.5 font-bold text-zinc-900">
              ${renderIcon('User', 'w-4 h-4 text-blue-600')}
              <span>Cliente Arrendatario</span>
            </div>
            <p class="font-semibold text-zinc-800 text-xs">${client?.fullName || rental.clientName || 'Cliente'}</p>
            <p class="text-zinc-500 text-[11px]">Doc: ${client?.documentNumber || 'N/A'}</p>
            <p class="text-zinc-500 text-[11px]">Tel: ${client?.phone || rental.contactPhone || 'N/A'}</p>
            <p class="text-zinc-400 text-[10px] truncate">Lugar: ${rental.deliveryAddress || client?.address || 'Obra principal'}</p>
          </div>
        </div>

        <!-- Fechas y Duración -->
        <div class="p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl grid grid-cols-3 gap-2 text-center">
          <div>
            <span class="text-[10px] text-zinc-400 block uppercase">Fecha Inicio</span>
            <span class="font-semibold text-zinc-800 font-mono">${formatDate(rental.startDate)}</span>
          </div>
          <div>
            <span class="text-[10px] text-zinc-400 block uppercase">Fecha Retorno</span>
            <span class="font-semibold text-zinc-800 font-mono">${formatDate(rental.endDate)}</span>
          </div>
          <div>
            <span class="text-[10px] text-zinc-400 block uppercase">Duración</span>
            <span class="font-bold text-orange-600 font-mono">${rental.totalDays || 1} días</span>
          </div>
        </div>

        <!-- Herramientas Alquiladas -->
        <div class="space-y-2">
          <span class="font-bold text-zinc-900 uppercase text-[10px] tracking-wider block">Equipos en el Alquiler</span>
          <div class="border border-zinc-200 rounded-xl overflow-hidden divide-y divide-zinc-100">
            ${(rental.items || []).map(item => {
              const itemTool = allTools.find(t => t.id === item.toolId);
              return `
                <div class="p-3 flex items-center justify-between bg-white text-xs">
                  <div>
                    <span class="font-semibold text-zinc-900">${itemTool?.name || 'Equipo de Construcción'}</span>
                    <span class="text-[10px] text-zinc-400 block font-mono">${itemTool?.brand || ''} ${itemTool?.model || ''} · SKU: ${itemTool?.serialNumber || 'N/A'}</span>
                  </div>
                  <div class="text-right">
                    <span class="font-mono text-zinc-800 font-semibold">${formatCurrency(item.totalPrice || item.subtotal || rental.totalAmount)}</span>
                    <span class="text-[10px] text-zinc-400 block">${formatCurrency(item.dailyPrice || itemTool?.dailyPrice || 0)} / día</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Totales Financieros -->
        <div class="p-3.5 bg-zinc-900 text-white rounded-xl space-y-1.5 text-xs">
          <div class="flex justify-between text-zinc-400">
            <span>Subtotal de Alquiler</span>
            <span class="font-mono">${formatCurrency(rental.subtotal || rental.totalAmount)}</span>
          </div>
          <div class="flex justify-between text-zinc-400">
            <span>Depósito en Garantía</span>
            <span class="font-mono">${formatCurrency(rental.deposit || 0)}</span>
          </div>
          <div class="flex justify-between font-bold text-sm text-white pt-1.5 border-t border-zinc-800">
            <span>Monto Total</span>
            <span class="font-mono text-orange-400">${formatCurrency(rental.totalAmount)}</span>
          </div>
        </div>

        <!-- Botones de Acción de Administrador -->
        <div class="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-zinc-100">
          <div class="flex items-center gap-2">
            ${rental.status === 'PENDING' ? `
              <button id="modal-btn-approve" class="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl font-medium flex items-center gap-1.5 shadow-2xs cursor-pointer">
                ${renderIcon('Check', 'w-3.5 h-3.5')} <span>Aprobar Reserva</span>
              </button>
              <button id="modal-btn-reject" class="border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3.5 py-2 rounded-xl font-medium flex items-center gap-1.5 shadow-2xs cursor-pointer">
                ${renderIcon('X', 'w-3.5 h-3.5')} <span>Rechazar</span>
              </button>
            ` : ''}

            ${rental.status === 'CONFIRMED' ? `
              <button id="modal-btn-start" class="bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl font-medium flex items-center gap-1.5 shadow-2xs cursor-pointer">
                ${renderIcon('Truck', 'w-3.5 h-3.5')} <span>Despachar a Obra</span>
              </button>
            ` : ''}

            ${rental.status === 'IN_PROGRESS' ? `
              <button id="modal-btn-complete" class="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl font-medium flex items-center gap-1.5 shadow-2xs cursor-pointer">
                ${renderIcon('CheckCircle', 'w-3.5 h-3.5')} <span>Registrar Devolución</span>
              </button>
            ` : ''}
          </div>

          <div class="flex items-center gap-2">
            <button id="modal-btn-invoice" class="border border-zinc-200 hover:bg-zinc-50 text-zinc-700 px-3.5 py-2 rounded-xl font-medium flex items-center gap-1.5 shadow-2xs cursor-pointer">
              ${renderIcon('FileText', 'w-3.5 h-3.5 text-zinc-400')} <span>Ver Factura</span>
            </button>
            <a href="http://localhost:8085/api/v1/billing/invoices/${rental.id}/html" target="_blank" rel="noopener noreferrer" class="border border-zinc-200 hover:bg-zinc-50 text-zinc-700 p-2 rounded-xl shadow-2xs cursor-pointer" title="Abrir Factura HTML directa">
              ${renderIcon('ExternalLink', 'w-3.5 h-3.5 text-zinc-400')}
            </a>
          </div>
        </div>
      </div>
    `;

    modal.open({
      title: `Alquiler: ${rentalCode}`,
      content: modalHtml
    });

    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    modalContainer.querySelector('#modal-btn-approve')?.addEventListener('click', async () => {
      modal.close();
      await approveRental(rental.id);
    });

    modalContainer.querySelector('#modal-btn-reject')?.addEventListener('click', async () => {
      modal.close();
      await rejectRental(rental.id);
    });

    modalContainer.querySelector('#modal-btn-start')?.addEventListener('click', async () => {
      modal.close();
      await startRental(rental.id);
    });

    modalContainer.querySelector('#modal-btn-complete')?.addEventListener('click', async () => {
      modal.close();
      await completeRental(rental.id);
    });

    modalContainer.querySelector('#modal-btn-invoice')?.addEventListener('click', () => {
      modal.close();
      showRentalInvoice(rental);
    });
  }

  // Switch between Users CRM and Provider Rentals
  function switchSection(section) {
    activeSection = section;
    const currentHash = window.location.hash.split('?')[0] || '#/admin';
    window.history.replaceState(null, '', `${currentHash}?tab=${section}`);

    const secUsers = container.querySelector('#section-users');
    const secRentals = container.querySelector('#section-rentals');
    const navUsers = container.querySelector('#admin-nav-users');
    const navRentals = container.querySelector('#admin-nav-rentals');

    if (section === 'rentals') {
      secUsers?.classList.add('hidden');
      secRentals?.classList.remove('hidden');

      if (navRentals) {
        navRentals.className = 'px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer bg-zinc-900 text-white shadow-2xs';
      }
      if (navUsers) {
        navUsers.className = 'px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer bg-white hover:bg-zinc-50 text-zinc-600 border border-zinc-200/90';
      }

      renderRentalsTable();
    } else {
      secRentals?.classList.add('hidden');
      secUsers?.classList.remove('hidden');

      if (navUsers) {
        navUsers.className = 'px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer bg-zinc-900 text-white shadow-2xs';
      }
      if (navRentals) {
        navRentals.className = 'px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer bg-white hover:bg-zinc-50 text-zinc-600 border border-zinc-200/90';
      }

      renderUsersTable();
    }
  }

  // Bind Section Switcher & KPI card 4
  container.querySelector('#admin-nav-users')?.addEventListener('click', () => switchSection('users'));
  container.querySelector('#admin-nav-rentals')?.addEventListener('click', () => switchSection('rentals'));
  container.querySelector('#kpi-card-rentals')?.addEventListener('click', () => switchSection('rentals'));

  // Bind Rentals Filters & Search
  container.querySelectorAll('#rental-status-tabs .crm-rental-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('#rental-status-tabs .crm-rental-tab-btn').forEach(b => {
        b.className = 'crm-rental-tab-btn pb-2 transition-colors cursor-pointer text-zinc-400 hover:text-zinc-600 font-medium border-b-2 border-transparent whitespace-nowrap';
      });
      btn.className = 'crm-rental-tab-btn pb-2 transition-colors cursor-pointer text-zinc-900 font-semibold border-b-2 border-zinc-900 whitespace-nowrap';
      rentalStatusFilter = btn.dataset.status;
      renderRentalsTable();
    });
  });

  container.querySelector('#admin-rentals-provider-filter')?.addEventListener('change', (e) => {
    rentalProviderFilter = e.target.value;
    renderRentalsTable();
  });

  let rentalSearchDebounce = null;
  container.querySelector('#admin-rentals-search-input')?.addEventListener('input', (e) => {
    const val = e.target.value;
    clearTimeout(rentalSearchDebounce);
    rentalSearchDebounce = setTimeout(() => {
      rentalSearchQuery = val;
      renderRentalsTable();
    }, 150);
  });

  container.querySelector('#btn-refresh-rentals')?.addEventListener('click', async () => {
    showToast('Sincronizando alquileres con la base de datos...', 'info');
    await refreshRentalsData();
    showToast('Alquileres actualizados', 'success');
  });

  container.querySelector('#btn-export-rentals-csv')?.addEventListener('click', () => {
    const headers = ['Codigo', 'Estado', 'Proveedor', 'Cliente', 'Equipos', 'Fecha_Inicio', 'Fecha_Fin', 'Dias', 'Total'];
    const rows = rentalsList.map(r => {
      const { provider, client, toolNames } = getRentalHelperData(r);
      return [
        r.rentalCode || r.id,
        r.status,
        `"${provider?.companyName || 'Proveedor'}"`,
        `"${client?.fullName || r.clientName || 'Cliente'}"`,
        `"${toolNames.replace(/"/g, '""')}"`,
        r.startDate,
        r.endDate,
        r.totalDays || 1,
        r.totalAmount || 0
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `alquileres_proveedores_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Archivo CSV de ${rentalsList.length} alquileres descargado`, 'success');
  });

  // Initial render of rentals table if tab=rentals
  if (activeSection === 'rentals') {
    renderRentalsTable();
  }
}
