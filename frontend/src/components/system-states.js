import { renderIcon, renderToolRentMark } from '../utils/icons.js';
import { openAuthModal } from './auth-modal.js';

/**
 * ToolRent System States & Skeletons Library
 * Exactly reproducing img/ToolRent System States Showcase.png
 */

// 1. Skeleton - Grid de Tarjetas (Cards Grid Loading State)
export function renderCardGridSkeleton(count = 6) {
  return `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      ${Array.from({ length: count }).map(() => `
        <div class="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-4 shadow-xs">
          <!-- Image Placeholder -->
          <div class="h-44 bg-slate-100 rounded-xl w-full"></div>
          <!-- Title & Category Placeholders -->
          <div class="space-y-2">
            <div class="h-4 bg-slate-200 rounded w-3/4"></div>
            <div class="h-3 bg-slate-100 rounded w-1/2"></div>
          </div>
          <!-- Price & Button Placeholders -->
          <div class="flex items-center justify-between pt-2 border-t border-slate-50">
            <div class="h-5 bg-slate-200 rounded w-24"></div>
            <div class="h-8 bg-slate-200 rounded-lg w-24"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// 2. Skeleton - Tabla (Table Loading State)
export function renderTableSkeleton(rows = 6) {
  return `
    <div class="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs animate-pulse space-y-4">
      <!-- Table Header Placeholder -->
      <div class="flex items-center justify-between pb-4 border-b border-slate-100">
        <div class="h-3.5 bg-slate-200 rounded w-28"></div>
        <div class="h-3.5 bg-slate-100 rounded w-24 hidden sm:block"></div>
        <div class="h-3.5 bg-slate-100 rounded w-24 hidden md:block"></div>
        <div class="h-3.5 bg-slate-100 rounded w-20 hidden lg:block"></div>
        <div class="h-3.5 bg-slate-200 rounded w-16"></div>
      </div>
      <!-- Table Data Rows Placeholders -->
      <div class="space-y-3.5">
        ${Array.from({ length: rows }).map(() => `
          <div class="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-slate-100 rounded-xl flex-shrink-0"></div>
              <div class="space-y-1.5">
                <div class="h-3.5 bg-slate-200 rounded w-36 sm:w-48"></div>
                <div class="h-2.5 bg-slate-100 rounded w-24"></div>
              </div>
            </div>
            <div class="h-3 bg-slate-100 rounded w-20 hidden sm:block"></div>
            <div class="h-3 bg-slate-100 rounded w-24 hidden md:block"></div>
            <div class="h-6 bg-slate-100 rounded-full w-20 sm:w-24"></div>
            <div class="w-4 h-4 bg-slate-100 rounded-full flex-shrink-0"></div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// 3. Skeleton - Dashboard (Metrics & Charts Loading State)
export function renderDashboardSkeleton() {
  return `
    <div class="space-y-6 animate-pulse">
      <!-- 4 Top KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        ${[1, 2, 3, 4].map(() => `
          <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-slate-100 flex-shrink-0"></div>
            <div class="space-y-2 flex-1">
              <div class="h-3 bg-slate-100 rounded w-1/2"></div>
              <div class="h-5 bg-slate-200 rounded w-3/4"></div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Main Horizontal Bars Chart Area -->
      <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div class="flex items-center justify-between">
          <div class="h-4 bg-slate-200 rounded w-36"></div>
          <div class="h-3 bg-slate-100 rounded w-20"></div>
        </div>
        <div class="space-y-3 pt-2">
          ${[85, 60, 45, 30].map(width => `
            <div class="flex items-center gap-4">
              <div class="h-3 bg-slate-100 rounded w-24"></div>
              <div class="flex-1 bg-slate-50 h-5 rounded-lg overflow-hidden">
                <div class="bg-slate-200 h-full rounded-lg" style="width: ${width}%"></div>
              </div>
              <div class="h-3 bg-slate-100 rounded w-12"></div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Bottom Split: Donut Chart & List Rows -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-center h-64">
          <div class="w-36 h-36 rounded-full border-8 border-slate-100 border-t-slate-200"></div>
        </div>
        <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div class="h-4 bg-slate-200 rounded w-32 mb-4"></div>
          ${[1, 2, 3, 4].map(() => `
            <div class="flex items-center justify-between py-2 border-b border-slate-50">
              <div class="h-3 bg-slate-100 rounded w-40"></div>
              <div class="h-3 bg-slate-200 rounded w-16"></div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// 4. Tu sesión expiró, inicia sesión de nuevo
export function renderSessionExpiredState() {
  return `
    <div class="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 text-center max-w-md mx-auto shadow-sm space-y-5">
      <!-- Header Logo -->
      <div class="flex items-center gap-2 justify-center mb-2">
        ${renderToolRentMark('w-6 h-6', '#FF5A1F')}
        <span class="font-display font-extrabold text-base text-slate-900">ToolRent</span>
      </div>

      <!-- Graphic Icon Badge -->
      <div class="w-16 h-16 rounded-full bg-orange-50/80 border border-orange-100 flex items-center justify-center mx-auto text-[#FF5A1F] relative">
        ${renderIcon('Lock', 'w-8 h-8')}
        <span class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] shadow-xs">
          ${renderIcon('Clock', 'w-3.5 h-3.5')}
        </span>
      </div>

      <!-- Title & Message -->
      <div>
        <h3 class="text-lg font-bold text-slate-900 font-display">Tu sesión expiró, inicia sesión de nuevo</h3>
        <p class="text-xs text-slate-500 mt-2 leading-relaxed">
          Por seguridad, tu sesión ha caducado. Vuelve a iniciar sesión para continuar.
        </p>
      </div>

      <!-- CTA Button -->
      <div>
        <button id="btn-state-login" class="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#FF5A1F] hover:bg-[#e04e18] shadow-sm transition-all active:scale-95 cursor-pointer">
          Iniciar sesión
        </button>
      </div>
    </div>
  `;
}

// 5. No tienes permiso para ver esta página (403 Forbidden)
export function renderForbiddenState() {
  return `
    <div class="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 text-center max-w-md mx-auto shadow-sm space-y-5">
      <!-- Header Logo -->
      <div class="flex items-center gap-2 justify-center mb-2">
        ${renderToolRentMark('w-6 h-6', '#FF5A1F')}
        <span class="font-display font-extrabold text-base text-slate-900">ToolRent</span>
      </div>

      <!-- Graphic Icon Badge -->
      <div class="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-600 relative">
        ${renderIcon('Shield', 'w-8 h-8')}
        <span class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] shadow-xs">
          ${renderIcon('Ban', 'w-3.5 h-3.5')}
        </span>
      </div>

      <!-- Title & Message -->
      <div>
        <h3 class="text-lg font-bold text-slate-900 font-display">No tienes permiso para ver esta página</h3>
        <p class="text-xs text-slate-500 mt-2 leading-relaxed">
          No cuentas con los permisos necesarios para acceder a este recurso.
        </p>
      </div>

      <!-- CTA Button -->
      <div>
        <a href="#/catalog" class="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition-all active:scale-95 cursor-pointer">
          Volver al inicio
        </a>
      </div>
    </div>
  `;
}

// 6. Página no encontrada (404 Not Found)
export function renderNotFoundState() {
  return `
    <div class="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 text-center max-w-md mx-auto shadow-sm space-y-5">
      <!-- Header Logo -->
      <div class="flex items-center gap-2 justify-center mb-2">
        ${renderToolRentMark('w-6 h-6', '#FF5A1F')}
        <span class="font-display font-extrabold text-base text-slate-900">ToolRent</span>
      </div>

      <!-- Graphic Icon Badge -->
      <div class="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-500 relative">
        ${renderIcon('FileQuestion', 'w-8 h-8')}
        <span class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#FF5A1F] text-white flex items-center justify-center text-[10px] shadow-xs">
          ${renderIcon('Search', 'w-3.5 h-3.5')}
        </span>
      </div>

      <!-- Title & Message -->
      <div>
        <h3 class="text-lg font-bold text-slate-900 font-display">Página no encontrada</h3>
        <p class="text-xs text-slate-500 mt-2 leading-relaxed">
          La página que buscas no existe o fue movida a otra ubicación.
        </p>
      </div>

      <!-- CTA Button -->
      <div>
        <a href="#/catalog" class="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition-all active:scale-95 cursor-pointer">
          Volver al inicio
        </a>
      </div>
    </div>
  `;
}

// 7. Error del servidor (500 Server Error)
export function renderServerErrorState() {
  return `
    <div class="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 text-center max-w-md mx-auto shadow-sm space-y-5">
      <!-- Header Logo -->
      <div class="flex items-center gap-2 justify-center mb-2">
        ${renderToolRentMark('w-6 h-6', '#FF5A1F')}
        <span class="font-display font-extrabold text-base text-slate-900">ToolRent</span>
      </div>

      <!-- Graphic Icon Badge -->
      <div class="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-600 relative">
        ${renderIcon('Server', 'w-8 h-8')}
        <span class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#FF5A1F] text-white flex items-center justify-center text-[10px] shadow-xs">
          ${renderIcon('AlertCircle', 'w-3.5 h-3.5')}
        </span>
      </div>

      <!-- Title & Message -->
      <div>
        <h3 class="text-lg font-bold text-slate-900 font-display">Error del servidor</h3>
        <p class="text-xs text-slate-500 mt-2 leading-relaxed">
          Ocurrió un problema inesperado. Por favor, intenta nuevamente más tarde.
        </p>
      </div>

      <!-- CTA Button -->
      <div>
        <a href="#/catalog" class="inline-flex items-center justify-center w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#FF5A1F] hover:bg-[#e04e18] shadow-sm transition-all active:scale-95 cursor-pointer">
          Volver al inicio
        </a>
      </div>
    </div>
  `;
}

// 8. Full Interactive Showcase Viewer for `img/ToolRent System States Showcase.png`
export function renderAllSystemStatesShowcase() {
  const container = document.getElementById('app-content');
  if (!container) return;

  container.innerHTML = `
    <div class="min-h-screen bg-[#f8fafc] text-slate-800 py-10 px-4 sm:px-6 lg:px-8 space-y-12">
      <div class="max-w-7xl mx-auto space-y-10">
        
        <!-- Header -->
        <div class="border-b border-slate-200 pb-5 flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold font-display text-slate-900">ToolRent System States Showcase</h1>
            <p class="text-xs text-slate-500 mt-1">Demostración completa de todos los estados del sistema, skeletons y notificaciones.</p>
          </div>
          <a href="#/catalog" class="btn-secondary !py-2 text-xs font-bold">
            &larr; Volver al Catálogo
          </a>
        </div>

        <!-- 1. Top Row: 4 Main System Modals/Pages + Toast Notifications -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          
          <!-- Card 1: Sesión Expiró -->
          <div class="bg-white rounded-2xl border border-slate-200/90 p-8 text-center shadow-xs space-y-4">
            <div class="flex items-center gap-2 justify-start">
              ${renderToolRentMark('w-5 h-5', '#FF5A1F')}
              <span class="font-display font-extrabold text-sm text-slate-900">ToolRent</span>
            </div>
            <div class="w-16 h-16 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto text-[#FF5A1F] relative">
              ${renderIcon('Lock', 'w-7 h-7')}
              <span class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px]">
                ${renderIcon('Clock', 'w-3 h-3')}
              </span>
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-900 font-display">Tu sesión expiró,<br/>inicia sesión de nuevo</h3>
              <p class="text-xs text-slate-500 mt-2">Por seguridad, tu sesión ha caducado. Vuelve a iniciar sesión para continuar.</p>
            </div>
            <button class="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-[#FF5A1F] hover:bg-[#e04e18] shadow-xs" onclick="window.openAuthModal ? window.openAuthModal('login') : null">
              Iniciar sesión
            </button>
          </div>

          <!-- Card 2: No tienes permiso -->
          <div class="bg-white rounded-2xl border border-slate-200/90 p-8 text-center shadow-xs space-y-4">
            <div class="flex items-center gap-2 justify-start">
              ${renderToolRentMark('w-5 h-5', '#FF5A1F')}
              <span class="font-display font-extrabold text-sm text-slate-900">ToolRent</span>
            </div>
            <div class="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-600 relative">
              ${renderIcon('Shield', 'w-7 h-7')}
              <span class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px]">
                ${renderIcon('Ban', 'w-3 h-3')}
              </span>
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-900 font-display">No tienes permiso<br/>para ver esta página</h3>
              <p class="text-xs text-slate-500 mt-2">No cuentas con los permisos necesarios para acceder a este recurso.</p>
            </div>
            <a href="#/catalog" class="block w-full py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs">
              Volver al inicio
            </a>
          </div>

          <!-- Card 3: Página no encontrada -->
          <div class="bg-white rounded-2xl border border-slate-200/90 p-8 text-center shadow-xs space-y-4">
            <div class="flex items-center gap-2 justify-start">
              ${renderToolRentMark('w-5 h-5', '#FF5A1F')}
              <span class="font-display font-extrabold text-sm text-slate-900">ToolRent</span>
            </div>
            <div class="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-500 relative">
              ${renderIcon('FileQuestion', 'w-7 h-7')}
              <span class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#FF5A1F] text-white flex items-center justify-center text-[10px]">
                ${renderIcon('Search', 'w-3 h-3')}
              </span>
            </div>
            <div>
              <h3 class="text-base font-bold text-slate-900 font-display">Página no encontrada</h3>
              <p class="text-xs text-slate-500 mt-2">La página que buscas no existe o fue movida a otra ubicación.</p>
            </div>
            <a href="#/catalog" class="block w-full py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs">
              Volver al inicio
            </a>
          </div>

          <!-- Card 4: Error del servidor + Toasts Column -->
          <div class="space-y-6">
            <!-- Server Error Card -->
            <div class="bg-white rounded-2xl border border-slate-200/90 p-8 text-center shadow-xs space-y-4">
              <div class="flex items-center gap-2 justify-start">
                ${renderToolRentMark('w-5 h-5', '#FF5A1F')}
                <span class="font-display font-extrabold text-sm text-slate-900">ToolRent</span>
              </div>
              <div class="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-600 relative">
                ${renderIcon('Server', 'w-7 h-7')}
                <span class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#FF5A1F] text-white flex items-center justify-center text-[10px]">
                  ${renderIcon('AlertCircle', 'w-3 h-3')}
                </span>
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-900 font-display">Error del servidor</h3>
                <p class="text-xs text-slate-500 mt-2">Ocurrió un problema inesperado. Por favor, intenta nuevamente más tarde.</p>
              </div>
              <a href="#/catalog" class="block w-full py-2.5 rounded-xl text-xs font-bold text-white bg-[#FF5A1F] hover:bg-[#e04e18] shadow-xs">
                Volver al inicio
              </a>
            </div>

            <!-- Toast Showcase -->
            <div class="space-y-2.5">
              <h4 class="text-xs font-bold text-slate-600 uppercase tracking-wider">Notificaciones (Toast)</h4>
              
              <!-- Toast Success -->
              <div class="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs shadow-xs">
                <span class="text-emerald-600 mt-0.5">${renderIcon('CheckCircle2', 'w-4 h-4')}</span>
                <div class="flex-1">
                  <strong class="block font-bold">Éxito</strong>
                  <span class="text-[11px] text-emerald-700">La herramienta se agregó correctamente a tu reserva.</span>
                </div>
                <button class="text-emerald-500 hover:text-emerald-800">&times;</button>
              </div>

              <!-- Toast Error -->
              <div class="flex items-start gap-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs shadow-xs">
                <span class="text-rose-600 mt-0.5">${renderIcon('XCircle', 'w-4 h-4')}</span>
                <div class="flex-1">
                  <strong class="block font-bold">Error</strong>
                  <span class="text-[11px] text-rose-700">No se pudo completar la acción. Intenta nuevamente.</span>
                </div>
                <button class="text-rose-500 hover:text-rose-800">&times;</button>
              </div>

              <!-- Toast Info -->
              <div class="flex items-start gap-3 p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-800 text-xs shadow-xs">
                <span class="text-sky-600 mt-0.5">${renderIcon('Info', 'w-4 h-4')}</span>
                <div class="flex-1">
                  <strong class="block font-bold">Información</strong>
                  <span class="text-[11px] text-sky-700">Los cambios se guardaron correctamente.</span>
                </div>
                <button class="text-sky-500 hover:text-sky-800">&times;</button>
              </div>
            </div>

          </div>

        </div>

        <!-- 2. Section: Skeleton - Grid de tarjetas -->
        <div class="space-y-4">
          <h2 class="text-sm font-bold text-slate-700 uppercase tracking-wider">Skeleton - Grid de tarjetas</h2>
          ${renderCardGridSkeleton(6)}
        </div>

        <!-- 3. Section: Skeleton - Tabla -->
        <div class="space-y-4">
          <h2 class="text-sm font-bold text-slate-700 uppercase tracking-wider">Skeleton - Tabla</h2>
          ${renderTableSkeleton(6)}
        </div>

        <!-- 4. Section: Skeleton - Dashboard -->
        <div class="space-y-4">
          <h2 class="text-sm font-bold text-slate-700 uppercase tracking-wider">Skeleton - Dashboard</h2>
          ${renderDashboardSkeleton()}
        </div>

      </div>
    </div>
  `;

  window.scrollTo({ top: 0, behavior: 'smooth' });
}
