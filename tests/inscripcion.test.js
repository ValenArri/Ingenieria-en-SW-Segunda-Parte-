import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearRepositorio } from '../src/repositorio.js';
import {
  fechaActual,
  estadoConvocatoria,
  validar,
  normalizar,
  registrarSolicitud,
  resolverSolicitud,
} from '../src/servicios.js';
import { convocatoria, convocatorias, distritos, ejemplos } from '../src/datos.js';

// Datos válidos reutilizados por los casos de inscripción.
const datos = {
  nombre: 'María',
  apellido: 'Prueba',
  dni: '30555666',
  nacimiento: '1990-04-20',
  direccion: 'Calle ficticia 123',
  telefono: '+54 11 5555-1212',
  correo: 'maria@example.com',
  distrito: distritos[0],
  experiencia: 'no',
  capacitacion: 'no',
  afiliacion: 'no',
  partido: '',
  intereses: [],
};

function crearAlmacenamiento() {
  const valores = new Map();

  return {
    getItem: clave => valores.get(clave) || null,
    setItem: (clave, valor) => valores.set(clave, valor),
  };
}

// CONVOCATORIA Y REGISTRO DE POSTULACIONES
test('la convocatoria respeta los límites exactos en hora argentina', () => {
  assert.equal(estadoConvocatoria(new Date('2026-09-30T23:59:59-03:00')), 'Próximamente');
  assert.equal(estadoConvocatoria(new Date('2026-10-01T00:00:00-03:00')), 'Inscripción abierta');
  assert.equal(estadoConvocatoria(new Date('2026-10-30T23:59:59.999-03:00')), 'Inscripción abierta');
  assert.equal(estadoConvocatoria(new Date('2026-10-31T00:00:00-03:00')), 'Convocatoria cerrada');
});

test('hay tres inscripciones de ejemplo para cada convocatoria', () => {
  for (const periodo of convocatorias) {
    assert.equal(
      ejemplos.filter(inscripcion => inscripcion.convocatoriaId === periodo.id).length,
      3,
      `Se esperaban tres inscripciones de ejemplo para ${periodo.nombre}.`,
    );
  }
});

test('se puede registrar sin experiencia, capacitación ni interés en charlas', () => {
  assert.deepEqual(validar(datos, fechaActual('abierta')), {});

  const almacen = crearAlmacenamiento();
  const repo = crearRepositorio(almacen);
  const solicitud = registrarSolicitud(datos, repo, fechaActual('abierta'));

  assert.equal(solicitud.estado, 'Pendiente de evaluación');
  assert.equal(crearRepositorio(almacen).leer().ultimaId, solicitud.id);
  assert.equal(repo.leer().inscripciones.length, ejemplos.length + 1);
  const guardado = JSON.parse(almacen.getItem('mesa-abierta-v1'));
  const postulacionGuardada = guardado.postulaciones.find(postulacion => postulacion.id === solicitud.id);
  const inscripcionGuardada = guardado.inscripciones.find(inscripcion => inscripcion.postulacionId === solicitud.id);
  assert.equal(postulacionGuardada.ciudadanoDni, solicitud.dni);
  assert.equal(inscripcionGuardada.convocatoriaId, convocatoria.id);
});

test('normaliza DNI y correo e impide duplicar una inscripción', () => {
  const repo = crearRepositorio(crearAlmacenamiento());

  registrarSolicitud({ ...datos, dni: '30.555.666', correo: ' MARIA@EXAMPLE.COM ' }, repo, fechaActual('abierta'));

  assert.equal(repo.leer().inscripciones.find(inscripcion => inscripcion.correo === 'maria@example.com').correo, 'maria@example.com');
  assert.throws(() => registrarSolicitud(datos, repo, fechaActual('abierta')), /Ya existe/);
});

