import { renderIcon } from '../utils/icons.js';
import api from '../api/client.js';

/**
 * Custom Date Range & Dedicated Single-Month Calendar System
 * 
 * Supports both:
 * 1. createSingleDateCalendar: Focused, clean 1-month popover for either 'START' (Entrega)
 *    or 'END' (Devolución) with backend stock/availability validation and booked dates highlight.
 * 2. createTwoBlockDatePicker: Coordinated two-block workflow where picking Entrega automatically
 *    advances to Retorno and validates availability in real time.
 * 3. createDateRangeCalendar: Backward-compatible interface.
 */

// Normalizes date to local midnight
export const getLocalToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// Conversions
export const toIsoDate = (d) => {
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${da}`;
};

export const parseIsoDate = (str) => {
  if (!str) return null;
  const parts = str.split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
};

export const formatFriendlyDate = (isoStr) => {
  if (!isoStr) return '—';
  const d = parseIsoDate(isoStr);
  if (!d) return '—';
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

export const calculateDaysCount = (startStr, endStr) => {
  if (!startStr || !endStr) return 0;
  const s = parseIsoDate(startStr);
  const e = parseIsoDate(endStr);
  if (!s || !e || e < s) return 0;
  const diff = Math.round((e - s) / (1000 * 60 * 60 * 24));
  return diff + 1; // Both extremities billable
};

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAY_NAMES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

/**
 * Creates a focused, single-month calendar component for a specific block ('START' or 'END').
 */
export function createSingleDateCalendar({
  mode = 'START', // 'START' | 'END'
  initialDate,
  referenceDate, // for 'END' mode, referenceDate is the startDate
  bookedRanges = [],
  toolId = null,
  isCatalog = false,
  hideHeader = false,
  onSelect = () => {},
  onNext = () => {},
  onClose = () => {}
}) {
  const container = document.createElement('div');
  container.className = 'w-full single-date-calendar select-none';

  const today = getLocalToday();
  const maxBookingHorizon = new Date(today);
  maxBookingHorizon.setDate(today.getDate() + 365);
  maxBookingHorizon.setHours(23, 59, 59, 999);

  let currentSelectedDate = initialDate || null;
  let currentRefDate = referenceDate || null;
  let currentBookedRanges = [...bookedRanges];
  let currentToolId = toolId;
  let availabilityInfo = null;

  const targetDate = parseIsoDate(currentSelectedDate) || parseIsoDate(currentRefDate) || today;
  let viewYear = targetDate.getFullYear();
  let viewMonth = targetDate.getMonth();

  function isDateBooked(d) {
    if (!currentBookedRanges || currentBookedRanges.length === 0) return false;
    const time = d.getTime();
    return currentBookedRanges.some(r => {
      const bs = parseIsoDate(r.startDate || r.start);
      const be = parseIsoDate(r.endDate || r.end);
      if (!bs || !be) return false;
      return time >= bs.getTime() && time <= be.getTime();
    });
  }

  function getFirstBookedDateAfter(startDate) {
    if (!startDate || !currentBookedRanges || currentBookedRanges.length === 0) return null;
    const sTime = startDate.getTime();
    let earliest = null;
    currentBookedRanges.forEach(r => {
      const bs = parseIsoDate(r.startDate || r.start);
      const be = parseIsoDate(r.endDate || r.end);
      if (!bs || !be) return;
      if (be.getTime() < sTime) return;
      const blockTime = Math.max(bs.getTime(), sTime);
      if (earliest === null || blockTime < earliest) {
        earliest = blockTime;
      }
    });
    return earliest;
  }

  async function queryBackendAvailability(s, e) {
    if (!currentToolId && !isCatalog) return;
    try {
      if (currentToolId) {
        const queryParams = (s && e) ? { from: s, to: e } : {};
        const res = await api.get(`/tools/${currentToolId}/availability`, queryParams);
        if (res) {
          availabilityInfo = {
            isAvailable: res.isAvailable !== undefined ? Boolean(res.isAvailable) : (res.availableStock > 0),
            availableStock: res.availableStock ?? 1,
            totalStock: res.totalStock ?? 1,
            reservedStock: res.reservedStock ?? 0,
            message: res.message || ''
          };
          if (res.bookedDateRanges && Array.isArray(res.bookedDateRanges)) {
            currentBookedRanges = res.bookedDateRanges;
          }
          render();
        }
      } else if (isCatalog) {
        const list = await api.get('/tools/availability', { from: s, to: e });
        if (Array.isArray(list)) {
          const availCount = list.filter(t => t.isAvailable).length;
          availabilityInfo = {
            isAvailable: availCount > 0,
            availableStock: availCount,
            totalStock: list.length,
            message: `${availCount} equipos disponibles para estas fechas`
          };
          render();
        }
      }
    } catch (err) {
      console.warn('Error consultando disponibilidad en backend:', err);
    }
  }

  function render() {
    const minMonthDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const maxMonthDate = new Date(maxBookingHorizon.getFullYear(), maxBookingHorizon.getMonth(), 1);
    const currentViewFirst = new Date(viewYear, viewMonth, 1);

    const canGoPrev = currentViewFirst > minMonthDate;
    const canGoNext = currentViewFirst < maxMonthDate;

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDayWeekIndex = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Monday = 0

    const sDate = mode === 'END' ? parseIsoDate(currentRefDate) : parseIsoDate(currentSelectedDate);
    let maxAllowedEndDate = new Date(sDate || today);
    maxAllowedEndDate.setDate((sDate || today).getDate() + 29); // 30 days max continuous
    if (maxAllowedEndDate > maxBookingHorizon) {
      maxAllowedEndDate = new Date(maxBookingHorizon);
    }

    const currentDays = mode === 'END' 
      ? calculateDaysCount(currentRefDate, currentSelectedDate)
      : calculateDaysCount(currentSelectedDate, currentRefDate);

    container.innerHTML = `
      <div class="space-y-2.5">
        
        ${!hideHeader ? `
          <!-- Header -->
          <div class="flex items-center justify-between pb-2 border-b border-slate-100">
            <div class="flex items-center gap-1.5">
              <span class="text-[#ea580c]">
                ${renderIcon(mode === 'START' ? 'Calendar' : 'Clock', 'w-4 h-4')}
              </span>
              <span class="text-xs font-bold text-slate-800">
                ${mode === 'START' ? 'Fecha de entrega' : 'Fecha de devolución'}
              </span>
              <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-orange-100 text-[#ea580c]">
                ${mode === 'START' ? 'Paso 1' : 'Paso 2'}
              </span>
            </div>

            <button 
              type="button" 
              class="cal-btn-close text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Cerrar selector"
            >
              ${renderIcon('X', 'w-3.5 h-3.5')}
            </button>
          </div>
        ` : ''}

        ${mode === 'START' ? (() => {
          const tomorrowDate = new Date(today);
          tomorrowDate.setDate(tomorrowDate.getDate() + 1);
          const in3daysDate = new Date(today);
          in3daysDate.setDate(in3daysDate.getDate() + 3);

          const isTodayBooked = isDateBooked(today);
          const isTomorrowBooked = isDateBooked(tomorrowDate);
          const isIn3DaysBooked = isDateBooked(in3daysDate);

          return `
            <!-- Quick presets for Start Date (Clean, light modern pills) -->
            <div class="flex items-center gap-1.5 pb-1 flex-wrap">
              <span class="text-[10px] font-medium text-slate-400 mr-0.5">Acceso rápido:</span>
              <button type="button" data-quick="today" ${isTodayBooked ? 'disabled' : ''} class="cal-quick-start py-1 px-3 rounded-full text-xs font-medium border border-slate-200/90 bg-white hover:border-orange-400 hover:text-[#ea580c] text-slate-600 transition-all text-center cursor-pointer shadow-2xs disabled:opacity-40 disabled:line-through disabled:pointer-events-none" title="${isTodayBooked ? 'No disponible hoy' : 'Entregar hoy'}">
                Hoy
              </button>
              <button type="button" data-quick="tomorrow" ${isTomorrowBooked ? 'disabled' : ''} class="cal-quick-start py-1 px-3 rounded-full text-xs font-medium border border-slate-200/90 bg-white hover:border-orange-400 hover:text-[#ea580c] text-slate-600 transition-all text-center cursor-pointer shadow-2xs disabled:opacity-40 disabled:line-through disabled:pointer-events-none" title="${isTomorrowBooked ? 'No disponible mañana (ocupado)' : 'Entregar mañana'}">
                Mañana
              </button>
              <button type="button" data-quick="in3days" ${isIn3DaysBooked ? 'disabled' : ''} class="cal-quick-start py-1 px-3 rounded-full text-xs font-medium border border-slate-200/90 bg-white hover:border-orange-400 hover:text-[#ea580c] text-slate-600 transition-all text-center cursor-pointer shadow-2xs disabled:opacity-40 disabled:line-through disabled:pointer-events-none" title="${isIn3DaysBooked ? 'No disponible en 3 días (ocupado)' : 'Entregar en 3 días'}">
                En 3 días
              </button>
            </div>
          `;
        })() : `
          <!-- Quick Duration Presets for End Date (Clean, subtle duration pills) -->
          <div class="flex items-center gap-1.5 pb-1 overflow-x-auto no-scrollbar">
            <span class="text-[10px] font-medium text-slate-400 mr-0.5 shrink-0">Duración:</span>
            ${[1, 3, 7, 15, 30].map(d => `
              <button type="button" data-preset="${d}" class="cal-preset-btn py-1 px-2.5 rounded-full text-xs font-semibold border text-center transition-all cursor-pointer shrink-0 ${
                currentDays === d 
                  ? 'bg-[#ea580c] text-white border-[#ea580c] shadow-2xs' 
                  : 'bg-white hover:border-orange-300 border-slate-200/90 text-slate-600'
              }">
                ${d === 1 ? '1 día' : d === 7 ? '1 sem' : `${d} días`}
              </button>
            `).join('')}
          </div>
        `}

        <!-- Month Navigation Bar -->
        <div class="flex items-center justify-between pb-1.5 border-b border-slate-100">
          <button 
            type="button" 
            class="cal-btn-prev p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            ${!canGoPrev ? 'disabled' : ''}
            title="Mes anterior"
          >
            ${renderIcon('ChevronLeft', 'w-3.5 h-3.5')}
          </button>

          <span class="text-xs font-bold text-slate-900 capitalize font-display">
            ${MONTH_NAMES[viewMonth]} ${viewYear}
          </span>

          <button 
            type="button" 
            class="cal-btn-next p-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            ${!canGoNext ? 'disabled' : ''}
            title="Mes siguiente"
          >
            ${renderIcon('ChevronRight', 'w-3.5 h-3.5')}
          </button>
        </div>

        <!-- Weekdays Labels -->
        <div class="grid grid-cols-7 gap-1 text-center font-bold text-[9px] uppercase text-slate-400">
          ${WEEKDAY_NAMES.map(name => `<div>${name}</div>`).join('')}
        </div>

        <!-- Days Grid -->
        <div class="grid grid-cols-7 gap-1 text-center text-xs">
          <!-- Offset empty days -->
          ${Array.from({ length: firstDayWeekIndex }).map(() => `
            <div class="h-8"></div>
          `).join('')}

          <!-- Actual Days -->
          ${Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const cellDate = new Date(viewYear, viewMonth, dayNum, 0, 0, 0, 0);
            const cellIso = toIsoDate(cellDate);
            const cellTime = cellDate.getTime();

            const isPast = cellDate < today;
            const isExceedingHorizon = cellDate > maxBookingHorizon;
            const isSelected = cellIso === currentSelectedDate;

            let isDisabled = isPast || isExceedingHorizon;
            let titleText = cellIso;
            let cellStyle = 'bg-white text-slate-700 hover:bg-orange-50 hover:text-[#ea580c] rounded-lg';

            if (mode === 'START') {
              const isBooked = isDateBooked(cellDate);
              if (isBooked) {
                isDisabled = true;
                titleText = 'Equipo reservado por otro usuario (no disponible)';
                cellStyle = isSelected
                  ? 'bg-rose-50 text-rose-600 font-bold border border-rose-300 line-through cursor-not-allowed'
                  : 'text-slate-300 bg-slate-50/70 line-through opacity-50 cursor-not-allowed pointer-events-none';
              } else if (isSelected) {
                cellStyle = 'bg-[#ea580c] text-white font-bold rounded-lg shadow-xs z-10';
              } else if (isDisabled) {
                cellStyle = 'text-slate-300 opacity-40 cursor-not-allowed pointer-events-none line-through';
                titleText = isPast ? 'Fecha pasada no permitida' : 'Límite de reserva superado (máx. 1 año)';
              }
            } else {
              // mode === 'END'
              const isBeforeStart = sDate && cellTime < sDate.getTime();
              const isExceedingDuration = sDate && cellTime > maxAllowedEndDate.getTime();
              const isBooked = isDateBooked(cellDate);
              const firstBookedAfter = sDate ? getFirstBookedDateAfter(sDate) : null;
              const crossesIntoBooked = firstBookedAfter !== null && cellTime >= firstBookedAfter;
              const isStartDateCell = cellIso === currentRefDate;
              const isInRange = sDate && parseIsoDate(currentSelectedDate) && 
                                cellTime > sDate.getTime() && 
                                cellTime < parseIsoDate(currentSelectedDate).getTime();

              if (isBeforeStart) {
                isDisabled = true;
                titleText = 'No puedes devolver antes de la entrega';
                cellStyle = 'text-slate-300 opacity-30 cursor-not-allowed pointer-events-none line-through';
              } else if (isExceedingDuration) {
                isDisabled = true;
                titleText = 'Máximo 30 días de contrato continuo';
                cellStyle = 'text-slate-300 opacity-30 cursor-not-allowed pointer-events-none line-through';
              } else if (isBooked || crossesIntoBooked) {
                isDisabled = true;
                titleText = 'Fecha no disponible (equipo ya reservado por otro usuario)';
                cellStyle = 'text-slate-300 bg-slate-50/70 line-through opacity-50 cursor-not-allowed pointer-events-none';
              } else if (isSelected) {
                cellStyle = 'bg-[#ea580c] text-white font-bold rounded-lg shadow-xs z-10';
              } else if (isInRange) {
                cellStyle = 'bg-orange-50 text-orange-950 font-medium rounded-none';
              } else if (isStartDateCell) {
                cellStyle = 'border border-[#ea580c] text-[#ea580c] font-bold rounded-lg bg-orange-50/50';
                titleText = 'Fecha de entrega fijada';
              } else if (isDisabled) {
                cellStyle = 'text-slate-300 opacity-40 cursor-not-allowed pointer-events-none line-through';
              }
            }

            return `
              <button
                type="button"
                data-date="${cellIso}"
                ${isDisabled ? 'disabled' : ''}
                class="cal-day-btn h-8 w-full flex flex-col items-center justify-center font-medium transition-all relative ${cellStyle}"
                title="${titleText}"
              >
                <span class="text-xs leading-none">${dayNum}</span>
                ${cellIso === toIsoDate(today) && !isSelected ? `
                  <span class="w-1 h-1 rounded-full bg-[#ea580c] absolute bottom-1"></span>
                ` : ''}
              </button>
            `;
          }).join('')}
        </div>

        <!-- Footer with Legend & Billable Days (Clean, discreet, single legend) -->
        <div class="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-[10px] text-slate-400 select-none">
          <div class="flex items-center gap-2.5 flex-wrap">
            <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-[#ea580c]"></span> Seleccionada</span>
            <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-full border border-slate-300 bg-white"></span> Disponible</span>
            <span class="inline-flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-slate-300 opacity-60"></span> Ocupada</span>
          </div>
          <span class="text-slate-600 font-semibold font-mono">
            ${currentDays} ${currentDays === 1 ? 'día facturable' : 'días facturables'}
          </span>
        </div>

      </div>
    `;

    attachEvents(canGoPrev, canGoNext);
  }

  function attachEvents(canGoPrev, canGoNext) {
    // Close button
    container.querySelector('.cal-btn-close')?.addEventListener('click', (e) => {
      e.stopPropagation();
      onClose();
    });

    // Month Navigation
    container.querySelector('.cal-btn-prev')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!canGoPrev) return;
      if (viewMonth === 0) {
        viewMonth = 11;
        viewYear -= 1;
      } else {
        viewMonth -= 1;
      }
      render();
    });

    container.querySelector('.cal-btn-next')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!canGoNext) return;
      if (viewMonth === 11) {
        viewMonth = 0;
        viewYear += 1;
      } else {
        viewMonth += 1;
      }
      render();
    });

    // Quick presets for START
    container.querySelectorAll('.cal-quick-start').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.getAttribute('data-quick');
        const d = getLocalToday();
        if (action === 'tomorrow') d.setDate(d.getDate() + 1);
        if (action === 'in3days') d.setDate(d.getDate() + 3);

        const iso = toIsoDate(d);
        currentSelectedDate = iso;
        render();
        onSelect(iso);
        onNext(iso);
      });
    });

    // Duration presets for END
    container.querySelectorAll('.cal-preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const presetDays = parseInt(btn.getAttribute('data-preset'), 10);
        if (!presetDays) return;

        const s = parseIsoDate(currentRefDate) || today;
        let newEnd = new Date(s);
        newEnd.setDate(s.getDate() + (presetDays - 1));

        if (newEnd > maxBookingHorizon) newEnd = new Date(maxBookingHorizon);

        const iso = toIsoDate(newEnd);
        currentSelectedDate = iso;
        render();
        queryBackendAvailability(currentRefDate, iso);
        onSelect(iso);
        onClose();
      });
    });

    // Day clicks
    container.querySelectorAll('.cal-day-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const clickedIso = btn.getAttribute('data-date');
        if (!clickedIso) return;

        currentSelectedDate = clickedIso;
        render();

        if (mode === 'START') {
          onSelect(clickedIso);
          onNext(clickedIso);
        } else {
          queryBackendAvailability(currentRefDate, clickedIso);
          onSelect(clickedIso);
          onClose();
        }
      });
    });
  }

  // Initial backend check for availability and booked dates
  if (currentToolId || isCatalog) {
    queryBackendAvailability(currentRefDate, currentSelectedDate);
  }

  render();

  return {
    getElement: () => container,
    getSelectedDate: () => currentSelectedDate,
    setSelectedDate: (dateIso) => {
      currentSelectedDate = dateIso;
      const parsed = parseIsoDate(dateIso);
      if (parsed) {
        viewYear = parsed.getFullYear();
        viewMonth = parsed.getMonth();
      }
      render();
    },
    setReferenceDate: (refIso, endIso) => {
      currentRefDate = refIso;
      if (endIso) currentSelectedDate = endIso;
      const parsed = parseIsoDate(refIso);
      if (parsed) {
        viewYear = parsed.getFullYear();
        viewMonth = parsed.getMonth();
      }
      if (mode === 'END' && (currentToolId || isCatalog)) {
        queryBackendAvailability(currentRefDate, currentSelectedDate);
      }
      render();
    },
    setBookedRanges: (ranges) => {
      currentBookedRanges = [...ranges];
      render();
    },
    setToolId: (id) => {
      currentToolId = id;
      if (mode === 'END') {
        queryBackendAvailability(currentRefDate, currentSelectedDate);
      }
    },
    refreshAvailability: () => {
      queryBackendAvailability(currentRefDate, currentSelectedDate);
    }
  };
}

/**
 * Coordinated Two-Block Date Picker Controller
 * Manages separate popovers for START and END blocks with automatic step progression.
 */
export function createTwoBlockDatePicker({
  initialStartDate,
  initialEndDate,
  bookedRanges = [],
  toolId = null,
  isCatalog = false,
  hideHeader = false,
  onChange = () => {}
}) {
  let startDate = initialStartDate || null;
  let endDate = initialEndDate || null;

  let startCalendar = null;
  let endCalendar = null;
  let isStartOpen = false;
  let isEndOpen = false;

  let onStartOpenCb = () => {};
  let onStartCloseCb = () => {};
  let onEndOpenCb = () => {};
  let onEndCloseCb = () => {};

  function emitUpdate(extra = {}) {
    const hasBoth = Boolean(startDate && endDate);
    const days = hasBoth ? calculateDaysCount(startDate, endDate) : 0;
    onChange({
      startDate,
      endDate,
      days,
      isValid: hasBoth && days >= 1 && days <= 30,
      hasConfirmedDates: hasBoth,
      ...extra
    });
  }

  startCalendar = createSingleDateCalendar({
    mode: 'START',
    initialDate: startDate,
    referenceDate: endDate,
    bookedRanges,
    toolId,
    isCatalog,
    hideHeader,
    onSelect: (newStartIso) => {
      startDate = newStartIso;
      const s = parseIsoDate(startDate);
      const e = parseIsoDate(endDate);

      let maxEnd = new Date(s);
      maxEnd.setDate(s.getDate() + 29);

      if (e && (e < s || e > maxEnd)) {
        endDate = null;
      }

      endCalendar.setReferenceDate(startDate, endDate);
      emitUpdate();
    },
    onNext: () => {
      // Step progression: close START popover and immediately open END popover
      closeStart();
      openEnd();
    },
    onClose: () => {
      closeStart();
    }
  });

  endCalendar = createSingleDateCalendar({
    mode: 'END',
    initialDate: endDate,
    referenceDate: startDate,
    bookedRanges,
    toolId,
    isCatalog,
    hideHeader,
    onSelect: (newEndIso) => {
      endDate = newEndIso;
      emitUpdate();
    },
    onClose: () => {
      closeEnd();
    }
  });

  function openStart() {
    isStartOpen = true;
    isEndOpen = false;
    onEndCloseCb();
    onStartOpenCb();
  }

  function closeStart() {
    isStartOpen = false;
    onStartCloseCb();
  }

  function openEnd() {
    isEndOpen = true;
    isStartOpen = false;
    onStartCloseCb();
    endCalendar.setReferenceDate(startDate, endDate);
    onEndOpenCb();
  }

  function closeEnd() {
    isEndOpen = false;
    onEndCloseCb();
  }

  function closeAll() {
    closeStart();
    closeEnd();
  }

  return {
    getStartElement: () => startCalendar.getElement(),
    getEndElement: () => endCalendar.getElement(),
    getDates: () => ({
      startDate,
      endDate,
      days: calculateDaysCount(startDate, endDate)
    }),
    openStart,
    closeStart,
    openEnd,
    closeEnd,
    closeAll,
    setDates: (newS, newE) => {
      if (newS) startDate = newS;
      if (newE) endDate = newE;
      startCalendar.setSelectedDate(startDate);
      endCalendar.setReferenceDate(startDate, endDate);
      emitUpdate();
    },
    setBookedRanges: (ranges) => {
      startCalendar.setBookedRanges(ranges);
      endCalendar.setBookedRanges(ranges);
    },
    setToolId: (id) => {
      toolId = id;
      startCalendar.setToolId(id);
      endCalendar.setToolId(id);
    },
    onOpenStart: (fn) => { onStartOpenCb = fn; },
    onCloseStart: (fn) => { onStartCloseCb = fn; },
    onOpenEnd: (fn) => { onEndOpenCb = fn; },
    onCloseEnd: (fn) => { onEndCloseCb = fn; },
    isStartOpen: () => isStartOpen,
    isEndOpen: () => isEndOpen
  };
}

/**
 * Backward-compatible dual-block calendar adapter for inline containers
 */
export function createDateRangeCalendar(options = {}) {
  let activeTab = 'START';
  const wrapper = document.createElement('div');
  wrapper.className = 'w-full date-range-calendar-inline space-y-2';

  const picker = createTwoBlockDatePicker({
    ...options,
    hideHeader: true,
    onChange: (data) => {
      renderTabs();
      options.onChange?.(data);
    }
  });

  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'grid grid-cols-2 gap-2 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/80';

  const bodyContainer = document.createElement('div');
  bodyContainer.className = 'p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs';

  function renderTabs() {
    const { startDate, endDate } = picker.getDates();
    tabsContainer.innerHTML = `
      <button 
        type="button" 
        class="cal-tab-start p-2.5 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between ${
          activeTab === 'START' 
            ? 'bg-white shadow-xs border border-[#FF5A1F] text-slate-900 ring-1 ring-orange-500/20' 
            : 'text-slate-600 hover:bg-white/60 border border-transparent'
        }"
      >
        <div class="flex items-center justify-between w-full">
          <span class="text-[10px] font-bold uppercase tracking-wider ${activeTab === 'START' ? 'text-[#FF5A1F]' : 'text-slate-400'}">
            Fecha de Entrega
          </span>
          <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold ${activeTab === 'START' ? 'bg-orange-100 text-[#FF5A1F]' : 'text-slate-400'}">
            Paso 1
          </span>
        </div>
        <div class="text-xs sm:text-sm font-bold text-slate-900 mt-1 truncate">
          ${formatFriendlyDate(startDate)}
        </div>
      </button>

      <button 
        type="button" 
        class="cal-tab-end p-2.5 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between ${
          activeTab === 'END' 
            ? 'bg-white shadow-xs border border-[#FF5A1F] text-slate-900 ring-1 ring-orange-500/20' 
            : 'text-slate-600 hover:bg-white/60 border border-transparent'
        }"
      >
        <div class="flex items-center justify-between w-full">
          <span class="text-[10px] font-bold uppercase tracking-wider ${activeTab === 'END' ? 'text-[#FF5A1F]' : 'text-slate-400'}">
            Fecha de Devolución
          </span>
          <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold ${activeTab === 'END' ? 'bg-orange-100 text-[#FF5A1F]' : 'text-slate-400'}">
            Paso 2
          </span>
        </div>
        <div class="text-xs sm:text-sm font-bold text-slate-900 mt-1 truncate">
          ${formatFriendlyDate(endDate)}
        </div>
      </button>
    `;

    tabsContainer.querySelector('.cal-tab-start')?.addEventListener('click', (e) => {
      e.stopPropagation();
      activeTab = 'START';
      switchBody();
    });

    tabsContainer.querySelector('.cal-tab-end')?.addEventListener('click', (e) => {
      e.stopPropagation();
      activeTab = 'END';
      switchBody();
    });
  }

  function switchBody() {
    renderTabs();
    bodyContainer.innerHTML = '';
    bodyContainer.appendChild(activeTab === 'START' ? picker.getStartElement() : picker.getEndElement());
  }

  // Hook into picker progression
  picker.onOpenEnd(() => {
    activeTab = 'END';
    switchBody();
  });
  picker.onOpenStart(() => {
    activeTab = 'START';
    switchBody();
  });

  wrapper.appendChild(tabsContainer);
  wrapper.appendChild(bodyContainer);

  renderTabs();
  switchBody();

  return {
    getElement: () => wrapper,
    getDates: picker.getDates,
    setBookedRanges: picker.setBookedRanges,
    setDates: picker.setDates,
    setMode: (mode) => {
      activeTab = mode === 'START' ? 'START' : 'END';
      switchBody();
    }
  };
}
