/**
 * Conceptzilla & Linear Minimalist 2-State Floating Expandable CRM Card
 * Replicating exactly seconds 00:01 to 00:07 of Conceptzilla CRM:
 * State 1: Compact Quick-View Card
 * State 2: Full Overview Card (Expandable with Underline Tabs & Property Matrix)
 * Popover Dropdown Menu on 3-dots (...)
 */

import { renderIcon } from '../utils/icons.js';
import { renderCrmStatusBadge } from './crm-sparkline.js';

let activeCardModal = null;

/**
 * Open the 2-State Floating Expandable CRM Card
 * @param {Object} options
 * @param {string} options.title - Lead / Tool / User name (e.g. "Carlos Gómez" or "Martillo Demoledor Bosch")
 * @param {string} options.subtitle - Role / Company (e.g. "Cliente Frecuente · NIT 900123" or "Proveedor Maquinaria")
 * @param {string} options.avatarUrl - Image URL or Dicebear avatar
 * @param {string} options.status - Operational/user status
 * @param {string} options.primaryActionText - Text for orange primary button (e.g. "Gestionar Alquiler", "Editar Datos")
 * @param {string} options.primaryActionIcon - Icon name for primary button (e.g. "Mail", "Edit3", "Check")
 * @param {Function} options.onPrimaryAction - Callback when primary button is clicked
 * @param {Array<{ label: string, icon: string, value: string, badge?: boolean }>} options.properties - 2-column key-value list
 * @param {Array<{ label: string, icon: string, onClick: Function, danger?: boolean, divider?: boolean }>} options.menuActions - 3-dots popover actions
 * @param {Array<{ id: string, label: string, contentHtml?: string }>} [options.tabs] - Custom tabs for expanded view
 * @param {boolean} [options.startExpanded=false] - Whether to start in State 2
 */
