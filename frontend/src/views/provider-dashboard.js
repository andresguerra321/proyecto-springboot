import api from '../api/client.js';
import auth from '../auth/state.js';
import showToast from '../components/toast.js';
import modal from '../components/modal.js';
import { formatCurrency, formatDate, getRentalStatusBadge, getToolStatusBadge } from '../utils/formatters.js';
import { renderIcon } from '../utils/icons.js';
import { openAuthModal } from '../components/auth-modal.js';

export async function renderProviderDashboard() {
  const container = document.getElementById('app-content');
  if (!container) return;

  const user = auth.getUser();
  const providerId = user?.profile?.id || user?.id || 'prov-001';

  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <!-- Top Title and Action -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-black text-slate-900 font-display">Solicitudes</h1>
          <p class="text-xs sm:text-sm text-slate-500 mt-1">Gestiona las solicitudes de alquiler de herramientas de tus clientes.</p>
        </div>

        <button id="btn-open-new-tool-drawer" class="btn-primary !py-2.5 text-xs flex items-center gap-2">
          ${renderIcon('Plus', 'w-4 h-4')}
          <span>Nueva herramienta</span>
        </button>
      </div>

      <!-- Top 5 KPIs Cards Matching Stitch Screenshot -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4" id="provider-kpis-grid">
        <!-- Card 1 -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div class="flex items-center gap-2 text-slate-500 text-xs font-medium">
            ${renderIcon('Calendar', 'w-4 h-4 text-slate-400')}
            <span>Total de solicitudes</span>
          </div>
          <div class="text-2xl font-black text-slate-900 font-display">24</div>
          <div class="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            &uarr; 12% <span class="text-slate-400 font-normal">vs. mes anterior</span>
          </div>
        </div>

        <!-- Card 2 -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div class="flex items-center gap-2 text-slate-500 text-xs font-medium">
            ${renderIcon('Clock', 'w-4 h-4 text-slate-400')}
            <span>Pendientes</span>
          </div>
          <div class="text-2xl font-black text-slate-900 font-display" id="kpi-pending-count">6</div>
          <div class="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            &uarr; 2% <span class="text-slate-400 font-normal">vs. mes anterior</span>
          </div>
        </div>

        <!-- Card 3 -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div class="flex items-center gap-2 text-slate-500 text-xs font-medium">
            ${renderIcon('CheckCircle2', 'w-4 h-4 text-slate-400')}
            <span>Confirmadas</span>
          </div>
          <div class="text-2xl font-black text-slate-900 font-display">10</div>
          <div class="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            &uarr; 18% <span class="text-slate-400 font-normal">vs. mes anterior</span>
          </div>
        </div>

        <!-- Card 4 -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div class="flex items-center gap-2 text-slate-500 text-xs font-medium">
            ${renderIcon('Play', 'w-4 h-4 text-slate-400')}
            <span>En curso</span>
          </div>
          <div class="text-2xl font-black text-slate-900 font-display">5</div>
          <div class="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            &uarr; 25% <span class="text-slate-400 font-normal">vs. mes anterior</span>
          </div>
        </div>

        <!-- Card 5 -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2 col-span-2 sm:col-span-1">
          <div class="flex items-center gap-2 text-slate-500 text-xs font-medium">
            ${renderIcon('CheckCheck', 'w-4 h-4 text-slate-400')}
            <span>Completadas</span>
          </div>
          <div class="text-2xl font-black text-slate-900 font-display">3</div>
          <div class="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            &uarr; 0% <span class="text-slate-400 font-normal">vs. mes anterior</span>
          </div>
        </div>
      </div>

      <!-- Filters Row -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-3">
          <select id="requests-status-filter" class="input-field !py-2 text-xs !w-auto">
            <option value="">Todos los estados</option>
            <option value="PENDING">Pendientes</option>
            <option value="CONFIRMED">Confirmadas</option>
            <option value="IN_PROGRESS">En curso</option>
            <option value="COMPLETED">Completadas</option>
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
          <input type="text" id="requests-search" placeholder="Buscar por cliente, herramienta o número..." class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-[#ea580c]" />
        </div>
      </div>

      <!-- Requests Table Section -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs" id="requests-table">
            <thead class="text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200 bg-slate-50/70">
              <tr>
                <th class="py-3 px-4 w-12 text-center">#</th>
                <th class="py-3 px-4">Cliente</th>
                <th class="py-3 px-4">Herramientas</th>
                <th class="py-3 px-4">Fechas</th>
                <th class="py-3 px-4">Total</th>
                <th class="py-3 px-4">Estado</th>
                <th class="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100" id="requests-tbody">
              <!-- Rendered dynamically -->
            </tbody>
          </table>
        </div>

        <div class="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Mostrando 6 solicitudes activas</span>
          <div class="flex items-center gap-1">
            <button class="px-2.5 py-1 rounded bg-[#ea580c] text-white font-bold">1</button>
            <button class="px-2.5 py-1 rounded border border-slate-200 hover:bg-slate-50">2</button>
            <button class="px-2 py-1 rounded border border-slate-200 hover:bg-slate-50">&gt;</button>
          </div>
        </div>
      </div>

    </div>
  `;

  let requests = [];
  await loadRequests();

  async function loadRequests() {
    try {
      requests = await api.get(`/rentals/provider/${providerId}`);
      renderRequestsTable();
    } catch (e) {
      console.warn('Could not load provider requests', e);
    }
  }

  function renderRequestsTable() {
    const tbody = container.querySelector('#requests-tbody');
    if (!tbody) return;

    tbody.innerHTML = requests.map((req, idx) => {
      const isPending = req.status === 'PENDING';
      const isConfirmed = req.status === 'CONFIRMED';
      const isInProgress = req.status === 'IN_PROGRESS';

      return `
        <tr class="hover:bg-slate-50/80 transition-colors">
          <td class="py-3.5 px-4 text-center font-mono text-slate-400 font-semibold">${idx + 1}</td>
          <td class="py-3.5 px-4">
            <div class="font-bold text-slate-900">${req.client?.name || 'Cliente'}</div>
            <div class="text-[11px] text-slate-400">${req.client?.email || 'cliente@email.com'}</div>
          </td>
          <td class="py-3.5 px-4 flex items-center gap-2.5">
            <img src="${req.tool?.img || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=60'}" class="w-9 h-9 rounded-lg object-contain bg-slate-50 border border-slate-200" />
            <div>
              <div class="font-bold text-slate-800">${req.tool?.name || 'Equipo'}</div>
              <div class="text-[10px] text-slate-400">${req.tool?.category || 'Herramientas'}</div>
            </div>
          </td>
          <td class="py-3.5 px-4 text-slate-600">
            <div>${req.dates || '13 oct - 16 oct 2026'}</div>
            <div class="text-[10px] text-slate-400">${req.days || 3} días</div>
          </td>
          <td class="py-3.5 px-4 font-black text-slate-900 font-display">
            ${formatCurrency(req.total)}
          </td>
          <td class="py-3.5 px-4">
            ${getRentalStatusBadge(req.status)}
          </td>
          <td class="py-3.5 px-4 text-right space-x-1.5">
            ${isPending ? `
              <button class="btn-confirm-action px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#ea580c] hover:bg-[#c2410c] text-white shadow-sm" data-id="${req.id}">
                Confirmar
              </button>
              <button class="btn-reject-action px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 text-slate-600 hover:bg-slate-100" data-id="${req.id}">
                Rechazar
              </button>
            ` : ''}

            ${isConfirmed ? `
              <button class="btn-dispatch-action px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#ea580c] hover:bg-[#c2410c] text-white shadow-sm" data-id="${req.id}">
                Registrar entrega
              </button>
            ` : ''}

            ${isInProgress ? `
              <button class="btn-return-action px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#ea580c] hover:bg-[#c2410c] text-white shadow-sm" data-id="${req.id}">
                Registrar devolución
              </button>
            ` : ''}

            ${!isPending && !isConfirmed && !isInProgress ? `
              <button class="btn-view-detail px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50" data-id="${req.id}">
                Ver detalle
              </button>
            ` : ''}
          </td>
        </tr>
      `;
    }).join('');

    // Actions
    tbody.querySelectorAll('.btn-confirm-action').forEach(b => {
      b.addEventListener('click', async () => {
        await api.patch(`/rentals/${b.dataset.id}/confirm`);
        showToast('Solicitud confirmada exitosamente', 'success');
        loadRequests();
      });
    });

    tbody.querySelectorAll('.btn-reject-action').forEach(b => {
      b.addEventListener('click', async () => {
        await api.patch(`/rentals/${b.dataset.id}/cancel`);
        showToast('Solicitud rechazada', 'info');
        loadRequests();
      });
    });

    tbody.querySelectorAll('.btn-dispatch-action').forEach(b => {
      b.addEventListener('click', async () => {
        await api.patch(`/rentals/${b.dataset.id}/start`);
        showToast('Entrega registrada: Estado "En curso"', 'success');
        loadRequests();
      });
    });

    tbody.querySelectorAll('.btn-return-action').forEach(b => {
      b.addEventListener('click', () => {
        const req = requests.find(r => r.id === b.dataset.id);
        openReturnInspectionModal(req);
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
      showToast('Devolución completada exitosamente', 'success');
      modal.close();
      loadRequests();
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
  container.querySelector('#btn-open-new-tool-drawer')?.addEventListener('click', () => {
    openNewToolModal();
  });

  function openNewToolModal() {
    const content = document.createElement('div');
    content.className = 'space-y-4 text-xs';

    content.innerHTML = `
      <form id="drawer-tool-form" class="space-y-4">
        <div>
          <label class="block font-bold text-slate-700 mb-1">Nombre *</label>
          <input type="text" id="dt-name" required class="input-field" placeholder="Ej: Martillo demoledor 10 kg" />
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">Categoría *</label>
          <select id="dt-category" class="input-field" required>
            <option value="cat-electricas">Herramientas eléctricas</option>
            <option value="cat-manuales">Herramientas manuales</option>
            <option value="cat-compactacion">Equipos de compactación</option>
            <option value="cat-pesada">Maquinaria pesada</option>
            <option value="cat-andamios">Andamios y formaletas</option>
          </select>
        </div>

        <div>
          <label class="block font-bold text-slate-700 mb-1">Descripción *</label>
          <textarea id="dt-desc" rows="3" required class="input-field" placeholder="Describe la herramienta, sus usos y características..."></textarea>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-bold text-slate-700 mb-1">Precio diario *</label>
            <input type="number" id="dt-price" required class="input-field" placeholder="$ 0" value="85000" />
          </div>
          <div>
            <label class="block font-bold text-slate-700 mb-1">Estado *</label>
            <select id="dt-status" class="input-field">
              <option value="AVAILABLE" selected>Disponible</option>
              <option value="RENTED">Alquilada</option>
              <option value="MAINTENANCE">Mantenimiento</option>
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
          <button type="button" class="text-xs text-[#ea580c] font-semibold hover:underline flex items-center gap-1 pt-1">
            + Agregar especificación
          </button>
        </div>

        <div class="pt-2">
          <button type="submit" class="btn-primary w-full !py-2.5">
            Guardar herramienta
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

      await api.post('/tools', {
        name,
        categoryId: category,
        dailyPrice: price,
        description: desc
      });

      showToast('Herramienta guardada con éxito en el catálogo', 'success');
      modal.close();
      loadRequests();
    });

    modal.open({
      title: `${renderIcon('Plus', 'w-5 h-5 text-[#ea580c]')} Nueva herramienta`,
      content: content,
      maxWidth: 'max-w-md',
    });
  }
}
