export type ModelId = 'chronograph' | 'turbine' | 'acoustics' | 'pavilion' | 'custom';

export type FinishId =
  | 'titanium'
  | 'rosegold'
  | 'bluedsteel'
  | 'carbon'
  | 'ceramic'
  | 'emerald_bronze';

export type StudioEnvId = 'obsidian' | 'warm_atelier' | 'nordic_daylight' | 'blueprint_night';

export type CameraPresetId = 'isometric' | 'front' | 'top' | 'macro' | 'profile';

export interface PartMetadata {
  id: string;
  name: string;
  role: string;
  materialSpec: string;
  tolerance: string;
  massGrams: number;
  explodeOffset: [number, number, number];
}

export interface DesignModelSpec {
  id: ModelId;
  title: string;
  shortTitle: string;
  category: string;
  dimensions: string;
  partCount: number;
  vertexEstimate: string;
  description: string;
  parts: PartMetadata[];
}

export interface FinishPreset {
  id: FinishId;
  name: string;
  swatchHex: string;
  secondaryHex: string;
  accentHex: string;
  metalness: number;
  roughness: number;
  clearcoat: number;
  anisotropy: number;
  description: string;
}

export interface StudioEnvironmentPreset {
  id: StudioEnvId;
  name: string;
  bgHex: string;
  fogHex: string;
  keyLightHex: string;
  keyIntensity: number;
  hemiSkyHex: string;
  hemiGroundHex: string;
  hemiIntensity: number;
  rimLightHex: string;
  rimIntensity: number;
  exposure: number;
}

export interface CameraPreset {
  id: CameraPresetId;
  label: string;
  position: [number, number, number];
  target: [number, number, number];
}

