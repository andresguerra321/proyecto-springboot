import api from '../api/client.js';
import auth from '../auth/state.js';
import showToast from '../components/toast.js';
import { formatCurrency, formatDate, getRentalStatusBadge } from '../utils/formatters.js';
import { renderIcon } from '../utils/icons.js';
import { openAuthModal } from '../components/auth-modal.js';

export async function renderAdminDashboard() {
  const container = document.getElementById('app-content');
  if (!container) return;

  if (!auth.isAuthenticated() || !auth.isAdmin()) {
    container.innerHTML = `
      <section class="max-w-4xl mx-auto px-4 py-20 text-center">
        <div class="glass-card p-10 max-w-lg mx-auto space-y-4">
          <div class="w-14 h-14 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
            ${renderIcon('ShieldAlert', 'w-7 h-7')}
          </div>
          <h2 class="text-xl font-bold text-white font-display">Área Restringida a Administradores</h2>
          <p class="text-xs text-slate-400">Debes autenticarte con una cuenta que posea el rol ROLE_ADMIN para acceder a este módulo.</p>
          <button id="btn-login-admin" class="btn-primary w-full !py-2.5 text-xs">
            ${renderIcon('LogIn', 'w-4 h-4')} Iniciar Sesión como Admin
          </button>
        </div>
      </section>
    `;
    container.querySelector('#btn-login-admin')?.addEventListener('click', () => openAuthModal('login'));
    return;
  }

  container.innerHTML = `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 space-y-8">
      
      <!-- Admin Header -->
      <div class="glass-card p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-xs font-semibold mb-2">
            ${renderIcon('ShieldCheck', 'w-3.5 h-3.5')} Control y Auditoría General
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Panel de Administración del Sistema
          </h1>
          <p class="text-xs text-slate-400 mt-1">
            Supervisa usuarios, valida empresas proveedoras y audita métricas financieras globales.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <a href="http://localhost:8085/swagger-ui.html" target="_blank" rel="noopener noreferrer" class="btn-secondary !py-2.5 text-xs">
            ${renderIcon('ExternalLink', 'w-3.5 h-3.5')} Swagger API Docs
          </a>
        </div>
      </div>

      <!-- Financial & Inventory Metric Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="admin-metrics-grid">
        <div class="glass-card p-5 animate-pulse bg-slate-900/40">
          <div class="h-4 w-24 bg-slate-800 rounded mb-2"></div>
          <div class="h-8 w-16 bg-slate-800 rounded"></div>
        </div>
        <div class="glass-card p-5 animate-pulse bg-slate-900/40">
          <div class="h-4 w-24 bg-slate-800 rounded mb-2"></div>
          <div class="h-8 w-16 bg-slate-800 rounded"></div>
        </div>
        <div class="glass-card p-5 animate-pulse bg-slate-900/40">
          <div class="h-4 w-24 bg-slate-800 rounded mb-2"></div>
          <div class="h-8 w-16 bg-slate-800 rounded"></div>
        </div>
        <div class="glass-card p-5 animate-pulse bg-slate-900/40">
          <div class="h-4 w-24 bg-slate-800 rounded mb-2"></div>
          <div class="h-8 w-16 bg-slate-800 rounded"></div>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <div class="glass-card overflow-hidden">
        <div class="flex border-b border-slate-800 bg-slate-900/60 px-6 pt-3 overflow-x-auto no-scrollbar">
          <button id="admin-tab-providers" class="px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 border-brand-500 text-brand-400 flex items-center gap-2 transition-all whitespace-nowrap">
            ${renderIcon('Building2', 'w-4 h-4')} Empresas Proveedoras
          </button>
          <button id="admin-tab-users" class="px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 border-transparent text-slate-400 hover:text-white flex items-center gap-2 transition-all whitespace-nowrap">
            ${renderIcon('Users', 'w-4 h-4')} Usuarios Registrados
          </button>
          <button id="admin-tab-rentals" class="px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 border-transparent text-slate-400 hover:text-white flex items-center gap-2 transition-all whitespace-nowrap">
            ${renderIcon('CalendarCheck', 'w-4 h-4')} Supervisión de Alquileres
          </button>
          <button id="admin-tab-reports" class="px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 border-transparent text-slate-400 hover:text-white flex items-center gap-2 transition-all whitespace-nowrap">
            ${renderIcon('BarChart3', 'w-4 h-4')} Analítica y Rankings
          </button>
        </div>

        <!-- Tab Body Container -->
        <div class="p-6" id="admin-tab-body"></div>
      </div>

    </section>
  `;

  await loadAdminMetrics();
  renderProvidersTab();

  // Tab switching
  const tabs = [
    { btn: container.querySelector('#admin-tab-providers'), render: renderProvidersTab },
    { btn: container.querySelector('#admin-tab-users'), render: renderUsersTab },
    { btn: container.querySelector('#admin-tab-rentals'), render: renderRentalsTab },
    { btn: container.querySelector('#admin-tab-reports'), render: renderReportsTab },
  ];

  tabs.forEach(tab => {
    tab.btn.addEventListener('click', () => {
      tabs.forEach(t => {
        t.btn.className = 'px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 border-transparent text-slate-400 hover:text-white flex items-center gap-2 transition-all whitespace-nowrap';
      });
      tab.btn.className = 'px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 border-brand-500 text-brand-400 flex items-center gap-2 transition-all whitespace-nowrap';
      tab.render();
    });
  });

  async function loadAdminMetrics() {
    const grid = container.querySelector('#admin-metrics-grid');
    try {
      const [income, availability] = await Promise.all([
        api.get('/reporting/income').catch(() => ({ totalIncome: 0 })),
        api.get('/reporting/tool-availability').catch(() => ({ availableCount: 0, rentedCount: 0, maintenanceCount: 0 }))
      ]);

      grid.innerHTML = `
        <div class="glass-card p-5 relative overflow-hidden border-slate-800">
          <div class="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Ingresos Totales Brutos</span>
            ${renderIcon('DollarSign', 'w-4 h-4 text-emerald-400')}
          </div>
          <div class="text-2xl font-black text-emerald-400 font-display mt-2">${formatCurrency(income.totalIncome || 0)}</div>
          <div class="text-[11px] text-slate-500 mt-1">Facturación auditada global</div>
        </div>

        <div class="glass-card p-5 relative overflow-hidden border-slate-800">
          <div class="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Herramientas Disponibles</span>
            ${renderIcon('CheckCircle2', 'w-4 h-4 text-emerald-400')}
          </div>
          <div class="text-2xl font-black text-white font-display mt-2">${availability.availableCount || 0}</div>
          <div class="text-[11px] text-slate-500 mt-1">Listas para despacho</div>
        </div>

        <div class="glass-card p-5 relative overflow-hidden border-slate-800">
          <div class="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Herramientas en Alquiler</span>
            ${renderIcon('Clock', 'w-4 h-4 text-blue-400')}
          </div>
          <div class="text-2xl font-black text-blue-400 font-display mt-2">${availability.rentedCount || 0}</div>
          <div class="text-[11px] text-slate-500 mt-1">Actualmente en obras</div>
        </div>

        <div class="glass-card p-5 relative overflow-hidden border-slate-800">
          <div class="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>En Taller / Mantenimiento</span>
            ${renderIcon('AlertTriangle', 'w-4 h-4 text-amber-400')}
          </div>
          <div class="text-2xl font-black text-amber-400 font-display mt-2">${availability.maintenanceCount || 0}</div>
          <div class="text-[11px] text-slate-500 mt-1">Reportes de daños</div>
        </div>
      `;
    } catch (e) {
      console.warn('Could not load admin stats', e);
    }
  }

  async function renderProvidersTab() {
    const body = container.querySelector('#admin-tab-body');
    body.innerHTML = `<div class="py-10 text-center text-slate-400">${renderIcon('Loader2', 'w-6 h-6 animate-spin mx-auto text-brand-400')}</div>`;

    try {
      const providers = await api.get('/providers');

      body.innerHTML = `
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800 bg-slate-900/40">
              <tr>
                <th class="py-3 px-4">Empresa / Razón Social</th>
                <th class="py-3 px-4">NIT / Tax ID</th>
                <th class="py-3 px-4">Teléfono / Ubicación</th>
                <th class="py-3 px-4">Estado Verificación</th>
                <th class="py-3 px-4 text-right">Acción Admin</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              ${providers.map(p => `
                <tr class="hover:bg-slate-900/40 transition-colors">
                  <td class="py-3.5 px-4 font-bold text-white text-sm">
                    ${p.companyName}
                  </td>
                  <td class="py-3.5 px-4 font-mono text-slate-300">
                    ${p.taxId || 'Sin NIT'}
                  </td>
                  <td class="py-3.5 px-4 text-slate-300">
                    <div>${p.contactPhone || '—'}</div>
                    <div class="text-[10px] text-slate-500">${p.city || 'Colombia'}</div>
                  </td>
                  <td class="py-3.5 px-4">
                    ${p.verified ? `
                      <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ${renderIcon('CheckCheck', 'w-3 h-3')} Verificado
                      </span>
                    ` : `
                      <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        ${renderIcon('Clock', 'w-3 h-3')} Pendiente
                      </span>
                    `}
                  </td>
                  <td class="py-3.5 px-4 text-right">
                    ${!p.verified ? `
                      <button class="btn-verify-provider btn-primary !py-1 !px-2.5 text-xs" data-provider-id="${p.id}">
                        ${renderIcon('ShieldCheck', 'w-3.5 h-3.5')} Aprobar y Verificar
                      </button>
                    ` : `
                      <span class="text-xs text-slate-500">Cuenta Activa</span>
                    `}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      body.querySelectorAll('.btn-verify-provider').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await api.patch(`/providers/${btn.dataset.providerId}/verify`);
            showToast('Proveedor verificado y habilitado oficialmente', 'success');
            renderProvidersTab();
          } catch (e) {
            showToast(e.message || 'Error al verificar proveedor', 'error');
          }
        });
      });

    } catch (err) {
      body.innerHTML = `<div class="p-6 text-center text-rose-400 text-xs">${err.message}</div>`;
    }
  }

  async function renderUsersTab() {
    const body = container.querySelector('#admin-tab-body');
    body.innerHTML = `<div class="py-10 text-center text-slate-400">${renderIcon('Loader2', 'w-6 h-6 animate-spin mx-auto text-brand-400')}</div>`;

    try {
      const users = await api.get('/users');

      body.innerHTML = `
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800 bg-slate-900/40">
              <tr>
                <th class="py-3 px-4">Usuario</th>
                <th class="py-3 px-4">Correo Electrónico</th>
                <th class="py-3 px-4">Roles Asignados</th>
                <th class="py-3 px-4">Estado</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              ${users.map(u => `
                <tr class="hover:bg-slate-900/40 transition-colors">
                  <td class="py-3 px-4 font-semibold text-white">
                    ${u.username}
                  </td>
                  <td class="py-3 px-4 text-slate-300">
                    ${u.email}
                  </td>
                  <td class="py-3 px-4">
                    <div class="flex flex-wrap gap-1">
                      ${u.roles.map(r => `
                        <span class="px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          r.includes('ADMIN') ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                          r.includes('PROVEEDOR') ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        }">
                          ${r.replace('ROLE_', '')}
                        </span>
                      `).join('')}
                    </div>
                  </td>
                  <td class="py-3 px-4">
                    <span class="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Activo
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (err) {
      body.innerHTML = `<div class="p-6 text-center text-rose-400 text-xs">${err.message}</div>`;
    }
  }

  async function renderRentalsTab() {
    const body = container.querySelector('#admin-tab-body');
    body.innerHTML = `<div class="py-10 text-center text-slate-400">${renderIcon('Loader2', 'w-6 h-6 animate-spin mx-auto text-brand-400')}</div>`;

    try {
      const rentals = await api.get('/rentals');

      body.innerHTML = `
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800 bg-slate-900/40">
              <tr>
                <th class="py-3 px-4">ID Transacción</th>
                <th class="py-3 px-4">Vigencia Fechas</th>
                <th class="py-3 px-4">Total</th>
                <th class="py-3 px-4">Estado</th>
                <th class="py-3 px-4 text-right">Factura Legal</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              ${rentals.map(r => `
                <tr class="hover:bg-slate-900/40 transition-colors">
                  <td class="py-3 px-4 font-mono font-semibold text-white">
                    #${r.id.substring(0, 8)}
                  </td>
                  <td class="py-3 px-4 text-slate-300">
                    ${formatDate(r.startDate)} al ${formatDate(r.endDate)}
                  </td>
                  <td class="py-3 px-4 font-bold text-white font-display">
                    ${formatCurrency(r.totalAmount)}
                  </td>
                  <td class="py-3 px-4">
                    ${getRentalStatusBadge(r.status)}
                  </td>
                  <td class="py-3 px-4 text-right">
                    <button class="btn-admin-invoice btn-secondary !py-1 text-xs" data-rental-id="${r.id}">
                      ${renderIcon('FileText', 'w-3 h-3')} Ver HTML
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      body.querySelectorAll('.btn-admin-invoice').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            const inv = await api.get(`/billing/invoices/rental/${btn.dataset.rentalId}`);
            if (inv?.id) {
              window.open(`http://localhost:8085/api/v1/billing/invoices/${inv.id}/html`, '_blank');
            } else {
              showToast('Factura en trámite contable', 'info');
            }
          } catch {
            showToast('Factura en trámite contable', 'info');
          }
        });
      });

    } catch (err) {
      body.innerHTML = `<div class="p-6 text-center text-rose-400 text-xs">${err.message}</div>`;
    }
  }

  async function renderReportsTab() {
    const body = container.querySelector('#admin-tab-body');
    body.innerHTML = `<div class="py-10 text-center text-slate-400">${renderIcon('Loader2', 'w-6 h-6 animate-spin mx-auto text-brand-400')}</div>`;

    try {
      const [topTools, topClients] = await Promise.all([
        api.get('/reporting/most-rented-tools').catch(() => []),
        api.get('/reporting/frequent-clients').catch(() => [])
      ]);

      body.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <!-- Top Tools -->
          <div class="glass-card-subtle p-5 space-y-3">
            <h4 class="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              ${renderIcon('Trophy', 'w-4 h-4 text-amber-400')} Top Herramientas Más Alquiladas
            </h4>
            <div class="divide-y divide-slate-800">
              ${topTools.length > 0 ? topTools.map((t, idx) => `
                <div class="py-2.5 flex items-center justify-between text-xs">
                  <div class="flex items-center gap-2.5">
                    <span class="w-5 h-5 rounded-full bg-slate-800 text-brand-400 font-bold flex items-center justify-center text-[10px]">
                      ${idx + 1}
                    </span>
                    <span class="font-semibold text-white">${t.toolName || 'Herramienta'}</span>
                  </div>
                  <span class="font-mono text-slate-400 font-semibold">${t.rentalCount || 0} alquileres</span>
                </div>
              `).join('') : '<p class="text-xs text-slate-500 py-4 text-center">Sin suficientes registros para ranking.</p>'}
            </div>
          </div>

          <!-- Top Clients -->
          <div class="glass-card-subtle p-5 space-y-3">
            <h4 class="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              ${renderIcon('Users', 'w-4 h-4 text-sky-400')} Top Clientes Frecuentes
            </h4>
            <div class="divide-y divide-slate-800">
              ${topClients.length > 0 ? topClients.map((c, idx) => `
                <div class="py-2.5 flex items-center justify-between text-xs">
                  <div class="flex items-center gap-2.5">
                    <span class="w-5 h-5 rounded-full bg-slate-800 text-sky-400 font-bold flex items-center justify-center text-[10px]">
                      ${idx + 1}
                    </span>
                    <span class="font-semibold text-white">${c.clientName || 'Cliente'}</span>
                  </div>
                  <span class="font-mono text-emerald-400 font-semibold">${formatCurrency(c.totalSpent || 0)}</span>
                </div>
              `).join('') : '<p class="text-xs text-slate-500 py-4 text-center">Sin suficientes registros para ranking.</p>'}
            </div>
          </div>

        </div>
      `;
    } catch (err) {
      body.innerHTML = `<div class="p-6 text-center text-rose-400 text-xs">${err.message}</div>`;
    }
  }
}
