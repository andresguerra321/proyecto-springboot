import { renderIcon } from '../utils/icons.js';

let activePopoverContainer = null;

/**
 * Closes any open row action popover
 */
export function closeRowActionPopover() {
  if (activePopoverContainer && activePopoverContainer.parentNode) {
    activePopoverContainer.parentNode.removeChild(activePopoverContainer);
  }
  activePopoverContainer = null;
}

/**
 * Open a contextual action popover anchored to a 3-dots button (...)
 * Allows direct actions like "Editar" or "Eliminar" without opening the CRM card.
 * 
 * @param {Object} options
 * @param {HTMLElement} options.triggerElement - The 3-dots button clicked
 * @param {Array<{ label: string, icon?: string, onClick: Function, danger?: boolean, divider?: boolean, description?: string }>} options.items
 */
export function showRowActionPopover({ triggerElement, items = [] }) {
  closeRowActionPopover();

  if (!triggerElement || !items || items.length === 0) return;

  const rect = triggerElement.getBoundingClientRect();
  const menuWidth = 220;

  // Horizontal alignment: right-align with button, bounded by viewport
  let left = rect.right - menuWidth;
  if (left < 12) left = 12;
  if (left + menuWidth > window.innerWidth - 12) {
    left = window.innerWidth - menuWidth - 12;
  }

  // Vertical alignment: open downwards unless hitting screen bottom
  const approxItemHeight = 44;
  const estimatedHeight = items.length * approxItemHeight + 16;
  let top = rect.bottom + 6;
  let originClass = 'origin-top-right';

  if (top + estimatedHeight > window.innerHeight - 12 && rect.top > estimatedHeight + 12) {
    top = rect.top - estimatedHeight - 6;
    originClass = 'origin-bottom-right';
  }

  const container = document.createElement('div');
  container.id = 'crm-row-popover-container';
  container.className = 'fixed inset-0 z-[9999] select-none';

  container.innerHTML = `
    <!-- Transparent backdrop for outside clicks -->
    <div class="fixed inset-0 bg-black/5 backdrop-blur-[0.5px] transition-opacity" id="row-popover-backdrop"></div>

    <!-- Floating Action Menu Card -->
    <div 
      id="row-popover-card" 
      class="fixed bg-white rounded-xl border border-zinc-200/90 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.15),0_1px_3px_rgba(0,0,0,0.06)] py-1.5 z-[10000] text-xs animate-in fade-in zoom-in-95 duration-150 ${originClass}"
      style="width: ${menuWidth}px; top: ${Math.round(top)}px; left: ${Math.round(left)}px;"
    >
      <div class="px-3 py-1 mb-1 border-b border-zinc-100 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
        <span>Opciones rápidas</span>
        ${renderIcon('MoreHorizontal', 'w-3 h-3 text-zinc-300')}
      </div>
      <div class="space-y-0.5" id="popover-items-list">
        ${items.map((item, idx) => {
          if (item.divider) {
            return `<div class="my-1 border-t border-zinc-100"></div>`;
          }
          return `
            <button 
              type="button" 
              class="btn-popover-action w-full px-3 py-2 text-left flex items-start gap-2.5 transition-colors cursor-pointer group ${
                item.danger 
                  ? 'text-rose-600 hover:bg-rose-50' 
                  : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900'
              }"
              data-index="${idx}"
            >
              <span class="mt-0.5 flex-shrink-0 ${item.danger ? 'text-rose-500' : 'text-zinc-400 group-hover:text-zinc-700'}">
                ${renderIcon(item.icon || 'ChevronRight', 'w-3.5 h-3.5')}
              </span>
              <div class="min-w-0 flex-1">
                <div class="font-semibold text-xs leading-tight">${item.label}</div>
                ${item.description ? `<div class="text-[10px] text-zinc-400 font-normal leading-tight mt-0.5">${item.description}</div>` : ''}
              </div>
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `;

  // Attach handlers
  container.querySelector('#row-popover-backdrop')?.addEventListener('click', (e) => {
    e.stopPropagation();
    closeRowActionPopover();
  });

  container.querySelectorAll('.btn-popover-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.index, 10);
      const targetItem = items[idx];
      closeRowActionPopover();
      if (targetItem && typeof targetItem.onClick === 'function') {
        targetItem.onClick();
      }
    });
  });

  // Global dismiss listeners
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeRowActionPopover();
      window.removeEventListener('keydown', handleKeyDown);
    }
  };
  window.addEventListener('keydown', handleKeyDown);

  const handleScroll = (e) => {
    // Only dismiss if scroll is outside the popover itself
    if (!container.contains(e.target)) {
      closeRowActionPopover();
      window.removeEventListener('scroll', handleScroll, true);
    }
  };
  window.addEventListener('scroll', handleScroll, true);

  document.body.appendChild(container);
  activePopoverContainer = container;
}
