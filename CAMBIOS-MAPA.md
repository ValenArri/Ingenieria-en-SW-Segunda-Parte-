# Charlas y sedes: listado y mapa sincronizados

Esta versión parte del ZIP `Ingenieria-en-SW-Segunda-Parte--main.zip` recibido el 12/10/2026. Conserva el estilo plano, los colores, la tipografía, el formulario y la administración del proyecto recibido.

## Uso

Abrí **Charlas y sedes**. A la izquierda se muestran las charlas con sus filtros y desplazamiento propio; a la derecha hay un único mapa de OpenStreetMap con un marcador numerado por charla ubicada. En celular el mapa se ubica encima del listado.

- Seleccionar una charla resalta la tarjeta y su marcador, centra el mapa y abre el popup.
- Seleccionar un marcador hace la misma selección y desplaza el listado hasta que la tarjeta quede visible.
- El popup incluye nombre, sede, dirección, fecha, horario y enlace al detalle existente.
- Buscar o filtrar actualiza listado y marcadores juntos. Si la selección deja de pertenecer a los resultados se limpia en ambos paneles.
- **Ver todas las sedes** vuelve a encuadrar los resultados sin perder el resaltado de la charla seleccionada.
- Los marcadores coincidentes o cercanos se separan visualmente al cambiar el zoom. Una línea conecta cada dibujo desplazado con sus coordenadas reales. Esto permite elegir por separado charlas que comparten sede.
- Las charlas sin coordenadas numéricas válidas permanecen en la lista, identificadas como «Ubicación no disponible», y no generan un marcador.
- Los botones del listado y los marcadores se pueden activar con teclado. La selección se comunica con `aria-pressed` y una región de estado.

## Ejecutar y publicar

El procedimiento sigue siendo `npm install` y `npm start`, y luego abrir `http://127.0.0.1:4173/#charlas`. Node.js 20 o superior. No se necesita compilación.

Para GitHub Pages, subí **todos los archivos del proyecto**, incluyendo `agenda.css`, `src/agenda.js` y `vendor/leaflet`. Publicá la raíz de la rama desde Settings → Pages. No subas el ZIP sin descomprimir.

Leaflet **1.9.4** se incluye localmente en `vendor/leaflet` con su licencia BSD-2-Clause. No se necesitan claves ni un CDN para cargar la biblioteca. El fondo geográfico de OpenStreetMap sí requiere conexión; se mantiene su atribución y se muestra un aviso si falla su carga. El mapa del detalle individual sigue disponible en su ruta anterior.

Documentación de referencia: [Leaflet](https://leafletjs.com/reference.html), [descarga y versión estable](https://leafletjs.com/download.html).

## Archivos de implementación

- `src/app.js`: estructura de la pestaña, filtros y ciclo de vida de la agenda.
- `src/agenda.js`: única selección compartida, marcadores, popup, desplazamiento del listado, validación de ubicaciones y separación visual de marcadores.
- `agenda.css`: diseño de paneles, selección, popup y adaptación móvil. Los estilos están acotados a la nueva agenda.
- `index.html`: carga de los recursos locales. Se retiró una referencia a `marca.svg`, ausente en el ZIP recibido.
- `vendor/leaflet/`: distribución local y licencia de Leaflet.
- `tests/agenda.test.js`: validación geográfica y separación de marcadores.

## Verificación

Pruebas en navegador: un mapa y cuatro marcadores, selección en ambos sentidos, una sola selección activa, popup correcto, desplazamiento automático de tarjeta, charlas con sede compartida, filtrado, cero resultados, teclado, navegación de salida/regreso y vista móvil sin desbordes. Se comprobó la carga real de mapas externos.

Pruebas nuevas de dominio: `node --test tests/agenda.test.js`.

La suite completa se ejecuta con `npm test`. **El ZIP original ya contiene dos pruebas de inscripción que fallan**, reproducidas sin aplicar ninguna modificación:

1. `hay tres ejemplos normalizados por convocatoria con postulaciones independientes` (aserción de estructura en `tests/inscripcion.test.js`, línea 76).
2. `un fallo de almacenamiento no confirma falsamente una inscripción` (espera 0 registros, pero los ejemplos iniciales contienen 9; línea 352).

No se cambiaron las reglas, los datos ni las pruebas originales de inscripción para ocultar esos fallos. Las tres pruebas nuevas de agenda pasan. Los documentos de entrega previos se conservan como estaban; este archivo describe el alcance actualizado de la pestaña.