test('permite al mismo DNI inscribirse en convocatorias distintas, una vez por cada una', () => {
  const almacen = crearAlmacenamiento();
  const repo = crearRepositorio(almacen);
  const convocatoriaSiguiente = {
    id: 'conv-2027',
    inicio: '2027-10-01T00:00:00-03:00',
    fin: '2027-10-30T23:59:59.999-03:00',
  };
  const fechaSiguiente = new Date('2027-10-06T12:00:00-03:00');

  registrarSolicitud(datos, repo, fechaActual('abierta'));
  const otraInscripcion = registrarSolicitud(datos, repo, fechaSiguiente, convocatoriaSiguiente);

  assert.equal(otraInscripcion.dni, datos.dni);
  assert.equal(otraInscripcion.convocatoriaId, convocatoriaSiguiente.id);
  assert.equal(repo.leer().inscripciones.length, ejemplos.length + 2);
  const guardado = JSON.parse(almacen.getItem('mesa-abierta-v1'));
  assert.equal(guardado.ciudadanos.filter(ciudadano => ciudadano.dni === datos.dni).length, 1);
  assert.equal(guardado.postulaciones.filter(postulacion => postulacion.ciudadanoDni === datos.dni).length, 2);
  assert.throws(
    () => registrarSolicitud(datos, repo, fechaSiguiente, convocatoriaSiguiente),
    /para esta convocatoria/,
  );
});

test('al rechazar guarda el motivo y al aprobar no lo agrega', () => {
  const repo = crearRepositorio(crearAlmacenamiento());
  repo.guardar({ ...repo.leer(), escenario: 'cerrada' });

  const rechazada = resolverSolicitud('MA-EJEMPLO-01', 'Rechazada', '  Datos incompletos.  ', repo);
  assert.equal(rechazada.estado, 'Rechazada');
  assert.equal(rechazada.motivo, 'Datos incompletos.');

  repo.reiniciar();
  repo.guardar({ ...repo.leer(), escenario: 'cerrada' });
  const aprobada = resolverSolicitud('MA-EJEMPLO-01', 'Aprobada', '', repo);
  assert.equal(aprobada.estado, 'Aprobada');
  assert.equal(Object.hasOwn(aprobada, 'motivo'), false);
});

test('no permite rechazar sin un motivo ni resolver una postulación dos veces', () => {
  const repo = crearRepositorio(crearAlmacenamiento());
  repo.guardar({ ...repo.leer(), escenario: 'cerrada' });

  assert.throws(
    () => resolverSolicitud('MA-EJEMPLO-01', 'Rechazada', '  ', repo),
    /Ingresá el motivo/,
  );
  assert.equal(repo.leer().inscripciones[0].estado, 'Pendiente de evaluación');

  resolverSolicitud('MA-EJEMPLO-01', 'Aprobada', '', repo);
  assert.throws(
    () => resolverSolicitud('MA-EJEMPLO-01', 'Rechazada', 'Motivo', repo),
    /ya no está pendiente/,
  );
});

test('no permite revisar postulaciones mientras la convocatoria siga abierta', () => {
  const repo = crearRepositorio(crearAlmacenamiento());

  assert.throws(
    () => resolverSolicitud('MA-EJEMPLO-01', 'Aprobada', '', repo),
    /cuando la convocatoria está cerrada/,
  );
  assert.equal(repo.leer().inscripciones[0].estado, 'Pendiente de evaluación');
});

test('los escenarios de fecha se ajustan al período seleccionado', () => {
  const convocatoria2027 = convocatorias.find(periodo => periodo.id === 'conv-2027');
  const convocatoria2028 = convocatorias.find(periodo => periodo.id === 'conv-2028');

  assert.equal(estadoConvocatoria(fechaActual('abierta', convocatoria2027), convocatoria2027), 'Inscripción abierta');
  assert.equal(estadoConvocatoria(fechaActual('cerrada', convocatoria2027), convocatoria2027), 'Convocatoria cerrada');
  assert.equal(estadoConvocatoria(fechaActual('futura', convocatoria2028), convocatoria2028), 'Próximamente');
  assert.equal(estadoConvocatoria(fechaActual('abierta', convocatoria), convocatoria), 'Inscripción abierta');
});

test('la revisión usa el cierre del período seleccionado y no el de otra convocatoria', () => {
  const repo = crearRepositorio(crearAlmacenamiento());
  repo.guardar({ ...repo.leer(), escenario: 'cerrada' });
  const convocatoria2027 = convocatorias.find(periodo => periodo.id === 'conv-2027');

  const resuelta = resolverSolicitud('MA-EJEMPLO-02', 'Aprobada', '', repo, convocatoria2027);
  assert.equal(resuelta.convocatoriaId, convocatoria2027.id);
  assert.equal(resuelta.estado, 'Aprobada');
  assert.equal(repo.leer().inscripciones.find(inscripcion => inscripcion.id === 'MA-EJEMPLO-01').estado, 'Pendiente de evaluación');
});

