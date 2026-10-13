import api from '../api/client.js';
import auth from '../auth/state.js';
import modal from '../components/modal.js';
import showToast from '../components/toast.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { renderIcon } from '../utils/icons.js';
import { openAuthModal } from '../components/auth-modal.js';

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
  let bookedRanges = [];

  const content = document.createElement('div');
  content.className = 'space-y-6';

  async function checkAvailability() {
    isCheckingAvailability = true;
    updateCalculationUI();

    try {
      const res = await api.get(`/tools/${tool.id}/availability`, {
        from: startDate,
        to: endDate
      });
      isAvailable = res.available;
      bookedRanges = res.bookedDateRanges || [];
    } catch (err) {
      console.warn('Could not verify availability online', err);
      isAvailable = true; // fallback
    } finally {
      isCheckingAvailability = false;
      updateCalculationUI();
    }
  }

  function calculateCosts() {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.max(0, end - start);
    const days = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    const dailyPrice = tool.dailyPrice || 0;
    const subtotal = days * dailyPrice;
    const tax = subtotal * 0.19; // 19% IVA
    const deposit = (tool.replacementValue || 0) * 0.10; // 10% depósito de garantía
    const total = subtotal + tax;

    return { days, subtotal, tax, deposit, total };
  }

  function renderView() {
    const primaryImg = tool.images?.find(img => img.isPrimary)?.imageUrl || tool.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=60';
    const { days, subtotal, tax, deposit, total } = calculateCosts();

    content.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <!-- Left: Tool Info -->
        <div class="space-y-4">
          <div class="relative h-44 rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
            <img src="${primaryImg}" alt="${tool.name}" class="w-full h-full object-cover" />
            <div class="absolute top-2.5 left-2.5 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-semibold text-brand-400 border border-slate-800">
              ${tool.brand || 'Industrial'} · ${tool.model || 'Standard'}
            </div>
          </div>

          <div>
            <h4 class="text-base font-bold text-white font-display">${tool.name}</h4>
            <p class="text-xs text-slate-400 line-clamp-2 mt-1">${tool.description || 'Equipo de alta resistencia para uso profesional.'}</p>
          </div>

          <div class="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2 text-xs">
            <div class="flex justify-between text-slate-400">
              <span>Tarifa por Día:</span>
              <strong class="text-brand-400 font-semibold">${formatCurrency(tool.dailyPrice)}</strong>
            </div>
            <div class="flex justify-between text-slate-400">
              <span>Valor de Reposición:</span>
              <strong class="text-slate-200">${formatCurrency(tool.replacementValue)}</strong>
            </div>
            <div class="flex justify-between text-slate-400">
              <span>Depósito Reembolsable (10%):</span>
              <strong class="text-slate-200">${formatCurrency(deposit)}</strong>
            </div>
          </div>
        </div>

        <!-- Right: Date Selector & Breakdown -->
        <div class="space-y-4">
          <div class="space-y-3">
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-300">
              ${renderIcon('Calendar', 'w-4 h-4 inline mr-1 text-brand-400')} Período de Alquiler
            </label>
            
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] text-slate-400 mb-1" for="rental-start-date">Fecha Inicio</label>
                <input type="date" id="rental-start-date" value="${startDate}" min="${formatDateInput(new Date())}" class="input-field text-xs" />
              </div>
              <div>
                <label class="block text-[11px] text-slate-400 mb-1" for="rental-end-date">Fecha Fin</label>
                <input type="date" id="rental-end-date" value="${endDate}" min="${startDate}" class="input-field text-xs" />
              </div>
            </div>

            <!-- Availability Status Alert -->
            <div id="availability-alert" class="p-2.5 rounded-xl text-xs font-medium transition-all">
              ${isCheckingAvailability ? `
                <div class="text-slate-400 flex items-center gap-2">
                  ${renderIcon('Loader2', 'w-4 h-4 animate-spin text-brand-400')} Verificando disponibilidad de fechas...
                </div>
              ` : isAvailable ? `
                <div class="text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 p-2.5 rounded-xl flex items-center gap-2">
                  ${renderIcon('CheckCircle2', 'w-4 h-4 text-emerald-400 flex-shrink-0')}
                  <span>Equipo disponible para las fechas seleccionadas (${days} días).</span>
                </div>
              ` : `
                <div class="text-rose-300 bg-rose-950/60 border border-rose-500/30 p-2.5 rounded-xl flex items-start gap-2">
                  ${renderIcon('AlertCircle', 'w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5')}
                  <div>
                    <span class="font-bold">No disponible en estas fechas.</span>
                    <p class="text-[11px] text-rose-200/80 mt-0.5">El equipo ya tiene un alquiler reservado en ese intervalo. Por favor selecciona otras fechas.</p>
                  </div>
                </div>
              `}
            </div>
          </div>

          <!-- Price Summary Breakdown -->
          <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
            <div class="flex justify-between text-slate-400">
              <span>Alquiler (${days} días × ${formatCurrency(tool.dailyPrice)}):</span>
              <span class="text-slate-200 font-medium">${formatCurrency(subtotal)}</span>
            </div>
            <div class="flex justify-between text-slate-400">
              <span>IVA Legal (19%):</span>
              <span class="text-slate-200 font-medium">${formatCurrency(tax)}</span>
            </div>
            <div class="border-t border-slate-800 pt-2 flex justify-between items-baseline">
              <span class="text-sm font-bold text-white">Total a Pagar:</span>
              <span class="text-lg font-extrabold text-brand-400 font-display">${formatCurrency(total)}</span>
            </div>
          </div>

          <!-- Action Buttons -->
          <button id="btn-proceed-checkout" ${!isAvailable || isCheckingAvailability ? 'disabled' : ''} class="btn-primary w-full !py-3">
            ${renderIcon('CreditCard', 'w-4 h-4')} Continuar al Pago (${formatCurrency(total)})
          </button>
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

    content.querySelector('#btn-proceed-checkout')?.addEventListener('click', () => {
      openCheckoutModal(tool, { startDate, endDate, ...calculateCosts() });
    });
  }

  function updateCalculationUI() {
    renderView();
  }

  // Initial check
  checkAvailability();

  modal.open({
    title: `${renderIcon('Clock', 'w-5 h-5 text-brand-400')} Reservar Herramienta: ${tool.name}`,
    content: content,
    maxWidth: 'max-w-3xl',
  });
}

