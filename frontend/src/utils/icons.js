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
    // Fallback icon
    return `<svg class="${classes}" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke-width="2"/></svg>`;
  }

  // Create an SVG element using Lucide's icon definition
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('class', classes);

  // Append elements from iconDefinition
  if (Array.isArray(iconDefinition)) {
    iconDefinition.forEach(([tag, attrs]) => {
      const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
      Object.entries(attrs).forEach(([k, v]) => child.setAttribute(k, v));
      svg.appendChild(child);
    });
  }

  return svg.outerHTML;
}
