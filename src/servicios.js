import { convocatoria, distritos, charlas } from './datos.js';
export function fechaActual(escenario, real = new Date()) {
  return new Date(({ abierta: '2026-10-06T12:00:00-03:00', cerrada: '2026-10-31T12:00:00-03:00', futura: '2026-09-28T12:00:00-03:00' })[escenario] || real);
}
export function estadoConvocatoria(fecha) {
  if (fecha < new Date(convocatoria.inicio)) return 'Próximamente';
  return fecha <= new Date(convocatoria.fin) ? 'Inscripción abierta' : 'Convocatoria cerrada';
}
export function normalizar(datos) {
  const resultado = Object.fromEntries(Object.entries(datos).map(([clave, valor]) => [clave, typeof valor === 'string' ? valor.trim() : valor]));
  resultado.dni = (resultado.dni || '').replace(/[.\s]/g, '');
  resultado.correo = (resultado.correo || '').toLowerCase();
  resultado.intereses = [...new Set(resultado.intereses || [])];
  if (resultado.afiliacion !== 'si') resultado.partido = '';
  return resultado;
}
export function validar(datos, fecha, paso = null) {
  const errores = {};
  const requerir = (campo, mensaje) => { if (!datos[campo]) errores[campo] = mensaje; };
  if (paso === null || paso === 1) {
    ['nombre', 'apellido', 'nacimiento', 'direccion', 'distrito', 'telefono', 'correo'].forEach(c => requerir(c, 'Completá este campo.'));
    if (!/^\d{7,8}$/.test(datos.dni || '')) errores.dni = 'Ingresá un DNI de 7 u 8 dígitos.';
    if (!distritos.includes(datos.distrito)) errores.distrito = 'Seleccioná un distrito electoral.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo || '')) errores.correo = 'Ingresá un correo válido, por ejemplo nombre@correo.com.';
    if (!/^[+\d\s()-]+$/.test(datos.telefono || '') || (datos.telefono || '').replace(/\D/g, '').length < 8 || (datos.telefono || '').replace(/\D/g, '').length > 15) errores.telefono = 'Ingresá un teléfono de entre 8 y 15 dígitos.';
    const nacimiento = new Date(datos.nacimiento + 'T12:00:00-03:00');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datos.nacimiento || '') || Number.isNaN(+nacimiento) || nacimiento.toISOString().slice(0, 10) !== datos.nacimiento || nacimiento > fecha || nacimiento.getFullYear() < 1900) errores.nacimiento = 'Ingresá una fecha de nacimiento válida, no futura.';
    for (const c of ['nombre', 'apellido', 'direccion']) if ((datos[c] || '').length > 120) errores[c] = 'Usá un máximo de 120 caracteres.';
  }
  if (paso === null || paso === 2) {
    for (const c of ['experiencia', 'capacitacion', 'afiliacion']) if (!['si', 'no'].includes(datos[c])) errores[c] = 'Elegí una opción.';
    if (datos.afiliacion === 'si' && (!datos.partido || datos.partido.length > 120)) errores.partido = 'Indicá el partido o agrupación (hasta 120 caracteres).';
    if ((datos.intereses || []).some(id => !charlas.some(c => c.id === id))) errores.intereses = 'Seleccioná una charla válida.';
  }
  return errores;
}
export function registrarSolicitud(datos, repositorio, fecha) {
  if (estadoConvocatoria(fecha) !== 'Inscripción abierta') throw new Error('La convocatoria no está abierta. No se puede registrar la postulación.');
  const normalizados = normalizar(datos);
  if (Object.keys(validar(normalizados, fecha)).length) throw new Error('Revisá los datos de la solicitud antes de enviarla.');
  const estado = repositorio.leer();
  if (estado.solicitudes.some(s => s.dni === normalizados.dni && s.convocatoriaId === convocatoria.id)) throw new Error('Ya existe una postulación con ese DNI en esta convocatoria y navegador. Revisá Mi solicitud o usá otro DNI ficticio.');
  const solicitud = { ...normalizados, id: 'MA-' + crypto.randomUUID().slice(0, 8).toUpperCase(), convocatoriaId: convocatoria.id, creado: fecha.toISOString(), estado: 'Pendiente de evaluación', ejemplo: false };
  repositorio.guardar({ ...estado, solicitudes: [...estado.solicitudes, solicitud], ultimaId: solicitud.id });
  return solicitud;
}
