/**
 * In-memory Mock Data Store for ToolRent Frontend (Stitch Design Mode)
 * Provides 100% autonomous interactive functionality without requiring backend connection.
 */

export const mockCategories = [
  { id: 'cat-all', name: 'Todas', icon: 'Sparkles', count: 24 },
  { id: 'cat-manuales', name: 'Herramientas manuales', icon: 'Wrench', count: 4 },
  { id: 'cat-electricas', name: 'Herramientas eléctricas', icon: 'Zap', count: 8 },
  { id: 'cat-compactacion', name: 'Equipos de compactación', icon: 'Layers', count: 3 },
  { id: 'cat-pesada', name: 'Maquinaria pesada', icon: 'Truck', count: 4 },
  { id: 'cat-andamios', name: 'Andamios y formaletas', icon: 'Grid', count: 5 },
];

export const mockTools = [
  {
    id: 'tool-001',
    name: 'Martillo demoledor 10 kg',
    categoryId: 'cat-electricas',
    categoryName: 'Herramientas eléctricas',
    brand: 'DeWalt',
    model: 'D25901K',
    dailyPrice: 185000,
    replacementValue: 2800000,
    status: 'AVAILABLE',
    images: [
      { imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80', isPrimary: true },
      { imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80', isPrimary: false },
    ],
    description: 'Martillo demoledor de alto impacto SDS-Max con control activo de vibración, ideal para demolición en pisos de concreto y paredes de mampostería.',
    specs: [
      { specName: 'Potencia', specValue: '1500 W' },
      { specName: 'Energía de impacto', specValue: '19 Joules' },
      { specName: 'Peso operativo', specValue: '10.5 kg' },
      { specName: 'Encastre', specValue: 'SDS-Max' },
    ],
    provider: {
      id: 'prov-001',
      name: 'Constructoras del Norte S.A.S.',
      rating: 4.8,
      reviewsCount: 124,
      phone: '+57 317 654 3210',
      city: 'Bucaramanga, Santander'
    }
  },
  {
    id: 'tool-002',
    name: 'Excavadora hidráulica 20 ton',
    categoryId: 'cat-pesada',
    categoryName: 'Maquinaria pesada',
    brand: 'Caterpillar',
    model: 'CAT 320D',
    dailyPrice: 1200000,
    replacementValue: 350000000,
    status: 'RENTED',
    images: [
      { imageUrl: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=800&auto=format&fit=crop&q=80', isPrimary: true }
    ],
    description: 'Excavadora sobre orugas de 20 toneladas con balde de 1.2 m³. Excelente potencia y bajo consumo de combustible para excavaciones masivas y movimiento de tierras.',
    specs: [
      { specName: 'Capacidad de balde', specValue: '1.2 m³' },
      { specName: 'Potencia neta', specValue: '148 HP' },
      { specName: 'Profundidad excavación', specValue: '6.72 m' },
      { specName: 'Peso operativo', specValue: '21.500 kg' },
    ],
    provider: {
      id: 'prov-002',
      name: 'Equipos & Maquinaria Colombia',
      rating: 4.9,
      reviewsCount: 89,
      phone: '+57 310 888 7766',
      city: 'Bogotá D.C.'
    }
  },
  {
    id: 'tool-003',
    name: 'Mezcladora de concreto 400 L',
    categoryId: 'cat-compactacion',
    categoryName: 'Equipos de concretos',
    brand: 'Imer',
    model: 'Syntesi 350',
    dailyPrice: 1200000, // or 120000
    dailyPrice: 120000,
    replacementValue: 4500000,
    status: 'MAINTENANCE',
    images: [
      { imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=800&auto=format&fit=crop&q=80', isPrimary: true }
    ],
    description: 'Trompo mezclador para 1.5 bultos con motor a gasolina 9 HP. Cuba de arrastre silencioso y basculamiento controlado.',
    specs: [
      { specName: 'Capacidad del tambor', specValue: '400 Litros' },
      { specName: 'Rendimiento de mezcla', specValue: '280 Litros' },
      { specName: 'Motor', specValue: 'Gasolina 9 HP' },
      { specName: 'Peso', specValue: '190 kg' },
    ],
    provider: {
      id: 'prov-001',
      name: 'Constructoras del Norte S.A.S.',
      rating: 4.8,
      reviewsCount: 124,
      phone: '+57 317 654 3210',
      city: 'Floridablanca, Santander'
    }
  },
  {
    id: 'tool-004',
    name: 'Placa compactadora 90 kg',
    categoryId: 'cat-compactacion',
    categoryName: 'Equipos de compactación',
    brand: 'Wacker Neuson',
    model: 'BPU 2540',
    dailyPrice: 150000,
    replacementValue: 5800000,
    status: 'AVAILABLE',
    images: [
      { imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80', isPrimary: true }
    ],
    description: 'Placa vibratoria unidireccional para compactación de asfalto, suelos mixtos, adoquines y zanjas.',
    specs: [
      { specName: 'Fuerza centrífuga', specValue: '15 kN' },
      { specName: 'Ancho de trabajo', specValue: '500 mm' },
      { specName: 'Motor', specValue: 'Honda GX160 5.5 HP' },
      { specName: 'Peso operativo', specValue: '91 kg' },
    ],
    provider: {
      id: 'prov-001',
      name: 'Constructoras del Norte S.A.S.',
      rating: 4.8,
      reviewsCount: 124,
      phone: '+57 317 654 3210',
      city: 'Bucaramanga, Santander'
    }
  },
  {
    id: 'tool-005',
    name: 'Andamio multidireccional',
    categoryId: 'cat-andamios',
    categoryName: 'Andamios y formaletas',
    brand: 'Layher',
    model: 'Allround Scaffolding',
    dailyPrice: 28000,
    replacementValue: 1200000,
    status: 'AVAILABLE',
    images: [
      { imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861593?w=800&auto=format&fit=crop&q=80', isPrimary: true }
    ],
    description: 'Cuerpo de andamio certificado certificado bajo norma técnica NTC 1644 / OSHA con crucetas, plataformas antideslizantes y niveladores.',
    specs: [
      { specName: 'Altura por sección', specValue: '2.0 m' },
      { specName: 'Capacidad de carga', specValue: '450 kg/m²' },
      { specName: 'Acabado', specValue: 'Acero galvanizado' },
      { specName: 'Certificación', specValue: 'OSHA / EN 12810' },
    ],
    provider: {
      id: 'prov-001',
      name: 'Constructoras del Norte S.A.S.',
      rating: 4.8,
      reviewsCount: 124,
      phone: '+57 317 654 3210',
      city: 'Floridablanca, Santander'
    }
  },
  {
    id: 'tool-006',
    name: 'Pulidora angular 7"',
    categoryId: 'cat-electricas',
    categoryName: 'Herramientas eléctricas',
    brand: 'Bosch',
    model: 'GWS 2200-180',
    dailyPrice: 95000,
    replacementValue: 980000,
    status: 'RENTED',
    images: [
      { imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80', isPrimary: true }
    ],
    description: 'Amoladora angular para desbaste pesado de metal, corte de varillas y preparación de uniones soldadas.',
    specs: [
      { specName: 'Diámetro de disco', specValue: '7 pulgadas (180 mm)' },
      { specName: 'Potencia', specValue: '2200 W' },
      { specName: 'Velocidad', specValue: '8500 RPM' },
      { specName: 'Peso', specValue: '5.2 kg' },
    ],
    provider: {
      id: 'prov-002',
      name: 'Equipos & Maquinaria Colombia',
      rating: 4.9,
      reviewsCount: 89,
      phone: '+57 310 888 7766',
      city: 'Bogotá D.C.'
    }
  },
  {
    id: 'tool-007',
    name: 'Taladro percutor 1"',
    categoryId: 'cat-electricas',
    categoryName: 'Herramientas eléctricas',
    brand: 'DeWalt',
    model: 'DWD520K',
    dailyPrice: 85000,
    replacementValue: 850000,
    status: 'AVAILABLE',
    images: [
      { imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80', isPrimary: true },
      { imageUrl: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&auto=format&fit=crop&q=80', isPrimary: false },
      { imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80', isPrimary: false },
      { imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80', isPrimary: false },
    ],
    description: 'Taladro percutor profesional ideal para trabajos de construcción y remodelación. Ofrece gran potencia y versatilidad para perforar en concreto, metal y madera. Incluye maletín y accesorios.',
    specs: [
      { specName: 'Marca', specValue: 'DeWalt' },
      { specName: 'Modelo', specValue: 'DWD520K' },
      { specName: 'Potencia', specValue: '710 W' },
      { specName: 'Voltaje', specValue: '110 V' },
      { specName: 'Velocidad sin carga', specValue: '0 – 2.800 RPM' },
      { specName: 'Impactos por minuto', specValue: '0 – 47.600 IPM' },
      { specName: 'Capacidad de perforación (madera)', specValue: '25 mm' },
      { specName: 'Capacidad de perforación (metal)', specValue: '13 mm' },
      { specName: 'Capacidad de perforación (concreto)', specValue: '16 mm' },
      { specName: 'Peso', specValue: '2.6 kg' },
    ],
    provider: {
      id: 'prov-001',
      name: 'Constructoras del Norte S.A.S.',
      rating: 4.8,
      reviewsCount: 124,
      phone: '+57 317 654 3210',
      city: 'Floridablanca, Santander'
    }
  },
  {
    id: 'tool-008',
    name: 'Generador eléctrico 8500W',
    categoryId: 'cat-pesada',
    categoryName: 'Generación',
    brand: 'Honda',
    model: 'EU7000is',
    dailyPrice: 195000,
    replacementValue: 7500000,
    status: 'AVAILABLE',
    images: [
      { imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80', isPrimary: true }
    ],
    description: 'Planta eléctrica a gasolina súper insonorizada con arranque eléctrico y tecnología inverter para protección de equipos electrónicos sensibles.',
    specs: [
      { specName: 'Potencia pico', specValue: '8.500 Watts' },
      { specName: 'Autonomía', specValue: '12 horas al 50%' },
      { specName: 'Nivel de ruido', specValue: '58 dBA' },
      { specName: 'Voltaje', specValue: '120/240 V Bifásico' },
    ],
    provider: {
      id: 'prov-001',
      name: 'Constructoras del Norte S.A.S.',
      rating: 4.8,
      reviewsCount: 124,
      phone: '+57 317 654 3210',
      city: 'Bucaramanga, Santander'
    }
  }
];

export const mockRequests = [
  {
    id: 'TR-REQ-001',
    client: { name: 'Juan Pérez García', email: 'juan.perez@email.com', phone: '+57 300 123 4567' },
    tool: { id: 'tool-007', name: 'Taladro percutor 1"', category: 'Herramientas eléctricas', img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=100' },
    dates: '13 oct - 16 oct 2026',
    days: 4,
    total: 340000,
    status: 'PENDING', // Pendiente
  },
  {
    id: 'TR-REQ-002',
    client: { name: 'Carlos Rodríguez', email: 'carlos.rodrigueez@email.com', phone: '+57 311 456 7890' },
    tool: { id: 'tool-002', name: 'Excavadora hidráulica', category: 'Movimiento de tierras', img: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=100' },
    dates: '11 oct - 15 oct 2026',
    days: 5,
    total: 6000000,
    status: 'CONFIRMED', // Confirmada
  },
  {
    id: 'TR-REQ-003',
    client: { name: 'Laura Gómez', email: 'laura.gomez@email.com', phone: '+57 314 987 6543' },
    tool: { id: 'tool-006', name: 'Esmeriladora angular', category: 'Herramientas eléctricas', img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=100' },
    dates: '09 oct - 12 oct 2026',
    days: 4,
    total: 480000,
    status: 'IN_PROGRESS', // En curso
  },
  {
    id: 'TR-REQ-004',
    client: { name: 'Diego Torres', email: 'diego.torres@email.com', phone: '+57 320 111 2233' },
    tool: { id: 'tool-004', name: 'Compactadora', category: 'Compactación', img: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=100' },
    dates: '07 oct - 10 oct 2026',
    days: 4,
    total: 600000,
    status: 'COMPLETED', // Completada
  },
  {
    id: 'TR-REQ-005',
    client: { name: 'Ana Martínez', email: 'ana.martinez@email.com', phone: '+57 315 222 3344' },
    tool: { id: 'tool-003', name: 'Soldadora inverter', category: 'Soldadura', img: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=100' },
    dates: '05 oct - 08 oct 2026',
    days: 4,
    total: 820000,
    status: 'CANCELLED', // Cancelada
  },
  {
    id: 'TR-REQ-006',
    client: { name: 'Andrés López', email: 'andres.lopez@email.com', phone: '+57 318 444 5566' },
    tool: { id: 'tool-001', name: 'Martillo demoledor', category: 'Herramientas eléctricas', img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=100' },
    dates: '03 oct - 06 oct 2026',
    days: 4,
    total: 680000,
    status: 'PENDING', // Pendiente
  }
];

export const mockAdminUsers = [
  { id: 'usr-01', name: 'Juan Pérez García', email: 'juan.perez@ejemplo.com', role: 'Cliente', date: '13 oct 2026', active: true },
  { id: 'usr-02', name: 'Carlos Rodríguez', email: 'carlos.rodriguez@ejemplo.com', role: 'Proveedor', date: '11 oct 2026', active: true },
  { id: 'usr-03', name: 'Laura Gómez', email: 'laura.gomez@ejemplo.com', role: 'Cliente', date: '09 oct 2026', active: true },
  { id: 'usr-04', name: 'Diego Torres', email: 'diego.torres@ejemplo.com', role: 'Proveedor', date: '07 oct 2026', active: true },
  { id: 'usr-05', name: 'Ana Martínez', email: 'ana.martinez@ejemplo.com', role: 'Cliente', date: '05 oct 2026', active: false },
];

export const mockAdminKpis = {
  totalIncome: 12450000,
  activeRentals: 18,
  totalUsers: 42,
  availableTools: 56,
  totalTools: 78,
  topTools: [
    { name: 'Excavadora hidráulica', count: 24, percent: 90 },
    { name: 'Taladro percutor', count: 18, percent: 70 },
    { name: 'Compresor de aire', count: 15, percent: 60 },
    { name: 'Martillo demoledor', count: 12, percent: 48 },
    { name: 'Andamio multidireccional', count: 10, percent: 40 },
  ],
  topClients: [
    { name: 'Constructora del Norte S.A.S.', count: 12 },
    { name: 'Juan Carlos Ramírez', count: 9 },
    { name: 'Obras y Diseños S.A.S', count: 7 },
    { name: 'Alianza Constructores', count: 6 },
    { name: 'Proyectos del Valle', count: 5 },
  ]
};
