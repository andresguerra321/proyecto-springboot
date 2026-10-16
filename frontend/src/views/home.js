import api from '../api/client.js';
import auth from '../auth/state.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { renderIcon } from '../utils/icons.js';
import { openRentalModal, openRentalInvoiceModal } from './rental-modal.js';
import { openWarrantyExchangeModal, openRefundRequestModal } from './client-dashboard.js';
import { createTwoBlockDatePicker, createDateRangeCalendar } from '../components/date-range-calendar.js';

// Assets
import heroCatImg from '../assets/hero-excavator-hd.jpg';
import catCleanMovimiento from '../assets/cat-clean-movimiento.jpg';
import catCleanHerramientas from '../assets/cat-clean-herramientas.jpg';
import catCleanConstruccion from '../assets/cat-clean-construccion.jpg';
import catCleanElevacion from '../assets/cat-clean-elevacion.jpg';
import catCleanEnergia from '../assets/cat-clean-energia.jpg';
import catCleanCompactacion from '../assets/cat-clean-compactacion.jpg';
import scaffold1 from '../assets/scaffold-1-full.jpg';
import scaffold2 from '../assets/scaffold-2-joint.jpg';

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

  const maxHorizon = new Date(today);
  maxHorizon.setDate(today.getDate() + 45);
  const yrH = maxHorizon.getFullYear();
  const moH = String(maxHorizon.getMonth() + 1).padStart(2, '0');
  const daH = String(maxHorizon.getDate()).padStart(2, '0');
  const maxHorizonFormatted = `${yrH}-${moH}-${daH}`;

  const calcMaxEnd = (sDateStr) => {
    try {
      const parts = sDateStr.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      d.setDate(d.getDate() + 29); // 30 days maximum
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      const standardMax = `${yr}-${mo}-${da}`;
      return standardMax < maxHorizonFormatted ? standardMax : maxHorizonFormatted;
    } catch (_) {
      return maxHorizonFormatted;
    }
  };
  const maxEndFormatted = calcMaxEnd(startFormatted);

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
  // Group / deduplicate physical units by model name so each featured card is a distinct product
  const seenModelKeys = new Set();
  const featuredTools = [];
  for (const tool of allTools) {
    if (tool.status !== 'AVAILABLE') continue;
    const modelKey = (tool.name || '').trim().toLowerCase();
    if (!seenModelKeys.has(modelKey)) {
      seenModelKeys.add(modelKey);
      featuredTools.push(tool);
    }
    if (featuredTools.length >= 4) break;
  }

  // Helper to map fallback images for tools, ensuring machinery photos
  function getToolImage(tool) {
    const rawImg = tool.images?.[0]?.imageUrl || '';
    if (rawImg && 
        !rawImg.includes('photo-1541888946425-d0fbb186f5f8') && 
        !rawImg.includes('photo-1503387762-592deb58ef4e') && 
        !rawImg.includes('photo-1520340356584')) {
      return rawImg;
    }
    const name = (tool.name || '').toLowerCase();
    const cat = (tool.categoryName || tool.category?.name || '').toLowerCase();
    if (name.includes('layher')) return scaffold2;
    if (name.includes('andamio') || name.includes('scaffold') || cat.includes('elevaci')) return scaffold1;
    if (name.includes('excavadora') || cat.includes('tierra') || cat.includes('movimiento')) return catCleanMovimiento;
    if (name.includes('martillo') || name.includes('taladro') || cat.includes('demolición')) return catCleanHerramientas;
    if (name.includes('allanadora') || name.includes('helicóptero') || name.includes('compactadora') || cat.includes('compactación') || name.includes('canguro') || name.includes('apisonador')) return catCleanCompactacion;
    if (name.includes('mezcladora') || cat.includes('hormigón') || cat.includes('construcción')) return catCleanConstruccion;
    if (name.includes('plataforma') || name.includes('tijera')) return catCleanElevacion;
    if (name.includes('generador') || cat.includes('energía') || name.includes('planta')) return catCleanEnergia;
    return scaffold1;
  }

  // Dynamic shipment delivery stepper state based on activeRental.status
  let shippingBadge = 'Activo en obra';
  let shippingBadgeClass = 'text-emerald-600';
  let shippingPulseColor = 'bg-emerald-500';
  let shippingSubtitle = 'Confirmado para entrega';
  let shippingStepText = 'Paso 2 de 4';
  let shippingTitle = 'En proceso de despacho';
  let shippingProgressWidth = '50%';
  let isStep1Active = false, isStep2Active = false, isStep3Active = false, isStep4Active = false;

  if (activeRental) {
    const s = activeRental.status;
    if (s === 'PENDING') {
      shippingBadge = 'Solicitud en revisión';
      shippingBadgeClass = 'text-amber-600';
      shippingPulseColor = 'bg-amber-500';
      shippingSubtitle = 'Pendiente de confirmación por el proveedor';
      shippingStepText = 'Paso 1 de 4';
      shippingTitle = 'Solicitud registrada';
      shippingProgressWidth = '25%';
      isStep1Active = true;
    } else if (s === 'CONFIRMED') {
      shippingBadge = 'Confirmado para entrega';
      shippingBadgeClass = 'text-blue-600';
      shippingPulseColor = 'bg-blue-500';
      shippingSubtitle = 'Preparando despacho en bodega';
      shippingStepText = 'Paso 2 de 4';
      shippingTitle = 'En proceso de despacho';
      shippingProgressWidth = '50%';
      isStep2Active = true;
    } else if (s === 'IN_PROGRESS') {
      shippingBadge = 'Activo en obra';
      shippingBadgeClass = 'text-emerald-600';
      shippingPulseColor = 'bg-emerald-500';
      shippingSubtitle = 'Operando en faena técnica';
      shippingStepText = 'Paso 3 de 4';
      shippingTitle = 'Equipo entregado y activo en obra';
      shippingProgressWidth = '75%';
      isStep3Active = true;
    } else if (s === 'COMPLETED') {
      shippingBadge = 'Alquiler completado';
      shippingBadgeClass = 'text-slate-600';
      shippingPulseColor = 'bg-slate-400';
      shippingSubtitle = 'Retorno a bodega e inspección finalizadas';
      shippingStepText = 'Paso 4 de 4';
      shippingTitle = 'Devolución e inspección finalizadas';
      shippingProgressWidth = '100%';
      isStep4Active = true;
    } else {
      shippingBadge = 'Cancelado';
      shippingBadgeClass = 'text-rose-600';
      shippingPulseColor = 'bg-rose-500';
      shippingSubtitle = 'Contrato finalizado';
      shippingStepText = 'Cancelado';
      shippingTitle = 'Alquiler cancelado';
      shippingProgressWidth = '0%';
    }
  }

  const isUserProvider = auth.isProvider();
  const manageHref = isUserProvider ? '#/provider' : '#/client';

  container.innerHTML = `
    <div class="min-h-screen bg-[#f8fafc] text-slate-800 pb-16">
      
      <!-- ============================================================== -->
      <!-- 1. HERO BANNER FULL-BLEED (Limpio, sin recuadros forzados, palabras clave y fondo integrado) -->
      <!-- ============================================================== -->
      <section class="relative z-20 w-full bg-white border-b border-slate-200/80 overflow-visible min-h-[480px] sm:min-h-[520px] lg:min-h-[560px] flex items-center">
        <!-- Imagen de fondo HD de extremo a extremo: Maquinaria nítida a la derecha, transición con neblina a la izquierda -->
        <div class="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden">
          <img 
            src="${heroCatImg}" 
            alt="Excavadora Caterpillar en obra de construcción" 
            class="w-full h-full object-cover object-[center_right] lg:object-right select-none"
          />
          
          <!-- Capa 1: Fondo blanco extendido para cubrir la costura vertical de la imagen y aislar la excavadora CAT -->
          <div 
            class="absolute inset-0 pointer-events-none sm:hidden" 
            style="background: linear-gradient(to bottom, #ffffff 0%, #ffffff 68%, rgba(255,255,255,0.92) 82%, transparent 100%);"
          ></div>
          <div 
            class="absolute inset-0 pointer-events-none hidden sm:block" 
            style="background: linear-gradient(to right, #ffffff 0%, #ffffff 50%, rgba(255,255,255,0.96) 58%, rgba(255,255,255,0.4) 65%, transparent 70%);"
          ></div>
        </div>

        <!-- Contenedor alineado con el resto de la web: Estructura intuitiva y clean -->
        <div class="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-14">
          <div class="max-w-xl lg:max-w-[580px] space-y-5 sm:space-y-6">
            
            <!-- Kicker sobrio & minimalista con micro-indicador ToolRent -->
            <div class="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-500 uppercase select-none">
              <span class="w-1.5 h-1.5 rounded-full bg-[#ea580c]"></span>
              <span>Renta Industrial en Colombia</span>
            </div>

            <!-- Titular Editorial con escala fluida -->
            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.12] text-slate-900 font-display">
              El equipo que necesitas,<br />
              <span class="text-slate-500 font-medium">cuando lo necesitas.</span>
            </h1>

            <!-- Beneficios clave estilo Apple: sobrio, con separadores sutiles (·) -->
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500 font-medium">
              <span>Entrega garantizada en obra</span>
              <span class="text-slate-300">·</span>
              <span>Contrato 100% digital</span>
              <span class="text-slate-300">·</span>
              <span>Equipos certificados</span>
              <span class="text-slate-300">·</span>
              <span>Disponibilidad inmediata</span>
            </div>

            <!-- Buscador Unificado con Sistema Responsive Eficiente (Sin recuadros anidados) -->
            <form id="hero-availability-form" autocomplete="off" class="bg-white/95 backdrop-blur-md p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 shadow-lg">
              <div class="grid grid-cols-2 lg:grid-cols-12 gap-2 sm:gap-2.5 items-stretch">
                
                <!-- Categoría: full width en móviles/tablets (col-span-2), 4 cols en desktop -->
                <div class="col-span-2 lg:col-span-4 bg-slate-50/90 hover:bg-slate-100/80 rounded-xl px-3 sm:px-3.5 py-2 border border-slate-200/80 transition-colors flex flex-col justify-center">
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

                <!-- Selector de Fechas Unificado con Popover de Calendario Propio (col-span-2 lg:col-span-6) -->
                <div class="col-span-2 lg:col-span-6 relative">
                  <div class="grid grid-cols-2 gap-2">
                    
                    <!-- Fecha Entrega: Click abre el calendario propio en modo ENTREGA -->
                    <div id="box-search-start" class="bg-slate-50/90 hover:bg-orange-50/50 rounded-xl px-2.5 sm:px-3.5 py-2 border border-slate-200/80 hover:border-[#ea580c]/50 transition-colors cursor-pointer group flex flex-col justify-center">
                      <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-[#ea580c]">
                        Entrega
                      </span>
                      <div class="flex items-center justify-between gap-1 mt-0.5">
                        <span id="hero-display-start" class="text-xs font-semibold text-slate-800 group-hover:text-[#ea580c] tabular-nums truncate">
                          ${formatDate(startFormatted)}
                        </span>
                        <span class="text-slate-400 group-hover:text-[#ea580c] flex-shrink-0">
                          ${renderIcon('Calendar', 'w-3.5 h-3.5')}
                        </span>
                      </div>
                      <input type="hidden" id="hero-search-start" name="startDate" value="${startFormatted}" />
                    </div>

                    <!-- Fecha Retorno: Click abre el calendario propio en modo RETORNO (ícono Calendar consistente) -->
                    <div id="box-search-end" class="bg-slate-50/90 hover:bg-orange-50/50 rounded-xl px-2.5 sm:px-3.5 py-2 border border-slate-200/80 hover:border-[#ea580c]/50 transition-colors cursor-pointer group flex flex-col justify-center">
                      <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-[#ea580c]">
                        Retorno
                      </span>
                      <div class="flex items-center justify-between gap-1 mt-0.5">
                        <span id="hero-display-end" class="text-xs font-semibold text-slate-800 group-hover:text-[#ea580c] tabular-nums truncate">
                          ${formatDate(endFormatted)}
                        </span>
                        <span class="text-slate-400 group-hover:text-[#ea580c] flex-shrink-0">
                          ${renderIcon('Calendar', 'w-3.5 h-3.5')}
                        </span>
                      </div>
                      <input type="hidden" id="hero-search-end" name="endDate" value="${endFormatted}" />
                    </div>

                  </div>

                  <!-- Popover 1: Calendario Entrega (alineado al Bloque 1 de Entrega) -->
                  <div id="hero-popover-start" class="hidden absolute left-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-3.5 w-full sm:w-[320px] max-w-[calc(100vw-2rem)] backdrop-blur-md">
                    <div id="hero-calendar-start-mount"></div>
                  </div>

                  <!-- Popover 2: Calendario Retorno (alineado al Bloque 2 de Retorno) -->
                  <div id="hero-popover-end" class="hidden absolute left-0 sm:left-auto sm:right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-3.5 w-full sm:w-[330px] max-w-[calc(100vw-2rem)] backdrop-blur-md">
                    <div id="hero-calendar-end-mount"></div>
                  </div>

                </div>

                <!-- Botón Acción: texto conciso Buscar con whitespace-nowrap para que jamás se parta -->
                <div class="col-span-2 lg:col-span-2 flex items-center">
                  <button 
                    type="submit" 
                    class="w-full h-full min-h-[46px] sm:min-h-[50px] px-5 sm:px-6 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-semibold whitespace-nowrap inline-flex items-center justify-center gap-2 transition-colors shadow-sm active:scale-98 cursor-pointer"
                  >
                    <span>Buscar</span>
                    <span aria-hidden="true">&rarr;</span>
                  </button>
                </div>

              </div>
            </form>

            <!-- Filtros rápidos inferiores neutralizados para respetar la regla del 10% de acentos -->
            <div class="flex flex-wrap items-center gap-2 text-xs pt-0.5">
              <span class="text-slate-400 font-medium mr-1">Filtros rápidos:</span>
              <a href="#/catalog" class="px-3 py-1 rounded-lg bg-slate-100/90 text-slate-700 font-semibold hover:bg-slate-200 hover:text-slate-900 transition-colors">
                Catálogo completo &rarr;
              </a>
              <a href="#/catalog?q=excavadora" class="px-3 py-1 rounded-lg bg-slate-100/80 text-slate-600 font-medium hover:bg-slate-200/80 hover:text-slate-900 transition-colors">
                Maquinaria pesada
              </a>
              <a href="#/catalog?q=concreto" class="px-3 py-1 rounded-lg bg-slate-100/80 text-slate-600 font-medium hover:bg-slate-200/80 hover:text-slate-900 transition-colors">
                Equipos para hormigón
              </a>
            </div>

          </div>
        </div>
      </section>

      <!-- ============================================================== -->
      <!-- SECCIONES PRINCIPALES DENTRO DEL CONTENEDOR CENTRADO           -->
      <!-- ============================================================== -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 space-y-12 sm:space-y-14">

        <!-- ============================================================== -->
        <!-- 2. ALQUILER ACTIVO DEL CLIENTE (Estética Minimalista Ejecutiva) -->
        <!-- ============================================================== -->
        ${isAuth && activeRental ? `
          <section class="group relative bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.08)] transition-all duration-300 p-5 sm:p-7">
            
            <!-- Barra Superior Minimalista con flex-wrap y gap-y-2 para móvil -->
            <div class="flex flex-wrap items-center justify-between gap-y-2 gap-x-4 pb-4 mb-5 border-b border-slate-100">
              <div class="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs">
                <!-- Estado limpio con indicador pulsante orgánico -->
                <span class="inline-flex items-center gap-1.5 font-medium ${shippingBadgeClass}">
                  <span class="w-1.5 h-1.5 rounded-full ${shippingPulseColor} animate-pulse"></span>
                  ${shippingBadge}
                </span>
                <span class="text-slate-300 font-light select-none">/</span>
                <span class="font-mono text-xs font-semibold text-slate-700 tracking-wider">#${activeRental.rentalCode || 'RNT-' + String(activeRental.id).slice(0, 8).toUpperCase()}</span>
                <span class="text-slate-300 font-light select-none hidden sm:inline">/</span>
                <span class="text-slate-400 hidden sm:inline font-normal">${shippingSubtitle}</span>
              </div>

              <!-- Fechas limpias sin cajas de colores innecesarias -->
              <div class="flex items-center gap-2 text-xs text-slate-500 flex-shrink-0">
                <span class="font-normal text-slate-600">${formatDate(activeRental.startDate)} &ndash; ${formatDate(activeRental.endDate)}</span>
                <span class="text-slate-300 font-light select-none">&bull;</span>
                <span class="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">${activeRental.totalDays || 1} días</span>
              </div>
            </div>

            <!-- Cuerpo Principal con Grid Proporcional Multi-Dispositivo -->
            <div class="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-center">
              
              <!-- 1. Producto: Subtítulo neutro en slate-400 para dar protagonismo al título -->
              <div class="md:col-span-7 lg:col-span-5 flex items-center gap-4 sm:gap-5">
                <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-50 border border-slate-200/70 overflow-hidden flex-shrink-0 flex items-center justify-center p-2 shadow-2xs">
                  <img 
                    src="${activeTool ? getToolImage(activeTool) : catCleanCompactacion}" 
                    alt="${activeTool?.name || 'Equipo alquilado'}" 
                    class="w-full h-full object-cover rounded-xl select-none" 
                  />
                </div>
                <div class="min-w-0">
                  <p class="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400 mb-1">
                    ${activeTool?.brand || 'Bosch Professional'} · ${activeTool?.categoryName || 'Maquinaria Pesada'}
                  </p>
                  <h3 class="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate font-display">
                    ${activeTool?.name || activeRental.items?.[0]?.toolName || 'Martillo Demoledor Hexagonal 30kg'}
                  </h3>
                  <p class="text-xs text-slate-500 mt-0.5 truncate">
                    Por <span class="text-slate-800 font-semibold">${activeProvider?.companyName || 'ConstruMaquinaria del Norte S.A.S.'}</span>
                  </p>
                </div>
              </div>

              <!-- 2. Progreso Minimalista: Dinámico según estado real -->
              <div class="md:col-span-12 lg:col-span-4 lg:px-2 order-3 lg:order-2 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">
                <div class="flex items-center justify-between text-xs mb-2">
                  <span class="font-semibold text-slate-900">${shippingTitle}</span>
                  <span class="text-slate-400 font-medium">${shippingStepText}</span>
                </div>
                
                <!-- Barra ultrafina en naranja de marca -->
                <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2.5">
                  <div class="h-full bg-[#ea580c] rounded-full transition-all duration-500" style="width: ${shippingProgressWidth}"></div>
                </div>

                <!-- 4 Pasos simétricos de extremo a extremo con justify-between -->
                <div class="flex items-center justify-between w-full mt-2 text-[10px] sm:text-[11px] select-none">
                  <span class="${isStep1Active ? 'text-[#ea580c] font-bold' : (activeRental?.status === 'CONFIRMED' || activeRental?.status === 'IN_PROGRESS' || activeRental?.status === 'COMPLETED' ? 'text-slate-700 font-medium' : 'text-slate-400')}">Confirmado</span>
                  <span class="${isStep2Active ? 'text-[#ea580c] font-bold' : (activeRental?.status === 'IN_PROGRESS' || activeRental?.status === 'COMPLETED' ? 'text-slate-700 font-medium' : 'text-slate-400')}">Despacho</span>
                  <span class="${isStep3Active ? 'text-[#ea580c] font-bold' : (activeRental?.status === 'COMPLETED' ? 'text-slate-700 font-medium' : 'text-slate-400')}">En obra</span>
                  <span class="${isStep4Active ? 'text-[#ea580c] font-bold' : 'text-slate-400'}">Retorno</span>
                </div>
              </div>

              <!-- 3. Precio y Acciones: items-start sm:items-end text-left sm:text-right con touch-targets de 42px -->
              <div class="md:col-span-5 lg:col-span-3 flex flex-col sm:flex-row md:flex-col items-start sm:items-end justify-between gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 order-2 lg:order-3">
                <div class="text-left sm:text-right">
                  <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total liquidado</p>
                  <p class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight tabular-nums mt-0.5 font-display">
                    ${formatCurrency(activeRental.totalAmount || activeRental.subtotal || 820000)}
                  </p>
                  <p class="text-[10px] text-slate-400 font-medium">IVA y depósito incluidos</p>
                </div>

                <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <button 
                    id="btn-active-rental-invoice" 
                    type="button" 
                    class="flex-1 sm:flex-initial min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer shadow-2xs"
                  >
                    Factura
                  </button>
                  <button 
                    id="btn-active-rental-warranty" 
                    type="button" 
                    class="flex-1 sm:flex-initial min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
                    title="Solicitar cambio de equipo en obra por falla técnica (<24h)"
                  >
                    ${renderIcon('RotateCcw', 'w-3 h-3 text-amber-700')}
                    <span>Garantía / Cambio</span>
                  </button>
                  <button 
                    id="btn-active-rental-refund" 
                    type="button" 
                    class="flex-1 sm:flex-initial min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-900 hover:bg-rose-100 transition-colors cursor-pointer shadow-2xs flex items-center justify-center gap-1.5"
                    title="Solicitar reembolso de días o devolución de custodia de garantía"
                  >
                    ${renderIcon('DollarSign', 'w-3 h-3 text-rose-700')}
                    <span>Reembolso</span>
                  </button>
                  <a 
                    href="${manageHref}" 
                    class="flex-1 sm:flex-initial min-h-[38px] inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors cursor-pointer"
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
                    <a href="#/product/${tool.id}" class="block relative aspect-[4/3] w-full overflow-hidden bg-slate-100 cursor-pointer">
                      <img 
                        src="${toolImg}" 
                        alt="${tool.name}" 
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 select-none"
                        loading="lazy"
                        onerror="this.onerror=null;this.src='${scaffold1}';"
                      />
                      <div class="absolute top-2.5 right-2.5 z-10">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/95 text-emerald-800 shadow-xs backdrop-blur-xs border border-emerald-200/90 select-none">
                          <span class="text-emerald-600 flex items-center justify-center flex-shrink-0">
                            ${renderIcon('BadgeCheck', 'w-3.5 h-3.5')}
                          </span>
                          <span>Disponible hoy</span>
                        </span>
                      </div>
                    </a>

                    <!-- Equipment Details -->
                    <div class="p-4 space-y-2">
                      <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        ${tool.brand || 'Certificado'} · ${tool.categoryName || tool.category?.name || 'Construcción'}
                      </div>
                      
                      <a href="#/product/${tool.id}" class="block group/title">
                        <h3 class="font-bold text-slate-900 text-sm leading-snug line-clamp-2 font-display group-hover/title:text-[#FF5A1F] transition-colors">
                          ${tool.name}
                        </h3>
                      </a>

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

                    <a 
                      href="#/product/${tool.id}" 
                      class="btn-primary w-full !py-2.5 !px-3 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer text-center"
                    >
                      <span>Reservar ahora</span>
                      <span>&rarr;</span>
                    </a>
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

  // 1.5 Interactive Coordinated Two-Block Date Picker for Hero Search
  let heroStartDate = startFormatted;
  let heroEndDate = endFormatted;

  const heroTwoBlockPicker = createTwoBlockDatePicker({
    initialStartDate: heroStartDate,
    initialEndDate: heroEndDate,
    isCatalog: true,
    onChange: ({ startDate: newS, endDate: newE }) => {
      heroStartDate = newS;
      heroEndDate = newE;
      const startHidden = container.querySelector('#hero-search-start');
      const endHidden = container.querySelector('#hero-search-end');
      const startDisplay = container.querySelector('#hero-display-start');
      const endDisplay = container.querySelector('#hero-display-end');

      if (startHidden) startHidden.value = newS;
      if (endHidden) endHidden.value = newE;
      if (startDisplay) startDisplay.textContent = formatDate(newS);
      if (endDisplay) endDisplay.textContent = formatDate(newE);
    }
  });

  const popoverStart = container.querySelector('#hero-popover-start');
  const popoverEnd = container.querySelector('#hero-popover-end');
  const mountStart = container.querySelector('#hero-calendar-start-mount');
  const mountEnd = container.querySelector('#hero-calendar-end-mount');

  if (mountStart) mountStart.appendChild(heroTwoBlockPicker.getStartElement());
  if (mountEnd) mountEnd.appendChild(heroTwoBlockPicker.getEndElement());

  heroTwoBlockPicker.onOpenStart(() => {
    popoverStart?.classList.remove('hidden');
    popoverEnd?.classList.add('hidden');
  });
  heroTwoBlockPicker.onCloseStart(() => {
    popoverStart?.classList.add('hidden');
  });

  heroTwoBlockPicker.onOpenEnd(() => {
    popoverEnd?.classList.remove('hidden');
    popoverStart?.classList.add('hidden');
  });
  heroTwoBlockPicker.onCloseEnd(() => {
    popoverEnd?.classList.add('hidden');
  });

  container.querySelector('#box-search-start')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (heroTwoBlockPicker.isStartOpen()) {
      heroTwoBlockPicker.closeStart();
    } else {
      heroTwoBlockPicker.openStart();
    }
  });

  container.querySelector('#box-search-end')?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (heroTwoBlockPicker.isEndOpen()) {
      heroTwoBlockPicker.closeEnd();
    } else {
      heroTwoBlockPicker.openEnd();
    }
  });

  document.addEventListener('click', (e) => {
    const isInsideStart = popoverStart?.contains(e.target) || container.querySelector('#box-search-start')?.contains(e.target);
    const isInsideEnd = popoverEnd?.contains(e.target) || container.querySelector('#box-search-end')?.contains(e.target);
    if (!isInsideStart && !isInsideEnd) {
      heroTwoBlockPicker.closeAll();
    }
  });

  // 2. Active rental action buttons (Invoice, Warranty replacement, Refund request)
  container.querySelector('#btn-active-rental-invoice')?.addEventListener('click', () => {
    if (activeRental) {
      openRentalInvoiceModal(activeRental.id, activeRental, activeTool);
    }
  });

  container.querySelector('#btn-active-rental-warranty')?.addEventListener('click', () => {
    if (activeRental) {
      openWarrantyExchangeModal(activeRental, activeTool, () => renderHomeView());
    }
  });

  container.querySelector('#btn-active-rental-refund')?.addEventListener('click', () => {
    if (activeRental) {
      openRefundRequestModal(activeRental, activeTool, () => renderHomeView());
    }
  });

  // Section 4 cards and buttons link directly to #/product/:id without pre-selected dates
}
