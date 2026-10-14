import api from '../api/client.js';
import heroCatImg from '../assets/index-hero-cat.png';
import ctaBannerImg from '../assets/index-cta-banner.png';
import catMovimientoImg from '../assets/cat-movimiento.png';
import catHerramientasImg from '../assets/cat-herramientas.png';
import catConstruccionImg from '../assets/cat-construccion.png';
import catElevacionImg from '../assets/cat-elevacion.png';
import catEnergiaImg from '../assets/cat-energia.png';
import catCompactacionImg from '../assets/cat-compactacion.png';
import { renderIcon } from '../utils/icons.js';
import modal from '../components/modal.js';

export async function renderHomeView() {
  const container = document.getElementById('app-content');
  if (!container) return;

  // 6 Featured Categories matching INDEX.png
  const categoriesList = [
    {
      name: 'Movimiento de tierra',
      count: 12,
      query: 'excavadora',
      image: catMovimientoImg,
      icon: 'Truck'
    },
    {
      name: 'Herramientas eléctricas',
      count: 25,
      query: 'eléctrica',
      image: catHerramientasImg,
      icon: 'Wrench'
    },
    {
      name: 'Construcción',
      count: 18,
      query: 'hormigón',
      image: catConstruccionImg,
      icon: 'Grid'
    },
    {
      name: 'Elevación',
      count: 8,
      query: 'elevación',
      image: catElevacionImg,
      icon: 'Maximize2'
    },
    {
      name: 'Generación de energía',
      count: 6,
      query: 'generación',
      image: catEnergiaImg,
      icon: 'Zap'
    },
    {
      name: 'Compactación de suelos',
      count: 7,
      query: 'compactación',
      image: catCompactacionImg,
      icon: 'Layers'
    }
  ];

  container.innerHTML = `
    <div class="min-h-screen bg-[#f8fafc] text-slate-800 pb-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-10">
        
        <!-- 1. Hero Section matching INDEX.png -->
        <section class="relative rounded-3xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
          <div class="grid grid-cols-1 lg:grid-cols-12 items-center min-h-[380px] sm:min-h-[420px] lg:min-h-[440px]">
            
            <!-- Left: Hero Copy and CTAs -->
            <div class="lg:col-span-6 p-8 sm:p-12 lg:p-14 space-y-4 z-10 relative">
              <span class="text-[11px] sm:text-xs font-black uppercase tracking-widest text-slate-500 font-sans">
                ALQUILER DE HERRAMIENTAS Y MAQUINARIA
              </span>
              
              <h1 class="text-3xl sm:text-4xl lg:text-[44px] font-black text-slate-900 font-display tracking-tight leading-[1.12]">
                El equipo que necesitas, cuando lo necesitas.
              </h1>
              
              <p class="text-sm sm:text-base text-slate-600 font-normal leading-relaxed pt-1 max-w-lg">
                Herramientas y maquinaria de alta calidad para hacer realidad tus proyectos en toda Colombia.
              </p>

              <div class="pt-4 flex flex-wrap items-center gap-3.5">
                <a 
                  href="#/catalog" 
                  class="btn-primary !px-6 !py-3.5 text-xs sm:text-sm font-bold shadow-sm inline-flex items-center gap-2 hover:shadow-md transition-all group"
                >
                  <span>Explorar catálogo</span>
                  <span class="transition-transform group-hover:translate-x-1">&rarr;</span>
                </a>

                <button 
                  id="btn-hero-how-it-works" 
                  type="button" 
                  class="px-5 py-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-semibold transition-all inline-flex items-center gap-2 shadow-2xs cursor-pointer active:scale-95"
                >
                  ${renderIcon('PlayCircle', 'w-4 h-4 text-slate-500')}
                  <span>Cómo funciona</span>
                </button>
              </div>
            </div>

            <!-- Right: Hero CAT Excavator Imagery with Smooth Blend -->
            <div class="lg:col-span-6 relative h-64 sm:h-80 lg:h-full flex items-center justify-end overflow-hidden">
              <img 
                src="${heroCatImg}" 
                alt="Maquinaria y Excavadoras CAT en ToolRent" 
                class="w-full h-full object-cover object-center lg:object-right select-none pointer-events-none" 
              />
              <!-- Soft gradient blend for large screens -->
              <div class="hidden lg:block absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none"></div>
            </div>

          </div>
        </section>

        <!-- 2. Value Proposition Strip (4 Items matching INDEX.png) -->
        <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-2 sm:px-4 py-2">
          
          <!-- Feature 1: Equipos certificados -->
          <div class="flex items-start gap-3.5 group">
            <div class="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-2xs text-slate-800 group-hover:border-[#FF5A1F]/40 group-hover:text-[#FF5A1F] transition-all">
              ${renderIcon('ShieldCheck', 'w-5 h-5')}
            </div>
            <div>
              <h4 class="font-bold text-sm text-slate-900 font-display">Equipos certificados</h4>
              <p class="text-xs text-slate-500 leading-relaxed mt-0.5">
                Todo nuestro equipo pasa por inspecciones de calidad.
              </p>
            </div>
          </div>

          <!-- Feature 2: Entrega a todo el país -->
          <div class="flex items-start gap-3.5 group">
            <div class="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-2xs text-slate-800 group-hover:border-[#FF5A1F]/40 group-hover:text-[#FF5A1F] transition-all">
              ${renderIcon('Truck', 'w-5 h-5')}
            </div>
            <div>
              <h4 class="font-bold text-sm text-slate-900 font-display">Entrega a todo el país</h4>
              <p class="text-xs text-slate-500 leading-relaxed mt-0.5">
                Llevamos lo que necesitas, donde lo necesites.
              </p>
            </div>
          </div>

          <!-- Feature 3: Soporte especializado -->
          <div class="flex items-start gap-3.5 group">
            <div class="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-2xs text-slate-800 group-hover:border-[#FF5A1F]/40 group-hover:text-[#FF5A1F] transition-all">
              ${renderIcon('Clock', 'w-5 h-5')}
            </div>
            <div>
              <h4 class="font-bold text-sm text-slate-900 font-display">Soporte especializado</h4>
              <p class="text-xs text-slate-500 leading-relaxed mt-0.5">
                Te asesoramos en cada etapa de tu proyecto.
              </p>
            </div>
          </div>

          <!-- Feature 4: Pagos seguros -->
          <div class="flex items-start gap-3.5 group">
            <div class="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-2xs text-slate-800 group-hover:border-[#FF5A1F]/40 group-hover:text-[#FF5A1F] transition-all">
              ${renderIcon('Shield', 'w-5 h-5')}
            </div>
            <div>
              <h4 class="font-bold text-sm text-slate-900 font-display">Pagos seguros</h4>
              <p class="text-xs text-slate-500 leading-relaxed mt-0.5">
                Transacciones confiables y sin complicaciones.
              </p>
            </div>
          </div>

        </section>

        <!-- 3. Categories Section matching INDEX.png -->
        <section class="space-y-4 pt-4">
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span class="text-[11px] font-black uppercase tracking-widest text-slate-500 font-sans">
                NUESTRAS CATEGORÍAS
              </span>
              <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display tracking-tight mt-1">
                Encuentra la herramienta ideal para tu proyecto.
              </h2>
            </div>

            <a 
              href="#/catalog" 
              class="text-xs sm:text-sm font-bold text-slate-700 hover:text-[#FF5A1F] transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto group"
            >
              <span>Ver todo el catálogo</span>
              <span class="transition-transform group-hover:translate-x-1">&rarr;</span>
            </a>
          </div>

          <!-- 6 Grid Category Cards -->
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            ${categoriesList.map(cat => `
              <a 
                href="#/catalog?q=${encodeURIComponent(cat.query)}" 
                class="group relative rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-[3/4] bg-slate-900 border border-slate-200/60 shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1 block"
                title="${cat.name} (${cat.count})"
              >
                <img 
                  src="${cat.image}" 
                  alt="${cat.name}" 
                  class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108" 
                />
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent"></div>
                
                <div class="absolute inset-0 p-3.5 flex flex-col justify-end text-white">
                  <div class="text-xs sm:text-sm font-bold leading-tight font-display drop-shadow-sm group-hover:text-orange-300 transition-colors">
                    ${cat.name}
                  </div>
                  <div class="text-[11px] text-slate-300 font-medium mt-0.5">
                    (${cat.count})
                  </div>
                </div>
              </a>
            `).join('')}
          </div>
        </section>

        <!-- 4. Why Choose ToolRent Metrics Strip matching INDEX.png -->
        <section class="bg-[#f1f5f9]/70 border border-slate-200/90 rounded-2xl p-6 sm:p-8 lg:p-10">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <!-- Left heading with orange bar -->
            <div class="lg:col-span-5 border-l-4 border-[#FF5A1F] pl-4 space-y-1">
              <span class="text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-slate-500 font-sans">
                POR QUÉ ELEGIR TOOLRENT
              </span>
              <h3 class="text-xl sm:text-2xl font-black text-slate-900 font-display tracking-tight leading-snug">
                Más que un alquiler, es una solución.
              </h3>
            </div>

            <!-- Right 4 Metrics with dividers -->
            <div class="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-6 items-center">
              
              <!-- Metric 1: +200 -->
              <div class="space-y-1">
                <div class="text-3xl sm:text-4xl font-black text-slate-900 font-display tracking-tight">+200</div>
                <div class="text-xs text-slate-600 font-medium">Equipos disponibles</div>
              </div>

              <!-- Metric 2: 98% -->
              <div class="space-y-1 border-l border-slate-200/80 pl-4 sm:pl-6">
                <div class="text-3xl sm:text-4xl font-black text-slate-900 font-display tracking-tight">98%</div>
                <div class="text-xs text-slate-600 font-medium">Clientes satisfechos</div>
              </div>

              <!-- Metric 3: +15 -->
              <div class="space-y-1 border-l border-slate-200/80 pl-4 sm:pl-6">
                <div class="text-3xl sm:text-4xl font-black text-slate-900 font-display tracking-tight">+15</div>
                <div class="text-xs text-slate-600 font-medium">Ciudades en Colombia</div>
              </div>

              <!-- Metric 4: 24/7 -->
              <div class="space-y-1 border-l border-slate-200/80 pl-4 sm:pl-6">
                <div class="text-3xl sm:text-4xl font-black text-slate-900 font-display tracking-tight">24/7</div>
                <div class="text-xs text-slate-600 font-medium">Soporte técnico</div>
              </div>

            </div>

          </div>
        </section>

        <!-- 5. Bottom Dark CTA Banner matching INDEX.png -->
        <section class="relative rounded-2xl overflow-hidden shadow-lg bg-slate-950 select-none">
          <img 
            src="${ctaBannerImg}" 
            alt="Tu proyecto no se detiene - ToolRent" 
            class="hidden sm:block w-full h-auto object-cover select-none pointer-events-none" 
          />
          
          <!-- Hotspot for CTA on the bottom banner -->
          <a 
            href="#/catalog" 
            class="hidden sm:block absolute cursor-pointer rounded-xl transition-all hover:bg-white/10 active:scale-95" 
            style="left: 4.8%; top: 62.5%; width: 14.5%; height: 26%;" 
            title="Explorar catálogo"
            aria-label="Explorar catálogo"
          ></a>

          <!-- Mobile Fallback Content when image is small -->
          <div class="sm:hidden p-8 space-y-3 bg-gradient-to-r from-slate-950 to-slate-900 text-white">
            <div class="border-l-4 border-[#FF5A1F] pl-3.5 space-y-1">
              <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">LISTO PARA COMENZAR</span>
              <h3 class="text-2xl font-black font-display tracking-tight">Tu proyecto no se detiene.</h3>
              <p class="text-xs text-slate-300">Encuentra el equipo perfecto y empieza hoy mismo.</p>
            </div>
            <a href="#/catalog" class="btn-primary !px-5 !py-3 text-xs font-bold w-full inline-block text-center mt-2">
              Explorar catálogo &rarr;
            </a>
          </div>
        </section>

      </div>
    </div>
  `;

  // Attach interactive "Cómo funciona" modal
  container.querySelector('#btn-hero-how-it-works')?.addEventListener('click', () => {
    openHowItWorksModal();
  });
}

