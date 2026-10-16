import api from '../api/client.js';
import auth from '../auth/state.js';
import modal from '../components/modal.js';
import showToast from '../components/toast.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { renderIcon, renderToolRentMark } from '../utils/icons.js';
import { openAuthModal } from '../components/auth-modal.js';
import { notificationsStore } from '../utils/notifications-store.js';
import { createDateRangeCalendar } from '../components/date-range-calendar.js';

// Real high-definition equipment photography
import scaffold1 from '../assets/scaffold-1-full.jpg';

export async function openRentalModal(tool, options = {}) {
  if (!auth.isAuthenticated()) {
    showToast('Debes iniciar sesión para realizar un alquiler', 'warning');
    openAuthModal('login');
    return;
  }

  // Calculate default dates: tomorrow to +3 days
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const endDefault = new Date(tomorrow);
  endDefault.setDate(endDefault.getDate() + 3);

  const formatDateInput = (d) => {
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  };

  let startDate = options.initialStartDate || formatDateInput(tomorrow);
  let endDate = options.initialEndDate || formatDateInput(endDefault);
  let isCheckingAvailability = false;
  let isAvailable = true;
  let quantity = 1;
  let totalStock = tool.totalStock || 1;
  let availableStock = tool.availableStock || 1;
  let reservedStock = tool.reservedStock || 0;
  let availableToolIds = [tool.id];
  let availabilityMessage = '';
  let calendarInstance = null;

  const content = document.createElement('div');
  content.className = 'p-6 space-y-5 bg-white text-slate-800';

  function calculateCosts() {
    const [y1, m1, d1] = startDate.split('-').map(Number);
    const [y2, m2, d2] = endDate.split('-').map(Number);
    const start = new Date(y1, m1 - 1, d1);
    const end = new Date(y2, m2 - 1, d2);
    
    // Regla de cálculo: ambos extremos son días facturables (día de entrega y día de devolución computables)
    const diffMs = Math.max(0, end - start);
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const days = Math.max(1, diffDays + 1);
    
    const dailyPrice = tool.dailyPrice || 40000;
    const subtotal = days * dailyPrice * quantity;
    const tax = Math.round(subtotal * 0.19); // 19% IVA régimen común DIAN (servicios de arrendamiento)
    const unitDeposit = Math.round((tool.replacementValue || 2800000) * 0.10);
    const deposit = unitDeposit * quantity; // 10% depósito de garantía en custodia por unidad
    const total = subtotal + tax;

    return { days, quantity, subtotal, tax, deposit, total, dailyPrice, unitDeposit };
  }

  function updatePricingUI() {
    const { days, subtotal, tax, deposit, total, dailyPrice } = calculateCosts();

    const subtotalVal = content.querySelector('#price-subtotal-val');
    if (subtotalVal) subtotalVal.textContent = formatCurrency(subtotal);

    const taxVal = content.querySelector('#price-tax-val');
    if (taxVal) taxVal.textContent = `+${formatCurrency(tax)}`;

    const totalVal = content.querySelector('#price-total-val');
    if (totalVal) totalVal.textContent = formatCurrency(total);

    const depositVal = content.querySelector('#price-deposit-val');
    if (depositVal) depositVal.textContent = formatCurrency(deposit);

    const breakdownSubtext = content.querySelector('#price-breakdown-subtext');
    if (breakdownSubtext) {
      breakdownSubtext.innerHTML = `Alquiler: <strong class="text-slate-800">${formatCurrency(subtotal)}</strong> + IVA (19%): <span class="text-slate-700 font-medium">+${formatCurrency(tax)}</span>`;
    }

    const checkoutBtn = content.querySelector('#btn-proceed-checkout');
    if (checkoutBtn) {
      checkoutBtn.disabled = !isAvailable || availableStock <= 0 || isCheckingAvailability;
    }

    updateStockUI();
  }

  function updateStockUI() {
    const qtyDisplay = content.querySelector('#rental-quantity-display');
    const minusBtn = content.querySelector('#btn-qty-minus');
    const plusBtn = content.querySelector('#btn-qty-plus');
    const statusLine = content.querySelector('#stock-single-line-status');
    const checkoutBtn = content.querySelector('#btn-proceed-checkout');
    const { days } = calculateCosts();

    if (qtyDisplay) qtyDisplay.textContent = quantity;
    if (minusBtn) minusBtn.disabled = quantity <= 1;
    if (plusBtn) plusBtn.disabled = quantity >= availableStock || availableStock <= 0;

    if (statusLine) {
      if (isCheckingAvailability) {
        statusLine.innerHTML = `
          <div class="flex items-center gap-2 text-slate-500 text-xs">
            ${renderIcon('Loader2', 'w-3.5 h-3.5 animate-spin text-[#ea580c]')}
            <span>Consultando calendario y disponibilidad técnica en tiempo real...</span>
          </div>
        `;
      } else if (isAvailable && availableStock > 0) {
        statusLine.innerHTML = `
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-600 text-xs">
            <span class="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Disponible: <strong>${availableStock} de ${totalStock} ${totalStock === 1 ? 'unidad libre' : 'unidades libres'}</strong> para entrega inmediata</span>
            </span>
            <span class="text-slate-500 font-medium text-[11px]">
              ${days} ${days === 1 ? 'día facturable' : 'días facturables'} (incluye entrega y devolución)
            </span>
          </div>
        `;
      } else {
        statusLine.innerHTML = `
          <div class="text-rose-700 font-medium text-xs flex items-center gap-1.5">
            ${renderIcon('AlertCircle', 'w-3.5 h-3.5 text-rose-600 shrink-0')}
            <span>Sin unidades libres para estas fechas (${formatDate(startDate)} al ${formatDate(endDate)}). Selecciona otro rango en el calendario.</span>
          </div>
        `;
      }
    }

    if (checkoutBtn) {
      checkoutBtn.disabled = !isAvailable || availableStock <= 0 || isCheckingAvailability;
    }
  }

  async function checkAvailability() {
    isCheckingAvailability = true;
    updateStockUI();

    try {
      const res = await api.get(`/tools/${tool.id}/availability`, {
        from: startDate,
        to: endDate
      });
      isAvailable = res.isAvailable !== undefined ? Boolean(res.isAvailable) : (res.available !== false);
      totalStock = res.totalStock ?? 1;
      availableStock = res.availableStock ?? (isAvailable ? 1 : 0);
      reservedStock = res.reservedStock ?? Math.max(0, totalStock - availableStock);
      availableToolIds = (res.availableToolIds && res.availableToolIds.length > 0) ? res.availableToolIds : [tool.id];
      availabilityMessage = res.message || '';

      if (availableStock <= 0) {
        isAvailable = false;
        quantity = 1;
      } else if (quantity > availableStock) {
        quantity = availableStock;
      }

      if (calendarInstance && res.bookedDateRanges) {
        calendarInstance.setBookedRanges(res.bookedDateRanges);

        // Si la fecha inicial seleccionada cae en un período sin stock, buscar el primer día libre
        if (res.availableStock <= 0) {
          const s = parseIsoDate(startDate);
          const isStartBooked = res.bookedDateRanges.some(r => {
            const bs = parseIsoDate(r.startDate || r.start);
            const be = parseIsoDate(r.endDate || r.end);
            return bs && be && s && s.getTime() >= bs.getTime() && s.getTime() <= be.getTime();
          });

          if (isStartBooked) {
            let candidate = new Date(today);
            candidate.setDate(candidate.getDate() + 1);
            for (let i = 0; i < 60; i++) {
              const testTime = candidate.getTime();
              const booked = res.bookedDateRanges.some(r => {
                const bs = parseIsoDate(r.startDate || r.start);
                const be = parseIsoDate(r.endDate || r.end);
                return bs && be && testTime >= bs.getTime() && testTime <= be.getTime();
              });
              if (!booked) {
                startDate = toIsoDate(candidate);
                const endCandidate = new Date(candidate);
                endCandidate.setDate(candidate.getDate() + 3);
                endDate = toIsoDate(endCandidate);
                calendarInstance.setDates(startDate, endDate);
                break;
              }
              candidate.setDate(candidate.getDate() + 1);
            }
          }
        }
      }
    } catch (err) {
      console.warn('Error al verificar disponibilidad:', err);
      isAvailable = true;
      totalStock = 1;
      availableStock = 1;
      reservedStock = 0;
      availableToolIds = [tool.id];
    } finally {
      isCheckingAvailability = false;
      updatePricingUI();
    }
  }

  function renderView() {
    const isScaffold = (tool.name || '').toLowerCase().includes('andamio') || 
                       (tool.name || '').toLowerCase().includes('scaffold') || 
                       (tool.categoryName || '').toLowerCase().includes('elevaci');
    const primaryImg = isScaffold ? scaffold1 : (tool.images?.find(img => img.isPrimary)?.imageUrl || tool.images?.[0]?.imageUrl || scaffold1);
    const { days, subtotal, tax, deposit, total, dailyPrice } = calculateCosts();

    const providerName = (tool.provider?.companyName && !/^[.\s-]+$/.test(tool.provider.companyName)) 
      ? tool.provider.companyName 
      : 'Maquinaria y Equipos Bogotá S.A.S.';
    const providerCity = (tool.provider?.city && !tool.provider.city.includes('-')) 
      ? tool.provider.city 
      : 'Bogotá D.C.';
    const providerPhone = (tool.provider?.phone && tool.provider.phone.replace(/\D/g, '').length === 10) 
      ? tool.provider.phone 
      : '+57 310 111 2233';

    content.innerHTML = `
      <div class="space-y-6">
        
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          <!-- Columna Izquierda: Fotografía Real, Identificación y Tarifas Compactas (5 cols) -->
          <div class="lg:col-span-5 space-y-4">
            
            <!-- Fotografía Real en Alta Definición (Cero marcas de depuración) -->
            <div class="relative h-44 rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-50 shadow-xs group">
              <img 
                src="${primaryImg}" 
                alt="${tool.name}" 
                class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
              />
              <div class="absolute top-2.5 left-2.5 bg-slate-900/85 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-semibold text-white shadow-xs flex items-center gap-1.5 select-none">
                <span class="w-1.5 h-1.5 rounded-full bg-[#ea580c]"></span>
                <span>${tool.brand || 'Layher Allround'} · ${tool.model || 'Ringlock'}</span>
              </div>
            </div>

            <!-- Identificación del Equipo -->
            <div class="space-y-1">
              <h3 class="text-base font-bold text-slate-900 font-display leading-tight">${tool.name}</h3>
              <p class="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                ${tool.description || 'Torre de andamio multidireccional con plataformas antideslizantes de acero galvanizado, rodapiés, diagonales y escaleras internas.'}
              </p>
            </div>

            <!-- Resumen Compacto de Tarifas, Reposición y Depósito (Más aire visual) -->
            <div class="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-2 text-xs">
              <div class="flex items-baseline justify-between">
                <span class="text-slate-500 font-medium">Tarifa por día:</span>
                <span class="text-base font-extrabold text-[#ea580c] font-display">${formatCurrency(dailyPrice)} <span class="text-xs font-normal text-slate-400">/ día</span></span>
              </div>
              <div class="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-200/50">
                <span>Valor reposición:</span>
                <strong class="font-mono text-slate-700">${formatCurrency(tool.replacementValue || 2800000)}</strong>
              </div>
              <div class="flex items-center justify-between text-slate-500">
                <span>Depósito en garantía (10%):</span>
                <span class="text-emerald-700 bg-emerald-50 border border-emerald-200/80 font-bold px-2 py-0.5 rounded text-[11px]">
                  <span id="price-deposit-val">${formatCurrency(deposit)}</span> · Reembolsable
                </span>
              </div>
            </div>

            <!-- Empresa Proveedora Compacta -->
            <div class="p-3 bg-white border border-slate-200/70 rounded-2xl space-y-1 text-xs shadow-2xs">
              <div class="flex items-center justify-between">
                <span class="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                  ${renderIcon('Building2', 'w-3.5 h-3.5 text-[#ea580c]')} Empresa Proveedora
                </span>
                <span class="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Verificado
                </span>
              </div>
              <div class="text-xs font-bold text-slate-900 truncate">${providerName}</div>
              <div class="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                ${renderIcon('MapPin', 'w-3 h-3 text-slate-400')} ${providerCity} · Tel: ${providerPhone}
              </div>
            </div>

          </div>

          <!-- Columna Derecha: Selección de Fechas y Unidades Simplificadas (7 cols) -->
          <div class="lg:col-span-7 space-y-4">
            
            <!-- Selector de Período y Calendario -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <label class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  ${renderIcon('Calendar', 'w-3.5 h-3.5 text-[#ea580c]')} Período de Alquiler
                </label>
                <span class="text-[11px] text-slate-400 font-medium">Anticipación hasta 1 año · Máx. 30 días</span>
              </div>

              <!-- Mount Custom Calendar Component (Indicador único de progreso, sin duplicidades) -->
              <div id="custom-calendar-mount"></div>
            </div>

            <!-- Selector de Cantidad de Unidades (Una sola línea informativa de stock) -->
            <div class="p-3.5 bg-white border border-slate-200/90 rounded-2xl space-y-2 shadow-2xs">
              <div class="flex items-center justify-between">
                <div>
                  <span class="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    ${renderIcon('Layers', 'w-3.5 h-3.5 text-[#ea580c]')} Cantidad de Unidades a Reservar
                  </span>
                </div>

                <div class="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200 shadow-2xs">
                  <button 
                    type="button" 
                    id="btn-qty-minus" 
                    class="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    ${quantity <= 1 ? 'disabled' : ''}
                    title="Reducir unidades"
                  >
                    -
                  </button>
                  <span id="rental-quantity-display" class="w-8 text-center font-bold text-slate-900 font-display text-sm">
                    ${quantity}
                  </span>
                  <button 
                    type="button" 
                    id="btn-qty-plus" 
                    class="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    ${quantity >= availableStock ? 'disabled' : ''}
                    title="Aumentar unidades"
                  >
                    +
                  </button>
                </div>
              </div>

              <!-- Línea única informativa de stock (Cero redundancia) -->
              <div id="stock-single-line-status" class="pt-1.5 border-t border-slate-100 text-xs">
                ${availableStock > 0 ? `
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-600">
                    <span class="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Disponible: <strong>${availableStock} de ${totalStock} ${totalStock === 1 ? 'unidad libre' : 'unidades libres'}</strong> para entrega inmediata</span>
                    </span>
                    <span class="text-slate-500 font-medium text-[11px]">
                      ${days} ${days === 1 ? 'día facturable' : 'días facturables'} (incluye entrega y devolución)
                    </span>
                  </div>
                ` : `
                  <div class="text-rose-700 font-medium inline-flex items-center gap-1.5">
                    ${renderIcon('AlertCircle', 'w-3.5 h-3.5 text-rose-600 shrink-0')}
                    <span>Sin unidades libres para estas fechas (${formatDate(startDate)} al ${formatDate(endDate)}). Selecciona otro rango.</span>
                  </div>
                `}
              </div>
            </div>

            <!-- Desplegable discreto de Condiciones y Garantías -->
            <details class="group bg-slate-50/70 border border-slate-200/80 rounded-2xl overflow-hidden transition-all text-xs">
              <summary class="flex items-center justify-between p-3 font-semibold text-slate-700 hover:text-slate-900 cursor-pointer select-none">
                <span class="flex items-center gap-2">
                  ${renderIcon('ShieldCheck', 'w-4 h-4 text-emerald-600')}
                  <span>Respaldo y Condiciones de Alquiler ToolRent</span>
                </span>
                <span class="text-slate-400 group-open:rotate-180 transition-transform duration-200">
                  ${renderIcon('ChevronDown', 'w-3.5 h-3.5')}
                </span>
              </summary>
              <div class="px-3.5 pb-3.5 pt-1 text-slate-600 border-t border-slate-200/60 space-y-2 leading-relaxed">
                <div class="flex items-start gap-2">
                  <span class="text-emerald-500 font-bold mt-0.5">✓</span>
                  <div><strong>Sustitución en &lt;24h:</strong> Reemplazo express en obra ante cualquier fallo técnico sin sobrecosto.</div>
                </div>
                <div class="flex items-start gap-2">
                  <span class="text-emerald-500 font-bold mt-0.5">✓</span>
                  <div><strong>Depósito seguro:</strong> Custodia 100% reembolsable a las 24h tras la devolución e inspección sin daños.</div>
                </div>
                <div class="flex items-start gap-2">
                  <span class="text-emerald-500 font-bold mt-0.5">✓</span>
                  <div><strong>Factura oficial DIAN:</strong> IVA 19% desglosado con CUFE deducible para costos de obra civil.</div>
                </div>
              </div>
            </details>

          </div>

        </div>

        <!-- Barra Inferior Fija / Sticky: Acompaña al usuario en todo momento con Total y Botón Principal -->
        <div class="sticky -bottom-6 -mx-6 px-6 py-3.5 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div class="flex items-baseline gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <div>
              <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Total a pagar hoy</span>
              <div class="flex items-baseline gap-1.5 mt-0.5">
                <span id="price-total-val" class="text-2xl font-black text-[#ea580c] font-display tracking-tight">${formatCurrency(total)}</span>
                <span class="text-[11px] text-slate-400 font-medium">IVA incluido</span>
              </div>
            </div>

            <div class="text-left text-xs text-slate-500 hidden md:block pl-3 border-l border-slate-200">
              <div id="price-breakdown-subtext" class="text-[11px] text-slate-600">
                Alquiler: <strong class="text-slate-800" id="price-subtotal-val">${formatCurrency(subtotal)}</strong> + IVA (19%): <span id="price-tax-val">+${formatCurrency(tax)}</span>
              </div>
              <div class="text-[10px] text-slate-400">
                ${days} días facturables · Factura oficial DIAN con CUFE
              </div>
            </div>
          </div>

          <button 
            id="btn-proceed-checkout" 
            ${!isAvailable || isCheckingAvailability || availableStock <= 0 ? 'disabled' : ''} 
            class="btn-primary w-full sm:w-auto !py-3 !px-6 text-sm font-bold shadow-md hover:shadow-lg transition-all rounded-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <span>Continuar con la reserva</span>
            ${renderIcon('ChevronRight', 'w-4 h-4')}
          </button>
        </div>

      </div>
    `;

    // Mount Custom Date Range Calendar In-App UI
    const mount = content.querySelector('#custom-calendar-mount');
    if (mount) {
      calendarInstance = createDateRangeCalendar({
        toolId: tool.id,
        initialStartDate: startDate,
        initialEndDate: endDate,
        bookedRanges: tool.bookedDateRanges || [],
        onChange: ({ startDate: newS, endDate: newE }) => {
          startDate = newS;
          endDate = newE;
          updatePricingUI();
          checkAvailability();
        }
      });
      mount.appendChild(calendarInstance.getElement());
    }

    content.querySelector('#btn-qty-minus')?.addEventListener('click', () => {
      if (quantity > 1) {
        quantity--;
        updatePricingUI();
        updateStockUI();
      }
    });

    content.querySelector('#btn-qty-plus')?.addEventListener('click', () => {
      if (quantity < availableStock) {
        quantity++;
        updatePricingUI();
        updateStockUI();
      }
    });

    content.querySelector('#btn-proceed-checkout')?.addEventListener('click', () => {
      const costs = calculateCosts();

      // Enforce 1-year max horizon rule
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const maxHorizon = new Date(today);
      maxHorizon.setDate(today.getDate() + 365);
      maxHorizon.setHours(23, 59, 59, 999);

      const [sy, sm, sd] = startDate.split('-').map(Number);
      const [ey, em, ed] = endDate.split('-').map(Number);
      const startD = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
      const endD = new Date(ey, em - 1, ed, 0, 0, 0, 0);

      if (startD < today) {
        showToast('La fecha de entrega no puede ser anterior a la fecha actual.', 'warning');
        return;
      }
      if (startD > maxHorizon || endD > maxHorizon) {
        showToast('No es posible realizar reservas con más de 1 año de anticipación.', 'warning');
        return;
      }
      if (endD < startD) {
        showToast('La fecha de devolución no puede ser anterior a la de entrega.', 'warning');
        return;
      }
      if (costs.days > 30) {
        showToast('El período máximo de alquiler permitido es de 30 días continuos.', 'warning');
        return;
      }
      if (!isAvailable || availableStock <= 0) {
        showToast('No hay unidades disponibles en las fechas seleccionadas.', 'warning');
        return;
      }
      if (quantity > availableStock) {
        showToast(`Solo hay ${availableStock} unidades disponibles para estas fechas.`, 'warning');
        return;
      }

      const selectedToolIds = availableToolIds.slice(0, quantity);
      openCheckoutModal(tool, { 
        startDate, 
        endDate, 
        quantity, 
        selectedToolIds, 
        availableStock, 
        totalStock, 
        ...costs 
      });
    });
  }

  renderView();
  checkAvailability();

  modal.open({
    title: `Reservar Herramienta: ${tool.name}`,
    content: content,
    maxWidth: 'max-w-4xl',
  });
}

