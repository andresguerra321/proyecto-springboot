import api from '../api/client.js';

class AuthState {
  constructor() {
    this.token = localStorage.getItem('token');
    this.user = this.loadStoredUser();
  }

  loadStoredUser() {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  decodeJwt(token) {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch (err) {
      console.error('Failed to parse JWT payload', err);
      return null;
    }
  }

  isAuthenticated() {
    if (!this.token) return false;
    const decoded = this.decodeJwt(this.token);
    if (!decoded || !decoded.exp) return false;
    const isExpired = decoded.exp * 1000 < Date.now();
    if (isExpired) {
      this.logout();
      return false;
    }
    return true;
  }

  getUser() {
    return this.user;
  }

  getRoles() {
    if (this.user?.roles) return this.user.roles;
    const decoded = this.decodeJwt(this.token);
    return decoded?.roles || [];
  }

  hasRole(roleName) {
    const roles = this.getRoles();
    const cleanRole = roleName.startsWith('ROLE_') ? roleName : `ROLE_${roleName}`;
    return roles.includes(cleanRole) || roles.includes(roleName);
  }

  isAdmin() {
    return this.hasRole('ADMIN') || this.hasRole('ROLE_ADMIN');
  }

  isProvider() {
    return this.hasRole('PROVEEDOR') || this.hasRole('ROLE_PROVEEDOR');
  }

  isClient() {
    return this.hasRole('CLIENTE') || this.hasRole('ROLE_CLIENTE');
  }

  async login(username, password) {
    const res = await api.post('/auth/login', { username, password });
    if (!res || !res.token) {
      throw new Error('Respuesta de autenticación inválida: no se recibió token');
    }

    this.token = res.token;
    localStorage.setItem('token', this.token);

    // Fetch user info from /users/me
    try {
      const me = await api.get('/users/me');
      let profile = null;

      // Load profile according to role
      if (me.roles.some(r => r.includes('PROVEEDOR'))) {
        try { profile = await api.get('/providers/me'); } catch (e) { /* might not have profile yet */ }
      } else if (me.roles.some(r => r.includes('CLIENTE'))) {
        try { profile = await api.get('/clients/me'); } catch (e) { /* might not have profile yet */ }
      }

      this.user = {
        id: me.id,
        username: me.username,
        email: me.email,
        roles: me.roles,
        profile: profile,
      };
      localStorage.setItem('user', JSON.stringify(this.user));
    } catch (e) {
      console.warn('Could not load profile from /users/me, using JWT payload', e);
      const decoded = this.decodeJwt(this.token);
      this.user = {
        username: decoded.sub || username,
        roles: decoded.roles || [],
      };
      localStorage.setItem('user', JSON.stringify(this.user));
    }

    this.notifyChange();
    return this.user;
  }

  async register({ username, email, password, roles, role, fullName, documentType, documentNumber, phone, address, city, companyName, taxId }) {
    const targetRoles = roles && roles.length > 0 ? roles : [role || 'ROLE_CLIENTE'];

    // 1. Register base user and commercial profile atomically in backend
    await api.post('/auth/register', {
      username,
      email,
      password,
      roles: targetRoles,
      fullName: fullName || (companyName || username),
      documentType: documentType || 'CC',
      documentNumber: documentNumber || '',
      phone: phone || '',
      address: address || '',
      city: city || '',
      companyName: companyName || '',
      taxId: taxId || ''
    });

    // 2. Automatically log in to get token and load profile
    await this.login(username, password);
    return this.user;
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.notifyChange();
  }

  notifyChange() {
    window.dispatchEvent(new CustomEvent('auth:change', { detail: { user: this.user } }));
  }
}

export const auth = new AuthState();
export default auth;
