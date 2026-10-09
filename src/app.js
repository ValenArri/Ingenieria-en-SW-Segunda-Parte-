import { charlas, sedes, distritos, convocatoria } from './datos.js';
import { crearRepositorio } from './repositorio.js';
import { fechaActual, estadoConvocatoria, normalizar, validar, registrarSolicitud } from './servicios.js';

// INICIALIZACIÓN Y ESTADO DE LA INTERFAZ
const almacenamiento = {
  getItem: clave => /* Lee del navegador el valor asociado a la clave. */ window.localStorage.getItem(clave),
  setItem: (clave, valor) => /* Guarda el valor serializado bajo esa clave. */ window.localStorage.setItem(clave, valor),
};
const repositorio = crearRepositorio(almacenamiento);
const contenido = document.querySelector('#contenido');
let borrador = { intereses: [] };
let paso = 1;
let filtros = { busqueda: '', distrito: '', periodo: 'todas' };

// Utilidades compartidas por las vistas.
const escapar = texto =>
  /* Evita interpretar como HTML los valores que vienen de datos o formularios. */
  String(texto ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const fecha = () => /* Pide al servicio la fecha del escenario actual. */ fechaActual(repositorio.leer().escenario);
const formatoFecha = valor => /* Convierte una fecha ISO al formato visible en Argentina. */
  new Date(valor + 'T12:00:00-03:00').toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Argentina/Buenos_Aires',
  });
const sedeDe = charla => /* Resuelve la referencia sedeId contra el catálogo de sedes. */ sedes.find(s => s.id === charla.sedeId);
const normalizarTexto = texto =>
  /* Iguala mayúsculas y acentos para que la búsqueda sea más tolerante. */
  texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const opciones = (valores, elegido, primero) => /* Convierte una lista en opciones y marca el valor seleccionado. */ `<option value="">${primero}</option>${valores.map(v => `<option ${v === elegido ? 'selected' : ''}>${escapar(v)}</option>`).join('')}`;
const resumenPar = (etiqueta, valor) =>
  /* Escapa el valor antes de incluirlo en el resumen de la solicitud. */
  `<div><dt>${etiqueta}</dt><dd>${escapar(valor || '—')}</dd></div>`;

function avisar(texto) {
  // Recibe un mensaje de flujo y lo muestra temporalmente en la región de avisos.
  const avisos = document.querySelector('#avisos');
  avisos.textContent = texto;

  setTimeout(() => {
    avisos.textContent = '';
  }, 6000);
}