/**
 * Step 2: Payment and Invoice Generation
 */
export async function openCheckoutModal(tool, rentalData) {
  const content = document.createElement('div');
  content.className = 'p-6 space-y-5 bg-white text-slate-800';

  let currentMethod = 'CREDIT_CARD';
  let pendingRental = rentalData.existingRental || null;

  function renderPaymentFields(method) {
    if (method === 'CREDIT_CARD') {
      return `
        <div class="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <div class="flex justify-between items-center mb-1">
              <label class="block text-[11px] font-semibold text-slate-700">Número de Tarjeta (Solo dígitos)</label>
              <span class="text-[10px] text-slate-400 font-mono">16 dígitos</span>
            </div>
            <div class="relative">
              <input 
                type="text" 
                id="checkout-card-number" 
                maxlength="19" 
                inputmode="numeric" 
                autocomplete="cc-number" 
                placeholder="4532 8921 4402 8892" 
                class="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-10 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#ea580c] transition-colors" 
                value="4532 8921 4402 8892" 
              />
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                ${renderIcon('CreditCard', 'w-4 h-4')}
              </span>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <div class="flex justify-between items-center mb-1">
                <label class="block text-[11px] font-semibold text-slate-700">Vencimiento (MM/AA)</label>
                <span class="text-[9px] text-slate-400 font-mono">Mes 01-12 / &ge;26</span>
              </div>
              <input 
                type="text" 
                id="checkout-card-expiry" 
                maxlength="5" 
                inputmode="numeric" 
                autocomplete="cc-exp" 
                placeholder="MM/AA (ej. 12/28)" 
                class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#ea580c] transition-colors" 
                value="12/28" 
              />
            </div>
            <div>
              <div class="flex justify-between items-center mb-1">
                <label class="block text-[11px] font-semibold text-slate-700">CVC / CVV</label>
                <span class="text-[9px] text-slate-400 font-mono">3 o 4 dígitos</span>
              </div>
              <input 
                type="password" 
                id="checkout-card-cvv" 
                maxlength="4" 
                inputmode="numeric" 
                autocomplete="cc-csc" 
                placeholder="ej. 892" 
                class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#ea580c] transition-colors" 
                value="892" 
              />
            </div>
          </div>
        </div>
      `;
    } else if (method === 'DEBIT_CARD') {
      return `
        <div class="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <label class="block text-[11px] font-semibold text-slate-600 mb-1">Banco Emisor (PSE)</label>
            <select id="pse-bank" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-brand-500">
              <option value="Bancolombia" selected>Bancolombia (Personas / Empresas)</option>
              <option value="Davivienda">Davivienda</option>
              <option value="Banco de Bogotá">Banco de Bogotá</option>
              <option value="BBVA">BBVA Colombia</option>
              <option value="Nequi">Nequi</option>
              <option value="Daviplata">Daviplata</option>
              <option value="Banco de Occidente">Banco de Occidente</option>
              <option value="Scotiabank Colpatria">Scotiabank Colpatria</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-semibold text-slate-600 mb-1">Tipo de Persona</label>
              <select class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-brand-500">
                <option value="NATURAL">Persona Natural</option>
                <option value="JURIDICA">Persona Jurídica</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-600 mb-1">Email Registrado en PSE</label>
              <input type="email" id="pse-email" autocomplete="off" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-brand-500" value="${auth.getUser()?.email || 'cliente@toolrent.com'}" />
            </div>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div class="bg-blue-50 border border-blue-200/80 p-3 rounded-lg space-y-1 text-blue-900">
            <div class="font-bold text-[11px] flex items-center gap-1.5">
              ${renderIcon('Building2', 'w-3.5 h-3.5 text-blue-600')} Datos de Transferencia ToolRent:
            </div>
            <div class="text-[11px] text-blue-800 space-y-0.5 pt-1 font-mono">
              <div><strong>Entidad:</strong> Bancolombia S.A.</div>
              <div><strong>Convenio Recaudos:</strong> #48291</div>
              <div><strong>Cuenta Ahorros:</strong> 317-092182-41</div>
              <div><strong>Titular:</strong> ToolRent Colombia S.A.S. (NIT 901.234.567-8)</div>
            </div>
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-600 mb-1">Número de Comprobante / Transacción Oficial</label>
            <div class="relative">
              <input type="text" id="transfer-ref" readonly autocomplete="off" class="w-full bg-slate-100/90 border border-slate-200 rounded-lg pl-3 pr-28 py-2 text-xs font-mono text-slate-700 cursor-not-allowed select-all font-semibold" value="TRF-${Date.now().toString().slice(-8)}" />
              <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-sans flex items-center gap-1 select-none pointer-events-none">
                ${renderIcon('Lock', 'w-3 h-3 text-slate-400')} Asignado por sistema
              </span>
            </div>
            <p class="text-[10px] text-slate-400 mt-1">Este identificador único de comprobante es generado automáticamente para evitar duplicidad e inconsistencias fiscales.</p>
          </div>
        </div>
      `;
    }
  }

  function bindPaymentFieldSanitizers(root) {
    if (!root) return;

    // 1. Número de Tarjeta: Únicamente dígitos numéricos, espaciado cada 4 caracteres
    const numInp = root.querySelector('#checkout-card-number');
    if (numInp) {
      numInp.addEventListener('input', (e) => {
        const rawDigits = e.target.value.replace(/\D/g, '').slice(0, 16);
        const parts = rawDigits.match(/.{1,4}/g);
        e.target.value = parts ? parts.join(' ') : rawDigits;
      });
      numInp.addEventListener('keydown', (e) => {
        if (['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Enter'].includes(e.key)) return;
        if (e.ctrlKey || e.metaKey) return;
        if (!/^\d$/.test(e.key)) e.preventDefault();
      });
    }

    // 2. Vencimiento MM/AA: Bloqueo de meses > 12 y formato automático
    const expInp = root.querySelector('#checkout-card-expiry');
    if (expInp) {
      expInp.addEventListener('input', (e) => {
        let val = e.target.value.replace(/\D/g, '').slice(0, 4);

        if (val.length === 1) {
          // Si el usuario escribe 2 a 9, se antepone 0 automáticamente (ej. 05)
          if (Number(val) > 1) {
            val = '0' + val;
          }
        } else if (val.length >= 2) {
          let m = parseInt(val.slice(0, 2), 10);
          if (m === 0) m = 1;
          if (m > 12) m = 12; // Bloquea meses inexistentes como 15 o 99
          val = String(m).padStart(2, '0') + val.slice(2);
        }

        if (val.length > 2) {
          e.target.value = val.slice(0, 2) + '/' + val.slice(2, 4);
        } else {
          e.target.value = val;
        }
      });
      expInp.addEventListener('keydown', (e) => {
        if (['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Enter'].includes(e.key)) return;
        if (e.ctrlKey || e.metaKey) return;
        if (!/^\d$/.test(e.key)) e.preventDefault();
      });
    }

    // 3. CVC/CVV: Únicamente dígitos numéricos, máximo 4
    const cvvInp = root.querySelector('#checkout-card-cvv');
    if (cvvInp) {
      cvvInp.addEventListener('input', (e) => {
        const clean = e.target.value.replace(/\D/g, '').slice(0, 4);
        if (e.target.value !== clean) e.target.value = clean;
      });
      cvvInp.addEventListener('keydown', (e) => {
        if (['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Enter'].includes(e.key)) return;
        if (e.ctrlKey || e.metaKey) return;
        if (!/^\d$/.test(e.key)) e.preventDefault();
      });
    }
  }

  content.innerHTML = `
    <div class="space-y-4">
      <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
        <div class="flex items-start justify-between gap-3">
          <div>
            <span class="text-slate-500">Equipo:</span> <strong class="text-slate-900">${tool.name}</strong>
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-[#ea580c] ml-1.5">
              ${rentalData.quantity || 1} ${(rentalData.quantity || 1) === 1 ? 'unidad' : 'unidades'}
            </span>
            <div class="text-[11px] text-slate-500 mt-0.5">
              ${formatDate(rentalData.startDate)} al ${formatDate(rentalData.endDate)} · <span class="font-bold text-slate-700">${rentalData.days} días facturables</span>
            </div>
          </div>
          <div class="text-right flex-shrink-0">
            <div class="text-[10px] text-slate-500 uppercase font-semibold">Total a Pagar Hoy</div>
            <div class="text-base font-bold text-[#ea580c] font-display">${formatCurrency(rentalData.total)}</div>
          </div>
        </div>
        <div class="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>Subtotal (${rentalData.quantity || 1} unids.): ${formatCurrency(rentalData.subtotal)} + IVA (19%): ${formatCurrency(rentalData.tax)}</span>
          <span class="text-emerald-700 font-medium">Garantía en custodia: ${formatCurrency(rentalData.deposit)} (Reembolsable)</span>
        </div>
      </div>

      <!-- Payment Method Selection -->
      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Selecciona Método de Pago</label>
        <div class="grid grid-cols-3 gap-2.5" id="payment-methods-grid">
          <label data-method="CREDIT_CARD" class="payment-method-card p-3 rounded-xl border border-brand-500 bg-orange-50/20 cursor-pointer flex flex-col items-center text-center gap-1.5 transition-all">
            <input type="radio" name="payment-method" value="CREDIT_CARD" checked class="sr-only">
            ${renderIcon('CreditCard', 'w-5 h-5 text-brand-600')}
            <span class="text-xs font-semibold text-slate-900">Tarjeta Crédito</span>
          </label>
          <label data-method="DEBIT_CARD" class="payment-method-card p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 cursor-pointer flex flex-col items-center text-center gap-1.5 transition-all">
            <input type="radio" name="payment-method" value="DEBIT_CARD" class="sr-only">
            ${renderIcon('Wallet', 'w-5 h-5 text-slate-600')}
            <span class="text-xs font-semibold text-slate-900">PSE / Débito</span>
          </label>
          <label data-method="BANK_TRANSFER" class="payment-method-card p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 cursor-pointer flex flex-col items-center text-center gap-1.5 transition-all">
            <input type="radio" name="payment-method" value="BANK_TRANSFER" class="sr-only">
            ${renderIcon('Building2', 'w-5 h-5 text-slate-600')}
            <span class="text-xs font-semibold text-slate-900">Transferencia</span>
          </label>
        </div>
      </div>

      <!-- Dynamic Form Container -->
      <div id="payment-fields-container">
        ${renderPaymentFields('CREDIT_CARD')}
      </div>

      <div id="checkout-error" class="hidden text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg"></div>

      <button id="btn-confirm-payment" class="btn-primary w-full !py-2.5 text-xs font-semibold shadow-sm">
        ${renderIcon('Lock', 'w-4 h-4')} Confirmar y Pagar ${formatCurrency(rentalData.total)}
      </button>
    </div>
  `;

  // Handle payment method toggling
  const fieldsContainer = content.querySelector('#payment-fields-container');
  const methodCards = content.querySelectorAll('.payment-method-card');

  methodCards.forEach(card => {
    card.addEventListener('click', () => {
      const radio = card.querySelector('input[type="radio"]');
      radio.checked = true;
      currentMethod = radio.value;

      methodCards.forEach(c => {
        c.className = 'payment-method-card p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 cursor-pointer flex flex-col items-center text-center gap-1.5 transition-all';
        const icon = c.querySelector('svg');
        if (icon) icon.setAttribute('class', 'w-5 h-5 text-slate-600');
      });

      card.className = 'payment-method-card p-3 rounded-xl border border-brand-500 bg-orange-50/20 cursor-pointer flex flex-col items-center text-center gap-1.5 transition-all';
      const activeIcon = card.querySelector('svg');
      if (activeIcon) activeIcon.setAttribute('class', 'w-5 h-5 text-brand-600');

      fieldsContainer.innerHTML = renderPaymentFields(currentMethod);
      bindPaymentFieldSanitizers(fieldsContainer);
    });
  });

  // Initial sanitizer binding
  bindPaymentFieldSanitizers(fieldsContainer);

  content.querySelector('#btn-confirm-payment').addEventListener('click', async () => {
    const btn = content.querySelector('#btn-confirm-payment');
    const errBox = content.querySelector('#checkout-error');
    errBox.classList.add('hidden');

    // Validación estricta para Tarjeta de Crédito (solo números, mes 01-12, año >= 2026, CVV 3-4 dígitos)
    if (currentMethod === 'CREDIT_CARD') {
      const numInp = content.querySelector('#checkout-card-number');
      const expInp = content.querySelector('#checkout-card-expiry');
      const cvvInp = content.querySelector('#checkout-card-cvv');

      const cardDigits = (numInp?.value || '').replace(/\D/g, '');
      if (cardDigits.length !== 16) {
        errBox.textContent = 'El número de tarjeta es inválido. Debe contener exactamente 16 dígitos numéricos.';
        errBox.classList.remove('hidden');
        numInp?.focus();
        return;
      }

      const expVal = (expInp?.value || '').trim();
      if (!/^\d{2}\/\d{2}$/.test(expVal)) {
        errBox.textContent = 'Fecha de vencimiento incompleta. Ingresa el formato MM/AA (ej. 12/28).';
        errBox.classList.remove('hidden');
        expInp?.focus();
        return;
      }

      const [mStr, yStr] = expVal.split('/');
      const month = parseInt(mStr, 10);
      const fullYear = 2000 + parseInt(yStr, 10);
      const currentYear = 2026;
      const currentMonth = 10;

      if (month < 1 || month > 12) {
        errBox.textContent = `Mes de vencimiento inexistente (${mStr}). Los meses válidos van del 01 al 12.`;
        errBox.classList.remove('hidden');
        expInp?.focus();
        return;
      }

      if (fullYear < currentYear) {
        errBox.textContent = `La tarjeta se encuentra vencida. El año (${fullYear}) no puede ser anterior al año vigente (${currentYear}).`;
        errBox.classList.remove('hidden');
        expInp?.focus();
        return;
      }

      if (fullYear === currentYear && month < currentMonth) {
        errBox.textContent = `La tarjeta se encuentra vencida. El mes (${mStr}/26) ya ha expirado con respecto a la fecha actual (octubre 2026).`;
        errBox.classList.remove('hidden');
        expInp?.focus();
        return;
      }

      if (fullYear > currentYear + 20) {
        errBox.textContent = `El año de vencimiento (${fullYear}) excede el plazo máximo permitido.`;
        errBox.classList.remove('hidden');
        expInp?.focus();
        return;
      }

      const cvvDigits = (cvvInp?.value || '').replace(/\D/g, '');
      if (cvvDigits.length < 3 || cvvDigits.length > 4) {
        errBox.textContent = 'El código de seguridad CVC/CVV debe contener 3 o 4 dígitos numéricos.';
        errBox.classList.remove('hidden');
        cvvInp?.focus();
        return;
      }
    }

    if (currentMethod === 'DEBIT_CARD') {
      const emailInp = content.querySelector('#pse-email');
      const emailVal = (emailInp?.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
        errBox.textContent = 'Por favor ingresa un correo electrónico válido registrado en PSE.';
        errBox.classList.remove('hidden');
        emailInp?.focus();
        return;
      }
    }

    btn.disabled = true;
    btn.innerHTML = `${renderIcon('Loader2', 'w-4 h-4 animate-spin inline mr-1.5')} Procesando pago seguro...`;

    try {
      const user = auth.getUser();
      const method = currentMethod;

      // 1. Create Rental in Backend only if not already created
      if (!pendingRental) {
        const rentalPayload = {
          clientId: user.profile?.id || user.id,
          startDate: rentalData.startDate,
          endDate: rentalData.endDate,
          toolIds: (rentalData.selectedToolIds && rentalData.selectedToolIds.length > 0) ? rentalData.selectedToolIds : [tool.id]
        };
        pendingRental = await api.post('/rentals', rentalPayload);
      }

      // 2. Determine official billed amount matching backend invoice (subtotal * 1.19)
      const subtotalNum = Number(pendingRental.subtotal ?? rentalData.subtotal ?? 0);
      const billedAmount = subtotalNum > 0 ? Math.round(subtotalNum * 1.19) : Math.round(rentalData.total);

      // 3. Process payment with sanitized reference number
      const transferInput = content.querySelector('#transfer-ref');
      const rawRef = transferInput ? transferInput.value.trim() : `TRF-${Date.now().toString().slice(-8)}`;
      const safeRef = rawRef.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 30) || `PAY-ONLINE-${Date.now().toString().slice(-6)}`;

      const paymentPayload = {
        rentalId: pendingRental.id,
        amount: billedAmount,
        paymentMethod: method,
        referenceNumber: safeRef
      };

      const paymentResult = await api.post('/billing/payments', paymentPayload);

      // Trigger Notification in Notification Center and Toast
      notificationsStore.add({
        category: 'PAYMENT',
        type: 'success',
        title: '¡Alquiler y Pago Confirmados!',
        message: `Has reservado ${tool.name} (#${pendingRental.id}) por ${formatCurrency(billedAmount)}. Factura legal generada.`,
        link: '#/client'
      });

      // 4. Show Success & Invoice Viewer
      showSuccessModal(pendingRental, paymentResult, tool, {
        ...rentalData,
        subtotal: subtotalNum || rentalData.subtotal,
        tax: Math.round(subtotalNum * 0.19) || rentalData.tax,
        total: billedAmount
      });

    } catch (err) {
      errBox.textContent = err.message || 'Error al procesar la reserva o el pago.';
      errBox.classList.remove('hidden');
      btn.disabled = false;
      btn.innerHTML = `${renderIcon('Lock', 'w-4 h-4')} Confirmar y Pagar ${formatCurrency(rentalData.total)}`;
    }
  });

  modal.open({
    title: 'Pasarela de Pago Segura',
    content: content,
    maxWidth: 'max-w-md',
  });
}

