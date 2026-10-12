import { convocatoria, convocatorias, ejemplos } from './datos.js';

// La clave identifica la versión del formato guardado en localStorage.
const clave = 'mesa-abierta-v1';

function estadoInicial() {
  // Clona los ejemplos para no compartir objetos mutables entre lecturas.
  return {
    inscripciones: structuredClone(ejemplos),
    ultimaId: null,
    escenario: 'abierta',
    convocatoriaId: convocatoria.id,
  };
}

// ADAPTADOR DE PERSISTENCIA LOCAL
export function crearRepositorio(almacenamiento) {
  // La memoria mantiene el estado vigente y sirve de respaldo al almacenamiento local.
  let memoria = estadoInicial();
  let advertencia = '';

  // Recupera datos válidos; ante datos dañados conserva los ejemplos de la demo.
  try {
    // Lee y valida el JSON guardado antes de reemplazar el estado de ejemplo.
    const guardado = almacenamiento.getItem(clave);
    if (guardado) {
      const datos = JSON.parse(guardado);
      const escenarioValido = ['abierta', 'cerrada', 'futura', 'real'].includes(datos.escenario);
      const convocatoriaId = datos.convocatoriaId || convocatoria.id;
      const convocatoriaValida = convocatorias.some(periodo => periodo.id === convocatoriaId);
      const inscripcionesGuardadas = datos.inscripciones || datos.solicitudes;
      const inscripcionesValidas =
        Array.isArray(inscripcionesGuardadas) &&
        inscripcionesGuardadas.every(
          inscripcion =>
            inscripcion &&
            typeof inscripcion.dni === 'string' &&
            typeof inscripcion.id === 'string' &&
            typeof inscripcion.convocatoriaId === 'string' &&
            Array.isArray(inscripcion.intereses),
        );

      if (!inscripcionesValidas || !escenarioValido || !convocatoriaValida) throw new Error();
      const { solicitudes, ...datosActualizados } = datos;
      const idsGuardados = new Set(inscripcionesGuardadas.map(inscripcion => inscripcion.id));
      memoria = {
        ...datosActualizados,
        inscripciones: [
          ...inscripcionesGuardadas,
          ...ejemplos.filter(inscripcion => !idsGuardados.has(inscripcion.id)),
        ],
        convocatoriaId,
      };
    }
  } catch {
    advertencia = 'No se pudieron recuperar los datos locales. La demo usa datos de ejemplo.';
  }

  return {
    leer: () => {
      // Entrega una copia para que quien consume el repositorio no mute su estado interno.
      return structuredClone(memoria);
    },
    advertencia: () => {
      // Expone el aviso generado durante la recuperación inicial.
      return advertencia;
    },
    guardar(datos) {
      // Escribe primero en localStorage; solo confirma en memoria si la escritura funciona.
      try {
        almacenamiento.setItem(clave, JSON.stringify(datos));
      } catch {
        throw new Error(
          'No pudimos guardar los datos en este navegador. Habilitá el almacenamiento local y volvé a intentar.',
        );
      }

      memoria = structuredClone(datos);
    },
    reiniciar() {
      // Repone los datos de ejemplo a través del mismo camino de guardado.
      this.guardar(estadoInicial());
    },
  };
}