test('bloquea registros futuros o cerrados incluso con datos válidos', () => {
  for (const escenario of ['futura', 'cerrada']) {
    assert.throws(
      () => registrarSolicitud(datos, crearRepositorio(crearAlmacenamiento()), fechaActual(escenario)),
      /no está abierta/,
    );
  }
});

// VALIDACIONES DE LOS PASOS DEL FORMULARIO
test('valida correo, DNI, teléfono, distrito, fechas inválidas y campos vacíos', () => {
  const errores = validar(
    {
      ...datos,
      correo: 'malo',
      dni: 'abc',
      telefono: 'hola',
      distrito: 'No existe',
      nacimiento: '2026-02-30',
      nombre: '',
    },
    fechaActual('abierta'),
  );

  for (const campo of ['correo', 'dni', 'telefono', 'distrito', 'nacimiento', 'nombre']) assert.ok(errores[campo]);
  assert.ok(validar({ ...datos, nacimiento: '2027-01-01' }, fechaActual('abierta')).nacimiento);
});

test('requiere fecha de nacimiento y que la persona tenga al menos 16 años', () => {
  const fechaInscripcion = fechaActual('abierta');

  assert.ok(validar({ ...datos, nacimiento: '' }, fechaInscripcion).nacimiento);
  assert.deepEqual(
    validar({ ...datos, nacimiento: '2010-10-06' }, fechaInscripcion),
    {},
  );
  assert.match(
    validar({ ...datos, nacimiento: '2010-10-07' }, fechaInscripcion).nacimiento,
    /al menos 16 años/,
  );
});

test('la afiliación requiere partido y no excluye al postulante', () => {
  assert.ok(validar({ ...datos, afiliacion: 'si' }, fechaActual('abierta')).partido);
  assert.deepEqual(validar({ ...datos, afiliacion: 'si', partido: 'Agrupación de ejemplo' }, fechaActual('abierta')), {});
  assert.equal(normalizar({ ...datos, partido: 'Dato residual' }).partido, '');
});

test('rechaza referencias a charlas inexistentes', () => {
  assert.ok(validar({ ...datos, intereses: ['inexistente'] }, fechaActual('abierta')).intereses);
});

// PERSISTENCIA Y RECUPERACIÓN DEL REPOSITORIO
test('un fallo de almacenamiento no confirma falsamente una inscripción', () => {
  const repo = crearRepositorio({ getItem: () => null, setItem: () => { throw new Error('QuotaExceededError'); } });

  assert.throws(() => registrarSolicitud(datos, repo, fechaActual('abierta')), /No pudimos guardar/);
  assert.equal(repo.leer().inscripciones.length, ejemplos.length);
  assert.equal(repo.leer().ultimaId, null);
});

test('recupera almacenamiento corrupto y permite restablecer ejemplos', () => {
  const almacen = crearAlmacenamiento();
  almacen.setItem('mesa-abierta-v1', '{roto');

  const repo = crearRepositorio(almacen);
  assert.match(repo.advertencia(), /No se pudieron recuperar/);
  registrarSolicitud(datos, repo, fechaActual('abierta'));

  repo.reiniciar();
  assert.equal(repo.leer().inscripciones.length, ejemplos.length);
  assert.equal(repo.leer().ultimaId, null);
});

test('migra los registros guardados en el formato anterior', () => {
  const almacen = crearAlmacenamiento();
  almacen.setItem('mesa-abierta-v1', JSON.stringify({
    solicitudes: [{
      id: 'MA-ANTERIOR',
      dni: '30555666',
      nombre: 'María',
      apellido: 'Anterior',
      nacimiento: '1990-04-20',
      correo: 'maria@example.com',
      convocatoriaId: 'conv-2026',
      intereses: [],
    }],
    ultimaId: 'MA-ANTERIOR',
    escenario: 'abierta',
  }));

  const repo = crearRepositorio(almacen);
  assert.equal(repo.leer().inscripciones[0].id, 'MA-ANTERIOR');
  assert.equal(repo.leer().inscripciones[0].nombre, 'María');
  assert.equal(Object.hasOwn(repo.leer(), 'solicitudes'), false);
  assert.ok(repo.leer().inscripciones.some(inscripcion => inscripcion.convocatoriaId === 'conv-2027'));
});
