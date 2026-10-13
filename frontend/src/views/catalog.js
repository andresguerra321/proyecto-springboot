import api from '../api/client.js';
import { formatCurrency } from '../utils/formatters.js';
import { renderIcon } from '../utils/icons.js';
import { openRentalModal } from './rental-modal.js';

export async function renderCatalogView() {
  const container = document.getElementById('app-content');
  if (!container) return;

  // Local state
  let selectedCategory = 'cat-all';
  let selectedStatus = 'ALL'; // ALL, AVAILABLE, RENTED, MAINTENANCE
  let searchQuery = '';
  let minPrice = 10000;
  let maxPrice = 500000;
  let sortBy = 'relevant';
  let viewMode = 'normal'; // normal, skeleton, empty, error
  let categoryScrollLeft = 0;

  let allTools = [];
  let categories = [];

  try {
    const [toolsData, catsData] = await Promise.all([
      api.get('/tools'),
      api.get('/tools/categories')
    ]);
    allTools = toolsData;
    categories = catsData;
  } catch (e) {
    console.error('Error loading catalog data', e);
  }

  function render() {
    // Filter tools
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
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(q) || 
        t.categoryName?.toLowerCase().includes(q) ||
        t.brand?.toLowerCase().includes(q)
      );
    }

    filtered = filtered.filter(t => (t.dailyPrice || 0) >= minPrice && (t.dailyPrice || 0) <= maxPrice);

    if (sortBy === 'price-asc') filtered.sort((a, b) => a.dailyPrice - b.dailyPrice);
    if (sortBy === 'price-desc') filtered.sort((a, b) => b.dailyPrice - a.dailyPrice);

    container.innerHTML = `
      <div class="min-h-screen bg-[#f8fafc] text-slate-800 pb-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
          
          <!-- Panoramic Hero Banner matching img/ToolRent Equipment Marketplace Interface.png -->
          <div class="relative rounded-2xl overflow-hidden min-h-[220px] sm:min-h-[240px] flex items-center shadow-sm">
            <img 
              src="https://images.unsplash.com/photo-1541888946425-d0fbb186f5f8?w=1600&auto=format&fit=crop&q=80" 
              alt="ToolRent Construction Site Banner" 
              class="absolute inset-0 w-full h-full object-cover object-center" 
            />
            <div class="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-slate-950/30"></div>
            
            <div class="relative z-10 p-8 sm:p-12 max-w-2xl text-white space-y-2">
              <h1 class="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight font-display leading-tight">
                Alquila el equipo que necesitas.<br />
                <span class="text-white">Sin comprarlo.</span>
              </h1>
              <p class="text-xs sm:text-sm text-slate-200 font-normal leading-relaxed pt-1">
                Herramientas y maquinaria para construir, remodelar y hacer realidad tus proyectos en todo Colombia.
              </p>
            </div>
          </div>

          <!-- Horizontal Category Pills Bar with Navigation Arrows matching page styling -->
          <div class="relative flex items-center group/pills mb-2">
            <!-- Left Arrow Button -->
            <button 
              id="cat-scroll-left" 
              class="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 shadow-sm transition-all z-10 flex-shrink-0 mr-1.5 sm:mr-2 cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-white"
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
                        ? 'bg-orange-50/80 border-[#ea580c] text-[#ea580c] shadow-xs' 
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }"
                    data-cat-id="${cat.id}"
                  >
                    ${renderIcon(cat.icon || 'Wrench', `w-3.5 h-3.5 ${isActive ? 'text-[#ea580c]' : 'text-slate-500'}`)}
                    <span>${cat.name}</span>
                  </button>
                `;
              }).join('')}
            </div>

            <!-- Right Arrow Button -->
            <button 
              id="cat-scroll-right" 
              class="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 shadow-sm transition-all z-10 flex-shrink-0 ml-1.5 sm:ml-2 cursor-pointer disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-white"
              aria-label="Desplazar categorías hacia la derecha"
              title="Siguiente"
            >
              ${renderIcon('ChevronRight', 'w-4 h-4')}
            </button>
          </div>

          <!-- Main Marketplace Layout: Sidebar Filters + Products Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            
            <!-- Left Sidebar Filters matching mockup -->
            <aside class="space-y-6 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
              
              <!-- Category Accordion -->
              <div>
                <div class="flex items-center justify-between pb-3 cursor-pointer select-none">
                  <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Categoría</h3>
                  ${renderIcon('ChevronUp', 'w-4 h-4 text-slate-400')}
                </div>
                <div class="space-y-2.5 text-xs text-slate-700 pt-1">
                  <label class="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" name="cat-cb" value="cat-all" ${selectedCategory === 'cat-all' ? 'checked' : ''} class="rounded text-brand-500 focus:ring-brand-400" />
                    <span>Todas</span>
                  </label>
                  <label class="flex items-center justify-between cursor-pointer">
                    <div class="flex items-center gap-2.5">
                      <input type="checkbox" name="cat-cb" value="cat-electricas" ${selectedCategory === 'cat-electricas' ? 'checked' : ''} class="rounded text-brand-500 focus:ring-brand-400" />
                      <span>Herramientas eléctricas</span>
                    </div>
                    <span class="text-slate-400 text-[11px]">(12)</span>
                  </label>
                  <label class="flex items-center justify-between cursor-pointer">
                    <div class="flex items-center gap-2.5">
                      <input type="checkbox" name="cat-cb" value="cat-construccion" ${selectedCategory === 'cat-construccion' ? 'checked' : ''} class="rounded text-brand-500 focus:ring-brand-400" />
                      <span>Construcción</span>
                    </div>
                    <span class="text-slate-400 text-[11px]">(10)</span>
                  </label>
                  <label class="flex items-center justify-between cursor-pointer">
                    <div class="flex items-center gap-2.5">
                      <input type="checkbox" name="cat-cb" value="cat-demolicion" ${selectedCategory === 'cat-demolicion' ? 'checked' : ''} class="rounded text-brand-500 focus:ring-brand-400" />
                      <span>Demolición</span>
                    </div>
                    <span class="text-slate-400 text-[11px]">(6)</span>
                  </label>
                  <label class="flex items-center justify-between cursor-pointer">
                    <div class="flex items-center gap-2.5">
                      <input type="checkbox" name="cat-cb" value="cat-elevacion" ${selectedCategory === 'cat-elevacion' ? 'checked' : ''} class="rounded text-brand-500 focus:ring-brand-400" />
                      <span>Elevación</span>
                    </div>
                    <span class="text-slate-400 text-[11px]">(5)</span>
                  </label>
                  <label class="flex items-center justify-between cursor-pointer">
                    <div class="flex items-center gap-2.5">
                      <input type="checkbox" name="cat-cb" value="cat-compactacion" ${selectedCategory === 'cat-compactacion' ? 'checked' : ''} class="rounded text-brand-500 focus:ring-brand-400" />
                      <span>Compactación</span>
                    </div>
                    <span class="text-slate-400 text-[11px]">(4)</span>
                  </label>
                  <button id="btn-show-more-cats" class="text-brand-600 text-[11px] font-semibold hover:underline block pt-1">
                    Ver más
                  </button>
                </div>
              </div>

              <div class="border-t border-slate-100"></div>

              <!-- Estado Filter Accordion -->
              <div>
                <div class="flex items-center justify-between pb-3 cursor-pointer select-none">
                  <h3 class="text-xs font-bold text-slate-900 uppercase tracking-wider">Estado</h3>
                  ${renderIcon('ChevronUp', 'w-4 h-4 text-slate-400')}
                </div>
                <div class="space-y-2.5 text-xs text-slate-700 pt-1">
                  <label class="flex items-center gap-2.5 cursor-pointer">
                    <input type="radio" name="status-radio" value="ALL" ${selectedStatus === 'ALL' ? 'checked' : ''} class="text-brand-500 focus:ring-brand-400" />
                    <span>Todas</span>
                  </label>
                  <label class="flex items-center gap-2.5 cursor-pointer">
                    <input type="radio" name="status-radio" value="AVAILABLE" ${selectedStatus === 'AVAILABLE' ? 'checked' : ''} class="text-brand-500 focus:ring-brand-400" />
                    <span>Disponibles</span>
                  </label>
                </div>
              </div>

              <div class="border-t border-slate-100"></div>

              <!-- Rango de Precio Slider & Inputs matching mockup -->
              <div>
                <div class="flex items-center justify-between pb-3 cursor-pointer select-none">
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
                      step="10000" 
                      value="${maxPrice}" 
                      class="w-full accent-brand-500 cursor-pointer"
                    />
                    <div class="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
                      <span>$ 10.000</span>
                      <span>$ 500.000</span>
                    </div>
                  </div>

                  <!-- Dual Box Inputs -->
                  <div class="flex items-center gap-2 text-xs">
                    <div class="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-center font-mono text-slate-700">
                      $ ${minPrice.toLocaleString('es-CO')}
                    </div>
                    <span class="text-slate-400">-</span>
                    <div class="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-center font-mono text-slate-700">
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
                <div class="text-sm font-bold text-slate-900 font-display">
                  <span>${filtered.length} resultados</span>
                </div>

                <div class="flex items-center gap-3">
                  <!-- Search in results -->
                  <div class="relative flex-1 sm:w-64">
                    <input 
                      type="text" 
                      id="search-in-results" 
                      value="${searchQuery}" 
                      placeholder="Buscar en resultados..." 
                      class="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-brand-500 transition-colors shadow-xs"
                    />
                    <div class="absolute left-2.5 top-2 text-slate-400">
                      ${renderIcon('Search', 'w-3.5 h-3.5')}
                    </div>
                  </div>

                  <!-- Sort dropdown -->
                  <div class="relative">
                    <select id="sort-select" class="bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-brand-500 transition-colors appearance-none shadow-xs cursor-pointer">
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

              <!-- Main Viewport conditional on viewMode -->
              ${viewMode === 'skeleton' ? `
                <!-- Skeleton State -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  ${[1, 2, 3, 4, 5, 6].map(() => `
                    <div class="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 animate-pulse">
                      <div class="h-44 bg-slate-100 rounded-xl"></div>
                      <div class="h-4 bg-slate-100 rounded w-3/4"></div>
                      <div class="h-3 bg-slate-100 rounded w-1/2"></div>
                      <div class="flex justify-between items-center pt-2">
                        <div class="h-5 bg-slate-100 rounded w-1/3"></div>
                        <div class="h-8 bg-slate-100 rounded w-1/3"></div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : viewMode === 'error' ? `
                <!-- Error State -->
                <div class="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
                  <div class="w-12 h-12 rounded-full bg-rose-50 text-rose-500 border border-rose-200 flex items-center justify-center mx-auto">
                    ${renderIcon('AlertCircle', 'w-6 h-6')}
                  </div>
                  <h3 class="text-base font-bold text-slate-900">No pudimos cargar las herramientas</h3>
                  <p class="text-xs text-slate-500">Ocurrió un error al obtener los datos. Intenta nuevamente.</p>
                  <button id="btn-retry-catalog" class="btn-primary !py-2 !px-6 text-xs font-semibold">
                    Reintentar
                  </button>
                </div>
              ` : filtered.length === 0 ? `
                <!-- Empty State -->
                <div class="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
                  <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    ${renderIcon('Search', 'w-6 h-6')}
                  </div>
                  <h3 class="text-base font-bold text-slate-900">No encontramos herramientas con esos filtros</h3>
                  <p class="text-xs text-slate-500">Intenta ajustar los filtros o buscar con otros términos.</p>
                  <button id="btn-clear-empty-filters" class="w-full sm:w-auto bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-2 px-5 rounded-lg text-xs font-semibold shadow-xs">
                    Limpiar filtros
                  </button>
                </div>
              ` : `
                <!-- Normal 3-Column Tool Cards Grid matching mockup -->
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="tools-cards-grid">
                  ${filtered.map(tool => {
                    const isAvailable = tool.status === 'AVAILABLE';
                    const isRented = tool.status === 'RENTED';
                    const isMaint = tool.status === 'MAINTENANCE';

                    const primaryImg = tool.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800';

                    const statusBadge = isAvailable
                      ? `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs">
                          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Disponible
                         </span>`
                      : isRented
                      ? `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 shadow-xs">
                          <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Alquilada
                         </span>`
                      : `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-xs">
                          <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Mantenimiento
                         </span>`;

                    return `
                      <div class="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
                        
                        <div>
                          <!-- Tool Image Canvas with Status Badge -->
                          <div class="relative h-48 overflow-hidden bg-slate-50 cursor-pointer tool-card-img" data-id="${tool.id}">
                            <img 
                              src="${primaryImg}" 
                              alt="${tool.name}" 
                              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                            />
                            <div class="absolute top-3 right-3 z-10">
                              ${statusBadge}
                            </div>
                          </div>

                          <!-- Tool Card Info -->
                          <div class="p-4 space-y-1">
                            <h3 class="font-bold text-slate-900 text-sm leading-snug cursor-pointer hover:text-brand-600 transition-colors tool-card-title" data-id="${tool.id}">
                              ${tool.name}
                            </h3>
                            <p class="text-xs text-slate-400">
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
                              <button class="btn-tool-details btn-primary !py-1.5 !px-3.5 text-xs font-semibold shadow-xs" data-id="${tool.id}">
                                Ver detalles
                              </button>
                            ` : `
                              <button disabled class="bg-slate-100 text-slate-400 border border-slate-200 py-1.5 px-3.5 rounded-lg text-xs font-medium cursor-not-allowed">
                                No disponible
                              </button>
                            `}
                          </div>
                        </div>

                      </div>
                    `;
                  }).join('')}
                </div>
              `}

            </main>

          </div>

        </div>
      </div>
    `;

    // Category pills events
    container.querySelectorAll('.cat-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedCategory = btn.dataset.catId;
        render();
      });
    });

    // Category pills arrow navigation & scroll preservation
    const catRow = container.querySelector('#category-pills-row');
    const btnLeft = container.querySelector('#cat-scroll-left');
    const btnRight = container.querySelector('#cat-scroll-right');

    const updateArrowStates = () => {
      if (!catRow || !btnLeft || !btnRight) return;
      btnLeft.disabled = catRow.scrollLeft <= 5;
      btnRight.disabled = Math.ceil(catRow.scrollLeft + catRow.clientWidth) >= catRow.scrollWidth - 5;
    };

    if (btnLeft && catRow) {
      btnLeft.addEventListener('click', () => {
        catRow.scrollBy({ left: -260, behavior: 'smooth' });
        setTimeout(updateArrowStates, 320);
      });
    }

    if (btnRight && catRow) {
      btnRight.addEventListener('click', () => {
        catRow.scrollBy({ left: 260, behavior: 'smooth' });
        setTimeout(updateArrowStates, 320);
      });
    }

    if (catRow) {
      if (categoryScrollLeft > 0) {
        catRow.scrollLeft = categoryScrollLeft;
      }
      catRow.addEventListener('scroll', () => {
        categoryScrollLeft = catRow.scrollLeft;
        updateArrowStates();
      }, { passive: true });
      setTimeout(updateArrowStates, 50);
    }

    // Checkbox category events
    container.querySelectorAll('input[name="cat-cb"]').forEach(cb => {
      cb.addEventListener('change', (e) => {
        selectedCategory = e.target.value;
        render();
      });
    });

    // Status radio events
    container.querySelectorAll('input[name="status-radio"]').forEach(rb => {
      rb.addEventListener('change', (e) => {
        selectedStatus = e.target.value;
        render();
      });
    });

    // Slider event
    container.querySelector('#price-range-slider')?.addEventListener('input', (e) => {
      maxPrice = parseInt(e.target.value, 10);
      render();
    });

    // Search events
    container.querySelector('#search-in-results')?.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      render();
    });

    // Sort event
    container.querySelector('#sort-select')?.addEventListener('change', (e) => {
      sortBy = e.target.value;
      render();
    });

    // Tool click events (opens dedicated product page)
    const openProduct = (id) => {
      window.location.hash = `#/product/${id}`;
    };

    container.querySelectorAll('.btn-tool-details').forEach(btn => {
      btn.addEventListener('click', () => openProduct(btn.dataset.id));
    });

    container.querySelectorAll('.tool-card-title, .tool-card-img').forEach(el => {
      el.addEventListener('click', () => openProduct(el.dataset.id));
    });

    // Empty/Error buttons
    container.querySelector('#btn-clear-empty-filters')?.addEventListener('click', () => {
      selectedCategory = 'cat-all';
      selectedStatus = 'ALL';
      searchQuery = '';
      maxPrice = 500000;
      viewMode = 'normal';
      render();
    });

    container.querySelector('#btn-retry-catalog')?.addEventListener('click', () => {
      viewMode = 'normal';
      render();
    });
  }

  render();
}

export default renderCatalogView;
