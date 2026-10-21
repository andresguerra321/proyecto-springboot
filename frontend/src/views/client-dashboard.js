import api from '../api/client.js';
import auth from '../auth/state.js';
import showToast from '../components/toast.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { renderIcon } from '../utils/icons.js';
import { openAuthModal } from '../components/auth-modal.js';
import { openCheckoutModal, openRentalInvoiceModal } from './rental-modal.js';
import modal from '../components/modal.js';
import { notificationsStore } from '../utils/notifications-store.js';
import { renderSparkline, renderSegmentedLevel, renderCrmStatusBadge } from '../components/crm-sparkline.js';
import { openCrmOverviewCard } from '../components/crm-overview-card.js';
import { setupCrmBulkBar } from '../components/crm-bulk-bar.js';
import { showRowActionPopover } from '../components/row-action-popover.js';

export async function renderClientDashboard() {
  const container = document.getElementById('app-content');
  if (!container) return;

  if (!auth.isAuthenticated()) {
    container.innerHTML = `
      <section class="max-w-4xl mx-auto px-4 py-20 text-center animate-fade-in">
        <div class="crm-card p-10 max-w-lg mx-auto space-y-4">
          <div class="w-14 h-14 rounded-2xl bg-orange-50 text-orange-600 border border-orange-200/80 flex items-center justify-center mx-auto shadow-2xs">
            ${renderIcon('Lock', 'w-7 h-7')}
          </div>
          <h2 class="text-xl font-bold text-zinc-900 font-display">Portal para Clientes</h2>
          <p class="text-xs text-zinc-500 leading-relaxed">Inicia sesión con tu cuenta de cliente para supervisar reservas, descargar facturas fiscales y gestionar contratos de maquinaria.</p>
          <div class="flex justify-center pt-2">
            <button id="btn-login-prompt" class="btn-primary !py-2.5 !px-8 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm cursor-pointer">
              ${renderIcon('LogIn', 'w-4 h-4')} Iniciar Sesión con tu Cuenta
            </button>
          </div>
        </div>
      </section>
    `;
    container.querySelector('#btn-login-prompt')?.addEventListener('click', () => openAuthModal('login'));
    return;
  }

  const user = auth.getUser();
  const verifiedSession = auth.getVerifiedSession();
  const clientName = verifiedSession?.nombre || user?.profile?.fullName || user?.username || 'Cliente';
  const clientEmail = verifiedSession?.email || user?.email || 'cliente@toolrent.co';
  const clientId = verifiedSession?.id || user?.profile?.id || user?.id;

  let activeTab = 'all'; // all, in_progress, overdue, pending, completed
  let searchQuery = '';
  let rawRentals = [];
  let toolsList = [];
  let toolMap = new Map();
  let claimsByRentalMap = new Map();
  let bulkBarManager = null;

  function isRentalReceived(rental) {
    if (rental.status === 'IN_PROGRESS' || rental.status === 'COMPLETED') return true;
    try {
      const receivedMap = JSON.parse(localStorage.getItem('toolrent_received_rentals') || '{}');
      return !!receivedMap[rental.id];
    } catch (_) {
      return false;
    }
  }

  function getRentalTimeStatus(rental) {
    if (rental.status === 'COMPLETED' || rental.status === 'CANCELLED') {
      return { isOverdue: false, isDueToday: false, diffDays: 0 };
    }
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const endStr = rental.endDate ? rental.endDate.split('T')[0] : '';
    if (!endStr) return { isOverdue: false, isDueToday: false, diffDays: 0 };

    const todayDate = new Date(todayStr + 'T00:00:00');
    const endDate = new Date(endStr + 'T00:00:00');
    const diffTime = todayDate.getTime() - endDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return { isOverdue: true, isDueToday: false, diffDays };
    } else if (diffDays === 0) {
      return { isOverdue: false, isDueToday: true, diffDays: 0 };
    }
    return { isOverdue: false, isDueToday: false, diffDays: Math.abs(diffDays) };
  }

  function formatPeriodCompact(start, end) {
    if (!start) return '';
    const sStr = formatDate(start);
    if (!end) return sStr;
    const eStr = formatDate(end);
    const sParts = sStr.trim().split(' ');
    const eParts = eStr.trim().split(' ');
    if (sParts.length === 3 && eParts.length === 3 && sParts[2] === eParts[2]) {
      return `${sParts[0]} ${sParts[1]} → ${eStr}`;
    }
    return `${sStr} → ${eStr}`;
  }

  // Initial loading shell
  container.innerHTML = `
    <div class="min-h-screen crm-panel-bg text-zinc-800 pb-20 select-none">
      <div class="w-full max-w-7xl 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div class="flex items-center gap-3.5">
            <div class="w-11 h-11 rounded-xl bg-white border border-zinc-200/80 shadow-2xs text-zinc-800 flex items-center justify-center font-bold text-lg flex-shrink-0">
              ${renderIcon('UserCheck', 'w-5 h-5 text-zinc-700')}
            </div>
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <h1 class="text-xl sm:text-2xl font-semibold text-zinc-900 tracking-tight font-display">Mis Alquileres y Reservas</h1>
                ${renderCrmStatusBadge('VERIFIED', clientName)}
                <span class="text-xs text-zinc-400 font-mono">${clientEmail}</span>
              </div>
              <p class="text-xs text-zinc-500 mt-0.5">Seguimiento de despacho en faena, vigencia de contratos y comprobantes contables con IVA.</p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2.5">
            ${auth.isProvider() ? `
              <a href="#/provider" class="border border-orange-200 bg-orange-50 hover:bg-orange-100/70 text-orange-700 rounded-xl px-3.5 py-2 text-xs font-medium shadow-2xs flex items-center gap-1.5 transition-colors">
                ${renderIcon('Building2', 'w-3.5 h-3.5 text-orange-600')}
                <span>Panel Proveedor</span>
              </a>
            ` : ''}

            <a href="#/catalog" class="bg-orange-600 hover:bg-orange-500 text-white rounded-xl px-4 py-2 text-xs font-medium shadow-sm flex items-center gap-1.5 transition-colors">
              ${renderIcon('PlusCircle', 'w-4 h-4')}
              <span>Nuevo Alquiler</span>
            </a>

            <button id="btn-refresh-rentals" class="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 shadow-2xs transition-colors cursor-pointer" title="Actualizar datos">
              ${renderIcon('RefreshCw', 'w-3.5 h-3.5 text-zinc-400')}
            </button>
          </div>
        </div>

        <!-- 4 Top KPI Cards with Sparklines (CRM Minimalist) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4" id="client-kpi-container">
          
          <div class="crm-card p-4 flex items-center justify-between group hover:border-zinc-300 transition-colors">
            <div class="space-y-1">
              <span class="text-xs text-zinc-500 font-normal">Alquileres Totales</span>
              <div id="kpi-total-rentals" class="text-2xl font-semibold text-zinc-900 tabular-nums tracking-tight font-display">0</div>
              <div class="flex items-center gap-1.5 text-xs">
                <span class="text-emerald-600 font-medium">Historial</span>
                <span class="text-zinc-400 text-[11px]">contratos registrados</span>
              </div>
            </div>
            <div class="pl-2">
              ${renderSparkline({ color: 'emerald', points: [2, 5, 4, 8, 12, 10, 14], width: 84, height: 36 })}
            </div>
          </div>

          <div class="crm-card p-4 flex items-center justify-between group hover:border-zinc-300 transition-colors">
            <div class="space-y-1">
              <span class="text-xs text-zinc-500 font-normal">En Faena / Obra</span>
              <div id="kpi-active-rentals" class="text-2xl font-semibold text-zinc-900 tabular-nums tracking-tight font-display">0</div>
              <div class="flex items-center gap-1.5 text-xs">
                <span class="text-emerald-600 font-medium">Activos</span>
                <span class="text-zinc-400 text-[11px]">en uso actual</span>
              </div>
            </div>
            <div class="pl-2">
              ${renderSparkline({ color: 'orange', points: [1, 3, 2, 5, 4, 6, 8], width: 84, height: 36 })}
            </div>
          </div>

          <div class="crm-card p-4 flex items-center justify-between group hover:border-zinc-300 transition-colors">
            <div class="space-y-1">
              <span class="text-xs text-zinc-500 font-normal">Por Pagar / Reserva</span>
              <div id="kpi-pending-rentals" class="text-2xl font-semibold text-zinc-900 tabular-nums tracking-tight font-display">0</div>
              <div class="flex items-center gap-1.5 text-xs">
                <span id="kpi-pending-sub" class="text-zinc-400 text-[11px]">Sin pagos pendientes</span>
              </div>
            </div>
            <div class="pl-2">
              ${renderSparkline({ color: 'blue', points: [1, 2, 4, 2, 5, 3, 4], width: 84, height: 36 })}
            </div>
          </div>

          <div class="crm-card p-4 flex items-center justify-between group hover:border-zinc-300 transition-colors">
            <div class="space-y-1">
              <span class="text-xs text-zinc-500 font-normal">Inversión Acumulada</span>
              <div id="kpi-total-spent" class="text-2xl font-semibold text-zinc-900 tabular-nums tracking-tight font-display">$0</div>
              <div class="flex items-center gap-1.5 text-xs">
                <span class="text-emerald-600 font-medium">Total</span>
                <span class="text-zinc-400 text-[11px]">facturación liquidad</span>
              </div>
            </div>
            <div class="pl-2">
              ${renderSparkline({ color: 'emerald', points: [8, 14, 22, 19, 28, 35, 42], width: 84, height: 36 })}
            </div>
          </div>

        </div>

        <!-- Underline Tabs -->
        <div class="border-b border-zinc-200/80">
          <nav class="flex items-center space-x-6 overflow-x-auto no-scrollbar" id="client-tabs-nav">
            <button data-tab="all" class="crm-tab-btn flex items-center gap-2 text-xs transition-colors cursor-pointer crm-tab-active">
              <span>Todas las Solicitudes</span>
              <span id="badge-all" class="px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-100 text-zinc-600 border border-zinc-200">0</span>
            </button>
            <button data-tab="in_progress" class="crm-tab-btn flex items-center gap-2 text-xs transition-colors cursor-pointer crm-tab-inactive">
              <span>En Faena / Activos</span>
              <span id="badge-active" class="px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-100 text-zinc-600 border border-zinc-200">0</span>
            </button>
            <button data-tab="overdue" class="crm-tab-btn flex items-center gap-2 text-xs transition-colors cursor-pointer crm-tab-inactive">
              <span class="text-rose-600 font-semibold flex items-center gap-1">${renderIcon('AlertTriangle', 'w-3.5 h-3.5 text-rose-500')} Retorno Vencido</span>
              <span id="badge-overdue" class="px-1.5 py-0.2 rounded text-[10px] font-mono bg-rose-100 text-rose-700 font-bold border border-rose-200">0</span>
            </button>
            <button data-tab="pending" class="crm-tab-btn flex items-center gap-2 text-xs transition-colors cursor-pointer crm-tab-inactive">
              <span>Por Pagar / Pendientes</span>
              <span id="badge-pending" class="px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-100 text-zinc-600 border border-zinc-200">0</span>
            </button>
            <button data-tab="completed" class="crm-tab-btn flex items-center gap-2 text-xs transition-colors cursor-pointer crm-tab-inactive">
              <span>Completadas</span>
              <span id="badge-completed" class="px-1.5 py-0.2 rounded text-[10px] font-mono bg-zinc-100 text-zinc-600 border border-zinc-200">0</span>
            </button>
          </nav>
        </div>

        <!-- Toolbar & Table Container -->
        <div id="client-table-stage" class="space-y-4">
          <div class="py-12 flex justify-center items-center text-zinc-400 gap-2.5">
            ${renderIcon('Loader2', 'w-5 h-5 animate-spin text-orange-600')}
            <span class="text-xs font-medium">Cargando contratos y reservas...</span>
          </div>
        </div>

      </div>
    </div>
  `;

  // Attach refresh handler
  container.querySelector('#btn-refresh-rentals')?.addEventListener('click', () => {
    showToast('Sincronizando tus transacciones...', 'info');
    loadData();
  });

  // Attach tab switcher
  container.querySelectorAll('.crm-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      container.querySelectorAll('.crm-tab-btn').forEach(b => {
        const isActive = b.dataset.tab === activeTab;
        b.className = `crm-tab-btn flex items-center gap-2 text-xs transition-colors cursor-pointer ${
          isActive ? 'crm-tab-active' : 'crm-tab-inactive'
        }`;
      });
      renderTable();
    });
  });

  async function loadData() {
    try {
      const [rentals, tools] = await Promise.all([
        api.get(`/rentals/client/${clientId}`).catch(() => []),
        api.get('/tools').catch(() => [])
      ]);

      rawRentals = Array.isArray(rentals) ? rentals : [];
      toolsList = Array.isArray(tools) ? tools : [];
      toolMap = new Map(toolsList.map(t => [t.id, t]));

      // Query claims for each rental to prevent duplicate refunds/claims
      try {
        const claimsList = await Promise.all(
          rawRentals.map(r => api.get(`/rentals/${r.id}/claims`).catch(() => []))
        );
        rawRentals.forEach((r, idx) => {
          claimsByRentalMap.set(r.id, Array.isArray(claimsList[idx]) ? claimsList[idx] : []);
        });
      } catch (ignored) {}

      updateKpis();
      renderTable();
    } catch (err) {
      console.warn('Error loading client dashboard data', err);
      const stage = container.querySelector('#client-table-stage');
      if (stage) {
        stage.innerHTML = `
          <div class="crm-card p-8 text-center text-rose-500 text-xs">
            ${renderIcon('AlertCircle', 'w-6 h-6 mx-auto mb-2')}
            ${err.message || 'No fue posible sincronizar tu historial de alquileres'}
          </div>
        `;
      }
    }
  }

  function updateKpis() {
    const total = rawRentals.length;
    const active = rawRentals.filter(r => r.status === 'IN_PROGRESS' || r.status === 'CONFIRMED').length;
    const pending = rawRentals.filter(r => r.status === 'PENDING').length;
    const completed = rawRentals.filter(r => r.status === 'COMPLETED').length;
    const totalSpent = rawRentals.reduce((sum, r) => sum + (parseFloat(r.totalAmount) || parseFloat(r.subtotal) || 0), 0);

    const k1 = container.querySelector('#kpi-total-rentals');
    if (k1) k1.textContent = total;

    const k2 = container.querySelector('#kpi-active-rentals');
    if (k2) k2.textContent = active;

    const k3 = container.querySelector('#kpi-pending-rentals');
    if (k3) k3.textContent = pending;

    const k3sub = container.querySelector('#kpi-pending-sub');
    if (k3sub) {
      k3sub.innerHTML = pending > 0 ? `<span class="text-orange-600 font-medium">${pending} por pagar</span>` : 'Al día';
    }

    const k4 = container.querySelector('#kpi-total-spent');
    if (k4) k4.textContent = formatCurrency(totalSpent);

    const bAll = container.querySelector('#badge-all');
    if (bAll) bAll.textContent = total;
    const bAct = container.querySelector('#badge-active');
    if (bAct) bAct.textContent = active;
    const bPend = container.querySelector('#badge-pending');
    if (bPend) bPend.textContent = pending;
    const bComp = container.querySelector('#badge-completed');
    if (bComp) bComp.textContent = completed;

    const overdueCount = rawRentals.filter(r => (r.status === 'IN_PROGRESS' || r.status === 'CONFIRMED' || isRentalReceived(r)) && getRentalTimeStatus(r).isOverdue).length;
    const bOverdue = container.querySelector('#badge-overdue');
    if (bOverdue) {
      bOverdue.textContent = overdueCount;
      if (overdueCount > 0) {
        bOverdue.className = 'px-1.5 py-0.2 rounded text-[10px] font-mono bg-rose-600 text-white font-bold animate-pulse';
      }
    }

    if (overdueCount > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const alertedKey = 'toolrent_alerted_overdue_' + todayStr;
      if (!sessionStorage.getItem(alertedKey)) {
        sessionStorage.setItem(alertedKey, 'true');
        notificationsStore.addNotification({
          type: 'OVERDUE_ALERT',
          title: `⚠️ Devolución requerida: ${overdueCount} equipo(s) vencido(s)`,
          message: 'El plazo de alquiler ha finalizado. Por favor gestiona la entrega de maquinaria para liberar tu garantía.',
          date: new Date().toISOString()
        });
      }
    }
  }

  function renderTable() {
    const stage = container.querySelector('#client-table-stage');
    if (!stage) return;

    // Filter by tab
    let filtered = rawRentals.filter(r => {
      if (activeTab === 'in_progress') return r.status === 'IN_PROGRESS' || r.status === 'CONFIRMED';
      if (activeTab === 'overdue') return (r.status === 'IN_PROGRESS' || r.status === 'CONFIRMED' || isRentalReceived(r)) && getRentalTimeStatus(r).isOverdue;
      if (activeTab === 'pending') return r.status === 'PENDING';
      if (activeTab === 'completed') return r.status === 'COMPLETED';
      return true;
    });

    const overdueList = rawRentals.filter(r => (r.status === 'IN_PROGRESS' || r.status === 'CONFIRMED' || isRentalReceived(r)) && getRentalTimeStatus(r).isOverdue);
    const dueTodayList = rawRentals.filter(r => (r.status === 'IN_PROGRESS' || r.status === 'CONFIRMED' || isRentalReceived(r)) && getRentalTimeStatus(r).isDueToday);

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(r => {
        const code = (r.rentalCode || r.id || '').toLowerCase();
        const firstItem = r.items?.[0];
        const tool = firstItem ? toolMap.get(firstItem.toolId) : null;
        const toolName = (tool?.name || firstItem?.toolName || '').toLowerCase();
        return code.includes(q) || toolName.includes(q);
      });
    }

    // Sort newest first
    filtered.sort((a, b) => new Date(b.createdAt || b.startDate || 0) - new Date(a.createdAt || a.startDate || 0));

    stage.innerHTML = `
      <!-- Toolbar -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div class="relative flex-1 max-w-sm">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            ${renderIcon('Search', 'w-3.5 h-3.5')}
          </span>
          <input 
            type="text" 
            id="client-search-input" 
            value="${searchQuery}" 
            placeholder="Buscar por código de reserva o herramienta..." 
            class="w-full pl-9 pr-3 py-1.5 bg-white border border-zinc-200/90 rounded-xl text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 transition-all shadow-2xs" 
          />
        </div>

        <div class="flex items-center gap-2">
          <a href="#/catalog" class="border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-xl px-3 py-1.5 text-xs font-medium shadow-2xs flex items-center gap-1.5 transition-colors">
            ${renderIcon('Plus', 'w-3.5 h-3.5 text-zinc-400')}
            <span>Alquilar Más</span>
          </a>
        </div>
      </div>

      <!-- Table or Empty State -->
      ${filtered.length === 0 ? `
        <div class="crm-card p-12 text-center space-y-3">
          <div class="w-14 h-14 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto border border-zinc-200">
            ${renderIcon('CalendarX', 'w-7 h-7')}
          </div>
          <h3 class="text-base font-semibold text-zinc-900">${rawRentals.length === 0 ? 'No tienes alquileres registrados' : 'No hay alquileres en esta categoría'}</h3>
          <p class="text-xs text-zinc-500 max-w-md mx-auto">
            ${rawRentals.length === 0 
              ? 'Aún no has solicitado maquinaria. Explora el catálogo público para cotizar equipos certificados con entrega garantizada en obra.' 
              : 'Explora el catálogo público para cotizar y alquilar maquinaria certificada con entrega en faena.'}
          </p>
          <div class="pt-2">
            <a href="#/catalog" class="bg-orange-600 hover:bg-orange-500 text-white rounded-xl px-5 py-2.5 text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 transition-colors">
              ${renderIcon('PlusCircle', 'w-4 h-4')} Explorar Catálogo
            </a>
          </div>
        </div>
      ` : `
        <!-- Alerta Crítica 1: Plazo de Alquiler Vencido (Aviso de Devolución Requerida) -->
        ${overdueList.length > 0 ? `
          <div class="mb-3.5 p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs select-none">
            <div class="flex items-start sm:items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-xl bg-rose-100 border border-rose-300 text-rose-600 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0 shadow-2xs">
                ${renderIcon('AlertOctagon', 'w-5 h-5 text-rose-600 animate-pulse')}
              </div>
              <div class="space-y-0.5 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 bg-rose-200/80 px-2 py-0.5 rounded-full">
                    ⚠️ Plazo de Alquiler Vencido
                  </span>
                  <span class="font-bold text-rose-950 text-xs sm:text-sm">
                    Tienes ${overdueList.length === 1 ? '1 equipo que debes devolver hoy' : `${overdueList.length} equipos que debes devolver hoy`}
                  </span>
                </div>
                <p class="text-xs text-rose-700 leading-normal">
                  El tiempo contratado en obra ya finalizó. Por favor gestiona la <strong>devolución técnica</strong> de los equipos para evitar cobros de mora diaria y proceder con la liberación de tu depósito de garantía.
                </p>
              </div>
            </div>
            <button id="btn-filter-overdue" class="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer">
              <span>Filtrar vencidos (${overdueList.length})</span>
              <span>&rarr;</span>
            </button>
          </div>
        ` : dueTodayList.length > 0 ? `
          <div class="mb-3.5 p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs select-none">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center flex-shrink-0">
                ${renderIcon('Clock', 'w-4 h-4 text-amber-600')}
              </div>
              <div>
                <span class="font-bold text-amber-900 text-xs">Retorno programado para hoy (${dueTodayList.length} equipo)</span>
                <p class="text-[11px] text-amber-700 mt-0.5">La vigencia contratada de tu reserva culmina hoy. Alista el equipo para entrega al transportista o devolución en bodega.</p>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Barra Informativa: Cobertura de Alquiler y Garantía ToolRent -->
        <div class="mb-3.5 px-4 py-3 bg-slate-50/90 border border-slate-200/90 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs select-none">
          <div class="flex items-start sm:items-center gap-3 min-w-0">
            <div class="w-8 h-8 rounded-xl bg-orange-100/80 text-[#ea580c] flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0 shadow-2xs">
              ${renderIcon('ShieldCheck', 'w-4 h-4')}
            </div>
            <div class="space-y-0.5 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded">
                  Información
                </span>
                <span class="font-bold text-slate-800 text-xs">
                  Garantía y Ciclo Operativo ToolRent
                </span>
              </div>
              <p class="text-[11px] text-slate-500 leading-normal">
                Verifica la recepción física en obra antes de operar. Al culminar el plazo, gestiona la devolución técnica para la restitución del depósito de garantía.
              </p>
            </div>
          </div>

          <!-- Indicadores de estado de cobertura -->
          <div class="flex items-center gap-2 flex-wrap flex-shrink-0 text-[11px] pt-1 md:pt-0 border-t md:border-t-0 border-slate-200/60">
            <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/80 border border-slate-200/70 text-slate-600 font-medium shadow-2xs">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Recepción validada en faena</span>
            </div>
            <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/80 border border-slate-200/70 text-slate-600 font-medium shadow-2xs">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Custodia y Depósito 100%</span>
            </div>
          </div>
        </div>

        <!-- 1. Desktop & Laptop Table (Completamente Responsiva, sin desbordes ni texto cortado) -->
        <div class="crm-card overflow-hidden hidden md:block w-full">
          <div class="overflow-x-auto w-full no-scrollbar">
            <table class="w-full text-left text-xs table-auto">
              <thead class="crm-table-header border-b border-zinc-200/70 bg-zinc-50/50">
                <tr>
                  <th class="py-3 px-3 w-10 text-center">
                    <input type="checkbox" id="select-all-client" class="w-4 h-4 rounded border-zinc-300 text-orange-600 focus:ring-0 cursor-pointer" />
                  </th>
                  <th class="py-3 px-3 whitespace-nowrap">Código / Fecha</th>
                  <th class="py-3 px-3 min-w-[170px]">Equipos en Alquiler</th>
                  <th class="py-3 px-3 whitespace-nowrap">Periodo en Obra</th>
                  <th class="py-3 px-3 whitespace-nowrap">Total</th>
                  <th class="py-3 px-3 whitespace-nowrap">Estado Operativo</th>
                  <th class="py-3 px-3 text-right whitespace-nowrap pr-4">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-100">
                ${filtered.map(rental => {
                  const items = rental.items || [];
                  const firstItem = items[0];
                  const tool = firstItem ? toolMap.get(firstItem.toolId) : null;
                  const toolName = tool?.name || firstItem?.toolName || 'Maquinaria de Obra';
                  const toolImg = tool?.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=100';
                  const rentalCode = rental.rentalCode || `RNT-${String(rental.id).slice(0, 8).toUpperCase()}`;
                  const claims = claimsByRentalMap.get(rental.id) || [];
                  const hasRefundClaim = claims.some(c => c.claimType === 'REFUND' && c.status !== 'REJECTED');
                  const hasActiveWarranty = claims.some(c => c.claimType !== 'REFUND' && (c.status === 'PENDING' || c.status === 'APPROVED'));
                  const isCancelled = rental.status === 'CANCELLED';
                  const isPending = rental.status === 'PENDING';

                  const timeStatus = getRentalTimeStatus(rental);
                  const isReceived = isRentalReceived(rental);
                  const isOverdue = timeStatus.isOverdue;
                  const isDueToday = timeStatus.isDueToday;

                  let statusBadgeHtml = '';
                  let statusSubtext = '';

                  if (rental.status === 'COMPLETED') {
                    statusBadgeHtml = renderCrmStatusBadge('COMPLETED');
                    statusSubtext = '<span class="text-[10px] text-zinc-400">Devolución conforme</span>';
                  } else if (rental.status === 'CANCELLED') {
                    statusBadgeHtml = renderCrmStatusBadge('CANCELLED');
                    statusSubtext = '<span class="text-[10px] text-zinc-400">Cancelado</span>';
                  } else if (rental.status === 'PENDING') {
                    statusBadgeHtml = renderCrmStatusBadge('PENDING');
                    statusSubtext = '<span class="text-[10px] text-amber-600 font-medium">Pago pendiente</span>';
                  } else if (isOverdue) {
                    statusBadgeHtml = renderCrmStatusBadge('OVERDUE', `VENCIDO (${timeStatus.diffDays}d)`);
                    statusSubtext = '<span class="text-[10px] text-rose-600 font-bold block animate-pulse">¡Retorno requerido!</span>';
                  } else if (isDueToday) {
                    statusBadgeHtml = renderCrmStatusBadge('RETURN_DUE', 'RETORNO HOY');
                    statusSubtext = '<span class="text-[10px] text-amber-700 font-semibold block">Vence hoy</span>';
                  } else if (rental.status === 'CONFIRMED' && !isReceived) {
                    statusBadgeHtml = renderCrmStatusBadge('CONFIRMED', 'POR RECIBIR');
                    statusSubtext = '<span class="text-[10px] text-blue-600 font-medium block">En despacho a obra</span>';
                  } else {
                    statusBadgeHtml = renderCrmStatusBadge('IN_PROGRESS', 'EN FAENA');
                    statusSubtext = `<span class="text-[10px] text-zinc-400">${timeStatus.diffDays}d restantes</span>`;
                  }

                  const rowBg = isOverdue ? 'bg-rose-50/50 hover:bg-rose-50/80 border-l-4 border-l-rose-500' : isDueToday ? 'bg-amber-50/40 hover:bg-amber-50/70 border-l-4 border-l-amber-500' : 'hover:bg-zinc-50/80';

                  return `
                    <tr class="crm-client-rental-row ${rowBg} transition-colors cursor-pointer group" data-rental-id="${rental.id}">
                      <td class="py-3 px-3 text-center" onclick="event.stopPropagation()">
                        <input type="checkbox" class="crm-row-checkbox w-4 h-4 rounded border-zinc-300 text-orange-600 focus:ring-0 cursor-pointer" data-id="${rental.id}" />
                      </td>
                      <td class="py-3 px-3 whitespace-nowrap">
                        <span class="font-mono font-bold text-zinc-900 block">${rentalCode}</span>
                        <span class="text-[10px] text-zinc-400 font-mono">${formatDate(rental.createdAt || rental.startDate)}</span>
                      </td>
                      <td class="py-3 px-3 min-w-0">
                        <div class="flex items-center gap-2">
                          <img src="${toolImg}" class="w-8 h-8 rounded-lg object-contain bg-zinc-50 border border-zinc-200/80 p-0.5 flex-shrink-0" onerror="this.src='https://images.unsplash.com/photo-1504148455328-c376907d081c?w=100'" />
                          <div class="min-w-0 flex-1">
                            <div class="font-medium text-zinc-800 text-xs truncate group-hover:text-orange-600 transition-colors max-w-[130px] lg:max-w-[190px] xl:max-w-[240px] 2xl:max-w-[320px]">${toolName}</div>
                            <div class="text-[10px] text-zinc-400">${items.length > 1 ? `+${items.length - 1} ítem(s)` : '1 equipo'}</div>
                          </div>
                        </div>
                      </td>
                      <td class="py-3 px-3 whitespace-nowrap text-zinc-600">
                        <div class="font-medium text-zinc-800">${formatPeriodCompact(rental.startDate, rental.endDate)}</div>
                        <div class="text-[10px] text-zinc-400 mt-0.5">${rental.totalDays || 1} día(s) en faena</div>
                      </td>
                      <td class="py-3 px-3 whitespace-nowrap font-medium text-zinc-900 tabular-nums">
                        ${formatCurrency(rental.totalAmount || rental.subtotal || 255000)}
                      </td>
                      <td class="py-3 px-3 whitespace-nowrap">
                        ${statusBadgeHtml}
                        ${statusSubtext}
                      </td>
                      <td class="py-3 px-3 text-right whitespace-nowrap" onclick="event.stopPropagation()">
                        <div class="flex items-center justify-end gap-1.5 flex-nowrap">
                          ${isPending ? `
                            <button class="btn-pay-pending bg-orange-600 hover:bg-orange-500 text-white rounded-lg px-2.5 py-1 text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0" data-id="${rental.id}">
                              Pagar
                            </button>
                            <button class="btn-cancel-rental p-1 rounded-lg border border-zinc-200 hover:bg-rose-50 hover:text-rose-600 text-zinc-400 transition-colors cursor-pointer shrink-0" data-id="${rental.id}" title="Cancelar">
                              ${renderIcon('X', 'w-3.5 h-3.5')}
                            </button>
                          ` : isCancelled ? `
                            <button class="btn-check-invoice border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 rounded-lg p-1.5 px-2 text-[11px] font-medium shadow-2xs flex items-center gap-1 transition-colors cursor-pointer shrink-0" data-id="${rental.id}" title="Ver Factura Electrónica">
                              ${renderIcon('FileText', 'w-3.5 h-3.5 text-zinc-500')}
                              <span class="hidden xl:inline">Factura</span>
                            </button>
                            <span class="text-[10px] text-zinc-400 font-medium px-2 py-1 bg-zinc-100 rounded-lg shrink-0">Anulado</span>
                          ` : `
                            <!-- Factura Electrónica -->
                            <button class="btn-check-invoice border border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 rounded-lg p-1.5 px-2 text-[11px] font-medium shadow-2xs flex items-center gap-1 transition-colors cursor-pointer shrink-0" data-id="${rental.id}" title="Ver Factura Electrónica con desglose e IVA">
                              ${renderIcon('FileText', 'w-3.5 h-3.5 text-zinc-500')}
                              <span class="hidden xl:inline">Factura</span>
                            </button>

                            <!-- Botón de Recepción o Devolución según estado de faena -->
                            ${rental.status === 'CONFIRMED' && !isReceived ? `
                              <button class="btn-receive-rental border border-blue-500 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-2.5 py-1 text-[11px] font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0" data-id="${rental.id}" title="Validar llegada física y conforme del equipo en obra">
                                ${renderIcon('PackageCheck', 'w-3.5 h-3.5 text-white')}
                                <span>Recibir<span class="hidden xl:inline"> en Obra</span></span>
                              </button>
                            ` : (rental.status === 'IN_PROGRESS' || isReceived) && isOverdue ? `
                              <button class="btn-return-rental bg-rose-600 hover:bg-rose-700 text-white rounded-lg px-2.5 py-1 text-[11px] font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer animate-pulse shrink-0" data-id="${rental.id}" title="Plazo vencido: devolver equipo inmediatamente para liberar garantía">
                                ${renderIcon('AlertTriangle', 'w-3.5 h-3.5 text-white')}
                                <span>Devolver<span class="hidden xl:inline"> Urgente</span></span>
                              </button>
                            ` : (rental.status === 'IN_PROGRESS' || isReceived) && isDueToday ? `
                              <button class="btn-return-rental border border-amber-400 bg-amber-500 hover:bg-amber-600 text-white rounded-lg px-2.5 py-1 text-[11px] font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0" data-id="${rental.id}" title="Vence hoy: coordinar retorno del equipo">
                                ${renderIcon('RotateCcw', 'w-3.5 h-3.5 text-white')}
                                <span>Devolver<span class="hidden xl:inline"> Hoy</span></span>
                              </button>
                            ` : (rental.status === 'IN_PROGRESS' || isReceived) ? `
                              <button class="btn-return-rental border border-emerald-300 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-2.5 py-1 text-[11px] font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0" data-id="${rental.id}" title="Devolver equipo al finalizar faena">
                                ${renderIcon('RotateCcw', 'w-3.5 h-3.5 text-white')}
                                <span>Devolver</span>
                              </button>
                            ` : rental.status === 'COMPLETED' ? `
                              <button class="btn-view-return-receipt border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg px-2.5 py-1 text-[11px] font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0" data-id="${rental.id}" title="Ver Acta de Devolución Técnica en Obra">
                                ${renderIcon('FileCheck', 'w-3.5 h-3.5 text-emerald-600')}
                                <span>Acta Retorno</span>
                              </button>
                            ` : ''}

                            <!-- Garantía / Cambio por Falla Técnica -->
                            ${hasActiveWarranty ? `
                              <span class="border border-amber-200 bg-amber-50 text-amber-800 rounded-lg p-1.5 px-2 text-[11px] font-medium flex items-center gap-1 cursor-default shrink-0" title="Solicitud de cambio en trámite">
                                ${renderIcon('RotateCcw', 'w-3.5 h-3.5 text-amber-600')} <span class="hidden 2xl:inline">En Trámite</span>
                              </span>
                            ` : `
                              <button class="btn-warranty-claim border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg p-1.5 px-2 text-[11px] font-medium shadow-2xs flex items-center gap-1 transition-colors cursor-pointer shrink-0" data-id="${rental.id}" title="Garantía técnica: solicitar cambio de equipo en obra (<24h)">
                                ${renderIcon('RotateCcw', 'w-3.5 h-3.5 text-amber-700')}
                                <span class="hidden 2xl:inline">Cambio</span>
                              </button>
                            `}

                            <!-- Solicitud de Reembolso / Liberación Custodia -->
                            ${hasRefundClaim ? `
                              <span class="border border-emerald-200 bg-emerald-50 text-emerald-800 rounded-lg p-1.5 px-2 text-[11px] font-medium flex items-center gap-1 cursor-default shrink-0" title="Solicitud de reembolso radicada y en trámite contable">
                                ${renderIcon('CheckCircle2', 'w-3.5 h-3.5 text-emerald-600')} <span class="hidden 2xl:inline">Reembolsado</span>
                              </span>
                            ` : `
                              <button class="btn-refund-claim border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg p-1.5 px-2 text-[11px] font-medium shadow-2xs flex items-center gap-1 transition-colors cursor-pointer shrink-0" data-id="${rental.id}" title="Solicitar reembolso total/parcial y liberación de garantía">
                                ${renderIcon('DollarSign', 'w-3.5 h-3.5 text-rose-700')}
                                <span class="hidden 2xl:inline">Reembolso</span>
                              </button>
                            `}
                          `}
                          <button class="btn-rental-popover p-1.5 rounded-lg border border-transparent hover:border-zinc-200 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer shrink-0" data-id="${rental.id}" title="Ficha CRM detallada">
                            ${renderIcon('MoreHorizontal', 'w-3.5 h-3.5')}
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
            <span>Mostrando <strong class="text-zinc-800 font-medium">${filtered.length}</strong> de ${rawRentals.length} órdenes</span>
            <span class="text-[11px] text-zinc-400">Haz clic en cualquier fila para abrir la Ficha CRM ejecutiva</span>
          </div>
        </div>

        <!-- 2. Mobile & Tablet Adaptive Card View (100% responsiva, sin desbordes) -->
        <div class="space-y-3 md:hidden">
          ${filtered.map(rental => {
            const items = rental.items || [];
            const firstItem = items[0];
            const tool = firstItem ? toolMap.get(firstItem.toolId) : null;
            const toolName = tool?.name || firstItem?.toolName || 'Maquinaria de Obra';
            const toolImg = tool?.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=100';
            const rentalCode = rental.rentalCode || `RNT-${String(rental.id).slice(0, 8).toUpperCase()}`;
            const isPending = rental.status === 'PENDING';
            const claims = claimsByRentalMap.get(rental.id) || [];
            const hasRefundClaim = claims.some(c => c.claimType === 'REFUND' && c.status !== 'REJECTED');
            const hasActiveWarranty = claims.some(c => c.claimType !== 'REFUND' && (c.status === 'PENDING' || c.status === 'APPROVED'));
            const isCancelled = rental.status === 'CANCELLED';

            const timeStatus = getRentalTimeStatus(rental);
            const isReceived = isRentalReceived(rental);
            const isOverdue = timeStatus.isOverdue;
            const isDueToday = timeStatus.isDueToday;

            let statusBadgeHtml = '';
            if (rental.status === 'COMPLETED') {
              statusBadgeHtml = renderCrmStatusBadge('COMPLETED');
            } else if (rental.status === 'CANCELLED') {
              statusBadgeHtml = renderCrmStatusBadge('CANCELLED');
            } else if (rental.status === 'PENDING') {
              statusBadgeHtml = renderCrmStatusBadge('PENDING');
            } else if (isOverdue) {
              statusBadgeHtml = renderCrmStatusBadge('OVERDUE', `VENCIDO (${timeStatus.diffDays}d)`);
            } else if (isDueToday) {
              statusBadgeHtml = renderCrmStatusBadge('RETURN_DUE', 'RETORNO HOY');
            } else if (rental.status === 'CONFIRMED' && !isReceived) {
              statusBadgeHtml = renderCrmStatusBadge('CONFIRMED', 'POR RECIBIR');
            } else {
              statusBadgeHtml = renderCrmStatusBadge('IN_PROGRESS', 'EN FAENA');
            }

            const cardBorder = isOverdue ? 'border-l-4 border-l-rose-500 bg-rose-50/20' : isDueToday ? 'border-l-4 border-l-amber-500' : '';

            return `
              <div class="crm-client-rental-card crm-card p-4 space-y-3 cursor-pointer hover:border-orange-300 transition-all bg-white ${cardBorder}" data-rental-id="${rental.id}">
                
                <!-- Alerta móvil si está vencido -->
                ${isOverdue ? `
                  <div class="p-2.5 rounded-xl bg-rose-100/90 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
                    ${renderIcon('AlertTriangle', 'w-4 h-4 text-rose-600 flex-shrink-0 animate-pulse')}
                    <div class="flex-1">
                      <span>Plazo vencido hace ${timeStatus.diffDays} día(s).</span>
                      <span class="block text-[10px] text-rose-600 font-normal">Debes retornar el equipo hoy para evitar cobros de mora.</span>
                    </div>
                  </div>
                ` : isDueToday ? `
                  <div class="p-2 rounded-xl bg-amber-100/90 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-2">
                    ${renderIcon('Clock', 'w-4 h-4 text-amber-600 flex-shrink-0')}
                    <span>Retorno programado para hoy (${formatDate(rental.endDate)})</span>
                  </div>
                ` : ''}

                <!-- Top Row: Checkbox, Code, Date & Status -->
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-2 min-w-0" onclick="event.stopPropagation()">
                    <input type="checkbox" class="crm-row-checkbox w-4 h-4 rounded border-zinc-300 text-orange-600 focus:ring-0 cursor-pointer flex-shrink-0" data-id="${rental.id}" />
                    <span class="font-mono font-bold text-zinc-900 text-xs">${rentalCode}</span>
                    <span class="text-[10px] text-zinc-400 font-mono">${formatDate(rental.createdAt || rental.startDate)}</span>
                  </div>
                  <div class="flex-shrink-0">
                    ${statusBadgeHtml}
                  </div>
                </div>

                <!-- Equipment Detail Row -->
                <div class="flex items-center gap-3 py-1">
                  <img src="${toolImg}" class="w-10 h-10 rounded-xl object-contain bg-zinc-50 border border-zinc-200/80 p-0.5 flex-shrink-0" onerror="this.src='https://images.unsplash.com/photo-1504148455328-c376907d081c?w=100'" />
                  <div class="min-w-0 flex-1">
                    <div class="font-semibold text-zinc-900 text-xs leading-snug line-clamp-1">${toolName}</div>
                    <div class="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span>${formatDate(rental.startDate)} → ${formatDate(rental.endDate)}</span>
                      <span class="text-zinc-300">•</span>
                      <span>${rental.totalDays || 1} d en obra</span>
                    </div>
                  </div>
                </div>

                <!-- Price Row -->
                <div class="flex items-center justify-between pt-2 border-t border-zinc-100 text-xs">
                  <span class="text-zinc-500 text-[11px]">Total a liquidar:</span>
                  <span class="font-bold text-zinc-900 tabular-nums text-sm">${formatCurrency(rental.totalAmount || rental.subtotal || 255000)}</span>
                </div>

                <!-- Primary Action Button (Ancho completo para ergonomía móvil) -->
                <div class="pt-1" onclick="event.stopPropagation()">
                  ${isPending ? `
                    <button class="btn-pay-pending w-full bg-orange-600 hover:bg-orange-500 text-white rounded-xl py-2 text-xs font-semibold shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer" data-id="${rental.id}">
                      Pagar Alquiler
                    </button>
                  ` : rental.status === 'CONFIRMED' && !isReceived ? `
                    <button class="btn-receive-rental w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-2 text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer" data-id="${rental.id}">
                      ${renderIcon('PackageCheck', 'w-4 h-4 text-white')}
                      <span>Confirmar Recepción en Obra</span>
                    </button>
                  ` : (rental.status === 'IN_PROGRESS' || isReceived) && isOverdue ? `
                    <button class="btn-return-rental w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-2 text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer animate-pulse" data-id="${rental.id}">
                      ${renderIcon('AlertTriangle', 'w-4 h-4 text-white')}
                      <span>Devolver Urgente (Plazo Vencido)</span>
                    </button>
                  ` : (rental.status === 'IN_PROGRESS' || isReceived) ? `
                    <button class="btn-return-rental w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2 text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer" data-id="${rental.id}">
                      ${renderIcon('RotateCcw', 'w-4 h-4 text-white')}
                      <span>Devolver Equipo</span>
                    </button>
                  ` : rental.status === 'COMPLETED' ? `
                    <button class="btn-view-return-receipt w-full border border-emerald-300 bg-emerald-50 text-emerald-800 rounded-xl py-2 text-xs font-semibold shadow-2xs flex items-center justify-center gap-2 transition-colors cursor-pointer" data-id="${rental.id}">
                      ${renderIcon('FileCheck', 'w-4 h-4 text-emerald-600')}
                      <span>Ver Acta de Retorno</span>
                    </button>
                  ` : ''}
                </div>

                <!-- Secondary Actions Row -->
                <div class="flex items-center gap-1.5 pt-1" onclick="event.stopPropagation()">
                  <button class="btn-check-invoice flex-1 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-xl py-1.5 text-xs font-medium shadow-2xs flex items-center justify-center gap-1 transition-colors cursor-pointer" data-id="${rental.id}">
                    ${renderIcon('FileText', 'w-3.5 h-3.5 text-zinc-400')} Factura
                  </button>
                  ${hasActiveWarranty ? `
                    <span class="border border-amber-200 bg-amber-50 text-amber-800 rounded-xl px-2.5 py-1.5 text-xs font-medium flex items-center justify-center gap-1 flex-1 cursor-default">
                      ${renderIcon('RotateCcw', 'w-3.5 h-3.5 text-amber-600')} En Trámite
                    </span>
                  ` : `
                    <button class="btn-warranty-claim border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl px-2.5 py-1.5 text-xs font-medium shadow-2xs flex items-center justify-center gap-1 flex-1 transition-colors cursor-pointer" data-id="${rental.id}">
                      ${renderIcon('RotateCcw', 'w-3.5 h-3.5 text-amber-600')} Garantía
                    </button>
                  `}
                  ${hasRefundClaim ? `
                    <span class="border border-emerald-200 bg-emerald-50 text-emerald-800 rounded-xl px-2.5 py-1.5 text-xs font-medium flex items-center justify-center gap-1 flex-1 cursor-default">
                      ${renderIcon('CheckCircle2', 'w-3.5 h-3.5 text-emerald-600')} Reembolsado
                    </span>
                  ` : `
                    <button class="btn-refund-claim border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-xl px-2.5 py-1.5 text-xs font-medium shadow-2xs flex items-center justify-center gap-1 flex-1 transition-colors cursor-pointer" data-id="${rental.id}">
                      ${renderIcon('DollarSign', 'w-3.5 h-3.5 text-rose-600')} Reembolso
                    </button>
                  `}
                  <button class="btn-rental-popover p-1.5 rounded-xl border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer" data-id="${rental.id}" title="Ficha CRM">
                    ${renderIcon('MoreHorizontal', 'w-4 h-4')}
                  </button>
                </div>
              </div>
            `;
          }).join('')}

          <div class="p-3 text-center text-xs text-zinc-400">
            Mostrando <strong>${filtered.length}</strong> de ${rawRentals.length} órdenes
          </div>
        </div>
      `}
    `;

    // Search input handler (debounced)
    let clientSearchDebounce = null;
    stage.querySelector('#client-search-input')?.addEventListener('input', (e) => {
      const val = e.target.value;
      const cursorPos = e.target.selectionStart;
      clearTimeout(clientSearchDebounce);
      clientSearchDebounce = setTimeout(() => {
        searchQuery = val;
        renderTable();
        const reInp = stage.querySelector('#client-search-input');
        if (reInp) {
          reInp.focus();
          try { reInp.setSelectionRange(cursorPos, cursorPos); } catch (_) {}
        }
      }, 150);
    });

    // Select all handler
    stage.querySelector('#select-all-client')?.addEventListener('change', (e) => {
      stage.querySelectorAll('.crm-row-checkbox').forEach(cb => {
        cb.checked = e.target.checked;
        cb.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });

    // Pay pending button
    stage.querySelectorAll('.btn-pay-pending').forEach(btn => {
      btn.addEventListener('click', () => {
        const rental = rawRentals.find(r => r.id === btn.dataset.id);
        if (rental) triggerPayModal(rental);
      });
    });

    // Cancel rental button
    stage.querySelectorAll('.btn-cancel-rental').forEach(btn => {
      btn.addEventListener('click', () => {
        const rental = rawRentals.find(r => r.id === btn.dataset.id);
        if (rental) triggerCancelRental(rental.id);
      });
    });

    // View invoice button
    stage.querySelectorAll('.btn-check-invoice').forEach(btn => {
      btn.addEventListener('click', () => {
        const rental = rawRentals.find(r => r.id === btn.dataset.id);
        if (rental) triggerViewInvoice(rental);
      });
    });

    // Warranty exchange claim button
    stage.querySelectorAll('.btn-warranty-claim').forEach(btn => {
      btn.addEventListener('click', () => {
        const rental = rawRentals.find(r => r.id === btn.dataset.id);
        if (rental) triggerWarrantyClaim(rental);
      });
    });

    // Refund request claim button
    stage.querySelectorAll('.btn-refund-claim').forEach(btn => {
      btn.addEventListener('click', () => {
        const rental = rawRentals.find(r => r.id === btn.dataset.id);
        if (rental) triggerRefundClaim(rental);
      });
    });

    // Filter overdue button from global banner
    stage.querySelector('#btn-filter-overdue')?.addEventListener('click', () => {
      activeTab = 'overdue';
      container.querySelectorAll('.crm-tab-btn').forEach(b => {
        b.className = `crm-tab-btn flex items-center gap-2 text-xs transition-colors cursor-pointer ${
          b.dataset.tab === activeTab ? 'crm-tab-active' : 'crm-tab-inactive'
        }`;
      });
      renderTable();
    });

    // Reception button (Validación de llegada y recepción del equipo en obra)
    stage.querySelectorAll('.btn-receive-rental').forEach(btn => {
      btn.addEventListener('click', () => {
        const rental = rawRentals.find(r => r.id === btn.dataset.id);
        if (rental) {
          const firstItem = rental.items?.[0];
          const tool = toolMap.get(firstItem?.toolId);
          openClientReceptionModal(rental, tool, () => loadData());
        }
      });
    });

    // Return rental button (Devolución en fecha asignada)
    stage.querySelectorAll('.btn-return-rental').forEach(btn => {
      btn.addEventListener('click', () => {
        const rental = rawRentals.find(r => r.id === btn.dataset.id);
        if (rental) triggerReturnRental(rental);
      });
    });

    // View return receipt button (Acta de Devolución ya completada)
    stage.querySelectorAll('.btn-view-return-receipt').forEach(btn => {
      btn.addEventListener('click', () => {
        const rental = rawRentals.find(r => r.id === btn.dataset.id);
        if (rental) {
          const firstItem = rental.items?.[0];
          const tool = toolMap.get(firstItem?.toolId);
          openReturnConfirmationReceipt({
            rental,
            tool,
            returnDate: rental.updatedAt || rental.endDate || new Date().toISOString(),
            notes: 'Devolución técnica completada conforme a contrato en fecha asignada.'
          });
        }
      });
    });

    // ROW & CARD CLICK TRIGGER: Floating Expandable CRM Card (2 States) -> VISTA RÁPIDA
    stage.querySelectorAll('.crm-client-rental-row, .crm-client-rental-card').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('input[type="checkbox"]') || 
            e.target.closest('.btn-rental-popover') || 
            e.target.closest('button') || 
            e.target.closest('a')) return;
        const rentalId = item.dataset.rentalId;
        const rental = rawRentals.find(r => r.id === rentalId);
        if (!rental) return;

        openClientRentalOverview(rental);
      });
    });

    // 3-DOTS BUTTON: Opciones Adicionales (Acciones únicas sin duplicar Factura, Cambio ni Reembolso)
    stage.querySelectorAll('.btn-rental-popover').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const rental = rawRentals.find(r => r.id === btn.dataset.id);
        if (!rental) return;

        const isCancellable = rental.status === 'PENDING';
        const firstItem = rental.items?.[0];
        const toolId = firstItem?.toolId;

        showRowActionPopover({
          triggerElement: btn,
          items: [
            {
              icon: 'Copy',
              label: 'Copiar código de contrato',
              description: `Copiar ${rental.rentalCode || `#TR-${rental.id.slice(0, 8)}`} al portapapeles`,
              onClick: () => {
                const code = rental.rentalCode || rental.id;
                navigator.clipboard.writeText(code).catch(() => {});
                showToast(`Código ${code} copiado al portapapeles`, 'success');
              }
            },
            ...(toolId ? [
              {
                icon: 'Layers',
                label: 'Ver Ficha del Equipo',
                description: 'Consultar manual, potencia y especificaciones',
                onClick: () => {
                  window.location.hash = `#/product/${toolId}`;
                }
              }
            ] : []),
            {
              icon: 'Headphones',
              label: 'Contactar Soporte en Obra',
              description: 'Asistencia técnica inmediata para maquinaria en faena',
              onClick: () => {
                showToast('Línea técnica en obra: (+57) 300 912 8844 · soporte@toolrent.co', 'info');
              }
            },
            {
              icon: 'Eye',
              label: 'Ver Ficha CRM Completa',
              description: 'Abrir panel de auditoría, vigencia y trazabilidad',
              onClick: () => openClientRentalOverview(rental)
            },
            ...(isCancellable ? [
              { divider: true },
              {
                icon: 'XCircle',
                label: 'Cancelar Reserva',
                description: 'Anular orden y liberar maquinaria en inventario',
                danger: true,
                onClick: () => triggerCancelRental(rental.id)
              }
            ] : [])
          ]
        });
      });
    });

    // ===================================================================
    // FLOATING BULK ACTION BAR SETUP
    // ===================================================================
    if (bulkBarManager) bulkBarManager.destroy();
    bulkBarManager = setupCrmBulkBar({
      container: document.body,
      selector: '.crm-row-checkbox',
      onAction: (action, selectedIds) => {
        if (action === 'export') {
          showToast(`Exportando ${selectedIds.length} comprobantes a formato contable...`, 'info');
        } else {
          showToast(`Acción "${action}" aplicada a ${selectedIds.length} filas`, 'info');
        }
      }
    });
  }

  function openClientRentalOverview(rental) {
    const items = rental.items || [];
    const firstItem = items[0];
    const tool = firstItem ? toolMap.get(firstItem.toolId) : null;
    const isPending = rental.status === 'PENDING';
    const toolId = firstItem?.toolId || tool?.id;

    openCrmOverviewCard({
      type: 'rental',
      title: `Contrato ${rental.rentalCode || `#TR-${rental.id?.slice(0, 8)}`}`,
      subtitle: `${tool?.name || 'Equipo en alquiler'} • ${rental.totalDays || 1} días en obra`,
      avatar: tool?.images?.[0]?.imageUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(rental.rentalCode || 'TR')}&backgroundColor=f4f4f5&textColor=18181b`,
      status: rental.status,
      primaryActionText: isPending ? 'Pagar Reserva' : (rental.status === 'IN_PROGRESS' || rental.status === 'CONFIRMED') ? 'Devolver Maquinaria' : 'Ver Factura Oficial',
      onPrimaryAction: () => isPending ? triggerPayModal(rental) : (rental.status === 'IN_PROGRESS' || rental.status === 'CONFIRMED') ? triggerReturnRental(rental) : triggerViewInvoice(rental),
      onSecondaryAction: () => {
        showToast(`Vigencia de reserva: ${formatDate(rental.startDate)} al ${formatDate(rental.endDate)} (${rental.totalDays || 1} días facturables).`, 'info');
      },
      properties: [
        { icon: 'FileText', label: 'Código Contrato', value: rental.rentalCode || `#TR-${rental.id?.slice(0, 8)}` },
        { icon: 'Calendar', label: 'Vigencia', value: `${formatDate(rental.startDate)} → ${formatDate(rental.endDate)}` },
        { icon: 'Clock', label: 'Días Contratados', value: `${rental.totalDays || 1} días` },
        { icon: 'DollarSign', label: 'Total Liquidado', value: formatCurrency(rental.totalAmount || rental.subtotal || 250000) },
        { icon: 'Layers', label: 'Herramienta', value: tool?.name || 'Maquinaria de Construcción' },
        { icon: 'Tag', label: 'Tarifa Aplicada', value: `${formatCurrency(firstItem?.dailyPrice || 85000)}/día` },
        { icon: 'Shield', label: 'Depósito Garantía', value: `${formatCurrency(rental.deposit || 0)} COP` }
      ],
      menuActions: [
        {
          icon: 'Copy',
          label: 'Copiar código de contrato',
          onClick: () => {
            const code = rental.rentalCode || rental.id;
            navigator.clipboard.writeText(code).catch(() => {});
            showToast(`Código ${code} copiado al portapapeles`, 'success');
          }
        },
        ...(toolId ? [
          {
            icon: 'Layers',
            label: 'Ver Ficha Técnica del Equipo',
            onClick: () => {
              window.location.hash = `#/product/${toolId}`;
            }
          }
        ] : []),
        {
          icon: 'Headphones',
          label: 'Contactar Asistencia Técnica',
          onClick: () => {
            showToast('Línea técnica en obra: (+57) 300 912 8844 · soporte@toolrent.co', 'info');
          }
        },
        {
          icon: 'Download',
          label: 'Descargar Comprobante Digital',
          onClick: () => {
            window.print();
          }
        },
        ...(rental.status === 'COMPLETED' ? [
          {
            icon: 'FileCheck',
            label: 'Ver Acta Digital de Retorno',
            description: 'Certificado oficial de devolución y liberación de garantía',
            onClick: () => {
              openReturnConfirmationReceipt({
                rental,
                tool,
                returnDate: rental.updatedAt || rental.endDate || new Date().toISOString(),
                notes: 'Devolución técnica completada conforme a contrato en fecha asignada.'
              });
            }
          }
        ] : []),
        ...((rental.status === 'IN_PROGRESS' || rental.status === 'CONFIRMED') ? [
          { divider: true },
          {
            icon: 'RotateCcw',
            label: 'Devolver Maquinaria (Retorno en Fecha)',
            description: `Retornar equipo según contrato (${formatDate(rental.endDate)})`,
            onClick: () => triggerReturnRental(rental)
          }
        ] : []),
        ...(isPending ? [
          { divider: true },
          {
            icon: 'XCircle',
            label: 'Cancelar Reserva',
            danger: true,
            onClick: () => triggerCancelRental(rental.id)
          }
        ] : [])
      ]
    });
  }

  async function triggerReturnRental(targetRental) {
    const firstItem = targetRental.items?.[0];
    let selectedTool = toolMap.get(firstItem?.toolId);
    if (!selectedTool && firstItem?.toolId) {
      try { selectedTool = await api.get(`/tools/${firstItem.toolId}`); } catch (_) {}
    }
    openClientReturnModal(targetRental, selectedTool, () => loadData());
  }

  async function triggerWarrantyClaim(targetRental) {
    const firstItem = targetRental.items?.[0];
    let selectedTool = toolMap.get(firstItem?.toolId);
    if (!selectedTool && firstItem?.toolId) {
      try { selectedTool = await api.get(`/tools/${firstItem.toolId}`); } catch (_) {}
    }
    openWarrantyExchangeModal(targetRental, selectedTool, () => loadData());
  }

  async function triggerRefundClaim(targetRental) {
    const firstItem = targetRental.items?.[0];
    let selectedTool = toolMap.get(firstItem?.toolId);
    if (!selectedTool && firstItem?.toolId) {
      try { selectedTool = await api.get(`/tools/${firstItem.toolId}`); } catch (_) {}
    }
    openRefundRequestModal(targetRental, selectedTool, () => loadData());
  }

  async function triggerPayModal(targetRental) {
    const firstItem = targetRental.items?.[0];
    let selectedTool = toolMap.get(firstItem?.toolId);
    if (!selectedTool) {
      try {
        selectedTool = await api.get(`/tools/${firstItem?.toolId}`);
      } catch (_) {
        selectedTool = { id: firstItem?.toolId, name: 'Herramienta Industrial', dailyPrice: firstItem?.dailyPrice || 85000 };
      }
    }

    const subtotal = Number(targetRental.subtotal || (targetRental.totalDays * (selectedTool.dailyPrice || 85000)));
    const total = Math.round(subtotal * 1.19);

    openCheckoutModal(selectedTool, {
      startDate: targetRental.startDate,
      endDate: targetRental.endDate,
      days: targetRental.totalDays,
      subtotal: subtotal,
      tax: Math.round(subtotal * 0.19),
      total: total,
      existingRental: targetRental
    });
  }

  function triggerViewInvoice(targetRental) {
    const firstItem = targetRental?.items?.[0];
    const targetTool = toolMap.get(firstItem?.toolId);
    openRentalInvoiceModal(targetRental.id, targetRental, targetTool);
  }

  async function triggerCancelRental(rentalId) {
    if (!confirm('¿Estás seguro de cancelar esta solicitud de alquiler?')) return;
    try {
      await api.patch(`/rentals/${rentalId}/cancel`);
      showToast('Alquiler cancelado correctamente', 'success');
      loadData();
    } catch (e) {
      showToast(e.message || 'Error al cancelar la reserva', 'error');
    }
  }

  // Initial load
  await loadData();
}

