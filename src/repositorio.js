import { ejemplos } from './datos.js';

// La clave identifica la versión del formato guardado en localStorage.
const clave = 'mesa-abierta-v1';

function estadoInicial() {
  // Clona los ejemplos para no compartir objetos mutables entre lecturas.
  return {
    solicitudes: structuredClone(ejemplos),
    ultimaId: null,
    escenario: 'abierta',
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
      const solicitudesValidas =
        Array.isArray(datos.solicitudes) &&
        datos.solicitudes.every(
          solicitud =>
            solicitud &&
            typeof solicitud.dni === 'string' &&
            typeof solicitud.id === 'string' &&
            Array.isArray(solicitud.intereses),
        );

      if (!solicitudesValidas || !escenarioValido) throw new Error();
      memoria = datos;
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
