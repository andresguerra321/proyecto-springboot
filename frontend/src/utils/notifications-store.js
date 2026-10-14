/**
 * ToolRent Notifications Store
 * 
 * Central reactive storage for user notifications:
 * - Scoped to authenticated user sessions
 * - No fictitious or preloaded default mock notifications
 * - CustomEvent dispatching ('notifications:change')
 * - Toast notification pairing
 */

import { showToast } from '../components/toast.js';
import auth from '../auth/state.js';

const STORAGE_PREFIX = 'toolrent_user_notifications';

class NotificationsStore {
  constructor() {
    // Purge legacy mock notifications key if present in localStorage
    try {
      localStorage.removeItem('toolrent_notifications_v1');
    } catch (_) {}

    this.notifications = this.load();

    // Re-sync when authentication state changes
    if (typeof window !== 'undefined') {
      window.addEventListener('auth:change', () => {
        this.notifications = this.load();
        this.emitChange();
      });
    }
  }

  getStorageKey() {
    const user = auth.getUser();
    const userId = user?.id || user?.username || 'guest';
    return `${STORAGE_PREFIX}_${userId}`;
  }

  load() {
    if (!auth.isAuthenticated()) {
      return [];
    }
    try {
      const data = localStorage.getItem(this.getStorageKey());
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error al cargar notificaciones:', e);
    }
    return [];
  }

  save(items) {
    if (!auth.isAuthenticated()) {
      this.notifications = [];
      this.emitChange();
      return;
    }
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(items));
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
          total: this.getAll().length,
        }
      }));
    }
  }

  getAll() {
    if (!auth.isAuthenticated()) return [];
    return [...this.notifications];
  }

  getUnreadCount() {
    if (!auth.isAuthenticated()) return 0;
    return this.notifications.filter(n => !n.read).length;
  }

  markAsRead(id) {
    if (!auth.isAuthenticated()) return;
    const updated = this.notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    this.save(updated);
  }

  markAllAsRead() {
    if (!auth.isAuthenticated()) return;
    const updated = this.notifications.map(n => ({ ...n, read: true }));
    this.save(updated);
  }

  delete(id) {
    if (!auth.isAuthenticated()) return;
    const updated = this.notifications.filter(n => n.id !== id);
    this.save(updated);
  }

  clearAll() {
    this.save([]);
  }

  /**
   * Adds a notification and triggers an immediate in-app toast
   */
  add({ category = 'RENTAL', type = 'success', title, message, link = '#/client' }) {
    if (!auth.isAuthenticated()) return null;

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
