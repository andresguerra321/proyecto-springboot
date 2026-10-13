import api from '../api/client.js';
import auth from '../auth/state.js';
import showToast from '../components/toast.js';
import { formatCurrency, formatDate, getRentalStatusBadge } from '../utils/formatters.js';
import { renderIcon } from '../utils/icons.js';
import { openAuthModal } from '../components/auth-modal.js';
import { openInvoiceViewer } from './rental-modal.js';

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

          <a href="#/catalog" class="btn-primary !py-2.5 text-xs font-semibold shadow-sm flex items-center gap-1.5">
            ${renderIcon('PlusCircle', 'w-4 h-4')} Nuevo Alquiler
          </a>
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
            <div class="py-16 text-center text-slate-400">
              ${renderIcon('Loader2', 'w-6 h-6 animate-spin mx-auto text-brand-600 mb-2')}
              <p class="text-xs">Cargando tus solicitudes de alquiler...</p>
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
      const rentals = await api.get(`/rentals/client/${clientId}`);

      if (!rentals || rentals.length === 0) {
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

      rentalsContainer.innerHTML = rentals.map(rental => {
        const items = rental.items || [];
        const isPending = rental.status === 'PENDING';

        return `
          <div class="p-6 hover:bg-slate-50/50 transition-colors flex flex-col lg:flex-row justify-between gap-6 items-start lg:items-center">
            
            <!-- Rental Info -->
            <div class="space-y-2 flex-1">
              <div class="flex flex-wrap items-center gap-3">
                <span class="font-mono text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                  #${rental.id}
                </span>
                ${getRentalStatusBadge(rental.status)}
                <span class="text-xs text-slate-400">
                  Creada el ${formatDate(rental.createdAt?.split('T')[0] || '2026-10-13')}
                </span>
              </div>

              <!-- Dates and Items -->
              <div class="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                <div class="flex items-center gap-1.5">
                  ${renderIcon('Calendar', 'w-4 h-4 text-brand-600')}
                  <span>Vigencia: <strong>${formatDate(rental.startDate)}</strong> hasta <strong>${formatDate(rental.endDate)}</strong></span>
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
                    ${renderIcon('Check', 'w-3 h-3 text-emerald-600')} ${item.toolName || 'Equipo Industrial'} (${formatCurrency(item.dailyPrice)}/día)
                  </span>
                `).join('')}
              </div>
            </div>

            <!-- Price & Action Buttons -->
            <div class="flex flex-row lg:flex-col items-end justify-between w-full lg:w-auto gap-3 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
              <div class="text-left lg:text-right">
                <span class="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Total Transacción</span>
                <span class="text-lg font-bold text-slate-900 font-display">
                  ${formatCurrency(rental.totalAmount || 255000)}
                </span>
              </div>

              <div class="flex items-center gap-2">
                <!-- Check Invoice Button -->
                <button class="btn-check-invoice btn-secondary !py-2 !px-3 text-xs flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm" data-rental-id="${rental.id}">
                  ${renderIcon('FileText', 'w-3.5 h-3.5 text-brand-600')} Ver Factura Oficial
                </button>

                <!-- Cancel Button if Pending -->
                ${isPending ? `
                  <button class="btn-cancel-rental !py-2 !px-3 text-xs bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-lg font-semibold flex items-center gap-1 transition-colors" data-rental-id="${rental.id}">
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
        btn.addEventListener('click', () => {
          openInvoiceViewer({
            invoiceNumber: 'TR-0004587',
            issueDate: '13 oct 2026',
            client: {
              name: user.profile?.fullName || user.username || 'Juan Pérez García',
              taxId: '1.032.456.789',
              email: user.email || 'juan.perez@email.com',
              phone: '+57 300 123 4567',
              address: 'Cra 45 # 12-34, Bucaramanga, Santander'
            },
            provider: {
              name: 'Construcciones del Norte S.A.S.',
              taxId: '901.234.567-8',
              email: 'contacto@cnorte.com',
              phone: '+57 317 654 3210',
              address: 'Av. 27 # 45-12, Floridablanca, Santander'
            },
            items: [
              { name: 'Taladro percutor 1"', days: 3, dailyPrice: 85000, subtotal: 255000 },
              { name: 'Placa compactadora 90 kg', days: 3, dailyPrice: 150000, subtotal: 450000 },
              { name: 'Andamio multidireccional', days: 2, dailyPrice: 28000, subtotal: 56000 }
            ],
            subtotal: 761000,
            tax: 144590,
            total: 905590,
            paymentMethod: 'Transferencia bancaria',
            bank: 'Bancolombia',
            reference: 'TR-0004587',
            paymentDate: '13 oct 2026'
          });
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
