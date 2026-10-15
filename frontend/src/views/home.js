import api from '../api/client.js';
import auth from '../auth/state.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { renderIcon } from '../utils/icons.js';
import { openRentalModal, openRentalInvoiceModal } from './rental-modal.js';

// Assets
import heroCatImg from '../assets/index-hero-cat.png';
import catCleanMovimiento from '../assets/cat-clean-movimiento.jpg';
import catCleanHerramientas from '../assets/cat-clean-herramientas.jpg';
import catCleanConstruccion from '../assets/cat-clean-construccion.jpg';
import catCleanElevacion from '../assets/cat-clean-elevacion.jpg';
import catCleanEnergia from '../assets/cat-clean-energia.jpg';
import catCleanCompactacion from '../assets/cat-clean-compactacion.jpg';

export async function renderHomeView() {
  const container = document.getElementById('app-content');
  if (!container) return;

  // Set default search dates (tomorrow -> +4 days)
  const today = new Date();
  const startDateDefault = new Date(today);
  startDateDefault.setDate(today.getDate() + 1);
  const endDateDefault = new Date(today);
  endDateDefault.setDate(today.getDate() + 4);

  const startFormatted = startDateDefault.toISOString().split('T')[0];
  const endFormatted = endDateDefault.toISOString().split('T')[0];

  // 6 Curated Categories matching img/INDEX.png with crisp photography & counts
  const categoriesList = [
    {
      name: 'Movimiento de tierra',
      countNum: 12,
      query: 'excavadora',
      image: catCleanMovimiento,
      icon: 'Truck'
    },
    {
      name: 'Herramientas eléctricas',
      countNum: 25,
      query: 'eléctrica',
      image: catCleanHerramientas,
      icon: 'Wrench'
    },
    {
      name: 'Construcción',
      countNum: 18,
      query: 'concreto',
      image: catCleanConstruccion,
      icon: 'Grid'
    },
    {
      name: 'Elevación',
      countNum: 8,
      query: 'elevación',
      image: catCleanElevacion,
      icon: 'Maximize2'
    },
    {
      name: 'Generación de energía',
      countNum: 6,
      query: 'generador',
      image: catCleanEnergia,
      icon: 'Zap'
    },
    {
      name: 'Compactación de suelos',
      countNum: 7,
      query: 'compactadora',
      image: catCleanCompactacion,
      icon: 'Layers'
    }
  ];

  // Fetch real tools and active rentals if authenticated
  let allTools = [];
  let activeRental = null;
  let activeTool = null;
  let activeProvider = null;
  const isAuth = auth.isAuthenticated();
  const user = auth.getUser();

  try {
    const promises = [
      api.get('/tools').catch(() => [])
    ];

    if (isAuth) {
      const clientId = user?.profile?.id || user?.id;
      if (clientId) {
        promises.push(api.get(`/rentals/client/${clientId}`).catch(() => []));
      }
    }

    const [toolsData, rentalsData] = await Promise.all(promises);
    allTools = toolsData || [];

    if (isAuth && rentalsData && rentalsData.length > 0) {
      // Find active or latest rental (sorted by creation/start date descending)
      const sortedRentals = [...rentalsData].sort((a, b) => new Date(b.createdAt || b.startDate || 0) - new Date(a.createdAt || a.startDate || 0));
      activeRental = sortedRentals.find(r => r.status === 'CONFIRMED' || r.status === 'ACTIVE' || r.status === 'PENDING') || sortedRentals[0];
      if (activeRental && activeRental.items?.[0]) {
        const itemToolId = activeRental.items[0].toolId;
        activeTool = allTools.find(t => String(t.id) === String(itemToolId)) || null;
        if (activeTool?.providerId) {
          try {
            activeProvider = await api.get(`/providers/${activeTool.providerId}`);
          } catch (_) {}
        }
      }
    }
  } catch (err) {
    console.error('Error fetching home data', err);
  }

  // 4 Featured available tools for Section 4 ("Disponibles para entrega inmediata")
  const featuredTools = allTools
    .filter(t => t.status === 'AVAILABLE')
    .slice(0, 4);

  // Helper to map fallback images for tools, ensuring machinery photos
  function getToolImage(tool) {
    const rawImg = tool.images?.[0]?.imageUrl || '';
    if (rawImg && !rawImg.includes('photo-1503387762-592deb58ef4e') && !rawImg.includes('photo-1520340356584')) {
      return rawImg;
    }
    const name = (tool.name || '').toLowerCase();
    const cat = (tool.categoryName || '').toLowerCase();
    if (name.includes('excavadora') || cat.includes('tierra')) return catCleanMovimiento;
    if (name.includes('martillo') || name.includes('taladro') || cat.includes('demolición')) return catCleanHerramientas;
    if (name.includes('allanadora') || name.includes('helicóptero') || name.includes('compactadora') || cat.includes('compactación')) return catCleanCompactacion;
    if (name.includes('mezcladora') || name.includes('andamio') || cat.includes('hormigón') || cat.includes('construcción')) return catCleanConstruccion;
    if (name.includes('plataforma') || name.includes('tijera') || cat.includes('elevación')) return catCleanElevacion;
    if (name.includes('generador') || cat.includes('energía')) return catCleanEnergia;
    return catCleanCompactacion;
  }

  container.innerHTML = `
    <div class="min-h-screen bg-[#f8fafc] text-slate-800 pb-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-12 sm:space-y-14">
        
        <!-- ============================================================== -->
        <!-- 1. HERO CON BÚSQUEDA POR FECHAS (Matching img/INDEX.png)        -->
        <!-- ============================================================== -->
        <section class="relative rounded-3xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
          <div class="grid grid-cols-1 lg:grid-cols-12 items-center">
            
            <!-- Left Column: Copy & Availability Tool -->
            <div class="lg:col-span-7 p-6 sm:p-10 lg:p-12 space-y-6 z-10">
              
              <div class="space-y-3">
                <h1 class="text-3xl sm:text-4xl lg:text-[44px] font-black text-slate-900 font-display tracking-tight leading-[1.12]">
                  El equipo que necesitas, cuando lo necesitas.
                </h1>
                
                <p class="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-xl">
                  Alquila maquinaria pesada y herramientas certificadas en toda Colombia. Entrega garantizada en tu obra y contrato 100% digital.
                </p>
              </div>

              <!-- Console: Disponibilidad Inmediata -->
              <div class="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5">
                <div class="text-xs font-bold text-slate-800 flex items-center gap-2">
                  ${renderIcon('Calendar', 'w-4 h-4 text-[#FF5A1F]')}
                  <span>Consultar disponibilidad inmediata en obra</span>
                </div>

                <form id="hero-availability-form" class="space-y-3">
                  <!-- Row 1: Tipo de equipo -->
                  <div class="space-y-1">
                    <label for="hero-search-category" class="block text-xs font-semibold text-slate-600">Tipo de maquinaria o herramienta</label>
                    <div class="relative">
                      <select 
                        id="hero-search-category" 
                        class="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#FF5A1F] focus:ring-2 focus:ring-[#FF5A1F]/15 transition-all appearance-none cursor-pointer shadow-2xs pr-10"
                      >
                        <option value="">Todas las categorías de maquinaria</option>
                        <option value="excavadora">Movimiento de tierra (Excavadoras, Retro)</option>
                        <option value="demolición">Demolición y Perforación (Martillos)</option>
                        <option value="concreto">Hormigón y Concreto (Mezcladoras, Allanadoras)</option>
                        <option value="elevación">Elevación y Andamiaje (Plataformas, Torres)</option>
                        <option value="generador">Generación de Energía (Plantas diésel)</option>
                        <option value="compactadora">Compactación de Suelos (Ranas, Placas)</option>
                      </select>
                      <div class="absolute right-3.5 top-3 pointer-events-none text-slate-400">
                        ${renderIcon('ChevronDown', 'w-3.5 h-3.5')}
                      </div>
                    </div>
                  </div>

                  <!-- Row 2: Fechas y Botón CTA -->
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div class="space-y-1">
                      <label for="hero-search-start" class="block text-xs font-semibold text-slate-600">Fecha de entrega</label>
                      <input 
                        type="date" 
                        id="hero-search-start" 
                        value="${startFormatted}" 
                        min="${today.toISOString().split('T')[0]}"
                        class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#FF5A1F] focus:ring-2 focus:ring-[#FF5A1F]/15 transition-all shadow-2xs cursor-pointer"
                      />
                    </div>

                    <div class="space-y-1">
                      <label for="hero-search-end" class="block text-xs font-semibold text-slate-600">Devolución</label>
                      <input 
                        type="date" 
                        id="hero-search-end" 
                        value="${endFormatted}" 
                        min="${startFormatted}"
                        class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#FF5A1F] focus:ring-2 focus:ring-[#FF5A1F]/15 transition-all shadow-2xs cursor-pointer"
                      />
                    </div>

                    <div>
                      <button 
                        type="submit" 
                        class="btn-primary w-full !py-2.5 !px-4 text-xs font-bold whitespace-nowrap shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                      >
                        <span>Ver disponibles</span>
                        <span>&rarr;</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              <!-- Quick action links -->
              <div class="flex flex-wrap items-center gap-4 text-xs font-semibold">
                <a href="#/catalog" class="text-[#FF5A1F] hover:text-[#e04e18] flex items-center gap-1.5 transition-colors">
                  <span>Explorar catálogo completo</span>
                  <span>&rarr;</span>
                </a>
                <span class="text-slate-300">·</span>
                <a href="#/catalog?q=excavadora" class="text-slate-500 hover:text-slate-800 transition-colors">
                  Maquinaria pesada
                </a>
                <span class="text-slate-300">·</span>
                <a href="#/catalog?q=concreto" class="text-slate-500 hover:text-slate-800 transition-colors">
                  Equipos para hormigón
                </a>
              </div>
            </div>

            <!-- Right Column: Hero Excavator Imagery with Gradient Blend -->
            <div class="lg:col-span-5 relative h-64 sm:h-80 lg:h-[500px] flex items-center justify-end overflow-hidden">
              <img 
                src="${heroCatImg}" 
                alt="Excavadoras CAT en ToolRent" 
                class="w-full h-full object-cover object-center lg:object-right select-none pointer-events-none" 
              />
              <div class="hidden lg:block absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none"></div>
            </div>

          </div>
        </section>

        <!-- ============================================================== -->
        <!-- ============================================================== -->
        <!-- 2. ALQUILER ACTIVO DEL CLIENTE (Estética Apple / Linear / Stripe) -->
        <!-- ============================================================== -->
        ${isAuth && activeRental ? `
          <section class="group relative bg-white rounded-[24px] border border-zinc-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.08)] transition-all duration-300 p-6 sm:p-7">
            
            <!-- Barra Superior Minimalista (Sin fondo oscuro) -->
            <div class="flex flex-wrap items-center justify-between gap-4 pb-5 mb-6 border-b border-zinc-100">
              <div class="flex items-center gap-3">
                <!-- Estado único y sobrio -->
                <span class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Activo en obra
                </span>
                <span class="text-zinc-300">|</span>
                <span class="font-mono text-xs text-zinc-400 tracking-wide">${activeRental.rentalCode || 'RNT-' + String(activeRental.id).slice(0, 8).toUpperCase()}</span>
                <span class="text-zinc-300 hidden sm:inline">·</span>
                <span class="text-xs text-zinc-500 hidden sm:inline">Confirmado para entrega</span>
              </div>

              <!-- Fechas limpias sin iconos naranjas -->
              <div class="flex items-center gap-2 text-xs text-zinc-500">
                <span>${formatDate(activeRental.startDate)} – ${formatDate(activeRental.endDate)}</span>
                <span class="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 font-medium">${activeRental.totalDays || 1} días</span>
              </div>
            </div>

            <!-- Cuerpo Principal en 3 Columnas Equilibradas -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <!-- 1. Producto (5 columnas) -->
              <div class="lg:col-span-5 flex items-center gap-5">
                <div class="w-20 h-20 rounded-2xl bg-[#F5F5F7] border border-zinc-200/50 overflow-hidden flex-shrink-0 flex items-center justify-center p-2">
                  <img 
                    src="${activeTool ? getToolImage(activeTool) : catCleanCompactacion}" 
                    alt="${activeTool?.name || 'Equipo alquilado'}" 
                    class="w-full h-full object-cover rounded-xl select-none" 
                  />
                </div>
                <div class="min-w-0">
                  <p class="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-400 mb-1">
                    ${activeTool?.brand || 'Bosch'} · ${activeTool?.categoryName || 'Maquinaria Pesada'}
                  </p>
                  <h3 class="text-lg font-semibold text-[#1D1D1F] tracking-tight truncate">
                    ${activeTool?.name || activeRental.items?.[0]?.toolName || 'Martillo Demoledor Hexagonal 30kg'}
                  </h3>
                  <p class="text-xs text-zinc-500 mt-1">
                    Por <span class="text-zinc-700 font-medium">${activeProvider?.companyName || 'Maquinaria y Equipos Bogotá S.A.S.'}</span>
                  </p>
                </div>
              </div>

              <!-- 2. Progreso Minimalista sin caja envolvente (4 columnas) -->
              <div class="lg:col-span-4 lg:px-4">
                <div class="flex items-center justify-between text-xs mb-2.5">
                  <span class="font-medium text-[#1D1D1F]">En proceso de despacho</span>
                  <span class="text-zinc-400 font-normal">Paso 2 de 4</span>
                </div>
                
                <!-- Barra ultrafina estilo Apple -->
                <div class="w-full h-1 bg-zinc-100 rounded-full overflow-hidden mb-3">
                  <div class="h-full bg-[#1D1D1F] rounded-full transition-all duration-500" style="width: 50%"></div>
                </div>

                <!-- Etiquetas monocromáticas con jerarquía por peso -->
                <div class="grid grid-cols-4 text-[11px] text-zinc-400">
                  <span class="text-zinc-500">Confirmado</span>
                  <span class="text-[#1D1D1F] font-semibold">Despacho</span>
                  <span class="text-center">En obra</span>
                  <span class="text-right">Retorno</span>
                </div>
              </div>

              <!-- 3. Precio y Acciones (3 columnas) -->
              <div class="lg:col-span-3 flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4 border-t lg:border-t-0 pt-4 lg:pt-0 border-zinc-100">
                <div class="lg:text-right">
                  <p class="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Total liquidado</p>
                  <p class="text-2xl font-semibold text-[#1D1D1F] tracking-tight tabular-nums mt-0.5">
                    ${formatCurrency(activeRental.totalAmount || activeRental.subtotal || 820000)}
                  </p>
                  <p class="text-[11px] text-zinc-400">IVA y depósito incluidos</p>
                </div>

                <div class="flex items-center gap-2.5 w-full sm:w-auto">
                  <button 
                    id="btn-active-rental-invoice" 
                    type="button" 
                    class="flex-1 sm:flex-initial px-4 py-2 rounded-full text-xs font-medium bg-[#F5F5F7] text-[#1D1D1F] hover:bg-zinc-200/80 transition-colors cursor-pointer"
                  >
                    Factura
                  </button>
                  <a 
                    href="#/client" 
                    class="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium bg-[#1D1D1F] text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <span>Gestionar</span>
                    <span aria-hidden="true">&rarr;</span>
                  </a>
                </div>
              </div>

            </div>
          </section>
        ` : ''}

        <!-- ============================================================== -->
        <!-- 3. CATEGORÍAS (Matching img/INDEX.png con fotografía)          -->
        <!-- ============================================================== -->
        <section class="space-y-5">
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight">
                Encuentra la herramienta ideal para tu proyecto
              </h2>
              <p class="text-xs sm:text-sm text-slate-500 mt-1">
                Explora maquinaria pesada y herramientas certificadas organizadas por especialidad.
              </p>
            </div>

            <a 
              href="#/catalog" 
              class="text-xs sm:text-sm font-bold text-slate-600 hover:text-[#FF5A1F] transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto group"
            >
              <span>Ver todo el catálogo</span>
              <span class="transition-transform group-hover:translate-x-1">&rarr;</span>
            </a>
          </div>

          <!-- 6 Cards matching img/INDEX.png (Aspect 3/4, photography, dark gradient, icon + title + (count)) -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            ${categoriesList.map(cat => `
              <a 
                href="#/catalog?q=${encodeURIComponent(cat.query)}" 
                class="group rounded-2xl overflow-hidden aspect-[3/4] relative shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block bg-slate-900"
                title="${cat.name} (${cat.countNum})"
              >
                <!-- Clean High-Resolution Photography -->
                <img 
                  src="${cat.image}" 
                  alt="${cat.name}" 
                  class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  loading="lazy"
                />

                <!-- Dark Gradient Overlay -->
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent transition-opacity group-hover:from-slate-950/95"></div>

                <!-- Content at Bottom-Left -->
                <div class="absolute inset-x-0 bottom-0 p-3.5 sm:p-4 space-y-1 z-10">
                  <div class="w-8 h-8 rounded-lg text-white mb-2 flex items-center justify-center">
                    ${renderIcon(cat.icon, 'w-6 h-6 stroke-[1.75]')}
                  </div>
                  <h3 class="text-xs sm:text-sm font-bold text-white group-hover:text-[#FF5A1F] transition-colors font-display leading-tight line-clamp-2">
                    ${cat.name}
                  </h3>
                  <p class="text-[11px] text-slate-300/80 font-medium font-mono">
                    (${cat.countNum})
                  </p>
                </div>
              </a>
            `).join('')}
          </div>
        </section>

        <!-- ============================================================== -->
        <!-- 4. EQUIPOS DISPONIBLES PARA ALQUILAR                          -->
        <!-- ============================================================== -->
        <section class="space-y-5">
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight">
                Disponibles para entrega inmediata
              </h2>
              <p class="text-xs sm:text-sm text-slate-500 mt-1">
                Equipos inspeccionados y listos para despacho hoy mismo a tu obra.
              </p>
            </div>

            <a 
              href="#/catalog" 
              class="text-xs sm:text-sm font-bold text-slate-600 hover:text-[#FF5A1F] transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto group"
            >
              <span>Explorar los +25 equipos</span>
              <span class="transition-transform group-hover:translate-x-1">&rarr;</span>
            </a>
          </div>

          <!-- 4 Featured Equipment Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            ${featuredTools.map(tool => {
              const toolImg = getToolImage(tool);
              return `
                <div class="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group">
                  <div>
                    <!-- Image with Availability Badge -->
                    <div class="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                      <img 
                        src="${toolImg}" 
                        alt="${tool.name}" 
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none"
                        loading="lazy"
                      />
                      <div class="absolute top-3 right-3">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50/95 text-emerald-800 border border-emerald-200/90 shadow-2xs backdrop-blur-xs">
                          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Disponible hoy
                        </span>
                      </div>
                    </div>

                    <!-- Equipment Details -->
                    <div class="p-4 space-y-2">
                      <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        ${tool.brand || 'Certificado'} · ${tool.categoryName || 'Construcción'}
                      </div>
                      
                      <h3 class="font-bold text-slate-900 text-sm leading-snug line-clamp-2 font-display group-hover:text-[#FF5A1F] transition-colors">
                        ${tool.name}
                      </h3>

                      <p class="text-[11px] text-slate-500 flex items-center gap-1 pt-1">
                        ${renderIcon('MapPin', 'w-3 h-3 text-slate-400 flex-shrink-0')}
                        <span class="truncate">Bogotá, D.C. · Cobertura nacional</span>
                      </p>
                    </div>
                  </div>

                  <!-- Footer Price & Dominant CTA Button -->
                  <div class="p-4 pt-3 border-t border-slate-100 space-y-3 bg-slate-50/40">
                    <div class="flex items-baseline justify-between">
                      <span class="text-[11px] text-slate-500 font-medium">Precio por día:</span>
                      <span class="text-base font-black text-slate-900 font-mono">
                        ${formatCurrency(tool.dailyPrice || 50000)} <span class="text-[10px] text-slate-500 font-sans font-normal">/día</span>
                      </span>
                    </div>

                    <button 
                      type="button" 
                      class="btn-featured-reserve btn-primary w-full !py-2.5 !px-3 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer"
                      data-tool-id="${tool.id}"
                    >
                      <span>Reservar ahora</span>
                      <span>&rarr;</span>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </section>

        <!-- ============================================================== -->
        <!-- 5. CÓMO FUNCIONA (Proceso integrado y técnico en 3 fases)      -->
        <!-- ============================================================== -->
        <section class="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-10 shadow-2xs space-y-8">
          <div class="max-w-2xl space-y-2">
            <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight">
              Cómo funciona el alquiler en ToolRent
            </h2>
            <p class="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Un flujo 100% digital, seguro y con respaldo técnico garantizado de principio a fin.
            </p>
          </div>

          <!-- 3 Steps Connected Horizontal Rail -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            
            <!-- Step 1 -->
            <div class="space-y-3 relative">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/80 text-[#FF5A1F] flex items-center justify-center font-bold text-sm shadow-2xs">
                  ${renderIcon('Calendar', 'w-5 h-5')}
                </div>
                <div class="text-xs font-bold text-slate-400 font-mono">Fase 01</div>
              </div>

              <h3 class="font-bold text-base text-slate-900 font-display">
                Elige tu equipo y fechas de obra
              </h3>

              <p class="text-xs text-slate-600 leading-relaxed">
                Selecciona la maquinaria requerida para tu proyecto, define los días hábiles exactos y cotiza con desglose transparente de IVA (19%) en tiempo real.
              </p>
            </div>

            <!-- Step 2 -->
            <div class="space-y-3 relative">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/80 text-[#FF5A1F] flex items-center justify-center font-bold text-sm shadow-2xs">
                  ${renderIcon('ShieldCheck', 'w-5 h-5')}
                </div>
                <div class="text-xs font-bold text-slate-400 font-mono">Fase 02</div>
              </div>

              <h3 class="font-bold text-base text-slate-900 font-display">
                Reserva digital con garantía en custodia
              </h3>

              <p class="text-xs text-slate-600 leading-relaxed">
                Contrato digital 100% en línea. El depósito de garantía queda salvaguardado y se reembolsa automáticamente a tu cuenta al recibir el acta de entrega técnica.
              </p>
            </div>

            <!-- Step 3 -->
            <div class="space-y-3 relative">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/80 text-[#FF5A1F] flex items-center justify-center font-bold text-sm shadow-2xs">
                  ${renderIcon('FileCheck', 'w-5 h-5')}
                </div>
                <div class="text-xs font-bold text-slate-400 font-mono">Fase 03</div>
              </div>

              <h3 class="font-bold text-base text-slate-900 font-display">
                Despacho en obra y factura DIAN
              </h3>

              <p class="text-xs text-slate-600 leading-relaxed">
                Recibe la maquinaria calibrada en tu frente de trabajo y descarga tu factura electrónica oficial con CUFE y código QR válida para contabilidad fiscal.
              </p>
            </div>

          </div>
        </section>

      </div>
    </div>
  `;

  // ==============================================================
  // EVENT LISTENERS & WIRING
  // ==============================================================

  // 1. Availability Search form submit
  const searchForm = container.querySelector('#hero-availability-form');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const catVal = container.querySelector('#hero-search-category')?.value || '';
      const startVal = container.querySelector('#hero-search-start')?.value || '';
      const endVal = container.querySelector('#hero-search-end')?.value || '';

      const params = new URLSearchParams();
      if (catVal) params.set('q', catVal);
      if (startVal) params.set('start', startVal);
      if (endVal) params.set('end', endVal);

      const queryStr = params.toString();
      window.location.hash = queryStr ? `#/catalog?${queryStr}` : '#/catalog';
    });
  }

  // 2. Active rental invoice button (Official DIAN invoice modal)
  container.querySelector('#btn-active-rental-invoice')?.addEventListener('click', () => {
    if (activeRental) {
      openRentalInvoiceModal(activeRental.id, activeRental, activeTool);
    }
  });

  // 3. "Reservar ahora" buttons on Section 4
  container.querySelectorAll('.btn-featured-reserve').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const toolId = btn.getAttribute('data-tool-id');
      const selected = allTools.find(t => String(t.id) === String(toolId));
      if (selected) {
        openRentalModal(selected);
      }
    });
  });
}
