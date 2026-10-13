/**
 * ToolRent Notifications Popover Menu Component
 * 
 * Provides an interactive notification drawer / dropdown anchored to the navbar bell icon.
 */

import { renderIcon } from '../utils/icons.js';
import { notificationsStore } from '../utils/notifications-store.js';

let isOpen = false;
let currentFilter = 'all'; // 'all' | 'unread'

export function renderNotificationsMenu() {
  const container = document.getElementById('notifications-menu-container');
  if (!container) return;

  const notifications = notificationsStore.getAll();
  const unreadCount = notificationsStore.getUnreadCount();

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
    <div id="notifications-backdrop" class="fixed inset-0 z-40 bg-black/5 backdrop-blur-[0.5px]"></div>

    <!-- Floating Popover Card -->
    <div 
      id="notifications-popover" 
      class="absolute right-0 top-full mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      style="transform-origin: top right;"
    >
      <!-- Header -->
      <div class="p-3.5 px-4 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="p-1 rounded-lg bg-orange-100 text-[#FF5A1F]">
            ${renderIcon('Bell', 'w-4 h-4')}
          </span>
          <h3 class="text-xs font-bold text-slate-900 tracking-tight font-display">Notificaciones</h3>
          ${unreadCount > 0 ? `
            <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FF5A1F] text-white">
              ${unreadCount} nueva${unreadCount === 1 ? '' : 's'}
            </span>
          ` : ''}
        </div>

        <div class="flex items-center gap-1">
          ${unreadCount > 0 ? `
            <button 
              id="btn-mark-all-read" 
              class="text-[11px] font-semibold text-slate-600 hover:text-[#FF5A1F] hover:bg-white px-2 py-1 rounded-lg transition-colors cursor-pointer"
              title="Marcar todas como leídas"
            >
              Marcar leídas
            </button>
          ` : ''}
          <button 
            id="btn-close-notifs" 
            class="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            ${renderIcon('X', 'w-4 h-4')}
          </button>
        </div>
      </div>

      <!-- Quick Filter Bar -->
      <div class="px-3.5 py-2 bg-white border-b border-slate-100 flex items-center gap-2 text-xs">
        <button 
          id="btn-filter-all" 
          class="px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
            currentFilter === 'all' 
              ? 'bg-slate-900 text-white shadow-xs' 
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }"
        >
          Todas (${notifications.length})
        </button>
        <button 
          id="btn-filter-unread" 
          class="px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
            currentFilter === 'unread' 
              ? 'bg-[#FF5A1F] text-white shadow-xs' 
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }"
        >
          No leídas (${unreadCount})
        </button>
      </div>

      <!-- Notifications List -->
      <div class="max-h-[380px] overflow-y-auto divide-y divide-slate-100 overscroll-contain">
        ${filtered.length === 0 ? `
          <div class="p-8 text-center space-y-2">
            <div class="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              ${renderIcon('CheckCircle2', 'w-5 h-5 text-emerald-500')}
            </div>
            <p class="text-xs font-bold text-slate-800">¡Estás al día!</p>
            <p class="text-[11px] text-slate-400">No tienes notificaciones ${currentFilter === 'unread' ? 'sin leer' : 'registradas'}.</p>
          </div>
        ` : filtered.map(item => {
          let icon = 'Info';
          let badgeBg = 'bg-blue-50 text-blue-600 border-blue-200';

          if (item.category === 'RENTAL') {
            icon = 'CheckCircle2';
            badgeBg = 'bg-emerald-50 text-emerald-600 border-emerald-200';
          } else if (item.category === 'PAYMENT') {
            icon = 'Receipt';
            badgeBg = 'bg-sky-50 text-sky-600 border-sky-200';
          } else if (item.category === 'ALERT') {
            icon = 'Clock';
            badgeBg = 'bg-amber-50 text-amber-600 border-amber-200';
          } else if (item.category === 'INSPECTION') {
            icon = 'Wrench';
            badgeBg = 'bg-purple-50 text-purple-600 border-purple-200';
          } else if (item.category === 'DAMAGE') {
            icon = 'AlertTriangle';
            badgeBg = 'bg-rose-50 text-rose-600 border-rose-200';
          }

          return `
            <div 
              class="p-3.5 hover:bg-slate-50/80 transition-colors flex items-start gap-3 cursor-pointer group notif-item ${
                !item.read ? 'bg-orange-50/30' : ''
              }"
              data-id="${item.id}"
              data-link="${item.link || '#/client'}"
            >
              <!-- Category Icon Badge -->
              <div class="w-8 h-8 rounded-xl flex items-center justify-center border flex-shrink-0 mt-0.5 ${badgeBg}">
                ${renderIcon(icon, 'w-4 h-4')}
              </div>

              <!-- Message Body -->
              <div class="flex-1 min-w-0 pr-1">
                <div class="flex items-center justify-between gap-1 mb-0.5">
                  <h4 class="text-xs font-bold text-slate-900 truncate ${!item.read ? 'text-[#FF5A1F]' : ''}">
                    ${item.title}
                  </h4>
                  <span class="text-[10px] text-slate-400 font-medium whitespace-nowrap flex-shrink-0">
                    ${item.timeAgo}
                  </span>
                </div>
                <p class="text-[11px] text-slate-600 leading-snug line-clamp-2">
                  ${item.message}
                </p>
              </div>

              <!-- Unread dot & Delete button on hover -->
              <div class="flex items-center gap-1 flex-shrink-0 pt-1">
                ${!item.read ? `
                  <span class="w-2 h-2 rounded-full bg-[#FF5A1F] ring-2 ring-orange-200" title="No leída"></span>
                ` : ''}
                <button 
                  class="btn-delete-notif opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 p-1 rounded transition-opacity" 
                  data-id="${item.id}"
                  title="Eliminar"
                >
                  ${renderIcon('Trash2', 'w-3 h-3')}
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Footer Actions -->
      <div class="p-2.5 px-4 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between text-[11px]">
        <button 
          id="btn-reset-demo-notifs"
          class="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
        >
          Reiniciar ejemplos
        </button>
        <a 
          href="#/client" 
          id="link-go-client-rentals"
          class="font-bold text-[#FF5A1F] hover:text-[#e04e18] transition-colors"
        >
          Ver mis alquileres &rarr;
        </a>
      </div>
    </div>
  `;

  // Attach event handlers
  container.querySelector('#notifications-backdrop')?.addEventListener('click', closeNotificationsMenu);
  container.querySelector('#btn-close-notifs')?.addEventListener('click', closeNotificationsMenu);

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

  container.querySelector('#btn-reset-demo-notifs')?.addEventListener('click', () => {
    notificationsStore.resetDefaults();
    renderNotificationsMenu();
  });

  container.querySelector('#link-go-client-rentals')?.addEventListener('click', () => {
    closeNotificationsMenu();
  });

  // Individual notification item click
  container.querySelectorAll('.notif-item').forEach(el => {
    el.addEventListener('click', (e) => {
      // If clicked the trash button, prevent navigation
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

  // Delete notification item
  container.querySelectorAll('.btn-delete-notif').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      notificationsStore.delete(id);
      renderNotificationsMenu();
    });
  });
}

export function openNotificationsMenu() {
  isOpen = true;
  renderNotificationsMenu();
}

export function closeNotificationsMenu() {
  isOpen = false;
  renderNotificationsMenu();
}

export function toggleNotificationsMenu() {
  isOpen = !isOpen;
  renderNotificationsMenu();
}
