/**
 * Colombia Departments & Municipalities for ToolRent logistics and machinery rentals.
 * Pre-configured with major industrial, infrastructure and civil construction hubs.
 */

export const COLOMBIA_LOCATIONS = [
  {
    department: 'Bogotá, D.C.',
    cities: [
      'Bogotá, D.C. (Norte / Suba / Usaquén)',
      'Bogotá, D.C. (Centro / Chapinero / Teusaquillo)',
      'Bogotá, D.C. (Occidente / Fontibón / Engativá)',
      'Bogotá, D.C. (Sur / Kennedy / Bosa / Puente Aranda)',
      'Bogotá, D.C. (Todas las zonas)'
    ]
  },
  {
    department: 'Cundinamarca',
    cities: [
      'Chía',
      'Soacha',
      'Zipaquirá',
      'Mosquera',
      'Madrid',
      'Funza',
      'Facatativá',
      'Cota',
      'Tocancipá',
      'Sopó',
      'Cajicá',
      'Girardot',
      'Fusagasugá'
    ]
  },
  {
    department: 'Antioquia',
    cities: [
      'Medellín',
      'Envigado',
      'Bello',
      'Itagüí',
      'Sabaneta',
      'Rionegro (Oriente)',
      'La Estrella',
      'Copacabana',
      'Apartadó (Urabá)',
      'Caucasia'
    ]
  },
  {
    department: 'Valle del Cauca',
    cities: [
      'Cali',
      'Palmira',
      'Yumbo (Zona Industrial)',
      'Jamundí',
      'Buenaventura (Puerto)',
      'Buga',
      'Tuluá',
      'Cartago'
    ]
  },
  {
    department: 'Atlántico',
    cities: [
      'Barranquilla',
      'Soledad',
      'Puerto Colombia',
      'Malambo',
      'Galapa'
    ]
  },
  {
    department: 'Santander',
    cities: [
      'Bucaramanga',
      'Floridablanca',
      'Girón',
      'Piedecuesta',
      'Barrancabermeja'
    ]
  },
  {
    department: 'Bolívar',
    cities: [
      'Cartagena',
      'Turbaco',
      'Arjona',
      'Magangué'
    ]
  },
  {
    department: 'Risaralda',
    cities: [
      'Pereira',
      'Dosquebradas',
      'Santa Rosa de Cabal'
    ]
  },
  {
    department: 'Caldas',
    cities: [
      'Manizales',
      'Villamaría',
      'Chinchiná'
    ]
  },
  {
    department: 'Quindío',
    cities: [
      'Armenia',
      'Calarcá',
      'Circasia',
      'Montenegro'
    ]
  },
  {
    department: 'Tolima',
    cities: [
      'Ibagué',
      'Espinal',
      'Melgar',
      'Flandes'
    ]
  },
  {
    department: 'Huila',
    cities: [
      'Neiva',
      'Pitalito',
      'Garzón'
    ]
  },
  {
    department: 'Norte de Santander',
    cities: [
      'Cúcuta',
      'Los Patios',
      'Villa del Rosario',
      'Ocaña'
    ]
  },
  {
    department: 'Boyacá',
    cities: [
      'Tunja',
      'Duitama',
      'Sogamoso',
      'Villa de Leyva',
      'Paipa'
    ]
  },
  {
    department: 'Meta',
    cities: [
      'Villavicencio',
      'Acacías',
      'Granada'
    ]
  },
  {
    department: 'Córdoba',
    cities: [
      'Montería',
      'Cereté',
      'Lorica',
      'Sahagún'
    ]
  },
  {
    department: 'Magdalena',
    cities: [
      'Santa Marta',
      'Ciénaga',
      'Fundación'
    ]
  },
  {
    department: 'Cesar',
    cities: [
      'Valledupar',
      'Aguachica'
    ]
  },
  {
    department: 'Nariño',
    cities: [
      'Pasto',
      'Ipiales',
      'Tumaco'
    ]
  },
  {
    department: 'Cauca',
    cities: [
      'Popayán',
      'Santander de Quilichao'
    ]
  }
];

export const DEFAULT_DEPARTMENT = 'Bogotá, D.C.';
export const DEFAULT_CITY = 'Bogotá, D.C. (Todas las zonas)';

export function getCitiesForDepartment(departmentName) {
  if (!departmentName) return [];
  const found = COLOMBIA_LOCATIONS.find(
    d => d.department.toLowerCase() === departmentName.trim().toLowerCase()
  );
  return found ? found.cities : [];
}

const STORAGE_KEY = 'toolrent_rental_search_context';

export function saveSearchContext(ctx = {}) {
  try {
    const existing = getSearchContext();
    const updated = {
      ...existing,
      ...ctx,
      updatedAt: Date.now()
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (_) {}
}

export function getSearchContext() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (_) {
    return {};
  }
}

export function clearSearchContext() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (_) {}
}
