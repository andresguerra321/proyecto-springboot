import { renderToolRentMark } from '../utils/icons.js';
import { openAuthModal } from './auth-modal.js';

export function renderFooter() {
  const container = document.getElementById('footer-container');
  if (!container) return;

  container.innerHTML = `
    <footer class="border-t border-slate-200/80 bg-white text-slate-600 py-10 mt-auto select-none">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          
          <!-- Column 1: Identidad y llamada a proveedores (5 cols) -->
          <div class="lg:col-span-5 space-y-3">
            <div class="flex items-center gap-2.5">
              ${renderToolRentMark('w-7 h-7', '#ea580c')}
              <span class="font-display font-extrabold text-lg text-slate-900 tracking-tight">ToolRent</span>
            </div>
            
            <p class="text-xs text-slate-500 leading-relaxed max-w-sm">
              Plataforma para la reserva, alquiler y gestión de maquinaria pesada y herramientas de construcción.
            </p>

            <div class="pt-1.5">
              <button 
                id="btn-footer-provider-register" 
                type="button" 
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-[#ea580c] hover:bg-orange-100 text-xs font-semibold transition-colors cursor-pointer"
              >
                <span>¿Tienes equipos para alquilar? Publica como Proveedor</span>
                <span aria-hidden="true">&rarr;</span>
              </button>
            </div>
          </div>

          <!-- Column 2: Navegación Funcional (3 cols) -->
          <div class="lg:col-span-3 space-y-2.5">
            <h4 class="text-[11px] font-bold uppercase tracking-wider text-slate-900 font-display">Plataforma</h4>
            <ul class="space-y-2 text-xs">
              <li>
                <a href="#/about" class="text-slate-600 hover:text-[#ea580c] transition-colors">
                  Sobre nosotros
                </a>
              </li>
              <li>
                <a href="#/catalog" class="text-slate-600 hover:text-[#ea580c] transition-colors">
                  Explorar catálogo de equipos
                </a>
              </li>
              <li>
                <a href="#/client" class="text-slate-600 hover:text-[#ea580c] transition-colors">
                  Mis reservas y alquileres
                </a>
              </li>
              <li>
                <button id="btn-footer-login" type="button" class="text-slate-600 hover:text-[#ea580c] transition-colors cursor-pointer text-left">
                  Iniciar sesión
                </button>
              </li>
              <li>
                <button id="btn-footer-register" type="button" class="text-slate-600 hover:text-[#ea580c] transition-colors cursor-pointer text-left">
                  Crear cuenta de usuario
                </button>
              </li>
            </ul>
          </div>

          <!-- Column 3: Categorías Rápidas del Catálogo (4 cols) -->
          <div class="lg:col-span-4 space-y-2.5">
            <h4 class="text-[11px] font-bold uppercase tracking-wider text-slate-900 font-display">Categorías de equipos</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <a href="#/catalog?q=excavadora" class="text-slate-600 hover:text-[#ea580c] transition-colors">Movimiento de tierra</a>
              <a href="#/catalog?q=concreto" class="text-slate-600 hover:text-[#ea580c] transition-colors">Hormigón y concreto</a>
              <a href="#/catalog?q=eléctrica" class="text-slate-600 hover:text-[#ea580c] transition-colors">Herramientas eléctricas</a>
              <a href="#/catalog?q=elevación" class="text-slate-600 hover:text-[#ea580c] transition-colors">Elevación y andamios</a>
              <a href="#/catalog?q=compactadora" class="text-slate-600 hover:text-[#ea580c] transition-colors">Compactación de suelos</a>
              <a href="#/catalog?q=generador" class="text-slate-600 hover:text-[#ea580c] transition-colors">Generación de energía</a>
            </div>
          </div>

        </div>

        <!-- Línea Inferior Simplificada -->
        <div class="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© 2026 ToolRent. Plataforma de Renta de Herramientas y Equipos.</p>
          <div class="flex items-center gap-4 text-xs text-slate-500">
            <a href="#/catalog" class="hover:text-slate-700 transition-colors">Catálogo</a>
            <span>·</span>
            <button id="btn-footer-provider-link" type="button" class="hover:text-slate-700 transition-colors cursor-pointer">Proveedores</button>
            <span>·</span>
            <a href="#/client" class="hover:text-slate-700 transition-colors">Mi cuenta</a>
          </div>
        </div>

      </div>
    </footer>
  `;

  // Listeners funcionales
  container.querySelector('#btn-footer-provider-register')?.addEventListener('click', () => {
    openAuthModal('register', 'ROLE_PROVEEDOR');
  });

  container.querySelector('#btn-footer-provider-link')?.addEventListener('click', () => {
    openAuthModal('register', 'ROLE_PROVEEDOR');
  });

  container.querySelector('#btn-footer-login')?.addEventListener('click', () => {
    openAuthModal('login');
  });

  container.querySelector('#btn-footer-register')?.addEventListener('click', () => {
    openAuthModal('register', 'ROLE_CLIENTE');
  });
}

export default renderFooter;