// VISTAS: inicio, agenda, detalle de charla e inscripción.
function bandaEstado() {
  // Lee el escenario persistido y combina su fecha con el estado de convocatoria.
  const estado = repositorio.leer();
  return `<div class="banda-estado"><span class="estado ${estadoConvocatoria(fecha()) === 'Inscripción abierta' ? '' : 'inactivo'}"><i></i>${estadoConvocatoria(fecha())}</span><span>1 al 30 de octubre de 2026</span><a href="#demo">${estado.escenario === 'real' ? 'Reloj real' : 'Fecha simulada: ' + fecha().toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })} <span aria-hidden="true">↗</span></a></div>`;
}
function tarjetaCharla(charla) {
  // Completa los datos de la charla con su sede y calcula si ya ocurrió.
  const sede = sedeDe(charla);
  const pasada = new Date(charla.fecha + 'T' + charla.hora + ':00-03:00') < fecha();
  return `<article class="tarjeta-charla"><div class="tarjeta-arriba"><div class="fecha-bloque"><b>${charla.fecha.slice(-2)}</b><span>OCT</span></div><span class="etiqueta">${pasada ? 'Finalizada' : charla.etiqueta}</span></div><p class="sobretexto">${charla.tema}</p><h3><a href="#charla/${charla.id}">${charla.nombre}</a></h3><p class="metadato">◷ ${charla.hora} h <span>·</span> ${charla.duracion}</p><p class="metadato">⌖ ${sede.nombre}<small>${sede.distrito === distritos[0] ? 'Ciudad de Buenos Aires' : 'La Plata · Buenos Aires'}</small></p><a class="enlace-flecha" href="#charla/${charla.id}">Ver charla y ubicación <span aria-hidden="true">↗</span></a></article>`;
}
function inicio() {
  // Reúne el estado, las charlas próximas y la información estática de bienvenida.
  return `${bandaEstado()}<section class="hero"><div class="hero-texto"><h1>POSTULATE</h1><p class="bajada">Sumate como autoridad de mesa.</p><div class="acciones"><a class="boton lima" href="#inscripcion">Quiero postularme</a><a class="enlace-claro" href="#charlas">Conocer las charlas</a></div></div></section>
  <section class="seccion"><div class="titulo-seccion"><h2>Charlas</h2><a class="enlace-flecha" href="#charlas">Ver todas las charlas</a></div><p class="texto-secundario">Charlas abiertas y gratuitas; no necesitás asistir para postularte.</p><div class="grilla-charlas">${charlas.filter(c => new Date(c.fecha + 'T' + c.hora + ':00-03:00') >= fecha()).slice(0, 3).map(tarjetaCharla).join('') || '<p class="vacio">Finalizaron los encuentros de esta convocatoria. Podés consultar toda la agenda.</p>'}</div></section>`;
}
function listaCharlas() {
  // Prepara los filtros con los valores actuales y deja contenedores para los resultados.
  return `${bandaEstado()}<section class="encabezado-pagina"><h1>Charlas</h1></section><section class="seccion sin-superior"><div class="barra-filtros"><label class="buscador">Buscar charla o sede<input id="busqueda" type="search" placeholder="Nombre, tema o sede…" value="${escapar(filtros.busqueda)}"></label><label>Distrito<select id="filtro-distrito">${opciones([...new Set(sedes.map(s => s.distrito))], filtros.distrito, 'Todos los distritos')}</select></label><label>Fecha<select id="filtro-periodo"><option value="todas" ${filtros.periodo === 'todas' ? 'selected' : ''}>Todas las charlas</option><option value="proximas" ${filtros.periodo === 'proximas' ? 'selected' : ''}>Próximas charlas</option><option value="pasadas" ${filtros.periodo === 'pasadas' ? 'selected' : ''}>Charlas finalizadas</option></select></label></div><p id="cantidad" class="texto-secundario" role="status"></p><div id="lista-charlas" class="grilla-charlas"></div></section>`;
}
function actualizarCharlas() {
  // Normaliza la búsqueda y aplica en conjunto texto, distrito y estado temporal.
  const consulta = normalizarTexto(filtros.busqueda);
  const resultado = charlas.filter(c => {
    const sede = sedeDe(c);
    const pasada = new Date(c.fecha + 'T' + c.hora + ':00-03:00') < fecha();
    const textoCharla = normalizarTexto(
      `${c.nombre} ${c.tema} ${sede.nombre} ${sede.direccion}`,
    );
    const coincideDistrito = !filtros.distrito || sede.distrito === filtros.distrito;
    const coincideBusqueda = textoCharla.includes(consulta);
    const coincidePeriodo =
      filtros.periodo === 'todas' ||
      (filtros.periodo === 'pasadas' ? pasada : !pasada);

    return coincideDistrito && coincideBusqueda && coincidePeriodo;
  });

  document.querySelector('#cantidad').textContent = `${resultado.length} ${resultado.length === 1 ? 'charla encontrada' : 'charlas encontradas'}`;
  document.querySelector('#lista-charlas').innerHTML = resultado.map(tarjetaCharla).join('') || '<div class="vacio"><h3>No encontramos charlas con esos filtros.</h3><p>Probá con otro nombre o distrito.</p><button class="boton borde" id="limpiar-filtros">Limpiar filtros</button></div>';

  document.querySelector('#limpiar-filtros')?.addEventListener('click', () => {
    filtros = { busqueda: '', distrito: '', periodo: 'todas' };
    renderizar(false);
  });
}
function detalleCharla(id) {
  // Resuelve el identificador de ruta a charla y sede; si no existe, usa la vista de error.
  const charla = charlas.find(c => c.id === id);
  if (!charla) return noEncontrado();
  const sede = sedeDe(charla);
  const limites = [sede.longitud - .009, sede.latitud - .006, sede.longitud + .009, sede.latitud + .006].join(',');
  const enlaceMapa = `https://www.openstreetmap.org/?mlat=${sede.latitud}&mlon=${sede.longitud}#map=16/${sede.latitud}/${sede.longitud}`;
  return `<section class="seccion"><a class="volver" href="#charlas">← Todas las charlas</a><div class="detalle-grilla"><article><p class="sobretexto">${charla.etiqueta} · ENCUENTRO PRESENCIAL</p><h1>Ubicación de la charla</h1><p class="bajada">${charla.descripcion}</p><div class="ficha"><div><span>FECHA Y HORARIO</span><strong>${formatoFecha(charla.fecha)} · ${charla.hora} h</strong><p>Duración estimada: ${charla.duracion}</p></div><div><span>TEMA DEL ENCUENTRO</span><strong>${charla.tema}</strong></div><div><span>SEDE</span><strong>${sede.nombre}</strong><p>${sede.direccion}<br>${sede.distrito}</p></div></div><div class="aviso verde">Entrada libre y gratuita. No se requiere inscripción ni asistencia para postularte.</div><a href="#inscripcion" class="boton oscuro">Quiero postularme <span aria-hidden="true">↗</span></a></article><aside class="mapa-tarjeta"><div class="mapa-titulo"><span class="icono-cuadro">⌖</span><div><h2>Encontrá la sede</h2><p>${sede.nombre}</p></div></div><iframe title="Mapa de ${sede.nombre}" src="https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(limites)}&layer=mapnik&marker=${sede.latitud}%2C${sede.longitud}" referrerpolicy="no-referrer" loading="eager"></iframe><div class="mapa-pie"><p>${sede.direccion}</p><a class="enlace-flecha" href="${enlaceMapa}" target="_blank" rel="noopener noreferrer">Abrir en OpenStreetMap ↗</a></div></aside></div></section>`;
}