/**
 * Modal: Solicitud de Cambio de Equipo por Falla Técnica (Garantía de Obra <24h)
 */
export function openWarrantyExchangeModal(rental, tool, onComplete) {
  const content = document.createElement('div');
  content.className = 'p-6 space-y-5 bg-white text-slate-800';

  const toolName = tool?.name || rental.items?.[0]?.toolName || 'Maquinaria en alquiler';
  const rentalCode = rental.rentalCode || `#TR-${rental.id?.slice(0, 8)}`;
  const user = auth.getUser();
  const defaultAddress = rental.deliveryAddress || [user?.profile?.address, user?.profile?.city].filter(Boolean).join(', ') || 'Calle 134 # 19-45, Bogotá D.C.';
  const defaultPhone = rental.contactPhone || (user?.profile?.phone ? user.profile.phone.replace(/\D/g, '').slice(0, 10) : '3001234567');

  content.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-start justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            ToolRent Protect · Garantía en Faena
          </span>
          <h3 class="text-base font-bold text-slate-900 font-display mt-1">Solicitar Cambio de Equipo por Falla Técnica</h3>
          <p class="text-xs text-slate-500 mt-0.5">Sustitución inmediata en obra en menos de 24 horas sin costo adicional de transporte.</p>
        </div>
        <div class="text-right">
          <span class="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">${rentalCode}</span>
        </div>
      </div>

      <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
        <div>
          <span class="text-slate-400 block text-[10px] uppercase font-bold">Equipo contratado:</span>
          <strong class="text-slate-800">${toolName}</strong>
        </div>
        <div class="text-right">
          <span class="text-slate-400 block text-[10px] uppercase font-bold">Vigencia:</span>
          <span class="font-medium text-slate-700">${formatDate(rental.startDate)} → ${formatDate(rental.endDate)}</span>
        </div>
      </div>

      <form id="warranty-form" class="space-y-3.5">
        <div>
          <label class="block text-[11px] font-bold text-slate-700 mb-1">Tipo de Falla u Avería Operativa *</label>
          <select id="warranty-fault-type" required class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors">
            <option value="MOTOR">Falla de motor, pérdida súbita de potencia o recalentamiento</option>
            <option value="ELECTRICO">Falla en circuito eléctrico / Baterías no retienen carga</option>
            <option value="HIDRAULICO">Fuga en mangueras, pistones o circuito hidráulico</option>
            <option value="CONSUMIBLE">Desgaste anormal o fractura de consumibles (corona, disco, cuchilla)</option>
            <option value="DIFERENTE">El equipo entregado no corresponde con las especificaciones del contrato</option>
            <option value="ESTRUCTURAL">Falla estructural, de fijación o bloqueo de seguridad</option>
          </select>
        </div>

        <div>
          <div class="flex justify-between items-center mb-1">
            <label class="block text-[11px] font-bold text-slate-700">Descripción detallada de la falla en obra *</label>
            <span id="warranty-desc-count" class="text-[10px] text-slate-400 font-mono">0 / 250</span>
          </div>
          <textarea id="warranty-description" required minlength="15" maxlength="250" rows="3" placeholder="Describe brevemente qué ocurrió con el equipo y en qué etapa de la faena se encuentra..." class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors placeholder:text-slate-400 resize-none"></textarea>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-1">Prioridad de reemplazo *</label>
            <select id="warranty-urgency" required class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors">
              <option value="URGENT">Urgencia Crítica (&lt; 4 horas - Cuadrilla detenida)</option>
              <option value="NORMAL" selected>Estándar (&lt; 24 horas - Inicio próximo turno)</option>
            </select>
          </div>
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-[11px] font-bold text-slate-700">Teléfono encargado faena *</label>
              <span class="text-[9px] text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-medium">
                Contacto directo
              </span>
            </div>
            <input type="tel" id="warranty-phone" required maxlength="10" inputmode="numeric" value="${defaultPhone.replace(/\D/g, '').slice(0, 10)}" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#ea580c] focus:bg-white font-mono" />
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="block text-[11px] font-bold text-slate-700">Dirección de entrega del nuevo equipo *</label>
            <span class="text-[9px] text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-medium">
              Ubicación de obra
            </span>
          </div>
          <input type="text" id="warranty-address" required maxlength="80" value="${defaultAddress.slice(0, 80)}" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#ea580c] focus:bg-white" />
          <p class="text-[10px] text-slate-400 mt-1">Puedes confirmar o actualizar la dirección exacta de despacho de la unidad de sustitución.</p>
        </div>

        <div class="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
          <strong>Póliza de Sustitución Directa:</strong> El proveedor homologado despachará una unidad operativa de idénticas o superiores prestaciones. La unidad averiada será retirada al momento de la entrega del reemplazo.
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
          <button type="button" id="btn-cancel-warranty" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
            Cancelar
          </button>
          <button type="submit" id="btn-submit-warranty" class="px-5 py-2 text-xs font-semibold text-white bg-[#ea580c] hover:bg-[#c2410c] rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5">
            ${renderIcon('RotateCcw', 'w-3.5 h-3.5')}
            Radicar Solicitud de Cambio
          </button>
        </div>
      </form>
    </div>
  `;

  // Sanitizers and limits
  const descArea = content.querySelector('#warranty-description');
  const countSpan = content.querySelector('#warranty-desc-count');
  descArea?.addEventListener('input', (e) => {
    if (e.target.value.length > 250) e.target.value = e.target.value.slice(0, 250);
    if (countSpan) countSpan.textContent = `${e.target.value.length} / 250`;
  });

  const phoneInp = content.querySelector('#warranty-phone');
  const addrInp = content.querySelector('#warranty-address');

  content.querySelector('#btn-cancel-warranty')?.addEventListener('click', () => {
    modal.close();
  });

  content.querySelector('#warranty-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ticketId = 'GAR-2026-' + Math.floor(1000 + Math.random() * 9000);
    const fault = content.querySelector('#warranty-fault-type')?.value;
    const desc = descArea?.value?.trim();
    const urgency = content.querySelector('#warranty-urgency')?.value;
    const phone = phoneInp?.value?.trim() || defaultPhone;
    const address = addrInp?.value?.trim() || defaultAddress;

    if (!desc || desc.length < 15) {
      showToast('Por favor describe la falla con al menos 15 caracteres', 'warning');
      return;
    }

    const submitBtn = content.querySelector('#btn-submit-warranty');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `${renderIcon('Loader2', 'w-3.5 h-3.5 animate-spin')} Radicando en Servidor...`;
    }

    try {
      const resp = await api.post(`/rentals/${rental.id}/claims`, {
        rentalId: rental.id,
        toolId: tool?.id || rental.items?.[0]?.toolId,
        claimType: 'EXCHANGE',
        faultType: fault,
        urgency: urgency,
        description: desc,
        contactPhone: phone,
        deliveryAddress: address
      });

      const effectiveTicket = resp?.ticketNumber || ticketId;

      notificationsStore.addNotification({
        type: 'WARRANTY_REQUEST',
        title: `Garantía radicada: ${effectiveTicket}`,
        message: `Solicitud de sustitución inmediata para ${toolName} (${urgency === 'URGENT' ? 'Prioridad <4h' : 'Estándar <24h'}). Obra: ${address}`,
        date: new Date().toISOString()
      });

      modal.close();
      showToast(`Solicitud ${effectiveTicket} radicada en servidor exitosamente. Proveedor notificado para reemplazo en obra.`, 'success');
      if (onComplete) onComplete();
    } catch (err) {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `${renderIcon('RotateCcw', 'w-3.5 h-3.5')} Radicar Solicitud de Cambio`;
      }
      showToast(err.message || 'Error del servidor al procesar la solicitud de garantía.', 'error');
    }
  });

  modal.open({
    title: '',
    content: content,
    maxWidth: 'max-w-lg',
    hideHeader: true
  });
}

/**
 * Modal: Solicitud de Reembolso y Devolución de Custodia de Garantía
 */
export function openRefundRequestModal(rental, tool, onComplete) {
  if (rental.status === 'CANCELLED') {
    showToast('Este contrato se encuentra anulado/cancelado.', 'warning');
    return;
  }

  const existingClaims = claimsByRentalMap?.get(rental.id) || [];
  if (existingClaims.some(c => c.claimType === 'REFUND' && c.status !== 'REJECTED')) {
    showToast('Ya tienes radicada una solicitud de reembolso para este contrato.', 'info');
    return;
  }

  const content = document.createElement('div');
  content.className = 'p-6 space-y-5 bg-white text-slate-800';

  const rentalCode = rental.rentalCode || `#TR-${rental.id?.slice(0, 8)}`;
  const totalPaid = rental.totalAmount || rental.subtotal || 250000;
  const deposit = rental.deposit || Math.round(totalPaid * 0.2);
  const user = auth.getUser();
  const clientName = user?.profile?.fullName || user?.username || 'Cliente Registrado';
  const clientDoc = user?.profile?.documentNumber || '';

  content.innerHTML = `
    <div class="space-y-4">
      <div class="flex items-start justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            ToolRent Escrow Protection
          </span>
          <h3 class="text-base font-bold text-slate-900 font-display mt-1">Solicitud de Reembolso y Devolución de Custodia</h3>
          <p class="text-xs text-slate-500 mt-0.5">Liquidación directa a cuenta bancaria con trazabilidad y comprobante contable.</p>
        </div>
        <div class="text-right">
          <span class="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">${rentalCode}</span>
        </div>
      </div>

      <!-- Financial Breakdown -->
      <div class="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
        <div>
          <span class="text-slate-400 block text-[10px] uppercase font-bold">Monto Facturado:</span>
          <strong class="text-slate-800 font-mono text-sm">${formatCurrency(totalPaid)}</strong>
        </div>
        <div class="text-right">
          <span class="text-slate-400 block text-[10px] uppercase font-bold">Depósito en Custodia:</span>
          <span class="font-mono text-sm font-bold text-emerald-700">${formatCurrency(deposit)}</span>
        </div>
      </div>

      <form id="refund-form" class="space-y-3.5">
        <div>
          <label class="block text-[11px] font-bold text-slate-700 mb-1">Causa del Reembolso *</label>
          <select id="refund-reason" required class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors">
            <option value="RETARD">Incumplimiento grave en entrega de maquinaria (> 4h de retraso)</option>
            <option value="INOPERABLE">Equipo inoperativo o fallas técnicas recurrentes no subsanadas</option>
            <option value="CANCEL">Suspensión de faena / Retorno anticipado (reembolso días no causados)</option>
            <option value="DISSATISFACTION">Disconformidad justificada con el servicio prestado</option>
            <option value="COMPLETED_NORMAL">Devolución normal satisfactoria (Descongelar y devolver depósito)</option>
          </select>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-1">Modalidad de Liquidación *</label>
            <select id="refund-mode" required class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors">
              <option value="FULL">Reembolso Total 100% + Custodia de Garantía</option>
              <option value="PARTIAL">Reembolso Proporcional (Días restantes) + Custodia</option>
              <option value="DEPOSIT_ONLY">Solo Devolución de Depósito en Custodia</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-1">Entidad Bancaria *</label>
            <select id="refund-bank" required class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors">
              <option value="Bancolombia">Bancolombia S.A.</option>
              <option value="Davivienda">Banco Davivienda</option>
              <option value="Banco de Bogotá">Banco de Bogotá</option>
              <option value="BBVA Colombia">BBVA Colombia</option>
              <option value="Nequi">Nequi</option>
              <option value="Daviplata">Daviplata</option>
              <option value="Banco de Occidente">Banco de Occidente</option>
              <option value="Scotiabank">Scotiabank Colpatria</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-1">Tipo de Cuenta *</label>
            <select id="refund-account-type" required class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors">
              <option value="AHORROS">Cuenta de Ahorros</option>
              <option value="CORRIENTE">Cuenta Corriente</option>
            </select>
          </div>
          <div>
            <label class="block text-[11px] font-bold text-slate-700 mb-1">Número de Cuenta *</label>
            <input type="text" id="refund-account-num" required maxlength="16" inputmode="numeric" placeholder="8 a 16 dígitos" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors font-mono" />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-[11px] font-bold text-slate-700">Nombre o Razón Social del Titular *</label>
              <span class="text-[9px] text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-medium">
                Titular cuenta
              </span>
            </div>
            <input type="text" id="refund-holder-name" required maxlength="60" value="${clientName}" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#ea580c] focus:bg-white font-medium" />
          </div>
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="block text-[11px] font-bold text-slate-700">Documento del Titular (NIT / CC) *</label>
              <span class="text-[9px] text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-medium">
                Identificación
              </span>
            </div>
            <input type="text" id="refund-holder-doc" required maxlength="10" inputmode="numeric" value="${clientDoc.replace(/\D/g, '').slice(0, 10)}" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#ea580c] focus:bg-white font-mono font-medium" />
          </div>
        </div>

        <div>
          <label class="block text-[11px] font-bold text-slate-700 mb-1">Observaciones o justificación (Opcional)</label>
          <textarea id="refund-notes" maxlength="200" rows="2" placeholder="Información adicional para agilizar la conciliación contable..." class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors placeholder:text-slate-400 resize-none"></textarea>
        </div>

        <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 leading-relaxed">
          <strong>Garantía de Fondos ToolRent:</strong> Los fondos retenidos en custodia son desembolsados a través del convenio de dispersión bancaria nacional en un plazo máximo de 24 a 48 horas hábiles.
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
          <button type="button" id="btn-cancel-refund" class="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
            Cancelar
          </button>
          <button type="submit" id="btn-submit-refund" class="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5">
            ${renderIcon('DollarSign', 'w-3.5 h-3.5')}
            Solicitar Desembolso
          </button>
        </div>
      </form>
    </div>
  `;

  // Sanitizers and limits
  const accNumInp = content.querySelector('#refund-account-num');
  accNumInp?.addEventListener('input', (e) => {
    const clean = e.target.value.replace(/\D/g, '').slice(0, 16);
    if (e.target.value !== clean) e.target.value = clean;
  });

  const nameInp = content.querySelector('#refund-holder-name');
  const docInp = content.querySelector('#refund-holder-doc');
  const notesArea = content.querySelector('#refund-notes');
  notesArea?.addEventListener('input', (e) => {
    if (e.target.value.length > 200) e.target.value = e.target.value.slice(0, 200);
  });

  content.querySelector('#btn-cancel-refund')?.addEventListener('click', () => {
    modal.close();
  });

  content.querySelector('#refund-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ticketId = 'RMB-2026-' + Math.floor(1000 + Math.random() * 9000);
    const accNum = accNumInp?.value?.trim();
    const doc = docInp?.value?.trim() || clientDoc;
    const name = nameInp?.value?.trim() || clientName;
    const bank = content.querySelector('#refund-bank')?.value;
    const mode = content.querySelector('#refund-mode')?.value;
    const reason = content.querySelector('#refund-reason')?.value || 'CANCEL';
    const notes = notesArea?.value?.trim() || '';
    const accType = content.querySelector('#refund-account-type')?.value || 'AHORROS';

    if (!accNum || accNum.length < 8) {
      showToast('Por favor ingresa un número de cuenta válido (mínimo 8 dígitos)', 'warning');
      return;
    }

    const submitBtn = content.querySelector('#btn-submit-refund');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `${renderIcon('Loader2', 'w-3.5 h-3.5 animate-spin')} Procesando en Servidor...`;
    }

    try {
      const resp = await api.post(`/rentals/${rental.id}/claims`, {
        rentalId: rental.id,
        toolId: tool?.id || rental.items?.[0]?.toolId,
        claimType: 'REFUND',
        faultType: `REEMBOLSO_${reason}`,
        urgency: mode,
        description: `Banco: ${bank} | Cta ${accType}: ${accNum} | Titular: ${name} (${doc}) | Justificación: ${notes || reason}`,
        contactPhone: rental.contactPhone || user?.profile?.phone,
        deliveryAddress: rental.deliveryAddress || user?.profile?.address
      });

      const effectiveTicket = resp?.ticketNumber || ticketId;

      notificationsStore.addNotification({
        type: 'REFUND_REQUEST',
        title: `Reembolso en trámite: ${effectiveTicket}`,
        message: `Solicitud de liquidación ${effectiveTicket} para contrato ${rentalCode} radicada en servidor. Cuenta ${bank} a nombre de ${name}.`,
        date: new Date().toISOString()
      });

      const existing = claimsByRentalMap.get(rental.id) || [];
      existing.push({ id: resp?.id, claimType: 'REFUND', status: 'PENDING' });
      claimsByRentalMap.set(rental.id, existing);

      modal.close();
      showToast(`Solicitud de desembolso ${effectiveTicket} radicada exitosamente en tesorería.`, 'success');
      if (onComplete) onComplete();
    } catch (err) {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `${renderIcon('DollarSign', 'w-3.5 h-3.5')} Solicitar Desembolso`;
      }
      showToast(err.message || 'Error del servidor al radicar la solicitud de reembolso.', 'error');
    }
  });

  modal.open({
    title: '',
    content: content,
    maxWidth: 'max-w-lg',
    hideHeader: true
  });
}

