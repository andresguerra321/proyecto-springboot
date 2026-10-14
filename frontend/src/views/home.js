import api from '../api/client.js';
import auth from '../auth/state.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { renderIcon } from '../utils/icons.js';
import { openRentalModal, openInvoiceViewer } from './rental-modal.js';
import { openAuthModal } from '../components/auth-modal.js';

// Assets
import heroCatImg from '../assets/index-hero-cat.png';
import indexCtaBanner from '../assets/index-cta-banner.png';
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
      count: '12 disponibles',
      query: 'excavadora',
      image: catCleanMovimiento,
      icon: 'Truck'
    },
    {
      name: 'Herramientas eléctricas',
      countNum: 25,
      count: '25 disponibles',
      query: 'eléctrica',
      image: catCleanHerramientas,
      icon: 'Wrench'
    },
    {
      name: 'Construcción',
      countNum: 18,
      count: '18 disponibles',
      query: 'concreto',
      image: catCleanConstruccion,
      icon: 'Grid'
    },
    {
      name: 'Elevación',
      countNum: 8,
      count: '8 disponibles',
      query: 'elevación',
      image: catCleanElevacion,
      icon: 'Maximize2'
    },
    {
      name: 'Generación de energía',
      countNum: 6,
      count: '6 disponibles',
      query: 'generador',
      image: catCleanEnergia,
      icon: 'Zap'
    },
    {
      name: 'Compactación de suelos',
      countNum: 7,
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
      // Find active or latest rental (sorted by creation/start date descending)
      const sortedRentals = [...rentalsData].sort((a, b) => new Date(b.createdAt || b.startDate || 0) - new Date(a.createdAt || a.startDate || 0));
      activeRental = sortedRentals.find(r => r.status === 'CONFIRMED' || r.status === 'ACTIVE' || r.status === 'PENDING') || sortedRentals[0];
      if (activeRental && activeRental.items?.[0]) {
        const itemToolId = activeRental.items[0].toolId;
        activeTool = allTools.find(t => String(t.id) === String(itemToolId)) || null;
      }
    }
  } catch (err) {
    console.error('Error fetching home data', err);
  }

  // 4 Featured available tools for Section ("Disponibles para entrega inmediata")
  const featuredTools = allTools
    .filter(t => t.status === 'AVAILABLE')
    .slice(0, 4);

  // Helper to map fallback images for tools, ensuring machinery photos instead of blueprint sketches
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
    <div class="min-h-screen bg-[#f8fafc] text-slate-800 pb-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-10 sm:space-y-12">
        
        <!-- ============================================================== -->
        <!-- 01. HERO PRINCIPAL (Matching img/INDEX.png con buscador)       -->
        <!-- ============================================================== -->
        <section class="relative rounded-3xl bg-white border border-slate-200/90 shadow-sm overflow-hidden">
          <div class="grid grid-cols-1 lg:grid-cols-12 items-center">
            
            <!-- Left Column: Copy & Availability Tool -->
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

              <!-- Embedded Availability Search Tool (Spacious, Zero-overlap layout) -->
              <div class="mt-4 bg-[#f8fafc] p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                <div class="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  ${renderIcon('Calendar', 'w-4 h-4 text-[#FF5A1F]')}
                  <span>Consultar Disponibilidad Inmediata</span>
                </div>

                <form id="hero-availability-form" class="space-y-3">
                  <!-- Row 1: Tipo de equipo (Full width, clear text & icon) -->
                  <div class="space-y-1">
                    <label for="hero-search-category" class="block text-xs font-semibold text-slate-600">Tipo de equipo</label>
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

                  <!-- Row 2: Fechas y Botón CTA (3 columnas equilibradas sin solapamiento) -->
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <!-- Fecha de entrega -->
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

                    <!-- Devolución -->
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

                    <!-- Botón Ver Disponibles -->
                    <div>
                      <button 
                        type="submit" 
                        class="btn-primary w-full !py-2.5 !px-3 text-xs font-bold whitespace-nowrap shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                      >
                        <span>Ver disponibles</span>
                        <span>&rarr;</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              <!-- Quick action links -->
              <div class="flex items-center gap-5 pt-1 text-xs font-semibold">
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
            <div class="lg:col-span-5 relative h-64 sm:h-80 lg:h-[490px] flex items-center justify-end overflow-hidden">
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
        <!-- 02. VALUE PROPOSITIONS BAR (4 Features directas de INDEX.png)   -->
        <!-- ============================================================== -->
        <section class="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 sm:p-8">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-0 sm:divide-x divide-slate-100">
            <!-- Feature 1 -->
            <div class="sm:px-6 first:pl-0 space-y-2">
              <div class="w-9 h-9 rounded-xl bg-orange-50 text-[#FF5A1F] flex items-center justify-center">
                ${renderIcon('ShieldCheck', 'w-5 h-5')}
              </div>
              <h4 class="text-sm font-bold text-slate-900 font-display">Equipos certificados</h4>
              <p class="text-xs text-slate-500 leading-relaxed">Todo nuestro equipo pasa por inspecciones rigurosas de calidad.</p>
            </div>

            <!-- Feature 2 -->
            <div class="sm:px-6 space-y-2">
              <div class="w-9 h-9 rounded-xl bg-orange-50 text-[#FF5A1F] flex items-center justify-center">
                ${renderIcon('Truck', 'w-5 h-5')}
              </div>
              <h4 class="text-sm font-bold text-slate-900 font-display">Entrega a todo el país</h4>
              <p class="text-xs text-slate-500 leading-relaxed">Llevamos lo que necesitas, donde lo necesites en tu obra.</p>
            </div>

            <!-- Feature 3 -->
            <div class="sm:px-6 space-y-2">
              <div class="w-9 h-9 rounded-xl bg-orange-50 text-[#FF5A1F] flex items-center justify-center">
                ${renderIcon('Clock', 'w-5 h-5')}
              </div>
              <h4 class="text-sm font-bold text-slate-900 font-display">Soporte especializado</h4>
              <p class="text-xs text-slate-500 leading-relaxed">Te asesoramos en cada etapa de tu proyecto de construcción.</p>
            </div>

            <!-- Feature 4 -->
            <div class="sm:px-6 last:pr-0 space-y-2">
              <div class="w-9 h-9 rounded-xl bg-orange-50 text-[#FF5A1F] flex items-center justify-center">
                ${renderIcon('Shield', 'w-5 h-5')}
              </div>
              <h4 class="text-sm font-bold text-slate-900 font-display">Pagos seguros</h4>
              <p class="text-xs text-slate-500 leading-relaxed">Transacciones protegidas y facturación electrónica válida.</p>
            </div>
          </div>
        </section>

        <!-- ============================================================== -->
        <!-- 03. MI ALQUILER ACTIVO (Personalizado según sesión)             -->
        <!-- ============================================================== -->
        ${isAuth && activeRental ? `
          <section class="bg-white rounded-2xl border-2 border-emerald-500/30 p-6 sm:p-7 shadow-sm space-y-4">
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
                <div class="w-20 h-20 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 shadow-2xs">
                  <img 
                    src="${activeTool ? getToolImage(activeTool) : catCleanCompactacion}" 
                    alt="${activeTool?.name || 'Equipo alquilado'}" 
                    class="w-full h-full object-cover"
                  />
                </div>
                <div class="space-y-1">
                  <div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                    ${activeTool?.brand || 'Certificado'} · ${activeTool?.categoryName || 'Maquinaria Pesada'}
                  </div>
                  <h3 class="text-lg font-bold text-slate-900 leading-snug">
                    ${activeTool?.name || activeRental.items?.[0]?.toolName || 'Allanadora de Concreto 36" (Helicóptero)'}
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
                    ${formatCurrency(activeRental.totalAmount || activeRental.totalPrice || 450000)}
                  </div>
                </div>

                <button 
                  id="btn-active-rental-detail" 
                  type="button" 
                  class="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs active:scale-95 inline-flex items-center gap-1.5 cursor-pointer"
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
              class="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all whitespace-nowrap shadow-2xs active:scale-95 cursor-pointer"
            >
              Iniciar sesión &rarr;
            </button>
          </section>
        ` : '')}

        <!-- ============================================================== -->
        <!-- 04. NUESTRAS CATEGORÍAS (Matching img/INDEX.png con fotografía) -->
        <!-- ============================================================== -->
        <section class="space-y-5">
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span class="text-xs font-bold uppercase tracking-wider text-slate-400 font-sans">
                NUESTRAS CATEGORÍAS
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

          <!-- 6 Cards matching img/INDEX.png (Aspect 3/4, full photo, bottom overlay, white icon + title + (count)) -->
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

                <!-- Dark Gradient Overlay (from img/INDEX.png) -->
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
        <!-- 05. STATS BANNER (Matching img/INDEX.png)                       -->
        <!-- ============================================================== -->
        <section class="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-10 shadow-2xs">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <!-- Left Side with Orange Bar -->
            <div class="lg:col-span-5 flex items-start gap-4">
              <div class="w-1 h-12 bg-[#FF5A1F] rounded-full flex-shrink-0 mt-0.5"></div>
              <div class="space-y-1">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-400 font-sans">
                  POR QUÉ ELEGIR TOOLRENT
                </span>
                <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight leading-tight">
                  Más que un alquiler, es una solución.
                </h2>
              </div>
            </div>

            <!-- Right Side: 4 Stat Metrics -->
            <div class="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:divide-x divide-slate-100">
              <div class="sm:px-6 first:pl-0 space-y-0.5">
                <div class="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight">+200</div>
                <div class="text-xs text-slate-500 font-medium">Equipos disponibles</div>
              </div>
              <div class="sm:px-6 space-y-0.5">
                <div class="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight">98%</div>
                <div class="text-xs text-slate-500 font-medium">Clientes satisfechos</div>
              </div>
              <div class="sm:px-6 space-y-0.5">
                <div class="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight">+15</div>
                <div class="text-xs text-slate-500 font-medium">Ciudades en Colombia</div>
              </div>
              <div class="sm:px-6 last:pr-0 space-y-0.5">
                <div class="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight">24/7</div>
                <div class="text-xs text-slate-500 font-medium">Soporte técnico</div>
              </div>
            </div>
          </div>
        </section>

        <!-- ============================================================== -->
        <!-- 06. DISPONIBLES AHORA (4 Equipos Reales con Botón Reservar)    -->
        <!-- ============================================================== -->
        <section class="space-y-5">
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
        <!-- 07. CÓMO FUNCIONA (3 Pasos Sencillos)                           -->
        <!-- ============================================================== -->
        <section class="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-10 shadow-2xs space-y-8">
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
        </section>

        <!-- ============================================================== -->
        <!-- 08. BOTTOM CTA BANNER (Matching img/INDEX.png)                  -->
        <!-- ============================================================== -->
        <section class="relative rounded-3xl overflow-hidden shadow-xl border border-slate-900 bg-[#121316]">
          <div class="relative min-h-[240px] sm:min-h-[280px] flex items-center">
            <img 
              src="${indexCtaBanner}" 
              alt="Tu proyecto no se detiene - ToolRent" 
              class="absolute inset-0 w-full h-full object-cover object-right select-none pointer-events-none" 
            />
            <div class="relative z-10 p-8 sm:p-12 max-w-xl space-y-4">
              <div class="flex items-start gap-3.5">
                <div class="w-1 h-12 bg-[#FF5A1F] rounded-full flex-shrink-0 mt-0.5"></div>
                <div class="space-y-1">
                  <span class="text-[11px] font-bold uppercase tracking-widest text-slate-300">
                    LISTO PARA COMENZAR
                  </span>
                  <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white font-display tracking-tight">
                    Tu proyecto no se detiene.
                  </h2>
                </div>
              </div>
              <p class="text-xs sm:text-sm text-slate-300 pl-4 sm:pl-5 leading-relaxed">
                Encuentra el equipo perfecto y empieza hoy mismo.
              </p>
              <div class="pl-4 sm:pl-5 pt-1">
                <a 
                  href="#/catalog" 
                  class="btn-primary !py-3 !px-7 text-xs sm:text-sm font-bold shadow-lg hover:shadow-orange-500/25 active:scale-95 transition-all inline-flex items-center gap-2"
                >
                  <span>Explorar catálogo</span>
                  <span>&rarr;</span>
                </a>
              </div>
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

  // 4. "Reservar ahora" buttons on Section 06
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
