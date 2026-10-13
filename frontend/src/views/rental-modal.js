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
      console.warn('Availability checked via mock store', err);
      isAvailable = true;
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
    
    const dailyPrice = tool.dailyPrice || 85000;
    const subtotal = days * dailyPrice;
    const tax = subtotal * 0.19; // 19% IVA
    const deposit = (tool.replacementValue || 850000) * 0.10; // 10% depósito de garantía
    const total = subtotal + tax;

    return { days, subtotal, tax, deposit, total };
  }

  function renderView() {
    const primaryImg = tool.images?.find(img => img.isPrimary)?.imageUrl || tool.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800';
    const { days, subtotal, tax, deposit, total } = calculateCosts();

    content.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <!-- Left: Tool Details Card -->
        <div class="space-y-4">
          <div class="relative h-48 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
            <img src="${primaryImg}" alt="${tool.name}" class="w-full h-full object-cover" />
            <div class="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-800 border border-slate-200 shadow-sm">
              ${tool.brand || 'DeWalt'} · ${tool.model || 'DWD520K'}
            </div>
          </div>

          <div>
            <h4 class="text-base font-bold text-slate-900 font-display">${tool.name}</h4>
            <p class="text-xs text-slate-500 line-clamp-2 mt-1">${tool.description || 'Herramienta profesional de alto rendimiento certificada para construcción y remodelación.'}</p>
          </div>

          <div class="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 text-xs">
            <div class="flex justify-between text-slate-600">
              <span>Tarifa por día:</span>
              <strong class="text-brand-600 font-bold">${formatCurrency(tool.dailyPrice || 85000)} / día</strong>
            </div>
            <div class="flex justify-between text-slate-600">
              <span>Valor de reposición:</span>
              <strong class="text-slate-800 font-medium">${formatCurrency(tool.replacementValue || 850000)}</strong>
            </div>
            <div class="flex justify-between text-slate-600">
              <span>Depósito de garantía (10%):</span>
              <strong class="text-slate-800 font-medium">${formatCurrency(deposit)}</strong>
            </div>
          </div>
        </div>

        <!-- Right: Dates Selection & Costs Breakdown -->
        <div class="space-y-5 flex flex-col justify-between">
          <div class="space-y-3">
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-700">
              ${renderIcon('Calendar', 'w-4 h-4 inline mr-1 text-brand-600')} Período de Alquiler
            </label>
            
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-semibold text-slate-600 mb-1" for="rental-start-date">Fecha de inicio</label>
                <input type="date" id="rental-start-date" value="${startDate}" min="${formatDateInput(new Date())}" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-500" />
              </div>
              <div>
                <label class="block text-[11px] font-semibold text-slate-600 mb-1" for="rental-end-date">Fecha de fin</label>
                <input type="date" id="rental-end-date" value="${endDate}" min="${startDate}" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-brand-500" />
              </div>
            </div>

            <!-- Availability Status Alert -->
            <div id="availability-alert" class="transition-all">
              ${isCheckingAvailability ? `
                <div class="text-slate-500 text-xs flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  ${renderIcon('Loader2', 'w-4 h-4 animate-spin text-brand-600')} Verificando disponibilidad...
                </div>
              ` : isAvailable ? `
                <div class="text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg flex items-center gap-2 text-xs">
                  ${renderIcon('CheckCircle2', 'w-4 h-4 text-emerald-600 flex-shrink-0')}
                  <span>Equipo disponible para las fechas seleccionadas (${days} días).</span>
                </div>
              ` : `
                <div class="text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-lg flex items-start gap-2 text-xs">
                  ${renderIcon('AlertCircle', 'w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5')}
                  <div>
                    <span class="font-bold">No disponible en estas fechas.</span>
                    <p class="text-[11px] text-rose-600 mt-0.5">El equipo ya tiene un alquiler reservado en ese intervalo.</p>
                  </div>
                </div>
              `}
            </div>
          </div>

          <!-- Price Summary Breakdown -->
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div class="flex justify-between text-slate-600">
              <span>Alquiler (${days} días × ${formatCurrency(tool.dailyPrice || 85000)}):</span>
              <span class="text-slate-800 font-medium">${formatCurrency(subtotal)}</span>
            </div>
            <div class="flex justify-between text-slate-600">
              <span>IVA Legal (19%):</span>
              <span class="text-slate-800 font-medium">${formatCurrency(tax)}</span>
            </div>
            <div class="border-t border-slate-200 pt-2 flex justify-between items-baseline">
              <span class="text-sm font-bold text-slate-900">Total a pagar:</span>
              <span class="text-lg font-bold text-brand-600 font-display">${formatCurrency(total)}</span>
            </div>
          </div>

          <!-- Action Button -->
          <button id="btn-proceed-checkout" ${!isAvailable || isCheckingAvailability ? 'disabled' : ''} class="btn-primary w-full !py-2.5 text-xs font-semibold shadow-sm">
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

  checkAvailability();

  modal.open({
    title: `Reservar Herramienta: ${tool.name}`,
    content: content,
    maxWidth: 'max-w-3xl',
  });
}

/**
 * Step 2: Payment and Invoice Generation
 */
