import api from '../api/client.js';
import auth from '../auth/state.js';
import showToast from '../components/toast.js';
import bannerWebImg from '../assets/banner-web.png';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { renderIcon } from '../utils/icons.js';
import { animateStaggerIn } from '../utils/animations.js';

export async function renderCatalogView() {
  if (auth.isAuthenticated() && auth.isProvider() && !auth.isAdmin()) {
    showToast('El catálogo comercial es exclusivo para clientes. Redirigiendo a tu panel de proveedor...', 'info');
    window.location.hash = '#/provider';
    return;
  }

  const container = document.getElementById('app-content');
  if (!container) return;

  // Read search & date query parameters from URL hash (e.g. #/catalog?start=2026-10-17&end=2026-10-20&q=andamio)
  const hash = window.location.hash || '';
  const searchParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
  const initialSearchParam = searchParams.get('q') || '';
  let filterStart = searchParams.get('start') || searchParams.get('from') || '';
  let filterEnd = searchParams.get('end') || searchParams.get('to') || '';

  // Local state
  let selectedCategory = 'cat-all';
  let selectedStatus = 'ALL'; // ALL, AVAILABLE, RENTED, MAINTENANCE
  let searchQuery = initialSearchParam;
  let minPrice = 10000;
  let maxPrice = 500000;
  let sortBy = 'relevant';

  let allTools = [];
  let categories = [];

  async function fetchAndApplyAvailability(start, end) {
    if (!start || !end) return;
    try {
      const availList = await api.get('/tools/availability', { from: start, to: end });
      if (availList && Array.isArray(availList)) {
        const idMap = new Map(availList.map(a => [a.toolId, a]));
        const nameMap = new Map(availList.map(a => [(a.toolName || '').trim().toLowerCase(), a]));

        allTools.forEach(t => {
          const match = idMap.get(t.id) || nameMap.get((t.name || '').trim().toLowerCase());
          if (match) {
            t.totalStock = match.totalStock;
            t.availableStock = match.availableStock;
            t.reservedStock = match.reservedStock;
            t.isAvailable = match.isAvailable;
            t.availabilityMessage = match.message;
            t.availableToolIds = match.availableToolIds;
          }
        });
      }
    } catch (e) {
      console.error('Error fetching catalog date availability from backend', e);
    }
  }

  function resetAvailabilityToBase() {
    allTools.forEach(t => {
      const stock = t.stockInfo;
      t.totalStock = stock?.total || 1;
      t.availableStock = stock?.available || (t.status === 'AVAILABLE' ? 1 : 0);
      t.reservedStock = stock?.rented || 0;
      t.isAvailable = t.availableStock > 0 || t.status === 'AVAILABLE';
      t.availabilityMessage = '';
    });
  }

  try {
    const [toolsData, catsData, providersData] = await Promise.all([
      api.get('/tools'),
      api.get('/tools/categories'),
      api.get('/providers').catch(() => [])
    ]);
    const providersMap = new Map((providersData || []).map(p => [p.id, p]));

    const rawTools = toolsData || [];

    // Agrupar unidades físicas del mismo equipo por proveedor y nombre para calcular stock agregado
    const modelStockMap = new Map();
    rawTools.forEach(t => {
      if (t.status === 'RETIRED') return;
      const key = `${t.providerId}:::${(t.name || '').trim().toLowerCase()}`;
      const existing = modelStockMap.get(key) || { total: 0, available: 0, rented: 0, maintenance: 0, primaryTool: null, units: [] };
      existing.total++;
      if (t.status === 'AVAILABLE') existing.available++;
      else if (t.status === 'RENTED') existing.rented++;
      else if (t.status === 'MAINTENANCE') existing.maintenance++;
      if (!existing.primaryTool || (existing.primaryTool.status !== 'AVAILABLE' && t.status === 'AVAILABLE')) {
        existing.primaryTool = t;
      }
      existing.units.push(t);
      modelStockMap.set(key, existing);
    });

    const seenKeys = new Set();
    const uniqueTools = [];
    rawTools.forEach(t => {
      if (t.status === 'RETIRED') return;
      const key = `${t.providerId}:::${(t.name || '').trim().toLowerCase()}`;
      if (seenKeys.has(key)) return;
      seenKeys.add(key);

      const stock = modelStockMap.get(key);
      const chosenTool = stock?.primaryTool || t;
      const provider = providersMap.get(chosenTool.providerId) || null;

      uniqueTools.push({
        ...chosenTool,
        stockInfo: stock,
        totalStock: stock?.total || 1,
        availableStock: stock?.available || 1,
        reservedStock: stock?.rented || 0,
        provider: provider,
        providerName: provider?.companyName || 'Maquinaria y Equipos Certificados',
        providerCity: provider?.city || 'Colombia',
        providerPhone: provider?.phone || '+57 310 000 0000',
        providerVerified: provider?.isVerified ?? true,
        categoryId: chosenTool.categoryId || chosenTool.category?.id,
        categoryName: chosenTool.categoryName || chosenTool.category?.name || 'Maquinaria',
      });
    });

    allTools = uniqueTools;

    // Si hay fechas en la URL, consultar la disponibilidad real en el backend inmediatamente
    if (filterStart && filterEnd) {
      await fetchAndApplyAvailability(filterStart, filterEnd);
    }

    const rawCats = catsData || [];
    const hasAll = rawCats.some(c => c.id === 'cat-all');
    categories = hasAll 
      ? rawCats 
      : [{ id: 'cat-all', name: 'Todas las categorías', icon: 'LayoutGrid' }, ...rawCats];
  } catch (e) {
    console.error('Error loading catalog data', e);
  }

  function getFilteredTools() {
    let filtered = allTools.filter(t => t.status !== 'RETIRED');

    if (selectedCategory && selectedCategory !== 'cat-all') {
      filtered = filtered.filter(t => t.categoryId === selectedCategory);
    }

    if (selectedStatus === 'AVAILABLE') {
      filtered = filtered.filter(t => {
        if (filterStart && filterEnd) {
          return t.availableStock > 0;
        }
        return (t.availableStock > 0) || t.status === 'AVAILABLE';
      });
    } else if (selectedStatus === 'RENTED') {
      filtered = filtered.filter(t => {
        if (filterStart && filterEnd) {
          return t.availableStock === 0;
        }
        return t.availableStock === 0 && (t.stockInfo?.rented > 0 || t.status === 'RENTED');
      });
    } else if (selectedStatus === 'MAINTENANCE') {
      filtered = filtered.filter(t => t.availableStock === 0 && (t.stockInfo?.maintenance > 0 || t.status === 'MAINTENANCE'));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(q) || 
        t.categoryName?.toLowerCase().includes(q) ||
        t.brand?.toLowerCase().includes(q) ||
        t.model?.toLowerCase().includes(q)
      );
    }

    filtered = filtered.filter(t => {
      const price = t.dailyPrice || 0;
      return price >= minPrice && price <= maxPrice;
    });

    if (sortBy === 'price-asc') {
      filtered.sort((a, b) => (a.dailyPrice || 0) - (b.dailyPrice || 0));
    } else if (sortBy === 'price-desc') {
      filtered.sort((a, b) => (b.dailyPrice || 0) - (a.dailyPrice || 0));
    } else if (sortBy === 'name-asc') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }

  const SORT_OPTIONS = [
    { value: 'relevant', label: 'Más relevantes', icon: 'Sparkles' },
    { value: 'price-asc', label: 'Menor precio', icon: 'TrendingDown' },
    { value: 'price-desc', label: 'Mayor precio', icon: 'TrendingUp' },
    { value: 'name-asc', label: 'Nombre (A-Z)', icon: 'ArrowDownAZ' },
  ];

  // Render initial static shell
  container.innerHTML = `
    <section class="min-h-screen bg-[#f8fafc] text-slate-800 pb-16">
      
      <!-- Top Promotional Marketplace Hero Banner (Apple Pro aesthetic) -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <section class="relative w-full rounded-[24px] bg-[#0B0D13] overflow-hidden border border-zinc-800/80 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.25)]">
          
          <!-- Imagen de fondo desplazada a la derecha con fundido calibrado (+10% profundidad/oscuridad) -->
          <div class="absolute inset-0">
            <img 
              src="${bannerWebImg}" 
              alt="Catálogo de Maquinaria ToolRent" 
              class="w-full h-full object-cover object-right select-none brightness-[1.05] contrast-[1.04]"
            />
            <!-- Degradado multicapa con 10% más de densidad oscura para máximo contraste -->
            <div class="absolute inset-0 bg-gradient-to-r from-[#0B0D13] from-30% via-[#0B0D13]/80 via-52% to-transparent"></div>
            <div class="absolute inset-0 bg-gradient-to-t from-[#0B0D13]/50 via-transparent to-transparent"></div>
          </div>

          <!-- Contenido Editorial -->
          <div class="relative z-10 px-6 py-8 sm:px-10 sm:py-12 md:px-12 md:py-14 max-w-2xl lg:max-w-3xl select-none">

            <!-- Titular en dos líneas limpias: Blanco + Gris Titanio -->
            <h1 class="text-2xl sm:text-4xl lg:text-[44px] font-semibold tracking-[-0.03em] leading-[1.12] text-white">
              <span class="block">Alquila el equipo que necesitas.</span>
              <span class="block mt-1 sm:mt-1.5 text-zinc-400 font-normal">Sin comprarlo.</span>
            </h1>

            <!-- Subtítulo con mejor interlineado y contraste controlado -->
            <p class="mt-3.5 sm:mt-4 text-xs sm:text-sm lg:text-[15px] text-zinc-400 leading-relaxed max-w-lg font-normal">
              Herramientas y maquinaria certificada para construir, remodelar y ejecutar tus proyectos de ingeniería en toda Colombia.
            </p>

            <!-- Anclaje inferior de confianza (Micro-métricas en una sola línea horizontal) -->
            <div class="mt-6 sm:mt-7 pt-5 sm:pt-6 border-t border-white/10 flex flex-nowrap items-center gap-x-3 sm:gap-x-4 lg:gap-x-5 text-xs text-zinc-400 overflow-x-auto scrollbar-none">
              <div class="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0">
                <span class="text-white font-semibold tabular-nums">100%</span>
                <span>Disponibilidad en línea</span>
              </div>
              <span class="text-zinc-700 shrink-0">·</span>
              <div class="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0">
                <span class="text-white font-semibold">IVA 19%</span>
                <span>Facturación electrónica</span>
              </div>
              <span class="text-zinc-700 shrink-0">·</span>
              <div class="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap shrink-0">
                <span class="text-white font-semibold">Garantía</span>
                <span>Inspección técnica en obra</span>
              </div>
            </div>

          </div>
        </section>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">

        <!-- Category Horizontal Carousel Pills Bar -->
        <div class="relative flex items-center">
          <button 
            type="button" 
            id="cat-carousel-prev" 
            class="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 shadow-sm transition-all z-10 flex-shrink-0 mr-1.5 sm:mr-2 cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-white active:scale-90"
            aria-label="Desplazar categorías hacia la izquierda"
            title="Anterior"
          >
            ${renderIcon('ChevronLeft', 'w-4 h-4')}
          </button>

          <div id="cat-carousel-container" class="flex-1 overflow-x-auto scroll-smooth py-1 scrollbar-none flex gap-2 sm:gap-2.5">
            ${categories.map(cat => `
              <button 
                type="button" 
                class="cat-pill-btn flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex-shrink-0 cursor-pointer ${
                  selectedCategory === cat.id 
                    ? 'bg-orange-50/90 border-[#FF5A1F] text-[#FF5A1F] shadow-xs ring-1 ring-[#FF5A1F]/30' 
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                }"
                data-cat-id="${cat.id}"
              >
                ${cat.icon ? renderIcon(cat.icon, 'w-3.5 h-3.5') : renderIcon('Layers', 'w-3.5 h-3.5')}
                <span>${cat.name}</span>
              </button>
            `).join('')}
          </div>

          <button 
            type="button" 
            id="cat-carousel-next" 
            class="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 shadow-sm transition-all z-10 flex-shrink-0 ml-1.5 sm:ml-2 cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-white active:scale-90"
            aria-label="Desplazar categorías hacia la derecha"
            title="Siguiente"
          >
            ${renderIcon('ChevronRight', 'w-4 h-4')}
          </button>
        </div>

        <!-- Main Marketplace Layout: Sidebar Filters + Products Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          <!-- Left Sidebar Filters -->
          <aside class="space-y-6 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative">

            <!-- Category Radio/Check Filters -->
            <div>
              <div class="flex items-center justify-between pb-3 select-none">
                <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Categoría</h3>
                ${renderIcon('ChevronUp', 'w-4 h-4 text-slate-400')}
              </div>
              <div class="space-y-2.5 text-xs text-slate-700 pt-1" id="sidebar-categories-list">
                ${categories.map(cat => {
                  const count = cat.id === 'cat-all' 
                    ? allTools.length 
                    : allTools.filter(t => t.categoryId === cat.id).length;
                  return `
                    <label class="flex items-center justify-between cursor-pointer group py-0.5">
                      <div class="flex items-center gap-2.5">
                        <input 
                          type="radio" 
                          name="sidebar-cat-radio" 
                          value="${cat.id}" 
                          ${selectedCategory === cat.id ? 'checked' : ''} 
                          class="accent-[#FF5A1F] cursor-pointer"
                        />
                        <span class="group-hover:text-slate-900 transition-colors">${cat.name}</span>
                      </div>
                      <span class="text-slate-400 text-[11px] font-mono">(${count})</span>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>

            <div class="border-t border-slate-100"></div>

            <!-- Estado Filter Accordion -->
            <div>
              <div class="flex items-center justify-between pb-3 select-none">
                <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Disponibilidad</h3>
                ${renderIcon('ChevronUp', 'w-4 h-4 text-slate-400')}
              </div>
              <div class="space-y-2.5 text-xs text-slate-700 pt-1">
                <label class="flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="status-radio" value="ALL" ${selectedStatus === 'ALL' ? 'checked' : ''} class="accent-[#FF5A1F] cursor-pointer" />
                  <span>Todas las herramientas</span>
                </label>
                <label class="flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="status-radio" value="AVAILABLE" ${selectedStatus === 'AVAILABLE' ? 'checked' : ''} class="accent-[#FF5A1F] cursor-pointer" />
                  <span>Solo con stock disponible</span>
                </label>
                <label class="flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="status-radio" value="RENTED" ${selectedStatus === 'RENTED' ? 'checked' : ''} class="accent-[#FF5A1F] cursor-pointer" />
                  <span>Solo alquiladas / en reserva</span>
                </label>
              </div>
            </div>

            <div class="border-t border-slate-100"></div>

            <!-- Rango de Precio Slider & Inputs -->
            <div>
              <div class="flex items-center justify-between pb-3 select-none">
                <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Precio por día</h3>
                ${renderIcon('ChevronUp', 'w-4 h-4 text-slate-400')}
              </div>
              <div class="space-y-3 pt-1">
                <div class="relative py-2">
                  <input 
                    type="range" 
                    id="price-range-slider" 
                    min="10000" 
                    max="500000" 
                    step="5000" 
                    value="${maxPrice}" 
                    class="w-full accent-[#FF5A1F] cursor-pointer transition-all"
                  />
                  <div class="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
                    <span>$ 10.000</span>
                    <span>$ 500.000</span>
                  </div>
                </div>

                <div class="flex items-center gap-2 text-xs">
                  <div class="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-center font-mono text-slate-700 font-semibold" id="price-min-box">
                    $ ${minPrice.toLocaleString('es-CO')}
                  </div>
                  <span class="text-slate-400 font-bold">-</span>
                  <div class="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-center font-mono text-slate-700 font-semibold" id="price-max-box">
                    $ ${maxPrice.toLocaleString('es-CO')}
                  </div>
                </div>
              </div>
            </div>

          </aside>

          <!-- Right Column: Results Bar & Tool Cards Grid -->
          <main class="lg:col-span-3 space-y-4">
            
            <!-- Date Filter Active Banner if dates are selected -->
            <div id="catalog-active-dates-banner">
              ${filterStart && filterEnd ? `
                <div class="p-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-800 shadow-2xs">
                  <div class="flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-[#ea580c] animate-pulse shrink-0"></span>
                    <span>Mostrando stock confirmado en base de datos para: <strong>${formatDate(filterStart)} al ${formatDate(filterEnd)}</strong></span>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-[11px] text-slate-500 hidden sm:inline">Límites: Hasta 1 año / 30d máx.</span>
                    <button type="button" id="btn-banner-clear-dates" class="text-orange-700 hover:text-orange-900 font-bold text-xs underline cursor-pointer">
                      Ver todas las fechas
                    </button>
                  </div>
                </div>
              ` : ''}
            </div>

            <!-- Results Header Bar -->
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div class="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
                <span id="results-counter">Calculando catálogo...</span>
              </div>

              <div class="flex items-center gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap">
                <!-- Unified Catalog Search Bar -->
                <div class="relative flex-1 sm:w-72 md:w-80 group/catalogsearch">
                  <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within/catalogsearch:text-[#FF5A1F] transition-colors">
                    ${renderIcon('Search', 'w-4 h-4')}
                  </span>
                  
                  <input 
                    type="search" 
                    id="catalog-search-input" 
                    name="q"
                    value="${searchQuery}" 
                    placeholder="Buscar por equipo, marca, modelo..." 
                    autocomplete="off"
                    autocorrect="off"
                    autocapitalize="off"
                    spellcheck="false"
                    class="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/30 focus:border-[#FF5A1F] transition-all shadow-2xs"
                  />

                  <button 
                    type="button" 
                    id="btn-clear-catalog-search" 
                    class="${searchQuery ? '' : 'hidden'} absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    title="Limpiar búsqueda"
                    aria-label="Limpiar búsqueda"
                  >
                    ${renderIcon('X', 'w-3.5 h-3.5')}
                  </button>

                  <span id="catalog-search-shortcut" class="${searchQuery ? 'hidden' : ''} absolute inset-y-0 right-0 pr-3 pointer-events-none flex items-center text-[10px] font-mono text-slate-400">
                    ↵
                  </span>
                </div>

                <!-- Custom ToolRent Sort Dropdown (Matches project design system) -->
                <div class="relative inline-block text-left" id="custom-sort-dropdown">
                  <button 
                    type="button" 
                    id="btn-sort-dropdown-toggle"
                    class="flex items-center gap-2 bg-white hover:bg-slate-50/80 border border-slate-200/90 hover:border-orange-400 rounded-2xl px-3.5 py-2 text-xs text-slate-700 font-medium transition-all shadow-2xs cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-[#FF5A1F]/30 group"
                    aria-expanded="false"
                    aria-haspopup="true"
                  >
                    <span class="text-[#FF5A1F] flex items-center shrink-0">
                      ${renderIcon('ArrowUpDown', 'w-3.5 h-3.5')}
                    </span>
                    <span id="current-sort-label" class="font-semibold text-slate-800 font-display">
                      ${SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Más relevantes'}
                    </span>
                    <span id="sort-chevron-icon" class="text-slate-400 group-hover:text-slate-600 transition-transform duration-200 shrink-0">
                      ${renderIcon('ChevronDown', 'w-3.5 h-3.5')}
                    </span>
                  </button>

                  <!-- Floating Dropdown Menu -->
                  <div 
                    id="sort-dropdown-menu" 
                    class="hidden absolute right-0 top-full mt-1.5 w-52 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl p-1.5 z-40 transition-all origin-top-right select-none animate-in fade-in zoom-in-95"
                    role="menu"
                  >
                    <div class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between mb-1">
                      <span>Ordenar por</span>
                      <span class="text-[9px] font-normal text-slate-400 font-mono">4 criterios</span>
                    </div>

                    <div class="space-y-0.5" id="sort-dropdown-items" role="none">
                      <!-- Rendered by renderSortDropdownItems() -->
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Products Grid Container -->
            <div id="catalog-products-container"></div>

          </main>

        </div>

      </div>

    </section>
  `;

  // Attach Elements
  const productsContainer = container.querySelector('#catalog-products-container');
  const resultsCounter = container.querySelector('#results-counter');
  const priceSlider = container.querySelector('#price-range-slider');
  const priceMaxBox = container.querySelector('#price-max-box');
  const searchInput = container.querySelector('#catalog-search-input');
  const clearSearchBtn = container.querySelector('#btn-clear-catalog-search');
  const handleClearDates = () => {
    filterStart = '';
    filterEnd = '';
    resetAvailabilityToBase();
    updateDatesUI();
    renderProductsGrid();
  };

  container.querySelector('#btn-banner-clear-dates')?.addEventListener('click', handleClearDates);

  function updateDatesUI() {
    const label = container.querySelector('#sidebar-dates-label');
    const banner = container.querySelector('#catalog-active-dates-banner');
    if (label) {
      label.textContent = filterStart && filterEnd ? `${formatDate(filterStart)} - ${formatDate(filterEnd)}` : 'Cualquier fecha';
    }
    if (banner) {
      banner.innerHTML = filterStart && filterEnd ? `
        <div class="p-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-800 shadow-2xs">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-[#ea580c] animate-pulse shrink-0"></span>
            <span>Mostrando stock confirmado en base de datos para: <strong>${formatDate(filterStart)} al ${formatDate(filterEnd)}</strong></span>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-[11px] text-slate-500 hidden sm:inline">Límites: Hasta 1 año / 30d máx.</span>
            <button type="button" id="btn-banner-clear-dates-dyn" class="text-orange-700 hover:text-orange-900 font-bold text-xs underline cursor-pointer">
              Ver todas las fechas
            </button>
          </div>
        </div>
      ` : '';

      banner.querySelector('#btn-banner-clear-dates-dyn')?.addEventListener('click', handleClearDates);
    }
  }

  // Render Tool Cards
  function renderProductsGrid() {
    const filtered = getFilteredTools();

    if (resultsCounter) {
      resultsCounter.textContent = `${filtered.length} ${filtered.length === 1 ? 'resultado' : 'resultados'}${
        filterStart && filterEnd ? ` para ${formatDate(filterStart)}` : ''
      }`;
    }

    if (!productsContainer) return;

    if (filtered.length === 0) {
      productsContainer.innerHTML = `
        <div class="bg-white rounded-2xl border border-slate-200/80 p-12 text-center space-y-4 shadow-xs">
          <div class="w-14 h-14 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF5A1F] mx-auto">
            ${renderIcon('Layers', 'w-7 h-7')}
          </div>
          <div class="space-y-1">
            <h3 class="font-bold text-slate-900 text-base font-display">No encontramos maquinaria con estos criterios</h3>
            <p class="text-xs text-slate-500 max-w-md mx-auto">
              ${filterStart ? 'Todas las unidades coinciden con reservas de otros usuarios para ese rango de fechas.' : 'Intenta ajustar tus filtros de búsqueda o seleccionar otra categoría.'}
            </p>
          </div>
          <button id="btn-catalog-reset-filters" class="btn-primary !py-2 px-5 text-xs font-semibold">
            Restablecer todos los filtros
          </button>
        </div>
      `;

      productsContainer.querySelector('#btn-catalog-reset-filters')?.addEventListener('click', () => {
        selectedCategory = 'cat-all';
        selectedStatus = 'ALL';
        searchQuery = '';
        minPrice = 10000;
        maxPrice = 500000;
        handleClearDates();
        if (searchInput) searchInput.value = '';
        if (priceSlider) priceSlider.value = 500000;
        if (priceMaxBox) priceMaxBox.textContent = '$ 500.000';
        updateCategoryButtonsUI();
        renderProductsGrid();
      });

      return;
    }

    productsContainer.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="tools-cards-grid">
        ${filtered.map(tool => {
          const isAvailable = (filterStart && filterEnd)
            ? (tool.availableStock > 0)
            : ((tool.availableStock > 0) || tool.status === 'AVAILABLE');

          const rawImg = tool.images?.[0]?.imageUrl || '';
          const isDeadImg = !rawImg || rawImg.includes('photo-1541888946425-d0fbb186f5f8') || rawImg.includes('photo-1503387762-592deb58ef4e');
          const primaryImg = isDeadImg
            ? ((tool.name || '').toLowerCase().includes('andamio') ? '/images/scaffold-1.jpg' : 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800')
            : rawImg;

          const statusBadge = isAvailable
            ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-2xs select-none">
                <span class="text-emerald-600 flex items-center justify-center flex-shrink-0">
                  ${renderIcon('BadgeCheck', 'w-3.5 h-3.5')}
                </span>
                <span>Disponible${tool.totalStock > 1 ? ` (${tool.availableStock}/${tool.totalStock} en stock)` : ''}</span>
               </span>`
            : `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200/90 shadow-2xs select-none">
                <span class="text-rose-600 flex items-center justify-center flex-shrink-0">
                  ${renderIcon('AlertTriangle', 'w-3 h-3')}
                </span>
                <span>${filterStart ? `Alquilada para tus fechas (${tool.totalStock} en reserva)` : `Sin unidades disponibles (${tool.totalStock})`}</span>
               </span>`;

          return `
            <div class="tool-card-item bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs card-lift flex flex-col justify-between group">
              
              <div>
                <div class="relative h-48 overflow-hidden bg-slate-50 cursor-pointer tool-card-trigger" data-id="${tool.id}">
                  <img 
                    src="${primaryImg}" 
                    alt="${tool.name}" 
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 select-none" 
                    loading="lazy"
                    data-original-url="${primaryImg}"
                    onerror="window.ToolRentCacheShield?.handleImageError(this, '${primaryImg}', '${tool.categoryName || ''}', '${tool.name.replace(/'/g, "\\'")}')"
                  />
                  <div class="absolute top-3 right-3 z-10">
                    ${statusBadge}
                  </div>
                </div>

                <div class="p-4 space-y-2">
                  <div>
                    <h3 class="font-bold text-slate-900 text-sm leading-snug cursor-pointer hover:text-[#FF5A1F] transition-colors tool-card-trigger line-clamp-2" data-id="${tool.id}">
                      ${tool.name}
                    </h3>
                    <p class="text-[11px] text-slate-400 font-medium mt-0.5">
                      ${tool.categoryName || 'Construcción'}
                    </p>
                  </div>

                  <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                    <div class="flex items-center gap-1.5 min-w-0" title="Proveedor: ${tool.providerName}">
                      <span class="w-5 h-5 rounded-md bg-orange-50 border border-orange-200/80 text-brand-600 flex items-center justify-center flex-shrink-0">
                        ${renderIcon('Building2', 'w-3 h-3 text-[#ea580c]')}
                      </span>
                      <span class="font-semibold text-slate-700 truncate max-w-[130px] sm:max-w-[145px]">
                        ${tool.providerName}
                      </span>
                    </div>
                    
                    <span class="text-slate-500 text-[10px] font-medium flex items-center gap-0.5 flex-shrink-0 bg-slate-50 border border-slate-200/80 px-1.5 py-0.5 rounded-md">
                      ${renderIcon('MapPin', 'w-2.5 h-2.5 text-slate-400')}
                      ${tool.providerCity}
                    </span>
                  </div>
                </div>
              </div>

              <div class="p-4 pt-0 border-t border-slate-50 flex items-center justify-between mt-2">
                <div>
                  <span class="text-base font-bold text-slate-900 font-display">${formatCurrency(tool.dailyPrice)}</span>
                  <span class="text-[11px] text-slate-400 font-normal"> / día</span>
                </div>

                <div>
                  <button class="btn-tool-details inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 cursor-pointer ${
                    isAvailable 
                      ? 'text-white bg-[#FF5A1F] hover:bg-[#e04e18] shadow-xs' 
                      : 'text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200'
                  }" data-id="${tool.id}">
                    ${isAvailable ? 'Ver detalles' : 'Ver disponibilidad'}
                  </button>
                </div>
              </div>

            </div>
          `;
        }).join('')}
      </div>
    `;

    animateStaggerIn(productsContainer.querySelectorAll('.tool-card-item'), { stagger: 40, duration: 400 });

    productsContainer.querySelectorAll('.btn-tool-details, .tool-card-trigger').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.dataset.id;
        const targetUrl = filterStart && filterEnd 
          ? `#/product/${id}?start=${filterStart}&end=${filterEnd}` 
          : `#/product/${id}`;
        window.location.hash = targetUrl;
      });
    });
  }

  function updateCategoryButtonsUI() {
    container.querySelectorAll('.cat-pill-btn').forEach(btn => {
      const isAct = btn.dataset.catId === selectedCategory;
      if (isAct) {
        btn.className = 'cat-pill-btn flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex-shrink-0 cursor-pointer bg-orange-50/90 border-[#FF5A1F] text-[#FF5A1F] shadow-xs ring-1 ring-[#FF5A1F]/30';
      } else {
        btn.className = 'cat-pill-btn flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex-shrink-0 cursor-pointer bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50';
      }
    });

    container.querySelectorAll('input[name="sidebar-cat-radio"]').forEach(rb => {
      rb.checked = rb.value === selectedCategory;
    });
  }

  // Top Category Pills Navigation
  const carouselContainer = container.querySelector('#cat-carousel-container');
  const prevBtn = container.querySelector('#cat-carousel-prev');
  const nextBtn = container.querySelector('#cat-carousel-next');

  if (carouselContainer && prevBtn && nextBtn) {
    prevBtn.addEventListener('click', () => {
      carouselContainer.scrollBy({ left: -260, behavior: 'smooth' });
    });
    nextBtn.addEventListener('click', () => {
      carouselContainer.scrollBy({ left: 260, behavior: 'smooth' });
    });
  }

  container.querySelectorAll('.cat-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedCategory = btn.dataset.catId;
      updateCategoryButtonsUI();
      renderProductsGrid();
    });
  });

  container.querySelectorAll('input[name="sidebar-cat-radio"]').forEach(rb => {
    rb.addEventListener('change', (e) => {
      selectedCategory = e.target.value;
      updateCategoryButtonsUI();
      renderProductsGrid();
    });
  });

  container.querySelectorAll('input[name="status-radio"]').forEach(rb => {
    rb.addEventListener('change', (e) => {
      selectedStatus = e.target.value;
      renderProductsGrid();
    });
  });

  if (priceSlider) {
    priceSlider.addEventListener('input', (e) => {
      maxPrice = parseInt(e.target.value, 10);
      if (priceMaxBox) priceMaxBox.textContent = `$ ${maxPrice.toLocaleString('es-CO')}`;
      renderProductsGrid();
    });
  }

  let searchDebounce = null;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value;
      if (val.trim().length > 0) {
        clearSearchBtn?.classList.remove('hidden');
        searchShortcut?.classList.add('hidden');
      } else {
        clearSearchBtn?.classList.add('hidden');
        searchShortcut?.classList.remove('hidden');
      }

      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        searchQuery = val;
        renderProductsGrid();
      }, 100);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        window.location.hash = `#/catalog${query ? `?q=${encodeURIComponent(query)}` : ''}`;
      }
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      searchQuery = '';
      clearSearchBtn.classList.add('hidden');
      searchShortcut?.classList.remove('hidden');
      if (window.location.hash.includes('?')) {
        window.location.hash = '#/catalog';
      }
      renderProductsGrid();
    });
  }

  // Custom ToolRent Sort Dropdown Controller
  const sortDropdownToggle = container.querySelector('#btn-sort-dropdown-toggle');
  const sortDropdownMenu = container.querySelector('#sort-dropdown-menu');
  const sortCurrentLabel = container.querySelector('#current-sort-label');
  const sortChevronIcon = container.querySelector('#sort-chevron-icon');
  const sortDropdownItems = container.querySelector('#sort-dropdown-items');

  function renderSortDropdownItems() {
    if (!sortDropdownItems) return;
    sortDropdownItems.innerHTML = SORT_OPTIONS.map(opt => `
      <button
        type="button"
        class="sort-option-btn w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
          sortBy === opt.value
            ? 'bg-orange-50 text-[#ea580c] font-bold shadow-2xs ring-1 ring-orange-500/20'
            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
        }"
        data-sort="${opt.value}"
        role="menuitem"
      >
        <div class="flex items-center gap-2.5 truncate">
          <span class="${sortBy === opt.value ? 'text-[#ea580c]' : 'text-slate-400'} shrink-0">
            ${renderIcon(opt.icon, 'w-3.5 h-3.5')}
          </span>
          <span class="truncate">${opt.label}</span>
        </div>

        ${sortBy === opt.value ? `
          <span class="text-[#ea580c] shrink-0 ml-2">
            ${renderIcon('Check', 'w-3.5 h-3.5')}
          </span>
        ` : ''}
      </button>
    `).join('');

    sortDropdownItems.querySelectorAll('.sort-option-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const selectedVal = btn.dataset.sort;
        if (!selectedVal) return;
        sortBy = selectedVal;
        const matched = SORT_OPTIONS.find(o => o.value === sortBy);
        if (sortCurrentLabel && matched) {
          sortCurrentLabel.textContent = matched.label;
        }
        renderSortDropdownItems();
        toggleSortDropdown(false);
        renderProductsGrid();
      });
    });
  }

  function toggleSortDropdown(open) {
    if (!sortDropdownMenu) return;
    const shouldOpen = open !== undefined ? open : sortDropdownMenu.classList.contains('hidden');
    if (shouldOpen) {
      sortDropdownMenu.classList.remove('hidden');
      sortDropdownToggle?.setAttribute('aria-expanded', 'true');
      sortChevronIcon?.classList.add('rotate-180');
    } else {
      sortDropdownMenu.classList.add('hidden');
      sortDropdownToggle?.setAttribute('aria-expanded', 'false');
      sortChevronIcon?.classList.remove('rotate-180');
    }
  }

  sortDropdownToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleSortDropdown();
  });

  const onDocClickSort = (e) => {
    if (sortDropdownMenu && !sortDropdownMenu.classList.contains('hidden')) {
      if (!sortDropdownMenu.contains(e.target) && !sortDropdownToggle?.contains(e.target)) {
        toggleSortDropdown(false);
      }
    }
  };

  const onDocKeydownSort = (e) => {
    if (e.key === 'Escape' && sortDropdownMenu && !sortDropdownMenu.classList.contains('hidden')) {
      toggleSortDropdown(false);
    }
  };

  document.addEventListener('click', onDocClickSort);
  document.addEventListener('keydown', onDocKeydownSort);

  renderSortDropdownItems();

  // Initial render of product cards
  renderProductsGrid();
}

export default renderCatalogView;
