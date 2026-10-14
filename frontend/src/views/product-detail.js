import api from '../api/client.js';
import auth from '../auth/state.js';
import showToast from '../components/toast.js';
import { formatCurrency } from '../utils/formatters.js';
import { renderIcon } from '../utils/icons.js';
import { openRentalModal } from './rental-modal.js';
import { openAuthModal } from '../components/auth-modal.js';
import error404Img from '../assets/error-404.png';

export async function renderProductPageView(toolId) {
  const container = document.getElementById('app-content');
  if (!container) return;

  // Loading skeleton state
  container.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse space-y-6">
      <div class="h-4 w-48 bg-slate-200 rounded"></div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-6">
          <div class="h-96 bg-slate-200 rounded-2xl"></div>
          <div class="grid grid-cols-2 gap-6">
            <div class="h-64 bg-slate-200 rounded-xl"></div>
            <div class="h-64 bg-slate-200 rounded-xl"></div>
          </div>
        </div>
        <div class="h-96 bg-slate-200 rounded-2xl"></div>
      </div>
    </div>
  `;

  let tool = null;
  try {
    try {
      tool = await api.get(`/tools/${toolId}`);
    } catch {
      const tools = await api.get('/tools');
      tool = (tools || []).find(t => String(t.id) === String(toolId)) || null;
    }
    if (tool) {
      tool.categoryId = tool.categoryId || tool.category?.id;
      tool.categoryName = tool.categoryName || tool.category?.name || 'Herramientas y Maquinaria';
    }
  } catch (err) {
    console.error('Error fetching tool details', err);
  }

  if (!tool) {
    container.innerHTML = `
      <section class="min-h-[85vh] bg-[#f8fafc] flex flex-col items-center justify-center py-8 px-4 sm:px-6 lg:px-8">
        <div class="max-w-5xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 relative select-none">
          <img 
            src="${error404Img}" 
            alt="Error 404 - Herramienta no encontrada" 
            class="w-full h-auto object-cover select-none block" 
          />
          
          <!-- Hotspot over 'Volver al inicio' button in image -->
          <a 
            href="#/catalog" 
            class="absolute cursor-pointer rounded-xl transition-all hover:bg-white/10 active:scale-95" 
            style="left: 5.6%; top: 64.6%; width: 22.5%; height: 7.2%;" 
            title="Volver al inicio"
            aria-label="Volver al inicio"
          ></a>

          <!-- Hotspot over 'Ir a la página anterior' in image -->
          <button 
            id="btn-product-404-back" 
            type="button"
            class="absolute cursor-pointer rounded-lg transition-all hover:bg-white/10 active:scale-95 text-transparent" 
            style="left: 5.6%; top: 73.8%; width: 17%; height: 4.2%;" 
            title="Ir a la página anterior"
            aria-label="Ir a la página anterior"
          ></button>
        </div>

        <!-- Mobile friendly buttons bar for small screens -->
        <div class="sm:hidden flex items-center justify-center gap-3 mt-4 w-full max-w-sm">
          <a href="#/catalog" class="btn-primary flex-1 !py-2.5 text-xs text-center font-bold">
            Volver al inicio &rarr;
          </a>
          <button onclick="window.history.back()" class="btn-secondary flex-1 !py-2.5 text-xs font-semibold">
            &larr; Página anterior
          </button>
        </div>
      </section>
    `;

    container.querySelector('#btn-product-404-back')?.addEventListener('click', () => {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.hash = '#/catalog';
      }
    });

    return;
  }

  // Active image gallery index
  let activeImageIndex = 0;
  const images = tool.images && tool.images.length > 0 ? tool.images : [
    { imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1000&auto=format&fit=crop&q=80' },
    { imageUrl: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=1000&auto=format&fit=crop&q=80' },
    { imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1000&auto=format&fit=crop&q=80' },
    { imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000&auto=format&fit=crop&q=80' },
  ];

  // Dates state
  let daysCount = 3;
  let startDate = '2026-10-13';
  let endDate = '2026-10-16';

  function render() {
    const dailyPrice = tool.dailyPrice || 85000;
    const totalAmount = dailyPrice * daysCount;
    const currentImg = images[activeImageIndex]?.imageUrl || images[0].imageUrl;

    const specsList = (tool.specifications && tool.specifications.length > 0)
      ? tool.specifications
      : (tool.specs && tool.specs.length > 0 ? tool.specs : [
      { specName: 'Marca', specValue: tool.brand || 'DeWalt' },
      { specName: 'Modelo', specValue: tool.model || 'DWD520K' },
      { specName: 'Potencia', specValue: '710 W' },
      { specName: 'Voltaje', specValue: '110 V' },
      { specName: 'Velocidad sin carga', specValue: '0 – 2.800 RPM' },
      { specName: 'Impactos por minuto', specValue: '0 – 47.600 IPM' },
      { specName: 'Capacidad de perforación (madera)', specValue: '25 mm' },
      { specName: 'Capacidad de perforación (metal)', specValue: '13 mm' },
      { specName: 'Capacidad de perforación (concreto)', specValue: '16 mm' },
      { specName: 'Peso', specValue: '2.6 kg' },
    ]);

    const highlights = tool.highlights && tool.highlights.length > 0 ? tool.highlights : [
      'Incluye maletín', '2 brocas SDS', 'Empuñadura lateral', 'Tope de profundidad'
    ];

    container.innerHTML = `
      <div class="min-h-screen bg-[#f8fafc] text-slate-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          
          <!-- Breadcrumb navigation matching screenshot -->
          <nav class="flex items-center gap-2 text-xs text-slate-400">
            <a href="#/catalog" class="hover:text-slate-600 transition-colors">Inicio</a>
            <span>></span>
            <span class="hover:text-slate-600 cursor-pointer">${tool.categoryName || 'Herramientas eléctricas'}</span>
            <span>></span>
            <span class="text-slate-800 font-medium">${tool.name}</span>
          </nav>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            
            <!-- Left 2 Columns: Gallery & Detailed Specs -->
            <div class="lg:col-span-2 space-y-8">
              
              <!-- Gallery Stage -->
              <div class="flex gap-4">
                
                <!-- Thumbnails column -->
                <div class="flex flex-col gap-3 w-20 flex-shrink-0" id="gallery-thumbs">
                  ${images.map((img, idx) => `
                    <button class="thumb-btn w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      idx === activeImageIndex ? 'border-brand-500 ring-2 ring-orange-500/20' : 'border-slate-200 hover:border-slate-300'
                    }" data-index="${idx}">
                      <img 
                        src="${img.imageUrl}" 
                        class="w-full h-full object-cover" 
                        alt="Thumbnail ${idx + 1}" 
                        loading="lazy"
                        onerror="window.ToolRentCacheShield?.handleImageError(this, '${img.imageUrl}', '${tool.categoryName || ''}', '${tool.name.replace(/'/g, "\\'")}')"
                      />
                    </button>
                  `).join('')}
                </div>

                <!-- Main Image Canvas -->
                <div class="relative flex-1 bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm flex items-center justify-center min-h-[440px] group">
                  <img 
                    id="main-product-image" 
                    src="${currentImg}" 
                    class="max-h-[420px] w-full object-contain p-6 transition-all duration-300" 
                    alt="${tool.name}" 
                    onerror="window.ToolRentCacheShield?.handleImageError(this, '${currentImg}', '${tool.categoryName || ''}', '${tool.name.replace(/'/g, "\\'")}')"
                  />
                  
                  <!-- Left/Right navigation arrows -->
                  <button id="btn-prev-photo" class="absolute left-4 w-9 h-9 rounded-full bg-white/90 border border-slate-200 shadow-md flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white transition-all">
                    ${renderIcon('ChevronLeft', 'w-5 h-5')}
                  </button>
                  <button id="btn-next-photo" class="absolute right-4 w-9 h-9 rounded-full bg-white/90 border border-slate-200 shadow-md flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white transition-all">
                    ${renderIcon('ChevronRight', 'w-5 h-5')}
                  </button>

                  <!-- Counter Indicator -->
                  <div class="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg">
                    ${activeImageIndex + 1} / ${images.length}
                  </div>
                </div>

              </div>

              <!-- Specs & Description Two-Column Box -->
              <div class="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  <!-- Left: Especificaciones Table -->
                  <div>
                    <h3 class="text-base font-bold text-slate-900 font-display mb-4">Especificaciones</h3>
                    <div class="divide-y divide-slate-100 text-xs">
                      ${specsList.map(s => `
                        <div class="py-2.5 flex justify-between gap-4">
                          <span class="text-slate-500">${s.specName}</span>
                          <span class="font-semibold text-slate-800 text-right">${s.specValue}</span>
                        </div>
                      `).join('')}
                    </div>
                  </div>

                  <!-- Right: Descripción & Proveedor -->
                  <div class="space-y-6">
                    <div>
                      <h3 class="text-base font-bold text-slate-900 font-display mb-3">Descripción</h3>
                      <p class="text-xs text-slate-600 leading-relaxed">
                        ${tool.description || 'Taladro percutor profesional ideal para trabajos de construcción y remodelación. Ofrece gran potencia y versatilidad para perforar en concreto, metal y madera. Incluye maletín y accesorios.'}
                      </p>
                    </div>

                    <!-- Highlight Features Pills -->
                    <div class="bg-slate-50/70 rounded-xl p-4 border border-slate-100 grid grid-cols-2 gap-3 text-xs">
                      ${highlights.map(h => `
                        <div class="flex items-center gap-2 text-slate-700">
                          <span class="text-brand-600 font-bold">✓</span>
                          <span>${h}</span>
                        </div>
                      `).join('')}
                    </div>

                    <!-- Proveedor Card -->
                    <div>
                      <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Proveedor</h4>
                      <div class="bg-slate-50/60 rounded-xl p-4 border border-slate-200/80 space-y-3">
                        <div class="flex items-center gap-3">
                          <div class="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                            ${(tool.provider?.name || 'CN').substring(0, 2).toUpperCase()}
                          </div>
                          <div class="flex-1">
                            <h5 class="text-xs font-bold text-slate-900">${tool.provider?.name || 'Constructoras del Norte'}</h5>
                            <p class="text-[11px] text-slate-500">Equipos de construcción y maquinaria</p>
                          </div>
                          <div class="text-right text-xs">
                            <div class="font-bold text-amber-500 flex items-center gap-1 justify-end">
                              ★ <span>${tool.provider?.rating || 4.8}</span>
                            </div>
                            <span class="text-[10px] text-slate-400">(${tool.provider?.reviewsCount || 124} reseñas)</span>
                          </div>
                        </div>

                        <a href="#/catalog" class="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-2 rounded-lg text-xs font-semibold flex items-center justify-between px-3 transition-colors shadow-xs">
                          <span>Ver todos sus equipos</span>
                          ${renderIcon('ChevronRight', 'w-4 h-4 text-slate-400')}
                        </a>
                      </div>
                    </div>

                  </div>

                </div>
              </div>

            </div>

            <!-- Right Column: Sticky Booking Card -->
            <div class="lg:sticky lg:top-24 space-y-4">
              
              <div class="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
                
                <!-- Title & Status Badge -->
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <h2 class="text-xl font-bold text-slate-900 font-display">${tool.name}</h2>
                    <p class="text-xs text-slate-400 mt-0.5">${tool.categoryName || 'Herramientas eléctricas'}</p>
                  </div>
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Disponible
                  </span>
                </div>

                <!-- Price Row -->
                <div class="flex items-baseline gap-1.5 pt-1">
                  <span class="text-3xl font-extrabold text-slate-900 font-display tracking-tight">${formatCurrency(dailyPrice)}</span>
                  <span class="text-xs text-slate-400 font-medium">/ día</span>
                </div>

                <!-- Date Range Selector -->
                <div class="space-y-2">
                  <label class="block text-xs font-semibold text-slate-700">Período de alquiler</label>
                  <div class="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 cursor-pointer hover:border-brand-500 transition-colors" id="btn-open-dates-picker">
                    <div class="flex items-center gap-2">
                      ${renderIcon('Calendar', 'w-4 h-4 text-brand-600')}
                      <span class="font-medium">13 oct 2026</span>
                    </div>
                    <span class="text-slate-400">→</span>
                    <div class="flex items-center gap-2">
                      <span class="font-medium">16 oct 2026</span>
                      ${renderIcon('ChevronDown', 'w-3.5 h-3.5 text-slate-400')}
                    </div>
                  </div>
                </div>

                <!-- Cost Calculation Box -->
                <div class="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center justify-between text-xs">
                  <span class="text-slate-500">${daysCount} días × ${formatCurrency(dailyPrice)}</span>
                  <span class="font-bold text-slate-900 text-sm font-display">${formatCurrency(totalAmount)}</span>
                </div>

                <!-- Booking Button -->
                <button id="btn-add-to-rental" class="btn-primary w-full !py-3 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm">
                  ${renderIcon('CalendarCheck', 'w-4 h-4')} Agregar a mi reserva
                </button>

                <!-- Auth / Help Note -->
                <div class="p-3 bg-slate-50/70 rounded-xl border border-slate-100 flex items-center justify-between text-[11px] text-slate-500 cursor-pointer hover:text-slate-800 transition-colors" id="btn-auth-hint">
                  <div class="flex items-center gap-2">
                    ${renderIcon('Info', 'w-4 h-4 text-slate-400 flex-shrink-0')}
                    <span>${auth.isAuthenticated() ? 'Tu sesión está activa y lista para alquilar.' : 'Inicia sesión para reservar este equipo.'}</span>
                  </div>
                  ${renderIcon('ChevronRight', 'w-3.5 h-3.5 text-slate-400')}
                </div>

              </div>

            </div>

          </div>

        </div>
      </div>
    `;

    // Photo thumbnails switcher
    container.querySelectorAll('.thumb-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeImageIndex = parseInt(btn.dataset.index, 10);
        render();
      });
    });

    // Arrow navigation
    container.querySelector('#btn-prev-photo')?.addEventListener('click', () => {
      activeImageIndex = (activeImageIndex - 1 + images.length) % images.length;
      render();
    });
    container.querySelector('#btn-next-photo')?.addEventListener('click', () => {
      activeImageIndex = (activeImageIndex + 1) % images.length;
      render();
    });

    // Dates picker / booking button
    container.querySelector('#btn-add-to-rental')?.addEventListener('click', () => {
      showToast('Herramienta agregada a tu reserva con éxito', 'success', 3000, 'Agregado a tu reserva');
      setTimeout(() => {
        openRentalModal(tool);
      }, 500);
    });

    container.querySelector('#btn-open-dates-picker')?.addEventListener('click', () => {
      openRentalModal(tool);
    });

    container.querySelector('#btn-auth-hint')?.addEventListener('click', () => {
      if (!auth.isAuthenticated()) {
        openAuthModal('login');
      } else {
        openRentalModal(tool);
      }
    });
  }

  render();
}

export default renderProductPageView;
