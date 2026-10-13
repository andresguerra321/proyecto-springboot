import * as LucideIcons from 'lucide';

/**
 * Render a Lucide SVG icon as string
 * @param {string} name - PascalCase icon name (e.g. 'Wrench', 'ShieldCheck', 'Calendar', 'FileText')
 * @param {string} classes - Tailwind CSS classes for size and color
 * @returns {string} SVG HTML string
 */
export function renderIcon(name, classes = 'w-5 h-5') {
  const iconDefinition = LucideIcons[name];
  if (!iconDefinition) {
    return `<svg class="${classes}" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke-width="2"/></svg>`;
  }

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('class', classes);

  if (Array.isArray(iconDefinition)) {
    iconDefinition.forEach(([tag, attrs]) => {
      const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
      Object.entries(attrs).forEach(([k, v]) => child.setAttribute(k, v));
      svg.appendChild(child);
    });
  }

  return svg.outerHTML;
}

/**
 * Render the official ToolRent architectural "T" brand emblem
 * Based on img/image.png brand manual and img/banner github.png
 * @param {string} classes - Tailwind CSS size and styling classes
 * @param {string} color - Fill color (default: ToolRent orange #ea580c)
 */
export function renderToolRentMark(classes = 'w-8 h-8', color = '#ea580c') {
  return `
    <svg class="${classes} flex-shrink-0" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- Roof Chevron (Construction & Progress) -->
      <path d="M12 44L48 16L84 44L70 54L48 37L26 54L12 44Z" fill="${color}" />
      <!-- Vertical Stem (Stability, Technology & "T" Letterform) -->
      <path d="M36 50L48 40L60 50V84C60 86.2 58.2 88 56 88H40C37.8 88 36 86.2 36 84V50Z" fill="${color}" />
    </svg>
  `;
}

/**
 * Render the full ToolRent brand mark + wordmark
 */
export function renderToolRentBrand({
  markClass = 'w-9 h-9',
  titleClass = 'text-2xl',
  showSubtitle = false,
  subtitleText = 'Herramientas y maquinaria para construir grandes proyectos',
  color = '#FF5A1F'
} = {}) {
  return `
    <div class="flex items-center gap-2.5">
      ${renderToolRentMark(markClass, color)}
      <div>
        <div class="${titleClass} font-black font-display tracking-tight text-slate-900 leading-none">
          ToolRent
        </div>
        ${showSubtitle ? `<p class="text-[10px] text-slate-500 mt-1 leading-tight">${subtitleText}</p>` : ''}
      </div>
    </div>
  `;
}
