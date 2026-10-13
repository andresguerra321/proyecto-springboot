/**
 * Format numeric value as Colombian Pesos (COP) matching Stitch reference design: "$ 185.000"
 */
export function formatCurrency(amount) {
  if (amount === undefined || amount === null) return '$ 0';
  const formattedNumber = new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0
  }).format(amount);
  return `$ ${formattedNumber}`;
}

/**
 * Format ISO date string or date to friendly Spanish format e.g. "13 oct 2026"
 */
export function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const clean = dateString.split('T')[0];
    const [year, month, day] = clean.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch (e) {
    return dateString;
  }
}

/**
 * Return semantic HTML badge markup for Tool status matching Stitch ToolRent design
 */
export function getToolStatusBadge(status) {
  const map = {
    AVAILABLE: { label: 'Disponible', class: 'badge-disponible', dot: 'bg-emerald-500' },
    RENTED: { label: 'Alquilada', class: 'badge-alquilada', dot: 'bg-blue-500' },
    MAINTENANCE: { label: 'Mantenimiento', class: 'badge-mantenimiento', dot: 'bg-amber-500' },
    RETIRED: { label: 'Retirada', class: 'badge-cancelada', dot: 'bg-rose-500' },
  };

  const item = map[status] || { label: status, class: 'badge-pendiente', dot: 'bg-slate-400' };
  return `<span class="${item.class}">
    <span class="w-1.5 h-1.5 rounded-full ${item.dot}"></span>
    ${item.label}
  </span>`;
}

/**
 * Return semantic HTML badge markup for Rental status matching Stitch ToolRent design
 */
export function getRentalStatusBadge(status) {
  const map = {
    PENDING: { label: 'Pendiente', class: 'badge-pendiente', dot: 'bg-slate-400' },
    CONFIRMED: { label: 'Confirmada', class: 'badge-confirmada', dot: 'bg-orange-500' },
    IN_PROGRESS: { label: 'En curso', class: 'badge-en-curso', dot: 'bg-sky-500' },
    COMPLETED: { label: 'Completada', class: 'badge-completada', dot: 'bg-emerald-500' },
    CANCELLED: { label: 'Cancelada', class: 'badge-cancelada', dot: 'bg-rose-500' },
  };

  const item = map[status] || { label: status, class: 'badge-pendiente', dot: 'bg-slate-400' };
  return `<span class="${item.class}">
    <span class="w-1.5 h-1.5 rounded-full ${item.dot}"></span>
    ${item.label}
  </span>`;
}
