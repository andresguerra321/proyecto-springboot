import api from '../api/client.js';
import { formatCurrency, getToolStatusBadge } from '../utils/formatters.js';
import { renderIcon } from '../utils/icons.js';
import { openRentalModal } from './rental-modal.js';
import modal from '../components/modal.js';

export async function renderCatalogView() {
  const container = document.getElementById('app-content');
  if (!container) return;

  container.innerHTML = `
    <!-- Hero Banner (ToolRent Header) -->
    <section class="bg-white border-b border-slate-200 py-12 md:py-16 text-center">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-tight text-slate-900 leading-tight">
          Alquila el equipo que necesitas. <span class="text-[#ea580c]">Sin comprarlo.</span>
        </h1>
        <p class="mt-3 text-base sm:text-lg text-slate-500 max-w-2xl mx-auto font-normal">
          Herramientas y maquinaria de construcción disponibles en toda Colombia.
        </p>

        <!-- Horizontal Category Pills Bar -->
        <div class="mt-8 flex items-center justify-center gap-2.5 overflow-x-auto pb-2 no-scrollbar" id="top-category-pills">
          <!-- Dynamically populated -->
        </div>
      </div>
    </section>

    <!-- Main Marketplace Section (Sidebar + Grid) -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        <!-- Left Column: Filter Sidebar -->
        <aside class="lg:col-span-1 space-y-6">
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 class="font-bold text-slate-900 text-base">Filtros</h3>
              <button id="btn-clear-filters" class="text-xs text-[#ea580c] hover:underline font-semibold">Limpiar todo</button>
            </div>

            <!-- Category Dropdown -->
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Categoría</label>
              <select id="filter-category-select" class="input-field text-xs">
                <option value="">Todas las categorías</option>
              </select>
            </div>

            <!-- State Checkboxes -->
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">Estado</label>
              <div class="space-y-2 text-xs">
                <label class="flex items-center gap-2.5 cursor-pointer text-slate-700 hover:text-slate-900">
                  <input type="radio" name="state-filter" value="" checked class="text-[#ea580c] focus:ring-orange-500" />
                  <span>Todas</span>
                </label>
                <label class="flex items-center gap-2.5 cursor-pointer text-slate-700 hover:text-slate-900">
                  <input type="radio" name="state-filter" value="AVAILABLE" class="text-[#ea580c] focus:ring-orange-500" />
                  <span>Disponible</span>
                </label>
                <label class="flex items-center gap-2.5 cursor-pointer text-slate-700 hover:text-slate-900">
                  <input type="radio" name="state-filter" value="RENTED" class="text-[#ea580c] focus:ring-orange-500" />
                  <span>Alquilada</span>
                </label>
                <label class="flex items-center gap-2.5 cursor-pointer text-slate-700 hover:text-slate-900">
                  <input type="radio" name="state-filter" value="MAINTENANCE" class="text-[#ea580c] focus:ring-orange-500" />
                  <span>Mantenimiento</span>
                </label>
              </div>
            </div>

            <!-- Price Range -->
            <div>
              <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">Precio por día</label>
              <div class="flex items-center gap-2 text-xs">
                <input type="text" id="price-min" value="$ 50.000" class="input-field text-center font-mono !py-1.5" readonly />
                <span class="text-slate-400">–</span>
                <input type="text" id="price-max" value="$ 1.200.000" class="input-field text-center font-mono !py-1.5" readonly />
              </div>
              <input type="range" id="price-slider" min="50000" max="1500000" step="25000" value="1500000" class="w-full mt-3 accent-[#ea580c]" />
            </div>

            <button id="btn-apply-filters" class="btn-primary w-full !py-2.5">
              Aplicar filtros
            </button>
          </div>
        </aside>

        <!-- Right Column: Tools Grid -->
        <main class="lg:col-span-3 space-y-6">
          
          <!-- Top Control Bar -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            
            <div class="flex items-center gap-2">
              <button id="pill-all-count" class="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-900 border border-slate-200 shadow-sm">
                Todas (24)
              </button>
              <button id="pill-avail-count" class="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 bg-transparent">
                Disponibles (16)
              </button>
            </div>

            <div class="flex items-center gap-3">
              <div class="relative w-full sm:w-64">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  ${renderIcon('Search', 'w-3.5 h-3.5')}
                </span>
                <input type="text" id="grid-search-input" placeholder="Buscar en resultados..." class="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-[#ea580c]" />
              </div>

              <select id="sort-select" class="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-[#ea580c]">
                <option value="recent">Más recientes</option>
                <option value="price-asc">Menor precio</option>
                <option value="price-desc">Mayor precio</option>
              </select>
            </div>

          </div>

          <!-- Tools Cards Grid -->
          <div id="tools-grid-container" class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            <!-- Rendered dynamically -->
          </div>

        </main>

      </div>

    </section>
  `;

  // State
  let tools = [];
  let categories = [];
  let activeCategory = '';
  let activeState = '';
  let searchTerm = '';
  let maxPrice = 1500000;

  await loadCategories();
  await loadTools();

  async function loadCategories() {
    try {
      categories = await api.get('/tools/categories');
      const pillsContainer = container.querySelector('#top-category-pills');
      const selectDropdown = container.querySelector('#filter-category-select');

      pillsContainer.innerHTML = categories.map((cat, idx) => `
        <button class="top-cat-pill px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
          idx === 0 
            ? 'bg-[#fff7ed] text-[#ea580c] border border-[#ffedd5]' 
            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
        }" data-cat-id="${cat.id === 'cat-all' ? '' : cat.id}">
          ${renderIcon(cat.icon || 'Sparkles', 'w-3.5 h-3.5 text-current')}
          <span>${cat.name}</span>
        </button>
      `).join('');

      selectDropdown.innerHTML = `<option value="">Todas las categorías</option>` + categories.filter(c => c.id !== 'cat-all').map(c => `
        <option value="${c.id}">${c.name}</option>
      `).join('');

      // Click pill
      pillsContainer.querySelectorAll('.top-cat-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          pillsContainer.querySelectorAll('.top-cat-pill').forEach(b => {
            b.className = 'top-cat-pill px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50';
          });
          btn.className = 'top-cat-pill px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 bg-[#fff7ed] text-[#ea580c] border border-[#ffedd5]';
          activeCategory = btn.dataset.catId;
          selectDropdown.value = activeCategory;
          filterAndRender();
        });
      });

      selectDropdown.addEventListener('change', (e) => {
        activeCategory = e.target.value;
        filterAndRender();
      });

    } catch (e) {
      console.warn('Could not load categories', e);
    }
  }

  async function loadTools() {
    try {
      tools = await api.get('/tools');
      filterAndRender();
    } catch (e) {
      console.warn('Could not load tools', e);
    }
  }

  // Filter bindings
  const searchInput = container.querySelector('#grid-search-input');
  searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value.toLowerCase().trim();
    filterAndRender();
  });

  const stateRadios = container.querySelectorAll('input[name="state-filter"]');
  stateRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      activeState = e.target.value;
      filterAndRender();
    });
  });

  const priceSlider = container.querySelector('#price-slider');
  priceSlider.addEventListener('input', (e) => {
    maxPrice = parseInt(e.target.value);
    container.querySelector('#price-max').value = formatCurrency(maxPrice);
    filterAndRender();
  });

  container.querySelector('#btn-clear-filters')?.addEventListener('click', () => {
    activeCategory = '';
    activeState = '';
    searchTerm = '';
    maxPrice = 1500000;
    container.querySelector('#filter-category-select').value = '';
    container.querySelector('input[name="state-filter"][value=""]').checked = true;
    priceSlider.value = 1500000;
    container.querySelector('#price-max').value = '$ 1.500.000';
    searchInput.value = '';
    filterAndRender();
  });

  container.querySelector('#pill-all-count')?.addEventListener('click', () => {
    activeState = '';
    container.querySelector('input[name="state-filter"][value=""]').checked = true;
    filterAndRender();
  });

  container.querySelector('#pill-avail-count')?.addEventListener('click', () => {
    activeState = 'AVAILABLE';
    container.querySelector('input[name="state-filter"][value="AVAILABLE"]').checked = true;
    filterAndRender();
  });

  function filterAndRender() {
    const grid = container.querySelector('#tools-grid-container');
    if (!grid) return;

    let filtered = tools;

    if (activeCategory) {
      filtered = filtered.filter(t => t.categoryId === activeCategory);
    }

    if (activeState) {
      filtered = filtered.filter(t => t.status === activeState);
    }

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.name.toLowerCase().includes(searchTerm) ||
        (t.brand && t.brand.toLowerCase().includes(searchTerm)) ||
        (t.categoryName && t.categoryName.toLowerCase().includes(searchTerm))
      );
    }

    filtered = filtered.filter(t => (t.dailyPrice || 0) <= maxPrice);

    // Update counts
    container.querySelector('#pill-all-count').textContent = `Todas (${tools.length})`;
    container.querySelector('#pill-avail-count').textContent = `Disponibles (${tools.filter(t => t.status === 'AVAILABLE').length})`;

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
          <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            ${renderIcon('Search', 'w-6 h-6')}
          </div>
          <h4 class="text-sm font-bold text-slate-800">No encontramos herramientas con esos filtros</h4>
          <p class="text-xs text-slate-500">Intenta ajustar los filtros de precio, categoría o cambia tu búsqueda.</p>
          <button id="btn-empty-clear" class="btn-secondary !py-2 text-xs">Limpiar filtros</button>
        </div>
      `;
      grid.querySelector('#btn-empty-clear')?.addEventListener('click', () => {
        container.querySelector('#btn-clear-filters').click();
      });
      return;
    }

    grid.innerHTML = filtered.map(tool => {
      const primaryImg = tool.images?.find(i => i.isPrimary)?.imageUrl || tool.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600';
      const isAvailable = tool.status === 'AVAILABLE';

      return `
        <div class="tr-card-hover overflow-hidden flex flex-col justify-between group">
          
          <div>
            <!-- Image & Badge Container -->
            <div class="relative h-48 bg-slate-50 overflow-hidden flex items-center justify-center p-4 border-b border-slate-100">
              <img src="${primaryImg}" alt="${tool.name}" class="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300" loading="lazy" />
              
              <!-- State Badge -->
              <div class="absolute top-3 right-3">
                ${getToolStatusBadge(tool.status)}
              </div>
            </div>

            <!-- Card Info Body -->
            <div class="p-5 space-y-2">
              <h3 class="text-base font-bold text-slate-900 font-display line-clamp-1 group-hover:text-[#ea580c] transition-colors">
                ${tool.name}
              </h3>
              <div class="text-xs text-slate-500">
                ${tool.categoryName || 'Herramientas eléctricas'}
              </div>
            </div>
          </div>

          <!-- Price & Button Footer -->
          <div class="p-5 pt-0">
            <div class="flex items-center justify-between mb-4">
              <div class="text-lg font-black text-slate-900 font-display">
                ${formatCurrency(tool.dailyPrice)} <span class="text-xs font-normal text-slate-500">/ día</span>
              </div>
            </div>

            ${isAvailable ? `
              <button class="btn-details-trigger btn-primary w-full !py-2 text-xs" data-tool-id="${tool.id}">
                Ver detalles
              </button>
            ` : `
              <button class="btn-disabled w-full !py-2 text-xs">
                No disponible
              </button>
            `}
          </div>

        </div>
      `;
    }).join('');

    // Attach card details trigger
    grid.querySelectorAll('.btn-details-trigger').forEach(btn => {
      btn.addEventListener('click', () => {
        const tool = tools.find(t => t.id === btn.dataset.toolId);
        if (tool) openProductDetailPage(tool);
      });
    });
  }

  /**
   * Detailed Product Page matching "ToolRent Hammer Drill Rental Page.png"
   */
  function openProductDetailPage(tool) {
    const images = tool.images || [];
    const specs = tool.specs || [];
    let activeImgIdx = 0;

    const modalContent = document.createElement('div');
    modalContent.className = 'space-y-6';

    function renderDetail() {
      const activeImg = images[activeImgIdx]?.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800';

      modalContent.innerHTML = `
        <div class="space-y-6">
          
          <!-- Top Breadcrumbs -->
          <div class="text-xs text-slate-500 flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <span class="hover:underline cursor-pointer">Inicio</span>
            <span>&gt;</span>
            <span class="hover:underline cursor-pointer">${tool.categoryName || 'Herramientas'}</span>
            <span>&gt;</span>
            <span class="text-slate-900 font-semibold truncate">${tool.name}</span>
          </div>

          <!-- Main Top Grid: Gallery on Left + Rental Booking Card on Right -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            <!-- Left: Gallery (Thumbnails + Main Stage) -->
            <div class="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
              
              <!-- Thumbnails Column -->
              <div class="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-visible">
                ${images.map((img, idx) => `
                  <button class="thumb-btn w-16 h-16 rounded-xl border-2 overflow-hidden flex-shrink-0 transition-all ${
                    idx === activeImgIdx ? 'border-[#ea580c] ring-2 ring-orange-500/20' : 'border-slate-200 hover:border-slate-300'
                  }" data-idx="${idx}">
                    <img src="${img.imageUrl}" class="w-full h-full object-cover" />
                  </button>
                `).join('')}
              </div>

              <!-- Main Stage Viewer -->
              <div class="flex-1 h-80 sm:h-96 bg-slate-50 rounded-2xl border border-slate-200 p-6 flex items-center justify-center relative overflow-hidden">
                <img src="${activeImg}" class="max-h-full max-w-full object-contain" />
                <span class="absolute bottom-3 right-3 text-[11px] font-mono text-slate-500 bg-white/80 px-2 py-0.5 rounded-md border border-slate-200">
                  ${activeImgIdx + 1} / ${images.length || 1}
                </span>
              </div>

            </div>

            <!-- Right: Rental Booking Summary Box -->
            <div class="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <h2 class="text-2xl font-black text-slate-900 font-display">${tool.name}</h2>
                  ${getToolStatusBadge(tool.status)}
                </div>
                <div class="text-xs text-slate-500">${tool.categoryName || 'Herramientas eléctricas'}</div>
              </div>

              <div class="text-3xl font-black text-slate-900 font-display">
                ${formatCurrency(tool.dailyPrice)} <span class="text-sm font-normal text-slate-500">/ día</span>
              </div>

              <!-- Date Picker Simulator -->
              <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                <div class="flex items-center gap-2 text-slate-700">
                  ${renderIcon('Calendar', 'w-4 h-4 text-[#ea580c]')}
                  <span class="font-medium">13 oct 2026 &rarr; 16 oct 2026</span>
                </div>
                <span class="text-slate-400">&blacktriangledown;</span>
              </div>

              <!-- Cost calculation line -->
              <div class="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs text-slate-600">
                <span>3 días &times; ${formatCurrency(tool.dailyPrice)}</span>
                <span class="font-bold text-slate-900 font-mono">${formatCurrency(tool.dailyPrice * 3)}</span>
              </div>

              <!-- Primary Action Button -->
              <button id="btn-add-to-reserve" class="btn-primary w-full !py-3 flex items-center justify-center gap-2">
                ${renderIcon('Calendar', 'w-4 h-4')}
                <span>Agregar a mi reserva</span>
              </button>

              <div class="p-3 rounded-xl bg-orange-50/60 border border-orange-100 text-[11px] text-[#ea580c] flex items-center gap-2">
                ${renderIcon('Info', 'w-4 h-4 flex-shrink-0')}
                <span>Reserva garantizada con entrega y factura electrónica en regla.</span>
              </div>
            </div>

          </div>

          <!-- Bottom Columns: Specifications (Left) & Description + Provider (Right) -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4 border-t border-slate-100">
            
            <!-- Specifications Table -->
            <div class="lg:col-span-6 space-y-3">
              <h4 class="text-sm font-bold text-slate-900">Especificaciones</h4>
              <div class="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table class="w-full">
                  <tbody class="divide-y divide-slate-100">
                    ${specs.length > 0 ? specs.map(s => `
                      <tr class="hover:bg-slate-50">
                        <td class="py-2.5 px-4 text-slate-500 font-medium w-1/2">${s.specName}</td>
                        <td class="py-2.5 px-4 text-slate-900 font-semibold">${s.specValue}</td>
                      </tr>
                    `).join('') : `
                      <tr><td class="p-4 text-slate-500">Consulte al proveedor para ficha detallada.</td></tr>
                    `}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Description & Provider Card -->
            <div class="lg:col-span-6 space-y-6">
              <div class="space-y-2">
                <h4 class="text-sm font-bold text-slate-900">Descripción</h4>
                <p class="text-xs text-slate-600 leading-relaxed">${tool.description}</p>
                <div class="grid grid-cols-2 gap-2 text-xs text-slate-700 pt-2">
                  <div class="flex items-center gap-1.5">${renderIcon('Check', 'w-3.5 h-3.5 text-emerald-600')} Incluye maletín</div>
                  <div class="flex items-center gap-1.5">${renderIcon('Check', 'w-3.5 h-3.5 text-emerald-600')} Accesorios completos</div>
                  <div class="flex items-center gap-1.5">${renderIcon('Check', 'w-3.5 h-3.5 text-emerald-600')} Empuñadura ergonómica</div>
                  <div class="flex items-center gap-1.5">${renderIcon('Check', 'w-3.5 h-3.5 text-emerald-600')} Inspección técnica previa</div>
                </div>
              </div>

              <!-- Provider Card -->
              <div class="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                <h5 class="text-xs font-bold text-slate-700 uppercase tracking-wider">Proveedor</h5>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                      CN
                    </div>
                    <div>
                      <div class="font-bold text-slate-900 text-xs">${tool.provider?.name || 'Constructoras del Norte S.A.S.'}</div>
                      <div class="text-[11px] text-slate-500">Equipos de construcción y maquinaria</div>
                    </div>
                  </div>
                  <span class="text-xs font-bold text-amber-600 flex items-center gap-1">
                    &#9733; ${tool.provider?.rating || '4.8'} <span class="text-slate-400 font-normal">(${tool.provider?.reviewsCount || '124'})</span>
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      `;

      // Thumbnails click
      modalContent.querySelectorAll('.thumb-btn').forEach(b => {
        b.addEventListener('click', () => {
          activeImgIdx = parseInt(b.dataset.idx);
          renderDetail();
        });
      });

      // Add to reserve
      modalContent.querySelector('#btn-add-to-reserve')?.addEventListener('click', () => {
        modal.close();
        openRentalModal(tool);
      });
    }

    renderDetail();

    modal.open({
      title: `${renderIcon('Tool', 'w-5 h-5 text-[#ea580c]')} Ficha del Equipo: ${tool.name}`,
      content: modalContent,
      maxWidth: 'max-w-5xl',
    });
  }
}
