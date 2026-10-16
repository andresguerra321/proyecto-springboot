/**
 * ToolRent Notifications Store
 * 
 * Central reactive storage for user notifications:
 * - 100% Persisted in Spring Boot + PostgreSQL backend (Zero localStorage simulation)
 * - Scoped strictly to the authenticated user's real transactions and records
 * - Optimistic UI updates with instant reactive re-rendering
 * - Integrated toast notification pairing
 */

import api from '../api/client.js';
import { showToast } from '../components/toast.js';
import auth from '../auth/state.js';

class NotificationsStore {
  constructor() {
    this.notifications = [];
    this.isLoading = false;

    // Purge legacy mock notifications keys if present in localStorage
    try {
      localStorage.removeItem('toolrent_notifications_v1');
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith('toolrent_user_notifications')) {
          localStorage.removeItem(k);
        }
      });
    } catch (_) {}

    // Load initial notifications
    this.load();

    // Re-sync whenever authentication state changes
    if (typeof window !== 'undefined') {
      window.addEventListener('auth:change', () => {
        this.load();
      });
      window.addEventListener('auth:login', () => {
        this.load();
      });
      window.addEventListener('auth:logout', () => {
        this.notifications = [];
        this.emitChange();
      });
    }
  }

  async load() {
    if (!auth.isAuthenticated()) {
      this.notifications = [];
      this.emitChange();
      return [];
    }

    this.isLoading = true;
    try {
      const data = await api.get('/notifications');
      this.notifications = Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn('No se pudieron cargar notificaciones del backend:', e);
      this.notifications = [];
    } finally {
      this.isLoading = false;
      this.emitChange();
    }
    return this.notifications;
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

  async markAsRead(id) {
    if (!auth.isAuthenticated() || !id) return;
    
    // Optimistic UI update
    this.notifications = this.notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    this.emitChange();

    try {
      await api.patch(`/notifications/${id}/read`);
    } catch (e) {
      console.error('Error al marcar notificación como leída en backend:', e);
      // Re-sync on failure
      this.load();
    }
  }

  async markAllAsRead() {
    if (!auth.isAuthenticated()) return;
    
    // Optimistic UI update
    this.notifications = this.notifications.map(n => ({ ...n, read: true }));
    this.emitChange();

    try {
      await api.patch('/notifications/read-all');
    } catch (e) {
      console.error('Error al marcar todas como leídas en backend:', e);
      this.load();
    }
  }

  async delete(id) {
    if (!auth.isAuthenticated() || !id) return;

    // Optimistic UI update
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.emitChange();

    try {
      await api.delete(`/notifications/${id}`);
    } catch (e) {
      console.error('Error al eliminar notificación en backend:', e);
      this.load();
    }
  }

  /**
   * Adds a notification with real backend persistence and triggers an immediate in-app toast
   */
  async add({ category = 'RENTAL', type = 'success', title, message, link = '#/client' }) {
    // Trigger visual toast banner immediately
    if (message) {
      showToast(message, type, 4500, title);
    }

    if (!auth.isAuthenticated()) return null;

    try {
      const created = await api.post('/notifications', {
        title,
        message,
        type: (type || 'INFO').toUpperCase(),
        category: (category || 'RENTAL').toUpperCase(),
        link: link || '#/client'
      });

      if (created && created.id) {
        this.notifications = [created, ...this.notifications.filter(n => n.id !== created.id)];
        this.emitChange();
        return created;
      }
    } catch (e) {
      console.warn('Error al guardar notificación en backend (se mantendrá refresco periódico):', e);
      // Reload from backend
      await this.load();
    }

    return null;
  }

  // Alias for backward compatibility across dashboard modules
  async addNotification(opts) {
    return this.add(opts);
  }
}

export const notificationsStore = new NotificationsStore();