// Construcción de campos reutilizables y resumen de confirmación.
function campo(nombre, etiqueta, tipo = 'text', extra = '') {
  // Vincula el valor del borrador con el control y su espacio de error accesible.
  return `<label>${etiqueta} <span class="requerido">*</span><input name="${nombre}" id="${nombre}" type="${tipo}" value="${escapar(borrador[nombre])}" ${extra} aria-describedby="error-${nombre}"><small class="error-campo" id="error-${nombre}"></small></label>`;
}
function pregunta(nombre, titulo, ayuda = '') {
  // Presenta una respuesta binaria y refleja la selección que ya está en el borrador.
  return `<fieldset class="pregunta"><legend>${titulo} <span class="requerido">*</span></legend>${ayuda ? `<p>${ayuda}</p>` : ''}<div class="opciones-radio">${['si', 'no'].map(v => `<label><input type="radio" name="${nombre}" value="${v}" ${borrador[nombre] === v ? 'checked' : ''} aria-describedby="error-${nombre}">${v === 'si' ? 'Sí' : 'No'}</label>`).join('')}</div><small class="error-campo" id="error-${nombre}"></small></fieldset>`;
}
function resumen(datos) {
  // Convierte los datos reunidos en el formulario en filas legibles para revisión.
  return `<dl class="resumen">${resumenPar('Nombre y apellido', `${datos.nombre} ${datos.apellido}`)}${resumenPar('DNI', datos.dni)}${resumenPar('Fecha de nacimiento', datos.nacimiento)}${resumenPar('Distrito electoral', datos.distrito)}${resumenPar('Dirección', datos.direccion)}${resumenPar('Teléfono', datos.telefono)}${resumenPar('Correo electrónico', datos.correo)}${resumenPar('Fue autoridad de mesa', datos.experiencia === 'si' ? 'Sí' : 'No')}${resumenPar('Cumplió la capacitación', datos.capacitacion === 'si' ? 'Sí' : 'No')}${resumenPar('Afiliación política', datos.afiliacion === 'si' ? datos.partido : 'Sin afiliación')}${resumenPar('Interés en charlas (opcional)', datos.intereses.map(id => charlas.find(c => c.id === id)?.nombre).filter(Boolean).join(' · ') || 'Sin interés indicado')}</dl>`;
}
function inscripcion() {
  // Primero bloquea el alta fuera de plazo; abierta la convocatoria, muestra el paso actual.
  if (estadoConvocatoria(fecha()) !== 'Inscripción abierta') return `${bandaEstado()}<section class="seccion"><div class="panel-centrado"><span class="icono-cuadro">◷</span><h1>${estadoConvocatoria(fecha())}</h1><p>El período de inscripción va del 1 al 30 de octubre de 2026, inclusive (hora de Argentina).</p><p>Podés seguir consultando las charlas y sus sedes.</p><a class="boton oscuro" href="#charlas">Consultar charlas →</a><a class="volver" href="#demo">Cambiar escenario de demostración</a></div></section>`;
  return `${bandaEstado()}<section class="seccion inscripcion-grilla"><div class="panel formulario-panel"><p class="sobretexto">PASO ${paso} DE 3</p><h2>${['Completa el formulario de postulacion', 'Contanos un poco más.', 'Todo listo para revisar.'][paso - 1]}</h2><p class="texto-secundario">${paso === 3 ? 'Revisá la información antes de registrar tu solicitud.' : 'Los campos con * son obligatorios.'}</p><form id="formulario" novalidate><div id="error-formulario" role="alert" class="error-general" tabindex="-1"></div>${paso === 1 ? `<div class="campos">${campo('nombre', 'Nombre', 'text', 'autocomplete="given-name" maxlength="120"')}${campo('apellido', 'Apellido', 'text', 'autocomplete="family-name" maxlength="120"')}${campo('dni', 'DNI', 'text', 'inputmode="numeric" maxlength="12" placeholder="Ej. 30555666"')}${campo('nacimiento', 'Fecha de nacimiento', 'date', 'min="1900-01-01" max="' + fecha().toISOString().slice(0, 10) + '"')}<label class="ancho">Distrito electoral <span class="requerido">*</span><select name="distrito" id="distrito" aria-describedby="error-distrito">${opciones(distritos, borrador.distrito, 'Seleccioná tu distrito')}</select><small class="error-campo" id="error-distrito"></small></label><div class="ancho">${campo('direccion', 'Dirección actual', 'text', 'autocomplete="street-address" maxlength="120" placeholder="Calle, número, localidad y provincia"')}</div>${campo('telefono', 'Teléfono', 'tel', 'autocomplete="tel" maxlength="24" placeholder="Ej. 11 5555 1234"')}${campo('correo', 'Correo electrónico', 'email', 'autocomplete="email" maxlength="180" placeholder="nombre@ejemplo.com"')}</div>` : paso === 2 ? `${pregunta('experiencia', '¿Ya fuiste autoridad de mesa?')}${pregunta('capacitacion', '¿Cumpliste la capacitación?')}${pregunta('afiliacion', '¿Estás afiliado/a a una agrupación política?')}<div id="campo-partido" ${borrador.afiliacion === 'si' ? '' : 'hidden'}>${campo('partido', 'Partido o agrupación', 'text', 'maxlength="120"')}</div><fieldset class="intereses"><legend>¿Te interesa alguna charla?</legend><p>Opcional. Indicar interés no reserva un lugar ni es requisito para postularte.</p>${charlas.map(c => `<label class="opcion-charla"><input type="checkbox" name="intereses" value="${c.id}" ${borrador.intereses.includes(c.id) ? 'checked' : ''}><span><b>${c.nombre}</b><small>${formatoFecha(c.fecha)} · ${c.hora} h · ${sedeDe(c).nombre}</small></span></label>`).join('')}<small class="error-campo" id="error-intereses"></small></fieldset>` : `${resumen(borrador)}<button type="button" class="enlace-boton" id="editar-datos">Editar mis datos</button><div class="aviso verde">Al enviar se registra una postulación pendiente de evaluación. No implica una designación como autoridad de mesa.</div>`}<div class="acciones-formulario">${paso > 1 ? '<button type="button" class="boton borde" id="anterior">← Volver</button>' : ''}<button type="submit" class="boton oscuro">${paso === 3 ? 'Enviar postulación' : 'Continuar'} <span aria-hidden="true">→</span></button></div></form></div></section>`;
}