export function openClientReturnModal(rental, tool, onComplete) {
  if (!rental) return;

  const toolName = tool?.name || rental.items?.[0]?.toolName || 'Maquinaria en alquiler';
  const rentalCode = rental.rentalCode || `#TR-${rental.id?.slice(0, 8)}`;
  const toolImg = tool?.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200';
  const user = auth.getUser();
  const address = rental.deliveryAddress || user?.profile?.address || 'Frente de Obra / Bogotá D.C.';
  const scheduledEndDate = rental.endDate ? rental.endDate.split('T')[0] : '';
  const todayStr = new Date().toISOString().split('T')[0];

  const isOverdue = scheduledEndDate && todayStr > scheduledEndDate;

  const content = document.createElement('div');
  content.className = 'space-y-4 text-xs animate-scale-in text-slate-700';

  content.innerHTML = `
    <!-- Header -->
    <div class="flex items-start justify-between gap-3 pb-3 border-b border-slate-200">
      <div>
        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Retorno de Maquinaria en Obra
        </span>
        <h3 class="text-base font-bold text-slate-900 font-display mt-1">Devolución de Equipo y Entrega Técnica</h3>
        <p class="text-xs text-slate-500 mt-0.5">Formaliza el fin de faena para devolución a bodega y liberación del depósito en garantía.</p>
      </div>
      <div class="text-right">
        <span class="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">${rentalCode}</span>
      </div>
    </div>

    <!-- Tool Preview & Scheduled Date -->
    <div class="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl flex items-center justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <img src="${toolImg}" class="w-12 h-12 rounded-xl object-contain bg-white border border-slate-200 p-1 flex-shrink-0" />
        <div class="min-w-0">
          <h4 class="font-bold text-slate-900 text-xs truncate">${toolName}</h4>
          <span class="text-[11px] text-slate-500">${tool?.brand || 'Industrial'} • Serie: ${tool?.serialNumber || 'N/A'}</span>
        </div>
      </div>
      <div class="text-right flex-shrink-0">
        <span class="text-[10px] text-slate-400 block uppercase font-semibold">Fecha Límite Asignada</span>
        <span class="font-bold text-xs ${isOverdue ? 'text-rose-600' : 'text-slate-900'}">${formatDate(rental.endDate)}</span>
        <span id="client-return-status-badge" class="inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${isOverdue ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}">
          ${isOverdue ? 'Fuera de plazo' : 'Dentro de la fecha asignada'}
        </span>
      </div>
    </div>

    <!-- Return Details Form -->
    <form id="client-return-form" class="space-y-3.5">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-[11px] font-bold text-slate-700 mb-1">Fecha de Devolución Física *</label>
          <input type="date" id="client-return-date" required value="${todayStr}" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono focus:outline-none focus:border-[#ea580c] focus:bg-white" />
        </div>
        <div>
          <label class="block text-[11px] font-bold text-slate-700 mb-1">Punto de Recogida / Bodega *</label>
          <input type="text" id="client-return-location" required value="${address}" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#ea580c] focus:bg-white truncate" />
        </div>
      </div>

      <!-- Checklist de Entrega Técnica -->
      <div>
        <label class="block text-[11px] font-bold text-slate-700 mb-1.5">Checklist de Entrega Técnica en Obra *</label>
        <div class="space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <label class="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" id="chk-clean" required checked class="mt-0.5 text-emerald-600 rounded focus:ring-0" />
            <span class="text-slate-700 font-medium text-[11px]">Equipo apagado, desenergizado y libre de sedimentos de concreto o escombros pesados.</span>
          </label>
          <label class="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" id="chk-accessories" required checked class="mt-0.5 text-emerald-600 rounded focus:ring-0" />
            <span class="text-slate-700 font-medium text-[11px]">Accesorios, mandriles, llaves y cableado original completos según acta inicial.</span>
          </label>
          <label class="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" id="chk-access" required checked class="mt-0.5 text-emerald-600 rounded focus:ring-0" />
            <span class="text-slate-700 font-medium text-[11px]">Equipo disponible en portería / frente de obra para inspección de retorno del transportista.</span>
          </label>
        </div>
      </div>

      <div>
        <label class="block text-[11px] font-bold text-slate-700 mb-1">Observaciones de Entrega / Horómetro final</label>
        <textarea id="client-return-notes" rows="2" placeholder="Ej: Equipo operó sin novedades mecánicas. Disponible en portería..." class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-[#ea580c] focus:bg-white resize-none"></textarea>
      </div>

      <!-- Garantía en Custodia Aviso -->
      <div class="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between gap-3 text-xs">
        <div class="flex items-center gap-2">
          ${renderIcon('ShieldCheck', 'w-4 h-4 text-emerald-600 flex-shrink-0')}
          <span class="text-emerald-900 font-medium text-[11px]">
            Depósito de garantía salvaguardado: <strong>${formatCurrency(rental.deposit || 150000)} COP</strong>.
          </span>
        </div>
        <span class="text-[10px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200 shrink-0">
          Liberación automática
        </span>
      </div>

      <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
        <button type="button" id="btn-cancel-client-return" class="btn-secondary !py-2 !px-4 text-xs cursor-pointer">Cancelar</button>
        <button type="submit" id="btn-submit-client-return" class="btn-primary !py-2 !px-5 text-xs font-semibold cursor-pointer flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 border-emerald-700">
          ${renderIcon('RotateCcw', 'w-3.5 h-3.5')}
          <span>Confirmar Retorno de Maquinaria</span>
        </button>
      </div>
    </form>
  `;

  const dateInput = content.querySelector('#client-return-date');
  const statusBadge = content.querySelector('#client-return-status-badge');
  dateInput?.addEventListener('change', (e) => {
    const sel = e.target.value;
    if (!sel || !scheduledEndDate || !statusBadge) return;
    if (sel <= scheduledEndDate) {
      statusBadge.className = 'inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200';
      statusBadge.textContent = sel === scheduledEndDate ? '✓ Retorno exacto en la fecha asignada' : '✓ Retorno anticipado (en plazo)';
    } else {
      statusBadge.className = 'inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200';
      statusBadge.textContent = '⚠ Devolución con retraso sobre fecha asignada';
    }
  });

  content.querySelector('#btn-cancel-client-return')?.addEventListener('click', () => modal.close());

  content.querySelector('#client-return-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = content.querySelector('#btn-submit-client-return');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `${renderIcon('Loader2', 'w-3.5 h-3.5 animate-spin')} Registrando Retorno...`;
    }

    const effectiveReturnDate = dateInput?.value || todayStr;

    try {
      await api.patch(`/rentals/${rental.id}/complete`);
      rental.status = 'COMPLETED';

      notificationsStore.addNotification({
        type: 'RENTAL_RETURNED',
        title: `Devolución confirmada: ${rentalCode}`,
        message: `El retorno de ${toolName} para el contrato ${rentalCode} ha sido registrado exitosamente el ${formatDate(effectiveReturnDate)}. Proceso de liberación de depósito en curso.`,
        date: new Date().toISOString()
      });

      modal.close();
      showToast('Devolución de maquinaria radicada con éxito', 'success');

      openReturnConfirmationReceipt({
        rental,
        tool,
        returnDate: effectiveReturnDate,
        notes: content.querySelector('#client-return-notes')?.value || 'Equipo conforme entregado en obra'
      });

      if (onComplete) onComplete();
    } catch (err) {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `${renderIcon('RotateCcw', 'w-3.5 h-3.5')} Confirmar Retorno de Maquinaria`;
      }
      showToast(err.message || 'Error al registrar la devolución del equipo', 'error');
    }
  });

  modal.open({
    title: '',
    content: content,
    maxWidth: 'max-w-lg',
    hideHeader: true
  });
}

