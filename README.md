# Mesa Abierta · Prueba de concepto

Prototipo web del Portal para Autoridades de Mesa.
Trabajo Práctico de Ingeniería de Software · Grupo 04 · 2C/2026 · Universidad Nacional de General Sarmiento.

## Qué incluye

- **Consultar charlas:** listado con búsqueda y filtros, y detalle de cada charla.
- **Mostrar ubicación:** mapa de OpenStreetMap con un marcador por sede.
- **Registrarse como postulante:** formulario en 3 pasos (datos personales, antecedentes e interés en charlas, y revisión), con número de comprobante.
- **Mi solicitud:** consulta de los datos enviados y del comprobante.
- **Explorar la demo:** cambio de convocatoria y de fecha del sistema, y revisión simulada de solicitudes cuando la convocatoria está cerrada.

Los datos son ficticios y se guardan en el `localStorage` del navegador, por lo que no se requieren servidores, cuentas ni claves.

## Requisitos

- Node.js 20 o superior (solo para el servidor local y los tests).
- Un navegador actualizado y conexión a internet para cargar el mapa.

## Cómo ejecutarlo

```bash
npm start
```

Luego abrir <http://127.0.0.1:4173>.

También puede publicarse tal cual en GitHub Pages, ya que es una aplicación estática.

## Tests

```bash
npm test
```

## Estructura

| Ruta | Contenido |
| --- | --- |
| `index.html` | Página única de la aplicación |
| `estilos.css`, `agenda.css` | Estilos generales y de la vista Charlas y sedes |
| `src/` | Código de la aplicación: presentación (`app.js`), reglas (`servicios.js`), persistencia (`repositorio.js`) y datos iniciales (`datos.js`) |
| `vendor/leaflet/` | Librería Leaflet para el mapa |
| `servidor.mjs` | Servidor estático local |
| `tests/` | Pruebas automáticas |
| `FLUJO-TP2.md` | Flujo del prototipo, trazabilidad y supuestos |

## Limitaciones

- Los datos viven solo en el navegador donde se usan; no hay base compartida.
- No incluye el módulo administrativo completo, el reporte de postulantes ni el envío de correos.
- Guardar una postulación no implica aprobación ni designación como autoridad de mesa.

## Equipo

Arri Mareschi, Valentina · Romero, Jorge · Acosta, Emiliano · Galeano, Juan Pablo