export const DESIGN_MODELS: DesignModelSpec[] = [
  {
    id: 'chronograph',
    title: 'Calibre KV-09 Tourbillon Imperial',
    shortTitle: 'Cronógrafo Tourbillon',
    category: 'Alta Relojería Mecánica',
    dimensions: '42.0 × 42.0 × 13.4 mm',
    partCount: 8,
    vertexEstimate: '48,600 tris',
    description:
      'Movimiento cronógrafo esqueletizado con jaula de tourbillon volante a las 6 horas, tren de engranajes planetarios de 36 dientes tallados y cúpula de cristal de zafiro antirreflejos.',
    parts: [
      {
        id: 'chrono-case',
        name: 'Caja Principal Monobloque Biselada',
        role: 'Chasis estructural hermético a 10 ATM',
        materialSpec: 'Aleación Grado 5 torneada CNC',
        tolerance: '±0.005 mm',
        massGrams: 38.4,
        explodeOffset: [0, -0.55, 0],
      },
      {
        id: 'chrono-bezel',
        name: 'Bisel Taquimétrico Grabado',
        role: 'Escala de medición de velocidad y retención óptica',
        materialSpec: 'Superficie cepillada radial con micro-grabado',
        tolerance: '±0.008 mm',
        massGrams: 14.2,
        explodeOffset: [0, 0.75, 0],
      },
      {
        id: 'chrono-dial',
        name: 'Platina Principal y Esfera Técnica',
        role: 'Soporte de rubíes sintéticos e índices horarios',
        materialSpec: 'Latón rodinado con textura guilloché',
        tolerance: '±0.003 mm',
        massGrams: 9.8,
        explodeOffset: [0, -0.2, 0],
      },
      {
        id: 'chrono-gears',
        name: 'Tren de Engranajes Planetarios (36 dientes)',
        role: 'Transmisión de par desde el barrilete central',
        materialSpec: 'Bronce al berilio de baja fricción',
        tolerance: '±0.002 mm',
        massGrams: 6.4,
        explodeOffset: [-0.45, 0.25, 0.3],
      },
      {
        id: 'chrono-tourbillon',
        name: 'Jaula de Tourbillon Volante y Puente',
        role: 'Compensación gravitacional del órgano regulador',
        materialSpec: 'Titanio ultraligero pulido espejo',
        tolerance: '±0.001 mm',
        massGrams: 0.42,
        explodeOffset: [0, 0.45, 0.55],
      },
      {
        id: 'chrono-hands',
        name: 'Agujas Esqueletizadas y Segundero Central',
        role: 'Lectura analógica de horas, minutos y reserva de marcha',
        materialSpec: 'Acero templado facetado al diamante',
        tolerance: '±0.004 mm',
        massGrams: 0.85,
        explodeOffset: [0, 1.05, 0],
      },
      {
        id: 'chrono-crown',
        name: 'Corona Estriada y Pulsadores de Embrague',
        role: 'Remonte manual y accionamiento del cronógrafo',
        materialSpec: 'Acero forjado con juntas de fluorocarbono',
        tolerance: '±0.006 mm',
        massGrams: 5.1,
        explodeOffset: [0.95, 0, 0],
      },
      {
        id: 'chrono-crystal',
        name: 'Cúpula de Cristal de Zafiro Bombé',
        role: 'Protección óptica superior con índice de refracción 1.77',
        materialSpec: 'Corindón sintético monocristalino',
        tolerance: '±0.010 mm',
        massGrams: 7.6,
        explodeOffset: [0, 1.55, 0],
      },
    ],
  },
  {
    id: 'turbine',
    title: 'Turbina Aeroespacial Axial VX-900',
    shortTitle: 'Turbina Aeroespacial',
    category: 'Propulsión Aeronáutica',
    dimensions: '1,480 × 1,480 × 2,850 mm',
    partCount: 7,
    vertexEstimate: '62,400 tris',
    description:
      'Reactor turbofán de alta relación de derivación con 28 álabes de compresor retorcidos aerodinámicamente, cámara de combustión toroidal y tobera vectorial.',
    parts: [
      {
        id: 'turb-stand',
        name: 'Bancada de Ensayos Metrología',
        role: 'Soporte calibrado de absorción de vibraciones',
        materialSpec: 'Acero estructural fundido',
        tolerance: '±0.050 mm',
        massGrams: 42500,
        explodeOffset: [0, -0.75, 0],
      },
      {
        id: 'turb-shaft',
        name: 'Eje Central de Alta Presión',
        role: 'Acoplamiento mecánico directo entre turbina y compresor',
        materialSpec: 'Superaleación Inconel 718 forjada',
        tolerance: '±0.004 mm',
        massGrams: 18400,
        explodeOffset: [0, 0, -0.6],
      },
      {
        id: 'turb-cone',
        name: 'Cono de Admisión Supersónico',
        role: 'Laminación del flujo de aire de entrada y anti-hielo',
        materialSpec: 'Titanio Ti-6Al-4V hilado',
        tolerance: '±0.012 mm',
        massGrams: 4800,
        explodeOffset: [0, 0, 1.35],
      },
      {
        id: 'turb-blades',
        name: 'Rotor de 28 Álabes de Compresor Axial',
        role: 'Compresión primaria de flujo de aire a 38:1',
        materialSpec: 'Compuesto de matriz metálica y bordes de titanio',
        tolerance: '±0.003 mm',
        massGrams: 12900,
        explodeOffset: [0, 0, 0.75],
      },
      {
        id: 'turb-combustor',
        name: 'Cámara de Combustión Anular y Colectores',
        role: 'Inyección vórtex e ignición continua de alta eficiencia',
        materialSpec: 'Aleación monocristalina recubierta en cerámica',
        tolerance: '±0.008 mm',
        massGrams: 15600,
        explodeOffset: [0, 0.55, 0],
      },
      {
        id: 'turb-nozzle',
        name: 'Tobera de Escape de Empuje Vectorial',
        role: 'Aceleración convergente-divergente de gases de escape',
        materialSpec: 'Pétalos de superaleación de níquel refrigerados',
        tolerance: '±0.015 mm',
        massGrams: 11200,
        explodeOffset: [0, 0, -1.3],
      },
      {
        id: 'turb-shroud',
        name: 'Góndola Exterior de Flujo Laminar',
        role: 'Contención acústica y canalización aerodinámica',
        materialSpec: 'Polímero reforzado y ventana de policarbonato óptico',
        tolerance: '±0.020 mm',
        massGrams: 9300,
        explodeOffset: [0, 1.15, 0],
      },
    ],
  },
  {
    id: 'acoustics',
    title: 'Transductor Planar Magnético Aether-One',
    shortTitle: 'Acústica Planar',
    category: 'Ingeniería Electroacústica',
    dimensions: '195 × 210 × 108 mm',
    partCount: 7,
    vertexEstimate: '54,100 tris',
    description:
      'Sistema de referencia acústica circumaural abierto con matriz magnética Neodimio N52, rejilla difusora de 40 pines de fase y diadema de suspensión cardán.',
    parts: [
      {
        id: 'ac-stand',
        name: 'Pedestal Acústico de Exhibición',
        role: 'Base maciza desacoplada con centro de gravedad bajo',
        materialSpec: 'Aluminio anodizado mecanizado de bloque sólido',
        tolerance: '±0.020 mm',
        massGrams: 680,
        explodeOffset: [0, -0.7, 0],
      },
      {
        id: 'ac-headband',
        name: 'Arco Estructural de Memoria Elástica',
        role: 'Distribución isotrópica de presión craneal',
        materialSpec: 'Fleje de titanio β curvado en frío',
        tolerance: '±0.015 mm',
        massGrams: 82,
        explodeOffset: [0, 0.95, 0],
      },
      {
        id: 'ac-yokes',
        name: 'Yugos de Suspensión Cardán de Doble Eje',
        role: 'Articulación libre de 360° sin resonancia mecánica',
        materialSpec: 'Aleación de magnesio inyectado y rectificado',
        tolerance: '±0.008 mm',
        massGrams: 44,
        explodeOffset: [0, 0.45, 0.4],
      },
      {
        id: 'ac-cups',
        name: 'Cámaras Acústicas Torneadas (Par Izq/Der)',
        role: 'Recinto antirresonante de amortiguación abierta',
        materialSpec: 'Aluminio aeroespacial 7075 torneado',
        tolerance: '±0.005 mm',
        massGrams: 136,
        explodeOffset: [0.65, 0, 0],
      },
      {
        id: 'ac-drivers',
        name: 'Transductores Planos Magnéticos Nanométricos',
        role: 'Diafragma de 1.8 micras con pistas conductoras en zig-zag',
        materialSpec: 'Imanes Neodimio N52 + película de poliimida',
        tolerance: '±0.001 mm',
        massGrams: 95,
        explodeOffset: [-0.65, 0, 0],
      },
      {
        id: 'ac-grilles',
        name: 'Rejilla Difusora de Fase (40 Nodos Acústicos)',
        role: 'Eliminación de ondas estacionarias posteriores',
        materialSpec: 'Matriz perforada láser con pines de dispersión',
        tolerance: '±0.004 mm',
        massGrams: 32,
        explodeOffset: [0, 0, 0.85],
      },
      {
        id: 'ac-pads',
        name: 'Almohadillas Circumaurales Biseladas',
        role: 'Sellado acústico de baja frecuencia y confort térmico',
        materialSpec: 'Espuma viscoelástica de densidad progresiva',
        tolerance: '±0.100 mm',
        massGrams: 58,
        explodeOffset: [0, 0, -0.75],
      },
    ],
  },
  {
    id: 'pavilion',
    title: 'Pabellón Biodomo Paramétrico Solaris',
    shortTitle: 'Pabellón Paramétrico',
    category: 'Arquitectura Computacional',
    dimensions: '48.0 × 48.0 × 26.5 m (Escala 1:20)',
    partCount: 6,
    vertexEstimate: '51,800 tris',
    description:
      'Estructura arquitectónica generativa compuesta por costillas parabólicas en tensión, 32 nodos geodésicos de acero fundido, pasarelas en voladizo y envolvente bioclimática.',
    parts: [
      {
        id: 'pav-plinth',
        name: 'Basamento Escalonado Topográfico',
        role: 'Cimentación perimetral y espejo de agua reflectante',
        materialSpec: 'Hormigón arquitectónico pretensado',
        tolerance: '±2.0 mm',
        massGrams: 145000,
        explodeOffset: [0, -0.75, 0],
      },
      {
        id: 'pav-core',
        name: 'Torre Central de Convección Solar',
        role: 'Núcleo estructural y chimenea térmica bioclimática',
        materialSpec: 'Acero corten y anillos tensores de bronce',
        tolerance: '±0.5 mm',
        massGrams: 38000,
        explodeOffset: [0, 0.35, 0],
      },
      {
        id: 'pav-ribs',
        name: 'Arcos Parabólicos Primarios de Compresión',
        role: 'Transferencia de cargas de cubierta hacia el anillo base',
        materialSpec: 'Perfiles tubulares curvados por inducción',
        tolerance: '±0.8 mm',
        massGrams: 52000,
        explodeOffset: [0, 0.7, 0],
      },
      {
        id: 'pav-walkways',
        name: 'Anillos de Galería Suspendidos en Voladizo',
        role: 'Circulación peatonal panorámica a doble altura',
        materialSpec: 'Vigas cajón de acero con losa aligerada',
        tolerance: '±1.0 mm',
        massGrams: 29000,
        explodeOffset: [0, -0.25, 0.65],
      },
      {
        id: 'pav-nodes',
        name: 'Matriz de 32 Nodos Geodésicos de Conexión',
        role: 'Articulación sísmica de seis vías entre arcos y vidrio',
        materialSpec: 'Acero inoxidable dúplex fundido a la cera perdida',
        tolerance: '±0.1 mm',
        massGrams: 14200,
        explodeOffset: [0.55, 0.55, 0],
      },
      {
        id: 'pav-dome',
        name: 'Cúpula Geodésica de Vidrio Laminado Curvo',
        role: 'Cerramiento selectivo de radiación solar y control acústico',
        materialSpec: 'Triple acristalamiento con cámara de argón',
        tolerance: '±0.5 mm',
        massGrams: 41000,
        explodeOffset: [0, 1.35, 0],
      },
    ],
  },
];

