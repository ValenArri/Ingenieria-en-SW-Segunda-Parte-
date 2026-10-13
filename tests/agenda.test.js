import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ubicacionValida, distribuirMarcadores } from '../src/agenda.js';

test('acepta coordenadas numéricas válidas, incluyendo cero y límites geográficos', () => {
  for (const [latitud, longitud] of [[-34.5842, -58.398], [0, 0], [-90, -180], [90, 180]]) {
    assert.equal(ubicacionValida({ latitud, longitud }), true);
  }
});

test('excluye sedes inexistentes, valores vacíos, no numéricos o fuera de rango', () => {
  for (const sede of [undefined, null, {}, {latitud:null,longitud:0}, {latitud:'',longitud:0},
    {latitud:'-34',longitud:-58}, {latitud:NaN,longitud:0}, {latitud:0,longitud:Infinity},
    {latitud:91,longitud:0}, {latitud:0,longitud:-181}]) {
    assert.equal(ubicacionValida(sede), false);
  }
});

test('separa marcadores coincidentes y cercanos sin modificar sus puntos originales', () => {
  const puntos = [{x:100,y:100}, {x:105,y:101}, {x:100,y:100}, {x:500,y:500}];
  const original = structuredClone(puntos);
  const posiciones = distribuirMarcadores(puntos);
  assert.deepEqual(puntos, original);
  assert.deepEqual(posiciones[3], puntos[3]);
  for (let i=0;i<posiciones.length;i++) for (let j=i+1;j<posiciones.length;j++) {
    assert.ok(Math.hypot(posiciones[i].x-posiciones[j].x,posiciones[i].y-posiciones[j].y)>=42);
  }
});
