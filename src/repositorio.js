import { convocatoria, convocatorias, datosEjemplo } from './datos.js';

// La clave identifica la versión del formato guardado en localStorage.
const clave = 'mesa-abierta-v1';
const esDatoDePruebaAnterior = registro =>
  Boolean(registro) &&
  (/^MA-EJEMPLO-/.test(registro.id || '') ||
    /^MA-EJEMPLO-/.test(registro.postulacionId || ''));

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
    delete datosPostulacion.ejemplo;
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
  const referenciasPorPostulacion = new Map();
  for (const inscripcion of datos.inscripciones) {
    referenciasPorPostulacion.set(
      inscripcion.postulacionId,
      (referenciasPorPostulacion.get(inscripcion.postulacionId) || 0) + 1,
    );
  }

  return datos.inscripciones.map(inscripcion => {
    const postulacion = postulaciones.get(inscripcion.postulacionId);
    const ciudadano = ciudadanos.get(postulacion.ciudadanoDni);
    const compartida = referenciasPorPostulacion.get(inscripcion.postulacionId) > 1;
    const { ciudadanoDni, ...datosPostulacion } = postulacion;
    if (compartida) {
      datosPostulacion.id = `${postulacion.id}-${inscripcion.id}`;
      datosPostulacion.estado = 'Pendiente de evaluación';
      delete datosPostulacion.motivo;
    }
    return {
      ...datosPostulacion,
      ...ciudadano,
      id: datosPostulacion.id,
      inscripcionId: inscripcion.id,
      convocatoriaId: inscripcion.convocatoriaId,
      creado: inscripcion.fechaRegistro,
      ...(inscripcion.id.startsWith('DEMO-INS-') ? { ejemplo: true } : {}),
    };
  });
}

function combinarDatosEjemplo(datos) {
  const ciudadanosPorDni = new Map(datos.ciudadanos.map(ciudadano => [ciudadano.dni, ciudadano]));
  const postulacionesPorId = new Map(datos.postulaciones.map(postulacion => [postulacion.id, postulacion]));
  const inscripcionesPorId = new Map(datos.inscripciones.map(inscripcion => [inscripcion.id, inscripcion]));

  for (const ciudadano of datosEjemplo.ciudadanos) {
    if (!ciudadanosPorDni.has(ciudadano.dni)) ciudadanosPorDni.set(ciudadano.dni, structuredClone(ciudadano));
  }
  for (const postulacion of datosEjemplo.postulaciones) {
    if (!postulacionesPorId.has(postulacion.id)) postulacionesPorId.set(postulacion.id, structuredClone(postulacion));
  }
  for (const inscripcion of datosEjemplo.inscripciones) {
    if (!inscripcionesPorId.has(inscripcion.id)) inscripcionesPorId.set(inscripcion.id, structuredClone(inscripcion));
  }

  return {
    ...datos,
    ciudadanos: [...ciudadanosPorDni.values()],
    postulaciones: [...postulacionesPorId.values()],
    inscripciones: [...inscripcionesPorId.values()],
  };
}

function sinDatosEjemplo() {
  return {
    ciudadanos: [],
    postulaciones: [],
    inscripciones: [],
  };
}

function estadoInicial() {
  return {
    ...structuredClone(datosEjemplo),
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

  // Recupera datos válidos; ante datos dañados inicia con un repositorio vacío.
  try {
    // Lee y valida el JSON guardado antes de reemplazar el estado en memoria.
    const guardado = almacenamiento.getItem(clave);
    if (guardado) {
      const datos = JSON.parse(guardado);
      const registrosGuardados = Array.isArray(datos.inscripciones)
        ? datos.inscripciones
        : datos.solicitudes;
      const soloDatosDePrueba = Array.isArray(registrosGuardados) &&
        registrosGuardados.length > 0 &&
        registrosGuardados.every(esDatoDePruebaAnterior);
      if (soloDatosDePrueba) {
        memoria = datos.ejemplosDesactivados
          ? { ...estadoInicial(), ...sinDatosEjemplo(), ejemplosDesactivados: true }
          : estadoInicial();
        try {
          almacenamiento.setItem(clave, JSON.stringify(memoria));
          advertencia = 'Se eliminaron los datos de prueba guardados en este navegador.';
        } catch {
          advertencia = 'Los datos de prueba se ocultaron en esta sesión, pero no se pudieron eliminar del almacenamiento de este navegador.';
        }
      } else {
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
        const registrosReales = registrosActuales.filter(registro => !esDatoDePruebaAnterior(registro));
        const seEliminaronDatosDePrueba = registrosReales.length !== registrosActuales.length;
        const estadoGuardado = {
          ...datosActualizados,
          ...normalizarRegistros(registrosReales),
          convocatoriaId,
          ultimaId: registrosReales.some(registro => registro.id === datosActualizados.ultimaId)
            ? datosActualizados.ultimaId
            : null,
        };
        memoria = datos.ejemplosDesactivados
          ? estadoGuardado
          : combinarDatosEjemplo(estadoGuardado);
        if (seEliminaronDatosDePrueba) {
          try {
            almacenamiento.setItem(clave, JSON.stringify(memoria));
            advertencia = 'Se eliminaron los datos de prueba guardados en este navegador.';
          } catch {
            advertencia = 'Los datos de prueba se ocultaron en esta sesión, pero no se pudieron eliminar del almacenamiento de este navegador.';
          }
        }
      }
    }
  } catch {
    advertencia = 'No se pudieron recuperar los datos locales. Se cargaron los datos de ejemplo.';
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
    borrarDatos() {
      this.guardar({
        ...sinDatosEjemplo(),
        ultimaId: null,
        escenario: 'abierta',
        convocatoriaId: convocatoria.id,
        ejemplosDesactivados: true,
      });
    },
  };
}
