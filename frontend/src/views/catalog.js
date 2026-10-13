import api from '../api/client.js';
import { formatCurrency, getToolStatusBadge } from '../utils/formatters.js';
import { renderIcon } from '../utils/icons.js';
import { openRentalModal } from './rental-modal.js';
import modal from '../components/modal.js';

export async function renderCatalogView() {
  const container = document.getElementById('app-content');
  if (!container) return;

  container.innerHTML = `
    <!-- Hero Banner -->
    <section class="relative overflow-hidden py-14 md:py-20 border-b border-slate-800/80">
      <!-- Glow Gradients -->
      <div class="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-400 text-xs font-semibold mb-6 animate-fade-in">
          ${renderIcon('Sparkles', 'w-4 h-4')} Maquinaria Pesada & Equipos Certificados para Obras
        </div>

        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Alquila la Maquinaria que tu <span class="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-amber-300 to-yellow-500">Proyecto Necesita</span>
        </h1>

        <p class="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal">
          Generadores, demoledores, andamios y equipos industriales de alta resistencia con disponibilidad garantizada, entrega rápida y facturación en línea.
        </p>

        <!-- Stats Counter Pill -->
        <div class="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-300">
          <div class="flex items-center gap-2">
            ${renderIcon('ShieldCheck', 'w-4 h-4 text-emerald-400')}
            <span>100% Equipos Asegurados</span>
          </div>
          <div class="flex items-center gap-2">
            ${renderIcon('Clock', 'w-4 h-4 text-brand-400')}
            <span>Disponibilidad por Fechas en Tiempo Real</span>
          </div>
          <div class="flex items-center gap-2">
            ${renderIcon('FileCheck', 'w-4 h-4 text-sky-400')}
            <span>Facturación Electrónica con IVA</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Catalog Section -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
      
      <!-- Filters and Search Bar -->
      <div class="glass-card p-4 sm:p-5 mb-8 space-y-4">
        <div class="flex flex-col sm:flex-row gap-4 justify-between items-center">
          
          <!-- Search Input -->
          <div class="relative w-full sm:w-96">
            <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              ${renderIcon('Search', 'w-4 h-4')}
            </span>
            <input type="text" id="catalog-search" placeholder="Buscar por nombre, marca o modelo (ej. Honda, Bosch)..." class="input-field pl-10" />
          </div>

          <!-- Status Filter -->
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <span class="text-xs text-slate-400 font-medium whitespace-nowrap">Estado:</span>
            <select id="catalog-status-filter" class="input-field !py-2 text-xs !w-auto">
              <option value="">Todos los Estados</option>
              <option value="AVAILABLE" selected>Solo Disponibles</option>
              <option value="RENTED">En Alquiler</option>
              <option value="MAINTENANCE">En Taller</option>
            </select>
          </div>

        </div>

        <!-- Categories Pill Bar -->
        <div class="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar" id="categories-pill-container">
          <button class="cat-pill active px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap bg-brand-500 text-slate-950 shadow-sm" data-cat-id="">
            Todas las Categorías
          </button>
          <!-- Loaded dynamically -->
        </div>
      </div>

      <!-- Tools Grid -->
      <div id="tools-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Skeleton Loading State -->
        <div class="col-span-full py-16 text-center text-slate-400">
          ${renderIcon('Loader2', 'w-8 h-8 animate-spin mx-auto text-brand-400 mb-2')}
          <p class="text-sm">Cargando inventario de maquinaria y herramientas...</p>
        </div>
      </div>

    </section>
  `;

  // State for filtering
  let allTools = [];
  let selectedCategory = '';
  let selectedStatus = 'AVAILABLE';
  let searchTerm = '';

  // Load Categories & Tools
  await loadCategories();
  await loadTools();

  // Attach Filters
  const searchInput = container.querySelector('#catalog-search');
  searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value.toLowerCase().trim();
    filterAndRender();
  });

  const statusFilter = container.querySelector('#catalog-status-filter');
  statusFilter.addEventListener('change', (e) => {
    selectedStatus = e.target.value;
    filterAndRender();
  });

  async function loadCategories() {
    try {
      const categories = await api.get('/tools/categories');
      const catContainer = container.querySelector('#categories-pill-container');
      if (!catContainer) return;

      categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'cat-pill px-4 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all';
        btn.textContent = cat.name;
        btn.dataset.catId = cat.id;

        btn.addEventListener('click', () => {
          container.querySelectorAll('.cat-pill').forEach(b => {
            b.className = 'cat-pill px-4 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all';
          });
          btn.className = 'cat-pill active px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap bg-brand-500 text-slate-950 shadow-sm';
          selectedCategory = cat.id;
          filterAndRender();
        });

        catContainer.appendChild(btn);
      });

      // Reset to "Todas"
      const allBtn = catContainer.querySelector('[data-cat-id=""]');
      allBtn.addEventListener('click', () => {
        catContainer.querySelectorAll('.cat-pill').forEach(b => {
          b.className = 'cat-pill px-4 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all';
        });
        allBtn.className = 'cat-pill active px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap bg-brand-500 text-slate-950 shadow-sm';
        selectedCategory = '';
        filterAndRender();
      });

    } catch (err) {
      console.warn('Could not load categories list', err);
    }
  }

  async function loadTools() {
    try {
      allTools = await api.get('/tools');
      filterAndRender();
    } catch (err) {
      const grid = container.querySelector('#tools-grid');
      grid.innerHTML = `
        <div class="col-span-full p-8 text-center glass-card border-rose-500/30">
          ${renderIcon('AlertCircle', 'w-8 h-8 text-rose-400 mx-auto mb-2')}
          <h4 class="text-base font-bold text-white">Error de Conexión con el Catálogo</h4>
          <p class="text-xs text-slate-400 mt-1 mb-4">${err.message}</p>
          <button id="retry-tools-btn" class="btn-secondary !py-2 text-xs">Reintentar</button>
        </div>
      `;
      grid.querySelector('#retry-tools-btn')?.addEventListener('click', loadTools);
    }
  }

  function filterAndRender() {
    const grid = container.querySelector('#tools-grid');
    if (!grid) return;

    let filtered = allTools;

    if (selectedStatus) {
      filtered = filtered.filter(t => t.status === selectedStatus);
    }

    if (selectedCategory) {
      filtered = filtered.filter(t => t.categoryId === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(t => 
        (t.name && t.name.toLowerCase().includes(searchTerm)) ||
        (t.brand && t.brand.toLowerCase().includes(searchTerm)) ||
        (t.model && t.model.toLowerCase().includes(searchTerm)) ||
        (t.description && t.description.toLowerCase().includes(searchTerm))
      );
    }

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-16 text-center glass-card border-slate-800">
          ${renderIcon('PackageX', 'w-10 h-10 text-slate-500 mx-auto mb-2')}
          <h4 class="text-base font-bold text-white">No se encontraron herramientas</h4>
          <p class="text-xs text-slate-400 mt-1">Prueba a cambiar los filtros o el término de búsqueda.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(tool => {
      const primaryImg = tool.images?.find(i => i.isPrimary)?.imageUrl || tool.images?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=60';
      const isAvailable = tool.status === 'AVAILABLE';

      return `
        <div class="glass-card-hover overflow-hidden flex flex-col group border border-slate-800/80">
          
          <!-- Image Banner -->
          <div class="relative h-52 bg-slate-900 overflow-hidden">
            <img src="${primaryImg}" alt="${tool.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
            
            <!-- Top Badges -->
            <div class="absolute top-3 left-3 flex items-center gap-1.5">
              ${getToolStatusBadge(tool.status)}
            </div>

            <div class="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-mono text-slate-300 border border-slate-800">
              ${tool.brand || 'Industrial'}
            </div>
          </div>

          <!-- Card Body -->
          <div class="p-5 flex-1 flex flex-col justify-between space-y-4">
            
            <div>
              <div class="text-[11px] font-semibold text-brand-400 uppercase tracking-wider mb-1">
                ${tool.model || 'Modelo Estándar'}
              </div>
              <h3 class="text-base font-bold text-white font-display line-clamp-1 group-hover:text-brand-300 transition-colors">
                ${tool.name}
              </h3>
              <p class="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                ${tool.description || 'Equipo para faenas constructivas de alta exigencia.'}
              </p>
            </div>

            <!-- Price & Actions Footer -->
            <div class="pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <div>
                <span class="text-[10px] text-slate-400 block font-medium">Tarifa por día</span>
                <span class="text-lg font-extrabold text-white font-display">
                  ${formatCurrency(tool.dailyPrice)}
                </span>
              </div>

              <div class="flex items-center gap-2">
                <button class="btn-detail p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors" data-tool-id="${tool.id}" title="Ver Ficha Técnica">
                  ${renderIcon('Info', 'w-4 h-4')}
                </button>
                <button class="btn-rent btn-primary !py-2 !px-3.5 text-xs ${!isAvailable ? 'opacity-40 pointer-events-none' : ''}" data-tool-id="${tool.id}">
                  ${renderIcon('Calendar', 'w-3.5 h-3.5')} Alquilar
                </button>
              </div>
            </div>

          </div>

        </div>
      `;
    }).join('');

    // Attach Click Events for Cards
    grid.querySelectorAll('.btn-rent').forEach(btn => {
      btn.addEventListener('click', () => {
        const toolId = btn.dataset.toolId;
        const tool = allTools.find(t => t.id === toolId);
        if (tool) openRentalModal(tool);
      });
    });

    grid.querySelectorAll('.btn-detail').forEach(btn => {
      btn.addEventListener('click', () => {
        const toolId = btn.dataset.toolId;
        const tool = allTools.find(t => t.id === toolId);
        if (tool) openToolDetailModal(tool);
      });
    });
  }

  function openToolDetailModal(tool) {
    const content = document.createElement('div');
    content.className = 'space-y-6';

    const specs = tool.specifications || [];
    const images = tool.images || [];

    content.innerHTML = `
      <div class="space-y-5">
        <!-- Image Gallery -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${images.length > 0 ? images.map(img => `
            <div class="h-44 rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
              <img src="${img.imageUrl}" alt="${tool.name}" class="w-full h-full object-cover" />
            </div>
          `).join('') : `
            <div class="col-span-full h-48 rounded-xl overflow-hidden border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-500">
              Sin imágenes adicionales
            </div>
          `}
        </div>

        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-semibold text-brand-400 font-mono">${tool.brand} · ${tool.model}</span>
            ${getToolStatusBadge(tool.status)}
          </div>
          <h3 class="text-xl font-bold text-white font-display">${tool.name}</h3>
          <p class="text-xs text-slate-300 mt-2 leading-relaxed">${tool.description || 'Sin descripción detallada.'}</p>
        </div>

        <!-- Technical Specifications Table (4NF) -->
        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">Especificaciones Técnicas</h4>
          ${specs.length > 0 ? `
            <div class="border border-slate-800 rounded-xl overflow-hidden">
              <table class="w-full text-left text-xs">
                <tbody class="divide-y divide-slate-800">
                  ${specs.map(spec => `
                    <tr class="bg-slate-900/40">
                      <td class="py-2.5 px-3.5 font-medium text-slate-400 w-1/2">${spec.specName}</td>
                      <td class="py-2.5 px-3.5 font-semibold text-white">${spec.specValue}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <p class="text-xs text-slate-500 italic">No hay especificaciones técnicas adicionales registradas.</p>
          `}
        </div>

        <!-- Pricing Details -->
        <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-2 gap-4 text-xs">
          <div>
            <span class="text-slate-400">Tarifa Diaria:</span>
            <div class="text-base font-bold text-brand-400 font-display">${formatCurrency(tool.dailyPrice)} / día</div>
          </div>
          <div>
            <span class="text-slate-400">Valor Comercial de Reposición:</span>
            <div class="text-base font-bold text-slate-200 font-display">${formatCurrency(tool.replacementValue)}</div>
          </div>
        </div>

        <button id="detail-modal-rent-btn" class="btn-primary w-full !py-3">
          ${renderIcon('Calendar', 'w-4 h-4')} Reservar este Equipo
        </button>
      </div>
    `;

    content.querySelector('#detail-modal-rent-btn')?.addEventListener('click', () => {
      modal.close();
      openRentalModal(tool);
    });

    modal.open({
      title: `${renderIcon('Wrench', 'w-5 h-5 text-brand-400')} Ficha Técnica: ${tool.name}`,
      content: content,
      maxWidth: 'max-w-2xl',
    });
  }
}
