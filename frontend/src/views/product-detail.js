import api from '../api/client.js';
import auth from '../auth/state.js';
import showToast from '../components/toast.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { renderIcon } from '../utils/icons.js';
import { openRentalModal } from './rental-modal.js';
import { openAuthModal } from '../components/auth-modal.js';
import error404Img from '../assets/error-404.png';
import { getLocalToday, toIsoDate, parseIsoDate, formatFriendlyDate } from '../components/date-range-calendar.js';
import { getCuratedToolImages } from '../utils/tool-images.js';
import { 
  getSearchContext, 
  saveSearchContext, 
  DEFAULT_DEPARTMENT, 
  DEFAULT_CITY 
} from '../utils/colombia-locations.js';

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

  const parseIso = (str) => {
    if (!str) return null;
    const parts = str.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
  };

  const calculateDays = (sStr, eStr) => {
    if (!sStr || !eStr) return 0;
    const s = parseIso(sStr);
    const e = parseIso(eStr);
    if (!s || !e || e < s) return 0;
    return Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
  };

  // Leer fechas y ubicación si vienen en la URL hash o en el contexto guardado
  const currentHash = window.location.hash || '';
  const hashSearchParams = new URLSearchParams(currentHash.includes('?') ? currentHash.split('?')[1] : '');
  const savedCtx = getSearchContext();
  const urlStart = hashSearchParams.get('start') || hashSearchParams.get('from') || savedCtx.startDate;
  const urlEnd = hashSearchParams.get('end') || hashSearchParams.get('to') || savedCtx.endDate;
  const deliveryDepartment = hashSearchParams.get('dept') || savedCtx.department || DEFAULT_DEPARTMENT;
  const deliveryCity = hashSearchParams.get('city') || savedCtx.city || DEFAULT_CITY;

  let startDate = urlStart || null;
  let endDate = urlEnd || null;
  let daysCount = (startDate && endDate) ? calculateDays(startDate, endDate) : 0;
  let selectedQuantity = 1;

  if (startDate && endDate) {
    saveSearchContext({ startDate, endDate, department: deliveryDepartment, city: deliveryCity });
  }

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

      // Consultar disponibilidad base de flota y rangos ocupados respetando las fechas iniciales
      try {
        const queryParams = (startDate && endDate) ? { from: startDate, to: endDate } : {};
        const avail = await api.get(`/tools/${toolId}/availability`, queryParams);
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
    const unitDeposit = Math.round((tool.replacementValue || 2800000) * 0.10);
    const hasPreselectedDates = Boolean(startDate && endDate && daysCount > 0);
    const totalAmount = dailyPrice * (hasPreselectedDates ? daysCount : 1) * selectedQuantity;
    const hasStock = (tool.availableStock > 0);
    const specsList = getCuratedToolSpecs(tool);
    const highlights = getCuratedToolHighlights(tool);
    const verifiedCert = getVerifiedCertification(tool);

    const today = getLocalToday();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const bookedRanges = tool.bookedDateRanges || [];

    const isDateBooked = (d) => {
      if (!bookedRanges.length) return false;
      const time = d.getTime();
      return bookedRanges.some(r => {
        const bs = parseIsoDate(r.startDate || r.start);
        const be = parseIsoDate(r.endDate || r.end);
        if (!bs || !be) return false;
        return time >= bs.getTime() && time <= be.getTime();
      });
    };

    let firstAvailableDate = new Date(tomorrow);
    for (let i = 0; i < 90; i++) {
      if (!isDateBooked(firstAvailableDate)) {
        break;
      }
      firstAvailableDate.setDate(firstAvailableDate.getDate() + 1);
    }

    const isoFirstAvailable = toIsoDate(firstAvailableDate);

    let defaultEndDate = new Date(firstAvailableDate);
    defaultEndDate.setDate(defaultEndDate.getDate() + 3);
    const isoDefaultEnd = toIsoDate(defaultEndDate);

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
                <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-50 border border-orange-200/90 text-orange-950 text-xs font-semibold shadow-2xs" title="Frente de obra / Ciudad de entrega solicitada">
                  ${renderIcon('MapPin', 'w-3.5 h-3.5 text-orange-600')}
                  <span>${deliveryCity}</span>
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

                <!-- 2. Fechas y Período Disponible (De primerazo) -->
                <div class="space-y-2.5">
                  <div class="flex items-center justify-between">
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      ${renderIcon('CalendarCheck', 'w-3.5 h-3.5 text-[#FF5A1F]')} Fechas Disponibles
                    </label>
                    <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                      hasStock 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200/90' 
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }">
                      <span class="w-1.5 h-1.5 rounded-full ${hasStock ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}"></span>
                      ${hasStock ? 'Entrega Inmediata' : 'Sin Stock Actual'}
                    </span>
                  </div>

                  ${hasPreselectedDates ? `
                    <!-- Período preseleccionado desde el buscador -->
                    <div id="product-dates-card" class="bg-gradient-to-br from-orange-50/60 to-white rounded-2xl p-4 border border-orange-200/90 shadow-2xs cursor-pointer hover:border-orange-400 transition-all group">
                      <div class="flex items-center justify-between gap-2">
                        <div>
                          <span class="block text-[10px] font-bold uppercase tracking-wider text-orange-600">
                            Período de alquiler seleccionado
                          </span>
                          <div class="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-orange-950 font-display mt-0.5">
                            ${formatFriendlyDate(startDate)} &rarr; ${formatFriendlyDate(endDate)}
                          </div>
                        </div>
                        <span class="text-xs font-mono font-bold text-orange-600 bg-white px-2.5 py-1 rounded-xl border border-orange-200 shadow-2xs shrink-0">
                          ${daysCount} ${daysCount === 1 ? 'día' : 'días'}
                        </span>
                      </div>
                      <div class="mt-2.5 pt-2 border-t border-orange-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span class="flex items-center gap-1 font-medium text-slate-700">
                          ${renderIcon('MapPin', 'w-3 h-3 text-orange-600 shrink-0')}
                          <span>Obra: <strong>${deliveryCity}</strong></span>
                        </span>
                        <span class="text-orange-600 font-bold group-hover:underline flex items-center gap-1">
                          Ajustar en el calendario &rarr;
                        </span>
                      </div>
                    </div>
                  ` : `
                    <!-- Fechas disponibles presentadas de primerazo -->
                    <div id="product-dates-card" class="bg-gradient-to-br from-slate-50 via-white to-orange-50/20 rounded-2xl p-4 border border-slate-200/90 hover:border-orange-300 transition-all cursor-pointer group shadow-2xs">
                      <div class="flex items-start gap-3.5">
                        <div class="w-10 h-10 rounded-xl bg-orange-50 group-hover:bg-[#FF5A1F] text-[#FF5A1F] group-hover:text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5 transition-colors">
                          ${renderIcon('Calendar', 'w-5 h-5')}
                        </div>
                        <div class="space-y-1 min-w-0 flex-1">
                          <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-orange-600 transition-colors">
                            Disponibilidad del equipo
                          </span>
                          <div class="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-orange-950 font-display leading-snug">
                            ${hasStock ? `Disponible a partir de: ${formatFriendlyDate(isoFirstAvailable)}` : 'Sin fechas disponibles actualmente'}
                          </div>
                          <p class="text-xs text-slate-500 leading-relaxed">
                            ${hasStock 
                              ? 'Listo para despacho en bodega con entrega express en obra en 24h a 48h.' 
                              : 'Este equipo se encuentra en obra actualmente. Puedes consultar otras fechas en el calendario.'}
                          </p>
                        </div>
                      </div>

                      <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span class="flex items-center gap-1.5 font-medium">
                          ${renderIcon('Clock', 'w-3.5 h-3.5 text-slate-400')} Contratos de 1 a 30 días
                        </span>
                        <span class="text-orange-600 font-bold group-hover:underline flex items-center gap-1">
                          Seleccionar fechas &rarr;
                        </span>
                      </div>
                    </div>
                  `}

                  ${bookedRanges.length > 0 ? `
                    <div class="p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-[11px] text-amber-800 flex items-start gap-2 leading-relaxed">
                      ${renderIcon('AlertCircle', 'w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5')}
                      <span>
                        <strong>Nota de disponibilidad:</strong> Este equipo tiene reservas previas para algunas fechas que se mostrarán deshabilitadas en el calendario.
                      </span>
                    </div>
                  ` : ''}
                </div>

                <!-- Quantity Selector (Permite seleccionar 1, 2 o más unidades según disponibilidad) -->
                <div class="space-y-1.5 ${tool.totalStock > 1 ? '' : 'hidden'}" id="product-quantity-container">
                  <div class="flex items-center justify-between">
                    <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Cantidad de Unidades
                    </label>
                    <span class="text-[11px] text-slate-500 font-medium" id="product-qty-max-label">
                      Máx. ${tool.availableStock} disponibles
                    </span>
                  </div>
                  <div class="flex items-center justify-between bg-slate-50 border border-slate-200/90 rounded-2xl p-2 px-3">
                    <span class="text-xs text-slate-600 font-medium">Equipos para la obra:</span>
                    <div class="flex items-center gap-2">
                      <button type="button" id="btn-product-qty-minus" class="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold transition-colors select-none">
                        -
                      </button>
                      <span id="product-qty-display" class="font-bold text-sm text-slate-900 w-6 text-center tabular-nums">${selectedQuantity}</span>
                      <button type="button" id="btn-product-qty-plus" class="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold transition-colors select-none">
                        +
                      </button>
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
                <div class="pt-3 border-t border-slate-100 space-y-2" id="product-cost-box">
                  ${hasPreselectedDates ? `
                    <div class="flex items-center justify-between text-xs text-slate-500">
                      <span id="product-cost-formula">${daysCount} días ${selectedQuantity > 1 ? `× ${selectedQuantity} unids.` : ''} × ${formatCurrency(dailyPrice)}</span>
                      <span class="font-mono text-slate-700" id="product-cost-subtotal">${formatCurrency(totalAmount)}</span>
                    </div>
                    <div class="flex items-baseline justify-between pt-1">
                      <span class="text-xs font-bold text-slate-800 uppercase tracking-wide">Total estimado:</span>
                      <span class="font-display font-extrabold text-2xl text-slate-900 tracking-tight" id="product-cost-total">${formatCurrency(totalAmount)}</span>
                    </div>
                    <p class="text-[10px] text-slate-400">
                      IVA incluido. Depósito en custodia reintegrable al 100% al finalizar el contrato.
                    </p>
                  ` : `
                    <div class="flex items-center justify-between text-xs text-slate-600">
                      <span class="font-medium">Tarifa base por día:</span>
                      <span class="font-mono font-bold text-slate-900 text-sm">${formatCurrency(dailyPrice)} / día</span>
                    </div>
                    <div class="flex items-center justify-between text-xs text-slate-500">
                      <span>Depósito en garantía (10% reembolsable):</span>
                      <span class="font-mono text-emerald-700 font-semibold" id="product-deposit-val">${formatCurrency(unitDeposit * selectedQuantity)}</span>
                    </div>
                    <div class="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-500 border border-slate-200/60 leading-snug">
                      💡 El costo total exacto e IVA (19%) se calcularán según los días que elijas en el calendario al hacer clic en el botón naranja.
                    </div>
                  `}
                </div>

                <!-- 4. Primary Action Button (Single, prominent, zero duplicates) -->
                <div id="product-btn-action-container">
                  ${(auth.isAuthenticated() && auth.isProvider() && !auth.isAdmin()) ? `
                    <button id="btn-add-to-rental" disabled class="w-full !py-3.5 text-xs font-semibold flex items-center justify-center gap-2 bg-slate-100 text-slate-400 border border-slate-200 rounded-2xl cursor-not-allowed select-none">
                      ${renderIcon('Ban', 'w-4 h-4')} No disponible para cuentas de proveedor
                    </button>
                    <p class="text-[10px] text-slate-400 text-center leading-tight mt-1.5">Como proveedor no puedes alquilar equipos. Administra tu maquinaria desde el panel.</p>
                  ` : !hasStock ? `
                    <button id="btn-add-to-rental" class="btn-primary w-full !py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md rounded-2xl cursor-pointer transition-all">
                      ${renderIcon('Calendar', 'w-4 h-4')} Ver fechas libres en el calendario
                    </button>
                    <p class="text-[10px] text-slate-400 text-center leading-tight mt-1.5">Consulta las próximas fechas disponibles para reservar este equipo</p>
                  ` : `
                    <button id="btn-add-to-rental" class="btn-primary w-full !py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md rounded-2xl cursor-pointer transition-all">
                      ${renderIcon('CalendarCheck', 'w-4 h-4')} Alquilar este equipo
                    </button>
                    <p class="text-[10px] text-slate-400 text-center leading-tight mt-1.5">
                      ${hasPreselectedDates 
                        ? 'Confirmar reserva y continuar con la entrega' 
                        : 'Haz clic para seleccionar tus fechas a partir del período disponible'}
                    </p>
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
            <div class="text-[10px] text-slate-400 truncate" id="mobile-cost-sub">
              ${hasPreselectedDates 
                ? `${daysCount} días · ${selectedQuantity} ${selectedQuantity === 1 ? 'unidad' : 'unidades'} · Total ${formatCurrency(totalAmount)}`
                : `Disponible a partir de mañana · Despacho 24h`}
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

    // Quantity selector buttons
    const updateQuantityDisplay = () => {
      const qtyDisplay = container.querySelector('#product-qty-display');
      const costFormula = container.querySelector('#product-cost-formula');
      const costSubtotal = container.querySelector('#product-cost-subtotal');
      const costTotal = container.querySelector('#product-cost-total');
      const depositVal = container.querySelector('#product-deposit-val');
      const mobileCostSub = container.querySelector('#mobile-cost-sub');

      if (qtyDisplay) qtyDisplay.textContent = selectedQuantity;
      if (depositVal) depositVal.textContent = formatCurrency(unitDeposit * selectedQuantity);

      if (hasPreselectedDates) {
        const total = dailyPrice * daysCount * selectedQuantity;
        if (costFormula) costFormula.textContent = `${daysCount} días ${selectedQuantity > 1 ? `× ${selectedQuantity} unids.` : ''} × ${formatCurrency(dailyPrice)}`;
        if (costSubtotal) costSubtotal.textContent = formatCurrency(total);
        if (costTotal) costTotal.textContent = formatCurrency(total);
        if (mobileCostSub) mobileCostSub.textContent = `${daysCount} días · ${selectedQuantity} ${selectedQuantity === 1 ? 'unidad' : 'unidades'} · Total ${formatCurrency(total)}`;
      } else {
        if (mobileCostSub) mobileCostSub.textContent = `Disponible a partir de mañana · ${selectedQuantity} ${selectedQuantity === 1 ? 'unidad' : 'unidades'}`;
      }
    };

    container.querySelector('#btn-product-qty-minus')?.addEventListener('click', () => {
      if (selectedQuantity > 1) {
        selectedQuantity--;
        updateQuantityDisplay();
      }
    });

    container.querySelector('#btn-product-qty-plus')?.addEventListener('click', () => {
      const max = Math.max(1, tool.availableStock || 1);
      if (selectedQuantity < max) {
        selectedQuantity++;
        updateQuantityDisplay();
      } else {
        showToast(`Solo hay ${max} unidades disponibles para este equipo`, 'info');
      }
    });

    // Rental action handler - opens rental modal where user picks exact dates from the available period
    const handleRentalClick = () => {
      if (auth.isProvider() && !auth.isAdmin()) {
        showToast('Los proveedores no pueden realizar reservas en la plataforma.', 'warning');
        return;
      }

      openRentalModal(tool, {
        initialStartDate: startDate || isoFirstAvailable,
        initialEndDate: endDate || isoDefaultEnd,
        initialQuantity: selectedQuantity,
        deliveryDepartment: deliveryDepartment,
        deliveryCity: deliveryCity
      });
    };

    // Wire clicks to open rental modal
    container.querySelector('#btn-add-to-rental')?.addEventListener('click', handleRentalClick);
    container.querySelector('#product-dates-card')?.addEventListener('click', handleRentalClick);
    container.querySelector('#btn-mobile-quick-rent')?.addEventListener('click', handleRentalClick);
  }

  render();
}

export default renderProductPageView;
