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
          <div class="flex flex-col sm:flex-row gap-3 pt-2">
            <button id="btn-demo-admin-login" class="btn-primary flex-1 !py-2.5 text-xs flex items-center justify-center gap-1.5 shadow-sm">
              ${renderIcon('ShieldCheck', 'w-4 h-4')} Entrar como Admin (Demo)
            </button>
            <button id="btn-login-admin" class="btn-secondary flex-1 !py-2.5 text-xs flex items-center justify-center gap-1.5">
              ${renderIcon('LogIn', 'w-4 h-4')} Iniciar Sesión
            </button>
          </div>
        </div>
      </section>
    `;
    container.querySelector('#btn-demo-admin-login')?.addEventListener('click', () => {
      auth.setSession({
        token: 'demo-admin-jwt',
        user: { username: 'admin', role: 'ROLE_ADMIN', profile: { name: 'Admin General', id: 'admin-001' } }
      });
      showToast('Sesión iniciada como Administrador', 'success');
      renderAdminDashboard();
    });
    container.querySelector('#btn-login-admin')?.addEventListener('click', () => openAuthModal('login'));
    return;
  }

  // Initial local state for admin view
  let currentTab = 'all'; // all, client, provider, admin
  let searchQuery = '';
  let usersList = [];

  try {
    const rawUsers = await api.get('/users');
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
    console.warn('Could not fetch real users from backend, fallback to default', err);
  }

  if (usersList.length === 0) {
    usersList = [
      { id: 'usr-01', name: 'Juan Pérez García', email: 'juan.perez@ejemplo.com', role: 'Cliente', date: '13 oct 2026', active: true, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
      { id: 'usr-02', name: 'Carlos Rodríguez', email: 'carlos.rodriguez@ejemplo.com', role: 'Proveedor', date: '11 oct 2026', active: true, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
      { id: 'usr-03', name: 'Laura Gómez', email: 'laura.gomez@ejemplo.com', role: 'Cliente', date: '09 oct 2026', active: true, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
      { id: 'usr-04', name: 'Diego Torres', email: 'diego.torres@ejemplo.com', role: 'Proveedor', date: '07 oct 2026', active: true, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' },
      { id: 'usr-05', name: 'Ana Martínez', email: 'ana.martinez@ejemplo.com', role: 'Cliente', date: '05 oct 2026', active: false, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100' },
      { id: 'usr-06', name: 'Admin General', email: 'admin@toolrent.co', role: 'Administrador', date: '01 oct 2026', active: true, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100' }
    ];
  }

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
              <span class="text-xs font-medium text-slate-500">Ingresos totales</span>
              <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                ${renderIcon('DollarSign', 'w-4 h-4')}
              </div>
            </div>
            <div class="text-2xl font-bold text-slate-900 mt-2">$ 12.450.000</div>
            <div class="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-1">
              <span>↑ 12%</span>
              <span class="text-slate-400 font-normal">vs. mes anterior</span>
            </div>
          </div>

          <!-- Alquileres Activos -->
          <div class="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-slate-500">Alquileres activos</span>
              <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                ${renderIcon('CalendarCheck', 'w-4 h-4')}
              </div>
            </div>
            <div class="text-2xl font-bold text-slate-900 mt-2">18</div>
            <div class="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-1">
              <span>↑ 5%</span>
              <span class="text-slate-400 font-normal">vs. mes anterior</span>
            </div>
          </div>

          <!-- Usuarios -->
          <div class="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-slate-500">Usuarios</span>
              <div class="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                ${renderIcon('Users', 'w-4 h-4')}
              </div>
            </div>
            <div class="text-2xl font-bold text-slate-900 mt-2">42</div>
            <div class="flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-1">
              <span>↑ 8%</span>
              <span class="text-slate-400 font-normal">vs. mes anterior</span>
            </div>
          </div>

          <!-- Herramientas disponibles -->
          <div class="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-slate-500">Herramientas disponibles</span>
              <div class="w-8 h-8 rounded-lg bg-orange-50 text-brand-600 flex items-center justify-center">
                ${renderIcon('Wrench', 'w-4 h-4')}
              </div>
            </div>
            <div class="text-2xl font-bold text-slate-900 mt-2">56</div>
            <div class="text-[11px] text-slate-400 font-normal mt-1">de 78 en total</div>
          </div>
        </div>

        <!-- 3 Middle Analytics Cards -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Herramientas más alquiladas -->
          <div class="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h2 class="text-sm font-bold text-slate-900">Herramientas más alquiladas</h2>
              <p class="text-[11px] text-slate-400 mt-0.5">Top 5 por número de alquileres.</p>
              
              <div class="space-y-3.5 mt-5">
                <div>
                  <div class="flex justify-between text-xs mb-1">
                    <span class="text-slate-700 font-medium">Excavadora hidráulica</span>
                    <span class="text-slate-900 font-bold">24</span>
                  </div>
                  <div class="w-full bg-slate-100 rounded-full h-2">
                    <div class="bg-brand-500 h-2 rounded-full" style="width: 80%"></div>
                  </div>
                </div>

                <div>
                  <div class="flex justify-between text-xs mb-1">
                    <span class="text-slate-700 font-medium">Taladro percutor</span>
                    <span class="text-slate-900 font-bold">18</span>
                  </div>
                  <div class="w-full bg-slate-100 rounded-full h-2">
                    <div class="bg-brand-500 h-2 rounded-full" style="width: 60%"></div>
                  </div>
                </div>

                <div>
                  <div class="flex justify-between text-xs mb-1">
                    <span class="text-slate-700 font-medium">Compresor de aire</span>
                    <span class="text-slate-900 font-bold">15</span>
                  </div>
                  <div class="w-full bg-slate-100 rounded-full h-2">
                    <div class="bg-brand-500 h-2 rounded-full" style="width: 50%"></div>
                  </div>
                </div>

                <div>
                  <div class="flex justify-between text-xs mb-1">
                    <span class="text-slate-700 font-medium">Martillo demoledor</span>
                    <span class="text-slate-900 font-bold">12</span>
                  </div>
                  <div class="w-full bg-slate-100 rounded-full h-2">
                    <div class="bg-brand-500 h-2 rounded-full" style="width: 40%"></div>
                  </div>
                </div>

                <div>
                  <div class="flex justify-between text-xs mb-1">
                    <span class="text-slate-700 font-medium">Andamio multidireccional</span>
                    <span class="text-slate-900 font-bold">10</span>
                  </div>
                  <div class="w-full bg-slate-100 rounded-full h-2">
                    <div class="bg-brand-500 h-2 rounded-full" style="width: 33%"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Clientes frecuentes -->
          <div class="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h2 class="text-sm font-bold text-slate-900">Clientes frecuentes</h2>
              <p class="text-[11px] text-slate-400 mt-0.5">Top 5 por número de alquileres.</p>

              <div class="divide-y divide-slate-100 mt-3">
                <div class="py-2.5 flex items-center justify-between text-xs">
                  <div class="flex items-center gap-3">
                    <span class="w-5 text-slate-400 font-bold text-[11px]">1</span>
                    <span class="text-slate-800 font-medium">Constructora del Norte S.A.S.</span>
                  </div>
                  <span class="text-slate-500 font-semibold text-[11px]">12 alquileres</span>
                </div>

                <div class="py-2.5 flex items-center justify-between text-xs">
                  <div class="flex items-center gap-3">
                    <span class="w-5 text-slate-400 font-bold text-[11px]">2</span>
                    <span class="text-slate-800 font-medium">Juan Carlos Ramírez</span>
                  </div>
                  <span class="text-slate-500 font-semibold text-[11px]">9 alquileres</span>
                </div>

                <div class="py-2.5 flex items-center justify-between text-xs">
                  <div class="flex items-center gap-3">
                    <span class="w-5 text-slate-400 font-bold text-[11px]">3</span>
                    <span class="text-slate-800 font-medium">Obras y Diseños S.A.S</span>
                  </div>
                  <span class="text-slate-500 font-semibold text-[11px]">7 alquileres</span>
                </div>

                <div class="py-2.5 flex items-center justify-between text-xs">
                  <div class="flex items-center gap-3">
                    <span class="w-5 text-slate-400 font-bold text-[11px]">4</span>
                    <span class="text-slate-800 font-medium">Alianza Constructores</span>
                  </div>
                  <span class="text-slate-500 font-semibold text-[11px]">6 alquileres</span>
                </div>

                <div class="py-2.5 flex items-center justify-between text-xs">
                  <div class="flex items-center gap-3">
                    <span class="w-5 text-slate-400 font-bold text-[11px]">5</span>
                    <span class="text-slate-800 font-medium">Proyectos del Valle</span>
                  </div>
                  <span class="text-slate-500 font-semibold text-[11px]">5 alquileres</span>
                </div>
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
                    <!-- Green Disponible 72% -->
                    <circle cx="50" cy="50" r="38" stroke="#22c55e" stroke-width="12" stroke-dasharray="172 238" stroke-dashoffset="0" fill="none" stroke-linecap="round" />
                    <!-- Blue Alquilada 21% -->
                    <circle cx="50" cy="50" r="38" stroke="#3b82f6" stroke-width="12" stroke-dasharray="50 238" stroke-dashoffset="-176" fill="none" stroke-linecap="round" />
                    <!-- Amber Mantenimiento 8% -->
                    <circle cx="50" cy="50" r="38" stroke="#f59e0b" stroke-width="12" stroke-dasharray="19 238" stroke-dashoffset="-228" fill="none" stroke-linecap="round" />
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <span class="text-xl font-bold text-slate-900">78</span>
                    <span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total</span>
                  </div>
                </div>

                <!-- Legend -->
                <div class="space-y-3 text-xs">
                  <div class="flex items-center gap-2">
                    <div class="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                    <div>
                      <div class="font-medium text-slate-700">Disponible</div>
                      <div class="text-[11px] text-slate-400">56 (72%)</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                    <div>
                      <div class="font-medium text-slate-700">Alquilada</div>
                      <div class="text-[11px] text-slate-400">16 (21%)</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                    <div>
                      <div class="font-medium text-slate-700">Mantenimiento</div>
                      <div class="text-[11px] text-slate-400">6 (8%)</div>
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
              Todos (<span id="count-all">42</span>)
            </button>
            <button class="admin-tab-btn py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900" data-tab="client">
              Clientes (<span id="count-clients">31</span>)
            </button>
            <button class="admin-tab-btn py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900" data-tab="provider">
              Proveedores (<span id="count-providers">10</span>)
            </button>
            <button class="admin-tab-btn py-3 border-b-2 border-transparent text-slate-500 hover:text-slate-900" data-tab="admin">
              Administradores (<span id="count-admins">1</span>)
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
                  <th class="py-3 px-6 text-right">Acciones</th>
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
              <p class="text-xs text-slate-500 mt-0.5">Gestiona el inventario global de herramientas.</p>
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
                  <th class="py-3 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">
                <tr class="hover:bg-slate-50/50 transition-colors">
                  <td class="py-3 px-6">
                    <img src="https://images.unsplash.com/photo-1504148455328-c376907d081c?w=120" class="w-12 h-10 object-cover rounded-md border border-slate-200" />
                  </td>
                  <td class="py-3 px-4 font-semibold text-slate-900">Martillo demoledor 10 kg</td>
                  <td class="py-3 px-4 text-slate-500">Construcciones del Norte S.A.S.</td>
                  <td class="py-3 px-4 text-slate-500">Demolición</td>
                  <td class="py-3 px-4 font-semibold text-slate-900">$ 85.000</td>
                  <td class="py-3 px-4">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Disponible
                    </span>
                  </td>
                  <td class="py-3 px-6 text-right">
                    <button class="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors mr-1">
                      ${renderIcon('Edit', 'w-4 h-4')}
                    </button>
                    <button class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors">
                      ${renderIcon('Trash2', 'w-4 h-4')}
                    </button>
                  </td>
                </tr>

                <tr class="hover:bg-slate-50/50 transition-colors">
                  <td class="py-3 px-6">
                    <img src="https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=120" class="w-12 h-10 object-cover rounded-md border border-slate-200" />
                  </td>
                  <td class="py-3 px-4 font-semibold text-slate-900">Excavadora hidráulica 20 ton</td>
                  <td class="py-3 px-4 text-slate-500">Juan Carlos Ramírez</td>
                  <td class="py-3 px-4 text-slate-500">Movimiento de tierras</td>
                  <td class="py-3 px-4 font-semibold text-slate-900">$ 1.200.000</td>
                  <td class="py-3 px-4">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Alquilada
                    </span>
                  </td>
                  <td class="py-3 px-6 text-right">
                    <button class="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors mr-1">
                      ${renderIcon('Edit', 'w-4 h-4')}
                    </button>
                    <button class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors">
                      ${renderIcon('Trash2', 'w-4 h-4')}
                    </button>
                  </td>
                </tr>

                <tr class="hover:bg-slate-50/50 transition-colors">
                  <td class="py-3 px-6">
                    <img src="https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=120" class="w-12 h-10 object-cover rounded-md border border-slate-200" />
                  </td>
                  <td class="py-3 px-4 font-semibold text-slate-900">Mezcladora de concreto 400 L</td>
                  <td class="py-3 px-4 text-slate-500">Obras y Diseños S.A.S</td>
                  <td class="py-3 px-4 text-slate-500">Concretos</td>
                  <td class="py-3 px-4 font-semibold text-slate-900">$ 120.000</td>
                  <td class="py-3 px-4">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Disponible
                    </span>
                  </td>
                  <td class="py-3 px-6 text-right">
                    <button class="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors mr-1">
                      ${renderIcon('Edit', 'w-4 h-4')}
                    </button>
                    <button class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors">
                      ${renderIcon('Trash2', 'w-4 h-4')}
                    </button>
                  </td>
                </tr>
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
                <input type="text" id="nu-name" required placeholder="Ej. María González" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-500" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Correo electrónico *</label>
                <input type="email" id="nu-email" required placeholder="ejemplo@correo.com" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-500" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Contraseña *</label>
                <div class="relative">
                  <input type="password" id="nu-password" required placeholder="Mín. 8 caracteres" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-500" />
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
            <input type="text" id="eu-name" required class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-500" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Correo electrónico</label>
            <input type="email" id="eu-email" required class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-500" />
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

      const statusBadge = u.active
        ? `<span class="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Activo</span>`
        : `<span class="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600"><span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Inactivo</span>`;

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
          <td class="py-3 px-6 text-right">
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

  // Form submit: Nuevo Usuario
  container.querySelector('#form-new-user')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = container.querySelector('#nu-name')?.value;
    const email = container.querySelector('#nu-email')?.value;
    const role = container.querySelector('input[name="nu-role"]:checked')?.value || 'Cliente';

    const newUser = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      name,
      email,
      role,
      date: '13 oct 2026',
      active: true,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
    };

    usersList.unshift(newUser);
    renderUsersTable();
    closeDrawer();
    e.target.reset();
    showToast(`Usuario ${name} creado con éxito`, 'success');
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

  container.querySelector('#form-edit-user')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = container.querySelector('#eu-id').value;
    const u = usersList.find(x => x.id === id);
    if (u) {
      u.name = container.querySelector('#eu-name').value;
      u.email = container.querySelector('#eu-email').value;
      u.role = container.querySelector('#eu-role').value;
      renderUsersTable();
      closeEditModal();
      showToast(`Usuario ${u.name} actualizado`, 'success');
    }
  });

  // Modal: Eliminar Usuario
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

  btnConfirmDelete?.addEventListener('click', () => {
    if (userToDelete) {
      usersList = usersList.filter(x => x.id !== userToDelete.id);
      renderUsersTable();
      closeDeleteModal();
      showToast('Usuario eliminado del sistema', 'success');
    }
  });
}
