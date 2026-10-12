import { convocatoria, convocatorias, ejemplos } from './datos.js';

// La clave identifica la versión del formato guardado en localStorage.
const clave = 'mesa-abierta-v1';

const datosCiudadano = ({ dni, nombre, apellido, nacimiento }) => ({
  dni,
  nombre,
  apellido,
  nacimiento,
});

function normalizarRegistros(inscripciones) {
  const ciudadanos = new Map();
  const postulaciones = [];
  const vinculos = [];

  for (const registro of inscripciones) {
    ciudadanos.set(registro.dni, datosCiudadano(registro));
    const {
      convocatoriaId,
      creado,
      nombre,
      apellido,
      nacimiento,
      dni,
      inscripcionId,
      ...datosPostulacion
    } = registro;
    postulaciones.push({
      ...datosPostulacion,
      ciudadanoDni: dni,
    });
    vinculos.push({
      id: registro.inscripcionId || `INS-${registro.id}`,
      postulacionId: registro.id,
      convocatoriaId,
      fechaRegistro: creado,
    });
  }

  return {
    ciudadanos: [...ciudadanos.values()],
    postulaciones,
    inscripciones: vinculos,
  };
}

function proyectarInscripciones(datos) {
  const ciudadanos = new Map(datos.ciudadanos.map(ciudadano => [ciudadano.dni, ciudadano]));
  const postulaciones = new Map(datos.postulaciones.map(postulacion => [postulacion.id, postulacion]));

  return datos.inscripciones.map(inscripcion => {
    const postulacion = postulaciones.get(inscripcion.postulacionId);
    const ciudadano = ciudadanos.get(postulacion.ciudadanoDni);
    const { ciudadanoDni, ...datosPostulacion } = postulacion;
    return {
      ...datosPostulacion,
      ...ciudadano,
      id: postulacion.id,
      inscripcionId: inscripcion.id,
      convocatoriaId: inscripcion.convocatoriaId,
      creado: inscripcion.fechaRegistro,
    };
  });
}

function estadoInicial() {
  // Clona los ejemplos para no compartir objetos mutables entre lecturas.
  return {
    ...normalizarRegistros(structuredClone(ejemplos)),
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
      const esNormalizado =
        Array.isArray(datos.ciudadanos) &&
        Array.isArray(datos.postulaciones) &&
        Array.isArray(datos.inscripciones) &&
        datos.inscripciones.every(
          inscripcion =>
            typeof inscripcion.id === 'string' &&
            typeof inscripcion.postulacionId === 'string' &&
            convocatorias.some(periodo => periodo.id === inscripcion.convocatoriaId),
        );
      const inscripcionesGuardadas = datos.inscripciones || datos.solicitudes;
      const inscripcionesValidas = esNormalizado
        ? datos.ciudadanos.every(ciudadano => typeof ciudadano.dni === 'string') &&
          datos.postulaciones.every(
            postulacion =>
              typeof postulacion.id === 'string' &&
              typeof postulacion.ciudadanoDni === 'string' &&
              datos.ciudadanos.some(ciudadano => ciudadano.dni === postulacion.ciudadanoDni) &&
              Array.isArray(postulacion.intereses),
          ) &&
          datos.inscripciones.every(inscripcion =>
            datos.postulaciones.some(postulacion => postulacion.id === inscripcion.postulacionId),
          )
        : Array.isArray(inscripcionesGuardadas) &&
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
      const registrosActuales = esNormalizado
        ? proyectarInscripciones(datos)
        : inscripcionesGuardadas;
      const idsGuardados = new Set(registrosActuales.map(inscripcion => inscripcion.id));
      const registrosCompletos = [
        ...registrosActuales,
        ...ejemplos.filter(inscripcion => !idsGuardados.has(inscripcion.id)),
      ];
      memoria = {
        ...datosActualizados,
        ...normalizarRegistros(registrosCompletos),
        convocatoriaId,
      };
    }
  } catch {
    advertencia = 'No se pudieron recuperar los datos locales. La demo usa datos de ejemplo.';
  }

  return {
    leer: () => {
      // Entrega una copia para que quien consume el repositorio no mute su estado interno.
      return {
        ...structuredClone(memoria),
        inscripciones: structuredClone(proyectarInscripciones(memoria)),
      };
    },
    advertencia: () => {
      // Expone el aviso generado durante la recuperación inicial.
      return advertencia;
    },
    guardar(datos) {
      // Escribe primero en localStorage; solo confirma en memoria si la escritura funciona.
      const normalizados = {
        ...datos,
        ...normalizarRegistros(datos.inscripciones),
      };
      try {
        almacenamiento.setItem(clave, JSON.stringify(normalizados));
      } catch {
        throw new Error(
          'No pudimos guardar los datos en este navegador. Habilitá el almacenamiento local y volvé a intentar.',
        );
      }

      memoria = structuredClone(normalizados);
    },
    reiniciar() {
      // Repone los datos de ejemplo a través del mismo camino de guardado.
      this.guardar(estadoInicial());
    },
  };
}
