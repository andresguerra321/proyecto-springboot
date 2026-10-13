import { renderIcon } from '../utils/icons.js';

export function showToast(message, type = 'success', durationMs = 4000, title = '') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg text-xs font-sans transition-all duration-300 transform translate-y-4 opacity-0 max-w-sm w-full`;

  let iconName = 'CheckCircle2';
  let defaultTitle = 'Éxito';
  let colorClasses = 'bg-[#ecfdf5] border-[#a7f3d0] text-[#065f46]';
  let iconColor = 'text-[#059669]';

  if (type === 'error') {
    iconName = 'XCircle';
    defaultTitle = 'Error';
    colorClasses = 'bg-[#fef2f2] border-[#fecaca] text-[#991b1b]';
    iconColor = 'text-[#dc2626]';
  } else if (type === 'info') {
    iconName = 'Info';
    defaultTitle = 'Información';
    colorClasses = 'bg-[#eff6ff] border-[#bfdbfe] text-[#1e40af]';
    iconColor = 'text-[#2563eb]';
  } else if (type === 'warning') {
    iconName = 'AlertTriangle';
    defaultTitle = 'Advertencia';
    colorClasses = 'bg-[#fffbeb] border-[#fde68a] text-[#92400e]';
    iconColor = 'text-[#d97706]';
  }

  const finalTitle = title || defaultTitle;
  toast.className += ` ${colorClasses}`;

  toast.innerHTML = `
    <div class="flex-shrink-0 mt-0.5 ${iconColor}">
      ${renderIcon(iconName, 'w-5 h-5')}
    </div>
    <div class="flex-1 pr-1">
      <div class="font-bold text-xs leading-none mb-1">${finalTitle}</div>
      <div class="text-[11px] opacity-90 leading-relaxed">${message}</div>
    </div>
    <button class="text-current opacity-40 hover:opacity-100 transition-opacity p-0.5" aria-label="Cerrar">
      ${renderIcon('X', 'w-4 h-4')}
    </button>
  `;

  const closeBtn = toast.querySelector('button');
  const removeToast = () => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 250);
  };

  closeBtn.addEventListener('click', removeToast);
  container.appendChild(toast);

  // Trigger enter animation
  requestAnimationFrame(() => {
    toast.classList.remove('opacity-0', 'translate-y-4');
  });

  // Auto remove
  setTimeout(removeToast, durationMs);
}

export default showToast;
