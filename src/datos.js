// DATOS DE REFERENCIA PARA LA CONVOCATORIA
export const distritos = [
  'Ciudad Autónoma de Buenos Aires',
  'Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
];

export const convocatoria = {
  id: 'conv-2026',
  nombre: 'Convocatoria 2026',
  inicio: '2026-10-01T00:00:00-03:00',
  fin: '2026-10-30T23:59:59.999-03:00',
};

// Las actividades son ficticias; las sedes y coordenadas son referencias geográficas reales.
// SEDES Y CHARLAS QUE ALIMENTAN LA AGENDA Y EL FORMULARIO
export const sedes = [
  {
    id: 's1',
    nombre: 'Biblioteca Nacional',
    direccion: 'Agüero 2502, Recoleta',
    distrito: distritos[0],
    latitud: -34.5842,
    longitud: -58.398,
  },
  {
    id: 's2',
    nombre: 'Centro Cultural Recoleta',
    direccion: 'Junín 1930, Recoleta',
    distrito: distritos[0],
    latitud: -34.5877,
    longitud: -58.388,
  },
  {
    id: 's3',
    nombre: 'Centro Cultural Dardo Rocha',
    direccion: 'Calle 50 entre 6 y 7, La Plata',
    distrito: distritos[1],
    latitud: -34.9146,
    longitud: -57.9489,
  },
];

export const charlas = [
  {
    id: 'c1',
    nombre: 'Tu primer paso como autoridad',
    tema: 'Introducción al rol',
    descripcion: 'Conocé las responsabilidades de una autoridad de mesa y cómo podés participar. Un encuentro para empezar desde cero.',
    fecha: '2026-10-01',
    hora: '18:00',
    duracion: '90 min',
    sedeId: 's1',
    etiqueta: 'Apertura',
  },
  {
    id: 'c2',
    nombre: 'Una jornada, un gran compromiso',
    tema: 'La jornada electoral',
    descripcion: 'Recorré los momentos de la jornada: apertura, votación y cierre. Compartimos situaciones habituales y resolvemos tus dudas.',
    fecha: '2026-10-15',
    hora: '17:30',
    duracion: '90 min',
    sedeId: 's2',
    etiqueta: 'Orientación',
  },
  {
    id: 'c3',
    nombre: 'Todo listo para participar',
    tema: 'Procedimientos y materiales',
    descripcion: 'Acercate a los materiales de mesa y repasá los procedimientos a través de ejemplos y preguntas.',
    fecha: '2026-10-22',
    hora: '18:00',
    duracion: '60 min',
    sedeId: 's3',
    etiqueta: 'Encuentro práctico',
  },
  {
    id: 'c4',
    nombre: 'Últimas dudas, próximos pasos',
    tema: 'Consultas y cierre',
    descripcion: 'Un espacio abierto para resolver inquietudes antes del cierre de la convocatoria y conocer los próximos pasos.',
    fecha: '2026-10-30',
    hora: '18:00',
    duracion: '60 min',
    sedeId: 's1',
    etiqueta: 'Cierre',
  },
];

// POSTULACIÓN INICIAL PARA RECORRER LA DEMO
export const ejemplos = [
  {
    id: 'MA-EJEMPLO-01',
    convocatoriaId: convocatoria.id,
    nombre: 'Alex',
    apellido: 'Ejemplo',
    dni: '12345678',
    nacimiento: '1995-05-20',
    direccion: 'Calle de ejemplo 123',
    telefono: '1112345678',
    correo: 'alex@example.com',
    distrito: distritos[0],
    experiencia: 'no',
    capacitacion: 'no',
    afiliacion: 'no',
    partido: '',
    intereses: ['c2'],
    estado: 'Pendiente de evaluación',
    creado: '2026-10-05T15:00:00Z',
    ejemplo: true,
  },
];
