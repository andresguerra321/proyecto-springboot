import { renderIcon } from '../utils/icons.js';
import gsap from 'gsap';

const recentToasts = new Map();
const MAX_VISIBLE_TOASTS = 3;

export function showToast(message, type = 'success', durationMs = 4000, title = '') {
  const container = document.getElementById('toast-container');
  if (!container || !message) return;

  // Anti-Spam: Deduplicate identical toasts within 1800ms
  const toastKey = `${type}:${message}`;
  const now = Date.now();
  if (recentToasts.has(toastKey) && now - recentToasts.get(toastKey) < 1800) {
    return;
  }
  recentToasts.set(toastKey, now);

  // Limit max visible toasts on screen to prevent waterfall spam
  while (container.children.length >= MAX_VISIBLE_TOASTS) {
    const oldest = container.firstElementChild;
    if (oldest) oldest.remove();
  }

  const toast = document.createElement('div');
  toast.className = `pointer-events-auto relative overflow-hidden flex items-start gap-3.5 p-4 rounded-2xl border bg-white/95 backdrop-blur-md shadow-[0_12px_32px_-4px_rgba(15,23,42,0.12),0_2px_6px_rgba(15,23,42,0.04)] text-xs font-sans max-w-sm w-full opacity-0 transform-gpu select-none`;

  let iconName = 'CheckCircle2';
  let defaultTitle = 'Éxito';
  let borderClass = 'border-emerald-200/90';
  let iconBoxClass = 'bg-emerald-50 text-emerald-600 border border-emerald-200/80';
  let progressClass = 'bg-emerald-500';

  if (type === 'error') {
    iconName = 'XCircle';
    defaultTitle = 'Error';
    borderClass = 'border-rose-200/90';
    iconBoxClass = 'bg-rose-50 text-rose-600 border border-rose-200/80';
    progressClass = 'bg-rose-500';
  } else if (type === 'info') {
    iconName = 'Info';
    defaultTitle = 'Información';
    borderClass = 'border-blue-200/90';
    iconBoxClass = 'bg-blue-50 text-blue-600 border border-blue-200/80';
    progressClass = 'bg-blue-500';
  } else if (type === 'warning') {
    iconName = 'AlertTriangle';
    defaultTitle = 'Atención';
    borderClass = 'border-amber-200/90';
    iconBoxClass = 'bg-amber-50 text-amber-600 border border-amber-200/80';
    progressClass = 'bg-amber-500';
  }

  const finalTitle = title || defaultTitle;
  toast.className += ` ${borderClass}`;

  toast.innerHTML = `
    <!-- Icon Box with Particle Burst Target -->
    <div class="toast-icon-box flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center relative ${iconBoxClass}">
      ${renderIcon(iconName, 'w-4 h-4')}
    </div>
    <div class="flex-1 min-w-0 pr-1">
      <div class="font-bold text-xs text-slate-900 leading-tight mb-1 font-display">${finalTitle}</div>
      <div class="text-[11px] text-slate-500 leading-relaxed break-words">${message}</div>
    </div>
    <button class="text-slate-400 hover:text-slate-700 active:scale-90 transition-all p-1 rounded-lg hover:bg-slate-100/80 cursor-pointer flex-shrink-0" aria-label="Cerrar">
      ${renderIcon('X', 'w-3.5 h-3.5')}
    </button>
    <!-- Motion Progress Duration Beam -->
    <div class="toast-progress-beam absolute bottom-0 left-0 right-0 h-[2.5px] ${progressClass} origin-left"></div>
  `;

  const closeBtn = toast.querySelector('button');
  const progressBar = toast.querySelector('.toast-progress-beam');
  let isRemoved = false;
  let autoDismissTimer = null;

  const removeToast = () => {
    if (isRemoved) return;
    isRemoved = true;
    if (autoDismissTimer) clearTimeout(autoDismissTimer);

    gsap.to(toast, {
      opacity: 0,
      y: 10,
      scale: 0.94,
      duration: 0.22,
      ease: 'power2.in',
      onComplete: () => {
        try { toast.remove(); } catch (_) {}
      }
    });
  };

  closeBtn.addEventListener('click', removeToast);
  container.appendChild(toast);

  requestAnimationFrame(() => {
    // Entrance animation using GSAP
    gsap.fromTo(
      toast,
      { opacity: 0, y: 16, scale: 0.93 },
      { opacity: 1, y: 0, scale: 1, duration: 0.28, ease: 'power2.out' }
    );

    // Progress bar animation using GSAP
    if (progressBar) {
      gsap.fromTo(
        progressBar,
        { scaleX: 1, transformOrigin: 'left' },
        { scaleX: 0, duration: Math.max(0.5, durationMs / 1000), ease: 'none' }
      );
    }
  });

  // Auto remove after duration
  autoDismissTimer = setTimeout(removeToast, durationMs);
}

export default showToast;
