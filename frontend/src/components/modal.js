import { renderIcon } from '../utils/icons.js';

class ModalController {
  constructor() {
    this.container = document.getElementById('modal-container');
    this.activeModal = null;
    this.keydownHandler = (e) => {
      if (e.key === 'Escape' && this.activeModal) {
        this.close();
      }
    };
  }

  open({ title = '', content, maxWidth = 'max-w-2xl', hideHeader = false, onClose = null }) {
    this.container = document.getElementById('modal-container');
    if (!this.container) return;

    this.onCloseCallback = onClose;

    const modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 transition-opacity duration-300 opacity-0 overflow-y-auto';
    modalBackdrop.id = 'active-modal-backdrop';

    modalBackdrop.innerHTML = `
      <div class="bg-white rounded-t-3xl sm:rounded-2xl w-full ${maxWidth} mt-auto sm:my-8 transform-gpu transition-[opacity,transform] duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] translate-y-6 sm:translate-y-0 sm:scale-95 opacity-0 overflow-hidden border border-slate-200/80 shadow-2xl relative max-h-[92vh] sm:max-h-[88vh] flex flex-col" id="modal-box">
        <!-- Mobile bottom-sheet drag handle -->
        <div class="w-12 h-1 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1 sm:hidden flex-shrink-0"></div>

        ${!hideHeader ? `
          <!-- Modal Header -->
          <div class="px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-white flex-shrink-0">
            <h3 class="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">${title}</h3>
            <button id="modal-close-btn" class="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Cerrar modal">
              ${renderIcon('X', 'w-5 h-5')}
            </button>
          </div>
          <!-- Modal Content -->
          <div class="p-4 sm:p-6 overflow-y-auto overscroll-contain flex-1" id="modal-body">
            ${typeof content === 'string' ? content : ''}
          </div>
        ` : `
          <button id="modal-close-btn" class="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 text-slate-400 hover:text-slate-600 p-2 rounded-lg bg-white/80 backdrop-blur-sm shadow-sm hover:bg-slate-100 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Cerrar modal">
            ${renderIcon('X', 'w-5 h-5')}
          </button>
          <div class="p-4 sm:p-6 overflow-y-auto overscroll-contain flex-1" id="modal-body">
            ${typeof content === 'string' ? content : ''}
          </div>
        `}
      </div>
    `;

    if (typeof content !== 'string' && content instanceof HTMLElement) {
      modalBackdrop.querySelector('#modal-body').appendChild(content);
    }

    this.container.innerHTML = '';
    this.container.appendChild(modalBackdrop);
    this.activeModal = modalBackdrop;

    // Attach listeners
    modalBackdrop.querySelector('#modal-close-btn').addEventListener('click', () => this.close());
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        this.close();
      }
    });

    document.addEventListener('keydown', this.keydownHandler);

    // Animate in
    requestAnimationFrame(() => {
      modalBackdrop.classList.remove('opacity-0');
      const box = modalBackdrop.querySelector('#modal-box');
      if (box) {
        box.classList.remove('translate-y-6', 'sm:scale-95', 'opacity-0');
        box.classList.add('translate-y-0', 'sm:scale-100', 'opacity-100');
      }
    });

    return modalBackdrop;
  }

  close() {
    if (!this.activeModal) return;

    const modal = this.activeModal;
    const box = modal.querySelector('#modal-box');
    if (box) {
      box.classList.remove('translate-y-0', 'sm:scale-100');
      box.classList.add('translate-y-6', 'sm:scale-95', 'opacity-0');
    }
    modal.classList.add('opacity-0');

    setTimeout(() => {
      if (this.container) this.container.innerHTML = '';
      this.activeModal = null;
      document.removeEventListener('keydown', this.keydownHandler);
      if (this.onCloseCallback) {
        this.onCloseCallback();
        this.onCloseCallback = null;
      }
    }, 200);
  }
}

export const modal = new ModalController();
export default modal;
