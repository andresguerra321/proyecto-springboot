import api from '../api/client.js';
import auth from '../auth/state.js';
import showToast from '../components/toast.js';
import modal from '../components/modal.js';
import { formatCurrency, formatDate, getToolStatusBadge, getRentalStatusBadge } from '../utils/formatters.js';
import { renderIcon } from '../utils/icons.js';
import { openAuthModal } from '../components/auth-modal.js';

export async function renderProviderDashboard() {
  const container = document.getElementById('app-content');
  if (!container) return;

  if (!auth.isAuthenticated()) {
    container.innerHTML = `
      <section class="max-w-4xl mx-auto px-4 py-20 text-center">
        <div class="glass-card p-10 max-w-lg mx-auto space-y-4">
          <div class="w-14 h-14 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
            ${renderIcon('Lock', 'w-7 h-7')}
          </div>
          <h2 class="text-xl font-bold text-white font-display">Acceso a Portal de Proveedores</h2>
          <p class="text-xs text-slate-400">Inicia sesión con tu cuenta de empresa proveedora para gestionar tu inventario y reservas.</p>
          <button id="btn-login-provider" class="btn-primary w-full !py-2.5 text-xs">
            ${renderIcon('LogIn', 'w-4 h-4')} Iniciar Sesión como Proveedor
          </button>
        </div>
      </section>
    `;
    container.querySelector('#btn-login-provider')?.addEventListener('click', () => openAuthModal('login'));
    return;
  }

  const user = auth.getUser();
  const providerId = user.profile?.id || user.id;

  container.innerHTML = `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 space-y-8">
      
      <!-- Provider Header -->
      <div class="glass-card p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold mb-2">
            ${renderIcon('Truck', 'w-3.5 h-3.5')} Portal Empresa Proveedora
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-white font-display">
            Panel de Operaciones y Maquinaria
          </h1>
          <p class="text-xs text-slate-400 mt-1">
            Empresa: <strong class="text-slate-200">${user.profile?.companyName || user.username}</strong> · ID: <span class="font-mono text-slate-400">${providerId.substring(0, 8)}</span>
          </p>
        </div>

        <button id="btn-add-tool-modal" class="btn-primary !py-2.5 text-xs">
          ${renderIcon('PlusCircle', 'w-4 h-4')} Publicar Nueva Herramienta
        </button>
      </div>

      <!-- 4 KPIs Cards Container -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="provider-kpis-grid">
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
        <div class="flex border-b border-slate-800 bg-slate-900/60 px-6 pt-3">
          <button id="tab-inventory-btn" class="px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 border-brand-500 text-brand-400 flex items-center gap-2 transition-all">
            ${renderIcon('Wrench', 'w-4 h-4')} Mi Inventario de Equipos
          </button>
          <button id="tab-requests-btn" class="px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 border-transparent text-slate-400 hover:text-white flex items-center gap-2 transition-all">
            ${renderIcon('Inbox', 'w-4 h-4')} Solicitudes de Alquiler
          </button>
        </div>

        <!-- Tab Content View Container -->
        <div class="p-6" id="provider-tab-content">
          <!-- Dynamically Loaded -->
        </div>
      </div>

    </section>
  `;

  // Attach KPI loader and Tab switcher
  await loadKpis();
  renderInventoryTab();

  container.querySelector('#btn-add-tool-modal')?.addEventListener('click', () => openCreateToolModal());

  const invTabBtn = container.querySelector('#tab-inventory-btn');
  const reqTabBtn = container.querySelector('#tab-requests-btn');

  invTabBtn.addEventListener('click', () => {
    invTabBtn.className = 'px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 border-brand-500 text-brand-400 flex items-center gap-2 transition-all';
    reqTabBtn.className = 'px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 border-transparent text-slate-400 hover:text-white flex items-center gap-2 transition-all';
    renderInventoryTab();
  });

  reqTabBtn.addEventListener('click', () => {
    reqTabBtn.className = 'px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 border-brand-500 text-brand-400 flex items-center gap-2 transition-all';
    invTabBtn.className = 'px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 border-transparent text-slate-400 hover:text-white flex items-center gap-2 transition-all';
    renderRequestsTab();
  });

  async function loadKpis() {
    const kpiGrid = container.querySelector('#provider-kpis-grid');
    try {
      const kpis = await api.get(`/reporting/provider/${providerId}`);
      kpiGrid.innerHTML = `
        <div class="glass-card p-5 relative overflow-hidden border-slate-800">
          <div class="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Herramientas</span>
            ${renderIcon('Wrench', 'w-4 h-4 text-brand-400')}
          </div>
          <div class="text-2xl font-black text-white font-display mt-2">${kpis.totalTools || 0}</div>
          <div class="text-[11px] text-slate-500 mt-1">En catálogo registrado</div>
        </div>

        <div class="glass-card p-5 relative overflow-hidden border-slate-800">
          <div class="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>En Alquiler Activo</span>
            ${renderIcon('Clock', 'w-4 h-4 text-blue-400')}
          </div>
          <div class="text-2xl font-black text-blue-400 font-display mt-2">${kpis.rentedTools || 0}</div>
          <div class="text-[11px] text-slate-500 mt-1">Equipos en obra</div>
        </div>

        <div class="glass-card p-5 relative overflow-hidden border-slate-800">
          <div class="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Ganancias Brutas</span>
            ${renderIcon('DollarSign', 'w-4 h-4 text-emerald-400')}
          </div>
          <div class="text-2xl font-black text-emerald-400 font-display mt-2">${formatCurrency(kpis.totalEarnings || 0)}</div>
          <div class="text-[11px] text-slate-500 mt-1">Facturación acumulada</div>
        </div>

        <div class="glass-card p-5 relative overflow-hidden border-slate-800">
          <div class="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Pendientes por Confirmar</span>
            ${renderIcon('AlertCircle', 'w-4 h-4 text-amber-400')}
          </div>
          <div class="text-2xl font-black text-amber-400 font-display mt-2">${kpis.pendingRentals || 0}</div>
          <div class="text-[11px] text-slate-500 mt-1">Requieren tu aprobación</div>
        </div>
      `;
    } catch (e) {
      console.warn('Could not load provider KPIs', e);
    }
  }

  async function renderInventoryTab() {
    const tabContent = container.querySelector('#provider-tab-content');
    tabContent.innerHTML = `
      <div class="py-10 text-center text-slate-400">
        ${renderIcon('Loader2', 'w-6 h-6 animate-spin mx-auto text-brand-400 mb-2')}
        <p class="text-xs">Cargando inventario de herramientas...</p>
      </div>
    `;

    try {
      const tools = await api.get('/tools', { providerId: providerId });

      if (!tools || tools.length === 0) {
        tabContent.innerHTML = `
          <div class="py-12 text-center space-y-3">
            <div class="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mx-auto">
              ${renderIcon('PackageX', 'w-6 h-6')}
            </div>
            <h4 class="text-sm font-bold text-white">No tienes herramientas registradas todavía</h4>
            <p class="text-xs text-slate-400">Comienza publicando tu maquinaria para que los clientes de la plataforma puedan alquilarla.</p>
            <button id="tab-btn-add-tool" class="btn-primary !py-2 text-xs inline-flex">
              ${renderIcon('Plus', 'w-3.5 h-3.5')} Publicar Mi Primera Herramienta
            </button>
          </div>
        `;
        tabContent.querySelector('#tab-btn-add-tool')?.addEventListener('click', () => openCreateToolModal());
        return;
      }

      tabContent.innerHTML = `
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800 bg-slate-900/40">
              <tr>
                <th class="py-3 px-4">Herramienta</th>
                <th class="py-3 px-4">Marca / Modelo</th>
                <th class="py-3 px-4">Tarifa Diaria</th>
                <th class="py-3 px-4">Estado</th>
                <th class="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              ${tools.map(tool => {
                const img = tool.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=100';
                return `
                  <tr class="hover:bg-slate-900/40 transition-colors">
                    <td class="py-3.5 px-4 flex items-center gap-3">
                      <img src="${img}" class="w-10 h-10 rounded-lg object-cover bg-slate-800 border border-slate-700" />
                      <div>
                        <div class="font-bold text-white text-sm">${tool.name}</div>
                        <div class="text-[11px] text-slate-400 font-mono">S/N: ${tool.serialNumber || 'N/A'}</div>
                      </div>
                    </td>
                    <td class="py-3.5 px-4 text-slate-300">
                      ${tool.brand || '—'} <span class="text-slate-500">·</span> ${tool.model || '—'}
                    </td>
                    <td class="py-3.5 px-4 font-semibold text-brand-400 font-display">
                      ${formatCurrency(tool.dailyPrice)}
                    </td>
                    <td class="py-3.5 px-4">
                      ${getToolStatusBadge(tool.status)}
                    </td>
                    <td class="py-3.5 px-4 text-right space-x-1">
                      <button class="btn-upload-img p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-brand-400 hover:bg-slate-700" data-tool-id="${tool.id}" title="Subir Foto">
                        ${renderIcon('ImagePlus', 'w-4 h-4')}
                      </button>
                      <button class="btn-delete-tool p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white" data-tool-id="${tool.id}" title="Eliminar Herramienta">
                        ${renderIcon('Trash2', 'w-4 h-4')}
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;

      // Upload and Delete handlers
      tabContent.querySelectorAll('.btn-upload-img').forEach(btn => {
        btn.addEventListener('click', () => openImageUploadModal(btn.dataset.toolId));
      });

      tabContent.querySelectorAll('.btn-delete-tool').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('¿Seguro que deseas eliminar esta herramienta del catálogo?')) return;
          try {
            await api.delete(`/tools/${btn.dataset.toolId}`);
            showToast('Herramienta eliminada exitosamente', 'success');
            renderInventoryTab();
            loadKpis();
          } catch (e) {
            showToast(e.message || 'No se pudo eliminar la herramienta', 'error');
          }
        });
      });

    } catch (err) {
      tabContent.innerHTML = `<div class="p-6 text-center text-rose-400 text-xs">${err.message}</div>`;
    }
  }

  async function renderRequestsTab() {
    const tabContent = container.querySelector('#provider-tab-content');
    tabContent.innerHTML = `
      <div class="py-10 text-center text-slate-400">
        ${renderIcon('Loader2', 'w-6 h-6 animate-spin mx-auto text-brand-400 mb-2')}
        <p class="text-xs">Cargando solicitudes de alquiler...</p>
      </div>
    `;

    try {
      const rentals = await api.get(`/rentals/provider/${providerId}`);

      if (!rentals || rentals.length === 0) {
        tabContent.innerHTML = `
          <div class="py-12 text-center text-slate-400 space-y-2">
            ${renderIcon('Inbox', 'w-8 h-8 mx-auto text-slate-500')}
            <h4 class="text-sm font-bold text-white">No tienes solicitudes pendientes de tus equipos</h4>
            <p class="text-xs">Cuando un cliente reserve tus herramientas, aparecerá aquí para que puedas gestionarla.</p>
          </div>
        `;
        return;
      }

      tabContent.innerHTML = `
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800 bg-slate-900/40">
              <tr>
                <th class="py-3 px-4">Código / Fechas</th>
                <th class="py-3 px-4">Equipos Solicitados</th>
                <th class="py-3 px-4">Monto</th>
                <th class="py-3 px-4">Estado</th>
                <th class="py-3 px-4 text-right">Flujo de Alquiler</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800">
              ${rentals.map(rental => {
                const items = rental.items || [];
                const isPending = rental.status === 'PENDING';
                const isConfirmed = rental.status === 'CONFIRMED';
                const isInProgress = rental.status === 'IN_PROGRESS';

                return `
                  <tr class="hover:bg-slate-900/40 transition-colors">
                    <td class="py-3.5 px-4">
                      <span class="font-mono text-xs font-semibold text-white">#${rental.id.substring(0, 8)}</span>
                      <div class="text-[11px] text-slate-400 mt-0.5">
                        ${formatDate(rental.startDate)} al ${formatDate(rental.endDate)}
                      </div>
                    </td>
                    <td class="py-3.5 px-4 text-slate-300">
                      ${items.map(i => `<div class="font-medium">${i.toolName || 'Herramienta'}</div>`).join('')}
                    </td>
                    <td class="py-3.5 px-4 font-bold text-white font-display">
                      ${formatCurrency(rental.totalAmount)}
                    </td>
                    <td class="py-3.5 px-4">
                      ${getRentalStatusBadge(rental.status)}
                    </td>
                    <td class="py-3.5 px-4 text-right space-x-1.5">
                      ${isPending ? `
                        <button class="btn-confirm-rental btn-success !py-1.5 !px-2.5 text-xs" data-rental-id="${rental.id}">
                          ${renderIcon('CheckCircle', 'w-3.5 h-3.5')} Aprobar
                        </button>
                      ` : ''}

                      ${isConfirmed ? `
                        <button class="btn-start-rental btn-primary !py-1.5 !px-2.5 text-xs" data-rental-id="${rental.id}">
                          ${renderIcon('Truck', 'w-3.5 h-3.5')} Entregar en Obra
                        </button>
                      ` : ''}

                      ${isInProgress ? `
                        <button class="btn-return-inspection btn-outline !py-1.5 !px-2.5 text-xs text-amber-400 border-amber-500/40 hover:bg-amber-500/10" data-rental-id="${rental.id}" data-tool-id="${items[0]?.toolId || ''}">
                          ${renderIcon('ClipboardCheck', 'w-3.5 h-3.5')} Recibir Devolución
                        </button>
                      ` : ''}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;

      // Handlers for rental lifecycle
      tabContent.querySelectorAll('.btn-confirm-rental').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await api.patch(`/rentals/${btn.dataset.rentalId}/confirm`);
            showToast('Alquiler confirmado con éxito', 'success');
            renderRequestsTab();
            loadKpis();
          } catch (e) {
            showToast(e.message || 'Error al confirmar', 'error');
          }
        });
      });

      tabContent.querySelectorAll('.btn-start-rental').forEach(btn => {
        btn.addEventListener('click', async () => {
          try {
            await api.patch(`/rentals/${btn.dataset.rentalId}/start`);
            showToast('Equipo despachado: Estado IN_PROGRESS', 'success');
            renderRequestsTab();
            loadKpis();
          } catch (e) {
            showToast(e.message || 'Error al iniciar entrega', 'error');
          }
        });
      });

      tabContent.querySelectorAll('.btn-return-inspection').forEach(btn => {
        btn.addEventListener('click', () => {
          openInspectionModal(btn.dataset.rentalId, btn.dataset.toolId);
        });
      });

    } catch (err) {
      tabContent.innerHTML = `<div class="p-6 text-center text-rose-400 text-xs">${err.message}</div>`;
    }
  }

  /**
   * Modal: Return & Inspection with Damage Report (4NF)
   */
  function openInspectionModal(rentalId, toolId) {
    const content = document.createElement('div');
    content.className = 'space-y-4';

    content.innerHTML = `
      <form id="inspection-form" class="space-y-4 text-xs">
        <div>
          <label class="block font-medium text-slate-300 mb-1">Notas Generales de la Inspección de Devolución</label>
          <textarea id="insp-notes" class="input-field h-20" placeholder="Inspección visual del motor, sistema hidráulico y cableado..." required>Equipo recibido de vuelta del cliente sin incidencias estructurales mayores.</textarea>
        </div>

        <div class="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <label class="flex items-center gap-2 cursor-pointer font-semibold text-slate-200">
            <input type="checkbox" id="has-damages-checkbox" class="text-brand-500 rounded focus:ring-brand-500" />
            <span>¿El equipo presenta averías, roturas o requiere taller? (Reportar Daño)</span>
          </label>

          <div id="damage-fields" class="hidden space-y-3 pt-2 border-t border-slate-800">
            <div>
              <label class="block text-slate-400 mb-1">Descripción del Daño</label>
              <input type="text" id="damage-desc" class="input-field" placeholder="Carcasa fisurada, falta cable de potencia..." />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-slate-400 mb-1">Costo Estimado de Reparación</label>
                <input type="number" id="damage-cost" class="input-field" placeholder="50.00" value="75.00" />
              </div>
              <div>
                <label class="block text-slate-400 mb-1">Severidad</label>
                <select id="damage-severity" class="input-field">
                  <option value="MINOR">Leve (Minor)</option>
                  <option value="MODERATE" selected>Moderado (Moderate)</option>
                  <option value="SEVERE">Grave / Pérdida Total (Severe)</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-slate-400 mb-1">Cambiar Estado del Equipo a:</label>
              <select id="damage-tool-status" class="input-field">
                <option value="MAINTENANCE" selected>En Taller / Mantenimiento (MAINTENANCE)</option>
                <option value="RETIRED">Retirada Definitiva (RETIRED)</option>
              </select>
            </div>
          </div>
        </div>

        <button type="submit" id="btn-submit-inspection" class="btn-primary w-full !py-2.5">
          ${renderIcon('CheckCheck', 'w-4 h-4')} Registrar Inspección y Cerrar Alquiler
        </button>
      </form>
    `;

    const chk = content.querySelector('#has-damages-checkbox');
    const dmgFields = content.querySelector('#damage-fields');
    chk.addEventListener('change', () => {
      dmgFields.classList.toggle('hidden', !chk.checked);
    });

    content.querySelector('#inspection-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = content.querySelector('#btn-submit-inspection');
      btn.disabled = true;
      btn.innerHTML = `${renderIcon('Loader2', 'w-4 h-4 animate-spin inline mr-1')} Guardando...`;

      try {
        const inspectorId = user.id;
        const notes = content.querySelector('#insp-notes').value;

        // 1. Register inspection
        const insp = await api.post('/inspections', {
          rentalId,
          inspectorId,
          type: 'RETURN',
          notes,
        });

        // 2. If damage reported
        if (chk.checked && toolId) {
          const desc = content.querySelector('#damage-desc').value;
          const cost = parseFloat(content.querySelector('#damage-cost').value) || 0;
          const severity = content.querySelector('#damage-severity').value;
          const newStatus = content.querySelector('#damage-tool-status').value;

          await api.post(`/inspections/${insp.id}/damages`, {
            toolId,
            description: desc,
            repairCost: cost,
            severity,
            newToolStatus: newStatus,
          });
        }

        // 3. Complete rental
        await api.patch(`/rentals/${rentalId}/complete`);

        showToast('Devolución e inspección registradas correctamente', 'success');
        modal.close();
        renderRequestsTab();
        loadKpis();
      } catch (err) {
        showToast(err.message || 'Error al registrar la inspección', 'error');
        btn.disabled = false;
        btn.innerHTML = 'Registrar Inspección y Cerrar Alquiler';
      }
    });

    modal.open({
      title: `${renderIcon('ClipboardCheck', 'w-5 h-5 text-brand-400')} Acta de Inspección y Recepción`,
      content: content,
      maxWidth: 'max-w-md',
    });
  }

  /**
   * Modal: Create Tool
   */
  async function openCreateToolModal() {
    const categories = await api.get('/tools/categories').catch(() => []);
    const content = document.createElement('div');
    content.className = 'space-y-4';

    content.innerHTML = `
      <form id="create-tool-form" class="space-y-3 text-xs">
        <div>
          <label class="block font-medium text-slate-300 mb-1">Nombre del Equipo</label>
          <input type="text" id="tool-name" required class="input-field" placeholder="ej: Compresor Neumático de Aire 185 CFM" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-medium text-slate-300 mb-1">Categoría</label>
            <select id="tool-category" class="input-field" required>
              ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block font-medium text-slate-300 mb-1">Marca</label>
            <input type="text" id="tool-brand" required class="input-field" placeholder="ej: Ingersoll Rand" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-medium text-slate-300 mb-1">Modelo</label>
            <input type="text" id="tool-model" required class="input-field" placeholder="ej: P185WDO" />
          </div>
          <div>
            <label class="block font-medium text-slate-300 mb-1">Número de Serie</label>
            <input type="text" id="tool-serial" required class="input-field" placeholder="ej: IR-88941-B" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-medium text-slate-300 mb-1">Tarifa Diaria (USD/COP)</label>
            <input type="number" id="tool-price" step="0.01" required class="input-field" placeholder="45.00" />
          </div>
          <div>
            <label class="block font-medium text-slate-300 mb-1">Valor de Reposición</label>
            <input type="number" id="tool-rep-value" step="0.01" required class="input-field" placeholder="3500.00" />
          </div>
        </div>

        <div>
          <label class="block font-medium text-slate-300 mb-1">URL de Imagen Principal</label>
          <input type="url" id="tool-img-url" class="input-field" placeholder="https://images.unsplash.com/..." value="https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800" />
        </div>

        <div>
          <label class="block font-medium text-slate-300 mb-1">Descripción del Equipo</label>
          <textarea id="tool-desc" rows="3" class="input-field" placeholder="Detalles de rendimiento, capacidad de trabajo y condiciones de uso..."></textarea>
        </div>

        <button type="submit" id="btn-save-tool" class="btn-primary w-full !py-2.5 mt-2">
          ${renderIcon('PlusCircle', 'w-4 h-4')} Registrar Herramienta
        </button>
      </form>
    `;

    content.querySelector('#create-tool-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = content.querySelector('#btn-save-tool');
      btn.disabled = true;

      try {
        const payload = {
          providerId: providerId,
          categoryId: content.querySelector('#tool-category').value,
          name: content.querySelector('#tool-name').value.trim(),
          brand: content.querySelector('#tool-brand').value.trim(),
          model: content.querySelector('#tool-model').value.trim(),
          serialNumber: content.querySelector('#tool-serial').value.trim(),
          dailyPrice: parseFloat(content.querySelector('#tool-price').value),
          replacementValue: parseFloat(content.querySelector('#tool-rep-value').value),
          description: content.querySelector('#tool-desc').value.trim(),
          images: [
            {
              imageUrl: content.querySelector('#tool-img-url').value.trim(),
              isPrimary: true
            }
          ]
        };

        await api.post('/tools', payload);
        showToast('Herramienta registrada exitosamente', 'success');
        modal.close();
        renderInventoryTab();
        loadKpis();
      } catch (err) {
        showToast(err.message || 'Error al crear herramienta', 'error');
        btn.disabled = false;
      }
    });

    modal.open({
      title: `${renderIcon('Wrench', 'w-5 h-5 text-brand-400')} Registrar Nueva Herramienta`,
      content: content,
      maxWidth: 'max-w-md',
    });
  }

  /**
   * Modal: Upload Photo
   */
  function openImageUploadModal(toolId) {
    const content = document.createElement('div');
    content.className = 'space-y-4 text-xs';

    content.innerHTML = `
      <form id="upload-img-form" class="space-y-4">
        <div>
          <label class="block text-slate-300 font-medium mb-1">Opción A: Subir Archivo de Imagen desde tu Dispositivo</label>
          <input type="file" id="file-upload-input" accept="image/*" class="input-field file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-500 file:text-slate-950 hover:file:bg-brand-400 cursor-pointer" />
        </div>

        <div class="relative flex py-2 items-center">
          <div class="flex-grow border-t border-slate-800"></div>
          <span class="flex-shrink mx-4 text-slate-500 font-semibold">O TAMBIÉN</span>
          <div class="flex-grow border-t border-slate-800"></div>
        </div>

        <div>
          <label class="block text-slate-300 font-medium mb-1">Opción B: Pegar Enlace URL Directo</label>
          <input type="url" id="url-upload-input" class="input-field" placeholder="https://images.unsplash.com/..." />
        </div>

        <button type="submit" id="btn-save-img" class="btn-primary w-full !py-2.5">
          ${renderIcon('UploadCloud', 'w-4 h-4')} Guardar Imagen
        </button>
      </form>
    `;

    content.querySelector('#upload-img-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fileInput = content.querySelector('#file-upload-input');
      const urlInput = content.querySelector('#url-upload-input');
      const btn = content.querySelector('#btn-save-img');
      btn.disabled = true;

      try {
        if (fileInput.files.length > 0) {
          // Multipart upload to /tools/{id}/images/upload
          const file = fileInput.files[0];
          await api.upload(`/tools/${toolId}/images/upload`, file);
          showToast('Foto subida con éxito al servidor', 'success');
        } else if (urlInput.value.trim()) {
          // URL association to /tools/{id}/images
          await api.post(`/tools/${toolId}/images`, {
            imageUrl: urlInput.value.trim(),
            isPrimary: false
          });
          showToast('Enlace de foto guardado con éxito', 'success');
        } else {
          showToast('Por favor selecciona un archivo o escribe una URL', 'warning');
          btn.disabled = false;
          return;
        }

        modal.close();
        renderInventoryTab();
      } catch (err) {
        showToast(err.message || 'Error al subir imagen', 'error');
        btn.disabled = false;
      }
    });

    modal.open({
      title: `${renderIcon('ImagePlus', 'w-5 h-5 text-brand-400')} Asociar Fotografía a la Herramienta`,
      content: content,
      maxWidth: 'max-w-md',
    });
  }
}
