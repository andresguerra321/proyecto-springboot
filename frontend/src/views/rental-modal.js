import api from '../api/client.js';
import auth from '../auth/state.js';
import modal from '../components/modal.js';
import showToast from '../components/toast.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { renderIcon, renderToolRentMark } from '../utils/icons.js';
import { openAuthModal } from '../components/auth-modal.js';
import { notificationsStore } from '../utils/notifications-store.js';

export async function openRentalModal(tool) {
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

  const formatDateInput = (d) => d.toISOString().split('T')[0];

  let startDate = formatDateInput(tomorrow);
  let endDate = formatDateInput(endDefault);
  let isCheckingAvailability = false;
  let isAvailable = true;

  const content = document.createElement('div');
  content.className = 'p-6 space-y-6 bg-white text-slate-800';

  async function checkAvailability() {
    isCheckingAvailability = true;
    updateCalculationUI();

    try {
      const res = await api.get(`/tools/${tool.id}/availability`, {
        from: startDate,
        to: endDate
      });
      isAvailable = res.available !== false;
    } catch (err) {
      console.warn('Error al verificar disponibilidad:', err);
      isAvailable = true;
    } finally {
      isCheckingAvailability = false;
      updateCalculationUI();
    }
  }

  let isDetailsExpanded = false;

  function calculateCosts() {
    const [y1, m1, d1] = startDate.split('-').map(Number);
    const [y2, m2, d2] = endDate.split('-').map(Number);
    const start = new Date(y1, m1 - 1, d1);
    const end = new Date(y2, m2 - 1, d2);
    
    // Regla de cálculo: ambos extremos son días facturables (día de entrega y día de devolución computables)
    const diffMs = Math.max(0, end - start);
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    const days = diffDays + 1;
    
    const dailyPrice = tool.dailyPrice || 85000;
    const subtotal = days * dailyPrice;
    const tax = Math.round(subtotal * 0.19); // 19% IVA régimen común DIAN (servicios de arrendamiento)
    const deposit = Math.round((tool.replacementValue || 850000) * 0.10); // 10% depósito de garantía en custodia
    const total = subtotal + tax;

    return { days, subtotal, tax, deposit, total, dailyPrice };
  }

  function renderView() {
    const primaryImg = tool.images?.find(img => img.isPrimary)?.imageUrl || tool.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800';
    const { days, subtotal, tax, deposit, total, dailyPrice } = calculateCosts();

    content.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- Left: Tool Details & Pricing Hierarchy (5 cols) -->
        <div class="lg:col-span-5 space-y-3.5">
          <!-- Image Box with Badge -->
          <div class="relative h-44 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-xs group">
            <img 
              src="${primaryImg}" 
              alt="${tool.name}" 
              class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
              onerror="window.ToolRentCacheShield?.handleImageError(this, '${primaryImg}', '${tool.categoryName || ''}', '${tool.name?.replace(/'/g, "\\'")}')"
            />
            <div class="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold text-slate-800 border border-slate-200/80 shadow-xs flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-[#ea580c]"></span>
              ${tool.brand || 'DeWalt'} · ${tool.model || 'DWD520K'}
            </div>
          </div>

          <!-- Product Identification -->
          <div>
            <h3 class="text-base font-bold text-slate-900 font-display leading-tight">${tool.name}</h3>
            <p class="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
              ${tool.description || 'Herramienta profesional de alto rendimiento certificada para construcción y remodelación.'}
            </p>
          </div>

          <!-- Simplified Pricing & Warranty Hierarchy -->
          <div class="p-3.5 bg-slate-50/90 border border-slate-200/90 rounded-xl space-y-2 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-slate-600 font-medium">Tarifa por día:</span>
              <strong class="text-base font-bold text-[#ea580c] font-display">${formatCurrency(dailyPrice)} <span class="text-xs font-normal text-slate-500">/ día</span></strong>
            </div>
            <div class="flex items-center justify-between text-slate-600 pt-1.5 border-t border-slate-200/60">
              <span>Valor de reposición:</span>
              <strong class="text-slate-800 font-semibold">${formatCurrency(tool.replacementValue || 850000)}</strong>
            </div>
            <div class="flex items-center justify-between text-slate-600">
              <span class="flex items-center gap-1">
                Depósito garantía (10%):
              </span>
              <span class="text-emerald-700 bg-emerald-50 border border-emerald-200/80 font-bold px-1.5 py-0.5 rounded text-[11px]">
                ${formatCurrency(deposit)} · Reembolsable
              </span>
            </div>
          </div>

          <!-- Provider Responsible Card -->
          <div class="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 text-xs shadow-xs">
            <div class="flex items-center justify-between">
              <span class="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                ${renderIcon('Building2', 'w-3.5 h-3.5 text-[#ea580c]')} Proveedor Certificado
              </span>
              <span class="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Verificado
              </span>
            </div>
            <div class="text-xs font-bold text-slate-900">${tool.provider?.companyName || tool.providerName || 'Maquinaria y Equipos Bogotá S.A.S.'}</div>
            <div class="text-[11px] text-slate-500 flex items-center gap-1">
              ${renderIcon('MapPin', 'w-3 h-3 text-slate-400')} ${tool.provider?.city || tool.providerCity || 'Bogotá D.C.'} · Tel: ${tool.provider?.phone || tool.providerPhone || '+57 310 111 2233'}
            </div>
          </div>
        </div>

        <!-- Right: Dates Selection, Cost Breakdown & Checkout (7 cols) -->
        <div class="lg:col-span-7 space-y-3.5">
          
          <!-- 02. Single Integrated Booking Unit (Selector de Fechas Conectado) -->
          <div class="p-3.5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2.5">
            <div class="flex items-center justify-between flex-wrap gap-1">
              <label class="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                ${renderIcon('Calendar', 'w-4 h-4 text-[#ea580c]')} Período de Alquiler
              </label>
              <span class="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                ${renderIcon('Info', 'w-3 h-3 text-slate-400')} Ambos extremos son días facturables
              </span>
            </div>

            <!-- Connected Range Unit -->
            <div class="bg-white border border-slate-200/90 rounded-xl p-2.5 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-2 relative">
              <div>
                <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1" for="rental-start-date">
                  Fecha de Inicio (Entrega)
                </label>
                <input 
                  type="date" 
                  id="rental-start-date" 
                  value="${startDate}" 
                  min="${formatDateInput(new Date())}" 
                  class="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors" 
                />
              </div>

              <div>
                <label class="block text-[10px] font-bold uppercase text-slate-500 mb-1" for="rental-end-date">
                  Fecha de Fin (Devolución)
                </label>
                <input 
                  type="date" 
                  id="rental-end-date" 
                  value="${endDate}" 
                  min="${startDate}" 
                  class="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#ea580c] focus:bg-white transition-colors" 
                />
              </div>
            </div>

            <!-- Multisensory Availability & Days Status Alert -->
            <div id="availability-alert" class="transition-all">
              ${isCheckingAvailability ? `
                <div class="text-slate-600 bg-white border border-slate-200 p-2.5 rounded-lg flex items-center gap-2 text-xs">
                  ${renderIcon('Loader2', 'w-4 h-4 animate-spin text-[#ea580c] flex-shrink-0')}
                  <span class="font-medium">Consultando calendario y disponibilidad técnica en tiempo real...</span>
                </div>
              ` : isAvailable ? `
                <div class="text-emerald-900 bg-emerald-50 border border-emerald-300 p-2.5 rounded-lg text-xs space-y-0.5">
                  <div class="flex items-center gap-1.5 font-bold text-emerald-800">
                    ${renderIcon('CheckCircle2', 'w-4 h-4 text-emerald-600 flex-shrink-0')}
                    <span>Equipo disponible para reserva inmediata</span>
                  </div>
                  <div class="text-[11px] text-emerald-700 pl-5 leading-snug">
                    Total: <strong class="underline font-bold">${days} días facturables</strong> (${formatDate(startDate)} al ${formatDate(endDate)} inclusive · día de entrega y devolución computables).
                  </div>
                </div>
              ` : `
                <div class="text-amber-900 bg-amber-50 border border-amber-300 p-2.5 rounded-lg text-xs space-y-0.5">
                  <div class="flex items-center gap-1.5 font-bold text-amber-800">
                    ${renderIcon('AlertTriangle', 'w-4 h-4 text-amber-600 flex-shrink-0')}
                    <span>Fechas no disponibles para este equipo</span>
                  </div>
                  <div class="text-[11px] text-amber-700 pl-5 leading-snug">
                    El equipo ya se encuentra comprometido en estas fechas. Por favor selecciona un rango alternativo.
                  </div>
                </div>
              `}
            </div>
          </div>

          <!-- 03. Clear Price Breakdown in Distinct Blocks -->
          <div class="space-y-2.5">
            
            <!-- Block A: Rental & Taxes (Hoy se cobra) -->
            <div class="p-3 bg-white border border-slate-200 rounded-xl space-y-2 text-xs shadow-xs">
              <div class="text-[11px] font-bold uppercase tracking-wider text-slate-500 pb-1 border-b border-slate-100 flex items-center justify-between">
                <span>Servicio de Alquiler e Impuestos</span>
                <span class="text-[10px] text-slate-400 font-normal">Factura Electrónica DIAN</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>Alquiler (${days} días × ${formatCurrency(dailyPrice)}):</span>
                <span class="text-slate-900 font-medium">${formatCurrency(subtotal)}</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span class="flex items-center gap-1">
                  IVA Legal (19% régimen común):
                  <span class="text-[10px] text-slate-400" title="Arrendamiento de bienes corporales muebles según Estatuto Tributario">(Art. 420 E.T.)</span>
                </span>
                <span class="text-slate-900 font-medium">+${formatCurrency(tax)}</span>
              </div>
              <div class="border-t border-slate-200/90 pt-1.5 flex justify-between items-baseline">
                <div>
                  <span class="text-xs font-bold text-slate-900 uppercase tracking-wide">Total a pagar hoy:</span>
                  <div class="text-[10px] text-slate-400">Incluye IVA legal deducible con CUFE</div>
                </div>
                <span class="text-xl font-black text-[#ea580c] font-display">${formatCurrency(total)}</span>
              </div>
            </div>

            <!-- Block B: Deposit in Custody (Claramente diferenciado y Reembolsable) -->
            <div class="p-3 bg-slate-50/80 border border-slate-200/90 rounded-xl text-xs space-y-1.5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5 font-bold text-slate-800">
                  ${renderIcon('ShieldCheck', 'w-4 h-4 text-emerald-600')}
                  <span>Depósito de Garantía en Custodia (10%):</span>
                </div>
                <span class="font-bold text-slate-900 font-mono">${formatCurrency(deposit)}</span>
              </div>
              <p class="text-[11px] text-slate-600 leading-relaxed">
                <strong>Depósito reembolsable:</strong> No se factura como ingreso ni se cobra definitivamente. Se retiene en custodia temporal como preautorización y <strong>se devuelve al 100%</strong> dentro de las 24h tras la devolución del equipo e inspección sin daños imputables.
              </p>
            </div>
          </div>

          <!-- Checkout Action Button -->
          <button 
            id="btn-proceed-checkout" 
            ${!isAvailable || isCheckingAvailability ? 'disabled' : ''} 
            class="btn-primary w-full !py-3 text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ${renderIcon('CreditCard', 'w-4 h-4')} Continuar al Pago (${formatCurrency(total)})
          </button>
        </div>

        <!-- 04. Bottom Section: Compact Benefit Pills & Expandable Full Coverage Details -->
        <div class="col-span-1 lg:col-span-12 border-t border-slate-200/80 pt-3.5 mt-0.5 space-y-3">
          
          <!-- Compact Benefits Bar (Pills con micro-iconos discretos) -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2 text-slate-700">
              <div class="w-6 h-6 rounded-md bg-orange-100 text-[#ea580c] flex items-center justify-center flex-shrink-0">
                ${renderIcon('Wrench', 'w-3.5 h-3.5')}
              </div>
              <div class="leading-tight">
                <div class="font-bold text-slate-900 text-[11px]">Calibrado al 100%</div>
                <div class="text-[10px] text-slate-500">Probado en banco previo</div>
              </div>
            </div>

            <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2 text-slate-700">
              <div class="w-6 h-6 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                ${renderIcon('RefreshCw', 'w-3.5 h-3.5')}
              </div>
              <div class="leading-tight">
                <div class="font-bold text-slate-900 text-[11px]">Sustitución en 24h</div>
                <div class="text-[10px] text-slate-500">Sin costo por falla técnica</div>
              </div>
            </div>

            <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2 text-slate-700">
              <div class="w-6 h-6 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                ${renderIcon('Coins', 'w-3.5 h-3.5')}
              </div>
              <div class="leading-tight">
                <div class="font-bold text-slate-900 text-[11px]">100% Reembolsable</div>
                <div class="text-[10px] text-slate-500">Garantía liberada en 24h</div>
              </div>
            </div>

            <div class="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-2 text-slate-700">
              <div class="w-6 h-6 rounded-md bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                ${renderIcon('FileText', 'w-3.5 h-3.5')}
              </div>
              <div class="leading-tight">
                <div class="font-bold text-slate-900 text-[11px]">Factura DIAN y Acta</div>
                <div class="text-[10px] text-slate-500">IVA 19% y validez legal</div>
              </div>
            </div>
          </div>

          <!-- Accordion Toggle Button for Full Details & Conditions -->
          <div class="border border-slate-200 rounded-xl overflow-hidden bg-white">
            <button 
              id="btn-toggle-conditions" 
              type="button" 
              class="w-full px-3.5 py-2 flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50/80 transition-colors"
            >
              <span class="flex items-center gap-2">
                ${renderIcon('ShieldCheck', 'w-4 h-4 text-emerald-600')}
                <span>¿Qué incluye este servicio y cuáles son las condiciones de devolución y cobro?</span>
              </span>
              <span id="accordion-arrow" class="text-slate-400 font-bold transition-transform duration-200 ${isDetailsExpanded ? 'rotate-180' : ''}">
                ${renderIcon('ChevronDown', 'w-4 h-4')}
              </span>
            </button>

            <!-- Collapsible Content -->
            <div id="conditions-accordion-body" class="${isDetailsExpanded ? 'block' : 'hidden'} p-3.5 bg-slate-50/50 border-t border-slate-200 space-y-3 text-xs">
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div class="p-3 bg-white border border-slate-200/90 rounded-lg space-y-1">
                  <div class="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    ${renderIcon('Wrench', 'w-3.5 h-3.5 text-[#ea580c]')} Protocolo de Calibración
                  </div>
                  <p class="text-[11px] text-slate-600 leading-relaxed">
                    Antes del despacho, el proveedor verifica tensión eléctrica, lubricación, afilado y elementos de seguridad en banco. Se genera un acta con fotos iniciales de estado del equipo.
                  </p>
                </div>

                <div class="p-3 bg-white border border-slate-200/90 rounded-lg space-y-1">
                  <div class="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    ${renderIcon('RefreshCw', 'w-3.5 h-3.5 text-blue-600')} Garantía de Sustitución en Obra
                  </div>
                  <p class="text-[11px] text-slate-600 leading-relaxed">
                    Si el equipo presenta fallo operacional o desgaste normal, el proveedor entrega una unidad equivalente en menos de 24 horas sin costo extra para evitar retrasos en el proyecto.
                  </p>
                </div>

                <div class="p-3 bg-white border border-slate-200/90 rounded-lg space-y-1">
                  <div class="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    ${renderIcon('Coins', 'w-3.5 h-3.5 text-emerald-600')} Política de Garantía y Descuentos
                  </div>
                  <p class="text-[11px] text-slate-600 leading-relaxed">
                    <strong>Cuándo se devuelve:</strong> 100% reembolsado a las 24h del check-out.<br>
                    <strong>Cuándo se descuenta:</strong> Solo si el acta de retorno constata rotura por negligencia o extravío de accesorios. El desgaste normal de uso nunca se descuenta.
                  </p>
                </div>

                <div class="p-3 bg-white border border-slate-200/90 rounded-lg space-y-1">
                  <div class="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    ${renderIcon('FileText', 'w-3.5 h-3.5 text-purple-600')} Facturación Tributaria DIAN
                  </div>
                  <p class="text-[11px] text-slate-600 leading-relaxed">
                    El servicio de arrendamiento de maquinaria y equipo está gravado con IVA 19% conforme al Estatuto Tributario. Se emite factura electrónica con CUFE deducible y contrato digital con firma de entrega.
                  </p>
                </div>
              </div>

              <!-- Workflow Banner -->
              <div class="bg-white border border-slate-200/90 rounded-lg p-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                <div class="flex items-center gap-2">
                  <div class="w-5 h-5 rounded-full bg-[#ea580c] text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0">1</div>
                  <div>
                    <span class="font-bold text-slate-900">1. Reserva Online</span>
                    <p class="text-[10px] text-slate-500">Bloqueas fechas con pago y custodia cifrada</p>
                  </div>
                </div>
                <div class="hidden sm:block text-slate-300 font-bold">→</div>
                <div class="flex items-center gap-2">
                  <div class="w-5 h-5 rounded-full bg-[#ea580c] text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0">2</div>
                  <div>
                    <span class="font-bold text-slate-900">2. Entrega con Acta Digital</span>
                    <p class="text-[10px] text-slate-500">Inspección con fotos de check-in del equipo</p>
                  </div>
                </div>
                <div class="hidden sm:block text-slate-300 font-bold">→</div>
                <div class="flex items-center gap-2">
                  <div class="w-5 h-5 rounded-full bg-[#ea580c] text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0">3</div>
                  <div>
                    <span class="font-bold text-slate-900">3. Retorno y Liberación</span>
                    <p class="text-[10px] text-slate-500">Check-out y reintegro del 100% del depósito</p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    `;

    // Event handlers
    const startInput = content.querySelector('#rental-start-date');
    const endInput = content.querySelector('#rental-end-date');

    startInput.addEventListener('change', (e) => {
      startDate = e.target.value;
      if (endDate < startDate) {
        endDate = startDate;
        endInput.value = startDate;
      }
      endInput.min = startDate;
      checkAvailability();
    });

    endInput.addEventListener('change', (e) => {
      endDate = e.target.value;
      checkAvailability();
    });

    content.querySelector('#btn-toggle-conditions')?.addEventListener('click', () => {
      isDetailsExpanded = !isDetailsExpanded;
      const body = content.querySelector('#conditions-accordion-body');
      const arrow = content.querySelector('#accordion-arrow');
      if (body) {
        body.classList.toggle('hidden', !isDetailsExpanded);
        body.classList.toggle('block', isDetailsExpanded);
      }
      if (arrow) {
        arrow.classList.toggle('rotate-180', isDetailsExpanded);
      }
    });

    content.querySelector('#btn-proceed-checkout')?.addEventListener('click', () => {
      openCheckoutModal(tool, { startDate, endDate, ...calculateCosts() });
    });
  }

  function updateCalculationUI() {
    renderView();
  }

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
            <label class="block text-[11px] font-semibold text-slate-600 mb-1">Número de Tarjeta (Simulado)</label>
            <input type="text" maxlength="19" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800" value="4532 •••• •••• 8892" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-semibold text-slate-600 mb-1">Vencimiento</label>
              <input type="text" maxlength="5" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800" value="12/28" />
            </div>
            <div>
              <label class="block text-[11px] font-semibold text-slate-600 mb-1">CVC / CVV</label>
              <input type="password" maxlength="4" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800" value="892" />
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
              <input type="email" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-brand-500" value="${auth.getUser()?.email || 'cliente@toolrent.com'}" />
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
            <label class="block text-[11px] font-semibold text-slate-600 mb-1">Número de Comprobante / Transacción</label>
            <input type="text" id="transfer-ref" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800" value="TRF-${Date.now().toString().slice(-6)}" />
          </div>
        </div>
      `;
    }
  }

  content.innerHTML = `
    <div class="space-y-4">
      <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
        <div class="flex items-start justify-between gap-3">
          <div>
            <span class="text-slate-500">Equipo:</span> <strong class="text-slate-900">${tool.name}</strong>
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
          <span>Subtotal: ${formatCurrency(rentalData.subtotal)} + IVA (19%): ${formatCurrency(rentalData.tax)}</span>
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
        if (icon) icon.className = 'w-5 h-5 text-slate-600';
      });

      card.className = 'payment-method-card p-3 rounded-xl border border-brand-500 bg-orange-50/20 cursor-pointer flex flex-col items-center text-center gap-1.5 transition-all';
      const activeIcon = card.querySelector('svg');
      if (activeIcon) activeIcon.className = 'w-5 h-5 text-brand-600';

      fieldsContainer.innerHTML = renderPaymentFields(currentMethod);
    });
  });

  content.querySelector('#btn-confirm-payment').addEventListener('click', async () => {
    const btn = content.querySelector('#btn-confirm-payment');
    const errBox = content.querySelector('#checkout-error');
    errBox.classList.add('hidden');
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
          toolIds: [tool.id]
        };
        pendingRental = await api.post('/rentals', rentalPayload);
      }

      // 2. Determine official billed amount matching backend invoice (subtotal * 1.19)
      const subtotalNum = Number(pendingRental.subtotal ?? rentalData.subtotal ?? 0);
      const billedAmount = subtotalNum > 0 ? Math.round(subtotalNum * 1.19) : Math.round(rentalData.total);

      // 3. Process payment
      const paymentPayload = {
        rentalId: pendingRental.id,
        amount: billedAmount,
        paymentMethod: method,
        referenceNumber: `PAY-ONLINE-${Date.now().toString().slice(-6)}`
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
      <div id="printable-invoice-sheet" class="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 sm:p-14 space-y-8 font-sans text-slate-800">
        
        <!-- Header -->
        <div class="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div class="flex items-start gap-3">
            ${renderToolRentMark('w-10 h-10')}
            <div>
              <span class="text-2xl font-bold tracking-tight text-slate-900 font-display">ToolRent</span>
              <p class="text-xs text-slate-500 mt-0.5">Herramientas y maquinaria para construir grandes proyectos</p>
            </div>
          </div>

          <div class="sm:text-right">
            <div class="text-xs text-slate-400 font-medium">Factura de alquiler</div>
            <div class="text-xl font-bold text-slate-900 font-display">N° ${invoice.invoiceNumber || 'TR-0004587'}</div>
            <div class="text-[11px] text-slate-500 mt-1">Fecha de emisión: ${invoice.issueDate || '13 oct 2026'}</div>
            <div class="text-[11px] text-slate-500">Fecha de vencimiento: ${invoice.issueDate || '13 oct 2026'}</div>
          </div>
        </div>

        <!-- Orange Line Divider -->
        <div class="border-t-2 border-brand-500"></div>

        <!-- Client & Provider Two Columns -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
          <!-- Datos del cliente -->
          <div class="space-y-2">
            <h4 class="font-bold text-slate-900 text-sm mb-3">Datos del cliente</h4>
            <div class="grid grid-cols-3 gap-2">
              <span class="text-slate-400">Nombre:</span>
              <span class="col-span-2 font-semibold text-slate-800">${invoice.client.name}</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <span class="text-slate-400">Cédula / NIT:</span>
              <span class="col-span-2 text-slate-700 font-mono">${invoice.client.taxId}</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <span class="text-slate-400">Correo:</span>
              <span class="col-span-2 text-slate-700">${invoice.client.email}</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <span class="text-slate-400">Teléfono:</span>
              <span class="col-span-2 text-slate-700">${invoice.client.phone}</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <span class="text-slate-400">Dirección:</span>
              <span class="col-span-2 text-slate-700">${invoice.client.address}</span>
            </div>
          </div>

          <!-- Datos del proveedor -->
          <div class="space-y-2">
            <h4 class="font-bold text-slate-900 text-sm mb-3">Datos del proveedor</h4>
            <div class="grid grid-cols-3 gap-2">
              <span class="text-slate-400">Nombre:</span>
              <span class="col-span-2 font-semibold text-slate-800">${invoice.provider.name}</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <span class="text-slate-400">NIT:</span>
              <span class="col-span-2 text-slate-700 font-mono">${invoice.provider.taxId}</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <span class="text-slate-400">Correo:</span>
              <span class="col-span-2 text-slate-700">${invoice.provider.email}</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <span class="text-slate-400">Teléfono:</span>
              <span class="col-span-2 text-slate-700">${invoice.provider.phone}</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <span class="text-slate-400">Dirección:</span>
              <span class="col-span-2 text-slate-700">${invoice.provider.address}</span>
            </div>
          </div>
        </div>

        <!-- Equipos alquilados Table -->
        <div>
          <h4 class="font-bold text-slate-900 text-sm mb-4">Equipos alquilados</h4>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th class="py-2.5 pr-4 w-8">#</th>
                  <th class="py-2.5 px-4">Herramienta / Equipo</th>
                  <th class="py-2.5 px-4 text-center">Días</th>
                  <th class="py-2.5 px-4 text-right">Precio diario</th>
                  <th class="py-2.5 pl-4 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">
                ${invoice.items.map((it, idx) => `
                  <tr>
                    <td class="py-3 pr-4 text-slate-400 font-bold">${idx + 1}</td>
                    <td class="py-3 px-4 font-semibold text-slate-900">${it.name}</td>
                    <td class="py-3 px-4 text-center">${it.days}</td>
                    <td class="py-3 px-4 text-right font-medium">${formatCurrency(it.dailyPrice)}</td>
                    <td class="py-3 pl-4 text-right font-bold text-slate-900">${formatCurrency(it.subtotal)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Totals Breakdown -->
          <div class="flex justify-end pt-6 border-t border-slate-200">
            <div class="w-64 space-y-2 text-xs">
              <div class="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span class="font-semibold text-slate-800">${formatCurrency(invoice.subtotal)}</span>
              </div>
              <div class="flex justify-between text-slate-600">
                <span>IVA (19%)</span>
                <span class="font-semibold text-slate-800">${formatCurrency(invoice.tax)}</span>
              </div>
              <div class="border-t border-slate-200 pt-2 flex justify-between items-baseline">
                <span class="text-sm font-bold text-slate-900">Total</span>
                <span class="text-xl font-bold text-slate-900">${formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Información de pago -->
        <div class="border-t border-slate-200 pt-6">
          <h4 class="font-bold text-slate-900 text-sm mb-3">Información de pago</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div class="grid grid-cols-3 gap-2">
              <span class="text-slate-400">Método de pago:</span>
              <span class="col-span-2 text-slate-800 font-medium">${invoice.paymentMethod}</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <span class="text-slate-400">Entidad:</span>
              <span class="col-span-2 text-slate-800 font-medium">${invoice.bank}</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <span class="text-slate-400">Referencia:</span>
              <span class="col-span-2 text-slate-800 font-mono font-medium">${invoice.reference}</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <span class="text-slate-400">Fecha de pago:</span>
              <span class="col-span-2 text-slate-800 font-medium">${invoice.paymentDate}</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="border-t border-slate-200 pt-6 text-center space-y-2 text-[11px] text-slate-400">
          <p>ToolRent · NIT 901.234.567-8 · Av. 27 # 45-12, Floridablanca, Santander · contacto@toolrent.com · +57 317 654 3210</p>
          <p class="text-[10px]">Esta factura es un comprobante de alquiler de herramientas y maquinaria. No constituye una venta. Gracias por confiar en ToolRent.</p>
        </div>

      </div>

    </div>
  `;

  content.querySelector('#invoice-btn-back')?.addEventListener('click', () => {
    modal.close();
  });

  content.querySelector('#invoice-btn-download')?.addEventListener('click', () => {
    showToast('Descargando factura en formato PDF oficial...', 'success');
  });

  content.querySelector('#invoice-btn-print')?.addEventListener('click', () => {
    window.print();
  });

  modal.open({
    title: '',
    content: content,
    maxWidth: 'max-w-5xl',
    hideHeader: true
  });
}

export default openRentalModal;