export function openCrmOverviewCard({
  title = 'Elemento',
  subtitle = 'Detalles del registro',
  avatarUrl = null,
  avatar = null,
  status = 'AVAILABLE',
  primaryActionText = 'Gestionar',
  primaryActionIcon = 'Check',
  onPrimaryAction = null,
  secondaryActionIcon = 'Calendar',
  onSecondaryAction = null,
  properties = [],
  menuActions = [],
  menuItems = null,
  tabs = null
} = {}) {
  // Close any existing card first
  closeCrmOverviewCard();

  const actionsList = (menuActions && menuActions.length > 0) ? menuActions : (menuItems || []);

  let isExpanded = false;
  let activeTabId = tabs?.[0]?.id || 'info';
  let isMenuOpen = false;

  const overlay = document.createElement('div');
  overlay.id = 'crm-overview-card-overlay';
  overlay.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/15 backdrop-blur-sm animate-fade-in select-none';

  const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(title)}&backgroundColor=f4f4f5&textColor=18181b`;
  const resolvedAvatar = avatarUrl || avatar || defaultAvatar;

  const card = document.createElement('div');
  card.className = 'w-full max-w-sm bg-white rounded-2xl border border-zinc-200/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-visible relative';

  function renderCardContent() {
    card.className = `w-full ${isExpanded ? 'max-w-md' : 'max-w-sm'} bg-white rounded-2xl border border-zinc-200/90 shadow-[0_8px_32px_-4px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-visible relative`;

    card.innerHTML = `
      <!-- Top Card Header Bar -->
      <div class="px-4 sm:px-5 py-3.5 border-b border-zinc-100 flex items-center justify-between text-zinc-400 bg-zinc-50/40 rounded-t-2xl">
        <div class="flex items-center gap-1.5 cursor-grab">
          ${renderIcon('GripVertical', 'w-3.5 h-3.5 text-zinc-300')}
          <span class="text-[11px] font-medium text-zinc-400 tracking-wide">Vista rápida</span>
        </div>
        
        <div class="flex items-center gap-1">
          <button id="btn-toggle-expand" class="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer" title="${isExpanded ? 'Contraer' : 'Expandir'}">
            ${renderIcon(isExpanded ? 'Minimize2' : 'Maximize2', 'w-3.5 h-3.5')}
          </button>
          <button id="btn-close-card" class="p-1 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer" title="Cerrar">
            ${renderIcon('X', 'w-3.5 h-3.5')}
          </button>
        </div>
      </div>

      <!-- Main Body Area -->
      <div class="p-4 sm:p-5 space-y-4">

        ${isExpanded ? `
          <!-- State 2: Expanded Header with Centered Avatar -->
          <div class="text-center space-y-2 pt-1 animate-fade-in">
            <div class="relative inline-block mx-auto">
              <img src="${resolvedAvatar}" class="w-16 h-16 rounded-full object-cover border-2 border-zinc-100 shadow-sm mx-auto bg-zinc-50" onerror="this.src='${defaultAvatar}'" />
              <span class="absolute bottom-0 right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${status === 'AVAILABLE' || status === 'CONFIRMED' || status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
            </div>
            
            <div>
              <h3 class="text-base font-semibold text-zinc-900 tracking-tight leading-snug">${title}</h3>
              <p class="text-xs text-zinc-500 font-normal mt-0.5">${subtitle}</p>
            </div>
          </div>
        ` : `
          <!-- State 1: Compact Horizontal Header -->
          <div class="flex items-center gap-3">
            <div class="relative flex-shrink-0">
              <img src="${resolvedAvatar}" class="w-11 h-11 rounded-full object-cover border border-zinc-200/80 shadow-2xs bg-zinc-50" onerror="this.src='${defaultAvatar}'" />
              <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${status === 'AVAILABLE' || status === 'CONFIRMED' || status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="text-sm font-semibold text-zinc-900 truncate leading-snug">${title}</h3>
              <p class="text-xs text-zinc-500 truncate mt-0.5 font-normal">${subtitle}</p>
            </div>
          </div>
        `}

        <!-- Action Row (Primary Orange + Secondary Icon + 3-Dots Popover) -->
        <div class="flex items-center gap-2 pt-1">
          <button id="btn-card-primary" class="flex-1 min-w-0 bg-[#EA580C] hover:bg-[#ea580c]/90 active:scale-[0.98] text-white rounded-lg px-3.5 sm:px-4 py-2 text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer truncate">
            ${renderIcon(primaryActionIcon, 'w-3.5 h-3.5 flex-shrink-0')}
            <span class="truncate">${primaryActionText}</span>
          </button>
          
          <button id="btn-card-secondary" class="flex-shrink-0 border border-zinc-200 hover:bg-zinc-50 active:scale-[0.97] rounded-lg p-2 text-zinc-600 transition-all cursor-pointer shadow-2xs" title="Detalles complementarios">
            ${renderIcon(secondaryActionIcon, 'w-3.5 h-3.5')}
          </button>

          <!-- 3-Dots Menu Trigger Container -->
          <div class="relative flex-shrink-0">
            <button id="btn-card-menu-trigger" class="border border-zinc-200 hover:bg-zinc-50 active:scale-[0.97] rounded-lg p-2 text-zinc-600 transition-all cursor-pointer shadow-2xs" title="Más opciones">
              ${renderIcon('MoreHorizontal', 'w-3.5 h-3.5')}
            </button>

            <!-- Popover Dropdown (Responsive & Unclipped) -->
            <div id="card-popover-menu" class="${isMenuOpen ? 'block' : 'hidden'} absolute right-0 top-full mt-1.5 w-60 sm:w-64 max-w-[calc(100vw-3rem)] bg-white rounded-xl border border-zinc-200/90 shadow-2xl py-1 z-50 text-xs animate-scale-in max-h-60 overflow-y-auto overscroll-contain">
              ${actionsList.map((act, idx) => {
                if (!act || (act.divider && !act.label)) {
                  return `<hr class="my-1 border-zinc-100" />`;
                }
                if (!act.label) return '';
                return `
                  ${act.divider ? `<hr class="my-1 border-zinc-100" />` : ''}
                  <button 
                    class="btn-popover-item w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      act.danger ? 'text-rose-600 hover:bg-rose-50' : 'text-zinc-700 hover:bg-zinc-50'
                    }"
                    data-index="${idx}"
                  >
                    <span class="inline-flex items-center gap-2 min-w-0">
                      ${renderIcon(act.icon || 'ChevronRight', `w-3.5 h-3.5 flex-shrink-0 ${act.danger ? 'text-rose-500' : 'text-zinc-400'}`)}
                      <span class="font-medium truncate leading-tight">${act.label}</span>
                    </span>
                    ${act.hasSubmenu ? renderIcon('ChevronRight', 'w-3 h-3 text-zinc-300 flex-shrink-0') : ''}
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        ${isExpanded ? `
          <!-- State 2: Underline Tabs (Info, Historial, Alquileres) -->
          <div class="pt-2">
            <div class="flex items-center gap-6 border-b border-zinc-100 text-xs font-medium">
              ${(tabs || [
                { id: 'info', label: 'Info' },
                { id: 'history', label: 'Historial / Notas' },
                { id: 'rentals', label: 'Alquileres / Facturas' }
              ]).map(t => `
                <button 
                  class="btn-card-tab pb-2.5 transition-colors cursor-pointer ${
                    activeTabId === t.id 
                      ? 'text-zinc-900 font-semibold border-b-2 border-[#EA580C]' 
                      : 'text-zinc-400 hover:text-zinc-600 border-b-2 border-transparent'
                  }" 
                  data-tab="${t.id}"
                >
                  ${t.label}
                </button>
              `).join('')}
            </div>

            <!-- Tab Content: Property Matrix (Aligned 2-Column List) -->
            <div class="pt-4 divide-y divide-zinc-50">
              ${activeTabId === 'info' ? `
                <div class="space-y-2.5">
                  ${properties.map(p => `
                    <div class="flex items-center justify-between text-xs py-1.5">
                      <span class="inline-flex items-center gap-2 text-zinc-400 font-normal">
                        ${renderIcon(p.icon || 'Hash', 'w-3.5 h-3.5 text-zinc-400')}
                        <span>${p.label}</span>
                      </span>
                      <span class="text-zinc-800 font-medium tabular-nums text-right">
                        ${p.badge ? renderCrmStatusBadge(p.value) : p.value}
                      </span>
                    </div>
                  `).join('')}
                </div>
              ` : `
                <div class="py-6 text-center text-zinc-400 text-xs">
                  <p>Sin eventos recientes registrados en esta sección.</p>
                </div>
              `}
            </div>
          </div>
        ` : `
          <!-- State 1: Compact Property Summary -->
          <div class="pt-1 border-t border-zinc-100/90 divide-y divide-zinc-50/80">
            ${properties.slice(0, 3).map(p => `
              <div class="flex items-center justify-between text-xs py-1.5">
                <span class="inline-flex items-center gap-2 text-zinc-400 font-normal">
                  ${renderIcon(p.icon || 'Hash', 'w-3 h-3 text-zinc-400')}
                  <span>${p.label}</span>
                </span>
                <span class="text-zinc-800 font-medium tabular-nums text-right">
                  ${p.badge ? renderCrmStatusBadge(p.value) : p.value}
                </span>
              </div>
            `).join('')}
          </div>
        `}

      </div>
    `;

    // Wire Interactive Handlers
    card.querySelector('#btn-close-card')?.addEventListener('click', closeCrmOverviewCard);

    card.querySelector('#btn-toggle-expand')?.addEventListener('click', () => {
      isExpanded = !isExpanded;
      isMenuOpen = false;
      renderCardContent();
    });

    card.querySelector('#btn-card-primary')?.addEventListener('click', () => {
      closeCrmOverviewCard();
      if (onPrimaryAction) onPrimaryAction();
    });

    card.querySelector('#btn-card-secondary')?.addEventListener('click', () => {
      closeCrmOverviewCard();
      if (onSecondaryAction) onSecondaryAction();
    });

    const menuTrigger = card.querySelector('#btn-card-menu-trigger');
    const popoverMenu = card.querySelector('#card-popover-menu');
    menuTrigger?.addEventListener('click', (e) => {
      e.stopPropagation();
      isMenuOpen = !isMenuOpen;
      if (isMenuOpen && popoverMenu) {
        const triggerRect = menuTrigger.getBoundingClientRect();
        const spaceBelow = window.innerHeight - triggerRect.bottom;
        if (spaceBelow < 220 && triggerRect.top > 200) {
          popoverMenu.classList.remove('top-full', 'mt-1.5');
          popoverMenu.classList.add('bottom-full', 'mb-1.5');
        } else {
          popoverMenu.classList.remove('bottom-full', 'mb-1.5');
          popoverMenu.classList.add('top-full', 'mt-1.5');
        }
        popoverMenu.classList.remove('hidden');
      } else {
        popoverMenu?.classList.add('hidden');
      }
    });

    card.querySelectorAll('.btn-popover-item').forEach(b => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(b.dataset.index, 10);
        const act = actionsList[idx];
        isMenuOpen = false;
        popoverMenu?.classList.add('hidden');
        closeCrmOverviewCard();
        if (act?.onClick) act.onClick();
        else if (act?.action) act.action();
      });
    });

    card.querySelectorAll('.btn-card-tab').forEach(tb => {
      tb.addEventListener('click', () => {
        activeTabId = tb.dataset.tab;
        renderCardContent();
      });
    });
  }

  // Close card when clicking outside
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeCrmOverviewCard();
    if (isMenuOpen && !card.querySelector('#card-popover-menu')?.contains(e.target) && !card.querySelector('#btn-card-menu-trigger')?.contains(e.target)) {
      isMenuOpen = false;
      card.querySelector('#card-popover-menu')?.classList.add('hidden');
    }
  });

  // Close on Escape key
  const onKeyDown = (e) => {
    if (e.key === 'Escape') closeCrmOverviewCard();
  };
  document.addEventListener('keydown', onKeyDown);
  overlay._onKeyDown = onKeyDown;

  renderCardContent();
  overlay.appendChild(card);
  document.body.appendChild(overlay);
  activeCardModal = overlay;
}

export function closeCrmOverviewCard() {
  if (activeCardModal) {
    if (activeCardModal._onKeyDown) {
      document.removeEventListener('keydown', activeCardModal._onKeyDown);
    }
    activeCardModal.remove();
    activeCardModal = null;
  }
}
