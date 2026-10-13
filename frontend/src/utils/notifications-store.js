/**
 * ToolRent Notifications Store
 * 
 * Central reactive storage for user notifications with:
 * - LocalStorage persistence
 * - Unread counters
 * - Categorization (RENTAL, PAYMENT, ALERT, INSPECTION, DAMAGE)
 * - CustomEvent dispatching ('notifications:change')
 * - Toast notification pairing
 */

import { showToast } from '../components/toast.js';

const STORAGE_KEY = 'toolrent_notifications_v1';

const defaultNotifications = [
  {
    id: 'notif-001',
    category: 'RENTAL',
    type: 'success',
    title: 'Solicitud de Alquiler Aprobada',
    message: 'Constructoras del Norte S.A.S. aprobó tu alquiler del Taladro Percutor DeWalt 20V (#SOL-001). Equipo listo para entrega.',
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    timeAgo: 'Hace 10 min',
    read: false,
    link: '#/client',
  },
  {
    id: 'notif-002',
    category: 'PAYMENT',
    type: 'info',
    title: 'Factura #INV-2026-004 Generada',
    message: 'Tu pago de $1.760.000 con IVA (19%) fue procesado con éxito. Ya puedes consultar y descargar tu factura oficial.',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    timeAgo: 'Hace 45 min',
    read: false,
    link: '#/client',
  },
  {
    id: 'notif-003',
    category: 'ALERT',
    type: 'warning',
    title: 'Recordatorio de Devolución Programada',
    message: 'El contrato de alquiler para la Mezcladora de Concreto 400L finaliza mañana a las 5:00 PM. Programa la entrega con el proveedor.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    timeAgo: 'Hace 2 horas',
    read: false,
    link: '#/client',
  },
  {
    id: 'notif-004',
    category: 'INSPECTION',
    type: 'info',
    title: 'Inspección de Entrega Registrada',
    message: 'Se completó la inspección técnica de salida de la Placa Compactadora Wacker Neuson sin averías previas registradas.',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    timeAgo: 'Ayer',
    read: true,
    link: '#/client',
  },
  {
    id: 'notif-005',
    category: 'RENTAL',
    type: 'success',
    title: 'Depósito de Garantía Liberado',
    message: 'Se confirmó la devolución conforme del Andamio Multidireccional Layher. Se devolvió el depósito en garantía por $180.000.',
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    timeAgo: 'Hace 2 días',
    read: true,
    link: '#/client',
  },
];

class NotificationsStore {
  constructor() {
    this.notifications = this.load();
  }

  load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error al cargar notificaciones de localStorage:', e);
    }
    this.save(defaultNotifications);
    return [...defaultNotifications];
  }

  save(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Error al guardar notificaciones:', e);
    }
    this.notifications = items;
    this.emitChange();
  }

  emitChange() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('notifications:change', {
        detail: {
          unreadCount: this.getUnreadCount(),
          total: this.notifications.length,
        }
      }));
    }
  }

  getAll() {
    return [...this.notifications];
  }

  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  markAsRead(id) {
    const updated = this.notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    this.save(updated);
  }

  markAllAsRead() {
    const updated = this.notifications.map(n => ({ ...n, read: true }));
    this.save(updated);
  }

  delete(id) {
    const updated = this.notifications.filter(n => n.id !== id);
    this.save(updated);
  }

  clearAll() {
    this.save([]);
  }

  resetDefaults() {
    this.save([...defaultNotifications]);
  }

  /**
   * Adds a notification and triggers an immediate in-app toast
   */
  add({ category = 'RENTAL', type = 'success', title, message, link = '#/client' }) {
    const newNotif = {
      id: `notif-${Date.now()}`,
      category,
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      timeAgo: 'Ahora mismo',
      read: false,
      link,
    };

    const updated = [newNotif, ...this.notifications];
    this.save(updated);

    // Trigger visual toast banner
    showToast(message, type, 4500, title);

    return newNotif;
  }
}

export const notificationsStore = new NotificationsStore();
