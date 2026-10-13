/**
 * In-memory Mock Data Store for ToolRent Frontend
 * Exactly matching the ToolRent Design Specs from img/
 */

export const mockCategories = [
  { id: 'cat-all', name: 'Todas', icon: 'LayoutGrid', count: 48 },
  { id: 'cat-electricas', name: 'Herramientas eléctricas', icon: 'Zap', count: 12 },
  { id: 'cat-construccion', name: 'Construcción', icon: 'Home', count: 10 },
  { id: 'cat-demolicion', name: 'Demolición', icon: 'Hammer', count: 6 },
  { id: 'cat-elevacion', name: 'Elevación', icon: 'ArrowUpCircle', count: 5 },
  { id: 'cat-compactacion', name: 'Compactación', icon: 'Layers', count: 4 },
  { id: 'cat-jardineria', name: 'Jardinería', icon: 'Sprout', count: 3 },
  { id: 'cat-generadores', name: 'Generadores', icon: 'BatteryCharging', count: 3 },
  { id: 'cat-soldadura', name: 'Soldadura', icon: 'Flame', count: 2 },
  { id: 'cat-limpieza', name: 'Limpieza', icon: 'Sparkles', count: 2 },
  { id: 'cat-otros', name: 'Otros', icon: 'MoreHorizontal', count: 1 },
];

