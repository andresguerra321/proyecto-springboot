import scaffold1 from '../assets/scaffold-1-full.jpg';
import scaffold2 from '../assets/scaffold-2-joint.jpg';
import scaffold3 from '../assets/scaffold-3-platform.jpg';
import scaffold4 from '../assets/scaffold-4-base.jpg';

/**
 * High-definition catalog photography catalog with real construction & industrial equipment.
 * Each equipment entry contains a curated gallery of authentic, real-world multi-angle views.
 */
export const TOOL_GALLERY_DICTIONARY = {
  // 1. Demolición Hexagonal 30kg (Bosch GSH 27 VC)
  '11111111-0000-0000-0000-000000000001': [
    { imageUrl: '/images/hammer-drill.jpg', caption: 'Martillo demoledor hexagonal 30kg - Vista principal de taller' },
    { imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000&auto=format&fit=crop&q=80', caption: 'Demolición pesada de losa de concreto en faena' },
    { imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1000&auto=format&fit=crop&q=80', caption: 'Juego de cinceles planos y punteros de acero forjado' }
  ],

  // 2. Rotomartillo SDS Max 1500W (DeWalt D25773K)
  '11111111-0000-0000-0000-000000000002': [
    { imageUrl: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=1000&auto=format&fit=crop&q=80', caption: 'Rotomartillo combinado SDS Max 1500W con maletín' },
    { imageUrl: '/images/hammer-drill.jpg', caption: 'Detalle de selector de rotación, percusión y embrague' },
    { imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1000&auto=format&fit=crop&q=80', caption: 'Brocas pasamuros y empuñadura auxiliar antivibración' }
  ],

  // 3. Mezcladora de Concreto 1.5 Bultos (Cipsa Maxi 10)
  '11111111-0000-0000-0000-000000000003': [
    { imageUrl: '/images/concrete-mixer.jpg', caption: 'Mezcladora trompo 1.5 bultos con motor Honda GX270' },
    { imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f8?w=1000&auto=format&fit=crop&q=80', caption: 'Vaciado continuo de mezcla en zanja de cimentación' },
    { imageUrl: 'https://images.unsplash.com/photo-1590496793929-36417d3117de?w=1000&auto=format&fit=crop&q=80', caption: 'Tambor reforzado de volteo y enganche de remolque' }
  ],

  // 4. Vibrador de Concreto 5.5HP (Wacker Neuson M2500)
  '11111111-0000-0000-0000-000000000004': [
    { imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f8?w=1000&auto=format&fit=crop&q=80', caption: 'Vibrador de inmersión en compactación de columnas' },
    { imageUrl: 'https://images.unsplash.com/photo-1590496793929-36417d3117de?w=1000&auto=format&fit=crop&q=80', caption: 'Motor estacionario 4 tiempos de alta confiabilidad' },
    { imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000&auto=format&fit=crop&q=80', caption: 'Aguja excéntrica de 38mm y manguera de 4 metros' }
  ],

  // 5. Andamio Certificado Layher Allround
  '11111111-0000-0000-0000-000000000005': [
    { imageUrl: scaffold1, caption: 'Torre de andamio multidireccional 6m armada en obra' },
    { imageUrl: scaffold2, caption: 'Roseta Ringlock de 8 vías con pasador de cuña' },
    { imageUrl: scaffold3, caption: 'Plataformas metálicas antideslizantes con trampilla' },
    { imageUrl: scaffold4, caption: 'Husillos regulables con placa de apoyo para nivelación' }
  ],

  // 6. Generador Diésel Insonorizado 10kVA (Caterpillar DE9.5E3)
  '11111111-0000-0000-0000-000000000006': [
    { imageUrl: '/images/generator.jpg', caption: 'Generador diésel insonorizado 10kVA en chasis cerrado' },
    { imageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1000&auto=format&fit=crop&q=80', caption: 'Panel de control con voltímetro, horómetro y tomas industriales' },
    { imageUrl: 'https://images.unsplash.com/photo-1581092446327-9b52bd1570c2?w=1000&auto=format&fit=crop&q=80', caption: 'Sistema de insonorización acústica 68 dB y escape silencioso' }
  ],

  // 7. Apisonador Canguro 4HP (Mikasa MTX-70HDR)
  '11111111-0000-0000-0000-000000000007': [
    { imageUrl: '/images/compactor.jpg', caption: 'Apisonador canguro 4HP Mikasa para suelos y zanjas' },
    { imageUrl: 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?w=1000&auto=format&fit=crop&q=80', caption: 'Compactación de fondo de zanja previa a tubería' },
    { imageUrl: 'https://images.unsplash.com/photo-1581092446327-9b52bd1570c2?w=1000&auto=format&fit=crop&q=80', caption: 'Fuelle protector y zapata de impacto en acero y madera' }
  ],

  // 8. Placa Compactadora 15kN (Wacker Neuson BPU 2540)
  '11111111-0000-0000-0000-000000000008': [
    { imageUrl: 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?w=1000&auto=format&fit=crop&q=80', caption: 'Placa compactadora unidireccional 15kN en pavimentación' },
    { imageUrl: '/images/compactor.jpg', caption: 'Manubrio de guía con aislamiento térmico y amortiguación' },
    { imageUrl: 'https://images.unsplash.com/photo-1581092446327-9b52bd1570c2?w=1000&auto=format&fit=crop&q=80', caption: 'Base de fundición esferoidal para adoquines y asfalto' }
  ],

  // 9. Cortadora de Pavimento 14" (Husqvarna FS 400 LV)
  '11111111-0000-0000-0000-000000000009': [
    { imageUrl: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1000&auto=format&fit=crop&q=80', caption: 'Cortadora de piso y pavimento con disco de 14 pulgadas' },
    { imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1000&auto=format&fit=crop&q=80', caption: 'Trazo de corte guiado para cajas de servicios públicos' },
    { imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1000&auto=format&fit=crop&q=80', caption: 'Depósito de agua de 30 litros para corte refrigerado en húmedo' }
  ],

  // 10. Motobomba de Lodos 3" (Honda WT30XK4)
  '11111111-0000-0000-0000-000000000010': [
    { imageUrl: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=1000&auto=format&fit=crop&q=80', caption: 'Motobomba autocebante 3" con motor Honda comercial' },
    { imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1000&auto=format&fit=crop&q=80', caption: 'Desagüe de excavaciones con presencia de sólidos hasta 25mm' },
    { imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000&auto=format&fit=crop&q=80', caption: 'Acoples rápidos tipo Camlock y manguera de descarga plana' }
  ],

  // 11. Soldador Inverter Multiproceso 250A (Lincoln Electric Power MIG 210)
  '11111111-0000-0000-0000-000000000011': [
    { imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000&auto=format&fit=crop&q=80', caption: 'Soldador multiproceso MIG / TIG / Electrodo 250A' },
    { imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=1000&auto=format&fit=crop&q=80', caption: 'Unión estructural en caliente en estructura metálica' },
    { imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1000&auto=format&fit=crop&q=80', caption: 'Alimentador de alambre interno y cables de potencia' }
  ],

  // 12. Equipo Airless Profesional (Graco Ultra Max II 490)
  '11111111-0000-0000-0000-000000000012': [
    { imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=1000&auto=format&fit=crop&q=80', caption: 'Equipo de pintura airless alta presión Graco 490' },
    { imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1000&auto=format&fit=crop&q=80', caption: 'Pintado uniforme de cielo raso y muros interiores' },
    { imageUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=1000&auto=format&fit=crop&q=80', caption: 'Pistola con boquilla RAC X y manguera de 15 metros' }
  ],

  // 13. Nivel Láser Giratorio 360° (Leica Geosystems Roteo 35G)
  '11111111-0000-0000-0000-000000000013': [
    { imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1000&auto=format&fit=crop&q=80', caption: 'Nivel láser rotativo autonivelante 360° con rayo verde' },
    { imageUrl: 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?w=1000&auto=format&fit=crop&q=80', caption: 'Receptor digital de mano para replanteo topográfico' },
    { imageUrl: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=1000&auto=format&fit=crop&q=80', caption: 'Trípode de aluminio de alta estabilidad y mira graduada' }
  ],

  // 14. Hidrolavadora Industrial 3000 PSI (Kärcher HD 7/16-4 Cage)
  '11111111-0000-0000-0000-000000000014': [
    { imageUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=1000&auto=format&fit=crop&q=80', caption: 'Hidrolavadora industrial 3000 PSI con bastidor tubular' },
    { imageUrl: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=1000&auto=format&fit=crop&q=80', caption: 'Limpieza profunda de encofrados y maquinaria pesada' },
    { imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1000&auto=format&fit=crop&q=80', caption: 'Lanza de acero inoxidable y boquilla triple con chorro abanico' }
  ],

  // 15. Pistola de Fijación a Pólvora (Hilti DX 460)
  '11111111-0000-0000-0000-000000000015': [
    { imageUrl: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=1000&auto=format&fit=crop&q=80', caption: 'Pistola de fijación directa DX 460 para acero y hormigón' },
    { imageUrl: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=1000&auto=format&fit=crop&q=80', caption: 'Fijación de perfiles de drywall sobre losa de concreto' },
    { imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000&auto=format&fit=crop&q=80', caption: 'Tiras de fulminantes de potencia regulable y maletín' }
  ],

  // 16. Torre de Iluminación Portátil (Generac Mobile MLT4060)
  '11111111-0000-0000-0000-000000000016': [
    { imageUrl: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=1000&auto=format&fit=crop&q=80', caption: 'Torre de iluminación móvil con 4 proyectores LED de alta potencia' },
    { imageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1000&auto=format&fit=crop&q=80', caption: 'Operación nocturna en faenas viales y montajes industriales' },
    { imageUrl: 'https://images.unsplash.com/photo-1581092446327-9b52bd1570c2?w=1000&auto=format&fit=crop&q=80', caption: 'Mástil telescópico con giro 360° y motor diésel de bajo consumo' }
  ],

  // 17. Extractor de Aire y Polvo 12" (Ramfan UB20)
  '11111111-0000-0000-0000-000000000017': [
    { imageUrl: 'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?w=1000&auto=format&fit=crop&q=80', caption: 'Extractor y soplador axial de 12" para espacios confinados' },
    { imageUrl: 'https://images.unsplash.com/photo-1581092446327-9b52bd1570c2?w=1000&auto=format&fit=crop&q=80', caption: 'Renovación de aire y extracción de vapores en tanques' },
    { imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000&auto=format&fit=crop&q=80', caption: 'Ducto corrugado antiestático de 7.6 metros acoplable' }
  ],

  // 18. Combo Inalámbrico Taladro + Llave de Impacto (Makita DLX2180TX)
  '11111111-0000-0000-0000-000000000018': [
    { imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1000&auto=format&fit=crop&q=80', caption: 'Kit inalámbrico profesional Makita 18V Brushless' },
    { imageUrl: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=1000&auto=format&fit=crop&q=80', caption: 'Atornillado de alta fuerza en estructura metálica ligera' },
    { imageUrl: 'https://images.unsplash.com/photo-1534398079543-7ae6d016b86a?w=1000&auto=format&fit=crop&q=80', caption: 'Dos baterías de 5.0Ah con medidor y cargador rápido inteligente' }
  ],

  // 19. Ahoyadora a Gasolina 52cc (Stihl BT 131)
  '11111111-0000-0000-0000-000000000019': [
    { imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1000&auto=format&fit=crop&q=80', caption: 'Ahoyadora a gasolina 52cc Stihl con broca de 200mm' },
    { imageUrl: 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?w=1000&auto=format&fit=crop&q=80', caption: 'Perforación de hoyos para postes de cerramiento y plantación' },
    { imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000&auto=format&fit=crop&q=80', caption: 'Empuñaduras ergonómicas con interruptor de parada multifunción' }
  ],

  // 20. Sierra Circular de Banco 10" (DeWalt DWE7491RS)
  '11111111-0000-0000-0000-000000000020': [
    { imageUrl: 'https://images.unsplash.com/photo-1534398079543-7ae6d016b86a?w=1000&auto=format&fit=crop&q=80', caption: 'Sierra de mesa para madera 10" con banco rodante plegable' },
    { imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1000&auto=format&fit=crop&q=80', caption: 'Corte longitudinal preciso de tableros de encofrado' },
    { imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1000&auto=format&fit=crop&q=80', caption: 'Guía de corte telescópica con ajuste micrométrico de piñón' }
  ],

  // 21. Termofusora Digital para Tubería (Rothenberger Roweld)
  '11111111-0000-0000-0000-000000000021': [
    { imageUrl: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=1000&auto=format&fit=crop&q=80', caption: 'Equipo de termofusión a tope para tubería de polietileno HDPE' },
    { imageUrl: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=1000&auto=format&fit=crop&q=80', caption: 'Fusión térmica con control digital de temperatura y tiempo' },
    { imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000&auto=format&fit=crop&q=80', caption: 'Matrices intercambiables de teflón y soporte de fijación' }
  ],

  // 22. Transpaleta Hidráulica Manual 2.5 Ton (Yale HP25)
  '11111111-0000-0000-0000-000000000022': [
    { imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1000&auto=format&fit=crop&q=80', caption: 'Transpaleta hidráulica manual para carga de estibas hasta 2500kg' },
    { imageUrl: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=1000&auto=format&fit=crop&q=80', caption: 'Movilización de materiales en patio de obra y bodega' },
    { imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000&auto=format&fit=crop&q=80', caption: 'Bomba hidráulica sellada con válvula de sobrecarga de seguridad' }
  ],

  // 23. Trípode de Rescate y Espacio Confinado (3M DBI-SALA Salalift II)
  '11111111-0000-0000-0000-000000000023': [
    { imageUrl: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=1000&auto=format&fit=crop&q=80', caption: 'Trípode de aluminio certificado para izaje de personal y rescate' },
    { imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1000&auto=format&fit=crop&q=80', caption: 'Montaje sobre pozo de inspección o alcantarillado' },
    { imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000&auto=format&fit=crop&q=80', caption: 'Cabrestante Salalift con freno automático y cable de 20 metros' }
  ],

  // 24. Plataforma Elevadora de Tijera Eléctrica 8m (Genie GS-1930)
  '11111111-0000-0000-0000-000000000024': [
    { imageUrl: '/images/scissor-lift.jpg', caption: 'Plataforma tijera eléctrica de 8m para trabajo en altura interior' },
    { imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000&auto=format&fit=crop&q=80', caption: 'Plataforma extensible con barandas de seguridad perimetrales' },
    { imageUrl: 'https://images.unsplash.com/photo-1581092446327-9b52bd1570c2?w=1000&auto=format&fit=crop&q=80', caption: 'Control ergonómico tipo joystick y cargador de baterías integrado' }
  ],

  // 25. Allanadora de Concreto 36" Helicóptero (Whiteman J36H90)
  '11111111-0000-0000-0000-000000000025': [
    { imageUrl: 'https://images.unsplash.com/photo-1590496793929-36417d3117de?w=1000&auto=format&fit=crop&q=80', caption: 'Allanadora de concreto 36" con 4 aspas de alisado fino' },
    { imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f8?w=1000&auto=format&fit=crop&q=80', caption: 'Alisado de piso industrial previo al fraguado final' },
    { imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000&auto=format&fit=crop&q=80', caption: 'Control de inclinación de aspas mediante volante manual en el mango' }
  ]
};

/**
 * Fallbacks by keyword if tool ID is not recognized (e.g. newly added by provider)
 */
export const CATEGORY_IMAGE_SETS = {
  'andamio': [
    { imageUrl: scaffold1, caption: 'Andamio certificado multidireccional - Vista general' },
    { imageUrl: scaffold2, caption: 'Detalle de uniones Ringlock y cuñas de seguridad' },
    { imageUrl: scaffold3, caption: 'Plataformas metálicas troqueladas de trabajo' }
  ],
  'mezcladora': [
    { imageUrl: '/images/concrete-mixer.jpg', caption: 'Mezcladora de concreto trompo profesional' },
    { imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f8?w=1000&auto=format&fit=crop&q=80', caption: 'Vaciado de concreto en obra civil' },
    { imageUrl: 'https://images.unsplash.com/photo-1590496793929-36417d3117de?w=1000&auto=format&fit=crop&q=80', caption: 'Tambor reforzado de volteo con motor a gasolina' }
  ],
  'martillo': [
    { imageUrl: '/images/hammer-drill.jpg', caption: 'Martillo demoledor de impacto de alto rendimiento' },
    { imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000&auto=format&fit=crop&q=80', caption: 'Demolición pesada de concreto y pavimento' },
    { imageUrl: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=1000&auto=format&fit=crop&q=80', caption: 'Juego de accesorios y punteros cinceladores' }
  ],
  'generador': [
    { imageUrl: '/images/generator.jpg', caption: 'Planta eléctrica diésel insonorizada' },
    { imageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1000&auto=format&fit=crop&q=80', caption: 'Tablero de conexiones trifásico con disyuntores' },
    { imageUrl: 'https://images.unsplash.com/photo-1581092446327-9b52bd1570c2?w=1000&auto=format&fit=crop&q=80', caption: 'Cabina insonorizada de bajo nivel de ruido' }
  ],
  'compacta': [
    { imageUrl: '/images/compactor.jpg', caption: 'Equipo de compactación de suelos y zanjas' },
    { imageUrl: 'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?w=1000&auto=format&fit=crop&q=80', caption: 'Compactación uniforme de base granular' },
    { imageUrl: 'https://images.unsplash.com/photo-1581092446327-9b52bd1570c2?w=1000&auto=format&fit=crop&q=80', caption: 'Detalle de zapata de impacto reforzada' }
  ],
  'tijera': [
    { imageUrl: '/images/scissor-lift.jpg', caption: 'Plataforma de tijera elevadora de personal' },
    { imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1000&auto=format&fit=crop&q=80', caption: 'Plataforma de tijera extendida para mantenimiento' },
    { imageUrl: 'https://images.unsplash.com/photo-1581092446327-9b52bd1570c2?w=1000&auto=format&fit=crop&q=80', caption: 'Panel de mandos ergonómico y ruedas de goma' }
  ],
  'default': [
    { imageUrl: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1000&auto=format&fit=crop&q=80', caption: 'Equipo industrial certificado - Vista general' },
    { imageUrl: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=1000&auto=format&fit=crop&q=80', caption: 'Calibración técnica y pruebas de funcionamiento' },
    { imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1000&auto=format&fit=crop&q=80', caption: 'Despacho con sello de garantía ToolRent Protect' }
  ]
};

/**
 * Resolves a full array of authentic, real-world images for any tool
 */
export function getCuratedToolImages(tool) {
  if (!tool) return CATEGORY_IMAGE_SETS['default'];

  // 1. Direct dictionary match by tool ID
  if (tool.id && TOOL_GALLERY_DICTIONARY[tool.id]) {
    return TOOL_GALLERY_DICTIONARY[tool.id];
  }

  // 2. If the tool has backend images with valid reachable URLs (not the broken domain)
  if (Array.isArray(tool.images) && tool.images.length > 0) {
    const validBackendImgs = tool.images.filter(img => 
      img?.imageUrl && 
      !img.imageUrl.includes('images.rentaequipos.com') &&
      !img.imageUrl.includes('photo-1541888946425-d0fbb186f5f8') &&
      !img.imageUrl.includes('photo-1503387762-592deb58ef4e')
    );
    if (validBackendImgs.length > 0) {
      return validBackendImgs.map((img, i) => ({
        imageUrl: img.imageUrl,
        caption: img.caption || `${tool.name} - Vista ${i + 1}`
      }));
    }
  }

  // 3. Keyword-based matching
  const name = (tool.name || '').toLowerCase();
  const cat = (tool.categoryName || tool.category?.name || '').toLowerCase();

  for (const [key, set] of Object.entries(CATEGORY_IMAGE_SETS)) {
    if (key !== 'default' && (name.includes(key) || cat.includes(key))) {
      return set;
    }
  }

  return CATEGORY_IMAGE_SETS['default'];
}

/**
 * Returns the single best primary image URL for cards, tables, and cart modals
 */
export function getToolPrimaryImage(tool) {
  const images = getCuratedToolImages(tool);
  return images[0]?.imageUrl || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800';
}
