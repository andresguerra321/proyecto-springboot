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
        <section class="relative bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden min-h-[460px] lg:min-h-[500px] flex items-center">
          <!-- Imagen de fondo que cubre de forma completa todo ese apartado -->
          <div class="absolute inset-0 w-full h-full pointer-events-none select-none">
            <img 
              src="${heroCatImg}" 
              alt="Excavadora Caterpillar en obra" 
              class="w-full h-full object-cover object-[center_right] lg:object-right select-none"
            />
            <!-- Gradiente suave lateral para máxima nitidez y legibilidad de los elementos encima -->
            <div class="absolute inset-0 bg-gradient-to-r from-white via-white/95 via-50% to-transparent pointer-events-none"></div>
          </div>

          <!-- Contenido encima de la imagen -->
          <div class="relative z-10 w-full p-6 sm:p-10 lg:p-12">
            <div class="max-w-2xl space-y-6">
              
              <!-- Kicker con paleta oficial ToolRent -->
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80">
                <span class="w-1.5 h-1.5 rounded-full bg-[#ea580c] animate-pulse"></span>
                <span class="text-[11px] font-bold tracking-wider text-[#ea580c] uppercase">
                  Renta Industrial en Colombia
                </span>
              </div>

              <!-- Titular Editorial con la paleta oficial -->
              <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.08] text-slate-900 font-display">
                El equipo que necesitas,<br />
                <span class="text-slate-500 font-medium">cuando lo necesitas.</span>
              </h1>

              <p class="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                Alquila maquinaria pesada y herramientas certificadas en toda Colombia. Entrega garantizada en obra y contrato 100% digital.
              </p>

              <!-- Buscador Unificado con los recuadros interactivos de calendario -->
              <form id="hero-availability-form" class="bg-white/95 backdrop-blur-md p-2 rounded-2xl border border-slate-200/90 shadow-lg">
                <div class="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                  
                  <!-- Categoría (5 cols) -->
                  <div class="sm:col-span-5 bg-slate-50/90 hover:bg-slate-100/80 rounded-xl px-3.5 py-2 border border-slate-200/80 transition-colors">
                    <label for="hero-search-category" class="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Categoría
                    </label>
                    <select id="hero-search-category" class="w-full mt-0.5 bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer truncate">
                      <option value="">Todas las categorías</option>
                      <option value="excavadora">Movimiento de tierra (Excavadoras, Retro)</option>
                      <option value="demolición">Demolición y Perforación (Martillos)</option>
                      <option value="concreto">Hormigón y Concreto (Mezcladoras)</option>
                      <option value="elevación">Elevación y Andamiaje</option>
                      <option value="generador">Generación de Energía</option>
                      <option value="compactadora">Compactación de Suelos</option>
                    </select>
                  </div>

                  <!-- Fecha Entrega (2.5 cols) - CLICKEABLE EN TODO EL RECUADRO -->
                  <div id="box-search-start" class="sm:col-span-2 bg-slate-50/90 hover:bg-orange-50/60 rounded-xl px-3 py-2 border border-slate-200/80 hover:border-[#ea580c]/50 transition-colors cursor-pointer group">
                    <label for="hero-search-start" class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-[#ea580c] cursor-pointer">
                      Entrega
                    </label>
                    <input 
                      type="date" 
                      id="hero-search-start" 
                      value="${startFormatted}" 
                      min="${today.toISOString().split('T')[0]}" 
                      class="w-full mt-0.5 bg-transparent text-xs font-bold text-slate-800 group-hover:text-[#ea580c] focus:outline-none tabular-nums cursor-pointer" 
                    />
                  </div>

                  <!-- Fecha Devolución (2.5 cols) - CLICKEABLE EN TODO EL RECUADRO -->
                  <div id="box-search-end" class="sm:col-span-2 bg-slate-50/90 hover:bg-orange-50/60 rounded-xl px-3 py-2 border border-slate-200/80 hover:border-[#ea580c]/50 transition-colors cursor-pointer group">
                    <label for="hero-search-end" class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-[#ea580c] cursor-pointer">
                      Retorno
                    </label>
                    <input 
                      type="date" 
                      id="hero-search-end" 
                      value="${endFormatted}" 
                      min="${startFormatted}" 
                      class="w-full mt-0.5 bg-transparent text-xs font-bold text-slate-800 group-hover:text-[#ea580c] focus:outline-none tabular-nums cursor-pointer" 
                    />
                  </div>

                  <!-- Botón Acción (3 cols) - PALETA OFICIAL TOOLRENT -->
                  <div class="sm:col-span-3 h-full">
                    <button 
                      type="submit" 
                      class="w-full h-full min-h-[52px] rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-orange-500/25 active:scale-95 cursor-pointer"
                    >
                      <span>Buscar equipos</span>
                      <span aria-hidden="true">&rarr;</span>
                    </button>
                  </div>

                </div>
              </form>

              <!-- Accesos rápidos inferiores con paleta oficial -->
              <div class="flex flex-wrap items-center gap-2 text-xs pt-1">
                <span class="text-slate-500 font-medium mr-1">Acceso rápido:</span>
                <a href="#/catalog" class="px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200/80 text-[#ea580c] font-bold hover:bg-orange-100 transition-colors shadow-2xs">
                  Catálogo completo &rarr;
                </a>
                <a href="#/catalog?q=excavadora" class="px-3.5 py-1.5 rounded-full bg-white/90 border border-slate-200 text-slate-700 font-medium hover:border-[#ea580c] hover:text-[#ea580c] transition-colors shadow-2xs">
                  Maquinaria pesada
                </a>
                <a href="#/catalog?q=concreto" class="px-3.5 py-1.5 rounded-full bg-white/90 border border-slate-200 text-slate-700 font-medium hover:border-[#ea580c] hover:text-[#ea580c] transition-colors shadow-2xs">
                  Equipos para hormigón
                </a>
              </div>

            </div>
          </div>
        </section>

        <!-- ============================================================== -->
        <!-- ============================================================== -->
        <!-- 2. ALQUILER ACTIVO DEL CLIENTE (Paleta Oficial ToolRent)       -->
        <!-- ============================================================== -->
        ${isAuth && activeRental ? `
          <section class="group relative bg-white rounded-[24px] border border-slate-200/90 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.08)] transition-all duration-300 p-6 sm:p-7">
            
            <!-- Barra Superior Minimalista -->
            <div class="flex flex-wrap items-center justify-between gap-4 pb-5 mb-6 border-b border-slate-100">
              <div class="flex items-center gap-3">
                <!-- Estado único y sobrio -->
                <span class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Activo en obra
                </span>
                <span class="text-slate-300">|</span>
                <span class="font-mono text-xs font-bold text-[#ea580c] bg-orange-50 border border-orange-200/80 px-2.5 py-0.5 rounded-md tracking-wide">${activeRental.rentalCode || 'RNT-' + String(activeRental.id).slice(0, 8).toUpperCase()}</span>
                <span class="text-slate-300 hidden sm:inline">·</span>
                <span class="text-xs text-slate-500 hidden sm:inline">Confirmado para entrega</span>
              </div>

              <!-- Fechas limpias -->
              <div class="flex items-center gap-2 text-xs text-slate-500">
                <span>${formatDate(activeRental.startDate)} – ${formatDate(activeRental.endDate)}</span>
                <span class="px-2.5 py-0.5 rounded-md bg-orange-50 text-[#ea580c] font-bold border border-orange-200/80">${activeRental.totalDays || 1} días</span>
              </div>
            </div>

            <!-- Cuerpo Principal en 3 Columnas Equilibradas -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <!-- 1. Producto (5 columnas) -->
              <div class="lg:col-span-5 flex items-center gap-5">
                <div class="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-200/70 overflow-hidden flex-shrink-0 flex items-center justify-center p-2 shadow-2xs">
                  <img 
                    src="${activeTool ? getToolImage(activeTool) : catCleanCompactacion}" 
                    alt="${activeTool?.name || 'Equipo alquilado'}" 
                    class="w-full h-full object-cover rounded-xl select-none" 
                  />
                </div>
                <div class="min-w-0">
                  <p class="text-[11px] font-bold uppercase tracking-[0.08em] text-[#ea580c] mb-1">
                    ${activeTool?.brand || 'Bosch'} · ${activeTool?.categoryName || 'Maquinaria Pesada'}
                  </p>
                  <h3 class="text-lg font-bold text-slate-900 tracking-tight truncate font-display">
                    ${activeTool?.name || activeRental.items?.[0]?.toolName || 'Martillo Demoledor Hexagonal 30kg'}
                  </h3>
                  <p class="text-xs text-slate-500 mt-1">
                    Por <span class="text-slate-800 font-semibold">${activeProvider?.companyName || 'Maquinaria y Equipos Bogotá S.A.S.'}</span>
                  </p>
                </div>
              </div>

              <!-- 2. Progreso Minimalista con acento oficial (4 columnas) -->
              <div class="lg:col-span-4 lg:px-4">
                <div class="flex items-center justify-between text-xs mb-2.5">
                  <span class="font-bold text-slate-900">En proceso de despacho</span>
                  <span class="text-slate-400 font-medium">Paso 2 de 4</span>
                </div>
                
                <!-- Barra ultrafina en naranja ToolRent -->
                <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                  <div class="h-full bg-[#ea580c] rounded-full transition-all duration-500" style="width: 50%"></div>
                </div>

                <!-- Etiquetas con jerarquía y color de marca -->
                <div class="grid grid-cols-4 text-[11px] text-slate-400">
                  <span class="text-slate-600 font-medium">Confirmado</span>
                  <span class="text-[#ea580c] font-bold">Despacho</span>
                  <span class="text-center">En obra</span>
                  <span class="text-right">Retorno</span>
                </div>
              </div>

              <!-- 3. Precio y Acciones (3 columnas) -->
              <div class="lg:col-span-3 flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-4 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
                <div class="lg:text-right">
                  <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total liquidado</p>
                  <p class="text-2xl font-black text-slate-900 tracking-tight tabular-nums mt-0.5 font-display">
                    ${formatCurrency(activeRental.totalAmount || activeRental.subtotal || 820000)}
                  </p>
                  <p class="text-[11px] text-slate-500 font-medium">IVA y depósito incluidos</p>
                </div>

                <div class="flex items-center gap-2.5 w-full sm:w-auto">
                  <button 
                    id="btn-active-rental-invoice" 
                    type="button" 
                    class="flex-1 sm:flex-initial px-4 py-2 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-orange-50 hover:border-orange-200 hover:text-[#ea580c] transition-colors cursor-pointer shadow-2xs"
                  >
                    Factura
                  </button>
                  <a 
                    href="#/client" 
                    class="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold bg-[#ea580c] hover:bg-[#c2410c] text-white shadow-sm hover:shadow-orange-500/25 transition-all cursor-pointer"
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

  // 1.5 Interactive Date Boxes (clicking anywhere in the box opens calendar)
  const startBox = container.querySelector('#box-search-start');
  const startInput = container.querySelector('#hero-search-start');
  const endBox = container.querySelector('#box-search-end');
  const endInput = container.querySelector('#hero-search-end');

  const triggerPicker = (input) => {
    try {
      if (typeof input?.showPicker === 'function') {
        input.showPicker();
      } else {
        input?.focus();
      }
    } catch (_) {
      input?.focus();
    }
  };

  startBox?.addEventListener('click', (e) => {
    if (e.target !== startInput) triggerPicker(startInput);
  });
  startInput?.addEventListener('click', () => triggerPicker(startInput));

  endBox?.addEventListener('click', (e) => {
    if (e.target !== endInput) triggerPicker(endInput);
  });
  endInput?.addEventListener('click', () => triggerPicker(endInput));

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