// VISTAS: comprobante de solicitud y herramientas de demostración.
function miSolicitud() {
  // Busca por ultimaId en el estado local y construye el comprobante correspondiente.
  const estado = repositorio.leer();
  const solicitud = estado.solicitudes.find(s => s.id === estado.ultimaId);
  if (!solicitud) return `<section class="seccion"><div class="panel-centrado"><h1>Mi solicitud</h1><p>Todavía no registraste una postulación en este navegador.</p><a class="boton oscuro" href="#inscripcion">Quiero postularme</a></div></section>`;
  return `<section class="seccion"><div class="comprobante panel"><h1>Postulación registrada</h1><div class="codigo"><span>NÚMERO DE COMPROBANTE</span><b>${escapar(solicitud.id)}</b><span class="etiqueta">${escapar(solicitud.estado)}</span></div>${resumen(solicitud)}<div class="aviso">Este comprobante pertenece a una prueba de concepto. No se enviaron correos ni se realizó una inscripción oficial.</div><div class="acciones"><a class="boton borde" href="#charlas">Explorar charlas</a></div></div></section>`;
}
function demo() {
  // Toma el estado persistido para mostrar el escenario y los registros de prueba.
  const estado = repositorio.leer();
  return `<section class="seccion">
    <div class="demo-grilla">
      <section class="panel">
        <h2>Rango de inscripción</h2>
        <label>Escenario de convocatoria
          <select id="escenario">
            ${[
              ['abierta', 'Abierta · 6 de octubre de 2026'],
              ['futura', 'Todavía no abrió · 28 de septiembre de 2026'],
              ['cerrada', 'Cerrada · 31 de octubre de 2026'],
              ['real', 'Usar fecha y hora reales'],
            ].map(([id, nombre]) => `<option value="${id}" ${estado.escenario === id ? 'selected' : ''}>${nombre}</option>`).join('')}
          </select>
        </label>
        <div class="aviso verde">Estado actual: <b>${estadoConvocatoria(fecha())}</b></div>
        <a class="boton oscuro" href="#inscripcion">Probar inscripción</a>
      </section>
      <section class="panel">
        <h2>Datos de ejemplo</h2>
        <button id="reiniciar" class="boton borde">Restablecer datos de ejemplo</button>
        <div id="confirmar-reinicio" hidden class="aviso">
          <p>¿Borrar las postulaciones locales y volver al estado inicial?</p>
          <button id="confirmar-borrado" class="boton oscuro pequeno">Sí, restablecer</button>
          <button id="cancelar-borrado" class="boton borde pequeno">Cancelar</button>
        </div>
      </section>
    </div>
    <section class="panel registros">
      <div class="titulo-seccion">
        <h2>Postulaciones locales</h2>
        <span class="etiqueta">${estado.solicitudes.length} registros</span>
      </div>
      <div class="tabla-contenedor">
        <table>
          <thead><tr><th>Postulante</th><th>DNI</th><th>Distrito</th><th>Estado</th></tr></thead>
          <tbody>${estado.solicitudes.map(s => `<tr><td><b>${escapar(s.nombre)} ${escapar(s.apellido)}</b><small>${s.ejemplo ? 'Dato de ejemplo' : escapar(s.id)}</small></td><td>${escapar(s.dni)}</td><td>${escapar(s.distrito)}</td><td><span class="etiqueta">${escapar(s.estado)}</span></td></tr>`).join('')}</tbody>
        </table>
      </div>
    </section>
  </section>`;
}
function noEncontrado() { /* Ruta desconocida: responde con una salida segura hacia el inicio. */ return '<section class="seccion"><div class="panel-centrado"><h1>No encontramos esa página.</h1><a class="boton oscuro" href="#inicio">Volver al inicio</a></div></section>'; }

