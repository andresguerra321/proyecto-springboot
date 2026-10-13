/**
 * Format numeric value as Colombian Pesos or Dollars
 */
export function formatCurrency(amount, currency = 'USD') {
  if (amount === undefined || amount === null) return '$0.00';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format ISO date string (YYYY-MM-DD) to friendly Spanish date
 */
export function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const [year, month, day] = dateString.split('-');
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
 * Return HTML badge markup for Tool status
 */
export function getToolStatusBadge(status) {
  const map = {
    AVAILABLE: { label: 'Disponible', class: 'badge-available', dot: 'bg-emerald-400' },
    RENTED: { label: 'Alquilada', class: 'badge-rented', dot: 'bg-blue-400' },
    MAINTENANCE: { label: 'En Taller / Daño', class: 'badge-maintenance', dot: 'bg-amber-400' },
    RETIRED: { label: 'Retirada', class: 'badge-retired', dot: 'bg-rose-400' },
  };

  const item = map[status] || { label: status, class: 'badge-cancelled', dot: 'bg-slate-400' };
  return `<span class="${item.class}">
    <span class="w-1.5 h-1.5 rounded-full ${item.dot} animate-pulse"></span>
    ${item.label}
  </span>`;
}

/**
 * Return HTML badge markup for Rental status
 */
export function getRentalStatusBadge(status) {
  const map = {
    PENDING: { label: 'Pendiente Aprobación', class: 'badge-pending', dot: 'bg-amber-400' },
    CONFIRMED: { label: 'Confirmada / Lista', class: 'badge-confirmed', dot: 'bg-indigo-400' },
    IN_PROGRESS: { label: 'En Obra / Despachada', class: 'badge-in-progress', dot: 'bg-sky-400' },
    COMPLETED: { label: 'Completada / Devuelta', class: 'badge-completed', dot: 'bg-emerald-400' },
    CANCELLED: { label: 'Cancelada', class: 'badge-cancelled', dot: 'bg-rose-400' },
  };

  const item = map[status] || { label: status, class: 'badge-cancelled', dot: 'bg-slate-400' };
  return `<span class="${item.class}">
    <span class="w-1.5 h-1.5 rounded-full ${item.dot}"></span>
    ${item.label}
  </span>`;
}
