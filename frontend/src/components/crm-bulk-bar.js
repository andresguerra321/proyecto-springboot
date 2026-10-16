/**
 * Conceptzilla & Linear Minimalist Floating Bulk Action Bar
 * Replicating second 00:08 of Conceptzilla CRM:
 * Floating dark pill centered at the bottom of the viewport
 * Appears dynamically when 1 or more checkboxes are selected.
 */

import { renderIcon } from '../utils/icons.js';

let activeBulkBar = null;

/**
 * Attach and manage the Floating Bulk Action Bar for a table container
 * @param {Object} options
 * @param {HTMLElement} options.container - Parent container containing .crm-row-checkbox elements
 * @param {Array<{ label: string, icon: string, onClick: Function, danger?: boolean }>} options.actions - Bulk actions
 * @param {Function} [options.onSelectionChange] - Optional callback receiving array of selected IDs
 * @returns {{ getSelectedIds: () => string[], clearSelection: () => void, destroy: () => void }}
 */
export function setupCrmBulkBar({
  container,
  actions = [],
  onSelectionChange = null
}) {
  // Clean up any prior bar
  destroyCrmBulkBar();

  const bar = document.createElement('div');
  bar.id = 'crm-floating-bulk-bar';
  bar.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#18181B] text-white px-5 py-2.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.25)] flex items-center gap-4 text-xs z-40 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] select-none opacity-0 translate-y-4 pointer-events-none';

  bar.innerHTML = `
    <!-- Counter Badge -->
    <div class="flex items-center gap-2 font-medium">
      <span class="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">✓</span>
      <span id="bulk-selected-count">0 seleccionados</span>
    </div>

    <span class="w-px h-3.5 bg-zinc-700"></span>

    <!-- Action Buttons -->
    <div class="flex items-center gap-2" id="bulk-action-buttons">
      ${actions.map((act, idx) => `
        <button 
          class="btn-bulk-action flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-zinc-800 transition-colors cursor-pointer text-xs ${
            act.danger ? 'text-rose-400 hover:text-rose-300' : 'text-zinc-200 hover:text-white'
          }"
          data-index="${idx}"
        >
          ${renderIcon(act.icon || 'Check', 'w-3.5 h-3.5')}
          <span>${act.label}</span>
        </button>
      `).join('')}
    </div>

    <span class="w-px h-3.5 bg-zinc-700"></span>

    <!-- Dismiss Button -->
    <button id="btn-dismiss-bulk" class="text-zinc-400 hover:text-white transition-colors p-0.5 rounded-full cursor-pointer" title="Limpiar selección">
      ${renderIcon('X', 'w-3.5 h-3.5')}
    </button>
  `;

  document.body.appendChild(bar);
  activeBulkBar = bar;

  function updateBarState() {
    const checkboxes = container.querySelectorAll('.crm-row-checkbox:checked');
    const count = checkboxes.length;

    if (count > 0) {
      bar.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
      bar.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto');
      const countLabel = bar.querySelector('#bulk-selected-count');
      if (countLabel) countLabel.textContent = `${count} seleccionado${count > 1 ? 's' : ''}`;
    } else {
      bar.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
      bar.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
    }

    if (onSelectionChange) {
      const selectedIds = Array.from(checkboxes).map(cb => cb.dataset.id).filter(Boolean);
      onSelectionChange(selectedIds);
    }
  }

  // Master Checkbox handler (Select All)
  const masterCheckbox = container.querySelector('.crm-master-checkbox');
  masterCheckbox?.addEventListener('change', (e) => {
    const checked = e.target.checked;
    container.querySelectorAll('.crm-row-checkbox').forEach(cb => {
      cb.checked = checked;
    });
    updateBarState();
  });

  // Delegated event listener for row checkboxes
  const onCheckboxChange = (e) => {
    if (e.target.matches('.crm-row-checkbox')) {
      if (masterCheckbox && !e.target.checked) {
        masterCheckbox.checked = false;
      }
      updateBarState();
    }
  };
  container.addEventListener('change', onCheckboxChange);

  // Wire Action Buttons
  bar.querySelectorAll('.btn-bulk-action').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index, 10);
      const act = actions[idx];
      const selectedIds = Array.from(container.querySelectorAll('.crm-row-checkbox:checked'))
        .map(cb => cb.dataset.id)
        .filter(Boolean);

      if (act?.onClick) act.onClick(selectedIds);
    });
  });

  // Dismiss button
  bar.querySelector('#btn-dismiss-bulk')?.addEventListener('click', () => {
    clearSelection();
  });

  function clearSelection() {
    container.querySelectorAll('.crm-row-checkbox, .crm-master-checkbox').forEach(cb => {
      cb.checked = false;
    });
    updateBarState();
  }

  function getSelectedIds() {
    return Array.from(container.querySelectorAll('.crm-row-checkbox:checked'))
      .map(cb => cb.dataset.id)
      .filter(Boolean);
  }

  function destroy() {
    container.removeEventListener('change', onCheckboxChange);
    destroyCrmBulkBar();
  }

  return {
    getSelectedIds,
    clearSelection,
    destroy
  };
}

export function destroyCrmBulkBar() {
  if (activeBulkBar) {
    activeBulkBar.remove();
    activeBulkBar = null;
  }
}