export function openReturnConfirmationReceipt(data) {
  const { rental, tool, returnDate, notes } = data;
  const toolName = tool?.name || rental.items?.[0]?.toolName || 'Maquinaria de Construcción';
  const rentalCode = rental.rentalCode || `#TR-${rental.id?.slice(0, 8)}`;
  const user = auth.getUser();
  const clientName = user?.profile?.fullName || user?.nombre || 'Constructora Gómez & Asoc.';
  const returnCode = `RET-2026-${(rental.rentalCode?.replace(/[^a-zA-Z0-9]/g, '') || rental.id.slice(0, 6)).toUpperCase()}`;

  const content = document.createElement('div');
  content.className = 'space-y-4 text-xs animate-scale-in';

  content.innerHTML = `
    <div class="space-y-4 text-slate-800">
      <!-- Actions Bar -->
      <div class="flex items-center justify-between pb-3 border-b border-slate-200">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <h3 class="font-bold text-sm text-slate-900 font-display">Acta Digital de Devolución Técnica</h3>
        </div>
        <div class="flex items-center gap-2">
          <button id="btn-print-return-receipt" class="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5 cursor-pointer">
            ${renderIcon('Printer', 'w-3.5 h-3.5')} Imprimir Acta
          </button>
          <button id="btn-close-return-receipt" class="btn-primary !py-1.5 !px-3 text-xs cursor-pointer">
            Cerrar
          </button>
        </div>
      </div>

      <!-- Printable Card -->
      <div id="printable-return-receipt" class="p-6 bg-white border border-slate-200 rounded-2xl space-y-5 shadow-xs">
        <!-- Certificate Header -->
        <div class="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-base font-black text-slate-900 tracking-tight font-display">ToolRent<span class="text-orange-600">.co</span></span>
              <span class="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold border border-emerald-200">EQUIPO DEVUELTO</span>
            </div>
            <p class="text-[11px] text-slate-500 mt-1">Acta oficial de recepción y retorno físico de maquinaria</p>
          </div>
          <div class="text-right">
            <span class="text-[10px] text-slate-400 uppercase font-mono block">Nº Devolución</span>
            <span class="font-mono font-bold text-sm text-slate-800">${returnCode}</span>
            <span class="text-[10px] text-slate-500 block mt-0.5">Fecha: ${formatDate(returnDate)}</span>
          </div>
        </div>

        <!-- Info Grid -->
        <div class="grid grid-cols-2 gap-4 text-xs">
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span class="text-[10px] text-slate-400 uppercase font-bold block">Cliente Responsable</span>
            <strong class="text-slate-900 block">${clientName}</strong>
            <span class="text-[11px] text-slate-500 block">Contrato: ${rentalCode}</span>
          </div>
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
            <span class="text-[10px] text-slate-400 uppercase font-bold block">Maquinaria Retornada</span>
            <strong class="text-slate-900 block truncate">${toolName}</strong>
            <span class="text-[11px] text-slate-500 block">Serie: ${tool?.serialNumber || 'N/A'}</span>
          </div>
        </div>

        <!-- Period and Escrow Details -->
        <div class="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-1.5 text-xs text-emerald-950">
          <div class="flex items-center justify-between font-bold">
            <span>Liquidación de Depósito en Custodia</span>
            <span class="font-mono text-emerald-700">${formatCurrency(rental.deposit || 150000)} COP</span>
          </div>
          <p class="text-[11px] text-emerald-800/90 leading-relaxed">
            El equipo ha sido retornado a bodega técnica. Una vez verificada la inspección física, el depósito se desembolsa automáticamente al medio de pago registrado.
          </p>
        </div>

        <div class="text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          <strong>Notas de entrega:</strong> ${notes}
        </div>

        <!-- Signatures -->
        <div class="grid grid-cols-2 gap-6 pt-6 text-center text-xs">
          <div class="border-t border-slate-300 pt-2">
            <span class="font-bold text-slate-800 block">${clientName}</span>
            <span class="text-[10px] text-slate-400 block">Entregado en Obra</span>
          </div>
          <div class="border-t border-slate-300 pt-2">
            <span class="font-bold text-slate-800 block">Recepción Técnica ToolRent</span>
            <span class="text-[10px] text-slate-400 block">Sello Digital de Retorno</span>
          </div>
        </div>
      </div>
    </div>
  `;

  content.querySelector('#btn-close-return-receipt')?.addEventListener('click', () => modal.close());
  content.querySelector('#btn-print-return-receipt')?.addEventListener('click', () => window.print());

  modal.open({
    title: '',
    content: content,
    maxWidth: 'max-w-xl',
    hideHeader: true
  });
}

