import api from '../api/client.js';
import auth from '../auth/state.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { renderIcon } from '../utils/icons.js';
import { openRentalModal, openInvoiceViewer } from './rental-modal.js';
import { openAuthModal } from '../components/auth-modal.js';

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

  // 6 Curated Categories with clean, photorealistic studio photography (NO baked-in text!)
  const categoriesList = [
    {
      name: 'Movimiento de tierra',
      count: '12 disponibles',
      query: 'excavadora',
      image: catCleanMovimiento,
      icon: 'Truck'
    },
    {
      name: 'Herramientas eléctricas',
      count: '25 disponibles',
      query: 'eléctrica',
      image: catCleanHerramientas,
      icon: 'Wrench'
    },
    {
      name: 'Construcción y Hormigón',
      count: '18 disponibles',
      query: 'concreto',
      image: catCleanConstruccion,
      icon: 'Grid'
    },
    {
      name: 'Elevación y Andamiaje',
      count: '8 disponibles',
      query: 'elevación',
      image: catCleanElevacion,
      icon: 'Maximize2'
    },
    {
      name: 'Generación de energía',
      count: '6 disponibles',
      query: 'generador',
      image: catCleanEnergia,
      icon: 'Zap'
    },
    {
      name: 'Compactación de suelos',
      count: '7 disponibles',
      query: 'compactadora',
      image: catCleanCompactacion,
      icon: 'Layers'
    }
  ];

  // Fetch real tools and active rentals if authenticated
  let allTools = [];
  let activeRental = null;
  let activeTool = null;
  const isAuth = auth.isAuthenticated();
  const user = auth.getUser();

  try {
    const promises = [
      api.get('/tools').catch(() => [])
    ];

    if (isAuth) {
      const clientId = user.profile?.id || user.id;
      promises.push(api.get(`/rentals/client/${clientId}`).catch(() => []));
    }

    const [toolsData, rentalsData] = await Promise.all(promises);
    allTools = toolsData || [];

    if (isAuth && rentalsData && rentalsData.length > 0) {
      // Find active or latest rental
      activeRental = rentalsData.find(r => r.status === 'CONFIRMED' || r.status === 'ACTIVE' || r.status === 'PENDING') || rentalsData[0];
      if (activeRental && activeRental.items?.[0]) {
        const itemToolId = activeRental.items[0].toolId;
        activeTool = allTools.find(t => String(t.id) === String(itemToolId)) || null;
      }
    }
  } catch (err) {
    console.error('Error fetching home data', err);
  }

  // 4 Featured available tools for Section 05 ("Disponibles ahora")
  const featuredTools = allTools
    .filter(t => t.status === 'AVAILABLE')
    .slice(0, 4);

  // Helper to map fallback images for tools
  function getToolImage(tool) {
    if (tool.images?.[0]?.imageUrl) return tool.images[0].imageUrl;
    const name = (tool.name || '').toLowerCase();
    const cat = (tool.categoryName || '').toLowerCase();
    if (name.includes('excavadora') || cat.includes('tierra')) return catCleanMovimiento;
    if (name.includes('martillo') || name.includes('taladro') || cat.includes('demolición')) return catCleanHerramientas;
    if (name.includes('mezcladora') || name.includes('andamio') || cat.includes('hormigón')) return catCleanConstruccion;
    if (name.includes('plataforma') || name.includes('tijera') || cat.includes('elevación')) return catCleanElevacion;
    if (name.includes('generador') || cat.includes('energía')) return catCleanEnergia;
    if (name.includes('compactadora') || name.includes('canguro') || cat.includes('compactación')) return catCleanCompactacion;
    return catCleanHerramientas;
  }

  container.innerHTML = `
    <div class="min-h-screen bg-[#f8fafc] text-slate-800 pb-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-12 sm:space-y-16">
        
        <!-- ============================================================== -->
        <!-- 02. HERO COMERCIAL CON BUSCADOR DE DISPONIBILIDAD              -->
        <!-- ============================================================== -->
        <section class="relative rounded-3xl bg-white border border-slate-200/90 shadow-sm overflow-hidden animate-fade-in animate-duration-slow">
          <div class="grid grid-cols-1 lg:grid-cols-12 items-center">
            
            <!-- Left Column: Copy & Search Tool -->
            <div class="lg:col-span-7 p-6 sm:p-10 lg:p-12 space-y-5 z-10">
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-[11px] font-extrabold uppercase tracking-widest text-[#FF5A1F]">
                ${renderIcon('ShieldCheck', 'w-3.5 h-3.5')}
                <span>Plataforma Oficial de Alquiler de Maquinaria</span>
              </div>
              
              <h1 class="text-3xl sm:text-4xl lg:text-[42px] font-black text-slate-900 font-display tracking-tight leading-[1.14]">
                El equipo que necesitas, cuando lo necesitas.
              </h1>
              
              <p class="text-sm sm:text-base text-slate-600 font-normal leading-relaxed max-w-xl">
                Alquila maquinaria pesada y herramientas certificadas en toda Colombia. Entrega garantizada en tu obra y contrato 100% digital.
              </p>

              <!-- Embedded Availability Search Tool -->
              <div class="mt-4 bg-[#f8fafc] p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                <div class="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  ${renderIcon('Calendar', 'w-4 h-4 text-[#FF5A1F]')}
                  <span>Consultar Disponibilidad Inmediata</span>
                </div>

                <form id="hero-availability-form" class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <!-- Category (Col-span 5) -->
                  <div class="sm:col-span-5 space-y-1">
                    <label for="hero-search-category" class="block text-xs font-semibold text-slate-600">Tipo de equipo</label>
                    <div class="relative">
                      <select 
                        id="hero-search-category" 
                        class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#FF5A1F] focus:ring-2 focus:ring-[#FF5A1F]/15 transition-all appearance-none cursor-pointer shadow-2xs"
                      >
                        <option value="">Todas las categorías de maquinaria</option>
                        <option value="excavadora">Movimiento de tierra (Excavadoras, Retro)</option>
                        <option value="demolición">Demolición y Perforación (Martillos)</option>
                        <option value="concreto">Hormigón y Concreto (Mezcladoras)</option>
                        <option value="elevación">Elevación y Andamiaje (Plataformas, Torres)</option>
                        <option value="generador">Generación de Energía (Plantas diésel)</option>
                        <option value="compactadora">Compactación de Suelos (Ranas, Placas)</option>
                      </select>
                      <div class="absolute right-3 top-3 pointer-events-none text-slate-400">
                        ${renderIcon('ChevronDown', 'w-3.5 h-3.5')}
                      </div>
                    </div>
                  </div>

                  <!-- Start Date (Col-span 3) -->
                  <div class="sm:col-span-3 space-y-1">
                    <label for="hero-search-start" class="block text-xs font-semibold text-slate-600">Fecha de entrega</label>
                    <input 
                      type="date" 
                      id="hero-search-start" 
                      value="${startFormatted}" 
                      min="${today.toISOString().split('T')[0]}"
                      class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#FF5A1F] focus:ring-2 focus:ring-[#FF5A1F]/15 transition-all shadow-2xs cursor-pointer"
                    />
                  </div>

                  <!-- End Date (Col-span 2) -->
                  <div class="sm:col-span-2 space-y-1">
                    <label for="hero-search-end" class="block text-xs font-semibold text-slate-600">Devolución</label>
                    <input 
                      type="date" 
                      id="hero-search-end" 
                      value="${endFormatted}" 
                      min="${startFormatted}"
                      class="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-[#FF5A1F] focus:ring-2 focus:ring-[#FF5A1F]/15 transition-all shadow-2xs cursor-pointer"
                    />
                  </div>

                  <!-- Submit Dominant CTA (Col-span 2) -->
                  <div class="sm:col-span-2">
                    <button 
                      type="submit" 
                      class="btn-primary w-full !py-2.5 !px-3 text-xs font-bold whitespace-nowrap shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      <span>Ver disponibles</span>
                      <span>&rarr;</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <!-- Right Column: Hero Excavator Imagery -->
            <div class="lg:col-span-5 relative h-64 sm:h-80 lg:h-[460px] flex items-center justify-end overflow-hidden">
              <img 
                src="${heroCatImg}" 
                alt="Excavadoras CAT en ToolRent" 
                class="w-full h-full object-cover object-center lg:object-right select-none pointer-events-none" 
              />
              <div class="hidden lg:block absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none"></div>
            </div>

          </div>
        </section>

        <!-- ============================================================== -->
        <!-- 03. MI ALQUILER ACTIVO (Personalizado según sesión)             -->
        <!-- ============================================================== -->
        ${isAuth && activeRental ? `
          <section class="bg-white rounded-2xl border-2 border-emerald-500/30 p-6 sm:p-7 shadow-sm space-y-4 animate-fade-in">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div class="flex items-center gap-2.5">
                <span class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                <span class="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                  Mi Alquiler en Curso
                </span>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Reserva #${activeRental.id} · ${activeRental.status === 'CONFIRMED' ? 'Confirmado' : (activeRental.status === 'ACTIVE' ? 'En Obra' : 'Procesando')}
                </span>
              </div>
              <div class="text-xs text-slate-500">
                Entrega: <strong class="text-slate-800 font-bold">${formatDate(activeRental.startDate)}</strong> | Devolución: <strong class="text-slate-800 font-bold">${formatDate(activeRental.endDate)}</strong>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <!-- Left Machine Info -->
              <div class="md:col-span-7 flex items-center gap-4">
                <div class="w-20 h-20 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                  <img 
                    src="${activeTool ? getToolImage(activeTool) : catCleanMovimiento}" 
                    alt="${activeTool?.name || 'Equipo alquilado'}" 
                    class="w-full h-full object-cover"
                  />
                </div>
                <div class="space-y-1">
                  <div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    ${activeTool?.brand || 'Caterpillar'} · ${activeTool?.categoryName || 'Maquinaria Pesada'}
                  </div>
                  <h3 class="text-lg font-bold text-slate-900 leading-snug">
                    ${activeTool?.name || activeRental.items?.[0]?.toolName || 'Retroexcavadora Oruga Hidráulica'}
                  </h3>
                  <p class="text-xs text-slate-600">
                    Proveedor asignado: <strong class="text-slate-800">${activeTool?.providerName || 'Equipos y Maquinaria de Colombia'}</strong>
                  </p>
                </div>
              </div>

              <!-- Right Actions & Total -->
              <div class="md:col-span-5 flex flex-wrap items-center justify-start md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                <div class="text-left md:text-right mr-3">
                  <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Liquidado</div>
                  <div class="text-base font-black text-slate-900 font-mono">
                    ${formatCurrency(activeRental.totalPrice || 450000)}
                  </div>
                </div>

                <button 
                  id="btn-active-rental-detail" 
                  type="button" 
                  class="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs active:scale-95 inline-flex items-center gap-1.5"
                >
                  ${renderIcon('FileText', 'w-4 h-4 text-slate-500')}
                  <span>Ver Detalle</span>
                </button>

                <a 
                  href="#/client" 
                  class="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs active:scale-95 inline-flex items-center gap-1.5"
                >
                  <span>Extender o Gestionar</span>
                  <span>&rarr;</span>
                </a>
              </div>
            </div>
          </section>
        ` : (!isAuth ? `
          <!-- Discreet Guest Reservation Prompt -->
          <section class="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-3.5">
              <div class="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center flex-shrink-0 text-[#FF5A1F]">
                ${renderIcon('Clock', 'w-5 h-5')}
              </div>
              <div>
                <h4 class="text-xs sm:text-sm font-bold text-slate-900">¿Ya tienes un alquiler o reserva en curso?</h4>
                <p class="text-xs text-slate-500">Inicia sesión para revisar la fecha de entrega, inspección técnica y comprobante con IVA.</p>
              </div>
            </div>
            <button 
              id="btn-guest-login-bar" 
              type="button" 
              class="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all whitespace-nowrap shadow-2xs active:scale-95"
            >
              Iniciar sesión &rarr;
            </button>
          </section>
        ` : '')}

        <!-- ============================================================== -->
        <!-- 04. EXPLORA POR CATEGORÍA (Imágenes limpias, sin texto doble)   -->
        <!-- ============================================================== -->
        <section class="space-y-5 animate-fade-in">
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-slate-500 font-sans">
                Explora por categoría
              </span>
              <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight mt-1">
                Encuentra la herramienta ideal para tu proyecto.
              </h2>
            </div>

            <a 
              href="#/catalog" 
              class="text-xs sm:text-sm font-bold text-slate-600 hover:text-[#FF5A1F] transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto group"
            >
              <span>Ver todo el catálogo</span>
              <span class="transition-transform group-hover:translate-x-1">&rarr;</span>
            </a>
          </div>

          <!-- 6 Clean Category Cards (Pure photography, single label underneath) -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            ${categoriesList.map(cat => `
              <a 
                href="#/catalog?q=${encodeURIComponent(cat.query)}" 
                class="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-[#FF5A1F]/50 flex flex-col justify-between"
                title="${cat.name} (${cat.count})"
              >
                <!-- Clean High-Resolution Image Canvas without any overlay text -->
                <div class="aspect-[4/3] w-full overflow-hidden bg-slate-100">
                  <img 
                    src="${cat.image}" 
                    alt="${cat.name}" 
                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    loading="lazy"
                  />
                </div>

                <!-- Single Clean Label Below Image -->
                <div class="p-3.5 space-y-0.5">
                  <h3 class="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-[#FF5A1F] transition-colors font-display line-clamp-1">
                    ${cat.name}
                  </h3>
                  <p class="text-[11px] text-slate-500 font-medium">
                    ${cat.count}
                  </p>
                </div>
              </a>
            `).join('')}
          </div>
        </section>

        <!-- ============================================================== -->
        <!-- 05. DISPONIBLES AHORA (4 Equipos Reales con Botón Reservar)    -->
        <!-- ============================================================== -->
        <section class="space-y-5 animate-fade-in">
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-[#FF5A1F] font-sans flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Disponibilidad en tiempo real
              </span>
              <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight mt-1">
                Disponibles para entrega inmediata
              </h2>
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
                          Disponible
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
                      class="btn-featured-reserve btn-primary w-full !py-2.5 !px-3 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
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

          <!-- Discrete Catalog Link -->
          <div class="text-center pt-2">
            <a 
              href="#/catalog" 
              class="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-[#FF5A1F] bg-white border border-slate-200 hover:border-slate-300 px-6 py-3 rounded-xl shadow-2xs transition-all active:scale-95"
            >
              <span>Ver todos los equipos en el catálogo completo</span>
              <span>&rarr;</span>
            </a>
          </div>
        </section>

        <!-- ============================================================== -->
        <!-- 06. CÓMO FUNCIONA (3 Pasos Sencillos y Cierre Visual Discreto)  -->
        <!-- ============================================================== -->
        <section class="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-10 shadow-2xs space-y-8 animate-fade-in">
          <div class="text-center max-w-xl mx-auto space-y-2">
            <span class="text-xs font-bold uppercase tracking-widest text-[#FF5A1F]">
              PROCESO SIMPLE Y TRANSPARENTE
            </span>
            <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight">
              Cómo funciona alquilar en ToolRent
            </h2>
            <p class="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Un flujo 100% digital, seguro y con respaldo técnico de principio a fin.
            </p>
          </div>

          <!-- 3 Steps Grid -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Step 1 -->
            <div class="p-6 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3 relative group hover:border-slate-300 transition-all">
              <div class="w-10 h-10 rounded-xl bg-orange-100 text-[#FF5A1F] flex items-center justify-center font-black text-sm shadow-2xs">
                01
              </div>
              <h3 class="font-bold text-base text-slate-900 font-display">
                Elige tu equipo y fechas
              </h3>
              <p class="text-xs text-slate-600 leading-relaxed">
                Selecciona la maquinaria o herramienta que requiere tu obra. Define los días facturables exactos y consulta disponibilidad garantizada.
              </p>
            </div>

            <!-- Step 2 -->
            <div class="p-6 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3 relative group hover:border-slate-300 transition-all">
              <div class="w-10 h-10 rounded-xl bg-orange-100 text-[#FF5A1F] flex items-center justify-center font-black text-sm shadow-2xs">
                02
              </div>
              <h3 class="font-bold text-base text-slate-900 font-display">
                Reserva online con garantía
              </h3>
              <p class="text-xs text-slate-600 leading-relaxed">
                Desglose transparente: subtotal diario, IVA 19% desglosado y depósito en custodia que se reembolsa automáticamente al devolver el equipo.
              </p>
            </div>

            <!-- Step 3 -->
            <div class="p-6 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3 relative group hover:border-slate-300 transition-all">
              <div class="w-10 h-10 rounded-xl bg-orange-100 text-[#FF5A1F] flex items-center justify-center font-black text-sm shadow-2xs">
                03
              </div>
              <h3 class="font-bold text-base text-slate-900 font-display">
                Entrega en obra y factura DIAN
              </h3>
              <p class="text-xs text-slate-600 leading-relaxed">
                Recibe el equipo revisado y calibrado con acta digital de entrega. Recibe tu factura electrónica oficial válida para contabilidad fiscal.
              </p>
            </div>
          </div>

          <!-- Discrete Bottom Closure -->
          <div class="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
            <div class="text-xs text-slate-500 text-center sm:text-left">
              ¿Tienes dudas o necesitas asesoría técnica para tu proyecto? Nuestro equipo está disponible en línea.
            </div>
            <a 
              href="#/catalog" 
              class="btn-primary !py-2.5 !px-5 text-xs font-bold whitespace-nowrap shadow-xs inline-flex items-center gap-1.5"
            >
              <span>Explorar catálogo completo</span>
              <span>&rarr;</span>
            </a>
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

  // 2. Guest login bar click
  container.querySelector('#btn-guest-login-bar')?.addEventListener('click', () => {
    openAuthModal('login');
  });

  // 3. Active rental detail button
  container.querySelector('#btn-active-rental-detail')?.addEventListener('click', () => {
    if (activeRental) {
      openInvoiceViewer(activeRental);
    }
  });

  // 4. "Reservar ahora" buttons on Section 05
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