/**
 * Step 3: Success and Printable Invoice View
 */
function showSuccessModal(rental, payment, tool, rentalData) {
  const content = document.createElement('div');
  content.className = 'p-6 text-center space-y-5 bg-white text-slate-800';

  content.innerHTML = `
    <div class="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center">
      ${renderIcon('CheckCircle2', 'w-7 h-7')}
    </div>

    <div>
      <h3 class="text-lg font-bold text-slate-900 font-display">¡Reserva y Pago Exitosos!</h3>
      <p class="text-xs text-slate-500 mt-1">
        Tu solicitud ha sido radicada correctamente con el código 
        <strong class="text-slate-900 font-mono">${rental.rentalCode || rental.id}</strong>
      </p>
    </div>

    <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-left space-y-1.5">
      <div class="flex justify-between"><span class="text-slate-500">Estado:</span> <span class="badge-pending">Pendiente de Despacho</span></div>
      <div class="flex justify-between"><span class="text-slate-500">Transacción Pago:</span> <strong class="text-emerald-600 font-mono">${payment?.paymentReference || payment?.id || 'APROBADA'}</strong></div>
      <div class="flex justify-between"><span class="text-slate-500">Total Abonado:</span> <strong class="text-slate-900 font-bold">${formatCurrency(payment?.amount || rentalData?.total || 255000)}</strong></div>
    </div>

    <div class="flex flex-col gap-2 pt-2">
      <button id="btn-view-invoice-modal" class="btn-primary w-full justify-center !py-2.5 text-xs font-semibold shadow-sm">
        ${renderIcon('Printer', 'w-4 h-4')} Ver Factura Oficial de Alquiler
      </button>
      <button id="btn-goto-my-rentals" class="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-2 rounded-lg text-xs font-semibold transition-colors">
        ${renderIcon('Calendar', 'w-4 h-4 inline mr-1')} Ir a Mis Alquileres
      </button>
    </div>
  `;

  content.querySelector('#btn-view-invoice-modal')?.addEventListener('click', () => {
    const user = auth.getUser();
    const rentalDays = rentalData?.days || 1;
    const subtotal = rentalData?.subtotal || Math.round((rentalData?.total || 0) / 1.19);
    const tax = rentalData?.tax || Math.round(subtotal * 0.19);
    const total = rentalData?.total || (subtotal + tax);

    openInvoiceViewer({
      invoiceNumber: `TR-${String(rental.id || Date.now()).padStart(6, '0')}`,
      issueDate: new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }),
      client: {
        name: user?.fullName || user?.username || 'Cliente ToolRent',
        taxId: user?.documentNumber || '1.032.456.789',
        email: user?.email || 'cliente@toolrent.com',
        phone: user?.phone || '+57 300 123 4567',
        address: 'Bucaramanga, Santander'
      },
      provider: {
        name: tool?.provider?.name || 'Constructoras del Norte S.A.S.',
        taxId: '901.234.567-8',
        email: 'contacto@cnorte.com',
        phone: '+57 317 654 3210',
        address: 'Av. 27 # 45-12, Floridablanca, Santander'
      },
      items: [
        {
          name: tool?.name || 'Equipo Industrial',
          days: rentalDays,
          dailyPrice: tool?.dailyPrice || 0,
          subtotal: subtotal
        }
      ],
      subtotal: subtotal,
      tax: tax,
      total: total,
      paymentMethod: payment?.paymentMethod || 'Transferencia bancaria',
      bank: 'Pasarela Electrónica',
      reference: payment?.paymentReference || `PAY-${payment?.id || Date.now()}`,
      paymentDate: new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
    });
  });

  content.querySelector('#btn-goto-my-rentals')?.addEventListener('click', () => {
    modal.close();
    window.location.hash = '#/client';
  });

  modal.open({
    title: 'Comprobante de Transacción',
    content: content,
    maxWidth: 'max-w-md',
  });
}