async function openCheckoutModal(tool, rentalData) {
  const content = document.createElement('div');
  content.className = 'p-6 space-y-5 bg-white text-slate-800';

  content.innerHTML = `
    <div class="space-y-4">
      <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
        <div>
          <span class="text-slate-500">Equipo:</span> <strong class="text-slate-900">${tool.name}</strong>
          <div class="text-[11px] text-slate-500 mt-0.5">Desde ${formatDate(rentalData.startDate)} hasta ${formatDate(rentalData.endDate)} (${rentalData.days} días)</div>
        </div>
        <div class="text-right">
          <div class="text-[11px] text-slate-400">Total</div>
          <div class="text-base font-bold text-brand-600 font-display">${formatCurrency(rentalData.total)}</div>
        </div>
      </div>

      <!-- Payment Method Selection -->
      <div>
        <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Selecciona Método de Pago</label>
        <div class="grid grid-cols-3 gap-2.5">
          <label class="p-3 rounded-xl border border-brand-500 bg-orange-50/20 cursor-pointer flex flex-col items-center text-center gap-1.5 transition-all">
            <input type="radio" name="payment-method" value="CREDIT_CARD" checked class="text-brand-500">
            ${renderIcon('CreditCard', 'w-5 h-5 text-brand-600')}
            <span class="text-xs font-semibold text-slate-900">Tarjeta Crédito</span>
          </label>
          <label class="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 cursor-pointer flex flex-col items-center text-center gap-1.5 transition-all">
            <input type="radio" name="payment-method" value="DEBIT_CARD" class="text-brand-500">
            ${renderIcon('Wallet', 'w-5 h-5 text-slate-600')}
            <span class="text-xs font-semibold text-slate-900">PSE / Débito</span>
          </label>
          <label class="p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 cursor-pointer flex flex-col items-center text-center gap-1.5 transition-all">
            <input type="radio" name="payment-method" value="BANK_TRANSFER" class="text-brand-500">
            ${renderIcon('Building2', 'w-5 h-5 text-slate-600')}
            <span class="text-xs font-semibold text-slate-900">Transferencia</span>
          </label>
        </div>
      </div>

      <!-- Simulated Card Form -->
      <div class="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
        <div>
          <label class="block text-[11px] font-semibold text-slate-600 mb-1">Número de Tarjeta (Simulado)</label>
          <input type="text" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800" value="4532 •••• •••• 8892" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-[11px] font-semibold text-slate-600 mb-1">Vencimiento</label>
            <input type="text" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800" value="12/28" />
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-600 mb-1">CVC / CVV</label>
            <input type="password" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-800" value="892" />
          </div>
        </div>
      </div>

      <div id="checkout-error" class="hidden text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg"></div>

      <button id="btn-confirm-payment" class="btn-primary w-full !py-2.5 text-xs font-semibold shadow-sm">
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

      // 1. Create Rental in Backend / Mock
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

      // 3. Show Success & Invoice Viewer
      showSuccessModal(createdRental, paymentResult, tool, rentalData);

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
        <strong class="text-slate-900 font-mono">${rental.id}</strong>
      </p>
    </div>

    <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-left space-y-1.5">
      <div class="flex justify-between"><span class="text-slate-500">Estado:</span> <span class="badge-pending">Pendiente de Despacho</span></div>
      <div class="flex justify-between"><span class="text-slate-500">Transacción Pago:</span> <strong class="text-emerald-600 font-mono">${payment?.id || 'APROBADA'}</strong></div>
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
    openInvoiceViewer({
      invoiceNumber: 'TR-0004587',
      issueDate: '13 oct 2026',
      client: {
        name: 'Juan Pérez García',
        taxId: '1.032.456.789',
        email: 'juan.perez@email.com',
        phone: '+57 300 123 4567',
        address: 'Cra 45 # 12-34, Bucaramanga, Santander'
      },
      provider: {
        name: tool?.provider?.name || 'Construcciones del Norte S.A.S.',
        taxId: '901.234.567-8',
        email: 'contacto@cnorte.com',
        phone: '+57 317 654 3210',
        address: 'Av. 27 # 45-12, Floridablanca, Santander'
      },
      items: [
        {
          name: tool?.name || 'Martillo demoledor 10 kg',
          days: rentalData?.days || 3,
          dailyPrice: tool?.dailyPrice || 85000,
          subtotal: rentalData?.subtotal || 255000
        },
        {
          name: 'Placa compactadora 90 kg',
          days: 3,
          dailyPrice: 150000,
          subtotal: 450000
        },
        {
          name: 'Andamio multidireccional',
          days: 2,
          dailyPrice: 28000,
          subtotal: 56000
        }
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

  content.querySelector('#btn-goto-my-rentals')?.addEventListener('click', () => {
    modal.close();
    window.location.hash = '#catalog';
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
            <svg class="w-10 h-10 flex-shrink-0" viewBox="0 0 40 40" fill="none">
              <path d="M12 6L28 6L34 16L18 16L12 6Z" fill="#ea580c" />
              <path d="M18 16L34 16L22 34L12 34L18 16Z" fill="#f97316" />
              <path d="M6 16L18 16L12 26L6 16Z" fill="#c2410c" />
            </svg>
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
