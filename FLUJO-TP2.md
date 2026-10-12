# Flujo del prototipo · Mesa Abierta

Material para incorporar al apartado de prueba de concepto del PDF de la segunda entrega.

## Alcance

El prototipo implementa los casos de uso relacionados con la inscripción del ciudadano como postulante y la consulta de charlas, incluyendo la interacción con un servicio externo de información geográfica. Se ejecuta en el navegador y puede desplegarse en GitHub Pages sin credenciales de servicios.

## Vistas y trazabilidad

Los nombres de casos de uso de esta tabla corresponden al **diagrama general de la página 10 de G04-PrimeraEntregaTP (2).pdf**. No se les asignan los identificadores CU-01 a CU-04, pues en la primera entrega esos identificadores corresponden a casos posteriores al cierre.

| Vista | Funcionalidad ofrecida | Caso de uso / requerimientos |
| --- | --- | --- |
| Inicio | Presenta el período y estado de convocatoria, guía de pasos y accesos a las charlas y al registro. | Acceso a «Consultar Charlas» y «Registrarse como postulante»; contexto RFE-02. |
| Charlas y sedes | Muestra actividades precargadas; permite buscar y filtrar. Cada actividad informa tema, fecha, horario y sede. La asistencia es libre. | «Consultar Charlas»; utiliza la información definida por RFE-01. No implementa «Cargar Charla». |
| Detalle de charla | Muestra nombre y dirección de sede y un mapa externo con marcador. Permite abrir la ubicación en OpenStreetMap. | «Mostrar Ubicacion»; RFD-11. Aunque fue clasificado como deseable en TP1, la interacción geográfica es obligatoria en la prueba de concepto de TP2. |
| Inscripción, paso 1 | Solicita nombre, apellido, DNI, nacimiento, dirección actual, teléfono, correo y distrito electoral. Valida campos esenciales. | «Registrarse como postulante»; RFE-03. |
| Inscripción, paso 2 | Registra experiencia, capacitación y afiliación, con partido obligatorio cuando corresponde. Permite indicar interés opcional en charlas. | «Registrarse como postulante»; RFE-04 y RFD-05. |
| Inscripción, paso 3 | Permite revisar y volver a editar. Verifica plazo y que no exista otra inscripción del mismo DNI en la convocatoria actual antes de persistirla. | «Registrarse como postulante»; RFE-03 y restricción de registro de RFE-06. |
| Mi solicitud | Confirma el guardado local y permite consultar los datos enviados y el número de comprobante, sin revelar el estado de evaluación. Conserva los datos al recargar. | Resultado de «Registrarse como postulante»; RNFE-02 en el alcance local de la demo. |
| Explorar la demo | Cambia la convocatoria y el reloj de demostración; muestra las tres inscripciones de ejemplo y las inscripciones locales del período. Los datos de ejemplo respetan las entidades Ciudadano, Postulación e Inscripción y conservan una postulación distinta por convocatoria, aun cuando corresponda al mismo ciudadano. Permite verificar y borrar los registros locales. La revisión y resolución simuladas se habilitan únicamente al cierre de la convocatoria seleccionada. | Herramienta auxiliar de exposición; no equivale al módulo administrativo completo de «Consultar Informacion Postulante». |

## Recorrido principal

El ciudadano consulta las charlas y abre una para observar los datos de la sede y su ubicación en OpenStreetMap. Luego inicia su postulación y completa los datos personales. Informa sus antecedentes e indica, si lo desea, interés en alguna charla. Puede avanzar sin seleccionar ninguna. En la revisión final confirma la solicitud; el sistema valida la información y el plazo de inscripción, guarda la postulación y muestra un comprobante con su número y los datos enviados. El estado de evaluación no se muestra en «Mi solicitud».

La consulta de charlas también está disponible fuera del período de inscripción. La inscripción queda bloqueada antes de la apertura y después del cierre. Ninguna pantalla exige asistir ni inscribirse a una charla.

## Decisiones y supuestos

- **Persistencia:** localStorage permite demostrar el flujo completo sin servidores, claves ni cuentas. Es adecuada para una prueba individual en GitHub Pages. Su alcance es el origen y navegador utilizado; no es una base compartida ni un repositorio seguro para datos reales.
- **Separación de responsabilidades:** presentación en `app.js`, reglas en `servicios.js`, persistencia en `repositorio.js` y catálogo inicial en `datos.js`.
- **Servicio externo:** OpenStreetMap muestra la ubicación mediante un mapa embebido por coordenadas y un marcador por sede, sin claves. Se conserva la atribución; requiere conectividad. El nombre, la dirección y el enlace están disponibles aunque no cargue.
- **Reloj de exposición:** se usa inicialmente una fecha simulada dentro del período. La interfaz informa el modo y permite cambiarlo al día previo a la apertura o al día posterior al cierre.
- **Cierre:** se adopta el final del día de la última charla como fecha límite. La validación ocurre tanto al abrir como al confirmar el formulario. No se implementan tareas en segundo plano ni reportes posteriores al cierre.
- **DNI:** se asume una sola inscripción por DNI y convocatoria dentro del almacenamiento local. La persona puede volver a postularse en otro período. No se consulta un padrón ni se verifica identidad.
- **Elegibilidad:** se requiere fecha de nacimiento válida y una edad mínima de 16 años al momento de postularse. No se exige experiencia, capacitación ni afiliación. El límite técnico inferior del selector es 1900.
- **Datos:** fechas, actividades y postulaciones de ejemplo son ficticias. Hay tres ejemplos por convocatoria para 2026, 2027 y 2028, almacenados por separado como ciudadanos, postulaciones e inscripciones. La demo también muestra los registros enviados en el navegador. Las sedes se utilizan como referencias reales, sin afirmar que haya actividades allí.

## Fuera de alcance de esta implementación

Los casos CU-01 a CU-04 detallados en la primera entrega (reporte de postulantes, consulta administrativa, evaluación y reporte final) no forman parte de la prueba de concepto solicitada en TP2. Tampoco se implementa envío de notificaciones por correo. El guardado no implica aprobación ni designación.

## Entrega

Una vez publicado, incorporar en el PDF la URL efectiva de GitHub Pages y este recorrido adaptado al formato del grupo. Si no se publica, entregar el ZIP con README. Este archivo es material editable, no reemplaza el PDF obligatorio ni la revisión del modelo conceptual por el grupo.
