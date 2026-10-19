/**
 * ToolRent Notifications Popover Menu Component
 * 
 * Provides an interactive notification drawer / dropdown anchored to the navbar bell icon.
 * Enhanced with Motion Canvas:
 * - Fluid Spring-like popover entrance with Motion
 * - Cascading staggered entrance for notification items with Motion
 * - Flowing ambient micro-canvas in header
 * - Sparkle micro-canvas burst when marking notifications read
 */

import { renderIcon } from '../utils/icons.js';
import { notificationsStore } from '../utils/notifications-store.js';
import auth from '../auth/state.js';
import { openAuthModal } from './auth-modal.js';
import gsap from 'gsap';
let isOpen = false;
let currentFilter = 'all'; // 'all' | 'unread'

export function formatShortCode(rawId, prefix = 'RNT') {
  if (!rawId) return '';
  const clean = String(rawId).trim().replace(/^[#\(\)]+|[#\(\)]+$/g, '');
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}/i.test(clean)) {
    return `${prefix}-${clean.slice(0, 6).toUpperCase()}`;
  }
  if (/^(RNT|FAC|GAR|RMB)-/i.test(clean)) {
    return clean.toUpperCase();
  }
  if (clean.length > 8) {
    return `${prefix}-${clean.slice(0, 6).toUpperCase()}`;
  }
  return clean;
}

/**
 * Helper to format short date ranges like "19 Oct - 22 Oct"
 */
function formatDateSpan(dateStr) {
  if (!dateStr) return '';
  try {
    const clean = String(dateStr).trim().split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      const [y, m, d] = clean.split('-');
      const date = new Date(Number(y), Number(m) - 1, Number(d));
      const formatted = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      return formatted.replace(/\b([a-záéíóúñ]{3,})\b/gi, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    }
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(clean)) {
      const [d, m, y] = clean.split('/');
      const date = new Date(Number(y), Number(m) - 1, Number(d));
      const formatted = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      return formatted.replace(/\b([a-záéíóúñ]{3,})\b/gi, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    }
    return dateStr;
  } catch (_) {
    return dateStr;
  }
}

/**
 * Intelligent parser that breaks down raw notification strings into a clean 3-row layout:
 * - Fila 1: Title & Time
 * - Fila 2: Tool Name
 * - Fila 3: Metadata Badges (Code + Dates / Amount)
 */
