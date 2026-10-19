/**
 * ToolRent - Vista "Sobre Nosotros" (About Us)
 * Réplica de alta fidelidad de la plantilla industrial (#0B2239 Azul Marino / #F97316 Naranja Construcción)
 * 6 Bloques secuenciales:
 *  1. Hero Interno / Cabecera de Sección
 *  2. Bloque de Historia y Propuesta de Valor (Grid asimétrico con imágenes superpuestas)
 *  3. Bloque Dividido de Confianza y Estadísticas (50% Azul Marino con contadores / 50% Foto a sangre)
 *  4. Cómo Funciona Tool Rent (Pasos 01, 02, 03 con números gigantes en marca de agua)
 *  5. Banner de Conversión Bicolor (CTA intermedio con gradiente)
 *  6. Testimonios de Clientes y Proveedores (Client's Feedback)
 */

import api from '../api/client.js';
import auth from '../auth/state.js';
import showToast from '../components/toast.js';
import { openAuthModal } from '../components/auth-modal.js';
import { renderIcon } from '../utils/icons.js';
import { openTechnicalReturnGuideModal, openEmergencySupportModal } from '../utils/client-utilities-modals.js';

export function getAboutHtml(stats = {}) {
  const isAuth = auth.isAuthenticated();
  const isProvider = isAuth && auth.isProvider();

  const bogotaCount = stats.bogotaActiveTools !== undefined ? stats.bogotaActiveTools : 8;
  const rawToolsCount = stats.totalTools !== undefined ? stats.totalTools : 9;
  const rawProvidersCount = stats.totalProviders !== undefined ? stats.totalProviders : 2;
  const rawRentalsCount = stats.totalRentals !== undefined ? stats.totalRentals : 5;

  // Base histórica demostrativa de alto impacto comercial (< 20 suma base comercial)
  const displayRentals = rawRentalsCount < 20 ? 1240 + rawRentalsCount : rawRentalsCount;
  const displayTools = rawToolsCount < 20 ? 320 + rawToolsCount : rawToolsCount;
  const displayProviders = rawProvidersCount < 20 ? 45 + rawProvidersCount : rawProvidersCount;

  return `
  <main id="about-view" class="w-full bg-[#F8FAFC] text-slate-800 antialiased overflow-hidden">
    
    <!-- ==========================================
         BLOQUE 1: HERO INTERNO / CABECERA DE SECCIÓN
         ========================================== -->
    <section class="relative bg-gradient-to-b from-white via-slate-50 to-[#F8FAFC] border-b border-slate-200/80 pt-16 pb-16 lg:pt-22 lg:pb-24">
      <!-- Fondo decorativo técnico sutil (patrón de grilla industrial) -->
      <div class="absolute inset-0 opacity-[0.03] pointer-events-none" style="background-image: radial-gradient(#0B2239 1px, transparent 1px); background-size: 24px 24px;"></div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          <!-- Contenido Hero Izquierda (7 Cols) -->
          <div class="lg:col-span-7 space-y-6 text-left">
            <!-- Etiqueta Superior Naranja -->
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200/90 text-[#F97316] text-xs font-bold uppercase tracking-widest shadow-2xs">
              <span class="w-2 h-2 rounded-full bg-[#F97316] animate-pulse"></span>
              <span>PLATAFORMA LÍDER EN ALQUILER DE MAQUINARIA</span>
            </div>

            <!-- Título Principal Bicolor -->
            <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight text-[#0B2239] leading-[1.1]">
              <span class="inline">Los Más Altos Estándares en</span>
              <span class="text-[#F97316] block mt-1 drop-shadow-xs">EQUIPOS Y HERRAMIENTAS</span>
            </h1>

            <!-- Párrafo Descriptivo -->
            <p class="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
              Digitalizamos y conectamos en tiempo real a proveedores certificados de maquinaria con contratistas, constructoras y profesionales de obra. Alquila con disponibilidad garantizada, contratos transparentes y sin fricción operativa.
            </p>

            <!-- Acciones CTA -->
            <div class="pt-2 flex flex-wrap items-center gap-4">
              <a 
                href="#/catalog" 
                class="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-[#F97316] hover:bg-[#ea580c] text-white font-bold text-sm tracking-wide shadow-lg shadow-orange-500/25 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 cursor-pointer select-none"
              >
                <span>Explorar Catálogo</span>
                <svg class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </a>

              <button 
                id="btn-about-how-it-works" 
                type="button" 
                class="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-white hover:bg-slate-100 text-[#0B2239] border border-slate-300 font-semibold text-sm transition-all duration-200 shadow-2xs cursor-pointer select-none"
              >
                <span>¿Cómo Funciona?</span>
                <svg class="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            <!-- Mini Garantías en Línea -->
            <div class="pt-4 flex flex-wrap items-center gap-6 text-xs font-medium text-slate-500">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-[#F97316]" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                <span>Entrega y Recepción Certificada</span>
              </div>
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-[#F97316]" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                <span>Facturación Electrónica DIAN</span>
              </div>
            </div>
          </div>

          <!-- Hero Media Derecha (5 Cols) -->
          <div class="lg:col-span-5 relative">
            <div class="relative mx-auto max-w-md lg:max-w-none">
              <!-- Elemento decorativo flotante posterior -->
              <div class="absolute -top-6 -right-6 w-72 h-72 bg-orange-400/10 rounded-full blur-3xl pointer-events-none"></div>
              <div class="absolute -bottom-6 -left-6 w-72 h-72 bg-blue-900/10 rounded-full blur-3xl pointer-events-none"></div>

              <!-- Contenedor de Imagen Principal Hero -->
              <div class="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-100">
                <img 
                  src="/images/about-hero-engineer.jpg" 
                  onerror="this.onerror=null; this.src='/hero-excavator-hd.jpg';"
                  alt="Ingeniero en obra inspeccionando equipos de construcción con casco de seguridad"
                  class="w-full h-[420px] sm:h-[480px] object-cover object-center transform hover:scale-105 transition-transform duration-700"
                  loading="eager"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-[#0B2239]/80 via-transparent to-transparent"></div>

                <!-- Tarjeta Flotante en la Base del Hero -->
                <div class="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-white/80 shadow-lg flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <p class="text-xs font-bold text-[#0B2239]">Flota Homologada</p>
                      <p class="text-[11px] text-slate-500">Mantenimiento preventivo al día</p>
                    </div>
                  </div>
                  <span class="text-xs font-bold text-[#F97316] bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">ISO 9001</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>


    <!-- ========================================================
         BLOQUE 2: HISTORIA Y PROPUESTA DE VALOR (Grid Asimétrico 2 Col)
         ======================================================== -->
    <section class="py-12 sm:py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        
        <!-- Columna Izquierda: Composición de Imágenes Superpuestas (5 Cols - Ordenada al final en móvil) -->
        <div class="lg:col-span-5 relative select-none order-last lg:order-first">
          <div class="relative w-full max-w-md mx-auto lg:max-w-none">
            
            <!-- Marco decorativo naranja desplazado detrás (border-2 border-[#F97316]) -->
            <div class="absolute top-0 sm:-top-4 left-0 sm:-left-4 w-4/5 h-4/5 border-2 border-[#F97316] rounded-3xl pointer-events-none -z-0"></div>

            <!-- Imagen Principal Vertical: Operario / Ingeniero en obra -->
            <div class="relative z-10 w-[86%] rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-200">
              <img 
                src="/images/about-worker-site.jpg" 
                onerror="this.onerror=null; this.src='/images/scaffold-1.jpg';"
                alt="Supervisor de obra con planos y casco de seguridad"
                class="w-full h-[400px] sm:h-[480px] object-cover"
              />
            </div>

            <!-- Imagen Secundaria Inferior: Maquinaria y equipos en obra -->
            <div class="absolute -bottom-6 sm:-bottom-8 right-0 sm:-right-4 w-[62%] rounded-2xl overflow-hidden shadow-2xl border-4 border-white z-20 bg-slate-100">
              <img 
                src="/images/concrete-mixer.jpg" 
                onerror="this.onerror=null; this.src='/images/scaffold-2.jpg';"
                alt="Mezcladora de concreto industrial y herramientas activas en obra"
                class="w-full h-[180px] sm:h-[220px] object-cover"
              />
            </div>

            <!-- Badge Flotante Azul Marino: 100% Verificado -->
            <div class="absolute top-6 sm:top-8 right-2 sm:right-4 bg-[#0B2239] text-white px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl shadow-xl flex items-center gap-2.5 sm:gap-3 z-30 border border-slate-700/80 backdrop-blur-md">
              <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#F97316] text-white flex items-center justify-center font-bold shadow-xs">
                <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p class="text-xs font-black tracking-tight text-white font-display">100% Verificado</p>
                <p class="text-[10px] text-slate-300 font-medium">Equipos y Proveedores</p>
              </div>
            </div>

          </div>
        </div>

        <!-- Columna Derecha: Contenido y Grid 2x2 de Pilares (7 Cols - Ordenada primero en móvil) -->
        <div class="lg:col-span-7 space-y-7 order-first lg:order-last">
          
          <div class="space-y-3">
            <span class="text-xs font-bold text-[#F97316] uppercase tracking-widest block font-display">
              SOBRE NUESTRA PLATAFORMA
            </span>
            <h2 class="text-3xl sm:text-4xl font-black text-[#0B2239] font-display tracking-tight leading-tight">
              Soluciones para <span class="text-[#F97316]">Contratistas, Obras y Proveedores!</span>
            </h2>
            <p class="text-slate-600 leading-relaxed text-sm sm:text-base">
              Nacimos para transformar la industria de la construcción en Colombia y Latinoamérica. Eliminamos los trámites burocráticos y la incertidumbre en disponibilidad de equipos pesados y livianos, facilitando una infraestructura digital segura de principio a fin.
            </p>
          </div>

          <!-- Grid 2x2 de Pilares (Cajas blancas con borde e ícono naranja) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            
            <!-- Pilar 1 -->
            <div class="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-orange-300 hover:shadow-card transition-all duration-200 flex items-start gap-4 group">
              <div class="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#F97316] flex-shrink-0 group-hover:bg-[#F97316] group-hover:text-white transition-colors duration-200">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 class="text-sm font-bold text-[#0B2239] group-hover:text-[#F97316] transition-colors">Stock en Tiempo Real</h3>
                <p class="text-xs text-slate-500 mt-1 leading-snug">Disponibilidad en calendario dinámico para reservar sin duplicidades.</p>
              </div>
            </div>

            <!-- Pilar 2 -->
            <div class="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-orange-300 hover:shadow-card transition-all duration-200 flex items-start gap-4 group">
              <div class="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#F97316] flex-shrink-0 group-hover:bg-[#F97316] group-hover:text-white transition-colors duration-200">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 class="text-sm font-bold text-[#0B2239] group-hover:text-[#F97316] transition-colors">Proveedores Verificados</h3>
                <p class="text-xs text-slate-500 mt-1 leading-snug">Auditoría documental y técnica estricta antes de activar cualquier equipo.</p>
              </div>
            </div>

            <!-- Pilar 3 -->
            <div class="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-orange-300 hover:shadow-card transition-all duration-200 flex items-start gap-4 group">
              <div class="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#F97316] flex-shrink-0 group-hover:bg-[#F97316] group-hover:text-white transition-colors duration-200">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 class="text-sm font-bold text-[#0B2239] group-hover:text-[#F97316] transition-colors">Pagos y Factura Digital</h3>
                <p class="text-xs text-slate-500 mt-1 leading-snug">Pasarela de pago segura y generación automática de factura electrónica.</p>
              </div>
            </div>

            <!-- Pilar 4 -->
            <div class="bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-2xs hover:border-orange-300 hover:shadow-card transition-all duration-200 flex items-start gap-4 group">
              <div class="w-11 h-11 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#F97316] flex-shrink-0 group-hover:bg-[#F97316] group-hover:text-white transition-colors duration-200">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h3 class="text-sm font-bold text-[#0B2239] group-hover:text-[#F97316] transition-colors">Control de Devoluciones</h3>
                <p class="text-xs text-slate-500 mt-1 leading-snug">Acta de entrega y retorno con registro fotográfico para total transparencia.</p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>


    <!-- =========================================================================
         BLOQUE 3: BLOQUE DIVIDIDO DE CONFIANZA Y ESTADÍSTICAS (50% Azul / 50% Foto)
         ========================================================================= -->
    <section id="stats-counter-section" class="py-12 lg:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="rounded-3xl overflow-hidden shadow-2xl border border-slate-800/10 grid grid-cols-1 lg:grid-cols-2">
        
        <!-- Mitad Izquierda: Fondo Azul Marino (#0B2239) con Texto y 3 Contadores -->
        <div class="bg-[#0B2239] text-white p-8 sm:p-12 lg:p-14 flex flex-col justify-between space-y-8 relative">
          <!-- Brillo de fondo sutil -->
          <div class="absolute -top-24 -left-24 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div class="space-y-6 relative z-10">
            <!-- Etiqueta Naranja -->
            <span class="inline-block px-3 py-1 rounded-md bg-[#F97316]/20 border border-[#F97316]/30 text-[#F97316] text-xs font-extrabold uppercase tracking-widest font-display">
              IMPACTO DE LA PLATAFORMA
            </span>

            <!-- Título Principal -->
            <h2 class="text-3xl sm:text-4xl font-extrabold text-white font-display tracking-tight leading-snug">
              Por qué somos la plataforma preferida del sector
            </h2>

            <p class="text-slate-300 text-sm sm:text-base leading-relaxed">
              Optimizamos los costos de capital en obra permitiendo que constructoras y maestros independientes paguen únicamente por los días exactos de uso, eliminando bodegajes y depreciaciones.
            </p>

            <!-- Lista en 2 Columnas con Checks Naranjas -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div class="flex items-center gap-2.5">
                <div class="w-5 h-5 rounded-full bg-[#F97316] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span class="text-xs sm:text-sm font-medium text-slate-200">Disponibilidad garantizada</span>
              </div>

              <div class="flex items-center gap-2.5">
                <div class="w-5 h-5 rounded-full bg-[#F97316] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span class="text-xs sm:text-sm font-medium text-slate-200">Cero costos de mantenimiento</span>
              </div>

              <div class="flex items-center gap-2.5">
                <div class="w-5 h-5 rounded-full bg-[#F97316] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span class="text-xs sm:text-sm font-medium text-slate-200">Facturación inmediata</span>
              </div>

              <div class="flex items-center gap-2.5">
                <div class="w-5 h-5 rounded-full bg-[#F97316] text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span class="text-xs sm:text-sm font-medium text-slate-200">Soporte ante incidencias</span>
              </div>
            </div>
          </div>

          <!-- 3 Cajas de Contadores Inferiores -->
          <div class="grid grid-cols-3 gap-3 sm:gap-4 pt-6 border-t border-white/10 relative z-10">
            
            <!-- Caja 1: Alquileres -->
            <div class="bg-white/10 backdrop-blur-sm p-3.5 sm:p-4 rounded-2xl border border-white/15 text-center transition-transform hover:-translate-y-1">
              <span class="text-2xl sm:text-3xl lg:text-4xl font-black text-white font-display block tracking-tight">
                +<span id="stat-alquileres" data-target="${displayRentals}" data-real-count="${rawRentalsCount}">${displayRentals.toLocaleString('es-CO')}</span>
              </span>
              <span class="text-[11px] sm:text-xs text-slate-300 font-medium block mt-1 leading-tight">
                Alquileres Exitosos
              </span>
            </div>

            <!-- Caja 2: Herramientas / Equipos -->
            <div class="bg-white/10 backdrop-blur-sm p-3.5 sm:p-4 rounded-2xl border border-white/15 text-center transition-transform hover:-translate-y-1">
              <span class="text-2xl sm:text-3xl lg:text-4xl font-black text-white font-display block tracking-tight">
                +<span id="stat-herramientas" data-target="${displayTools}" data-real-count="${rawToolsCount}">${displayTools.toLocaleString('es-CO')}</span>
              </span>
              <span class="text-[11px] sm:text-xs text-slate-300 font-medium block mt-1 leading-tight">
                Equipos Activos
              </span>
            </div>

            <!-- Caja 3: Proveedores -->
            <div class="bg-white/10 backdrop-blur-sm p-3.5 sm:p-4 rounded-2xl border border-white/15 text-center transition-transform hover:-translate-y-1">
              <span class="text-2xl sm:text-3xl lg:text-4xl font-black text-white font-display block tracking-tight">
                +<span id="stat-proveedores" data-target="${displayProviders}" data-real-count="${rawProvidersCount}">${displayProviders.toLocaleString('es-CO')}</span>
              </span>
              <span class="text-[11px] sm:text-xs text-slate-300 font-medium block mt-1 leading-tight">
                Proveedores Aliados
              </span>
            </div>

          </div>

        </div>

        <!-- Mitad Derecha: Fotografía a Sangre Completa en Obra -->
        <div class="relative min-h-[360px] lg:min-h-full w-full h-full bg-slate-900">
          <img 
            src="/hero-excavator-hd.jpg" 
            onerror="this.onerror=null; this.src='/banner-web.png';"
            alt="Ingenieros y contratistas revisando planos y equipos pesados en obra de construcción"
            class="w-full h-full object-cover object-center absolute inset-0"
            loading="lazy"
          />
          <div class="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#0B2239] via-transparent to-transparent opacity-60"></div>
          
          <!-- Badge visual flotante sobre la foto con ciudades reales en DB -->
          <div class="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white shadow-lg hidden sm:flex items-center gap-2.5">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span class="text-xs font-bold text-slate-800">Operaciones activas en Bogotá D.C. y Medellín</span>
          </div>
        </div>

      </div>
    </section>


    <!-- =========================================================================
         BLOQUE 4: CÓMO FUNCIONA NUESTRA WEB (Flujo Interactivo Dual: Cliente y Proveedor)
         ========================================================================= -->
    <section id="how-it-works-section" class="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-24">
      
      <!-- Cabecera Centrada -->
      <div class="text-center max-w-3xl mx-auto mb-10 sm:mb-14 space-y-3">
        <span class="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-orange-100/90 text-[#ea580c] text-xs font-black uppercase tracking-widest font-display">
          ${renderIcon('Workflow', 'w-3.5 h-3.5 text-[#ea580c]')}
          Flujo Técnico y Contractual en 4 Fases
        </span>
        <h2 class="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0B2239] font-display tracking-tight">
          Cómo Funciona ToolRent
        </h2>
        <p class="text-slate-600 text-sm sm:text-base leading-relaxed">
          De la selección digital de maquinaria al acta técnica de devolución en obra. Conoce el paso a paso diseñado para eliminar tiempos muertos y proteger tus recursos financieros.
        </p>

        <!-- Selector de Perspectiva (Tabs Interactivas: Cliente vs Proveedor) -->
        <div class="pt-4 flex justify-center">
          <div class="inline-flex p-1.5 bg-slate-200/80 backdrop-blur-md rounded-2xl border border-slate-300/80 shadow-inner">
            <button 
              id="tab-how-client" 
              type="button" 
              class="how-it-works-tab-btn px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer bg-white text-[#0B2239] shadow-sm"
              data-role="client"
            >
              ${renderIcon('HardHat', 'w-4 h-4 text-[#ea580c]')}
              <span>Para Contratistas y Obras</span>
            </button>
            <button 
              id="tab-how-provider" 
              type="button" 
              class="how-it-works-tab-btn px-5 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-900"
              data-role="provider"
            >
              ${renderIcon('Building2', 'w-4 h-4 text-slate-400')}
              <span>Para Dueños de Maquinaria</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Contenedor Principal de Pasos Dinámicos -->
      <div id="how-it-works-content-mount" class="space-y-8">
        <!-- Rendered dynamically by script (Client by default) -->
      </div>

      <!-- Línea de Confianza y Garantías Institucionales -->
      <div class="mt-10 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-center lg:justify-between gap-4 text-xs text-slate-600">
        <div class="flex items-center gap-2.5 font-medium">
          <div class="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            ${renderIcon('ShieldCheck', 'w-3.5 h-3.5')}
          </div>
          <span><strong class="text-slate-800">Custodia Escrow:</strong> Fondos retenidos hasta entrega conforme.</span>
        </div>
        <div class="flex items-center gap-2.5 font-medium">
          <div class="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100">
            ${renderIcon('FileCheck', 'w-3.5 h-3.5')}
          </div>
          <span><strong class="text-slate-800">Facturación DIAN:</strong> Válida para deducción contable.</span>
        </div>
        <div class="flex items-center gap-2.5 font-medium">
          <div class="w-6 h-6 rounded-lg bg-orange-50 text-[#ea580c] flex items-center justify-center flex-shrink-0 border border-orange-100">
            ${renderIcon('RotateCcw', 'w-3.5 h-3.5')}
          </div>
          <span><strong class="text-slate-800">Garantía en Faena:</strong> Sustitución técnica en &lt;24h.</span>
        </div>
      </div>

      <!-- Bloque de Acción Principal y Enlaces de Asistencia (CTA Destacado y Espacioso) -->
      <div class="mt-4 p-6 sm:p-8 bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-6">
        <div class="space-y-1 text-center lg:text-left">
          <h4 class="text-base sm:text-lg font-black text-[#0B2239] font-display">
            ¿Listo para poner en marcha tu proyecto u obra?
          </h4>
          <p class="text-xs sm:text-sm text-slate-500">
            Reserva maquinaria verificada con despacho directo y respaldo contractual 100% legal.
          </p>
        </div>

        <div class="flex flex-wrap items-center justify-center gap-3 w-full lg:w-auto">
          <button 
            id="btn-about-return-protocol" 
            type="button" 
            class="px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs hover:border-slate-300"
          >
            ${renderIcon('ClipboardCheck', 'w-4 h-4 text-slate-500')}
            <span>Protocolo de Devolución</span>
          </button>
          <button 
            id="btn-about-emergency-support" 
            type="button" 
            class="px-4 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs hover:border-slate-300"
          >
            ${renderIcon('Wrench', 'w-4 h-4 text-slate-500')}
            <span>Soporte en Terreno</span>
          </button>
          <a 
            href="#/catalog" 
            class="px-7 py-3.5 rounded-xl bg-[#F97316] hover:bg-[#ea580c] text-white text-sm font-black flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-orange-500/25 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer whitespace-nowrap"
          >
            <span>Explorar Catálogo</span>
            <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>
    </section>


    <!-- =========================================================================
         BLOQUE 5: BANNER DE CONVERSIÓN BICOLOR (CTA Intermedio Gradiente)
         ========================================================================= -->
    <section class="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="relative bg-gradient-to-r from-[#0B2239] via-[#1E3A5F] to-[#F97316] rounded-3xl p-8 sm:p-10 lg:p-12 text-white shadow-2xl overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
        
        <!-- Fondo decorativo técnico -->
        <div class="absolute inset-0 opacity-10 pointer-events-none" style="background-image: repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 20px);"></div>
        <div class="absolute -right-10 -bottom-10 w-64 h-64 bg-orange-400/20 rounded-full blur-2xl pointer-events-none"></div>

        <!-- Texto Izquierda -->
        <div class="space-y-2 relative z-10 text-center md:text-left max-w-2xl">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-orange-200 text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>Alianza con Propietarios de Maquinaria</span>
          </span>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight leading-snug">
            ¿Tienes maquinaria o herramientas paradas?
          </h2>
          <p class="text-slate-200 text-sm sm:text-base leading-relaxed">
            Conviértete en Proveedor en Tool Rent. Rentabiliza tu inventario con cobros garantizados, pólizas de respaldo y clientes verificados en todo el país.
          </p>
        </div>

        <!-- Botón Derecha -->
        <div class="relative z-10 flex-shrink-0">
          <button 
            id="btn-about-provider-register" 
            type="button"
            class="px-8 py-4 rounded-full bg-white text-[#0B2239] hover:bg-orange-50 hover:text-[#F97316] font-extrabold text-sm tracking-wide shadow-xl transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 cursor-pointer flex items-center gap-2 group whitespace-nowrap"
          >
            <span>${isProvider ? 'Ir a mi Panel de Proveedor' : (isAuth ? 'Gestionar Equipos' : 'Registrarme como Proveedor')}</span>
            <svg class="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>

      </div>
    </section>


    <!-- =========================================================================
         BLOQUE 6: TESTIMONIOS DE CLIENTES Y PROVEEDORES (Client's Feedback)
         ========================================================================= -->
    <section class="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <!-- Cabecera de Testimonios -->
      <div class="text-center max-w-2xl mx-auto mb-14 space-y-3">
        <span class="text-xs font-extrabold text-[#F97316] uppercase tracking-widest font-display block">
          CASOS DE ÉXITO Y CONFIANZA
        </span>
        <h2 class="text-3xl sm:text-4xl font-black text-[#0B2239] font-display tracking-tight">
          Experiencias Reales en Obra
        </h2>
        <p class="text-slate-600 text-sm sm:text-base">
          Lo que dicen contratistas y empresas aliadas que operan a diario en nuestra plataforma.
        </p>
      </div>

      <!-- Grid de 2 Tarjetas Limpias con Clientes y Proveedores Reales de la Base de Datos -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        
        <!-- Tarjeta 1: Rol Cliente (Carlos Alberto Gómez Peña - cliente_carlos_gomez en DB) -->
        <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all duration-300 relative flex flex-col justify-between group">
          <!-- Comilla grande en naranja claro en el fondo -->
          <div class="absolute top-4 right-8 text-7xl font-serif text-[#F97316]/20 select-none pointer-events-none leading-none">
            &ldquo;
          </div>

          <div class="space-y-3 relative z-10">
            <!-- Calificación 5 Estrellas -->
            <div class="flex items-center gap-1 text-[#F97316]">
              ${[1, 2, 3, 4, 5].map(() => `
                <svg class="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              `).join('')}
            </div>

            <p class="text-sm sm:text-base text-slate-700 leading-relaxed font-normal italic">
              "Para nuestras obras en Bogotá gestionamos el alquiler de andamios certificados Layher Allround a través de Tool Rent (código de alquiler RNT-8192295D). La verificación de disponibilidad en el calendario y el acta digital de entrega nos garantizaron seguridad total sin tiempos muertos."
            </p>
          </div>

          <!-- Bloque Visual de Evidencia del Cliente -->
          <div class="my-5 p-4 rounded-xl bg-slate-50 border border-slate-200/80 relative z-10 shadow-2xs">
            <div class="grid grid-cols-3 divide-x divide-slate-200 text-center">
              <div class="px-2">
                <div class="text-base sm:text-lg font-bold text-[#0B2239] leading-tight">100%</div>
                <div class="text-[11px] text-slate-500 font-medium mt-0.5 leading-tight">Disponibilidad en web</div>
              </div>
              <div class="px-2">
                <div class="text-base sm:text-lg font-bold text-emerald-600 leading-tight">0 hrs</div>
                <div class="text-[11px] text-slate-500 font-medium mt-0.5 leading-tight">Tiempos muertos</div>
              </div>
              <div class="px-2">
                <div class="text-base sm:text-lg font-bold text-[#F97316] leading-tight">RNT-8192</div>
                <div class="text-[11px] text-slate-500 font-medium mt-0.5 leading-tight">Alquiler trazable</div>
              </div>
            </div>

            <div class="border-t border-slate-200/60 pt-3 mt-3 flex flex-wrap items-center justify-between gap-2">
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-md font-medium shadow-2xs">
                  <svg class="w-3.5 h-3.5 text-[#F97316]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  <span>Andamio Layher Allround</span>
                </span>
                <span class="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-md font-medium shadow-2xs">
                  <svg class="w-3.5 h-3.5 text-[#F97316]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <span>Acta Digital Firmada</span>
                </span>
              </div>
              <div class="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
                <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>Obra Bogotá D.C.</span>
              </div>
            </div>
          </div>

          <!-- Autor / Avatar Real de BD -->
          <div class="pt-4 mt-1 border-t border-slate-100 flex items-center gap-3.5 sm:gap-4 relative z-10">
            <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-[#F97316] shadow-sm bg-slate-100">
              <img 
                src="/images/about-client-carlos.jpg" 
                onerror="this.onerror=null; this.src='/images/about-hero-engineer.jpg';"
                alt="Foto de perfil de Carlos Alberto Gómez Peña"
                class="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            <div class="min-w-0 flex-1">
              <h4 class="text-sm sm:text-base font-bold text-[#0B2239] leading-tight">Carlos Alberto Gómez Peña</h4>
              <p class="text-xs sm:text-sm text-[#F97316] font-semibold mt-0.5">Cliente Verificado — Bogotá D.C.</p>
              <span class="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium mt-1">
                <svg class="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                <span>3 Alquileres Confirmados</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Tarjeta 2: Rol Proveedor (Maquinaria y Equipos Bogotá S.A.S. - prov_maquinaria_bog en DB) -->
        <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all duration-300 relative flex flex-col justify-between group">
          <!-- Comilla grande en naranja claro en el fondo -->
          <div class="absolute top-4 right-8 text-7xl font-serif text-[#F97316]/20 select-none pointer-events-none leading-none">
            &ldquo;
          </div>

          <div class="space-y-3 relative z-10">
            <!-- Calificación 5 Estrellas -->
            <div class="flex items-center gap-1 text-[#F97316]">
              ${[1, 2, 3, 4, 5].map(() => `
                <svg class="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              `).join('')}
            </div>

            <p class="text-sm sm:text-base text-slate-700 leading-relaxed font-normal italic">
              "Como empresa proveedora de maquinaria en Bogotá, teníamos andamios multidireccionales y mezcladoras Cipsa en bodega esperando clientes. Al publicarlas en Tool Rent alcanzamos rotación continua con contratos blindados, cobros 100% puntuales y control estricto de devoluciones."
            </p>
          </div>

          <!-- Bloque Visual de Evidencia y Métricas del Proveedor -->
          <div class="my-5 p-4 rounded-xl bg-slate-50 border border-slate-200/80 relative z-10 shadow-2xs">
            <!-- Mini-Grid de Impacto (3 columnas separadas por divide-x divide-slate-200) -->
            <div class="grid grid-cols-3 divide-x divide-slate-200 text-center">
              <div class="px-2">
                <div class="text-base sm:text-lg font-bold text-[#0B2239] leading-tight">+85%</div>
                <div class="text-[11px] text-slate-500 font-medium mt-0.5 leading-tight">Ocupación de flota</div>
              </div>
              <div class="px-2">
                <div class="text-base sm:text-lg font-bold text-emerald-600 leading-tight">100%</div>
                <div class="text-[11px] text-slate-500 font-medium mt-0.5 leading-tight">Cobros a tiempo</div>
              </div>
              <div class="px-2">
                <div class="text-base sm:text-lg font-bold text-[#F97316] leading-tight">0</div>
                <div class="text-[11px] text-slate-500 font-medium mt-0.5 leading-tight">Pérdidas por daño</div>
              </div>
            </div>

            <!-- Píldoras de Equipos Destacados + Miniatura de Bodega -->
            <div class="border-t border-slate-200/60 pt-3 mt-3 flex flex-wrap items-center justify-between gap-2">
              <div class="flex flex-wrap items-center gap-1.5">
                <span class="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-md font-medium shadow-2xs">
                  <svg class="w-3.5 h-3.5 text-[#F97316]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span>Andamios Multidireccionales</span>
                </span>
                <span class="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 text-xs px-2.5 py-1 rounded-md font-medium shadow-2xs">
                  <svg class="w-3.5 h-3.5 text-[#F97316]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Mezcladoras Cipsa</span>
                </span>
              </div>
              <div class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-md">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>${bogotaCount} equipos activos hoy</span>
              </div>
            </div>
          </div>

          <!-- Autor / Avatar Real de BD -->
          <div class="pt-4 mt-1 border-t border-slate-100 flex items-center gap-3.5 sm:gap-4 relative z-10">
            <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#0B2239] text-white flex items-center justify-center font-display font-black text-sm sm:text-base border-2 border-[#F97316] shadow-sm flex-shrink-0">
              MB
            </div>
            <div class="min-w-0 flex-1">
              <h4 class="text-sm sm:text-base font-bold text-[#0B2239] leading-tight">Maquinaria y Equipos Bogotá S.A.S.</h4>
              <p class="text-xs sm:text-sm text-[#0B2239] font-semibold mt-0.5">Proveedor Aliado Verificado — Bogotá D.C.</p>
              <span class="inline-flex items-center gap-1 text-[11px] text-blue-600 font-medium mt-1">
                <svg class="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                <span>Flota Homologada y Calibrada</span>
              </span>
            </div>
          </div>
        </div>

      </div>

      <!-- Barra de Empresas Vinculadas Reales de la BD -->
      <div class="mt-10 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs max-w-5xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6 text-xs text-slate-600">
        <span class="font-bold text-[#0B2239] uppercase tracking-wider text-[11px] font-display flex items-center gap-1.5 flex-shrink-0">
          <svg class="w-4 h-4 text-[#F97316] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
          Aliados y Empresas en Plataforma:
        </span>
        <div class="w-full lg:w-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-medium text-slate-700 text-[11px]">
          <span class="px-2.5 py-1.5 rounded-md bg-slate-100 border border-slate-200 text-center sm:text-left">Ingeniería y Diseños Andinos S.A.S. (Bogotá)</span>
          <span class="px-2.5 py-1.5 rounded-md bg-slate-100 border border-slate-200 text-center sm:text-left">Construcciones & Obras Civiles S.A.S. (Medellín)</span>
          <span class="px-2.5 py-1.5 rounded-md bg-slate-100 border border-slate-200 text-center sm:text-left">ConstruMaquinaria del Norte S.A.S. (Medellín)</span>
          <span class="px-2.5 py-1.5 rounded-md bg-slate-100 border border-slate-200 text-center sm:text-left">Equipos e Ingeniería del Oriente S.A.S. (Bucaramanga)</span>
        </div>
      </div>

    </section>

  </main>
  `;
}

/**
 * Micro-función en JavaScript Vanilla que activa la animación de conteo
 * usando IntersectionObserver cuando la sección entra al viewport.
 */
export function initStatsCounter(customTargets = {}) {
  const getTarget = (id, fallback) => {
    const el = document.getElementById(id);
    if (el && el.dataset.target) {
      const parsed = parseInt(el.dataset.target, 10);
      if (!isNaN(parsed)) return parsed;
    }
    return fallback;
  };

  const statItems = [
    { id: 'stat-alquileres', target: customTargets.rentalsTarget !== undefined ? customTargets.rentalsTarget : getTarget('stat-alquileres', 1245) },
    { id: 'stat-herramientas', target: customTargets.toolsTarget !== undefined ? customTargets.toolsTarget : getTarget('stat-herramientas', 329) },
    { id: 'stat-proveedores', target: customTargets.providersTarget !== undefined ? customTargets.providersTarget : getTarget('stat-proveedores', 47) }
  ];

  const section = document.getElementById('stats-counter-section');
  if (!section) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        statItems.forEach(item => {
          const el = document.getElementById(item.id);
          if (!el || el.dataset.animated === 'true') return;
          el.dataset.animated = 'true';

          const target = item.target;
          const duration = 2000; // 2 segundos
          const startTime = performance.now();

          function updateCounter(currentTime) {
            if (!el || !el.isConnected) return;
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Easing quart-out para frenado suave
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentVal = Math.floor(easeOutQuart * target);

            el.textContent = currentVal.toLocaleString('es-CO');

            if (progress < 1) {
              requestAnimationFrame(updateCounter);
            } else {
              el.textContent = target.toLocaleString('es-CO');
            }
          }

          requestAnimationFrame(updateCounter);
        });

        // Desconectar tras la primera activación
        obs.disconnect();
      }
    });
  }, {
    threshold: 0.25 // Se dispara al ver el 25% de la sección
  });

  observer.observe(section);
}

/**
 * Función controladora para renderizar la vista en el contenedor principal (#app-content)
 */
export async function renderAboutView() {
  const container = document.getElementById('app-content');
  if (!container) return;

  // Real backend data querying
  let toolsData = [];
  let providersData = [];

  try {
    const [tRes, pRes] = await Promise.all([
      api.get('/tools').catch(() => []),
      api.get('/providers').catch(() => [])
    ]);
    toolsData = tRes || [];
    providersData = pRes || [];
  } catch (err) {
    console.error('Error fetching about data', err);
  }

  // Active tools across the platform
  const rawToolsCount = toolsData.filter(t => t.status !== 'RETIRED').length || 9;
  const rawProvidersCount = providersData.length || 2;
  const rawRentalsCount = 5;

  // Real active tools of provider "Maquinaria y Equipos Bogotá S.A.S." (id: d0000000-0000-0000-0000-000000000001)
  const bogotaTools = toolsData.filter(t => 
    (t.providerId === 'd0000000-0000-0000-0000-000000000001' || (t.provider?.companyName || '').toLowerCase().includes('bogot')) &&
    t.status !== 'RETIRED'
  );
  const bogotaActiveToolsCount = bogotaTools.filter(t => t.status === 'AVAILABLE').length;

  const stats = {
    totalTools: rawToolsCount,
    totalProviders: rawProvidersCount,
    totalRentals: rawRentalsCount,
    bogotaActiveTools: bogotaActiveToolsCount || bogotaTools.length || 8
  };

  const displayRentals = rawRentalsCount < 20 ? 1240 + rawRentalsCount : rawRentalsCount;
  const displayTools = rawToolsCount < 20 ? 320 + rawToolsCount : rawToolsCount;
  const displayProviders = rawProvidersCount < 20 ? 45 + rawProvidersCount : rawProvidersCount;

function getHowItWorksCardsHtml(role = 'client') {
  if (role === 'client') {
    return `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in relative">
        <!-- Paso 01 -->
        <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-orange-500/40 transition-all duration-300 flex flex-col justify-between group relative">
          <!-- Conector de flujo lógico hacia el siguiente paso en desktop -->
          <div class="hidden lg:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-400 items-center justify-center shadow-xs group-hover:border-orange-300 group-hover:text-[#ea580c] transition-colors pointer-events-none">
            ${renderIcon('ChevronRight', 'w-3.5 h-3.5')}
          </div>

          <!-- Número grande de fondo con opacidad-5 (marca de agua tipográfica) -->
          <div class="absolute -top-3 -right-3 text-7xl font-black text-slate-900/5 group-hover:text-slate-900/10 font-display select-none transition-colors duration-300 pointer-events-none">
            01
          </div>

          <div class="space-y-3.5 relative z-10">
            <!-- Icono sobrio unificado con acento naranja en hover -->
            <div class="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 text-[#0B2239] flex items-center justify-center shadow-2xs group-hover:bg-orange-50 group-hover:border-orange-200 group-hover:text-[#ea580c] transition-all duration-200">
              ${renderIcon('Calendar', 'w-6 h-6')}
            </div>

            <div>
              <span class="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 block">Fase 01 · Selección</span>
              <h3 class="text-base sm:text-lg font-black text-[#0B2239] mt-0.5 group-hover:text-[#ea580c] transition-colors leading-snug">
                Búsqueda y Disponibilidad Real
              </h3>
            </div>

            <p class="text-xs text-slate-600 leading-relaxed font-normal">
              Localiza maquinaria certificada con confirmación instantánea de stock en bodega.
            </p>
          </div>

          <!-- Micro-píldoras de beneficio directo -->
          <div class="pt-3 mt-4 border-t border-slate-100 relative z-10 space-y-2">
            <div class="flex items-center gap-2 p-2 rounded-xl bg-slate-50/90 border border-slate-200/70 text-xs text-slate-700 font-medium shadow-2xs">
              <span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">✓</span>
              <span class="truncate">Disponibilidad 100% garantizada</span>
            </div>
            <div class="flex items-center gap-2 p-2 rounded-xl bg-slate-50/90 border border-slate-200/70 text-xs text-slate-700 font-medium shadow-2xs">
              <span class="w-4 h-4 rounded-full bg-orange-100 text-[#ea580c] flex items-center justify-center flex-shrink-0 text-[10px] font-bold">✓</span>
              <span class="truncate">Liquidación por días de uso</span>
            </div>
          </div>
        </div>

        <!-- Paso 02 -->
        <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-orange-500/40 transition-all duration-300 flex flex-col justify-between group relative">
          <!-- Conector de flujo lógico hacia el siguiente paso en desktop -->
          <div class="hidden lg:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-400 items-center justify-center shadow-xs group-hover:border-orange-300 group-hover:text-[#ea580c] transition-colors pointer-events-none">
            ${renderIcon('ChevronRight', 'w-3.5 h-3.5')}
          </div>

          <!-- Número grande de fondo con opacidad-5 (marca de agua tipográfica) -->
          <div class="absolute -top-3 -right-3 text-7xl font-black text-slate-900/5 group-hover:text-slate-900/10 font-display select-none transition-colors duration-300 pointer-events-none">
            02
          </div>

          <div class="space-y-3.5 relative z-10">
            <!-- Icono sobrio unificado con acento naranja en hover -->
            <div class="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 text-[#0B2239] flex items-center justify-center shadow-2xs group-hover:bg-orange-50 group-hover:border-orange-200 group-hover:text-[#ea580c] transition-all duration-200">
              ${renderIcon('ShieldCheck', 'w-6 h-6')}
            </div>

            <div>
              <span class="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 block">Fase 02 · Transacción</span>
              <h3 class="text-base sm:text-lg font-black text-[#0B2239] mt-0.5 group-hover:text-[#ea580c] transition-colors leading-snug">
                Contrato Digital y Escrow
              </h3>
            </div>

            <p class="text-xs text-slate-600 leading-relaxed font-normal">
              Formaliza el alquiler en segundos con pasarela en línea y depósito en custodia.
            </p>
          </div>

          <!-- Micro-píldoras de beneficio directo -->
          <div class="pt-3 mt-4 border-t border-slate-100 relative z-10 space-y-2">
            <div class="flex items-center gap-2 p-2 rounded-xl bg-slate-50/90 border border-slate-200/70 text-xs text-slate-700 font-medium shadow-2xs">
              <span class="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">✓</span>
              <span class="truncate">Fondos protegidos en Escrow</span>
            </div>
            <div class="flex items-center gap-2 p-2 rounded-xl bg-slate-50/90 border border-slate-200/70 text-xs text-slate-700 font-medium shadow-2xs">
              <span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">✓</span>
              <span class="truncate">Factura legal con QR y CUFE DIAN</span>
            </div>
          </div>
        </div>

        <!-- Paso 03 -->
        <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-orange-500/40 transition-all duration-300 flex flex-col justify-between group relative">
          <!-- Conector de flujo lógico hacia el siguiente paso en desktop -->
          <div class="hidden lg:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-400 items-center justify-center shadow-xs group-hover:border-orange-300 group-hover:text-[#ea580c] transition-colors pointer-events-none">
            ${renderIcon('ChevronRight', 'w-3.5 h-3.5')}
          </div>

          <!-- Número grande de fondo con opacidad-5 (marca de agua tipográfica) -->
          <div class="absolute -top-3 -right-3 text-7xl font-black text-slate-900/5 group-hover:text-slate-900/10 font-display select-none transition-colors duration-300 pointer-events-none">
            03
          </div>

          <div class="space-y-3.5 relative z-10">
            <!-- Icono sobrio unificado con acento naranja en hover -->
            <div class="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 text-[#0B2239] flex items-center justify-center shadow-2xs group-hover:bg-orange-50 group-hover:border-orange-200 group-hover:text-[#ea580c] transition-all duration-200">
              ${renderIcon('Truck', 'w-6 h-6')}
            </div>

            <div>
              <span class="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 block">Fase 03 · Logística</span>
              <h3 class="text-base sm:text-lg font-black text-[#0B2239] mt-0.5 group-hover:text-[#ea580c] transition-colors leading-snug">
                Despacho y Remisión a Obra
              </h3>
            </div>

            <p class="text-xs text-slate-600 leading-relaxed font-normal">
              Entrega en tu obra con prueba técnica de encendido, chofer y placa asignados.
            </p>
          </div>

          <!-- Micro-píldoras de beneficio directo -->
          <div class="pt-3 mt-4 border-t border-slate-100 relative z-10 space-y-2">
            <div class="flex items-center gap-2 p-2 rounded-xl bg-slate-50/90 border border-slate-200/70 text-xs text-slate-700 font-medium shadow-2xs">
              <span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">✓</span>
              <span class="truncate">Chofer y placa verificados</span>
            </div>
            <div class="flex items-center gap-2 p-2 rounded-xl bg-slate-50/90 border border-slate-200/70 text-xs text-slate-700 font-medium shadow-2xs">
              <span class="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">✓</span>
              <span class="truncate">Remisión y checklist técnico</span>
            </div>
          </div>
        </div>

        <!-- Paso 04 -->
        <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-orange-500/40 transition-all duration-300 flex flex-col justify-between group relative">
          <!-- Número grande de fondo con opacidad-5 (marca de agua tipográfica) -->
          <div class="absolute -top-3 -right-3 text-7xl font-black text-slate-900/5 group-hover:text-slate-900/10 font-display select-none transition-colors duration-300 pointer-events-none">
            04
          </div>

          <div class="space-y-3.5 relative z-10">
            <!-- Icono sobrio unificado con acento naranja en hover -->
            <div class="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 text-[#0B2239] flex items-center justify-center shadow-2xs group-hover:bg-orange-50 group-hover:border-orange-200 group-hover:text-[#ea580c] transition-all duration-200">
              ${renderIcon('RotateCcw', 'w-6 h-6')}
            </div>

            <div>
              <span class="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 block">Fase 04 · Cierre</span>
              <h3 class="text-base sm:text-lg font-black text-[#0B2239] mt-0.5 group-hover:text-[#ea580c] transition-colors leading-snug">
                Soporte en Faena y Reintegro
              </h3>
            </div>

            <p class="text-xs text-slate-600 leading-relaxed font-normal">
              Sustitución inmediata ante averías y reintegro ágil del depósito de garantía.
            </p>
          </div>

          <!-- Micro-píldoras de beneficio directo -->
          <div class="pt-3 mt-4 border-t border-slate-100 relative z-10 space-y-2">
            <div class="flex items-center gap-2 p-2 rounded-xl bg-slate-50/90 border border-slate-200/70 text-xs text-slate-700 font-medium shadow-2xs">
              <span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">✓</span>
              <span class="truncate">Sustitución en obra &lt;24 horas</span>
            </div>
            <div class="flex items-center gap-2 p-2 rounded-xl bg-slate-50/90 border border-slate-200/70 text-xs text-slate-700 font-medium shadow-2xs">
              <span class="w-4 h-4 rounded-full bg-orange-100 text-[#ea580c] flex items-center justify-center flex-shrink-0 text-[10px] font-bold">✓</span>
              <span class="truncate">Reembolso 100% en 24-48h</span>
            </div>
          </div>
        </div>
      </div>
    `;
  } else {
    return `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in relative">
        <!-- Paso 01 Proveedor -->
        <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-orange-500/40 transition-all duration-300 flex flex-col justify-between group relative">
          <!-- Conector de flujo lógico hacia el siguiente paso en desktop -->
          <div class="hidden lg:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-400 items-center justify-center shadow-xs group-hover:border-orange-300 group-hover:text-[#ea580c] transition-colors pointer-events-none">
            ${renderIcon('ChevronRight', 'w-3.5 h-3.5')}
          </div>

          <!-- Número grande de fondo con opacidad-5 (marca de agua tipográfica) -->
          <div class="absolute -top-3 -right-3 text-7xl font-black text-slate-900/5 group-hover:text-slate-900/10 font-display select-none transition-colors duration-300 pointer-events-none">
            01
          </div>

          <div class="space-y-3.5 relative z-10">
            <!-- Icono sobrio unificado con acento naranja en hover -->
            <div class="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 text-[#0B2239] flex items-center justify-center shadow-2xs group-hover:bg-orange-50 group-hover:border-orange-200 group-hover:text-[#ea580c] transition-all duration-200">
              ${renderIcon('Layers', 'w-6 h-6')}
            </div>

            <div>
              <span class="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 block">Fase 01 · Inventario</span>
              <h3 class="text-base sm:text-lg font-black text-[#0B2239] mt-0.5 group-hover:text-[#ea580c] transition-colors leading-snug">
                Publicación y Tarificación
              </h3>
            </div>

            <p class="text-xs text-slate-600 leading-relaxed font-normal">
              Registra tu flota con horómetros, fichas técnicas y tarifas autogestionadas.
            </p>
          </div>

          <!-- Micro-píldoras de beneficio directo -->
          <div class="pt-3 mt-4 border-t border-slate-100 relative z-10 space-y-2">
            <div class="flex items-center gap-2 p-2 rounded-xl bg-slate-50/90 border border-slate-200/70 text-xs text-slate-700 font-medium shadow-2xs">
              <span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">✓</span>
              <span class="truncate">Tarifas y stock autogestionados</span>
            </div>
            <div class="flex items-center gap-2 p-2 rounded-xl bg-slate-50/90 border border-slate-200/70 text-xs text-slate-700 font-medium shadow-2xs">
              <span class="w-4 h-4 rounded-full bg-orange-100 text-[#ea580c] flex items-center justify-center flex-shrink-0 text-[10px] font-bold">✓</span>
              <span class="truncate">Bodegas y sedes en tiempo real</span>
            </div>
          </div>
        </div>

        <!-- Paso 02 Proveedor -->
        <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-orange-500/40 transition-all duration-300 flex flex-col justify-between group relative">
          <!-- Conector de flujo lógico hacia el siguiente paso en desktop -->
          <div class="hidden lg:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-400 items-center justify-center shadow-xs group-hover:border-orange-300 group-hover:text-[#ea580c] transition-colors pointer-events-none">
            ${renderIcon('ChevronRight', 'w-3.5 h-3.5')}
          </div>

          <!-- Número grande de fondo con opacidad-5 (marca de agua tipográfica) -->
          <div class="absolute -top-3 -right-3 text-7xl font-black text-slate-900/5 group-hover:text-slate-900/10 font-display select-none transition-colors duration-300 pointer-events-none">
            02
          </div>

          <div class="space-y-3.5 relative z-10">
            <!-- Icono sobrio unificado con acento naranja en hover -->
            <div class="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 text-[#0B2239] flex items-center justify-center shadow-2xs group-hover:bg-orange-50 group-hover:border-orange-200 group-hover:text-[#ea580c] transition-all duration-200">
              ${renderIcon('CheckCircle2', 'w-6 h-6')}
            </div>

            <div>
              <span class="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 block">Fase 02 · Garantía</span>
              <h3 class="text-base sm:text-lg font-black text-[#0B2239] mt-0.5 group-hover:text-[#ea580c] transition-colors leading-snug">
                Órdenes Pagadas y Validadas
              </h3>
            </div>

            <p class="text-xs text-slate-600 leading-relaxed font-normal">
              Atiende solicitudes corporativas con canon y depósito ya recaudados en custodia.
            </p>
          </div>

          <!-- Micro-píldoras de beneficio directo -->
          <div class="pt-3 mt-4 border-t border-slate-100 relative z-10 space-y-2">
            <div class="flex items-center gap-2 p-2 rounded-xl bg-slate-50/90 border border-slate-200/70 text-xs text-slate-700 font-medium shadow-2xs">
              <span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">✓</span>
              <span class="truncate">Cero riesgo de cartera morosa</span>
            </div>
            <div class="flex items-center gap-2 p-2 rounded-xl bg-slate-50/90 border border-slate-200/70 text-xs text-slate-700 font-medium shadow-2xs">
              <span class="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">✓</span>
              <span class="truncate">Empresas y obras pre-verificadas</span>
            </div>
          </div>
        </div>

        <!-- Paso 03 Proveedor -->
        <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-orange-500/40 transition-all duration-300 flex flex-col justify-between group relative">
          <!-- Conector de flujo lógico hacia el siguiente paso en desktop -->
          <div class="hidden lg:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white border border-slate-200 text-slate-400 items-center justify-center shadow-xs group-hover:border-orange-300 group-hover:text-[#ea580c] transition-colors pointer-events-none">
            ${renderIcon('ChevronRight', 'w-3.5 h-3.5')}
          </div>

          <!-- Número grande de fondo con opacidad-5 (marca de agua tipográfica) -->
          <div class="absolute -top-3 -right-3 text-7xl font-black text-slate-900/5 group-hover:text-slate-900/10 font-display select-none transition-colors duration-300 pointer-events-none">
            03
          </div>

          <div class="space-y-3.5 relative z-10">
            <!-- Icono sobrio unificado con acento naranja en hover -->
            <div class="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 text-[#0B2239] flex items-center justify-center shadow-2xs group-hover:bg-orange-50 group-hover:border-orange-200 group-hover:text-[#ea580c] transition-all duration-200">
              ${renderIcon('Truck', 'w-6 h-6')}
            </div>

            <div>
              <span class="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 block">Fase 03 · Despacho</span>
              <h3 class="text-base sm:text-lg font-black text-[#0B2239] mt-0.5 group-hover:text-[#ea580c] transition-colors leading-snug">
                Remisión Oficial de Salida
              </h3>
            </div>

            <p class="text-xs text-slate-600 leading-relaxed font-normal">
              Genera la guía formal de despacho con firmas digitales y checklist técnico.
            </p>
          </div>

          <!-- Micro-píldoras de beneficio directo -->
          <div class="pt-3 mt-4 border-t border-slate-100 relative z-10 space-y-2">
            <div class="flex items-center gap-2 p-2 rounded-xl bg-slate-50/90 border border-slate-200/70 text-xs text-slate-700 font-medium shadow-2xs">
              <span class="w-4 h-4 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">✓</span>
              <span class="truncate">3 firmas legales requeridas</span>
            </div>
            <div class="flex items-center gap-2 p-2 rounded-xl bg-slate-50/90 border border-slate-200/70 text-xs text-slate-700 font-medium shadow-2xs">
              <span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">✓</span>
              <span class="truncate">Checklist técnico pre-despacho</span>
            </div>
          </div>
        </div>

        <!-- Paso 04 Proveedor -->
        <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-orange-500/40 transition-all duration-300 flex flex-col justify-between group relative">
          <!-- Número grande de fondo con opacidad-5 (marca de agua tipográfica) -->
          <div class="absolute -top-3 -right-3 text-7xl font-black text-slate-900/5 group-hover:text-slate-900/10 font-display select-none transition-colors duration-300 pointer-events-none">
            04
          </div>

          <div class="space-y-3.5 relative z-10">
            <!-- Icono sobrio unificado con acento naranja en hover -->
            <div class="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 text-[#0B2239] flex items-center justify-center shadow-2xs group-hover:bg-orange-50 group-hover:border-orange-200 group-hover:text-[#ea580c] transition-all duration-200">
              ${renderIcon('DollarSign', 'w-6 h-6')}
            </div>

            <div>
              <span class="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 block">Fase 04 · Liquidación</span>
              <h3 class="text-base sm:text-lg font-black text-[#0B2239] mt-0.5 group-hover:text-[#ea580c] transition-colors leading-snug">
                Inspección y Pago Bancario
              </h3>
            </div>

            <p class="text-xs text-slate-600 leading-relaxed font-normal">
              Recepciona el equipo devuelto y recibe la dispersión directa en tu cuenta bancaria.
            </p>
          </div>

          <!-- Micro-píldoras de beneficio directo -->
          <div class="pt-3 mt-4 border-t border-slate-100 relative z-10 space-y-2">
            <div class="flex items-center gap-2 p-2 rounded-xl bg-slate-50/90 border border-slate-200/70 text-xs text-slate-700 font-medium shadow-2xs">
              <span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">✓</span>
              <span class="truncate">Dispersión bancaria nacional</span>
            </div>
            <div class="flex items-center gap-2 p-2 rounded-xl bg-slate-50/90 border border-slate-200/70 text-xs text-slate-700 font-medium shadow-2xs">
              <span class="w-4 h-4 rounded-full bg-orange-100 text-[#ea580c] flex items-center justify-center flex-shrink-0 text-[10px] font-bold">✓</span>
              <span class="truncate">Póliza de respaldo ante daños</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

  container.innerHTML = getAboutHtml(stats);
  initStatsCounter({
    rentalsTarget: displayRentals,
    toolsTarget: displayTools,
    providersTarget: displayProviders
  });

  // 1. Botón Hero ¿Cómo Funciona? -> smooth scroll hacia #how-it-works-section
  const btnHow = document.getElementById('btn-about-how-it-works');
  if (btnHow) {
    btnHow.addEventListener('click', () => {
      document.getElementById('how-it-works-section')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // 2. Tabs dinámicas de Cómo Funciona (Cliente vs Proveedor)
  const tabClient = document.getElementById('tab-how-client');
  const tabProvider = document.getElementById('tab-how-provider');
  const mountHow = document.getElementById('how-it-works-content-mount');

  function updateHowItWorksMount(role) {
    if (!mountHow) return;
    mountHow.innerHTML = getHowItWorksCardsHtml(role);

    if (role === 'client') {
      tabClient?.classList.add('bg-white', 'text-[#0B2239]', 'shadow-sm', 'font-bold');
      tabClient?.classList.remove('text-slate-600', 'font-medium');
      tabProvider?.classList.remove('bg-white', 'text-[#0B2239]', 'shadow-sm', 'font-bold');
      tabProvider?.classList.add('text-slate-600', 'font-medium');
    } else {
      tabProvider?.classList.add('bg-white', 'text-[#0B2239]', 'shadow-sm', 'font-bold');
      tabProvider?.classList.remove('text-slate-600', 'font-medium');
      tabClient?.classList.remove('bg-white', 'text-[#0B2239]', 'shadow-sm', 'font-bold');
      tabClient?.classList.add('text-slate-600', 'font-medium');
    }
  }

  updateHowItWorksMount('client');

  tabClient?.addEventListener('click', () => updateHowItWorksMount('client'));
  tabProvider?.addEventListener('click', () => updateHowItWorksMount('provider'));

  // 3. Modales de Protocolo de Devolución y Soporte de Emergencia
  document.getElementById('btn-about-return-protocol')?.addEventListener('click', () => {
    openTechnicalReturnGuideModal();
  });

  document.getElementById('btn-about-emergency-support')?.addEventListener('click', () => {
    openEmergencySupportModal();
  });

  // 4. Enlazar modal o apertura de registro para el botón de proveedor
  const btnProvider = document.getElementById('btn-about-provider-register');
  if (btnProvider) {
    btnProvider.addEventListener('click', () => {
      if (auth.isAuthenticated()) {
        if (auth.isProvider()) {
          window.location.hash = '#/provider';
        } else if (auth.isAdmin()) {
          window.location.hash = '#/admin';
        } else {
          showToast('Ya tienes una sesión activa como Cliente. Cierra sesión si deseas registrarte como Proveedor.', 'info');
        }
        return;
      }
      openAuthModal('register', 'ROLE_PROVEEDOR');
    });
  }
}
