import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearRepositorio } from '../src/repositorio.js';
import { fechaActual, estadoConvocatoria, validar, normalizar, registrarSolicitud } from '../src/servicios.js';
import { distritos } from '../src/datos.js';
const datos = { nombre: 'María', apellido: 'Prueba', dni: '30555666', nacimiento: '1990-04-20', direccion: 'Calle ficticia 123', telefono: '+54 11 5555-1212', correo: 'maria@example.com', distrito: distritos[0], experiencia: 'no', capacitacion: 'no', afiliacion: 'no', partido: '', intereses: [] };
const crearAlmacenamiento = () => { const valores = new Map(); return { getItem: c => valores.get(c) || null, setItem: (c, v) => valores.set(c, v) }; };
test('la convocatoria respeta los límites exactos en hora argentina', () => {
  assert.equal(estadoConvocatoria(new Date('2026-09-30T23:59:59-03:00')), 'Próximamente');
  assert.equal(estadoConvocatoria(new Date('2026-10-01T00:00:00-03:00')), 'Inscripción abierta');
  assert.equal(estadoConvocatoria(new Date('2026-10-30T23:59:59.999-03:00')), 'Inscripción abierta');
  assert.equal(estadoConvocatoria(new Date('2026-10-31T00:00:00-03:00')), 'Convocatoria cerrada');
});
test('se puede registrar sin experiencia, capacitación ni interés en charlas', () => {
  assert.deepEqual(validar(datos, fechaActual('abierta')), {});
  const almacen = crearAlmacenamiento();
  const repo = crearRepositorio(almacen);
  const solicitud = registrarSolicitud(datos, repo, fechaActual('abierta'));
  assert.equal(solicitud.estado, 'Pendiente de evaluación');
  assert.equal(crearRepositorio(almacen).leer().ultimaId, solicitud.id);
  assert.equal(repo.leer().solicitudes.length, 2);
});
test('normaliza DNI y correo e impide duplicar una inscripción', () => {
  const repo = crearRepositorio(crearAlmacenamiento());
  registrarSolicitud({ ...datos, dni: '30.555.666', correo: ' MARIA@EXAMPLE.COM ' }, repo, fechaActual('abierta'));
  assert.equal(repo.leer().solicitudes[1].correo, 'maria@example.com');
  assert.throws(() => registrarSolicitud(datos, repo, fechaActual('abierta')), /Ya existe/);
});
test('bloquea registros futuros o cerrados incluso con datos válidos', () => {
  for (const escenario of ['futura', 'cerrada']) assert.throws(() => registrarSolicitud(datos, crearRepositorio(crearAlmacenamiento()), fechaActual(escenario)), /no está abierta/);
});
test('valida correo, DNI, teléfono, distrito, fechas inválidas y campos vacíos', () => {
  const errores = validar({ ...datos, correo: 'malo', dni: 'abc', telefono: 'hola', distrito: 'No existe', nacimiento: '2026-02-30', nombre: '' }, fechaActual('abierta'));
  for (const campo of ['correo', 'dni', 'telefono', 'distrito', 'nacimiento', 'nombre']) assert.ok(errores[campo]);
  assert.ok(validar({ ...datos, nacimiento: '2027-01-01' }, fechaActual('abierta')).nacimiento);
});
test('la afiliación requiere partido y no excluye al postulante', () => {
  assert.ok(validar({ ...datos, afiliacion: 'si' }, fechaActual('abierta')).partido);
  assert.deepEqual(validar({ ...datos, afiliacion: 'si', partido: 'Agrupación de ejemplo' }, fechaActual('abierta')), {});
  assert.equal(normalizar({ ...datos, partido: 'Dato residual' }).partido, '');
});
test('rechaza referencias a charlas inexistentes', () => {
  assert.ok(validar({ ...datos, intereses: ['inexistente'] }, fechaActual('abierta')).intereses);
});
test('un fallo de almacenamiento no confirma falsamente una inscripción', () => {
  const repo = crearRepositorio({ getItem: () => null, setItem: () => { throw new Error('QuotaExceededError'); } });
  assert.throws(() => registrarSolicitud(datos, repo, fechaActual('abierta')), /No pudimos guardar/);
  assert.equal(repo.leer().solicitudes.length, 1);
  assert.equal(repo.leer().ultimaId, null);
});
test('recupera almacenamiento corrupto y permite restablecer ejemplos', () => {
  const almacen = crearAlmacenamiento(); almacen.setItem('mesa-abierta-v1', '{roto');
  const repo = crearRepositorio(almacen);
  assert.match(repo.advertencia(), /No se pudieron recuperar/);
  registrarSolicitud(datos, repo, fechaActual('abierta'));
  repo.reiniciar(); assert.equal(repo.leer().solicitudes.length, 1); assert.equal(repo.leer().ultimaId, null);
});
