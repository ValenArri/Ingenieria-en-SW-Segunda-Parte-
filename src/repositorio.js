import { ejemplos } from './datos.js';
const clave = 'mesa-abierta-v1';
const vacio = () => ({ solicitudes: structuredClone(ejemplos), ultimaId: null, escenario: 'abierta' });
export function crearRepositorio(almacenamiento) {
  let memoria = vacio();
  let advertencia = '';
  try {
    const guardado = almacenamiento.getItem(clave);
    if (guardado) {
      const datos = JSON.parse(guardado);
      if (!Array.isArray(datos.solicitudes) || !['abierta', 'cerrada', 'futura', 'real'].includes(datos.escenario) || !datos.solicitudes.every(s => s && typeof s.dni === 'string' && typeof s.id === 'string' && Array.isArray(s.intereses))) throw new Error();
      memoria = datos;
    }
  } catch { advertencia = 'No se pudieron recuperar los datos locales. La demo usa datos de ejemplo.'; }
  return {
    leer: () => structuredClone(memoria),
    advertencia: () => advertencia,
    guardar(datos) {
      try { almacenamiento.setItem(clave, JSON.stringify(datos)); }
      catch { throw new Error('No pudimos guardar los datos en este navegador. Habilitá el almacenamiento local y volvé a intentar.'); }
      memoria = structuredClone(datos);
    },
    reiniciar() { this.guardar(vacio()); },
  };
}
