import { mockCategories, mockTools, mockRequests, mockAdminUsers, mockAdminKpis } from './mock-store.js';

const API_BASE_URL = 'http://localhost:8085/api/v1';

// Control flag: Run in standalone mock mode (Stitch design preview) or live backend
export const USE_MOCK_BACKEND = false;

class ApiClient {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
    // Local state for mock mode
    this.mockTools = [...mockTools];
    this.mockRequests = [...mockRequests];
    this.mockUsers = [...mockAdminUsers];
  }

  getToken() {
    return localStorage.getItem('token');
  }

  getHeaders(isFormData = false) {
    const headers = {};
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
      headers['Accept'] = 'application/json';
    }
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    if (USE_MOCK_BACKEND) {
      return this.handleMockRequest(endpoint, options);
    }

    const isFormData = options.body instanceof FormData;
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(isFormData),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new CustomEvent('auth:expired'));
        throw new Error('Tu sesión ha expirado. Por favor ingresa nuevamente.');
      }

      const contentType = response.headers.get('content-type') || '';
      let data = null;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else if (contentType.includes('text/html') || contentType.includes('text/plain')) {
        data = await response.text();
      }

      if (!response.ok) {
        const errorMsg = data?.message || data?.error || (typeof data === 'string' ? data : `Error HTTP ${response.status}`);
        const error = new Error(errorMsg);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      if (err.status) {
        // Legitimate HTTP error response from server (400, 401, 403, 404, etc.)
        throw err;
      }
      console.warn(`[Live API offline] ${options.method || 'GET'} ${url} failed, fallback to mock:`, err);
      // Fallback to mock if server is completely offline
      return this.handleMockRequest(endpoint, options);
    }
  }

  // Autonomous Mock Handler for ToolRent UI
  async handleMockRequest(endpoint, options = {}) {
    // Artificial small delay for realistic UX micro-animations
    await new Promise(r => setTimeout(r, 120));
    const method = options.method || 'GET';
    const body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : {};

    // 1. Categories
    if (endpoint.startsWith('/tools/categories')) {
      return mockCategories;
    }

    // 2. Tools
    if (endpoint.startsWith('/tools')) {
      if (endpoint.includes('/availability')) {
        return { available: true, bookedDateRanges: [] };
      }
      if (method === 'GET') {
        const [path, qs] = endpoint.split('?');
        const params = new URLSearchParams(qs || '');
        let list = [...this.mockTools];
        if (params.get('status')) list = list.filter(t => t.status === params.get('status'));
        if (params.get('categoryId')) list = list.filter(t => t.categoryId === params.get('categoryId'));
        return list;
      }
      if (method === 'POST') {
        const newTool = {
          id: `tool-${Date.now().toString().slice(-4)}`,
          name: body.name || 'Nueva Herramienta',
          brand: body.brand || 'ToolRent Pro',
          model: body.model || 'Standard',
          dailyPrice: body.dailyPrice || 90000,
          replacementValue: body.replacementValue || 1500000,
          status: 'AVAILABLE',
          description: body.description || '',
          images: body.images || [{ imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800', isPrimary: true }],
          specs: body.specifications || []
        };
        this.mockTools.unshift(newTool);
        return newTool;
      }
      if (method === 'DELETE') {
        const id = endpoint.split('/')[2];
        this.mockTools = this.mockTools.filter(t => t.id !== id);
        return { success: true };
      }
    }

    // 3. Auth
    if (endpoint.startsWith('/auth/login')) {
      const username = body.username || 'demo_user';
      let roles = ['ROLE_CLIENTE'];
      if (username.includes('admin')) roles = ['ROLE_ADMIN'];
      if (username.includes('prov') || username.includes('Juan')) roles = ['ROLE_PROVEEDOR'];
      return {
        token: `mock-jwt-token.${btoa(JSON.stringify({ sub: username, roles, exp: Math.floor(Date.now() / 1000) + 86400 }))}.signature`,
        type: 'Bearer'
      };
    }

    if (endpoint.startsWith('/auth/register')) {
      return { id: 'usr-new', username: body.username, email: body.email, enabled: true };
    }

    // 4. Users / Profiles
    if (endpoint === '/users/me') {
      const token = this.getToken();
      let roles = ['ROLE_CLIENTE'];
      let username = 'Juan Pérez';
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          roles = payload.roles || roles;
          username = payload.sub || username;
        } catch {}
      }
      return { id: 'usr-01', username, email: 'juan.perez@email.com', roles };
    }

    if (endpoint === '/providers/me') {
      return { id: 'prov-001', companyName: 'Constructoras del Norte S.A.S.', taxId: '901.234.567-8', verified: true };
    }

    if (endpoint === '/clients/me') {
      return { id: 'cli-001', fullName: 'Juan Pérez García', identificationNumber: '1.032.456.789' };
    }

    if (endpoint === '/providers') {
      return [
        { id: 'prov-001', companyName: 'Constructoras del Norte S.A.S.', taxId: '901.234.567-8', contactPhone: '+57 317 654 3210', city: 'Bucaramanga, Santander', verified: true },
        { id: 'prov-002', companyName: 'Equipos & Maquinaria Colombia', taxId: '900.876.543-2', contactPhone: '+57 310 888 7766', city: 'Bogotá D.C.', verified: false },
      ];
    }

    if (endpoint.includes('/verify')) {
      return { success: true, verified: true };
    }

    if (endpoint === '/users') {
      return this.mockUsers.map(u => ({
        id: u.id,
        username: u.name,
        email: u.email,
        roles: u.role === 'Cliente' ? ['ROLE_CLIENTE'] : ['ROLE_PROVEEDOR'],
        enabled: u.active
      }));
    }

    // 5. Rentals
    if (endpoint.startsWith('/rentals/provider/')) {
      return this.mockRequests;
    }

    if (endpoint.startsWith('/rentals/client/')) {
      return this.mockRequests.map(r => ({
        id: r.id,
        startDate: '2026-10-13',
        endDate: '2026-10-16',
        totalAmount: r.total,
        status: r.status,
        createdAt: '2026-10-13T09:00:00Z',
        items: [{ toolName: r.tool.name, dailyPrice: 85000 }]
      }));
    }

    if (endpoint.startsWith('/rentals')) {
      if (method === 'PATCH') {
        const id = endpoint.split('/')[2];
        const action = endpoint.split('/')[3];
        const req = this.mockRequests.find(r => r.id === id);
        if (req) {
          if (action === 'confirm') req.status = 'CONFIRMED';
          if (action === 'start') req.status = 'IN_PROGRESS';
          if (action === 'complete') req.status = 'COMPLETED';
          if (action === 'cancel') req.status = 'CANCELLED';
        }
        return { success: true, id, status: req?.status };
      }
      if (method === 'POST') {
        const newRental = {
          id: `TR-REQ-${Date.now().toString().slice(-4)}`,
          startDate: body.startDate,
          endDate: body.endDate,
          totalAmount: 255000,
          status: 'PENDING'
        };
        this.mockRequests.unshift({
          id: newRental.id,
          client: { name: 'Juan Pérez García', email: 'juan.perez@email.com' },
          tool: { id: body.toolIds?.[0] || 'tool-007', name: 'Taladro percutor 1"' },
          dates: `${body.startDate} - ${body.endDate}`,
          days: 3,
          total: 255000,
          status: 'PENDING'
        });
        return newRental;
      }
      return this.mockRequests;
    }

    // 6. Billing
    if (endpoint.startsWith('/billing/payments')) {
      return { id: `PAY-${Date.now().toString().slice(-6)}`, amount: body.amount || 255000, invoiceId: 'TR-0004587', status: 'APPROVED' };
    }

    if (endpoint.startsWith('/billing/invoices/rental/')) {
      return { id: 'TR-0004587', subtotal: 761000, tax: 144590, total: 905590 };
    }

    // 7. Reporting
    if (endpoint.startsWith('/reporting/provider/')) {
      const pendingCount = this.mockRequests.filter(r => r.status === 'PENDING').length;
      const rentedCount = this.mockRequests.filter(r => r.status === 'IN_PROGRESS').length;
      return {
        totalTools: 24,
        rentedTools: rentedCount || 5,
        totalEarnings: 8450000,
        pendingRentals: pendingCount || 6
      };
    }

    if (endpoint.startsWith('/reporting/income')) {
      return { totalIncome: mockAdminKpis.totalIncome };
    }

    if (endpoint.startsWith('/reporting/tool-availability')) {
      return { availableCount: mockAdminKpis.availableTools, rentedCount: 16, maintenanceCount: 6 };
    }

    if (endpoint.startsWith('/reporting/most-rented-tools')) {
      return mockAdminKpis.topTools.map(t => ({ toolName: t.name, rentalCount: t.count }));
    }

    if (endpoint.startsWith('/reporting/frequent-clients')) {
      return mockAdminKpis.topClients.map(c => ({ clientName: c.name, totalSpent: c.count * 850000 }));
    }

    // 8. Inspections & Damages
    if (endpoint.startsWith('/inspections')) {
      return { id: `INSP-${Date.now().toString().slice(-4)}`, status: 'RECORDED' };
    }

    return { message: 'Mock response successful' };
  }

  get(endpoint, params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        query.append(k, v);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return this.request(`${endpoint}${queryString}`, { method: 'GET' });
  }

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  patch(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  upload(endpoint, file, extraData = {}) {
    const formData = new FormData();
    formData.append('file', file);
    Object.entries(extraData).forEach(([k, v]) => formData.append(k, v));
    return this.post(endpoint, formData);
  }
}

export const api = new ApiClient();
export default api;