export function parseNotificationDetails(item) {
  const rawMsg = item.message || '';
  let title = item.title || 'Notificación';
  let toolName = '';
  let code = '';
  let extraInfo = '';

  // 1. Format raw UUID in title if any
  title = title.replace(/\b([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\b/g, (m) => formatShortCode(m, 'RNT'));

  // 2. Differentiate Payment vs Rental if generated in the same minute / redundant
  if (item.category === 'PAYMENT' || /alquiler y pago/i.test(title)) {
    title = 'Factura Digital Generada';
  }

  // 3. Match Invoice / Payment messages:
  // e.g. "Factura FAC-2ADFD9 emitida por $580.000 para Andamio de Carga..."
  const invoiceMatch = rawMsg.match(/Factura\s+([A-Za-z0-9#-]+)\s+emitida\s+por\s+([^\s]+(?:\s*COP)?)\s+para\s+([^.]+)/i);
  if (invoiceMatch) {
    code = formatShortCode(invoiceMatch[1], 'FAC');
    const rawAmt = invoiceMatch[2].replace('Total:', '').trim();
    const cleanAmt = rawAmt.includes('COP') ? rawAmt : `${rawAmt} COP`;
    toolName = invoiceMatch[3].trim();
    extraInfo = `${cleanAmt} • Factura electrónica DIAN`;
    return { title, toolName, code, extraInfo };
  }

  // 4. Match "Has reservado <ToolName> (<Code/UUID>) [del <Date1> al <Date2>] [Total: <Amount> | por <Amount>]"
  const reservedMatch = rawMsg.match(/Has reservado\s+([^\(#]+?)(?:\s+[\(#]([^\)]+)[\)])?(?:\s+del\s+(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})\s+al\s+(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}))?(?:[^\$]*?(\$\s*[\d.,]+|\bTotal:\s*\$[\d.,]+))?/i);

  if (reservedMatch) {
    toolName = reservedMatch[1].trim();
    const rawCode = reservedMatch[2];
    const d1 = reservedMatch[3];
    const d2 = reservedMatch[4];
    const rawAmt = reservedMatch[5];

    if (rawCode) {
      code = formatShortCode(rawCode, item.category === 'PAYMENT' ? 'FAC' : 'RNT');
    }

    const parts = [];
    if (d1 && d2) {
      parts.push(`${formatDateSpan(d1)} - ${formatDateSpan(d2)}`);
    }
    if (rawAmt) {
      const cleanAmt = rawAmt.replace('Total:', '').trim();
      parts.push(cleanAmt.includes('COP') ? cleanAmt : `${cleanAmt} COP`);
    } else if (item.category === 'PAYMENT') {
      parts.push('Factura legal con QR');
    }

    extraInfo = parts.join(' • ');
  } 
  // 5. Match Dispatch notifications
  else if (/despachad[ao]|camino a tu obra|frente de obra/i.test(rawMsg)) {
    const codeMatch = rawMsg.match(/[\(#]([^\)]+)[\)]/);
    if (codeMatch) {
      code = formatShortCode(codeMatch[1], 'RNT');
    }
    toolName = 'Maquinaria en tránsito hacia tu obra';
    extraInfo = 'Despachado con remisión oficial';
  }
  // 6. Match Warranty Claims
  else if (/solicitud\s*\((EXCHANGE|REFUND)\)/i.test(rawMsg) || /falla/i.test(rawMsg) || /garantía/i.test(rawMsg)) {
    const isExchange = /EXCHANGE|sustitución/i.test(rawMsg);
    toolName = isExchange ? 'Sustitución de equipo por falla técnica' : 'Reembolso y custodia de garantía';
    
    const codeInTitle = (item.title || '').match(/#(GAR|RMB)-[\d-]+/i);
    if (codeInTitle) {
      code = codeInTitle[0].replace('#', '');
    }
    extraInfo = 'Prioridad Normal • En revisión técnica';
  }
  // 7. Match Payment/Invoice messages
  else if (item.category === 'PAYMENT' || /factura/i.test(rawMsg)) {
    const amtMatch = rawMsg.match(/\$\s*[\d.,]+/);
    toolName = rawMsg.replace(/#\([^\)]+\)/g, '').replace(/Factura legal generada\.?/i, '').trim();
    if (amtMatch) {
      extraInfo = `${amtMatch[0]} COP • Factura electrónica DIAN`;
    }
  }
  // 8. Generic fallback: clean any raw UUIDs
  else {
    toolName = rawMsg.replace(/\b([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\b/g, (m) => formatShortCode(m, 'RNT'));
  }

  // If toolName is still empty, fallback cleanly
  if (!toolName) {
    toolName = rawMsg.replace(/\b([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\b/g, (m) => formatShortCode(m, 'RNT'));
  }

  // If code was not extracted but message has a code/UUID, grab it
  if (!code) {
    const anyUuid = rawMsg.match(/\b([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\b/);
    if (anyUuid) {
      code = formatShortCode(anyUuid[1], item.category === 'PAYMENT' ? 'FAC' : 'RNT');
    } else {
      const anyCode = rawMsg.match(/\b(RNT-[A-Z0-9]+|FAC-[A-Z0-9]+|GAR-[A-Z0-9-]+|RMB-[A-Z0-9-]+)\b/i);
      if (anyCode) {
        code = formatShortCode(anyCode[1]);
      }
    }
  }

  return {
    title,
    toolName,
    code,
    extraInfo
  };
}

export function renderNotificationsMenu() {
  const container = document.getElementById('notifications-menu-container');
  if (!container) return;

  const isAuth = auth.isAuthenticated();
  const notifications = isAuth ? notificationsStore.getAll() : [];
  const unreadCount = isAuth ? notificationsStore.getUnreadCount() : 0;

  const filtered = currentFilter === 'unread' 
    ? notifications.filter(n => !n.read) 
    : notifications;

  if (!isOpen) {
    container.innerHTML = '';
    container.classList.add('hidden');
    return;
  }

  container.classList.remove('hidden');

  container.innerHTML = `
    <!-- Backdrop for click-outside dismissal -->
    <div id="notifications-backdrop" class="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[1px] opacity-0"></div>

    <!-- Floating Popover Card with Motion Canvas & Spring entrance -->
    <div 
      id="notifications-popover" 
      class="fixed sm:absolute inset-x-3 sm:inset-x-auto sm:right-0 top-16 sm:top-full mt-2 w-auto sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden opacity-0"
      style="transform-origin: top right;"
    >
      <!-- Refined Header -->
      <div class="relative overflow-hidden p-3.5 px-4 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between">

        <div class="relative z-10 flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-orange-500/20 text-[#ea580c] border border-orange-500/30 flex items-center justify-center flex-shrink-0">
            ${renderIcon('Bell', 'w-3.5 h-3.5')}
          </div>
          <div class="flex items-center gap-2">
            <h3 class="text-xs font-bold text-white tracking-tight font-display">Notificaciones</h3>
            ${isAuth && unreadCount > 0 ? `
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#ea580c] text-white shadow-xs">
                ${unreadCount} nueva${unreadCount === 1 ? '' : 's'}
              </span>
            ` : ''}
          </div>
        </div>

        <div class="relative z-10 flex items-center gap-2">
          ${isAuth && unreadCount > 0 ? `
            <button 
              id="btn-mark-all-read" 
              class="text-[11px] font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-white/10"
              title="Marcar todas como leídas"
            >
              Marcar leídas
            </button>
          ` : ''}
          <button 
            id="btn-close-notifs" 
            class="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
            aria-label="Cerrar"
          >
            ${renderIcon('X', 'w-4 h-4')}
          </button>
        </div>
      </div>

      ${!isAuth ? `
        <!-- Unauthenticated Guest State -->
        <div class="p-6 text-center space-y-3.5">
          <div class="w-12 h-12 rounded-2xl bg-orange-50 text-[#ea580c] flex items-center justify-center mx-auto shadow-2xs border border-orange-100">
            ${renderIcon('BellOff', 'w-6 h-6')}
          </div>
          <div class="space-y-1">
            <p class="text-sm font-bold text-slate-900 font-display">Alertas Operativas</p>
            <p class="text-xs text-slate-500 max-w-xs mx-auto">
              Seguimiento en tiempo real para tu cuenta:
            </p>
          </div>

          <!-- Píldoras de Palabras Clave -->
          <div class="flex flex-wrap items-center justify-center gap-1.5 pt-0.5 text-[11px] font-semibold text-slate-600">
            <span class="px-2 py-1 bg-slate-100 rounded-md border border-slate-200/80">● Despachos en obra</span>
            <span class="px-2 py-1 bg-slate-100 rounded-md border border-slate-200/80">● Facturas DIAN</span>
            <span class="px-2 py-1 bg-slate-100 rounded-md border border-slate-200/80">● Devoluciones</span>
          </div>

          <div class="pt-2">
            <button id="btn-notif-guest-login" class="btn-primary w-full !py-2.5 text-xs font-bold shadow-sm flex items-center justify-center gap-2">
              ${renderIcon('LogIn', 'w-4 h-4')}
              <span>Iniciar sesión</span>
            </button>
          </div>
        </div>
      ` : `
        <!-- Segmented Filter Control -->
        <div class="px-3.5 py-2.5 bg-white border-b border-slate-100">
          <div class="flex p-0.5 bg-slate-100/80 rounded-xl text-xs font-semibold text-slate-500">
            <button 
              id="btn-filter-all" 
              class="flex-1 py-1.5 px-3 rounded-lg transition-all text-center cursor-pointer ${
                currentFilter === 'all' 
                  ? 'bg-white text-slate-900 shadow-2xs font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }"
            >
              Todas <span class="ml-1 text-[11px] font-normal opacity-70">(${notifications.length})</span>
            </button>
            <button 
              id="btn-filter-unread" 
              class="flex-1 py-1.5 px-3 rounded-lg transition-all text-center cursor-pointer ${
                currentFilter === 'unread' 
                  ? 'bg-white text-[#ea580c] shadow-2xs font-bold' 
                  : 'text-slate-600 hover:text-slate-900'
              }"
            >
              No leídas ${unreadCount > 0 ? `<span class="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-orange-100 text-[#ea580c] font-bold">${unreadCount}</span>` : ''}
            </button>
          </div>
        </div>

        <!-- Notifications List -->
        <div class="max-h-[380px] overflow-y-auto custom-scrollbar-slim divide-y divide-slate-100 overscroll-contain">
          ${filtered.length === 0 ? `
            <div class="p-8 text-center space-y-2">
              <div class="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                ${renderIcon('CheckCircle2', 'w-5 h-5 text-emerald-500')}
              </div>
              <p class="text-xs font-bold text-slate-800 font-display">¡Estás al día!</p>
              <p class="text-[11px] text-slate-400">No tienes notificaciones ${currentFilter === 'unread' ? 'sin leer' : 'registradas'}.</p>
            </div>
          ` : filtered.map(item => {
            let icon = 'Info';
            let badgeClass = 'bg-slate-100 text-slate-600 border-slate-200/70';

            if (item.category === 'RENTAL') {
              icon = 'CheckCircle2';
              badgeClass = 'bg-emerald-50/80 text-emerald-600 border-emerald-100';
            } else if (item.category === 'PAYMENT') {
              icon = 'Receipt';
              badgeClass = 'bg-slate-100 text-slate-700 border-slate-200/80';
            } else if (item.category === 'ALERT') {
              icon = 'Clock';
              badgeClass = 'bg-amber-50/80 text-amber-600 border-amber-100';
            } else if (item.category === 'INSPECTION') {
              icon = 'Wrench';
              badgeClass = 'bg-slate-100 text-slate-600 border-slate-200/70';
            } else if (item.category === 'DAMAGE') {
              icon = 'AlertTriangle';
              badgeClass = 'bg-rose-50/80 text-rose-600 border-rose-100';
            }

            const parsed = parseNotificationDetails(item);
            const isUnread = !item.read;

            return `
              <div 
                class="p-3.5 transition-colors flex items-start gap-3 cursor-pointer group notif-item opacity-0 ${
                  isUnread 
                    ? 'bg-orange-50/35 hover:bg-orange-50/60 border-l-[3px] border-[#F97316]' 
                    : 'bg-white hover:bg-slate-50/80 border-l-[3px] border-transparent'
                }"
                data-id="${item.id}"
                data-link="${item.link || '#/client'}"
              >
                <!-- Category Icon Badge -->
                <div class="w-8 h-8 rounded-xl flex items-center justify-center border flex-shrink-0 mt-0.5 shadow-2xs ${badgeClass}">
                  ${renderIcon(icon, 'w-4 h-4')}
                </div>

                <!-- Structured 3-Row Body -->
                <div class="flex-1 min-w-0">
                  <!-- Fila 1: Título de la notificación + Timestamp + Dot naranja / Botón Papelera alineado -->
                  <div class="flex items-center justify-between gap-2">
                    <h4 class="text-xs leading-snug truncate ${isUnread ? 'font-bold text-[#0B2239]' : 'font-medium text-slate-700'}">
                      ${parsed.title}
                    </h4>
                    
                    <div class="flex items-center gap-1.5 flex-shrink-0">
                      <!-- Slot fijo para TimeAgo y Delete sin desplazamiento de layout -->
                      <div class="relative flex items-center justify-end min-w-[70px]">
                        <span class="text-[10px] text-slate-400 font-medium whitespace-nowrap transition-opacity group-hover:opacity-0 pointer-events-none">
                          ${item.timeAgo || 'Hace un momento'}
                        </span>
                        <button 
                          class="btn-delete-notif absolute right-0 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-0.5 rounded transition-all cursor-pointer" 
                          data-id="${item.id}"
                          title="Eliminar notificación"
                        >
                          ${renderIcon('Trash2', 'w-3.5 h-3.5')}
                        </button>
                      </div>
                      ${isUnread ? `
                        <span class="w-1.5 h-1.5 rounded-full bg-[#F97316] flex-shrink-0" title="No leída"></span>
                      ` : `
                        <span class="w-1.5 h-1.5 flex-shrink-0 opacity-0 pointer-events-none"></span>
                      `}
                    </div>
                  </div>

                  <!-- Fila 2: Nombre de la herramienta en una línea limpia -->
                  <p class="text-xs font-medium text-slate-700 truncate mt-0.5">
                    ${parsed.toolName}
                  </p>

                  <!-- Fila 3: Píldoras de metadatos (Código corto + Fechas / Monto) -->
                  <div class="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    ${parsed.code ? `
                      <span class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                        parsed.code.startsWith('FAC') 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200/80' 
                          : 'bg-slate-100 text-slate-700 border border-slate-200/80'
                      }">
                        ${parsed.code}
                      </span>
                    ` : ''}
                    ${parsed.extraInfo ? `
                      <span class="text-[11px] text-slate-500 font-medium truncate">
                        ${parsed.extraInfo}
                      </span>
                    ` : ''}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Fixed Full-Width Footer -->
        <div class="w-full py-3 px-4 bg-slate-50/95 backdrop-blur-sm border-t border-slate-200/80 flex items-center justify-center rounded-b-2xl">
          <a 
            href="#/client" 
            id="link-go-client-rentals"
            class="text-xs font-bold text-[#F97316] hover:text-[#ea580c] transition-colors flex items-center gap-1.5 cursor-pointer select-none"
          >
            <span>Ver mis alquileres</span>
            <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      `}
    </div>
  `;

  // Animate popover & backdrop entrance using Motion
  requestAnimationFrame(() => {
    const popover = container.querySelector('#notifications-popover');
    const backdrop = container.querySelector('#notifications-backdrop');
    const headerCanvas = container.querySelector('#notif-header-canvas');

    if (backdrop) {
      gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: 0.22, ease: 'power2.out' });
    }

    if (popover) {
      gsap.fromTo(
        popover,
        { opacity: 0, scale: 0.93, y: -10 },
        { opacity: 1, scale: 1, y: 0, duration: 0.28, ease: 'power2.out' }
      );
    }

    // Cascading GSAP stagger for notification rows
    const notifRows = Array.from(container.querySelectorAll('.notif-item'));
    if (notifRows.length > 0) {
      gsap.fromTo(
        notifRows,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.22, stagger: 0.035, ease: 'power2.out' }
      );
    }
  });

  // Attach event handlers
  container.querySelector('#notifications-backdrop')?.addEventListener('click', closeNotificationsMenu);
  container.querySelector('#btn-close-notifs')?.addEventListener('click', closeNotificationsMenu);

  container.querySelector('#btn-notif-guest-login')?.addEventListener('click', () => {
    closeNotificationsMenu();
    openAuthModal('login');
  });

  container.querySelector('#btn-mark-all-read')?.addEventListener('click', () => {
    notificationsStore.markAllAsRead();
    renderNotificationsMenu();
  });

  container.querySelector('#btn-filter-all')?.addEventListener('click', () => {
    currentFilter = 'all';
    renderNotificationsMenu();
  });

  container.querySelector('#btn-filter-unread')?.addEventListener('click', () => {
    currentFilter = 'unread';
    renderNotificationsMenu();
  });

  container.querySelector('#link-go-client-rentals')?.addEventListener('click', () => {
    closeNotificationsMenu();
  });

  // Individual notification item click
  container.querySelectorAll('.notif-item').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.closest('.btn-delete-notif')) return;

      const id = el.dataset.id;
      const link = el.dataset.link;
      notificationsStore.markAsRead(id);
      closeNotificationsMenu();
      if (link) {
        window.location.hash = link;
      }
    });
  });

  // Delete notification item with smooth slide-out animation
  container.querySelectorAll('.btn-delete-notif').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const row = btn.closest('.notif-item');
      if (row) {
        gsap.to(row, {
          opacity: 0,
          x: 20,
          duration: 0.18,
          ease: 'power2.in',
          onComplete: () => {
            notificationsStore.delete(id);
            renderNotificationsMenu();
          }
        });
      } else {
        notificationsStore.delete(id);
        renderNotificationsMenu();
      }
    });
  });
}

export function openNotificationsMenu() {
  isOpen = true;
  renderNotificationsMenu();
}

export function closeNotificationsMenu() {
  const container = document.getElementById('notifications-menu-container');
  const popover = container?.querySelector('#notifications-popover');
  const backdrop = container?.querySelector('#notifications-backdrop');

  if (popover && backdrop && isOpen) {
    isOpen = false;
    gsap.to(backdrop, { opacity: 0, duration: 0.18, ease: 'power2.in' });
    gsap.to(popover, {
      opacity: 0,
      scale: 0.94,
      y: -8,
      duration: 0.18,
      ease: 'power2.in',
      onComplete: () => {
        renderNotificationsMenu();
      }
    });
  } else {
    isOpen = false;
    renderNotificationsMenu();
  }
}

export function toggleNotificationsMenu() {
  if (isOpen) {
    closeNotificationsMenu();
  } else {
    openNotificationsMenu();
  }
}
