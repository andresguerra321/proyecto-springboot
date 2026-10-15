import api from '../api/client.js';
import auth from '../auth/state.js';
import showToast from '../components/toast.js';
import { formatCurrency, formatDate, getRentalStatusBadge } from '../utils/formatters.js';
import { renderIcon } from '../utils/icons.js';
import { openAuthModal } from '../components/auth-modal.js';
import { openInvoiceViewer, openCheckoutModal, openRentalInvoiceModal } from './rental-modal.js';
export async function renderClientDashboard() {
  const container = document.getElementById('app-content');
  if (!container) return;

  if (!auth.isAuthenticated()) {
    container.innerHTML = `
      <section class="max-w-4xl mx-auto px-4 py-20 text-center">
        <div class="bg-white rounded-2xl border border-slate-200/80 p-10 max-w-lg mx-auto shadow-sm space-y-4">
          <div class="w-14 h-14 rounded-full bg-orange-50 text-brand-600 border border-orange-200 flex items-center justify-center mx-auto">
            ${renderIcon('Lock', 'w-7 h-7')}
          </div>
          <h2 class="text-xl font-bold text-slate-900 font-display">Inicia Sesión para ver tus Alquileres</h2>
          <p class="text-xs text-slate-500">Accede a tu historial de reservas, comprobantes de pago y facturas oficiales con IVA.</p>
          <div class="flex justify-center pt-2">
            <button id="btn-login-prompt" class="btn-primary !py-2.5 !px-8 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm">
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

  container.innerHTML = `
    <div class="min-h-screen bg-[#f8fafc] text-slate-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        <!-- Dashboard Header -->
        <div class="bg-white rounded-xl border border-slate-200/80 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
          <div>
            <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 text-brand-600 text-xs font-semibold mb-2 border border-orange-200">
              ${renderIcon('UserCheck', 'w-3.5 h-3.5')} Portal Cliente · ToolRent
            </div>
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">
              Mis Alquileres y Reservas
            </h1>
            <p class="text-xs text-slate-500 mt-1">
              Supervisa el estado de entrega de tus herramientas, fechas de vigencia y comprobantes fiscales.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2.5">
            ${auth.isProvider() ? `
              <a href="#/provider" class="px-3.5 py-2.5 rounded-xl bg-orange-50 border border-orange-200 text-[#ea580c] hover:bg-orange-100/70 text-xs font-bold flex items-center gap-1.5 transition-colors">
                ${renderIcon('Building2', 'w-4 h-4')} Panel de Proveedor
              </a>
            ` : ''}
            <a href="#/catalog" class="btn-primary !py-2.5 text-xs font-semibold shadow-sm flex items-center gap-1.5">
              ${renderIcon('PlusCircle', 'w-4 h-4')} Nuevo Alquiler
            </a>
          </div>
        </div>

        <!-- Rentals List / Table -->
        <div class="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              ${renderIcon('ListOrdered', 'w-4 h-4 text-brand-600')} Historial de Transacciones
            </h3>
            <button id="btn-refresh-rentals" class="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors font-medium">
              ${renderIcon('RefreshCw', 'w-3.5 h-3.5')} Actualizar
            </button>
          </div>

          <div id="client-rentals-container" class="divide-y divide-slate-100">
            <div class="py-12 flex justify-center items-center text-slate-400 gap-2.5">
              ${renderIcon('Loader2', 'w-5 h-5 animate-spin text-[#FF5A1F]')}
              <span class="text-xs font-medium">Cargando tus alquileres...</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  const rentalsContainer = container.querySelector('#client-rentals-container');
  const refreshBtn = container.querySelector('#btn-refresh-rentals');
  if (refreshBtn) refreshBtn.addEventListener('click', loadClientRentals);

  async function loadClientRentals() {
    try {
      const clientId = user.profile?.id || user.id;
      const [rentals, tools] = await Promise.all([
        api.get(`/rentals/client/${clientId}`),
        api.get('/tools').catch(() => [])
      ]);
      const toolMap = new Map((tools || []).map(t => [t.id, t.name]));

      const rawRentals = rentals || [];
      if (rawRentals.length === 0) {
        rentalsContainer.innerHTML = `
          <div class="py-16 text-center space-y-3">
            <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
              ${renderIcon('CalendarX', 'w-6 h-6')}
            </div>
            <h4 class="text-sm font-bold text-slate-900">No tienes alquileres registrados todavía</h4>
            <p class="text-xs text-slate-500 max-w-sm mx-auto">Explora nuestro catálogo para reservar maquinaria y herramientas de construcción con entrega garantizada.</p>
            <a href="#/catalog" class="btn-primary !py-2 text-xs inline-flex mt-2">
              Explorar Catálogo
            </a>
          </div>
        `;
        return;
      }

      // Sort newest rentals first
      const sortedRentals = [...rawRentals].sort((a, b) => new Date(b.createdAt || b.startDate || 0) - new Date(a.createdAt || a.startDate || 0));

      rentalsContainer.innerHTML = sortedRentals.map(rental => {
        const items = rental.items || [];
        const isPending = rental.status === 'PENDING';

        const rentalCode = rental.rentalCode || `RNT-${String(rental.id).slice(0, 8).toUpperCase()}`;

        return `
          <div class="p-6 hover:bg-slate-50/50 transition-colors flex flex-col lg:flex-row justify-between gap-6 items-start lg:items-center">
            
            <!-- Rental Info -->
            <div class="space-y-2 flex-1">
              <div class="flex flex-wrap items-center gap-3">
                <span class="font-mono text-xs font-bold text-slate-800 bg-orange-50 border border-orange-200/80 px-2.5 py-0.5 rounded-md">
                  ${rentalCode}
                </span>
                ${getRentalStatusBadge(rental.status)}
                <span class="text-xs text-slate-400">
                  Período: ${formatDate(rental.startDate)} → ${formatDate(rental.endDate)}
                </span>
              </div>

              <!-- Dates and Items -->
              <div class="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                <div class="flex items-center gap-1.5">
                  ${renderIcon('Calendar', 'w-4 h-4 text-brand-600')}
                  <span>Duración: <strong>${rental.totalDays || 1} día(s)</strong></span>
                </div>
                <div class="flex items-center gap-1.5">
                  ${renderIcon('Layers', 'w-4 h-4 text-blue-600')}
                  <span>Equipos Alquilados: <strong>${items.length || 1} ítem(s)</strong></span>
                </div>
              </div>

              <!-- Items list -->
              <div class="flex flex-wrap gap-2 pt-1">
                ${items.map(item => `
                  <span class="inline-flex items-center gap-1 text-[11px] bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 font-medium">
                    ${renderIcon('Check', 'w-3 h-3 text-emerald-600')} ${item.toolName || toolMap.get(item.toolId) || 'Equipo Industrial'} (${formatCurrency(item.dailyPrice)}/día)
                  </span>
                `).join('')}
              </div>
            </div>

            <!-- Price & Action Buttons -->
            <div class="flex flex-row lg:flex-col items-end justify-between w-full lg:w-auto gap-3 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
              <div class="text-left lg:text-right">
                <span class="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Total Transacción</span>
                <span class="text-lg font-bold text-slate-900 font-display">
                  ${formatCurrency(rental.totalAmount || rental.subtotal || 255000)}
                </span>
              </div>

              <div class="flex items-center gap-2">
                ${isPending ? `
                  <button class="btn-pay-pending btn-primary !py-2 !px-3 text-xs flex items-center gap-1.5 shadow-sm" data-rental-id="${rental.id}">
                    ${renderIcon('CreditCard', 'w-3.5 h-3.5')} Pagar Reserva
                  </button>
                  <button class="btn-cancel-rental !py-2 !px-3 text-xs bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-lg font-semibold flex items-center gap-1 transition-colors" data-rental-id="${rental.id}">
                    ${renderIcon('XCircle', 'w-3.5 h-3.5')} Cancelar
                  </button>
                ` : `
                  <!-- Check Invoice Button -->
                  <button class="btn-check-invoice btn-secondary !py-2 !px-3 text-xs flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm" data-rental-id="${rental.id}">
                    ${renderIcon('FileText', 'w-3.5 h-3.5 text-brand-600')} Ver Factura Oficial
                  </button>
                `}
              </div>
            </div>

          </div>
        `;
      }).join('');

      // Attach Actions
      rentalsContainer.querySelectorAll('.btn-pay-pending').forEach(btn => {
        btn.addEventListener('click', async () => {
          const rentalId = btn.dataset.rentalId;
          const targetRental = rentals.find(r => r.id === rentalId);
          if (!targetRental) return;

          const firstItem = targetRental.items?.[0];
          let selectedTool = tools.find(t => t.id === firstItem?.toolId);
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
        });
      });

      rentalsContainer.querySelectorAll('.btn-check-invoice').forEach(btn => {
        btn.addEventListener('click', async () => {
          const rentalId = btn.dataset.rentalId;
          const targetRental = rentals.find(r => r.id === rentalId);
          const firstItem = targetRental?.items?.[0];
          const targetTool = tools.find(t => t.id === firstItem?.toolId);
          openRentalInvoiceModal(rentalId, targetRental, targetTool);
        });
      });

      rentalsContainer.querySelectorAll('.btn-cancel-rental').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('¿Estás seguro de cancelar esta solicitud de alquiler?')) return;
          const rentalId = btn.dataset.rentalId;
          try {
            await api.patch(`/rentals/${rentalId}/cancel`);
            showToast('Alquiler cancelado correctamente', 'success');
            loadClientRentals();
          } catch (e) {
            showToast(e.message || 'Error al cancelar la reserva', 'error');
          }
        });
      });

    } catch (err) {
      rentalsContainer.innerHTML = `
        <div class="p-8 text-center text-rose-500 text-xs">
          ${renderIcon('AlertCircle', 'w-6 h-6 mx-auto mb-2')}
          ${err.message || 'No fue posible cargar tu historial de alquileres'}
        </div>
      `;
    }
  }

  await loadClientRentals();
}

export default renderClientDashboard;