export const FINISH_PRESETS: FinishPreset[] = [
  {
    id: 'titanium',
    name: 'Titanio Grado 5',
    swatchHex: '#9CA3AF',
    secondaryHex: '#4B5563',
    accentHex: '#F59E0B',
    metalness: 0.92,
    roughness: 0.22,
    clearcoat: 0.3,
    anisotropy: 0.75,
    description: 'Acabado satinado direccional con acentos en bronce térmico',
  },
  {
    id: 'rosegold',
    name: 'Oro Rosa 18k',
    swatchHex: '#E5A985',
    secondaryHex: '#27272A',
    accentHex: '#FDE68A',
    metalness: 0.96,
    roughness: 0.14,
    clearcoat: 0.6,
    anisotropy: 0.8,
    description: 'Aleación noble pulida espejo con contraste en platina antracita',
  },
  {
    id: 'bluedsteel',
    name: 'Acero Pavonado',
    swatchHex: '#3B82F6',
    secondaryHex: '#CBD5E1',
    accentHex: '#38BDF8',
    metalness: 0.9,
    roughness: 0.18,
    clearcoat: 0.85,
    anisotropy: 0.6,
    description: 'Acero templado al fuego azul cobalto con componentes de rodio',
  },
  {
    id: 'carbon',
    name: 'Carbono Forjado',
    swatchHex: '#27272A',
    secondaryHex: '#52525B',
    accentHex: '#F97316',
    metalness: 0.35,
    roughness: 0.42,
    clearcoat: 0.9,
    anisotropy: 0.4,
    description: 'Compuesto aeroespacial táctico mate con detalles anodizados naranja',
  },
  {
    id: 'ceramic',
    name: 'Cerámica Técnica',
    swatchHex: '#F3F4F6',
    secondaryHex: '#334155',
    accentHex: '#06B6D4',
    metalness: 0.12,
    roughness: 0.1,
    clearcoat: 1.0,
    anisotropy: 0.1,
    description: 'Óxido de circonio blanco de alta densidad con brillo vítreo',
  },
  {
    id: 'emerald_bronze',
    name: 'Bronce de Galería',
    swatchHex: '#B45309',
    secondaryHex: '#065F46',
    accentHex: '#FBBF24',
    metalness: 0.88,
    roughness: 0.28,
    clearcoat: 0.45,
    anisotropy: 0.65,
    description: 'Bronce arquitectónico bruñido con pátina verde esmeralda profunda',
  },
];

