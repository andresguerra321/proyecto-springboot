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

  async login(username, password, onProgress = null) {
    if (typeof onProgress === 'function') {
      onProgress({
        step: 1,
        percent: 30,
        title: 'Iniciando sesión...',
        message: 'Validando credenciales de acceso...',
        subtext: 'Configurando tus credenciales...'
      });
    }

    const res = await api.post('/auth/login', { username, password });
    if (!res || !res.token) {
      throw new Error('Respuesta de autenticación inválida: no se recibió token');
    }

    this.token = res.token;
    localStorage.setItem('token', this.token);

    if (typeof onProgress === 'function') {
      onProgress({
        step: 2,
        percent: 75,
        title: 'Verificando acceso...',
        message: 'Sincronizando tu espacio de trabajo...',
        subtext: 'Sincronizando perfil de usuario...'
      });
    }

    // Single DTO projection query in MySQL/PostgreSQL via /api/v1/auth/verify-session
    let sessionData = null;
    try {
      sessionData = await api.get('/auth/verify-session');
    } catch (err) {
      console.warn('Could not load session projection via /auth/verify-session', err);
    }

    // Fetch user info from /users/me and profile for backward compatibility
    let me = null;
    let profile = null;
    try {
      me = await api.get('/users/me');
      if (me?.roles?.some(r => r.includes('PROVEEDOR'))) {
        try { profile = await api.get('/providers/me'); } catch (e) { /* might not have profile yet */ }
      } else if (me?.roles?.some(r => r.includes('CLIENTE'))) {
        try { profile = await api.get('/clients/me'); } catch (e) { /* might not have profile yet */ }
      }
    } catch (e) {
      console.warn('Could not load extra me/profile', e);
    }

    const decoded = this.decodeJwt(this.token);
    const resolvedRoles = me?.roles || decoded?.roles || (sessionData?.rol ? [`ROLE_${sessionData.rol.replace('ROLE_', '')}`] : ['ROLE_CLIENTE']);
    const cleanRole = sessionData?.rol ? sessionData.rol.replace('ROLE_', '') : (resolvedRoles[0] || 'CLIENTE').replace('ROLE_', '');
    const displayName = sessionData?.nombre || profile?.fullName || profile?.companyName || me?.username || decoded?.sub || username;

    const consolidatedSession = {
      id: sessionData?.id || me?.id,
      nombre: displayName,
      email: sessionData?.email || me?.email,
      rol: cleanRole,
      username: sessionData?.username || me?.username || username,
      profile: profile
    };

    // Pre-hydrate context in sessionStorage to avoid extra network queries when entering destination dashboard
    sessionStorage.setItem('toolrent_user_context', JSON.stringify(consolidatedSession));
    sessionStorage.setItem('verified_session', JSON.stringify(consolidatedSession));
    sessionStorage.setItem('user_profile', JSON.stringify(consolidatedSession));

    this.user = {
      id: consolidatedSession.id,
      username: consolidatedSession.username,
      email: consolidatedSession.email,
      roles: resolvedRoles,
      profile: profile || consolidatedSession,
      nombre: displayName,
      rol: cleanRole
    };
    localStorage.setItem('user', JSON.stringify(this.user));

    if (typeof onProgress === 'function') {
      onProgress({
        step: 3,
        percent: 100,
        title: '¡Sesión Verificada!',
        message: `¡Bienvenido de nuevo, ${displayName}! Accediendo al panel ${cleanRole}...`,
        subtext: `Perfil verificado como ${cleanRole}. Redirigiendo...`,
        data: consolidatedSession
      });
    }

    this.notifyChange();
    return {
      user: this.user,
      session: consolidatedSession,
      token: this.token,
      roles: this.user.roles,
      rol: cleanRole
    };
  }

  getVerifiedSession() {
    try {
      const stored = sessionStorage.getItem('toolrent_user_context') || sessionStorage.getItem('verified_session');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  async register({ username, email, password, roles, role, fullName, documentType, documentNumber, phone, address, city, companyName, taxId }, onProgress) {
    const targetRoles = roles && roles.length > 0 ? roles : [role || 'ROLE_CLIENTE'];

    // Phase 1: Step 1 (35%)
    if (typeof onProgress === 'function') {
      onProgress({
        step: 1,
        percent: 35,
        title: 'Creando tu cuenta...',
        message: 'Configurando tus credenciales...',
        subtext: 'Registrando cuenta de usuario...'
      });
    }

    // 1. Direct POST to /auth/register which saves within @Transactional and returns { token, type, username }
    const registerRes = await api.post('/auth/register', {
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

    const token = registerRes?.token || registerRes?.jwtToken;
    if (!token) {
      throw new Error('No se recibió el token de seguridad tras el registro.');
    }

    // Immediately store the token in localStorage
    this.token = token;
    localStorage.setItem('token', this.token);

    // Phase 2: Step 2 (75%)
    if (typeof onProgress === 'function') {
      onProgress({
        step: 2,
        percent: 75,
        title: 'Verificando acceso...',
        message: 'Sincronizando tu espacio de trabajo...',
        subtext: 'Verificando perfil de usuario...'
      });
    }

    // 2. Invoke GET /api/v1/auth/verify-session with Authorization: Bearer <token>
    const sessionData = await api.get('/auth/verify-session');

    if (!sessionData || !sessionData.id) {
      throw new Error('La verificación de sesión no devolvió un usuario activo.');
    }

    // Phase 3: Step 3 (100%) - Store in sessionStorage to save initial database queries on destination dashboard
    sessionStorage.setItem('toolrent_user_context', JSON.stringify(sessionData));
    sessionStorage.setItem('verified_session', JSON.stringify(sessionData));
    sessionStorage.setItem('user_profile', JSON.stringify(sessionData));

    // Construct local user state
    const cleanRole = sessionData.rol ? sessionData.rol.replace('ROLE_', '') : 'CLIENTE';
    const canonicalRole = `ROLE_${cleanRole}`;

    this.user = {
      id: sessionData.id,
      nombre: sessionData.nombre,
      email: sessionData.email,
      rol: cleanRole,
      username: sessionData.username || sessionData.nombre || username,
      roles: [canonicalRole],
      profile: {
        id: sessionData.id,
        fullName: sessionData.nombre,
        companyName: sessionData.nombre,
        email: sessionData.email,
        rol: cleanRole
      }
    };
    localStorage.setItem('user', JSON.stringify(this.user));

    if (typeof onProgress === 'function') {
      onProgress({
        step: 3,
        percent: 100,
        title: '¡Sesión verificada!',
        message: `¡Bienvenido, ${sessionData.nombre || username}! Accediendo al panel...`,
        data: sessionData
      });
    }

    this.notifyChange();
    return {
      session: sessionData,
      user: this.user,
      token: this.token,
      rol: cleanRole
    };
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('verified_session');
    sessionStorage.removeItem('user_profile');
    this.notifyChange();
  }

  notifyChange() {
    window.dispatchEvent(new CustomEvent('auth:change', { detail: { user: this.user } }));
  }
}

export const auth = new AuthState();
export default auth;