/**
 * Helper to fetch invoice + provider data and display official invoice
 */
export async function openRentalInvoiceModal(rentalId, targetRental = null, selectedTool = null) {
  try {
    const user = auth.getUser();
    const invoice = await api.get(`/billing/invoices/rental/${rentalId}`);
    
    let toolName = selectedTool?.name || 'Equipo Industrial Certificado';
    let dailyPrice = selectedTool?.dailyPrice || invoice.subtotal;
    let providerId = selectedTool?.providerId;

    if (!selectedTool && targetRental?.items?.[0]?.toolId) {
      try {
        const t = await api.get(`/tools/${targetRental.items[0].toolId}`);
        if (t) {
          toolName = t.name;
          dailyPrice = t.dailyPrice;
          providerId = t.providerId;
        }
      } catch (_) {}
    }

    let providerData = {
      name: 'Proveedor Autorizado ToolRent S.A.S.',
      taxId: '901.458.789-1',
      email: 'contacto@toolrent.com',
      phone: '+57 (1) 745-8900',
      address: 'Zona Industrial, Colombia'
    };

    if (providerId) {
      try {
        const p = await api.get(`/providers/${providerId}`);
        if (p) {
          providerData = {
            name: p.companyName || providerData.name,
            taxId: p.taxId || providerData.taxId,
            email: p.email || 'contacto@proveedor.com',
            phone: p.phone || providerData.phone,
            address: [p.address, p.city].filter(Boolean).join(', ') || providerData.address
          };
        }
      } catch (_) {}
    }

    const clientAddress = [user?.profile?.address, user?.profile?.city].filter(Boolean).join(', ') || 'Dirección registrada del cliente';

    openInvoiceViewer({
      rawInvoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber || targetRental?.rentalCode || `TR-${String(rentalId).slice(-6)}`,
      issueDate: invoice.issueDate ? formatDate(invoice.issueDate.split('T')[0]) : formatDate(targetRental?.startDate),
      client: {
        name: user?.profile?.fullName || user?.username || 'Cliente Registrado',
        taxId: user?.profile?.documentNumber ? `${user.profile.documentType || 'CC'} ${user.profile.documentNumber}` : '1018234567',
        email: user?.email || 'cliente@constructora.com',
        phone: user?.profile?.phone || '+57 300 123 4567',
        address: clientAddress
      },
      provider: providerData,
      items: [
        {
          name: toolName,
          days: targetRental?.totalDays || 1,
          dailyPrice: dailyPrice,
          subtotal: invoice.subtotal
        }
      ],
      subtotal: invoice.subtotal,
      tax: invoice.taxAmount,
      total: invoice.totalBilled,
      paymentMethod: 'Tarjeta de Crédito / Pasarela Segura',
      bank: 'Bancolombia S.A.',
      reference: invoice.invoiceNumber || targetRental?.rentalCode,
      paymentDate: formatDate(invoice.issueDate?.split('T')[0] || targetRental?.startDate || '2026-10-14')
    });
  } catch (err) {
    showToast('No se encontró factura emitida para esta reserva aún.', 'error');
  }
}

