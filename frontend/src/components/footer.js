import { renderIcon, renderToolRentMark } from '../utils/icons.js';
import { openAuthModal } from './auth-modal.js';

export function renderFooter() {
  const container = document.getElementById('footer-container');
  if (!container) return;

  container.innerHTML = `
    <footer class="border-t border-slate-200/90 bg-white text-slate-600 py-10 mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <!-- Brand & Description -->
          <div class="space-y-3 md:col-span-1">
            <div class="flex items-center gap-2.5">
              ${renderToolRentMark('w-8 h-8', '#FF5A1F')}
              <span class="font-display font-extrabold text-xl text-slate-900 tracking-tight">ToolRent</span>
            </div>
            <p class="text-xs text-slate-500 leading-relaxed">
              Herramientas y maquinaria de alta calidad para construir, remodelar y hacer realidad tus proyectos en toda Colombia.
            </p>
            <div class="flex items-center gap-2 pt-1 text-xs text-slate-600 font-medium">
              <span class="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200"></span>
              <span>Disponibilidad inmediata en obra</span>
            </div>
          </div>

          <!-- Navegación de Plataforma -->
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 font-display">Plataforma</h4>
            <ul class="space-y-2.5 text-xs">
              <li><a href="#/catalog" class="text-slate-600 hover:text-[#FF5A1F] transition-colors">Catálogo de Equipos</a></li>
              <li><a href="#/catalog" class="text-slate-600 hover:text-[#FF5A1F] transition-colors">¿Cómo funciona el alquiler?</a></li>
              <li><button id="btn-footer-provider-register" type="button" class="text-slate-600 hover:text-[#FF5A1F] transition-colors text-left cursor-pointer">Registrarse como Proveedor</button></li>
              <li><a href="#/catalog" class="text-slate-600 hover:text-[#FF5A1F] transition-colors">Garantía y Seguros</a></li>
            </ul>
          </div>

          <!-- Categorías Principales -->
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 font-display">Categorías</h4>
            <ul class="space-y-2.5 text-xs">
              <li><a href="#/catalog" class="text-slate-600 hover:text-[#FF5A1F] transition-colors">Herramientas Eléctricas</a></li>
              <li><a href="#/catalog" class="text-slate-600 hover:text-[#FF5A1F] transition-colors">Equipos de Compactación</a></li>
              <li><a href="#/catalog" class="text-slate-600 hover:text-[#FF5A1F] transition-colors">Maquinaria Pesada</a></li>
              <li><a href="#/catalog" class="text-slate-600 hover:text-[#FF5A1F] transition-colors">Andamios y Formaletas</a></li>
            </ul>
          </div>

          <!-- Atención y Contacto -->
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 font-display">Atención y Soporte</h4>
            <ul class="space-y-2.5 text-xs text-slate-600">
              <li class="flex items-center gap-2">
                ${renderIcon('Phone', 'w-3.5 h-3.5 text-[#FF5A1F] flex-shrink-0')}
                <span>+57 (601) 745-9000</span>
              </li>
              <li class="flex items-center gap-2">
                ${renderIcon('Mail', 'w-3.5 h-3.5 text-[#FF5A1F] flex-shrink-0')}
                <span>soporte@toolrent.co</span>
              </li>
              <li class="flex items-center gap-2">
                ${renderIcon('MapPin', 'w-3.5 h-3.5 text-[#FF5A1F] flex-shrink-0')}
                <span>Cobertura en toda Colombia</span>
              </li>
              <li class="text-[11px] text-slate-400 pt-1">
                Lunes a Sábado: 7:00 AM – 6:00 PM
              </li>
            </ul>
          </div>

        </div>

        <!-- Línea inferior institucional -->
        <div class="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© 2026 ToolRent S.A.S. Todos los derechos reservados.</p>
          <div class="flex items-center gap-4 text-[11px]">
            <span class="flex items-center gap-1.5 text-slate-600 font-medium">
              ${renderIcon('ShieldCheck', 'w-4 h-4 text-emerald-500')} Alquiler Seguro y Pagos Protegidos
            </span>
          </div>
        </div>
      </div>
    </footer>
  `;

  container.querySelector('#btn-footer-provider-register')?.addEventListener('click', () => {
    openAuthModal('register', 'ROLE_PROVEEDOR');
  });
}
