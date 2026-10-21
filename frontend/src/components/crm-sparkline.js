/**
 * Conceptzilla & Linear Minimalist CRM Sparklines and Data Visualizations
 * Provides:
 * 1. Smooth curved SVG Sparklines with subtle gradient area fills (Orange #EA580C, Emerald #10B981, Blue #2563EB).
 * 2. Segmented capacity/activity indicator bars (5 mini blocks).
 * 3. Outline-Mono modern technical status badges.
 */

import { renderIcon } from '../utils/icons.js';

/**
 * Generate a smooth cubic bezier SVG Sparkline
 * @param {Array<number>} points - Sequence of numeric values
 * @param {'orange'|'emerald'|'blue'|'zinc'} color - Color theme
 * @param {number} width - SVG width (default: 88)
 * @param {number} height - SVG height (default: 34)
 * @returns {string} Inline SVG HTML string
 */
export function renderSparkline({
  points = [12, 19, 14, 26, 22, 34, 39],
  color = 'orange',
  width = 88,
  height = 34
} = {}) {
  const gradientId = `spark-grad-${color}-${Math.random().toString(36).slice(2, 8)}`;
  
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const paddingY = 4;
  const usableHeight = height - paddingY * 2;

  // Normalized coordinate points
  const coords = points.map((val, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - paddingY - ((val - min) / range) * usableHeight;
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  });

  // Build smooth cubic bezier curve path
  let pathD = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i];
    const p1 = coords[i + 1];
    const cpX1 = p0.x + (p1.x - p0.x) / 2;
    const cpY1 = p0.y;
    const cpX2 = p0.x + (p1.x - p0.x) / 2;
    const cpY2 = p1.y;
    pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
  }

  // Area path for subtle gradient fill
  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  // Color mapping matching Conceptzilla CRM
  const colorMap = {
    orange: { stroke: '#EA580C', stop1: '#EA580C', stop2: '#EA580C' },
    emerald: { stroke: '#10B981', stop1: '#10B981', stop2: '#10B981' },
    blue: { stroke: '#2563EB', stop1: '#2563EB', stop2: '#2563EB' },
    zinc: { stroke: '#71717A', stop1: '#71717A', stop2: '#71717A' }
  };
  const theme = colorMap[color] || colorMap.orange;

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg" class="flex-shrink-0 select-none overflow-visible">
      <defs>
        <linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${theme.stop1}" stop-opacity="0.14" />
          <stop offset="100%" stop-color="${theme.stop2}" stop-opacity="0.0" />
        </linearGradient>
      </defs>
      <!-- Gradient Area Fill -->
      <path d="${areaD}" fill="url(#${gradientId})" />
      <!-- Smooth Top Line -->
      <path d="${pathD}" fill="none" stroke="${theme.stroke}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  `;
}

/**
 * Render Conceptzilla Segmented Capacity/Score Blocks (5 mini vertical bars)
 * @param {number} level - Level from 1 to 5
 * @param {number} max - Max blocks (default: 5)
 * @param {'orange'|'emerald'|'blue'} color
 */
export function renderSegmentedLevel(level = 4, max = 5, color = 'orange') {
  const activeColorClass = color === 'emerald' 
    ? 'bg-emerald-500' 
    : color === 'blue' 
    ? 'bg-blue-500' 
    : 'bg-[#EA580C]';

  return `
    <div class="inline-flex items-center gap-0.5" title="Capacidad / Nivel: ${level}/${max}">
      ${Array.from({ length: max }).map((_, i) => `
        <span class="w-1 h-3 rounded-[1px] transition-colors ${i < level ? activeColorClass : 'bg-zinc-200/90'}"></span>
      `).join('')}
    </div>
  `;
}

/**
 * Render Minimalist Outline-Mono Status Badge (Linear & Conceptzilla CRM style)
 * @param {string} status - Raw status code (e.g. 'AVAILABLE', 'CONFIRMED', 'PENDING')
 * @param {string} customLabel - Optional translated label
 */
export function renderCrmStatusBadge(status = 'AVAILABLE', customLabel = null) {
  const s = (status || '').toUpperCase();

  const configs = {
    AVAILABLE: { label: 'DISPONIBLE', dot: 'bg-emerald-500', text: 'text-zinc-700', border: 'border-zinc-200' },
    CONFIRMED: { label: 'CONFIRMADO', dot: 'bg-emerald-500', text: 'text-zinc-700', border: 'border-zinc-200' },
    ACTIVE: { label: 'ACTIVO', dot: 'bg-emerald-500', text: 'text-zinc-700', border: 'border-zinc-200' },
    IN_PROGRESS: { label: 'EN CURSO', dot: 'bg-blue-500', text: 'text-zinc-700', border: 'border-zinc-200' },
    PENDING: { label: 'PENDIENTE', dot: 'bg-amber-500', text: 'text-zinc-700', border: 'border-zinc-200' },
    MAINTENANCE: { label: 'EN TALLER', dot: 'bg-amber-500', text: 'text-zinc-700', border: 'border-zinc-200' },
    COMPLETED: { label: 'COMPLETADO', dot: 'bg-zinc-400', text: 'text-zinc-600', border: 'border-zinc-200' },
    CANCELLED: { label: 'CANCELADO', dot: 'bg-rose-400', text: 'text-zinc-600', border: 'border-zinc-200' },
    RETIRED: { label: 'RETIRADO', dot: 'bg-zinc-300', text: 'text-zinc-500', border: 'border-zinc-200' },
    VERIFIED: { label: 'VERIFICADO', dot: 'bg-emerald-500', text: 'text-zinc-700', border: 'border-zinc-200' },
    OVERDUE: { label: 'PLAZO VENCIDO', dot: 'bg-rose-600 animate-ping', text: 'text-rose-700 font-bold', border: 'border-rose-300 bg-rose-50/90' },
    RETURN_DUE: { label: 'RETORNO HOY', dot: 'bg-amber-500 animate-pulse', text: 'text-amber-800 font-bold', border: 'border-amber-300 bg-amber-50/90' },
    DISPATCHED: { label: 'EN CAMINO', dot: 'bg-indigo-500', text: 'text-indigo-700', border: 'border-indigo-200 bg-indigo-50/70' },
    RECEIVED: { label: 'RECIBIDO EN OBRA', dot: 'bg-emerald-500', text: 'text-emerald-700', border: 'border-emerald-200 bg-emerald-50/70' }
  };

  const cfg = configs[s] || { label: s, dot: 'bg-zinc-400', text: 'text-zinc-600', border: 'border-zinc-200' };
  const label = customLabel || cfg.label;

  return `
    <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border ${cfg.border} bg-zinc-50/70 text-[10px] font-mono uppercase tracking-[0.05em] ${cfg.text} select-none">
      <span class="w-1.5 h-1.5 rounded-full ${cfg.dot} flex-shrink-0"></span>
      <span>${label}</span>
    </span>
  `;
}