// FORMULARIO: captura, validación paso a paso y envío al servicio de dominio.
function capturarFormulario() {
  // Lee el paso visible, combina sus valores con el borrador y normaliza el resultado.
  const formulario = document.querySelector('#formulario');
  if (!formulario || paso === 3) return;
  const datos = new FormData(formulario);
  borrador = { ...borrador, ...Object.fromEntries(datos) };
  if (paso === 2) borrador.intereses = datos.getAll('intereses');
  borrador = normalizar(borrador);
}
function conectarFormulario() {
  // Enlaza eventos solo si la ruta actual contiene el formulario.
  const formulario = document.querySelector('#formulario');
  if (!formulario) return;
  // La entrada mantiene el borrador al día y el cambio actualiza campos condicionales.
  formulario.addEventListener('input', capturarFormulario);
  formulario.addEventListener('change', () => {
    capturarFormulario();
    if (paso === 2) document.querySelector('#campo-partido').hidden = borrador.afiliacion !== 'si';
  });
  document.querySelector('#anterior')?.addEventListener('click', () => { capturarFormulario(); paso--; renderizar(); });
  document.querySelector('#editar-datos')?.addEventListener('click', () => { paso = 1; renderizar(); });
  formulario.addEventListener('submit', evento => {
    // Valida el paso actual; si hay errores los muestra, si no avanza o registra.
    evento.preventDefault(); capturarFormulario();
    const errores = validar(borrador, fecha(), paso === 3 ? null : paso);
    formulario.querySelectorAll('.error-campo').forEach(e => e.textContent = '');
    formulario.querySelectorAll('[aria-invalid]').forEach(e => e.removeAttribute('aria-invalid'));
    const mensaje = document.querySelector('#error-formulario');
    mensaje.textContent = '';
    if (Object.keys(errores).length) {
      for (const [clave, texto] of Object.entries(errores)) {
        const destino = document.getElementById('error-' + clave);
        if (destino) destino.textContent = texto;
        formulario.querySelectorAll(`[name="${clave}"]`).forEach(e => e.setAttribute('aria-invalid', 'true'));
      }
      mensaje.textContent = 'Revisá los campos señalados para continuar.';
      (formulario.querySelector('[aria-invalid]') || mensaje).focus(); return;
    }
    // Al llegar al paso 3 se validan todos los datos antes de registrar.
    if (paso < 3) { paso++; renderizar(); return; }
    const boton = formulario.querySelector('[type="submit"]');
    boton.disabled = true;
    try {
      registrarSolicitud(borrador, repositorio, fecha());
      borrador = { intereses: [] }; paso = 1;
      location.hash = '#mi-solicitud';
      avisar('Tu postulación se registró correctamente.');
    } catch (error) { mensaje.textContent = error.message; mensaje.focus(); boton.disabled = false; }
  });
}