/**
 * Step 2: Payment and Invoice Generation
 */
async function openCheckoutModal(tool, rentalData) {
  const content = document.createElement('div');
  content.className = 'space-y-6';

  content.innerHTML = `
    <div class="space-y-4">
      <div class="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
        <div>
          <span class="text-slate-400">Equipo:</span> <strong class="text-white">${tool.name}</strong>
          <div class="text-[11px] text-slate-400 mt-0.5">Desde ${formatDate(rentalData.startDate)} hasta ${formatDate(rentalData.endDate)} (${rentalData.days} días)</div>
        </div>
        <div class="text-right">
          <div class="text-xs text-slate-400">Total</div>
          <div class="text-base font-bold text-brand-400 font-display">${formatCurrency(rentalData.total)}</div>
        </div>
      </div>

      <!-- Payment Method Selection -->
      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">Selecciona Método de Pago</label>
        <div class="grid grid-cols-3 gap-2.5">
          <label class="p-3 rounded-xl border border-slate-700 bg-slate-900/60 cursor-pointer hover:border-brand-500 transition-colors flex flex-col items-center text-center gap-1.5">
            <input type="radio" name="payment-method" value="CREDIT_CARD" checked class="text-brand-500">
            ${renderIcon('CreditCard', 'w-5 h-5 text-brand-400')}
            <span class="text-xs font-semibold text-slate-200">Tarjeta Crédito</span>
          </label>
          <label class="p-3 rounded-xl border border-slate-700 bg-slate-900/60 cursor-pointer hover:border-brand-500 transition-colors flex flex-col items-center text-center gap-1.5">
            <input type="radio" name="payment-method" value="DEBIT_CARD" class="text-brand-500">
            ${renderIcon('Wallet', 'w-5 h-5 text-indigo-400')}
            <span class="text-xs font-semibold text-slate-200">PSE / Débito</span>
          </label>
          <label class="p-3 rounded-xl border border-slate-700 bg-slate-900/60 cursor-pointer hover:border-brand-500 transition-colors flex flex-col items-center text-center gap-1.5">
            <input type="radio" name="payment-method" value="BANK_TRANSFER" class="text-brand-500">
            ${renderIcon('Building2', 'w-5 h-5 text-emerald-400')}
            <span class="text-xs font-semibold text-slate-200">Transferencia</span>
          </label>
        </div>
      </div>

      <!-- Simulated Card Form -->
      <div class="space-y-3 p-4 rounded-xl bg-slate-900/80 border border-slate-800">
        <div>
          <label class="block text-[11px] text-slate-400 mb-1">Número de Tarjeta (Simulado)</label>
          <input type="text" class="input-field text-xs font-mono" value="4532 •••• •••• 8892" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] text-slate-400 mb-1">Vencimiento</label>
            <input type="text" class="input-field text-xs font-mono" value="12/28" />
          </div>
          <div>
            <label class="block text-[11px] text-slate-400 mb-1">CVC / CVV</label>
            <input type="password" class="input-field text-xs font-mono" value="892" />
          </div>
        </div>
      </div>

      <div id="checkout-error" class="hidden text-xs text-rose-400 bg-rose-950/50 border border-rose-900 p-2.5 rounded-xl"></div>

      <button id="btn-confirm-payment" class="btn-primary w-full !py-3">
        ${renderIcon('Lock', 'w-4 h-4')} Confirmar y Pagar ${formatCurrency(rentalData.total)}
      </button>
    </div>
  `;

  content.querySelector('#btn-confirm-payment').addEventListener('click', async () => {
    const btn = content.querySelector('#btn-confirm-payment');
    const errBox = content.querySelector('#checkout-error');
    errBox.classList.add('hidden');
    btn.disabled = true;
    btn.innerHTML = `${renderIcon('Loader2', 'w-4 h-4 animate-spin inline mr-1.5')} Procesando pago seguro...`;

    try {
      const user = auth.getUser();
      const method = content.querySelector('input[name="payment-method"]:checked')?.value || 'CREDIT_CARD';

      // 1. Create Rental in Backend
      const rentalPayload = {
        clientId: user.profile?.id || user.id,
        startDate: rentalData.startDate,
        endDate: rentalData.endDate,
        toolIds: [tool.id]
      };

      const createdRental = await api.post('/rentals', rentalPayload);

      // 2. Process simulated payment
      const paymentPayload = {
        rentalId: createdRental.id,
        amount: rentalData.total,
        paymentMethod: method,
        referenceNumber: `PAY-ONLINE-${Date.now().toString().slice(-6)}`
      };

      const paymentResult = await api.post('/billing/payments', paymentPayload);

      // 3. Show Success State
      showSuccessModal(createdRental, paymentResult);

    } catch (err) {
      errBox.textContent = err.message || 'Error al procesar la reserva o el pago.';
      errBox.classList.remove('hidden');
      btn.disabled = false;
      btn.innerHTML = `${renderIcon('Lock', 'w-4 h-4')} Confirmar y Pagar ${formatCurrency(rentalData.total)}`;
    }
  });

  modal.open({
    title: `${renderIcon('ShieldCheck', 'w-5 h-5 text-emerald-400')} Pasarela de Pago Segura`,
    content: content,
    maxWidth: 'max-w-md',
  });
}

