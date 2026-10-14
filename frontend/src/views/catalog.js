import api from '../api/client.js';
import bannerWebImg from '../assets/banner-web.png';
import { formatCurrency } from '../utils/formatters.js';
import { renderIcon } from '../utils/icons.js';
import { animateStaggerIn } from '../utils/animations.js';

export async function renderCatalogView() {
  const container = document.getElementById('app-content');
  if (!container) return;

  // Read search query parameter from URL hash if present (e.g. #/catalog?q=taladro)
  const hash = window.location.hash || '';
  const searchParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
  const initialSearchParam = searchParams.get('q') || '';

  // Local state
  let selectedCategory = 'cat-all';
  let selectedStatus = 'ALL'; // ALL, AVAILABLE, RENTED, MAINTENANCE
  let searchQuery = initialSearchParam;
  let minPrice = 10000;
  let maxPrice = 500000;
  let sortBy = 'relevant';

  let allTools = [];
  let categories = [];

  try {
    const [toolsData, catsData] = await Promise.all([
      api.get('/tools'),
      api.get('/tools/categories')
    ]);
    const rawTools = toolsData || [];
    allTools = rawTools.map(t => ({
      ...t,
      categoryId: t.categoryId || t.category?.id,
      categoryName: t.categoryName || t.category?.name || 'Maquinaria',
    }));

    const rawCats = catsData || [];
    const hasAll = rawCats.some(c => c.id === 'cat-all');
    categories = hasAll 
      ? rawCats 
      : [{ id: 'cat-all', name: 'Todas las categorías', icon: 'LayoutGrid' }, ...rawCats];
  } catch (e) {
    console.error('Error loading catalog data', e);
  }

  // Filter computation
  function getFilteredTools() {
    let filtered = [...allTools];

    if (selectedCategory && selectedCategory !== 'cat-all') {
      filtered = filtered.filter(t => t.categoryId === selectedCategory);
    }

    if (selectedStatus === 'AVAILABLE') {
      filtered = filtered.filter(t => t.status === 'AVAILABLE');
    } else if (selectedStatus === 'RENTED') {
      filtered = filtered.filter(t => t.status === 'RENTED');
    } else if (selectedStatus === 'MAINTENANCE') {
      filtered = filtered.filter(t => t.status === 'MAINTENANCE');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(q) || 
        t.categoryName?.toLowerCase().includes(q) ||
        t.brand?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q)
      );
    }

    filtered = filtered.filter(t => (t.dailyPrice || 0) >= minPrice && (t.dailyPrice || 0) <= maxPrice);

    if (sortBy === 'price-asc') filtered.sort((a, b) => a.dailyPrice - b.dailyPrice);
    if (sortBy === 'price-desc') filtered.sort((a, b) => b.dailyPrice - a.dailyPrice);

    return filtered;
  }

  // Initial full shell render
  container.innerHTML = `
    <div class="min-h-screen bg-[#f8fafc] text-slate-800 pb-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        <!-- Panoramic Hero Banner matching img/web/banner web.png -->
        <div class="relative rounded-2xl overflow-hidden min-h-[220px] sm:min-h-[250px] md:min-h-[270px] flex items-center shadow-md bg-slate-900 select-none">
          <img 
            src="${bannerWebImg}" 
            alt="ToolRent Maquinaria y Equipos" 
            class="absolute inset-0 w-full h-full object-cover object-right sm:object-center pointer-events-none" 
          />
          
          <!-- Subtle Dark Scrim Overlay for Perfect Contrast & Legibility -->
          <div class="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/40 to-transparent pointer-events-none"></div>

          <div class="relative z-10 p-6 sm:p-10 md:p-12 max-w-xl space-y-2">
            <h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-extrabold tracking-tight font-display leading-[1.15] text-white drop-shadow-md">
              <span class="text-white">Alquila el equipo que necesitas.</span><br />
              <span class="text-white">Sin comprarlo.</span>
            </h1>
            <p class="text-xs sm:text-sm md:text-base text-slate-100 font-normal leading-relaxed pt-1 max-w-md drop-shadow">
              Herramientas y maquinaria para construir, remodelar y hacer realidad tus proyectos en toda Colombia.
            </p>
          </div>
        </div>

        <!-- Horizontal Category Pills Bar with Smooth Navigation Arrows -->
        <div class="relative flex items-center group/pills mb-2">
          <!-- Left Arrow Button -->
          <button 
            id="cat-scroll-left" 
            class="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 shadow-sm transition-all z-10 flex-shrink-0 mr-1.5 sm:mr-2 cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-white active:scale-90"
            aria-label="Desplazar categorías hacia la izquierda"
            title="Anterior"
          >
            ${renderIcon('ChevronLeft', 'w-4 h-4')}
          </button>

          <!-- Scrollable Track with no scrollbar -->
          <div 
            class="flex-1 flex items-center gap-2 overflow-x-auto scroll-smooth py-1 no-scrollbar select-none" 
            id="category-pills-row"
          >
            ${categories.map(cat => {
              const isActive = selectedCategory === cat.id;
              return `
                <button 
                  class="cat-pill-btn flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex-shrink-0 cursor-pointer ${
                    isActive 
                      ? 'bg-orange-50/90 border-[#FF5A1F] text-[#FF5A1F] shadow-xs ring-1 ring-[#FF5A1F]/30' 
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }"
                  data-cat-id="${cat.id}"
                >
                  ${renderIcon(cat.icon || 'Wrench', `w-3.5 h-3.5 ${isActive ? 'text-[#FF5A1F]' : 'text-slate-500'}`)}
                  <span>${cat.name}</span>
                </button>
              `;
            }).join('')}
          </div>

          <!-- Right Arrow Button -->
          <button 
            id="cat-scroll-right" 
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
          <aside class="space-y-6 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
            
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
                <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Estado</h3>
                ${renderIcon('ChevronUp', 'w-4 h-4 text-slate-400')}
              </div>
              <div class="space-y-2.5 text-xs text-slate-700 pt-1">
                <label class="flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="status-radio" value="ALL" ${selectedStatus === 'ALL' ? 'checked' : ''} class="accent-[#FF5A1F] cursor-pointer" />
                  <span>Todas</span>
                </label>
                <label class="flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="status-radio" value="AVAILABLE" ${selectedStatus === 'AVAILABLE' ? 'checked' : ''} class="accent-[#FF5A1F] cursor-pointer" />
                  <span>Disponibles</span>
                </label>
              </div>
            </div>

            <div class="border-t border-slate-100"></div>

            <!-- Rango de Precio Slider & Inputs -->
            <div>
              <div class="flex items-center justify-between pb-3 select-none">
                <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Rango de precio (por día)</h3>
                ${renderIcon('ChevronUp', 'w-4 h-4 text-slate-400')}
              </div>
              <div class="space-y-3 pt-1">
                <!-- Visual slider bar -->
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

                <!-- Dual Box Inputs -->
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
          <main class="lg:col-span-3 space-y-6">
            
            <!-- Results Header Bar -->
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div class="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
                <span id="results-counter">48 resultados</span>
              </div>

              <div class="flex items-center gap-3">
                <!-- Search in results -->
                <div class="relative flex-1 sm:w-64">
                  <input 
                    type="text" 
                    id="search-in-results" 
                    value="${searchQuery}" 
                    placeholder="Buscar en resultados..." 
                    class="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#FF5A1F] focus:ring-1 focus:ring-[#FF5A1F]/20 transition-all shadow-xs"
                  />
                  <div class="absolute left-2.5 top-2 text-slate-400 pointer-events-none">
                    ${renderIcon('Search', 'w-3.5 h-3.5')}
                  </div>
                </div>

                <!-- Sort dropdown -->
                <div class="relative">
                  <select id="sort-select" class="bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-[#FF5A1F] transition-colors appearance-none shadow-xs cursor-pointer">
                    <option value="relevant" ${sortBy === 'relevant' ? 'selected' : ''}>Más relevantes</option>
                    <option value="price-asc" ${sortBy === 'price-asc' ? 'selected' : ''}>Menor precio</option>
                    <option value="price-desc" ${sortBy === 'price-desc' ? 'selected' : ''}>Mayor precio</option>
                  </select>
                  <div class="absolute right-2.5 top-2 pointer-events-none text-slate-400">
                    ${renderIcon('ChevronDown', 'w-3.5 h-3.5')}
                  </div>
                </div>
              </div>
            </div>

            <!-- Reactive Product Cards Grid Container -->
            <div id="catalog-products-container" class="min-h-[400px]"></div>

          </main>

        </div>

      </div>
    </div>
  `;

  const productsContainer = container.querySelector('#catalog-products-container');
  const resultsCounter = container.querySelector('#results-counter');
  const catRow = container.querySelector('#category-pills-row');
  const btnLeft = container.querySelector('#cat-scroll-left');
  const btnRight = container.querySelector('#cat-scroll-right');
  const priceSlider = container.querySelector('#price-range-slider');
  const priceMaxBox = container.querySelector('#price-max-box');
  const searchInput = container.querySelector('#search-in-results');
  const sortSelect = container.querySelector('#sort-select');

  // Arrow states update for category track
  const updateArrowStates = () => {
    if (!catRow || !btnLeft || !btnRight) return;
    btnLeft.disabled = catRow.scrollLeft <= 5;
    btnRight.disabled = Math.ceil(catRow.scrollLeft + catRow.clientWidth) >= catRow.scrollWidth - 5;
  };

  if (btnLeft && catRow) {
    btnLeft.addEventListener('click', () => {
      catRow.scrollBy({ left: -260, behavior: 'smooth' });
      setTimeout(updateArrowStates, 300);
    });
  }

  if (btnRight && catRow) {
    btnRight.addEventListener('click', () => {
      catRow.scrollBy({ left: 260, behavior: 'smooth' });
      setTimeout(updateArrowStates, 300);
    });
  }

  if (catRow) {
    catRow.addEventListener('scroll', updateArrowStates, { passive: true });
    setTimeout(updateArrowStates, 50);
  }

  // Reactive Card Renderer (Smooth & Non-destructive)
  function renderProductsGrid() {
    const filtered = getFilteredTools();
    if (resultsCounter) {
      resultsCounter.textContent = `${filtered.length} resultado${filtered.length === 1 ? '' : 's'}`;
    }

    if (filtered.length === 0) {
      productsContainer.innerHTML = `
        <div class="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm animate-in fade-in duration-200">
          <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            ${renderIcon('Search', 'w-6 h-6')}
          </div>
          <h3 class="text-base font-bold text-slate-900">No encontramos herramientas con esos filtros</h3>
          <p class="text-xs text-slate-500">Intenta ajustar el rango de precio, cambiar de categoría o buscar con otros términos.</p>
          <button id="btn-clear-empty-filters" class="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-2 px-5 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-95">
            ${renderIcon('RotateCcw', 'w-3.5 h-3.5')}
            Limpiar filtros
          </button>
        </div>
      `;

      productsContainer.querySelector('#btn-clear-empty-filters')?.addEventListener('click', () => {
        selectedCategory = 'cat-all';
        selectedStatus = 'ALL';
        searchQuery = '';
        maxPrice = 500000;
        if (searchInput) searchInput.value = '';
        if (priceSlider) priceSlider.value = '500000';
        if (priceMaxBox) priceMaxBox.textContent = '$ 500.000';
        updateCategoryButtonsUI();
        renderProductsGrid();
      });
      return;
    }

    // Render cards matching img/ToolRent Equipment Marketplace Interface.png
    productsContainer.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in" id="tools-cards-grid">
        ${filtered.map(tool => {
          const isAvailable = tool.status === 'AVAILABLE';
          const isRented = tool.status === 'RENTED';
          const isMaint = tool.status === 'MAINTENANCE';

          const primaryImg = tool.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800';

          const statusBadge = isAvailable
            ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/90 shadow-xs">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Disponible
               </span>`
            : isRented
            ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/90 shadow-xs">
                <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Alquilada
               </span>`
            : `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/90 shadow-xs">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Mantenimiento
               </span>`;

          return `
            <div class="tool-card-item bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs card-lift flex flex-col justify-between group">
              
              <div>
                <!-- Tool Image Canvas with Status Badge -->
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

                <!-- Tool Card Info -->
                <div class="p-4 space-y-1">
                  <h3 class="font-bold text-slate-900 text-sm leading-snug cursor-pointer hover:text-[#FF5A1F] transition-colors tool-card-trigger" data-id="${tool.id}">
                    ${tool.name}
                  </h3>
                  <p class="text-xs text-slate-400 font-medium">
                    ${tool.categoryName || 'Construcción'}
                  </p>
                </div>
              </div>

              <!-- Card Footer: Price & CTA Button -->
              <div class="p-4 pt-0 border-t border-slate-50 flex items-center justify-between mt-2">
                <div>
                  <span class="text-base font-bold text-slate-900 font-display">${formatCurrency(tool.dailyPrice)}</span>
                  <span class="text-[11px] text-slate-400 font-normal"> / día</span>
                </div>

                <div>
                  ${isAvailable ? `
                    <button class="btn-tool-details inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#FF5A1F] hover:bg-[#e04e18] shadow-xs hover:shadow transition-all duration-150 active:scale-95 cursor-pointer" data-id="${tool.id}">
                      Ver detalles
                    </button>
                  ` : `
                    <button disabled class="bg-slate-100 text-slate-400 border border-slate-200 py-1.5 px-3.5 rounded-xl text-xs font-medium cursor-not-allowed select-none">
                      No disponible
                    </button>
                  `}
                </div>
              </div>

            </div>
          `;
        }).join('')}
      </div>
    `;

    // Stagger in cards smoothly using Anime.js
    animateStaggerIn(productsContainer.querySelectorAll('.tool-card-item'), { stagger: 40, duration: 400 });

    // Click events to open product detail view
    productsContainer.querySelectorAll('.btn-tool-details, .tool-card-trigger').forEach(el => {
      el.addEventListener('click', () => {
        window.location.hash = `#/product/${el.dataset.id}`;
      });
    });
  }

  // Update active pill styling across top carousel and sidebar
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

  // Event Listeners for smooth real-time interactions
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

  // Price slider with instant label update & smooth filtering
  if (priceSlider) {
    priceSlider.addEventListener('input', (e) => {
      maxPrice = parseInt(e.target.value, 10);
      if (priceMaxBox) priceMaxBox.textContent = `$ ${maxPrice.toLocaleString('es-CO')}`;
      renderProductsGrid();
    });
  }

  // Real-time search with zero focus loss
  let searchDebounce = null;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        searchQuery = e.target.value;
        renderProductsGrid();
      }, 120);
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      sortBy = e.target.value;
      renderProductsGrid();
    });
  }

  // Initial render of product cards
  renderProductsGrid();
}

export default renderCatalogView;