export const STUDIO_ENVIRONMENTS: StudioEnvironmentPreset[] = [
  {
    id: 'obsidian',
    name: 'Estudio Obsidiana',
    bgHex: '#0B0D11',
    fogHex: '#0B0D11',
    keyLightHex: '#FFF4E0',
    keyIntensity: 2.8,
    hemiSkyHex: '#93C5FD',
    hemiGroundHex: '#1E1B18',
    hemiIntensity: 0.85,
    rimLightHex: '#38BDF8',
    rimIntensity: 1.9,
    exposure: 1.15,
  },
  {
    id: 'warm_atelier',
    name: 'Atelier Cálido',
    bgHex: '#14110F',
    fogHex: '#14110F',
    keyLightHex: '#FDE68A',
    keyIntensity: 3.2,
    hemiSkyHex: '#FDBA74',
    hemiGroundHex: '#1C1917',
    hemiIntensity: 0.9,
    rimLightHex: '#F59E0B',
    rimIntensity: 2.1,
    exposure: 1.2,
  },
  {
    id: 'nordic_daylight',
    name: ' Galería Nórdica',
    bgHex: '#181C24',
    fogHex: '#181C24',
    keyLightHex: '#FFFFFF',
    keyIntensity: 2.9,
    hemiSkyHex: '#E0F2FE',
    hemiGroundHex: '#334155',
    hemiIntensity: 1.1,
    rimLightHex: '#E2E8F0',
    rimIntensity: 1.6,
    exposure: 1.25,
  },
  {
    id: 'blueprint_night',
    name: 'Laboratorio Cian',
    bgHex: '#071018',
    fogHex: '#071018',
    keyLightHex: '#E0F2FE',
    keyIntensity: 2.6,
    hemiSkyHex: '#38BDF8',
    hemiGroundHex: '#0F172A',
    hemiIntensity: 0.8,
    rimLightHex: '#22D3EE',
    rimIntensity: 2.4,
    exposure: 1.12,
  },
];

export const CAMERA_PRESETS: CameraPreset[] = [
  {
    id: 'isometric',
    label: '3/4 Estudio',
    position: [3.4, 2.5, 3.6],
    target: [0, 1.05, 0],
  },
  {
    id: 'front',
    label: 'Frontal',
    position: [0, 1.35, 4.4],
    target: [0, 1.05, 0],
  },
  {
    id: 'top',
    label: 'Cenital',
    position: [0.01, 5.2, 0.4],
    target: [0, 0.9, 0],
  },
  {
    id: 'macro',
    label: 'Detalle Macro',
    position: [1.55, 1.65, 1.75],
    target: [0, 1.15, 0],
  },
  {
    id: 'profile',
    label: 'Perfil Técnico',
    position: [4.5, 1.25, 0],
    target: [0, 1.05, 0],
  },
];