/**
 * Step 3: Success and Printable Invoice View
 */
function showSuccessModal(rental, payment) {
  const content = document.createElement('div');
  content.className = 'text-center space-y-5 py-2';

  const invoiceId = payment?.invoiceId;

  content.innerHTML = `
    <div class="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
      ${renderIcon('CheckCircle2', 'w-8 h-8')}
    </div>

    <div>
      <h3 class="text-lg font-bold text-white font-display">¡Reserva y Pago Exitosos!</h3>
      <p class="text-xs text-slate-400 mt-1">
        Tu solicitud ha sido radicada y pagada correctamente con el código 
        <strong class="text-white font-mono">${rental.id.substring(0, 8)}...</strong>
      </p>
    </div>

    <div class="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-left space-y-1.5">
      <div class="flex justify-between"><span class="text-slate-400">Estado:</span> <span class="badge-pending">Pendiente de Despacho</span></div>
      <div class="flex justify-between"><span class="text-slate-400">Transacción Pago:</span> <strong class="text-emerald-400 font-mono">${payment?.id ? payment.id.substring(0, 8) : 'Aprobada'}</strong></div>
      <div class="flex justify-between"><span class="text-slate-400">Total Abonado:</span> <strong class="text-white font-medium">${formatCurrency(payment?.amount)}</strong></div>
    </div>

    <div class="flex flex-col gap-2.5 pt-2">
      ${invoiceId ? `
        <a href="http://localhost:8085/api/v1/billing/invoices/${invoiceId}/html" target="_blank" rel="noopener noreferrer" class="btn-primary w-full justify-center !py-2.5">
          ${renderIcon('Printer', 'w-4 h-4')} Ver / Imprimir Factura Legal (HTML)
        </a>
      ` : ''}
      <button id="btn-goto-my-rentals" class="btn-secondary w-full justify-center !py-2.5">
        ${renderIcon('Calendar', 'w-4 h-4')} Ir a Mis Alquileres
      </button>
    </div>
  `;

  content.querySelector('#btn-goto-my-rentals').addEventListener('click', () => {
    modal.close();
    window.location.hash = '#/client';
  });

  modal.open({
    title: 'Comprobante de Transacción',
    content: content,
    maxWidth: 'max-w-md',
  });
}
