import { renderIcon } from '../utils/icons.js';
import { animate } from '../utils/animations.js';

export function showToast(message, type = 'success', durationMs = 4000, title = '') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `pointer-events-auto flex items-start gap-3.5 p-4 rounded-2xl border bg-white/95 backdrop-blur-md shadow-[0_12px_32px_-4px_rgba(15,23,42,0.12),0_2px_6px_rgba(15,23,42,0.04)] text-xs font-sans max-w-sm w-full opacity-0 transform-gpu select-none`;

  let iconName = 'CheckCircle2';
  let defaultTitle = 'Éxito';
  let borderClass = 'border-emerald-200/90';
  let iconBoxClass = 'bg-emerald-50 text-emerald-600 border border-emerald-200/80';

  if (type === 'error') {
    iconName = 'XCircle';
    defaultTitle = 'Error';
    borderClass = 'border-rose-200/90';
    iconBoxClass = 'bg-rose-50 text-rose-600 border border-rose-200/80';
  } else if (type === 'info') {
    iconName = 'Info';
    defaultTitle = 'Información';
    borderClass = 'border-blue-200/90';
    iconBoxClass = 'bg-blue-50 text-blue-600 border border-blue-200/80';
  } else if (type === 'warning') {
    iconName = 'AlertTriangle';
    defaultTitle = 'Atención';
    borderClass = 'border-amber-200/90';
    iconBoxClass = 'bg-amber-50 text-amber-600 border border-amber-200/80';
  }

  const finalTitle = title || defaultTitle;
  toast.className += ` ${borderClass}`;

  toast.innerHTML = `
    <div class="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${iconBoxClass}">
      ${renderIcon(iconName, 'w-4 h-4')}
    </div>
    <div class="flex-1 min-w-0 pr-1">
      <div class="font-bold text-xs text-slate-900 leading-tight mb-1">${finalTitle}</div>
      <div class="text-[11px] text-slate-500 leading-relaxed break-words">${message}</div>
    </div>
    <button class="text-slate-400 hover:text-slate-700 active:scale-90 transition-all p-1 rounded-lg hover:bg-slate-100/80 cursor-pointer flex-shrink-0" aria-label="Cerrar">
      ${renderIcon('X', 'w-3.5 h-3.5')}
    </button>
  `;

  const closeBtn = toast.querySelector('button');
  let isRemoved = false;
  const removeToast = () => {
    if (isRemoved) return;
    isRemoved = true;
    animate(toast, {
      opacity: [1, 0],
      scale: [1, 0.94],
      translateY: [0, 8],
      duration: 220,
      ease: 'inQuad',
      onComplete: () => toast.remove()
    });
  };

  closeBtn.addEventListener('click', removeToast);
  container.appendChild(toast);

  // Trigger smooth enter animation with spring settle (Emil Kowalski Sonner curve)
  animate(toast, {
    opacity: [0, 1],
    translateY: [20, 0],
    scale: [0.93, 1],
    duration: 320,
    ease: 'outBack(1.3)'
  });

  // Auto remove
  setTimeout(removeToast, durationMs);
}

export default showToast;
