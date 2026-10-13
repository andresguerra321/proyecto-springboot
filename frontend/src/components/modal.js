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

  open({ title, content, maxWidth = 'max-w-2xl', onClose = null }) {
    this.container = document.getElementById('modal-container');
    if (!this.container) return;

    this.onCloseCallback = onClose;

    const modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 transition-opacity duration-300 opacity-0 overflow-y-auto';
    modalBackdrop.id = 'active-modal-backdrop';

    modalBackdrop.innerHTML = `
      <div class="glass-card w-full ${maxWidth} my-8 transform transition-all duration-300 scale-95 opacity-0 overflow-hidden border border-slate-700/80 shadow-2xl relative" id="modal-box">
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <h3 class="text-lg font-bold text-white font-display flex items-center gap-2">${title}</h3>
          <button id="modal-close-btn" class="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors" aria-label="Cerrar modal">
            ${renderIcon('X', 'w-5 h-5')}
          </button>
        </div>
        <!-- Modal Content -->
        <div class="p-6 max-h-[80vh] overflow-y-auto" id="modal-body">
          ${typeof content === 'string' ? content : ''}
        </div>
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
        box.classList.remove('scale-95', 'opacity-0');
        box.classList.add('scale-100', 'opacity-100');
      }
    });

    return modalBackdrop;
  }

  close() {
    if (!this.activeModal) return;

    const modal = this.activeModal;
    const box = modal.querySelector('#modal-box');
    if (box) {
      box.classList.add('scale-95', 'opacity-0');
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
