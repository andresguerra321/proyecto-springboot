import { renderIcon } from '../utils/icons.js';

export function showToast(message, type = 'info', durationMs = 4000) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-xl text-sm font-medium transition-all duration-300 transform translate-y-4 opacity-0`;

  let iconName = 'Info';
  let colorClasses = 'bg-slate-900/90 border-slate-700 text-slate-200';

  if (type === 'success') {
    iconName = 'CheckCircle2';
    colorClasses = 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200 shadow-glow-emerald';
  } else if (type === 'error') {
    iconName = 'AlertCircle';
    colorClasses = 'bg-rose-950/90 border-rose-500/40 text-rose-200';
  } else if (type === 'warning') {
    iconName = 'AlertTriangle';
    colorClasses = 'bg-amber-950/90 border-amber-500/40 text-amber-200 shadow-glow-amber';
  }

  toast.className += ` ${colorClasses}`;
  toast.innerHTML = `
    <div class="flex-shrink-0">${renderIcon(iconName, 'w-5 h-5')}</div>
    <div class="flex-1 pr-2">${message}</div>
    <button class="text-current opacity-60 hover:opacity-100 transition-opacity p-0.5" aria-label="Cerrar">
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
