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
        <div class="max-h-[380px] overflow-y-auto divide-y divide-slate-100 overscroll-contain">
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

            return `
              <div 
                class="p-3.5 hover:bg-slate-50/80 transition-colors flex items-start gap-3 cursor-pointer group notif-item opacity-0 ${
                  !item.read ? 'bg-orange-50/15' : 'bg-white'
                }"
                data-id="${item.id}"
                data-link="${item.link || '#/client'}"
              >
                <!-- Category Icon Badge -->
                <div class="w-8 h-8 rounded-xl flex items-center justify-center border flex-shrink-0 mt-0.5 shadow-2xs ${badgeClass}">
                  ${renderIcon(icon, 'w-4 h-4')}
                </div>

                <!-- Message Body -->
                <div class="flex-1 min-w-0 pr-1">
                  <div class="flex items-start justify-between gap-2 mb-1">
                    <h4 class="text-xs leading-snug ${!item.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}">
                      ${item.title}
                    </h4>
                    <div class="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
                      <span class="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                        ${item.timeAgo}
                      </span>
                      ${!item.read ? `
                        <span class="w-1.5 h-1.5 rounded-full bg-[#ea580c]" title="No leída"></span>
                      ` : ''}
                    </div>
                  </div>
                  <p class="text-[11px] leading-relaxed line-clamp-2 ${!item.read ? 'text-slate-600 font-normal' : 'text-slate-400'}">
                    ${item.message}
                  </p>
                </div>

                <!-- Delete on hover -->
                <div class="flex items-center flex-shrink-0 pt-0.5">
                  <button 
                    class="btn-delete-notif opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 p-1 rounded transition-all cursor-pointer" 
                    data-id="${item.id}"
                    title="Eliminar notificación"
                  >
                    ${renderIcon('Trash2', 'w-3.5 h-3.5')}
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Footer Actions -->
        <div class="p-2.5 px-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end text-[11px]">
          <a 
            href="#/client" 
            id="link-go-client-rentals"
            class="font-bold text-[#ea580c] hover:text-[#c2410c] transition-colors flex items-center gap-1"
          >
            <span>Ver mis alquileres</span>
            <span>&rarr;</span>
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