/**
 * Interactive Step-by-Step "Cómo funciona" Modal
 */
export function openHowItWorksModal() {
  const content = document.createElement('div');
  content.className = 'p-6 space-y-6 bg-white text-slate-800';

  content.innerHTML = `
    <div class="space-y-6">
      <div class="text-center max-w-lg mx-auto space-y-1.5">
        <span class="text-[11px] font-extrabold uppercase tracking-widest text-[#FF5A1F]">PASO A PASO</span>
        <h3 class="text-xl sm:text-2xl font-black text-slate-900 font-display">¿Cómo funciona alquilar en ToolRent?</h3>
        <p class="text-xs text-slate-500">
          Un proceso 100% digital, seguro y respaldado por proveedores verificados en toda Colombia.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <!-- Step 1 -->
        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5 relative">
          <div class="w-8 h-8 rounded-full bg-[#FF5A1F] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            1
          </div>
          <div class="font-bold text-slate-900 text-sm font-display">Reserva Online Transparente</div>
          <p class="text-slate-600 text-[11px] leading-relaxed">
            Explora el catálogo, selecciona las fechas facturables inclusivas y verifica disponibilidad en tiempo real. Desglose claro de alquiler, IVA 19% y depósito en garantía.
          </p>
        </div>

        <!-- Step 2 -->
        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5 relative">
          <div class="w-8 h-8 rounded-full bg-[#FF5A1F] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            2
          </div>
          <div class="font-bold text-slate-900 text-sm font-display">Entrega con Acta Digital</div>
          <p class="text-slate-600 text-[11px] leading-relaxed">
            El proveedor entrega la herramienta calibrada y probada. Se firma el acta digital de entrega con fotos del estado del equipo para total seguridad de ambas partes.
          </p>
        </div>

        <!-- Step 3 -->
        <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5 relative">
          <div class="w-8 h-8 rounded-full bg-[#FF5A1F] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            3
          </div>
          <div class="font-bold text-slate-900 text-sm font-display">Retorno y Reintegro 100%</div>
          <p class="text-slate-600 text-[11px] leading-relaxed">
            Al finalizar tu proyecto devuelves la máquina. Tras la inspección final de check-out, el depósito en custodia se reintegra íntegramente a tu cuenta en menos de 24 horas.
          </p>
        </div>
      </div>

      <div class="p-4 rounded-2xl bg-orange-50/70 border border-orange-200/80 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-orange-100 text-[#FF5A1F] flex items-center justify-center flex-shrink-0">
            ${renderIcon('ShieldCheck', 'w-5 h-5')}
          </div>
          <div>
            <div class="text-xs font-bold text-slate-900">Garantía de Sustitución en 24h</div>
            <div class="text-[11px] text-slate-600">Si un equipo sufre falla técnica, el proveedor lo reemplaza sin costo extra.</div>
          </div>
        </div>
        <a href="#/catalog" class="btn-primary !px-4 !py-2 text-xs font-bold whitespace-nowrap" onclick="document.querySelector('#modal-container').innerHTML=''">
          Ir al Catálogo &rarr;
        </a>
      </div>
    </div>
  `;

  modal.open({
    title: 'Cómo funciona ToolRent',
    content: content,
    maxWidth: 'max-w-3xl'
  });
}
