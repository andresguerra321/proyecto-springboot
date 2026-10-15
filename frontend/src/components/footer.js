import { renderIcon, renderToolRentMark } from '../utils/icons.js';
import { openAuthModal } from './auth-modal.js';
import { openTechnicalReturnGuideModal, openEmergencySupportModal } from '../utils/client-utilities-modals.js';

export function renderFooter() {
  const container = document.getElementById('footer-container');
  if (!container) return;

  container.innerHTML = `
    <footer class="border-t border-slate-200/90 bg-white text-slate-600 py-12 mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10">
          
          <!-- Column 1: Brand & Operational Status (4 cols) -->
          <div class="lg:col-span-4 space-y-3.5">
            <div class="flex items-center gap-2.5">
              ${renderToolRentMark('w-8 h-8', '#FF5A1F')}
              <span class="font-display font-extrabold text-xl text-slate-900 tracking-tight">ToolRent</span>
            </div>
            
            <p class="text-xs text-slate-500 leading-relaxed max-w-sm">
              Plataforma digital para la gestión y alquiler de maquinaria pesada y herramientas certificadas en Colombia. Contratos 100% digitales y despacho garantizado a obra.
            </p>

            <div class="pt-1 flex items-center gap-2 text-[11px] font-semibold text-slate-600">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Servicio de despacho e inspección activo</span>
            </div>
          </div>

          <!-- Column 2: Accesos Útiles del Cliente (3 cols) -->
          <div class="lg:col-span-3 space-y-3">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-900 font-display">Accesos Útiles</h4>
            <ul class="space-y-2 text-xs">
              <li>
                <a href="#/client" class="text-slate-600 hover:text-[#FF5A1F] transition-colors flex items-center gap-1.5">
                  ${renderIcon('FileText', 'w-3.5 h-3.5 text-slate-400')}
                  <span>Facturación Electrónica DIAN</span>
                </a>
              </li>
              <li>
                <button id="btn-footer-return-guide" type="button" class="text-slate-600 hover:text-[#FF5A1F] transition-colors flex items-center gap-1.5 text-left cursor-pointer">
                  ${renderIcon('ClipboardCheck', 'w-3.5 h-3.5 text-slate-400')}
                  <span>Protocolo de Devolución e Inspección</span>
                </button>
              </li>
              <li>
                <a href="#/catalog" class="text-slate-600 hover:text-[#FF5A1F] transition-colors flex items-center gap-1.5">
                  ${renderIcon('Calculator', 'w-3.5 h-3.5 text-slate-400')}
                  <span>Cotizador de Días y Presupuesto</span>
                </a>
              </li>
              <li>
                <button id="btn-footer-tech-support" type="button" class="text-slate-600 hover:text-[#FF5A1F] transition-colors flex items-center gap-1.5 text-left cursor-pointer">
                  ${renderIcon('Wrench', 'w-3.5 h-3.5 text-slate-400')}
                  <span>Mesa de Soporte en Obra (24/7)</span>
                </button>
              </li>
            </ul>
          </div>

          <!-- Column 3: Categorías Rápidas (2 cols) -->
          <div class="lg:col-span-2 space-y-3">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-900 font-display">Categorías</h4>
            <ul class="space-y-2 text-xs">
              <li><a href="#/catalog?q=excavadora" class="text-slate-600 hover:text-[#FF5A1F] transition-colors">Movimiento de tierra</a></li>
              <li><a href="#/catalog?q=eléctrica" class="text-slate-600 hover:text-[#FF5A1F] transition-colors">Herramientas eléctricas</a></li>
              <li><a href="#/catalog?q=concreto" class="text-slate-600 hover:text-[#FF5A1F] transition-colors">Hormigón y construcción</a></li>
              <li><a href="#/catalog?q=elevación" class="text-slate-600 hover:text-[#FF5A1F] transition-colors">Elevación y andamios</a></li>
              <li><a href="#/catalog?q=compactadora" class="text-slate-600 hover:text-[#FF5A1F] transition-colors">Compactación de suelos</a></li>
            </ul>
          </div>

          <!-- Column 4: Contacto y Soporte Oficial (3 cols) -->
          <div class="lg:col-span-3 space-y-3">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-900 font-display">Atención Nacional</h4>
            <ul class="space-y-2 text-xs text-slate-600">
              <li class="flex items-center gap-2">
                ${renderIcon('Phone', 'w-3.5 h-3.5 text-[#FF5A1F] flex-shrink-0')}
                <span>Línea fija: +57 (601) 745-9000</span>
              </li>
              <li class="flex items-center gap-2">
                ${renderIcon('MessageSquare', 'w-3.5 h-3.5 text-emerald-600 flex-shrink-0')}
                <span>WhatsApp: +57 317 654 3210</span>
              </li>
              <li class="flex items-center gap-2">
                ${renderIcon('Mail', 'w-3.5 h-3.5 text-slate-400 flex-shrink-0')}
                <span>operaciones@toolrent.co</span>
              </li>
              <li class="pt-1.5">
                <button id="btn-footer-provider-register" type="button" class="text-xs font-bold text-[#FF5A1F] hover:text-[#e04e18] transition-colors text-left cursor-pointer inline-flex items-center gap-1">
                  <span>¿Eres proveedor de maquinaria? Regístrate aquí</span>
                  <span>&rarr;</span>
                </button>
              </li>
            </ul>
          </div>

        </div>

        <!-- Línea Inferior Institucional Discreta -->
        <div class="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© 2026 ToolRent S.A.S. NIT 901.482.319-4. Todos los derechos reservados.</p>
          <div class="flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
            <span>Contratos digitales válidos en Colombia</span>
            <span>·</span>
            <span>Facturación electrónica avalada por la DIAN</span>
            <span>·</span>
            <span>Depósitos con reintegro automático</span>
          </div>
        </div>

      </div>
    </footer>
  `;

  // Listeners
  container.querySelector('#btn-footer-provider-register')?.addEventListener('click', () => {
    openAuthModal('register', 'ROLE_PROVEEDOR');
  });

  container.querySelector('#btn-footer-return-guide')?.addEventListener('click', () => {
    openTechnicalReturnGuideModal();
  });

  container.querySelector('#btn-footer-tech-support')?.addEventListener('click', () => {
    openEmergencySupportModal();
  });
}