// ENRUTADOR: resuelve el hash, pinta la vista y conecta sus controles.
function renderizar(enfocar = true) {
  // Separa ruta e identificador desde el hash para resolver la vista solicitada.
  const [ruta, id] = location.hash.slice(1).split('/');
  const actual = ruta || 'inicio';
  document.querySelectorAll('[data-nav]').forEach(e => { if (e.dataset.nav === actual || (actual === 'charla' && e.dataset.nav === 'charlas')) e.setAttribute('aria-current', 'page'); else e.removeAttribute('aria-current'); });
  const vistas = {
    inicio,
    charlas: listaCharlas,
    charla: () => detalleCharla(id),
    inscripcion,
    'mi-solicitud': miSolicitud,
    demo,
  };
  // Renderiza la función de vista y sincroniza el título del documento.
  contenido.innerHTML = (vistas[actual] || noEncontrado)();
    document.title = `${({ inicio: 'Postulate', charlas: 'Charlas y sedes', charla: 'Ubicación de la charla', inscripcion: 'Postulate', 'mi-solicitud': 'Mi solicitud', demo: 'Explorar la demo' })[actual] || 'Página no encontrada'} · Mesa Abierta`;
  if (actual === 'charlas') {
    // Los controles actualizan filtros y vuelven a calcular la lista sin cambiar de ruta.
    actualizarCharlas();
    for (const [selector, clave, evento] of [['#busqueda', 'busqueda', 'input'], ['#filtro-distrito', 'distrito', 'change'], ['#filtro-periodo', 'periodo', 'change']]) document.querySelector(selector).addEventListener(evento, e => { filtros[clave] = e.target.value; actualizarCharlas(); });
  }
  conectarFormulario();
  document.querySelector('#escenario')?.addEventListener('change', e => {
    // Persiste el escenario elegido y vuelve a renderizar con la fecha correspondiente.
    try { repositorio.guardar({ ...repositorio.leer(), escenario: e.target.value }); renderizar(false); avisar('Escenario actualizado.'); }
    catch (error) { avisar(error.message); renderizar(false); }
  });
  document.querySelector('#reiniciar')?.addEventListener('click', () => { document.querySelector('#confirmar-reinicio').hidden = false; document.querySelector('#cancelar-borrado').focus(); });
  document.querySelector('#cancelar-borrado')?.addEventListener('click', () => { document.querySelector('#confirmar-reinicio').hidden = true; document.querySelector('#reiniciar').focus(); });
  document.querySelector('#confirmar-borrado')?.addEventListener('click', () => {
    // El reinicio vuelve a ejemplos y limpia el estado temporal del formulario.
    try { repositorio.reiniciar(); borrador = { intereses: [] }; paso = 1; renderizar(false); avisar('Datos de ejemplo restablecidos.'); }
    catch (error) { avisar(error.message); }
  });
  if (enfocar) { contenido.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'instant' }); }
}

// ACTUALIZACIÓN DEL PLAZO: refresca la vista al cambiar el escenario temporal.
window.addEventListener('hashchange', () => renderizar());
// Revalidar al recuperar la pestaña y durante su uso evita mantener abierto un formulario vencido.
let estadoAnterior = estadoConvocatoria(fecha());
function revisarPlazo() {
  // Recalcula la convocatoria y refresca la pantalla solo si cambió su estado.
  const estado = estadoConvocatoria(fecha());
  if (estado !== estadoAnterior) { estadoAnterior = estado; renderizar(false); }
}
setInterval(revisarPlazo, 15000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) revisarPlazo(); });
renderizar(false);
if (repositorio.advertencia()) avisar(repositorio.advertencia());
