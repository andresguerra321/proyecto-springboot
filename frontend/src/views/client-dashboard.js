import api from '../api/client.js';
import auth from '../auth/state.js';
import showToast from '../components/toast.js';
import { formatCurrency, formatDate, getRentalStatusBadge } from '../utils/formatters.js';
import { renderIcon } from '../utils/icons.js';
import { openAuthModal } from '../components/auth-modal.js';

export async function renderClientDashboard() {
  const container = document.getElementById('app-content');
  if (!container) return;

  if (!auth.isAuthenticated()) {
    container.innerHTML = `
      <section class="max-w-4xl mx-auto px-4 py-20 text-center">
        <div class="glass-card p-10 max-w-lg mx-auto space-y-4">
          <div class="w-14 h-14 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/30 flex items-center justify-center mx-auto">
            ${renderIcon('Lock', 'w-7 h-7')}
          </div>
          <h2 class="text-xl font-bold text-white font-display">Inicia Sesión para ver tus Alquileres</h2>
          <p class="text-xs text-slate-400">Accede a tu historial de reservas, comprobantes de pago y facturas oficiales con IVA.</p>
          <button id="btn-login-prompt" class="btn-primary w-full !py-2.5 text-xs">
            ${renderIcon('LogIn', 'w-4 h-4')} Iniciar Sesión como Cliente
          </button>
        </div>
      </section>
    `;
    container.querySelector('#btn-login-prompt')?.addEventListener('click', () => openAuthModal('login'));
    return;
  }

  const user = auth.getUser();

  container.innerHTML = `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 space-y-8">
      
      <!-- Dashboard Header -->
      <div class="glass-card p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 text-xs font-semibold mb-2">
            ${renderIcon('UserCheck', 'w-3.5 h-3.5')} Portal Cliente
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Mis Alquileres y Reservas
          </h1>
          <p class="text-xs text-slate-400 mt-1">
            Supervisa el estado de entrega de tus herramientas, fechas de vigencia y comprobantes fiscales.
          </p>
        </div>

        <a href="#/catalog" class="btn-primary !py-2.5 text-xs">
          ${renderIcon('PlusCircle', 'w-4 h-4')} Nuevo Alquiler
        </a>
      </div>

      <!-- Rentals List / Table -->
      <div class="glass-card overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            ${renderIcon('ListOrdered', 'w-4 h-4 text-brand-400')} Historial de Transacciones
          </h3>
          <button id="btn-refresh-rentals" class="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors">
            ${renderIcon('RefreshCw', 'w-3.5 h-3.5')} Actualizar
          </button>
        </div>

        <div id="client-rentals-container" class="divide-y divide-slate-800">
          <div class="py-16 text-center text-slate-400">
            ${renderIcon('Loader2', 'w-6 h-6 animate-spin mx-auto text-brand-400 mb-2')}
            <p class="text-xs">Cargando tus solicitudes de alquiler...</p>
          </div>
        </div>
      </div>

    </section>
  `;

  const rentalsContainer = container.querySelector('#client-rentals-container');
  const refreshBtn = container.querySelector('#btn-refresh-rentals');
  if (refreshBtn) refreshBtn.addEventListener('click', loadClientRentals);

  async function loadClientRentals() {
    try {
      const clientId = user.profile?.id || user.id;
      const rentals = await api.get(`/rentals/client/${clientId}`);

      if (!rentals || rentals.length === 0) {
        rentalsContainer.innerHTML = `
          <div class="py-16 text-center space-y-3">
            <div class="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mx-auto">
              ${renderIcon('CalendarX', 'w-6 h-6')}
            </div>
            <h4 class="text-sm font-bold text-white">No tienes alquileres registrados todavía</h4>
            <p class="text-xs text-slate-400 max-w-sm mx-auto">Explora nuestro catálogo para reservar maquinaria y herramientas de construcción con entrega garantizada.</p>
            <a href="#/catalog" class="btn-primary !py-2 text-xs inline-flex">
              Explorar Catálogo
            </a>
          </div>
        `;
        return;
      }

      rentalsContainer.innerHTML = rentals.map(rental => {
        const items = rental.items || [];
        const isPending = rental.status === 'PENDING';
        const isConfirmed = rental.status === 'CONFIRMED';
        const isInProgress = rental.status === 'IN_PROGRESS';
        const isCompleted = rental.status === 'COMPLETED';

        return `
          <div class="p-6 hover:bg-slate-900/40 transition-colors flex flex-col lg:flex-row justify-between gap-6 items-start lg:items-center">
            
            <!-- Rental Info -->
            <div class="space-y-2 flex-1">
              <div class="flex flex-wrap items-center gap-3">
                <span class="font-mono text-xs font-semibold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-md">
                  #${rental.id.substring(0, 8)}
                </span>
                ${getRentalStatusBadge(rental.status)}
                <span class="text-xs text-slate-400">
                  Creada el ${formatDate(rental.createdAt?.split('T')[0])}
                </span>
              </div>

              <!-- Dates and Items -->
              <div class="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                <div class="flex items-center gap-1.5">
                  ${renderIcon('Calendar', 'w-4 h-4 text-brand-400')}
                  <span>Vigencia: <strong>${formatDate(rental.startDate)}</strong> hasta <strong>${formatDate(rental.endDate)}</strong></span>
                </div>
                <div class="flex items-center gap-1.5">
                  ${renderIcon('Layers', 'w-4 h-4 text-indigo-400')}
                  <span>Equipos Alquilados: <strong>${items.length} ítem(s)</strong></span>
                </div>
              </div>

              <!-- Items list -->
              <div class="flex flex-wrap gap-2 pt-1">
                ${items.map(item => `
                  <span class="inline-flex items-center gap-1 text-[11px] bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-slate-200">
                    ${renderIcon('Check', 'w-3 h-3 text-emerald-400')} ${item.toolName || 'Equipo Industrial'} (${formatCurrency(item.dailyPrice)}/día)
                  </span>
                `).join('')}
              </div>
            </div>

            <!-- Price & Action Buttons -->
            <div class="flex flex-row lg:flex-col items-end justify-between w-full lg:w-auto gap-3 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800">
              <div class="text-left lg:text-right">
                <span class="text-[10px] text-slate-400 block">Total Transacción</span>
                <span class="text-lg font-bold text-white font-display">
                  ${formatCurrency(rental.totalAmount)}
                </span>
              </div>

              <div class="flex items-center gap-2">
                <!-- Check Invoice Button -->
                <button class="btn-check-invoice btn-secondary !py-2 text-xs" data-rental-id="${rental.id}">
                  ${renderIcon('FileText', 'w-3.5 h-3.5')} Factura HTML
                </button>

                <!-- Cancel Button if Pending -->
                ${isPending ? `
                  <button class="btn-cancel-rental btn-danger !py-2 text-xs" data-rental-id="${rental.id}">
                    ${renderIcon('XCircle', 'w-3.5 h-3.5')} Cancelar
                  </button>
                ` : ''}
              </div>
            </div>

          </div>
        `;
      }).join('');

      // Attach Actions
      rentalsContainer.querySelectorAll('.btn-check-invoice').forEach(btn => {
        btn.addEventListener('click', async () => {
          const rentalId = btn.dataset.rentalId;
          try {
            const invoice = await api.get(`/billing/invoices/rental/${rentalId}`);
            if (invoice && invoice.id) {
              window.open(`http://localhost:8085/api/v1/billing/invoices/${invoice.id}/html`, '_blank');
            } else {
              showToast('No se encontró factura para este alquiler', 'info');
            }
          } catch (e) {
            showToast('La factura aún está en proceso de emisión contable', 'warning');
          }
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
        <div class="p-8 text-center text-rose-400 text-xs">
          ${renderIcon('AlertCircle', 'w-6 h-6 mx-auto mb-2')}
          ${err.message || 'No fue posible cargar tu historial de alquileres'}
        </div>
      `;
    }
  }

  await loadClientRentals();
}
