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
| Inscripción, paso 3 | Permite revisar y volver a editar. Verifica plazo y duplicación de DNI antes de persistir el registro. | «Registrarse como postulante»; RFE-03 y restricción de registro de RFE-06. |
| Mi solicitud | Confirma el guardado local, muestra el estado pendiente y permite descargar un comprobante. Conserva los datos al recargar. | Resultado de «Registrarse como postulante»; RNFE-02 en el alcance local de la demo. |
| Explorar la demo | Cambia el reloj de demostración, permite verificar registros locales y reiniciar los datos. | Herramienta auxiliar de exposición. No equivale a «Consultar Informacion Postulante» del administrador ni a una evaluación. |

## Recorrido principal

El ciudadano consulta las charlas y abre una para observar los datos de la sede y su ubicación en OpenStreetMap. Luego inicia su postulación y completa los datos personales. Informa sus antecedentes e indica, si lo desea, interés en alguna charla. Puede avanzar sin seleccionar ninguna. En la revisión final confirma la solicitud; el sistema valida la información y el plazo de inscripción, guarda la solicitud y muestra un comprobante con estado «Pendiente de evaluación».

La consulta de charlas también está disponible fuera del período de inscripción. La inscripción queda bloqueada antes de la apertura y después del cierre. Ninguna pantalla exige asistir ni inscribirse a una charla.

## Decisiones y supuestos

- **Persistencia:** localStorage permite demostrar el flujo completo sin servidores, claves ni cuentas. Es adecuada para una prueba individual en GitHub Pages. Su alcance es el origen y navegador utilizado; no es una base compartida ni un repositorio seguro para datos reales.
- **Separación de responsabilidades:** presentación en `app.js`, reglas en `servicios.js`, persistencia en `repositorio.js` y catálogo inicial en `datos.js`.
- **Servicio externo:** OpenStreetMap muestra la ubicación mediante un mapa embebido por coordenadas y un marcador por sede, sin claves. Se conserva la atribución; requiere conectividad. El nombre, la dirección y el enlace están disponibles aunque no cargue.
- **Reloj de exposición:** se usa inicialmente una fecha simulada dentro del período. La interfaz informa el modo y permite cambiarlo a fecha real, previa o posterior.
- **Cierre:** se adopta el final del día de la última charla como fecha límite. La validación ocurre tanto al abrir como al confirmar el formulario. No se implementan tareas en segundo plano ni reportes posteriores al cierre.
- **DNI:** se asume una sola postulación por DNI y convocatoria dentro del almacenamiento local. No se consulta un padrón ni se verifica identidad.
- **Elegibilidad:** no se inventan restricciones de edad, experiencia, capacitación o afiliación ausentes del enunciado. Se valida que la fecha de nacimiento sea real y no futura; el límite técnico inferior del selector es 1900.
- **Datos:** fechas, actividades y postulante inicial son ficticios. Las sedes se utilizan como referencias reales, sin afirmar que haya actividades allí.

## Fuera de alcance de esta implementación

Los casos CU-01 a CU-04 detallados en la primera entrega (reporte de postulantes, consulta administrativa, evaluación y reporte final) no forman parte de la prueba de concepto solicitada en TP2. Tampoco se implementa envío de notificaciones por correo. El guardado no implica aprobación ni designación.

## Entrega

Una vez publicado, incorporar en el PDF la URL efectiva de GitHub Pages y este recorrido adaptado al formato del grupo. Si no se publica, entregar el ZIP con README. Este archivo es material editable, no reemplaza el PDF obligatorio ni la revisión del modelo conceptual por el grupo.