export const mockTools = [
  {
    id: 'tool-001',
    name: 'Taladro percutor DeWalt 20V',
    categoryId: 'cat-electricas',
    categoryName: 'Herramientas eléctricas',
    brand: 'DeWalt',
    model: 'DCD996B',
    dailyPrice: 35000,
    replacementValue: 650000,
    status: 'AVAILABLE',
    images: [
      { imageUrl: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=1000&auto=format&fit=crop&q=80', isPrimary: true },
      { imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1000&auto=format&fit=crop&q=80', isPrimary: false },
      { imageUrl: 'https://images.unsplash.com/photo-1534398079543-7ae6d016b86a?w=1000&auto=format&fit=crop&q=80', isPrimary: false },
    ],
    description: 'Taladro percutor inalámbrico de alto rendimiento con motor sin escobillas (brushless). Ofrece 3 velocidades y luz LED de 3 modos para trabajos en concreto, metal y madera.',
    specs: [
      { specName: 'Marca', specValue: 'DeWalt' },
      { specName: 'Modelo', specValue: 'DCD996B' },
      { specName: 'Voltaje', specValue: '20V MAX' },
      { specName: 'Velocidad', specValue: '0-2,000 RPM' },
      { specName: 'Golpes por minuto', specValue: '0-38,250 GPM' },
      { specName: 'Tamaño del mandril', specValue: '1/2" metálico' },
      { specName: 'Peso', specValue: '2.1 kg' },
    ],
    highlights: ['Incluye 2 baterías 4Ah', 'Cargador rápido', 'Maletín rígido', 'Empuñadura lateral 360°'],
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
    id: 'tool-002',
    name: 'Mezcladora de concreto 400 L',
    categoryId: 'cat-construccion',
    categoryName: 'Construcción',
    brand: 'Cipsa',
    model: 'Maxi 10 Syntesi',
    dailyPrice: 120000,
    replacementValue: 4800000,
    status: 'RENTED',
    images: [
      { imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1000&auto=format&fit=crop&q=80', isPrimary: true }
    ],
    description: 'Trompo mezclador con tambor de 400 litros y motor a gasolina de 9 HP. Ideal para vaciado continuo de vigas, placas y zapatas en obra civil.',
    specs: [
      { specName: 'Capacidad del tambor', specValue: '400 L' },
      { specName: 'Rendimiento de mezcla', specValue: '280 L' },
      { specName: 'Motor', specValue: 'Gasolina Honda 9 HP' },
      { specName: 'Llantas', specValue: 'Neumáticas con rin' },
      { specName: 'Peso', specValue: '190 kg' },
    ],
    highlights: ['Basculamiento asistido', 'Enganche para remolque', 'Cuba de hierro forjado'],
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
    id: 'tool-003',
    name: 'Martillo demoledor 30 kg',
    categoryId: 'cat-demolicion',
    categoryName: 'Demolición',
    brand: 'Bosch',
    model: 'GSH 27 VC Professional',
    dailyPrice: 90000,
    replacementValue: 7200000,
    status: 'AVAILABLE',
    images: [
      { imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1000&auto=format&fit=crop&q=80', isPrimary: true }
    ],
    description: 'El martillo demoledor eléctrico más potente para suelos y pavimentos. Energía de impacto de 62 J con sistema de reducción de vibraciones Vibration Control.',
    specs: [
      { specName: 'Potencia absorbida', specValue: '2.000 W' },
      { specName: 'Energía de impacto', specValue: '62 J' },
      { specName: 'Número de impactos', specValue: '1.000 IPM' },
      { specName: 'Portaherramientas', specValue: 'Hexágono interior 28 mm' },
      { specName: 'Peso', specValue: '29.5 kg' },
    ],
    highlights: ['Incluye cincel plano y de punta', 'Carro de transporte', 'Cable de alta resistencia 5m'],
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
    id: 'tool-004',
    name: 'Cortadora de concreto 14"',
    categoryId: 'cat-construccion',
    categoryName: 'Construcción',
    brand: 'Stihl',
    model: 'TS 420',
    dailyPrice: 80000,
    replacementValue: 4200000,
    status: 'MAINTENANCE',
    images: [
      { imageUrl: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=1000&auto=format&fit=crop&q=80', isPrimary: true }
    ],
    description: 'Tronzadora de disco a gasolina para corte de concreto, asfalto y mampostería. Sistema de filtro de aire de larga duración con separación previa ciclónica.',
    specs: [
      { specName: 'Cilindrada', specValue: '66.7 cm³' },
      { specName: 'Potencia', specValue: '4.4 HP' },
      { specName: 'Diámetro de disco', specValue: '350 mm / 14"' },
      { specName: 'Profundidad de corte máx.', specValue: '125 mm' },
      { specName: 'Peso', specValue: '9.6 kg' },
    ],
    highlights: ['Conexión de agua para corte húmedo', 'Disco diamantado incluido', 'Sistema antivibración'],
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
    id: 'tool-005',
    name: 'Plataforma elevadora 10 m',
    categoryId: 'cat-elevacion',
    categoryName: 'Elevación',
    brand: 'Genie',
    model: 'GS-2632',
    dailyPrice: 250000,
    replacementValue: 45000000,
    status: 'AVAILABLE',
    images: [
      { imageUrl: 'https://images.unsplash.com/photo-1590496793929-36417d3117de?w=1000&auto=format&fit=crop&q=80', isPrimary: true }
    ],
    description: 'Plataforma tijera eléctrica compacta para trabajo en alturas en interiores y exteriores planos. Emisión cero y funcionamiento silencioso.',
    specs: [
      { specName: 'Altura de trabajo máx.', specValue: '9.93 m' },
      { specName: 'Capacidad de elevación', specValue: '227 kg' },
      { specName: 'Ancho de máquina', specValue: '0.81 m' },
      { specName: 'Fuente de energía', specValue: 'Baterías 24V DC' },
      { specName: 'Peso operativo', specValue: '1.956 kg' },
    ],
    highlights: ['Neumáticos que no dejan marcas', 'Extensión de plataforma deslizable', 'Control proporcional'],
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
    id: 'tool-006',
    name: 'Generador 8 kW',
    categoryId: 'cat-generadores',
    categoryName: 'Generadores',
    brand: 'Honda',
    model: 'EU7000is',
    dailyPrice: 110000,
    replacementValue: 8500000,
    status: 'RENTED',
    images: [
      { imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1000&auto=format&fit=crop&q=80', isPrimary: true }
    ],
    description: 'Planta eléctrica insonorizada con tecnología Inverter y arranque eléctrico. Suministro eléctrico limpio y estable para maquinaria e instrumentos sensibles.',
    specs: [
      { specName: 'Potencia máxima', specValue: '8.000 Watts' },
      { specName: 'Potencia continua', specValue: '7.000 Watts' },
      { specName: 'Voltaje', specValue: '120/240 V Bifásico' },
      { specName: 'Nivel sonoro', specValue: '58 dBA' },
      { specName: 'Autonomía', specValue: '12 horas al 50%' },
      { specName: 'Peso', specValue: '118 kg' },
    ],
    highlights: ['Arranque electrónico de llave', 'Ruedas de transporte', 'Protección por bajo nivel de aceite'],
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
      { imageUrl: 'https://images.unsplash.com/photo-1534398079543-7ae6d016b86a?w=1000&auto=format&fit=crop&q=80', isPrimary: true },
      { imageUrl: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=1000&auto=format&fit=crop&q=80', isPrimary: false },
      { imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1000&auto=format&fit=crop&q=80', isPrimary: false },
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
    highlights: ['Incluye maletín', '2 brocas SDS', 'Empuñadura lateral', 'Tope de profundidad'],
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
    name: 'Placa compactadora 90 kg',
    categoryId: 'cat-compactacion',
    categoryName: 'Compactación',
    brand: 'Wacker Neuson',
    model: 'VP 1550',
    dailyPrice: 150000,
    replacementValue: 5600000,
    status: 'AVAILABLE',
    images: [
      { imageUrl: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=1000&auto=format&fit=crop&q=80', isPrimary: true }
    ],
    description: 'Placa vibratoria unidireccional para compactación de asfalto y suelos mixtos. Excelente avance y maniobrabilidad en espacios reducidos.',
    specs: [
      { specName: 'Fuerza centrífuga', specValue: '15 kN' },
      { specName: 'Ancho de la placa', specValue: '500 mm' },
      { specName: 'Velocidad de trabajo', specValue: '20 m/min' },
      { specName: 'Motor', specValue: 'Honda GX160 5.5 HP' },
      { specName: 'Peso', specValue: '91 kg' },
    ],
    highlights: ['Tanque de agua desmontable', 'Manillar antivibración plegable', 'Ruedas de transporte'],
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
    id: 'tool-009',
    name: 'Andamio multidireccional',
    categoryId: 'cat-construccion',
    categoryName: 'Construcción',
    brand: 'Layher',
    model: 'Allround',
    dailyPrice: 28000,
    replacementValue: 1800000,
    status: 'MAINTENANCE',
    images: [
      { imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000&auto=format&fit=crop&q=80', isPrimary: true }
    ],
    description: 'Cuerpo de andamio certificado de alta seguridad para fachadas e interiores. Nudo de disco autoblocante con 8 conexiones por punto.',
    specs: [
      { specName: 'Material', specValue: 'Acero galvanizado' },
      { specName: 'Carga admisible', specValue: '600 kg/m²' },
      { specName: 'Altura por cuerpo', specValue: '2.0 m' },
      { specName: 'Ancho de plataforma', specValue: '0.73 m' },
      { specName: 'Normativa', specValue: 'NTC 1644 / OSHA' },
    ],
    highlights: ['Plataformas antideslizantes', 'Rodapiés de seguridad', 'Diagonales de arriostramiento'],
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
    id: 'tool-010',
    name: 'Pulidora angular 7"',
    categoryId: 'cat-electricas',
    categoryName: 'Herramientas eléctricas',
    brand: 'Makita',
    model: 'GA7020',
    dailyPrice: 95000,
    replacementValue: 780000,
    status: 'AVAILABLE',
    images: [
      { imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000&auto=format&fit=crop&q=80', isPrimary: true }
    ],
    description: 'Esmeriladora angular de 7 pulgadas con motor de alto rendimiento para desbaste pesado y corte en vigas de acero y mampostería.',
    specs: [
      { specName: 'Potencia', specValue: '2.200 W' },
      { specName: 'Diámetro de disco', specValue: '180 mm (7")' },
      { specName: 'Velocidad sin carga', specValue: '8.500 RPM' },
      { specName: 'Eje', specValue: 'M14' },
      { specName: 'Peso', specValue: '5.5 kg' },
    ],
    highlights: ['Guarda de protección sin llave', 'Empuñadura antivibración', 'Arranque suave'],
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
    id: 'tool-011',
    name: 'Desbrozadora a gasolina Stihl FS 250',
    categoryId: 'cat-jardineria',
    categoryName: 'Jardinería',
    brand: 'Stihl',
    model: 'FS 250',
    dailyPrice: 45000,
    replacementValue: 2400000,
    status: 'AVAILABLE',
    images: [
      { imageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1000&auto=format&fit=crop&q=80', isPrimary: true }
    ],
    description: 'Potente guadañadora profesional para desmalezado de terrenos rústicos, mantenimiento de taludes y desmonte de matorrales.',
    specs: [
      { specName: 'Cilindrada', specValue: '40.2 cm³' },
      { specName: 'Potencia', specValue: '2.15 HP' },
      { specName: 'Peso', specValue: '6.3 kg' },
      { specName: 'Capacidad tanque', specValue: '0.64 L' }
    ],
    highlights: ['Arnés profesional doble', 'Cuchilla de 3 puntas y yoyo de nylon', 'Sistema antivibratorio'],
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
    id: 'tool-012',
    name: 'Soldador Inverter Miller Maxstar 210',
    categoryId: 'cat-soldadura',
    categoryName: 'Soldadura',
    brand: 'Miller',
    model: 'Maxstar 210',
    dailyPrice: 95000,
    replacementValue: 6800000,
    status: 'AVAILABLE',
    images: [
      { imageUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1000&auto=format&fit=crop&q=80', isPrimary: true }
    ],
    description: 'Equipo de soldadura TIG y electrodo revestido con tecnología Auto-Line. Arco ultraestable para tuberías, estructuras y acero inoxidable.',
    specs: [
      { specName: 'Corriente de salida', specValue: '5 - 210 A' },
      { specName: 'Voltaje de entrada', specValue: '120 - 480 V' },
      { specName: 'Ciclo de trabajo', specValue: '60% @ 175 A' },
      { specName: 'Peso', specValue: '15.9 kg' }
    ],
    highlights: ['Portaelectrodo y pinza de masa', 'Careta fotosensible incluida', 'Función Hot Start'],
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
    id: 'tool-013',
    name: 'Hidrolavadora industrial Kärcher HD 6/15',
    categoryId: 'cat-limpieza',
    categoryName: 'Limpieza',
    brand: 'Kärcher',
    model: 'HD 6/15-4 Classic',
    dailyPrice: 65000,
    replacementValue: 3900000,
    status: 'AVAILABLE',
    images: [
      { imageUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=1000&auto=format&fit=crop&q=80', isPrimary: true }
    ],
    description: 'Lavadora a presión de agua fría con bomba de cigüeñal y pistones cerámicos. Especial para limpieza de fachadas, maquinaria y obras.',
    specs: [
      { specName: 'Presión de trabajo', specValue: '150 bar / 2.175 PSI' },
      { specName: 'Caudal de agua', specValue: '600 L/h' },
      { specName: 'Potencia conectada', specValue: '3.4 kW' },
      { specName: 'Peso', specValue: '52 kg' }
    ],
    highlights: ['Manguera de alta presión 10m', 'Lanza de acero inoxidable 850mm', 'Boquilla de alto impacto'],
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
    id: 'tool-014',
    name: 'Compresor de aire DeWalt 15 Galones',
    categoryId: 'cat-otros',
    categoryName: 'Otros',
    brand: 'DeWalt',
    model: 'DXCM271.COM',
    dailyPrice: 55000,
    replacementValue: 2800000,
    status: 'AVAILABLE',
    images: [
      { imageUrl: 'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=1000&auto=format&fit=crop&q=80', isPrimary: true }
    ],
    description: 'Compresor vertical de 200 PSI máx con motor de inducción libre de aceite. Ideal para clavadoras neumáticas, pintura y soplado.',
    specs: [
      { specName: 'Capacidad de tanque', specValue: '57 L (15 Gal)' },
      { specName: 'Presión máx.', specValue: '200 PSI' },
      { specName: 'Flujo de aire', specValue: '5.1 SCFM @ 90 PSI' },
      { specName: 'Nivel de ruido', specValue: '78 dBA' }
    ],
    highlights: ['Ruedas neumáticas de 10"', 'Regulador de alta precisión', 'Doble acople rápido'],
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
    id: 'tool-015',
    name: 'Rotomartillo demoledor SDS-Max 1500W',
    categoryId: 'cat-demolicion',
    categoryName: 'Demolición',
    brand: 'Bosch',
    model: 'GBH 8-45 D',
    dailyPrice: 85000,
    replacementValue: 4600000,
    status: 'AVAILABLE',
    images: [
      { imageUrl: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=1000&auto=format&fit=crop&q=80', isPrimary: true }
    ],
    description: 'Combinado robusto para perforaciones profundas en hormigón armado y demolición media con embrague de seguridad.',
    specs: [
      { specName: 'Potencia', specValue: '1.500 W' },
      { specName: 'Energía de impacto', specValue: '12.5 J' },
      { specName: 'Diámetro de perforación', specValue: '12 - 45 mm' }
    ],
    highlights: ['Bloqueo automático de gatillo', 'Maletín de transporte', 'Puntero y cincel SDS-Max'],
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
    id: 'tool-016',
    name: 'Torre de iluminación móvil 4x1000W',
    categoryId: 'cat-generadores',
    categoryName: 'Generadores',
    brand: 'Generac Mobile',
    model: 'VT1 Light Tower',
    dailyPrice: 180000,
    replacementValue: 28000000,
    status: 'AVAILABLE',
    images: [
      { imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1000&auto=format&fit=crop&q=80', isPrimary: true }
    ],
    description: 'Torre telescópica con mástil vertical de 8.5 m y 4 reflectores de halogenuros metálicos de 1.000 W cada uno. Motor diésel con generador integrado.',
    specs: [
      { specName: 'Potencia luminosa', specValue: '360.000 lúmenes' },
      { specName: 'Mástil telescópico', specValue: '8.5 m rotación 340°' },
      { specName: 'Autonomía de combustible', specValue: '60 horas continuas' }
    ],
    highlights: ['Remolque vial con luces y tiro', 'Estabilizadores mecánicos', 'Arranque eléctrico'],
    provider: {
      id: 'prov-002',
      name: 'Equipos & Maquinaria Colombia',
      rating: 4.9,
      reviewsCount: 89,
      phone: '+57 310 888 7766',
      city: 'Bogotá D.C.'
    }
  }
];

// Curated Bank of URLs matching DB V2__seed_data.sql for offline preloading
export const curatedCatalogImageUrls = [
  'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1581092446327-9b52bd1570c2?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534398079543-7ae6d016b86a?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1590496793929-36417d3117de?w=1000&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1000&auto=format&fit=crop&q=80',
];

export const mockRequests = [
  {
    id: 'SOL-001',
    client: { name: 'Constructora del Norte S.A.S.', email: 'contacto@cnorte.com', phone: '+57 317 654 3210' },
    tool: { id: 'tool-007', name: 'Taladro percutor 1"', category: 'Herramientas eléctricas', img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=100' },
    toolsCount: 2,
    startDate: '13 oct 2026',
    endDate: '16 oct 2026',
    dates: '13 oct - 16 oct 2026',
    days: 4,
    total: 1760000,
    status: 'PENDING',
  },
  {
    id: 'SOL-002',
    client: { name: 'Juan Carlos Ramírez', email: 'jc.ramirez@constructores.co', phone: '+57 311 456 7890' },
    tool: { id: 'tool-002', name: 'Excavadora hidráulica 20 ton', category: 'Movimiento de tierras', img: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=100' },
    toolsCount: 1,
    startDate: '10 oct 2026',
    endDate: '12 oct 2026',
    dates: '10 oct - 12 oct 2026',
    days: 3,
    total: 255000,
    status: 'CONFIRMED',
  },
  {
    id: 'SOL-003',
    client: { name: 'Obras y Diseños SAS', email: 'administracion@obrasydisenos.com', phone: '+57 314 987 6543' },
    tool: { id: 'tool-003', name: 'Martillo demoledor 30 kg', category: 'Demolición', img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=100' },
    toolsCount: 3,
    startDate: '08 oct 2026',
    endDate: '11 oct 2026',
    dates: '08 oct - 11 oct 2026',
    days: 4,
    total: 3280000,
    status: 'IN_PROGRESS',
  },
  {
    id: 'SOL-004',
    client: { name: 'Alianza Constructores', email: 'alianza@constructores.com', phone: '+57 320 111 2233' },
    tool: { id: 'tool-008', name: 'Placa compactadora 90 kg', category: 'Compactación', img: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=100' },
    toolsCount: 1,
    startDate: '05 oct 2026',
    endDate: '07 oct 2026',
    dates: '05 oct - 07 oct 2026',
    days: 3,
    total: 450000,
    status: 'COMPLETED',
  },
  {
    id: 'SOL-005',
    client: { name: 'Proyectos del Valle', email: 'gerencia@proyectosvalle.com', phone: '+57 315 222 3344' },
    tool: { id: 'tool-005', name: 'Plataforma elevadora 10 m', category: 'Elevación', img: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=100' },
    toolsCount: 2,
    startDate: '02 oct 2026',
    endDate: '05 oct 2026',
    dates: '02 oct - 05 oct 2026',
    days: 3,
    total: 1920000,
    status: 'CANCELLED',
  }
];

export const mockAdminUsers = [
  { id: 'usr-01', name: 'Juan Pérez García', email: 'juan.perez@ejemplo.com', role: 'Cliente', date: '13 oct 2026', active: true, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' },
  { id: 'usr-02', name: 'Carlos Rodríguez', email: 'carlos.rodriguez@ejemplo.com', role: 'Proveedor', date: '11 oct 2026', active: true, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100' },
  { id: 'usr-03', name: 'Laura Gómez', email: 'laura.gomez@ejemplo.com', role: 'Cliente', date: '09 oct 2026', active: true, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' },
  { id: 'usr-04', name: 'Diego Torres', email: 'diego.torres@ejemplo.com', role: 'Proveedor', date: '07 oct 2026', active: true, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100' },
  { id: 'usr-05', name: 'Ana Martínez', email: 'ana.martinez@ejemplo.com', role: 'Cliente', date: '05 oct 2026', active: false, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100' },
  { id: 'usr-06', name: 'Admin General ToolRent', email: 'admin@toolrent.co', role: 'Administrador', date: '01 oct 2026', active: true, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100' },
];

export const mockAdminKpis = {
  totalIncome: 12450000,
  activeRentals: 18,
  totalUsers: 42,
  availableTools: 56,
  totalTools: 78,
  topTools: [
    { name: 'Excavadora hidráulica', count: 24, percent: 80 },
    { name: 'Taladro percutor', count: 18, percent: 60 },
    { name: 'Compresor de aire', count: 15, percent: 50 },
    { name: 'Martillo demoledor', count: 12, percent: 40 },
    { name: 'Andamio multidireccional', count: 10, percent: 33 },
  ],
  topClients: [
    { name: 'Constructora del Norte S.A.S.', count: 12 },
    { name: 'Juan Carlos Ramírez', count: 9 },
    { name: 'Obras y Diseños S.A.S', count: 7 },
    { name: 'Alianza Constructores', count: 6 },
    { name: 'Proyectos del Valle', count: 5 },
  ]
};
