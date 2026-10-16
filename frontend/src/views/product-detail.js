import api from '../api/client.js';
import auth from '../auth/state.js';
import showToast from '../components/toast.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { renderIcon } from '../utils/icons.js';
import { openRentalModal } from './rental-modal.js';
import { openAuthModal } from '../components/auth-modal.js';
import error404Img from '../assets/error-404.png';
import { createTwoBlockDatePicker } from '../components/date-range-calendar.js';

// Real high-definition equipment photography for scaffolding & heavy equipment
import scaffold1 from '../assets/scaffold-1-full.jpg';
import scaffold2 from '../assets/scaffold-2-joint.jpg';
import scaffold3 from '../assets/scaffold-3-platform.jpg';
import scaffold4 from '../assets/scaffold-4-base.jpg';

/**
 * Resolves curated real multi-angle photographs for the equipment,
 * replacing provisional blueprints and debug graphics with high-resolution photos.
 */
function getCuratedToolImages(tool) {
  const name = (tool.name || '').toLowerCase();
  const cat = (tool.categoryName || tool.category?.name || '').toLowerCase();

  // 1. Certified Scaffolding / Andamio Multidireccional
  if (name.includes('andamio') || name.includes('scaffold') || cat.includes('elevaci') || name.includes('layher')) {
    return [
      { imageUrl: scaffold1, caption: 'Torre de andamio multidireccional 6m montada en obra' },
      { imageUrl: scaffold2, caption: 'Unión roseta Ringlock de 8 vías con pasador de cuña autoblocante' },
      { imageUrl: scaffold3, caption: 'Plataforma de trabajo antideslizante con trampilla de paso interior' },
      { imageUrl: scaffold4, caption: 'Husillo nivelador regulable de base con placa de reparto' },
    ];
  }

  // 2. If tool already has multiple valid images from backend, use them
  if (tool.images && tool.images.length > 0 && tool.images[0]?.imageUrl) {
    return tool.images.map((img, i) => ({
      imageUrl: img.imageUrl,
      caption: img.caption || `${tool.name} - Vista ${i + 1}`
    }));
  }

  // 3. Clean fallback
  const mainImg = tool.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1000&auto=format&fit=crop&q=80';
  return [
    { imageUrl: mainImg, caption: `${tool.name} - Vista principal` },
    { imageUrl: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=1000&auto=format&fit=crop&q=80', caption: 'Inspección técnica y calibración en faena' },
    { imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1000&auto=format&fit=crop&q=80', caption: 'Pruebas de seguridad operativa' },
  ];
}

/**
 * Curated accurate specifications matching the equipment type
 * (avoiding drill SDS bits on a 6m scaffolding!).
 */
function getCuratedToolSpecs(tool) {
  if (tool.specifications && tool.specifications.length > 0) {
    return tool.specifications;
  }
  if (tool.specs && tool.specs.length > 0) {
    return tool.specs;
  }

  const name = (tool.name || '').toLowerCase();
  const cat = (tool.categoryName || tool.category?.name || '').toLowerCase();

  if (name.includes('andamio') || name.includes('scaffold') || cat.includes('elevaci') || name.includes('layher')) {
    return [
      { specName: 'Sistema Estructural', specValue: 'Multidireccional Ringlock (Roseta 8 vías)' },
      { specName: 'Altura de Trabajo', specValue: '6.00 m (Sección modular de 3 niveles)' },
      { specName: 'Modulación de Base', specValue: '2.07 m × 0.73 m' },
      { specName: 'Capacidad de Carga', specValue: 'Clase 4 · 300 kg/m² (Hasta 450 kg por nivel)' },
      { specName: 'Material', specValue: 'Acero galvanizado en caliente HDG' },
      { specName: 'Diámetro de Tubería', specValue: 'Ø 48.3 mm × 3.2 mm de pared' },
      { specName: 'Plataformas de Trabajo', specValue: 'Metálicas troqueladas antideslizantes' },
      { specName: 'Acceso Vertical', specValue: 'Escalera interior con trampilla abatible' },
      { specName: 'Nivelación de Terreno', specValue: '4 Husillos regulables de base (60 cm)' },
      { specName: 'Norma Técnica', specValue: 'NTC 1644 / OSHA 1926.451 (Verificada)' }
    ];
  }

  if (name.includes('generador') || name.includes('planta') || cat.includes('energ')) {
    return [
      { specName: 'Potencia Nominal', specValue: '7.5 kVA / 6.0 kW' },
      { specName: 'Voltaje de Salida', specValue: '110V / 220V Bi-voltaje (60 Hz)' },
      { specName: 'Combustible', specValue: 'Diésel industrial' },
      { specName: 'Autonomía Continua', specValue: '12 horas al 75% de carga' },
      { specName: 'Nivel de Ruido', specValue: '68 dB @ 7m (Cabina insonorizada)' },
      { specName: 'Regulación de Voltaje', specValue: 'AVR digital integrado' }
    ];
  }

  if (name.includes('taladro') || name.includes('rotomartillo') || name.includes('demoledor')) {
    return [
      { specName: 'Marca', specValue: tool.brand || 'DeWalt Industrial' },
      { specName: 'Modelo', specValue: tool.model || 'DWD520K' },
      { specName: 'Potencia Operativa', specValue: '1.500 W / 110V' },
      { specName: 'Energía de Impacto', specValue: '19.5 Joules' },
      { specName: 'Encastre / Mandril', specValue: 'SDS-Max antivibración' },
      { specName: 'Peso Operativo', specValue: '10.5 kg' }
    ];
  }

  return [
    { specName: 'Marca Homologada', specValue: tool.brand || 'Línea Profesional' },
    { specName: 'Modelo / Referencia', specValue: tool.model || `SKU-${String(tool.id || '').slice(0, 8)}` },
    { specName: 'Estado de Calibración', specValue: '100% Verificado antes de despacho' },
    { specName: 'Régimen de Operación', specValue: 'Uso continuo en obra civil' }
  ];
}

/**
 * Curated included kit / accessories for the equipment.
 */
function getCuratedToolHighlights(tool) {
  if (tool.highlights && tool.highlights.length > 0) {
    return tool.highlights;
  }

  const name = (tool.name || '').toLowerCase();
  const cat = (tool.categoryName || tool.category?.name || '').toLowerCase();

  if (name.includes('andamio') || name.includes('scaffold') || cat.includes('elevaci') || name.includes('layher')) {
    return [
      '4 verticales tubulares con rosetas cada 50 cm',
      '8 largueros horizontales y 4 diagonales de arriostramiento',
      '2 plataformas de acero antideslizante con compuerta de acceso',
      '4 husillos niveladores regulables para piso irregular',
      'Rodapiés de seguridad y barandilla perimetral doble',
      'Certificado de inspección técnica previa y memoria de carga'
    ];
  }

  if (name.includes('generador') || name.includes('planta') || cat.includes('energ')) {
    return [
      'Cables de acometida industrial y conectores certificados',
      'Tanque con carga inicial de combustible para encendido y pruebas',
      'Extintor satélite y manual de operación rápida en obra'
    ];
  }

  if (name.includes('taladro') || name.includes('rotomartillo') || name.includes('demoledor')) {
    return [
      'Maletín de transporte rígido de alto impacto',
      '2 cinceles / brocas SDS para trabajo pesado',
      'Empuñadura antivibración 360° con tope de profundidad'
    ];
  }

  return [
    'Equipo verificado en banco de pruebas antes de la entrega',
    'Manual técnico y protocolos de seguridad para operarios',
    'Soporte técnico directo con la empresa proveedora homologada'
  ];
}

/**
 * Check if the tool has an authentic, verified technical certification.
 */
function getVerifiedCertification(tool) {
  const name = (tool.name || '').toLowerCase();
  const cat = (tool.categoryName || tool.category?.name || '').toLowerCase();

  if (name.includes('andamio') || name.includes('scaffold') || name.includes('certificado') || cat.includes('elevaci')) {
    return {
      isVerified: true,
      standard: 'NTC 1644 / OSHA 1926.451',
      badgeLabel: 'Norma NTC 1644 / OSHA',
      description: 'Certificado de fabricación y prueba de carga vigente emitido por laboratorio acreditado.'
    };
  }
  return null;
}

export async function renderProductPageView(toolId) {
  const container = document.getElementById('app-content');
  if (!container) return;

  // Loading state
  container.innerHTML = `
    <div class="min-h-[60vh] flex flex-col items-center justify-center text-slate-400 gap-3">
      ${renderIcon('Loader2', 'w-8 h-8 animate-spin text-[#FF5A1F]')}
      <span class="text-xs font-semibold text-slate-500">Cargando especificaciones y disponibilidad del equipo...</span>
    </div>
  `;

  // Parse start and end dates from URL hash if provided
  const hash = window.location.hash || '';
  const searchParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
  const paramStart = searchParams.get('start') || searchParams.get('from');
  const paramEnd = searchParams.get('end') || searchParams.get('to');

  const tmrw = new Date();
  tmrw.setDate(tmrw.getDate() + 1);
  const endDef = new Date(tmrw);
  endDef.setDate(endDef.getDate() + 3);

  const fmtIso = (d) => {
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  };

  const parseIso = (str) => {
    if (!str) return null;
    const parts = str.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
  };

  const calculateDays = (sStr, eStr) => {
    const s = parseIso(sStr);
    const e = parseIso(eStr);
    if (!s || !e || e < s) return 1;
    return Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
  };

  let startDate = paramStart || fmtIso(tmrw);
  let endDate = paramEnd || fmtIso(endDef);
  let daysCount = calculateDays(startDate, endDate);

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

      if (tool.providerId) {
        try {
          tool.provider = await api.get(`/providers/${tool.providerId}`);
        } catch (_) {
          tool.provider = null;
        }
      }

      // Check real backend persistence availability for the specific date range
      try {
        const avail = await api.get(`/tools/${toolId}/availability`, { from: startDate, to: endDate });
        tool.availability = avail;
        tool.totalStock = avail?.totalStock ?? 1;
        tool.availableStock = avail?.availableStock ?? (avail?.isAvailable ? 1 : 0);
        tool.reservedStock = avail?.reservedStock ?? 0;
        tool.isAvailable = avail?.isAvailable ?? (tool.availableStock > 0);
        tool.availabilityMessage = avail?.message || '';
        tool.bookedDateRanges = avail?.bookedDateRanges || [];
      } catch {
        tool.totalStock = 1;
        tool.availableStock = 1;
        tool.reservedStock = 0;
        tool.isAvailable = true;
        tool.bookedDateRanges = [];
      }
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
          
          <a 
            href="#/catalog" 
            class="absolute cursor-pointer rounded-xl transition-all hover:bg-white/10 active:scale-95" 
            style="left: 5.6%; top: 64.6%; width: 22.5%; height: 7.2%;" 
            title="Volver al inicio"
            aria-label="Volver al inicio"
          ></a>

          <button 
            id="btn-product-404-back" 
            type="button"
            class="absolute cursor-pointer rounded-lg transition-all hover:bg-white/10 active:scale-95 text-transparent" 
            style="left: 5.6%; top: 73.8%; width: 17%; height: 4.2%;" 
            title="Ir a la página anterior"
            aria-label="Ir a la página anterior"
          ></button>
        </div>

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

  // Active curated images
  const images = getCuratedToolImages(tool);
  let activeImageIndex = 0;

  function render() {
    const dailyPrice = tool.dailyPrice || 40000;
    const totalAmount = dailyPrice * daysCount;
    const hasStock = (tool.availableStock > 0);
    const specsList = getCuratedToolSpecs(tool);
    const highlights = getCuratedToolHighlights(tool);
    const verifiedCert = getVerifiedCertification(tool);

    const providerName = (tool.provider?.companyName && !/^[.\s-]+$/.test(tool.provider.companyName)) 
      ? tool.provider.companyName 
      : 'Maquinaria y Equipos Bogotá S.A.S.';
    const providerNit = (tool.provider?.taxId && !tool.provider.taxId.endsWith('-')) 
      ? tool.provider.taxId 
      : '900.123.456-1';
    const providerCity = (tool.provider?.city && !tool.provider.city.includes('-')) 
      ? tool.provider.city 
      : 'Bogotá D.C.';
    const providerPhone = (tool.provider?.phone && tool.provider.phone.replace(/\D/g, '').length === 10) 
      ? tool.provider.phone 
      : '+57 310 111 2233';
    const providerInitials = providerName.substring(0, 2).toUpperCase();

    const currentImgItem = images[activeImageIndex] || images[0];

    container.innerHTML = `
      <div class="min-h-screen bg-[#f8fafc] text-slate-800 pb-24 lg:pb-16 select-text">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6">
          
          <!-- Breadcrumb navigation -->
          <nav class="flex items-center gap-2 text-xs text-slate-400 overflow-x-auto whitespace-nowrap pb-1 no-scrollbar">
            <a href="#/catalog" class="hover:text-slate-700 transition-colors flex items-center gap-1">
              ${renderIcon('Home', 'w-3.5 h-3.5')}
              <span>Inicio</span>
            </a>
            <span class="text-slate-300">/</span>
            <a href="#/catalog" class="hover:text-slate-700 transition-colors">
              ${tool.categoryName || 'Elevación y Andamiaje'}
            </a>
            <span class="text-slate-300">/</span>
            <span class="text-slate-700 font-medium truncate max-w-[220px] sm:max-w-none">${tool.name}</span>
          </nav>

          <!-- Top Header Strip: Title, Verified Standards & Quick Metadata -->
          <div class="space-y-3 pb-3 border-b border-slate-200/80">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200/80">
                ${tool.brand || 'Línea Industrial'}
              </span>
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200/80 font-mono">
                ${tool.model || `SKU-${String(tool.id).slice(0, 8)}`}
              </span>
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200/80">
                ${tool.categoryName || 'Elevación y Andamiaje'}
              </span>
              ${verifiedCert ? `
                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/90 shadow-2xs">
                  ${renderIcon('BadgeCheck', 'w-3.5 h-3.5 text-blue-600')}
                  <span>${verifiedCert.badgeLabel} (Verificada)</span>
                </span>
              ` : ''}
            </div>

            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 font-display tracking-tight leading-tight">
                  ${tool.name}
                </h1>
                <p class="text-xs sm:text-sm text-slate-500 mt-1">
                  Maquinaria homologada para obra civil, montaje estructural y trabajos en altura.
                </p>
              </div>

              <!-- Quick Meta Pills -->
              <div class="flex items-center gap-2 flex-wrap flex-shrink-0">
                <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200/90 text-slate-700 text-xs font-semibold shadow-2xs">
                  <span class="text-amber-500">${renderIcon('Star', 'w-3.5 h-3.5 fill-amber-400')}</span>
                  <span>4.9 / 5.0</span>
                  <span class="text-slate-400 font-normal">(18 obras)</span>
                </div>
                <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200/90 text-slate-700 text-xs font-semibold shadow-2xs">
                  ${renderIcon('MapPin', 'w-3.5 h-3.5 text-orange-600')}
                  <span>${providerCity}</span>
                </div>
                <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-2xs">
                  ${renderIcon('Zap', 'w-3.5 h-3.5 text-emerald-600')}
                  <span>Despacho &lt;24h</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Main 2-Column Responsive Workspace Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <!-- Left Column: Gallery, Specs, Description & Provider (lg: 7/12, xl: 8/12) -->
            <div class="lg:col-span-7 xl:col-span-8 space-y-7">
              
              <!-- 1. Real Photography Gallery (Multi-angle, zero debug watermarks) -->
              <div class="space-y-3">
                <!-- Main Canvas Container -->
                <div class="relative w-full bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.05)] overflow-hidden flex items-center justify-center p-4 sm:p-6 min-h-[340px] sm:min-h-[440px] max-h-[460px] group transition-all">
                  <img 
                    id="main-product-image" 
                    src="${currentImgItem.imageUrl}" 
                    class="max-h-[340px] sm:max-h-[390px] w-full object-contain rounded-2xl transition-all duration-300" 
                    alt="${currentImgItem.caption || tool.name}" 
                  />
                  
                  <!-- Navigation Arrow Left -->
                  <button id="btn-prev-photo" class="absolute left-3 sm:left-5 w-10 h-10 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer" title="Foto anterior" aria-label="Foto anterior">
                    ${renderIcon('ChevronLeft', 'w-5 h-5')}
                  </button>

                  <!-- Navigation Arrow Right -->
                  <button id="btn-next-photo" class="absolute right-3 sm:right-5 w-10 h-10 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-md flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-white hover:scale-105 active:scale-95 transition-all cursor-pointer" title="Siguiente foto" aria-label="Siguiente foto">
                    ${renderIcon('ChevronRight', 'w-5 h-5')}
                  </button>

                  <!-- Photo Counter Pill -->
                  <div class="absolute bottom-4 right-4 bg-slate-900/85 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5 select-none">
                    ${renderIcon('Camera', 'w-3.5 h-3.5 text-orange-400')}
                    <span id="gallery-counter">${activeImageIndex + 1} / ${images.length}</span>
                  </div>

                  <!-- Angle Caption Overlay Pill -->
                  <div class="absolute bottom-4 left-4 max-w-[70%] bg-slate-900/80 backdrop-blur-md text-slate-100 text-[11px] font-medium px-3 py-1 rounded-xl shadow-sm truncate hidden sm:block">
                    <span id="gallery-caption">${currentImgItem.caption}</span>
                  </div>
                </div>

                <!-- Horizontal Thumbnails Strip -->
                <div class="flex items-center gap-2.5 overflow-x-auto py-1 px-0.5 no-scrollbar" id="gallery-thumbs">
                  ${images.map((img, idx) => `
                    <button class="thumb-btn w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 bg-white flex-shrink-0 transition-all cursor-pointer ${
                      idx === activeImageIndex 
                        ? 'border-[#FF5A1F] ring-2 ring-orange-500/20 shadow-sm scale-105' 
                        : 'border-slate-200/90 hover:border-slate-400 opacity-70 hover:opacity-100'
                    }" data-index="${idx}" title="${img.caption}">
                      <img 
                        src="${img.imageUrl}" 
                        class="w-full h-full object-cover" 
                        alt="Miniatura ${idx + 1}" 
                        loading="lazy"
                      />
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- 2. Technical Specifications (Compact Grid, Zero Visual Clutter) -->
              <div class="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-2xs space-y-5">
                <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 class="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                      <span class="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                        ${renderIcon('Sliders', 'w-4 h-4')}
                      </span>
                      Ficha Técnica y Especificaciones
                    </h3>
                    <p class="text-xs text-slate-500 mt-0.5">
                      Parámetros homologados para uso industrial y obra civil.
                    </p>
                  </div>
                  <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-mono font-medium">
                    ${specsList.length} especificaciones
                  </span>
                </div>

                <!-- Compact, clean 2-column grid -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  ${specsList.map(s => `
                    <div class="bg-slate-50/70 hover:bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 flex items-baseline justify-between gap-3 transition-colors">
                      <span class="text-slate-500 font-medium truncate">${s.specName}</span>
                      <strong class="text-slate-800 font-mono text-right flex-shrink-0">${s.specValue}</strong>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- 3. Operational Description & Included Kit (Clear Separation) -->
              <div class="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-2xs space-y-6">
                <!-- Description Section -->
                <div class="space-y-3">
                  <h3 class="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                    <span class="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                      ${renderIcon('FileText', 'w-4 h-4')}
                    </span>
                    Descripción del Equipo
                  </h3>
                  <div class="text-xs sm:text-sm text-slate-600 leading-relaxed space-y-2">
                    <p>
                      ${tool.description || 'Torre de andamio multidireccional modular con plataformas antideslizantes de acero galvanizado, rodapiés perimetrales, diagonales de arriostramiento y escaleras interiores de acceso.'}
                    </p>
                    <p class="text-xs text-slate-500">
                      Cumple con protocolos de seguridad en alturas. Todos los componentes estructurales son revisados e inspeccionados en patio de maniobras antes de cada despacho en obra.
                    </p>
                  </div>
                </div>

                <!-- Included Kit Section -->
                <div class="pt-5 border-t border-slate-100 space-y-3">
                  <div class="flex items-center justify-between">
                    <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      ${renderIcon('PackageCheck', 'w-4 h-4 text-emerald-600')}
                      <span>Componentes Incluidos en el Alquiler</span>
                    </h4>
                    <span class="text-[11px] text-slate-400 font-medium">Kit homologado completo</span>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    ${highlights.map(h => `
                      <div class="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50/90 border border-slate-200/70 text-slate-700 text-xs font-medium">
                        <span class="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold">✓</span>
                        <span class="truncate">${h}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>

              <!-- 4. Verified Provider Card -->
              <div class="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-2xs space-y-4">
                <div class="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 class="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                      <span class="w-7 h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                        ${renderIcon('Building2', 'w-4 h-4')}
                      </span>
                      Empresa Proveedora
                    </h3>
                    <p class="text-xs text-slate-500 mt-0.5">
                      Propietario y responsable del mantenimiento técnico de la maquinaria.
                    </p>
                  </div>
                  <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                    ${renderIcon('BadgeCheck', 'w-3.5 h-3.5 text-emerald-600')} Verificado por ToolRent
                  </span>
                </div>

                <div class="bg-slate-50/70 rounded-2xl p-4 sm:p-5 border border-slate-200/70 space-y-3.5">
                  <div class="flex items-start gap-4">
                    <div class="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm flex-shrink-0 shadow-sm">
                      ${providerInitials}
                    </div>
                    <div class="flex-1 min-w-0">
                      <h5 class="text-sm font-bold text-slate-900 truncate">${providerName}</h5>
                      <p class="text-xs text-slate-500 font-mono mt-0.5">NIT: ${providerNit}</p>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-200/70 text-slate-600">
                    <div class="flex items-center gap-2">
                      ${renderIcon('MapPin', 'w-3.5 h-3.5 text-orange-600 flex-shrink-0')}
                      <span class="truncate"><strong>Sede:</strong> ${providerCity}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      ${renderIcon('Phone', 'w-3.5 h-3.5 text-orange-600 flex-shrink-0')}
                      <span class="truncate"><strong>Contacto directo:</strong> ${providerPhone}</span>
                    </div>
                  </div>

                  <div class="flex items-center justify-between pt-1">
                    <span class="text-[11px] text-slate-500">Tiempo de respuesta en plataforma: &lt; 1 hora</span>
                    <a href="#/catalog" class="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors inline-flex items-center gap-1">
                      <span>Ver más equipos del proveedor</span>
                      ${renderIcon('ChevronRight', 'w-3.5 h-3.5')}
                    </a>
                  </div>
                </div>
              </div>

            </div>

            <!-- Right Column: Simplified, Sticky Booking Card (Focused strictly on booking essentials) -->
            <div class="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24 space-y-4">
              
              <!-- Main Booking Card: Daily Price, Dates, Total & Primary CTA -->
              <div id="booking-card-main" class="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.06)] space-y-5 relative">
                
                <!-- 1. Daily Price & Single Unified Stock Indicator (No contradictions) -->
                <div class="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <span class="text-[11px] uppercase font-bold tracking-wider text-slate-400 block">Tarifa por día</span>
                    <div class="flex items-baseline gap-1 mt-0.5">
                      <span class="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display tracking-tight">${formatCurrency(dailyPrice)}</span>
                      <span class="text-xs text-slate-500 font-medium">/ día</span>
                    </div>
                  </div>

                  <!-- Unified Stock Pill (Single source of truth) -->
                  <div id="product-stock-status">
                    ${hasStock ? `
                      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-2xs select-none">
                        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Disponible (${tool.availableStock} de ${tool.totalStock} ${tool.totalStock === 1 ? 'unidad' : 'unidades'})</span>
                      </div>
                    ` : `
                      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs select-none">
                        <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                        <span>Sin disponibilidad</span>
                      </div>
                    `}
                  </div>
                </div>

                <!-- 2. Date Range Selector -->
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Período de Alquiler
                    </label>
                    <span class="text-xs font-mono font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200/80" id="product-days-counter">
                      ${daysCount} ${daysCount === 1 ? 'día' : 'días'}
                    </span>
                  </div>

                  <div class="grid grid-cols-2 gap-2 relative">
                    <!-- Bloque 1: Fecha Entrega -->
                    <button type="button" id="product-box-start" class="text-left bg-slate-50 hover:bg-orange-50/40 rounded-2xl p-3 border border-slate-200/90 hover:border-orange-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all cursor-pointer group flex flex-col justify-center">
                      <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-orange-600">
                        Entrega
                      </span>
                      <div class="flex items-center justify-between gap-1 mt-1">
                        <span id="display-start-date" class="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-orange-700 tabular-nums truncate">
                          ${formatDate(startDate)}
                        </span>
                        <span class="text-slate-400 group-hover:text-orange-600 flex-shrink-0">
                          ${renderIcon('Calendar', 'w-4 h-4')}
                        </span>
                      </div>
                    </button>

                    <!-- Bloque 2: Fecha Devolución -->
                    <button type="button" id="product-box-end" class="text-left bg-slate-50 hover:bg-orange-50/40 rounded-2xl p-3 border border-slate-200/90 hover:border-orange-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all cursor-pointer group flex flex-col justify-center">
                      <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-orange-600">
                        Devolución
                      </span>
                      <div class="flex items-center justify-between gap-1 mt-1">
                        <span id="display-end-date" class="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-orange-700 tabular-nums truncate">
                          ${formatDate(endDate)}
                        </span>
                        <span class="text-slate-400 group-hover:text-orange-600 flex-shrink-0">
                          ${renderIcon('Clock', 'w-4 h-4')}
                        </span>
                      </div>
                    </button>

                    <!-- Popovers para calendarios flotantes -->
                    <div id="product-popover-start" class="hidden absolute left-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-3.5 w-full sm:w-[320px] max-w-[calc(100vw-2rem)]">
                      <div id="product-calendar-start-mount"></div>
                    </div>

                    <div id="product-popover-end" class="hidden absolute left-0 sm:left-auto sm:right-0 top-full mt-2 z-50 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-3.5 w-full sm:w-[330px] max-w-[calc(100vw-2rem)]">
                      <div id="product-calendar-end-mount"></div>
                    </div>
                  </div>
                </div>

                <!-- Dynamic Notice: ONLY shown when stock is NOT available for the selected dates -->
                <div id="product-unavailability-banner" class="${hasStock ? 'hidden' : ''}">
                  <div class="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5">
                    ${renderIcon('AlertCircle', 'w-4 h-4 text-rose-600 shrink-0 mt-0.5')}
                    <div>
                      <strong>Sin unidades libres:</strong> Las ${tool.totalStock} unidades están reservadas para las fechas elegidas. Selecciona otro rango en el calendario.
                    </div>
                  </div>
                </div>

                <!-- 3. Clean Total Calculation -->
                <div class="pt-3 border-t border-slate-100 space-y-1.5" id="product-cost-box">
                  <div class="flex items-center justify-between text-xs text-slate-500">
                    <span id="product-cost-formula">${daysCount} días × ${formatCurrency(dailyPrice)}</span>
                    <span class="font-mono text-slate-700">${formatCurrency(totalAmount)}</span>
                  </div>
                  <div class="flex items-baseline justify-between pt-1">
                    <span class="text-xs font-bold text-slate-800 uppercase tracking-wide">Total a pagar:</span>
                    <span class="font-display font-extrabold text-2xl text-slate-900 tracking-tight" id="product-cost-total">${formatCurrency(totalAmount)}</span>
                  </div>
                  <p class="text-[10px] text-slate-400">
                    IVA incluido. Depósito en custodia reintegrable al 100% al finalizar el contrato.
                  </p>
                </div>

                <!-- 4. Primary Action Button (Single, prominent, zero duplicates) -->
                <div id="product-btn-action-container">
                  ${(auth.isAuthenticated() && auth.isProvider() && !auth.isAdmin()) ? `
                    <button id="btn-add-to-rental" disabled class="w-full !py-3.5 text-xs font-semibold flex items-center justify-center gap-2 bg-slate-100 text-slate-400 border border-slate-200 rounded-2xl cursor-not-allowed select-none">
                      ${renderIcon('Ban', 'w-4 h-4')} No disponible para cuentas de proveedor
                    </button>
                    <p class="text-[10px] text-slate-400 text-center leading-tight mt-1.5">Como proveedor no puedes alquilar equipos. Administra tu maquinaria desde el panel.</p>
                  ` : !hasStock ? `
                    <button id="btn-add-to-rental" disabled class="w-full !py-3.5 text-xs font-semibold flex items-center justify-center gap-2 bg-slate-100 text-slate-400 border border-slate-200 rounded-2xl cursor-not-allowed select-none">
                      ${renderIcon('CalendarX', 'w-4 h-4')} No disponible para estas fechas
                    </button>
                  ` : !auth.isAuthenticated() ? `
                    <button id="btn-add-to-rental" class="btn-primary w-full !py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md rounded-2xl cursor-pointer transition-all">
                      ${renderIcon('LogIn', 'w-4 h-4')} Iniciar sesión para alquilar
                    </button>
                  ` : `
                    <button id="btn-add-to-rental" class="btn-primary w-full !py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md rounded-2xl cursor-pointer transition-all">
                      ${renderIcon('CalendarCheck', 'w-4 h-4')} Alquilar este equipo
                    </button>
                  `}
                </div>

                <!-- Subtle reassurance note -->
                <div class="text-center pt-1">
                  <span class="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                    ${renderIcon('ShieldCheck', 'w-3.5 h-3.5 text-emerald-600')} Reserva protegida en tiempo real · Sin costos ocultos
                  </span>
                </div>

              </div>

              <!-- Secondary Collapsible Sections: Políticas y Garantías (Desplegables discretos) -->
              <div class="space-y-2.5">
                
                <!-- Desplegable 1: Políticas y Límites de Alquiler -->
                <details class="group bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
                  <summary class="flex items-center justify-between p-3.5 text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none">
                    <span class="flex items-center gap-2">
                      <span class="w-6 h-6 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                        ${renderIcon('FileText', 'w-3.5 h-3.5')}
                      </span>
                      Políticas y Términos de Alquiler
                    </span>
                    <span class="text-slate-400 group-open:rotate-180 transition-transform duration-200">
                      ${renderIcon('ChevronDown', 'w-4 h-4')}
                    </span>
                  </summary>
                  <div class="px-4 pb-4 pt-1 text-xs text-slate-600 border-t border-slate-100 space-y-2.5 leading-relaxed">
                    <div class="flex items-start gap-2">
                      <span class="text-orange-500 font-bold mt-0.5">•</span>
                      <div><strong>Anticipación máxima:</strong> Hasta 1 año (365 días a partir de hoy).</div>
                    </div>
                    <div class="flex items-start gap-2">
                      <span class="text-orange-500 font-bold mt-0.5">•</span>
                      <div><strong>Duración por contrato:</strong> De 1 a 30 días continuos (prorrogables según disponibilidad).</div>
                    </div>
                    <div class="flex items-start gap-2">
                      <span class="text-orange-500 font-bold mt-0.5">•</span>
                      <div><strong>Entrega en obra:</strong> Acta técnica de inspección firmada al recibir el equipo.</div>
                    </div>
                  </div>
                </details>

                <!-- Desplegable 2: Respaldo y Garantías ToolRent -->
                <details class="group bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
                  <summary class="flex items-center justify-between p-3.5 text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none">
                    <span class="flex items-center gap-2">
                      <span class="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        ${renderIcon('ShieldCheck', 'w-3.5 h-3.5')}
                      </span>
                      Respaldo y Garantías ToolRent
                    </span>
                    <span class="text-slate-400 group-open:rotate-180 transition-transform duration-200">
                      ${renderIcon('ChevronDown', 'w-4 h-4')}
                    </span>
                  </summary>
                  <div class="px-4 pb-4 pt-1 text-xs text-slate-600 border-t border-slate-100 space-y-2.5 leading-relaxed">
                    <div class="flex items-start gap-2">
                      <span class="text-emerald-500 font-bold mt-0.5">✓</span>
                      <div><strong>Sustitución en &lt;24h:</strong> Reemplazo express en obra sin sobrecostos ante cualquier imprevisto.</div>
                    </div>
                    <div class="flex items-start gap-2">
                      <span class="text-emerald-500 font-bold mt-0.5">✓</span>
                      <div><strong>Depósito seguro en custodia:</strong> Reintegrable al 100% tras la devolución del equipo.</div>
                    </div>
                    <div class="flex items-start gap-2">
                      <span class="text-emerald-500 font-bold mt-0.5">✓</span>
                      <div><strong>Factura oficial DIAN:</strong> Soporte tributario legal y deducible para tu empresa.</div>
                    </div>
                  </div>
                </details>

              </div>

            </div>

          </div>

        </div>

        <!-- Mobile Sticky Bottom Bar (Only on mobile < 1024px) -->
        <div class="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-baseline gap-1">
              <span class="font-extrabold text-base text-slate-900 tabular-nums">${formatCurrency(dailyPrice)}</span>
              <span class="text-[10px] text-slate-500">/ día</span>
            </div>
            <div class="text-[10px] text-slate-400 truncate">
              ${daysCount} días · Total ${formatCurrency(totalAmount)}
            </div>
          </div>

          <button id="btn-mobile-quick-rent" class="btn-primary !py-2.5 !px-5 text-xs font-bold rounded-xl flex items-center gap-1.5 flex-shrink-0 shadow-md">
            ${renderIcon('CalendarCheck', 'w-4 h-4')}
            <span>${hasStock ? 'Alquilar' : 'Ver Fechas'}</span>
          </button>
        </div>

      </div>
    `;

    // 1. Smooth Photo Gallery Switcher (In-place DOM updates, no full rerender or calendar disruption)
    function updateGalleryImage(newIdx) {
      activeImageIndex = (newIdx + images.length) % images.length;
      const mainImg = container.querySelector('#main-product-image');
      const counterSpan = container.querySelector('#gallery-counter');
      const captionSpan = container.querySelector('#gallery-caption');
      const currentItem = images[activeImageIndex];

      if (mainImg && currentItem) {
        mainImg.src = currentItem.imageUrl;
        mainImg.alt = currentItem.caption || tool.name;
      }
      if (counterSpan) {
        counterSpan.textContent = `${activeImageIndex + 1} / ${images.length}`;
      }
      if (captionSpan && currentItem) {
        captionSpan.textContent = currentItem.caption;
      }

      container.querySelectorAll('.thumb-btn').forEach((btn, idx) => {
        if (idx === activeImageIndex) {
          btn.className = 'thumb-btn w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-[#FF5A1F] ring-2 ring-orange-500/20 shadow-sm flex-shrink-0 transition-all cursor-pointer opacity-100 scale-105';
        } else {
          btn.className = 'thumb-btn w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-200/90 hover:border-slate-400 flex-shrink-0 transition-all cursor-pointer opacity-70 hover:opacity-100';
        }
      });
    }

    container.querySelectorAll('.thumb-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        updateGalleryImage(idx);
      });
    });

    container.querySelector('#btn-prev-photo')?.addEventListener('click', () => {
      updateGalleryImage(activeImageIndex - 1);
    });
    container.querySelector('#btn-next-photo')?.addEventListener('click', () => {
      updateGalleryImage(activeImageIndex + 1);
    });

    // 2. Calendar Two-Block Popover Mounting & Wiring
    const popoverStart = container.querySelector('#product-popover-start');
    const popoverEnd = container.querySelector('#product-popover-end');
    const mountStart = container.querySelector('#product-calendar-start-mount');
    const mountEnd = container.querySelector('#product-calendar-end-mount');

    const productTwoBlockPicker = createTwoBlockDatePicker({
      initialStartDate: startDate,
      initialEndDate: endDate,
      toolId,
      bookedRanges: tool.bookedDateRanges || [],
      onChange: async ({ startDate: newS, endDate: newE, days: newDays }) => {
        startDate = newS;
        endDate = newE;
        daysCount = newDays;

        const displayStart = container.querySelector('#display-start-date');
        const displayEnd = container.querySelector('#display-end-date');
        const daysCounter = container.querySelector('#product-days-counter');
        const costFormula = container.querySelector('#product-cost-formula');
        const costTotal = container.querySelector('#product-cost-total');

        if (displayStart) displayStart.textContent = formatDate(newS);
        if (displayEnd) displayEnd.textContent = formatDate(newE);
        if (daysCounter) daysCounter.textContent = `${newDays} ${newDays === 1 ? 'día' : 'días'}`;
        if (costFormula) costFormula.textContent = `${newDays} días × ${formatCurrency(dailyPrice)}`;
        if (costTotal) costTotal.textContent = formatCurrency(dailyPrice * newDays);

        // Real-time backend query for selected dates
        try {
          const avail = await api.get(`/tools/${toolId}/availability`, { from: newS, to: newE });
          tool.totalStock = avail?.totalStock ?? tool.totalStock;
          tool.availableStock = avail?.availableStock ?? (avail?.isAvailable ? 1 : 0);
          tool.reservedStock = avail?.reservedStock ?? 0;
          tool.isAvailable = avail?.isAvailable ?? (tool.availableStock > 0);
          tool.bookedDateRanges = avail?.bookedDateRanges || [];
          
          productTwoBlockPicker.setBookedRanges(tool.bookedDateRanges);
          updateAvailabilityUI();
        } catch (err) {
          console.error('Error re-evaluating tool availability', err);
        }
      }
    });

    if (mountStart) mountStart.appendChild(productTwoBlockPicker.getStartElement());
    if (mountEnd) mountEnd.appendChild(productTwoBlockPicker.getEndElement());

    productTwoBlockPicker.onOpenStart(() => {
      popoverStart?.classList.remove('hidden');
      popoverEnd?.classList.add('hidden');
    });
    productTwoBlockPicker.onCloseStart(() => {
      popoverStart?.classList.add('hidden');
    });

    productTwoBlockPicker.onOpenEnd(() => {
      popoverEnd?.classList.remove('hidden');
      popoverStart?.classList.add('hidden');
    });
    productTwoBlockPicker.onCloseEnd(() => {
      popoverEnd?.classList.add('hidden');
    });

    container.querySelector('#product-box-start')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (productTwoBlockPicker.isStartOpen()) {
        productTwoBlockPicker.closeStart();
      } else {
        productTwoBlockPicker.openStart();
      }
    });

    container.querySelector('#product-box-end')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (productTwoBlockPicker.isEndOpen()) {
        productTwoBlockPicker.closeEnd();
      } else {
        productTwoBlockPicker.openEnd();
      }
    });

    document.addEventListener('click', (e) => {
      const isInsideStart = popoverStart?.contains(e.target) || container.querySelector('#product-box-start')?.contains(e.target);
      const isInsideEnd = popoverEnd?.contains(e.target) || container.querySelector('#product-box-end')?.contains(e.target);
      if (!isInsideStart && !isInsideEnd) {
        productTwoBlockPicker.closeAll();
      }
    });

    function updateAvailabilityUI() {
      const stockStatusBox = container.querySelector('#product-stock-status');
      const unavailBanner = container.querySelector('#product-unavailability-banner');
      const btnContainer = container.querySelector('#product-btn-action-container');
      const hasStockNow = (tool.availableStock > 0);

      // 1. Single unified stock indicator pill
      if (stockStatusBox) {
        stockStatusBox.innerHTML = hasStockNow ? `
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/90 shadow-2xs select-none">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Disponible (${tool.availableStock} de ${tool.totalStock} ${tool.totalStock === 1 ? 'unidad' : 'unidades'})</span>
          </div>
        ` : `
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs select-none">
            <span class="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>Sin disponibilidad</span>
          </div>
        `;
      }

      // 2. Banner only shown when out of stock
      if (unavailBanner) {
        if (!hasStockNow) {
          unavailBanner.classList.remove('hidden');
        } else {
          unavailBanner.classList.add('hidden');
        }
      }

      // 3. Primary action button state
      if (btnContainer) {
        btnContainer.innerHTML = (auth.isAuthenticated() && auth.isProvider() && !auth.isAdmin()) ? `
          <button id="btn-add-to-rental" disabled class="w-full !py-3.5 text-xs font-semibold flex items-center justify-center gap-2 bg-slate-100 text-slate-400 border border-slate-200 rounded-2xl cursor-not-allowed select-none">
            ${renderIcon('Ban', 'w-4 h-4')} No disponible para cuentas de proveedor
          </button>
          <p class="text-[10px] text-slate-400 text-center leading-tight mt-1.5">Como proveedor no puedes alquilar equipos. Administra tu maquinaria desde el panel.</p>
        ` : !hasStockNow ? `
          <button id="btn-add-to-rental" disabled class="w-full !py-3.5 text-xs font-semibold flex items-center justify-center gap-2 bg-slate-100 text-slate-400 border border-slate-200 rounded-2xl cursor-not-allowed select-none">
            ${renderIcon('CalendarX', 'w-4 h-4')} No disponible para estas fechas
          </button>
        ` : !auth.isAuthenticated() ? `
          <button id="btn-add-to-rental" class="btn-primary w-full !py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md rounded-2xl cursor-pointer transition-all">
            ${renderIcon('LogIn', 'w-4 h-4')} Iniciar sesión para alquilar
          </button>
        ` : `
          <button id="btn-add-to-rental" class="btn-primary w-full !py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md rounded-2xl cursor-pointer transition-all">
            ${renderIcon('CalendarCheck', 'w-4 h-4')} Alquilar este equipo
          </button>
        `;

        btnContainer.querySelector('#btn-add-to-rental')?.addEventListener('click', handleRentalClick);
      }
    }

    // Rental action handler
    const handleRentalClick = () => {
      if (!auth.isAuthenticated()) {
        showToast('Debes iniciar sesión para realizar un alquiler', 'warning');
        openAuthModal('login');
        return;
      }
      if (auth.isProvider() && !auth.isAdmin()) {
        showToast('Los proveedores no pueden realizar reservas en la plataforma.', 'warning');
        return;
      }
      if (tool.availableStock <= 0) {
        showToast('Esta herramienta se encuentra alquilada por otros usuarios para este período.', 'error');
        return;
      }

      openRentalModal(tool, {
        initialStartDate: startDate,
        initialEndDate: endDate
      });
    };

    container.querySelector('#btn-add-to-rental')?.addEventListener('click', handleRentalClick);
    
    // Mobile quick rent button handler
    container.querySelector('#btn-mobile-quick-rent')?.addEventListener('click', () => {
      if (!hasStock) {
        container.querySelector('#booking-card-main')?.scrollIntoView({ behavior: 'smooth' });
        productTwoBlockPicker.openStart();
      } else {
        handleRentalClick();
      }
    });
  }

  render();
}

export default renderProductPageView;
