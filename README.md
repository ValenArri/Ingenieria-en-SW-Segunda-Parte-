# Mesa Abierta · Grupo 04

Prueba de concepto funcional para la **Entrega TP2 de Ingeniería de Software, 2C/2026**. Portal de inscripción de postulantes a autoridad de mesa y consulta de charlas con ubicación geográfica.

## Publicar en GitHub Pages

1. Creá un repositorio en GitHub (por ejemplo, `mesa-abierta`). Para usar Pages sin un plan pago, elegí un repositorio público.
2. Subí **el contenido de esta carpeta** a la raíz del repositorio: `index.html` debe quedar directamente en la raíz, junto a `estilos.css`, los SVG y la carpeta `src`. No subas solamente el ZIP ni una carpeta contenedora adicional.
3. En **Settings → Pages → Build and deployment**, elegí **Deploy from a branch**.
4. Elegí la rama **main**, la carpeta **/(root)** y guardá.
5. Cuando GitHub termine el despliegue, la misma pantalla mostrará la URL. Normalmente será `https://TU-USUARIO.github.io/mesa-abierta/`.

No hace falta ejecutar una compilación ni configurar secretos. Las rutas relativas y la navegación con `#` funcionan dentro de una URL de proyecto de GitHub Pages. El archivo `.nojekyll` evita el procesamiento de Jekyll; la web tampoco depende de archivos con prefijo `_`.

Referencia: [Configurar una fuente de publicación en GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## Ejecutar localmente

Entorno: **Node.js 20 o superior** y npm. Lenguajes: HTML, CSS y JavaScript con módulos ES. No hay dependencias de terceros que instalar manualmente.

Desde una terminal abierta en esta carpeta:

```sh
npm install
npm start
```

En Windows, si PowerShell bloquea `npm.ps1`, usá `npm.cmd install` y `npm.cmd start`.

Abrí **http://127.0.0.1:4173**. Para detener el servidor, presioná Ctrl+C. Si el puerto está ocupado, detené la instancia anterior. Evitá abrir `index.html` con doble clic: los módulos ES necesitan un servidor HTTP.

En GitHub Pages solo se sirven archivos estáticos: **no se ejecuta el servidor Node**. El servidor incluido es una comodidad para el desarrollo local.

## Qué se puede probar

- Inicio con estado y período de convocatoria.
- Cuatro charlas con nombre, tema, fecha, horario, duración y sede.
- Búsqueda por nombre, tema o sede; filtros por distrito y por fecha.
- Detalle con nombre y dirección de la sede y mapa interactivo externo de OpenStreetMap, sin API key.
- Inscripción en tres pasos: datos personales, antecedentes e interés opcional, revisión y envío.
- Validaciones, mensajes accesibles y detección de DNI repetido en la convocatoria local.
- Comprobante descargable en texto y recuperación de la última solicitud desde el mismo navegador.
- Pantalla **Explorar la demo**, al pie, para revisar registros, cambiar la fecha simulada o restablecer los ejemplos con confirmación.

## Guion rápido para presentar

1. Abrí **Charlas y sedes**, buscá `Recoleta` y entrá a una charla para ver la ubicación.
2. Elegí **Quiero postularme**. Intentá continuar sin completar campos para mostrar las validaciones.
3. Usá datos ficticios. DNI sugerido: `30555666` (el `12345678` ya está en el ejemplo inicial).
4. En antecedentes, marcá afiliación **Sí** para mostrar que se exige el partido. Podés cambiarlo a **No** después. La afiliación no impide postularse.
5. Dejá las charlas sin seleccionar para demostrar que son opcionales. Revisá y enviá.
6. Descargá el comprobante y recargá la página: la solicitud sigue guardada.
7. En **Explorar la demo**, seleccioná el escenario **Cerrada** e intentá inscribirte.
8. Restablecé los ejemplos para repetir la presentación.

## Fechas y persistencia

La convocatoria de ejemplo va del **1/10/2026 a las 00:00 al 30/10/2026 a las 23:59:59.999**, zona UTC−03:00. Coincide con las fechas de la primera y última charla. Se asume que el cierre incluye el día completo de la última charla.

Por defecto la aplicación simula el **6/10/2026** para que la presentación siga funcionando después de octubre. Se anuncia expresamente en la interfaz. En la demo podés elegir fecha real, antes de la apertura o después del cierre. La inscripción verifica el plazo al entrar y nuevamente al enviar; el estado también se actualiza cada 15 segundos y al volver a la pestaña. No hay un proceso servidor ejecutándose cuando se cierra el navegador.

Los datos se guardan bajo la clave `mesa-abierta-v1` de **localStorage**. Persisten al recargar en el mismo origen y navegador. No se comparten con otros visitantes, dispositivos o navegadores; borrar los datos del sitio borra las solicitudes. El comprobante corresponde a la última inscripción creada en ese navegador. La vista de demo permite comprobar todos los registros locales.

No se guardan borradores incompletos al recargar. Si el navegador bloquea o agota el almacenamiento, el envío informa el error y no muestra una confirmación falsa. Si los datos guardados están dañados, la app avisa y vuelve a los ejemplos; el próximo guardado reemplaza ese contenido.

## Alcance y límites

Esta web implementa **la prueba de concepto del TP2**, no la totalidad del sistema del enunciado. La administración de charlas, evaluación de solicitudes, reportes y envío de correo quedan fuera de este alcance. El registro queda pendiente de evaluación y **no envía emails**. No hay autenticación ni inscripción oficial. Usá únicamente datos ficticios.

Las actividades son ficticias y se ubican en sedes reales como referencia. OpenStreetMap requiere internet; siempre se muestra la dirección y un enlace externo si el mapa no carga. Las fuentes tipográficas se solicitan a Google Fonts; si no hay conexión, se usa Arial. El resto de la interfaz y los datos de ejemplo se sirven desde este proyecto.

La integración del mapa utiliza el [formato de inserción de OpenStreetMap](https://wiki.openstreetmap.org/wiki/Export) y mantiene su atribución. Los SVG de marca y urna se incluyen en el código.

## Organización

```text
index.html           Estructura y navegación principal
estilos.css          Diseño adaptable y estados de interacción
marca.svg / urna.svg Identidad e ilustración vectorial
src/datos.js         Convocatoria, distritos, charlas, sedes y ejemplos
src/repositorio.js   Lectura y escritura del almacenamiento local
src/servicios.js     Reglas de inscripción, fechas y validaciones
src/app.js           Vistas, formularios y navegación
tests/               Pruebas automatizadas de las reglas
servidor.mjs         Servidor de desarrollo local
FLUJO-TP2.md         Flujo y trazabilidad para incorporar al informe
MODELO-CONCEPTUAL.md Propuesta de dominio editable en Mermaid
```

## Pruebas

```sh
npm test
```

Incluye nueve pruebas de límites de convocatoria, campos inválidos, afiliación, inscripción sin charlas, duplicados, persistencia, errores de guardado y recuperación. Para comprobaciones visuales: revisar inicio, agenda, mapa y formulario a 390 px y 1440 px; recorrer el guion anterior.

Los documentos Markdown son material de apoyo. El enunciado exige un **PDF de entrega**, que el grupo debe completar con su modelo conceptual y el apartado del flujo, e incorporar la URL real una vez publicado. Este paquete no se presenta como el PDF final de la entrega.
