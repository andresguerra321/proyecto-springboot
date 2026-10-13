import { renderIcon, renderToolRentMark } from '../utils/icons.js';

export function renderFooter() {
  const container = document.getElementById('footer-container');
  if (!container) return;

  container.innerHTML = `
    <footer class="border-t border-slate-800/80 bg-surface-950/90 backdrop-blur-md text-slate-400 py-12 mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div class="space-y-3 md:col-span-1">
            <div class="flex items-center gap-2.5">
              ${renderToolRentMark('w-8 h-8', '#FF5A1F')}
              <span class="font-display font-extrabold text-xl text-white">ToolRent</span>
            </div>
            <p class="text-xs text-slate-400 leading-relaxed">
              Herramientas y maquinaria para construir grandes proyectos en toda Colombia.
            </p>
          </div>

          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Roles de Plataforma</h4>
            <ul class="space-y-2 text-xs">
              <li><a href="#/catalog" class="hover:text-brand-400 transition-colors">Catálogo Público</a></li>
              <li><a href="#/client" class="hover:text-brand-400 transition-colors">Portal Cliente Particular / Obra</a></li>
              <li><a href="#/provider" class="hover:text-brand-400 transition-colors">Portal de Proveedores Afiliados</a></li>
              <li><a href="#/admin" class="hover:text-brand-400 transition-colors">Supervisión y Control Admin</a></li>
            </ul>
          </div>

          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Arquitectura y Estándares</h4>
            <ul class="space-y-2 text-xs">
              <li><span class="text-slate-300">Backend:</span> Spring Boot 3 + Java 21</li>
              <li><span class="text-slate-300">Base de Datos:</span> PostgreSQL 16 (4FN estricta)</li>
              <li><span class="text-slate-300">Seguridad:</span> JWT Stateless + RBAC</li>
              <li><span class="text-slate-300">Frontend:</span> Vite + Tailwind CSS v3</li>
            </ul>
          </div>

          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">Documentación API</h4>
            <p class="text-xs text-slate-400 mb-3">
              Explora los endpoints con contratos interactivos en Swagger UI:
            </p>
            <a href="http://localhost:8085/swagger-ui.html" target="_blank" rel="noopener noreferrer" class="btn-outline !py-2 text-xs inline-flex items-center gap-1.5 w-full justify-center">
              ${renderIcon('ExternalLink', 'w-3.5 h-3.5')} Abrir Swagger UI
            </a>
          </div>

        </div>

        <div class="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 RentaMaq. Todos los derechos reservados. Proyecto Académico CAMPUS.</p>
          <div class="flex items-center gap-4">
            <span class="flex items-center gap-1.5 text-slate-400">
              ${renderIcon('ShieldCheck', 'w-4 h-4 text-brand-400')} Cumple 4FN & Seguridad IDOR
            </span>
          </div>
        </div>
      </div>
    </footer>
  `;
}