export default renderClientDashboard;

/**
 * Modal: Validación y Confirmación de Recepción del Equipo en Faena
 */
export function openClientReceptionModal(rental, tool, onComplete) {
  if (!rental) return;

  const toolName = tool?.name || rental.items?.[0]?.toolName || 'Maquinaria de Construcción';
  const rentalCode = rental.rentalCode || `#TR-${rental.id?.slice(0, 8)}`;
  const toolImg = tool?.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200';
  const user = auth.getUser();
  const address = rental.deliveryAddress || user?.profile?.address || 'Frente de Obra / Bogotá D.C.';
  const defaultReceiver = user?.profile?.fullName || user?.nombre || user?.username || 'Ing. Residente';
  const defaultPhone = rental.contactPhone || user?.profile?.phone || '3001234567';

  const content = document.createElement('div');
  content.className = 'p-6 space-y-4 bg-white text-slate-800';

  content.innerHTML = `
    <!-- Header -->
    <div class="flex items-start justify-between gap-3 pb-3 border-b border-slate-200">
      <div>
        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
          <span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
          Recepción Técnica en Faena
        </span>
        <h3 class="text-base font-bold text-slate-900 font-display mt-1">Acta de Recepción y Conformidad</h3>
        <p class="text-xs text-slate-500 mt-0.5">Valida la llegada del equipo a obra para dar inicio oficial al periodo contratado.</p>
      </div>
      <div class="text-right">
        <span class="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">${rentalCode}</span>
      </div>
    </div>

    <!-- Tool Preview Card -->
    <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <img src="${toolImg}" class="w-12 h-12 rounded-xl object-contain bg-white border border-slate-200 p-1 flex-shrink-0" onerror="this.src='https://images.unsplash.com/photo-1504148455328-c376907d081c?w=100'" />
        <div class="min-w-0">
          <h4 class="font-bold text-slate-900 text-xs truncate">${toolName}</h4>
          <span class="text-[11px] text-slate-500">${tool?.brand || 'Industrial'} • Serie: ${tool?.serialNumber || 'Certificada'}</span>
        </div>
      </div>
      <div class="text-right flex-shrink-0">
        <span class="text-[10px] text-slate-400 block uppercase font-semibold">Periodo en Obra</span>
        <span class="font-bold text-xs text-slate-800">${formatDate(rental.startDate)} → ${formatDate(rental.endDate)}</span>
        <span class="text-[10px] text-emerald-700 font-semibold block">${rental.totalDays || 1} día(s) en faena</span>
      </div>
    </div>

    <!-- Reception Form -->
    <form id="reception-form" class="space-y-4">
      
      <!-- Verification Checklist -->
      <div class="p-3 bg-blue-50/50 border border-blue-200/80 rounded-xl space-y-2">
        <span class="text-[11px] font-bold text-blue-950 uppercase tracking-wider block">Lista de Chequeo de Entrada a Faena:</span>
        
        <label class="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
          <input type="checkbox" id="check-physical" required checked class="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-0" />
          <span>He recibido el equipo físicamente en frente de obra y verificado con el transportista.</span>
        </label>
        
        <label class="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
          <input type="checkbox" id="check-accessories" required checked class="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-0" />
          <span>Accesorios, cables, protecciones y manual de operación incluidos y completos.</span>
        </label>
        
        <label class="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer">
          <input type="checkbox" id="check-operational" required checked class="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-0" />
          <span>Prueba de encendido y funcionamiento de seguridad satisfactoria (sin fugas ni averías).</span>
        </label>
      </div>

      <!-- Fields: Receiver Info -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-[11px] font-bold text-slate-700 mb-1">Responsable que Recibe en Obra *</label>
          <input type="text" id="reception-receiver-name" required value="${defaultReceiver}" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#c2410c] focus:bg-white transition-colors" />
        </div>
        <div>
          <label class="block text-[11px] font-bold text-slate-700 mb-1">Teléfono Encargado Faena *</label>
          <input type="tel" id="reception-receiver-phone" required maxlength="10" inputmode="numeric" value="${defaultPhone.replace(/\D/g, '').slice(0, 10)}" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#c2410c] focus:bg-white font-mono" />
        </div>
      </div>

      <div>
        <label class="block text-[11px] font-bold text-slate-700 mb-1">Ubicación / Frente de Obra Confirmado *</label>
        <input type="text" id="reception-address" required value="${address}" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#c2410c] focus:bg-white" />
      </div>

      <div>
        <label class="block text-[11px] font-bold text-slate-700 mb-1">Notas u Observaciones de Entrada (Opcional)</label>
        <textarea id="reception-notes" rows="2" placeholder="Ej: Horómetro en 120h, tanque con combustible completo, sin rayones..." class="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#c2410c] focus:bg-white resize-none placeholder:text-slate-400"></textarea>
      </div>

      <!-- Actions -->
      <div class="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
        <button type="button" id="btn-cancel-reception" class="border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer">
          Cancelar
        </button>
        <button type="submit" id="btn-submit-reception" class="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer">
          ${renderIcon('CheckCircle2', 'w-4 h-4 text-white')}
          <span>Confirmar Recepción y Comenzar Faena</span>
        </button>
      </div>

    </form>
  `;

  content.querySelector('#btn-cancel-reception')?.addEventListener('click', () => modal.close());

  content.querySelector('#reception-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const receiverName = content.querySelector('#reception-receiver-name')?.value?.trim();
    const receiverPhone = content.querySelector('#reception-receiver-phone')?.value?.trim();
    const confirmedAddress = content.querySelector('#reception-address')?.value?.trim();
    const notes = content.querySelector('#reception-notes')?.value?.trim();

    const submitBtn = content.querySelector('#btn-submit-reception');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `${renderIcon('Loader2', 'w-4 h-4 animate-spin text-white')} Registrando Entrada...`;
    }

    try {
      try {
        await api.patch(`/rentals/${rental.id}/start`);
      } catch (err) {
        console.warn('Server start patch fallback:', err.message);
      }

      const receivedMap = JSON.parse(localStorage.getItem('toolrent_received_rentals') || '{}');
      receivedMap[rental.id] = {
        receivedAt: new Date().toISOString(),
        receiverName,
        receiverPhone,
        confirmedAddress,
        notes: notes || 'Recepción técnica conforme en obra.'
      };
      localStorage.setItem('toolrent_received_rentals', JSON.stringify(receivedMap));

      notificationsStore.addNotification({
        type: 'EQUIPMENT_RECEIVED',
        title: `Equipo recibido: ${toolName}`,
        message: `Acta de recepción confirmada para contrato ${rentalCode} en ${confirmedAddress}. Faena técnica activa.`,
        date: new Date().toISOString()
      });

      modal.close();
      showToast(`¡Equipo ${toolName} recibido con éxito en obra! Faena técnica en curso.`, 'success');
      if (onComplete) onComplete();
    } catch (err) {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `${renderIcon('CheckCircle2', 'w-4 h-4 text-white')} Confirmar Recepción y Comenzar Faena`;
      }
      showToast(err.message || 'Error al confirmar la recepción del equipo.', 'error');
    }
  });

  modal.open({
    title: '',
    content: content,
    maxWidth: 'max-w-lg',
    hideHeader: true
  });
}