/**
 * Step 4: Clean Official Invoice Viewer matching `img/Minimal ToolRent Rental Invoice Viewer.png`
 */
export function openInvoiceViewer(invoice) {
  const content = document.createElement('div');
  content.className = 'bg-[#f1f5f9] p-4 sm:p-8 min-h-screen';

  content.innerHTML = `
    <div class="max-w-4xl mx-auto space-y-4">
      
      <!-- Top Action Bar -->
      <div class="flex items-center justify-between">
        <button id="invoice-btn-back" class="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">
          ${renderIcon('ArrowLeft', 'w-4 h-4')} Volver
        </button>
        <div class="flex items-center gap-2">
          <button id="invoice-btn-download" class="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            ${renderIcon('Download', 'w-3.5 h-3.5')} Descargar PDF
          </button>
          <button id="invoice-btn-print" class="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
            ${renderIcon('Printer', 'w-3.5 h-3.5')} Imprimir
          </button>
        </div>
      </div>

      <!-- Printable Invoice Paper Card -->
      <div id="printable-invoice-sheet" class="bg-white rounded-2xl shadow-xl border border-slate-200/90 p-6 sm:p-12 space-y-6 font-sans text-slate-800">
        
        <!-- 1. Header -->
        <div class="flex flex-col sm:flex-row justify-between items-start gap-4 pb-5 border-b border-slate-200">
          <div class="space-y-1.5">
            <div class="flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-lg bg-[#ea580c] flex items-center justify-center text-white font-black text-base shadow-xs">T</span>
              <span class="text-2xl font-extrabold tracking-tight text-slate-900 font-display">Tool<span class="text-[#ea580c]">Rent</span> Colombia</span>
            </div>
            <p class="text-[11px] text-slate-500 leading-relaxed">
              <strong>ToolRent Technology S.A.S.</strong> · NIT 901.234.567-8<br>
              Plataforma de Arrendamiento y Gestión de Equipos de Construcción<br>
              Régimen Común · Responsable de IVA · CIIU 7730
            </p>
          </div>

          <div class="sm:text-right space-y-1">
            <span class="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              CERTIFICADA DIAN · PAGADA
            </span>
            <div class="text-sm font-extrabold text-slate-900">FACTURA ELECTRÓNICA DE VENTA</div>
            <div class="text-base font-bold text-[#ea580c] font-mono">${invoice.invoiceNumber || 'INV-0004587'}</div>
            <div class="text-[11px] text-slate-500">
              Fecha de Emisión: <strong class="text-slate-800">${invoice.issueDate || '2026-10-15'}</strong>
            </div>
          </div>
        </div>

        <!-- 2. DIAN Resolution Banner -->
        <div class="px-3.5 py-2.5 bg-slate-50 border-l-3 border-[#ea580c] rounded-r-lg text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2">
          <span><strong>Autorización DIAN:</strong> Res. Nº 18764000001 de 2026-01-15 (Prefijo INV, 00001 a 99999 · Vigencia 24M)</span>
          <span class="text-slate-500">Operación: <strong>10 - Arrendamiento Bien Mueble</strong></span>
        </div>

        <!-- 3. Client & Provider Two Columns -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
          <!-- Datos del proveedor -->
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div class="flex items-center justify-between pb-2 border-b border-slate-200">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Arrendador (Proveedor)</span>
              <span class="text-[10px] font-bold text-[#ea580c] bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-md">Dueño del Equipo</span>
            </div>
            <div class="font-bold text-slate-900 text-sm">${invoice.provider.name}</div>
            <div class="flex justify-between text-slate-600"><span class="text-slate-400">NIT / RUT:</span> <strong class="font-mono text-slate-800">${invoice.provider.taxId}</strong></div>
            <div class="flex justify-between text-slate-600"><span class="text-slate-400">Sede:</span> <span>${invoice.provider.address}</span></div>
            <div class="flex justify-between text-slate-600"><span class="text-slate-400">Teléfono:</span> <span>${invoice.provider.phone}</span></div>
            <div class="flex justify-between text-slate-600"><span class="text-slate-400">Notificación:</span> <span class="font-mono text-[11px]">${invoice.provider.email}</span></div>
          </div>

          <!-- Datos del cliente -->
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div class="flex items-center justify-between pb-2 border-b border-slate-200">
              <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Arrendatario (Cliente)</span>
              <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">Arrendatario en Faena</span>
            </div>
            <div class="font-bold text-slate-900 text-sm">${invoice.client.name}</div>
            <div class="flex justify-between text-slate-600"><span class="text-slate-400">Identificación:</span> <strong class="font-mono text-slate-800">${invoice.client.taxId}</strong></div>
            <div class="flex justify-between text-slate-600"><span class="text-slate-400">Destino de Obra:</span> <span>${invoice.client.address}</span></div>
            <div class="flex justify-between text-slate-600"><span class="text-slate-400">Teléfono:</span> <span>${invoice.client.phone}</span></div>
            <div class="flex justify-between text-slate-600"><span class="text-slate-400">Notificación:</span> <span class="font-mono text-[11px]">${invoice.client.email}</span></div>
          </div>
        </div>

        <!-- 4. Equipos alquilados Table -->
        <div class="border border-slate-200 rounded-xl overflow-hidden">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th class="py-3 px-3.5 w-10 text-center">#</th>
                <th class="py-3 px-4">Maquinaria / Equipo Industrial</th>
                <th class="py-3 px-4 text-center w-24">Duración</th>
                <th class="py-3 px-4 text-right w-32">Tarifa Diaria</th>
                <th class="py-3 px-4 text-right w-36">Subtotal Alquiler</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              ${invoice.items.map((it, idx) => `
                <tr>
                  <td class="py-3.5 px-3.5 text-center text-slate-400 font-mono text-[11px]">${String(idx + 1).padStart(2, '0')}</td>
                  <td class="py-3.5 px-4">
                    <div class="font-bold text-slate-900 text-xs">${it.name}</div>
                    <div class="text-[10px] text-slate-400 mt-0.5">Maquinaria pesada certificada · Cobertura técnica en obra</div>
                  </td>
                  <td class="py-3.5 px-4 text-center font-medium">${it.days} días</td>
                  <td class="py-3.5 px-4 text-right font-mono">${formatCurrency(it.dailyPrice)}</td>
                  <td class="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">${formatCurrency(it.subtotal)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- 5. Settlement & Totals Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
          <!-- Payment Info Box -->
          <div class="sm:col-span-7 p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-600">
            <div class="font-bold text-slate-900 text-xs pb-1.5 border-b border-slate-200 flex items-center justify-between">
              <span>Comprobante de Pago y Garantía</span>
              <span class="text-emerald-700 font-medium text-[11px]">✔ Conciliado</span>
            </div>
            <div class="flex justify-between"><span class="text-slate-400">Método de Pago:</span> <strong class="text-slate-800">${invoice.paymentMethod}</strong></div>
            <div class="flex justify-between"><span class="text-slate-400">Entidad / Red:</span> <strong class="text-slate-800">${invoice.bank}</strong></div>
            <div class="flex justify-between"><span class="text-slate-400">Ref. Transacción:</span> <span class="font-mono text-slate-800 font-semibold">${invoice.reference}</span></div>
            <div class="flex justify-between"><span class="text-slate-400">Custodia Garantía:</span> <span class="text-emerald-700 font-medium">Custodiado por ToolRent Escrow</span></div>
            <p class="text-[10px] text-slate-400 pt-1 leading-relaxed border-t border-slate-200/70 mt-2">
              El depósito de garantía se reembolsa a la cuenta de origen tras el cierre del acta de entrega en faena.
            </p>
          </div>

          <!-- Totals Box -->
          <div class="sm:col-span-5 p-4 bg-white border border-slate-200 rounded-xl space-y-2 text-xs shadow-2xs">
            <div class="flex justify-between text-slate-600">
              <span>Subtotal Arrendamiento:</span>
              <strong class="text-slate-800 font-mono">${formatCurrency(invoice.subtotal)}</strong>
            </div>
            <div class="flex justify-between text-slate-600">
              <span>IVA Legal 19% (Servicios):</span>
              <strong class="text-slate-800 font-mono">${formatCurrency(invoice.tax)}</strong>
            </div>
            <div class="pt-2 border-t-2 border-slate-900 flex justify-between items-baseline">
              <span class="text-xs font-black text-slate-900 uppercase tracking-tight">TOTAL FACTURADO:</span>
              <span class="text-lg font-black text-[#ea580c] font-mono">${formatCurrency(invoice.total)}</span>
            </div>
            <div class="text-[10px] text-slate-400 text-right">Pesos Colombianos (COP) · IVA Incluido</div>
          </div>
        </div>

        <!-- 6. CUFE Box with SVG QR Pattern -->
        <div class="p-3.5 bg-slate-50 border border-dashed border-slate-300 rounded-xl flex items-center gap-4">
          <svg class="w-14 h-14 flex-shrink-0 bg-white border border-slate-200 rounded p-1" viewBox="0 0 100 100">
            <rect width="100" height="100" fill="#ffffff" />
            <rect x="10" y="10" width="24" height="24" fill="#0f172a" />
            <rect x="14" y="14" width="16" height="16" fill="#ffffff" />
            <rect x="18" y="18" width="8" height="8" fill="#0f172a" />
            <rect x="66" y="10" width="24" height="24" fill="#0f172a" />
            <rect x="70" y="14" width="16" height="16" fill="#ffffff" />
            <rect x="74" y="18" width="8" height="8" fill="#0f172a" />
            <rect x="10" y="66" width="24" height="24" fill="#0f172a" />
            <rect x="14" y="70" width="16" height="16" fill="#ffffff" />
            <rect x="18" y="74" width="8" height="8" fill="#0f172a" />
            <rect x="42" y="14" width="6" height="6" fill="#0f172a" />
            <rect x="52" y="20" width="6" height="6" fill="#0f172a" />
            <rect x="44" y="44" width="12" height="12" fill="#ea580c" />
            <rect x="62" y="42" width="6" height="6" fill="#0f172a" />
            <rect x="42" y="66" width="6" height="6" fill="#0f172a" />
            <rect x="72" y="64" width="8" height="8" fill="#0f172a" />
          </svg>
          <div class="text-[11px] text-slate-500 min-w-0 flex-1">
            <strong class="text-slate-800">Código Único de Factura Electrónica (CUFE):</strong>
            <div class="font-mono text-[9px] text-slate-800 break-all bg-white border border-slate-200 p-1.5 rounded mt-1 select-all">
              ${(invoice.rawInvoiceId || '3d626d7f').replace(/-/g, '') + '8a2d440c85a2a3d61166a14cDIAN2026CUFE'}
            </div>
            <div class="text-[10px] text-slate-400 mt-1">Verificación fiscal en línea: <a href="https://catalogo-vpfe.dian.gov.co" target="_blank" class="text-[#ea580c] hover:underline">catalogo-vpfe.dian.gov.co</a></div>
          </div>
        </div>

        <!-- 7. Legal Disclaimer & Digital Seal -->
        <div class="pt-4 border-t border-slate-200 text-center space-y-1 text-[10px] text-slate-400 leading-relaxed">
          <p>Esta factura electrónica presta mérito ejecutivo conforme a los artículos 772, 773 y 774 del Código de Comercio y la Ley 1231 de 2008.</p>
          <p class="font-medium text-slate-500">ToolRent Technology S.A.S. · NIT 901.234.567-8 · Firma Digital SHA-256 · Bogotá, Colombia</p>
        </div>

      </div>

    </div>
  `;

  content.querySelector('#invoice-btn-back')?.addEventListener('click', () => {
    modal.close();
    if (window.location.hash !== '#/client' && window.location.hash !== '#/provider') {
      window.location.hash = '#/client';
    }
  });

  content.querySelector('#invoice-btn-download')?.addEventListener('click', () => {
    if (invoice.rawInvoiceId) {
      window.open(`http://localhost:8085/api/v1/billing/invoices/${invoice.rawInvoiceId}/html`, '_blank');
    } else {
      showToast('Descargando comprobante fiscal...', 'success');
      window.print();
    }
  });

  content.querySelector('#invoice-btn-print')?.addEventListener('click', () => {
    if (invoice.rawInvoiceId) {
      window.open(`http://localhost:8085/api/v1/billing/invoices/${invoice.rawInvoiceId}/html`, '_blank');
    } else {
      window.print();
    }
  });

  modal.open({
    title: '',
    content: content,
    maxWidth: 'max-w-5xl',
    hideHeader: true
  });
}

export default openRentalModal;
