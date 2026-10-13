// La agenda mantiene una sola selección, compartida por lista, marcadores y popup.
export function ubicacionValida(sede) {
  return Number.isFinite(sede?.latitud) && Math.abs(sede.latitud) <= 90
    && Number.isFinite(sede?.longitud) && Math.abs(sede.longitud) <= 180;
}

export function crearAgenda({ contenedor, sedeDe, formatoFecha, escapar, numeroDe }) {
  const lista = contenedor.querySelector('#lista-charlas');
  const superficie = contenedor.querySelector('#mapa-charlas');
  const aviso = contenedor.querySelector('#aviso-mapa');
  const seleccion = contenedor.querySelector('#seleccion-charla');
  const verTodas = contenedor.querySelector('#ver-todas-sedes');
  const L = window.L;
  let resultados = [];
  let seleccionId = null;
  let mapa = null;
  const marcadores = new Map();
  let observador;
  let conexiones;
  let temporizador;
  let destruida = false;

  function mostrarAviso(texto) { aviso.textContent = texto; aviso.hidden = !texto; }
  if (L) {
    mapa = L.map(superficie, { zoomControl: false, scrollWheelZoom: true, fadeAnimation: false }).setView([-34.7, -58.2], 10);
    conexiones = L.layerGroup().addTo(mapa);
    mapa.on('zoomend', recolocarMarcadores);
    L.control.zoom({ position: 'bottomright', zoomInTitle: 'Acercar', zoomOutTitle: 'Alejar' }).addTo(mapa);
    const capa = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
    }).addTo(mapa);
    const cargadas = new Set();
    function revisarCarga() {
      if (destruida) return;
      const visibles = [...superficie.querySelectorAll('.leaflet-tile')];
      mostrarAviso(visibles.some(imagen => !cargadas.has(imagen))
        ? 'No se pudo cargar parte del mapa. Revisá tu conexión; podés seguir consultando las charlas.' : '');
    }
    capa.on('tileload', e => cargadas.add(e.tile));
    capa.on('tileunload', e => cargadas.delete(e.tile));
    capa.on('loading', () => { clearTimeout(temporizador); temporizador = setTimeout(revisarCarga, 10000); });
    capa.on('load', () => { clearTimeout(temporizador); revisarCarga(); });
    // El tamaño del panel cambia al pasar de dos columnas a la vista móvil.
    observador = new ResizeObserver(() => {
      mapa.invalidateSize({ pan: false });
      for (const registro of marcadores.values()) {
        Object.assign(registro.marcador.getPopup().options, medidasPopup());
        if (registro.marcador.isPopupOpen()) registro.marcador.getPopup().update();
      }
    });
    observador.observe(superficie);
  } else {
    mostrarAviso('No se pudo iniciar el mapa. Recargá la página. Las charlas siguen disponibles en el listado.');
  }

  function icono(charla, activa, desplazamiento) {
    return L.divIcon({
      className: `marcador-charla${activa ? ' seleccionado' : ''}`,
      html: `<span>${numeroDe(charla)}</span>`,
      iconSize: [34, 38], iconAnchor: [17 - desplazamiento.x, 38 - desplazamiento.y], popupAnchor: [desplazamiento.x, desplazamiento.y - 42],
    });
  }

  function medidasPopup() {
    return { maxWidth: Math.min(260, superficie.clientWidth - 65), minWidth: Math.min(190, superficie.clientWidth - 65), maxHeight: Math.max(120, superficie.clientHeight - 110), autoPanPadding: [15, 15] };
  }

  function contenidoPopup(charla) {
    const sede = sedeDe(charla);
    const caja = document.createElement('div');
    caja.className = 'popup-charla';
    caja.innerHTML = `<p class="sobretexto">CHARLA ${numeroDe(charla)}</p><h3>${escapar(charla.nombre)}</h3><p><b>${escapar(sede.nombre)}</b><br>${escapar(sede.direccion)}</p><p>${escapar(formatoFecha(charla.fecha))} · ${escapar(charla.hora)} h</p><a href="#charla/${encodeURIComponent(charla.id)}">Ver detalle de la charla →</a>`;
    return caja;
  }

  function recolocarMarcadores() {
    if (!mapa || !conexiones) return;
    conexiones.clearLayers();
    const registros = [...marcadores.values()];
    const puntos = registros.map(r => mapa.latLngToLayerPoint(r.marcador.getLatLng()));
    const posiciones = distribuirMarcadores(puntos);
    registros.forEach((registro, indice) => {
      const punto = puntos[indice];
      const posicion = posiciones[indice];
      registro.desplazamiento = { x: posicion.x - punto.x, y: posicion.y - punto.y };
      if (registro.desplazamiento.x || registro.desplazamiento.y) {
        L.polyline([registro.marcador.getLatLng(), mapa.layerPointToLatLng([posicion.x, posicion.y])],
          { color: '#555', weight: 1, interactive: false }).addTo(conexiones);
      }
    });
    pintarSeleccion();
  }

  function pintarSeleccion() {
    for (const boton of lista.querySelectorAll('[data-charla]')) {
      const activa = boton.dataset.charla === seleccionId;
      boton.setAttribute('aria-pressed', String(activa));
      boton.closest('.resultado-charla').classList.toggle('seleccionada', activa);
    }
    for (const [id, registro] of marcadores) {
      const activa = id === seleccionId;
      registro.marcador.setIcon(icono(registro.charla, activa, registro.desplazamiento));
      registro.marcador.setZIndexOffset(activa ? 1000 : 0);
      const elemento = registro.marcador.getElement();
      elemento.setAttribute('aria-pressed', String(activa));
      elemento.dataset.marcadorCharla = id;
    }
    const charla = resultados.find(c => c.id === seleccionId);
    seleccion.textContent = charla ? `Seleccionada: ${charla.nombre}${ubicacionValida(sedeDe(charla)) ? '' : '. Ubicación no disponible.'}` : 'Seleccioná una charla en el listado o en el mapa.';
  }

  function seleccionar(id, desdeMapa = false) {
    const charla = resultados.find(c => c.id === id);
    if (!charla) return;
    seleccionId = id;
    pintarSeleccion();
    const registro = marcadores.get(id);
    if (registro) {
      mapa.setView(registro.marcador.getLatLng(), Math.max(15, mapa.getZoom()), { animate: false });
      registro.marcador.openPopup();
    } else { mapa?.closePopup(); }
    if (desdeMapa) {
      const boton = [...lista.querySelectorAll('[data-charla]')].find(e => e.dataset.charla === id);
      const tarjeta = boton.closest('.resultado-charla');
      const marco = lista.getBoundingClientRect();
      const limites = tarjeta.getBoundingClientRect();
      if (limites.top < marco.top || limites.bottom > marco.bottom) {
        lista.scrollTop += limites.top - marco.top - (lista.clientHeight - tarjeta.offsetHeight) / 2;
      }
    }
  }

  function encuadrar() {
    if (!mapa) return;
    const puntos = [...marcadores.values()].map(r => r.marcador.getLatLng());
    if (puntos.length) mapa.fitBounds(L.latLngBounds(puntos), { padding: [65, 65], maxZoom: 15, animate: false });
    else mapa.setView([-34.7, -58.2], 10);
  }

  function actualizar(charlas) {
    resultados = charlas;
    if (!resultados.some(c => c.id === seleccionId)) seleccionId = null;
    lista.innerHTML = resultados.map(charla => {
      const sede = sedeDe(charla);
      return `<article class="resultado-charla"><button class="seleccionar-charla" type="button" data-charla="${escapar(charla.id)}" aria-pressed="false"><span class="numero-charla">${numeroDe(charla)}</span><span class="datos-charla"><span class="tema-charla">${escapar(charla.tema)}</span><strong>${escapar(charla.nombre)}</strong><span>${escapar(formatoFecha(charla.fecha))} · ${escapar(charla.hora)} h</span><span>${escapar(sede?.nombre || 'Sede a confirmar')}</span><small>${escapar(sede?.direccion || 'Dirección no disponible')}</small>${!ubicacionValida(sede) ? '<small class="sin-ubicacion">Ubicación no disponible</small>' : ''}</span></button><a class="detalle-resultado" href="#charla/${encodeURIComponent(charla.id)}">Ver detalle →</a></article>`;
    }).join('') || '<div class="vacio"><h3>No encontramos charlas.</h3><p>Probá con otro nombre o distrito.</p><button class="boton borde" id="limpiar-filtros">Limpiar filtros</button></div>';
    for (const boton of lista.querySelectorAll('[data-charla]')) boton.addEventListener('click', () => seleccionar(boton.dataset.charla));
    if (mapa) {
      mapa.closePopup();
      for (const registro of marcadores.values()) registro.marcador.remove();
      marcadores.clear();
      const ubicadas = resultados.filter(c => ubicacionValida(sedeDe(c)));
      for (const charla of ubicadas) {
        const sede = sedeDe(charla);
        const desplazamiento = { x: 0, y: 0 };
        const marcador = L.marker([sede.latitud, sede.longitud], {
          icon: icono(charla, false, desplazamiento),
          title: `${numeroDe(charla)}. ${charla.nombre}`, keyboard: true,
          alt: charla.nombre,
        }).addTo(mapa).bindPopup(contenidoPopup(charla), medidasPopup());
        marcador.on('click', () => seleccionar(charla.id, true));
        marcadores.set(charla.id, { marcador, charla, desplazamiento });
      }
      encuadrar();
      recolocarMarcadores();
    }
    const totalUbicadas = resultados.filter(c => ubicacionValida(sedeDe(c))).length;
    contenedor.querySelector('#cantidad-mapa').textContent = `${totalUbicadas} ${totalUbicadas === 1 ? 'charla en el mapa' : 'charlas en el mapa'}`;
    verTodas.disabled = !mapa || !totalUbicadas;
    pintarSeleccion();
    if (seleccionId) seleccionar(seleccionId);
  }
  verTodas.addEventListener('click', () => { mapa?.closePopup(); encuadrar(); });
  return {
    actualizar,
    destruir() { destruida = true; clearTimeout(temporizador); observador?.disconnect(); mapa?.remove(); },
  };
}

// Separa los dibujos cuando coinciden o se acercan al alejar el zoom; no altera las sedes.
export function distribuirMarcadores(puntos) {
  const ocupadas = [];
  return puntos.map(punto => {
    let candidata = { x: punto.x, y: punto.y };
    let intento = 0;
    while (ocupadas.some(p => Math.hypot(p.x - candidata.x, p.y - candidata.y) < 42)) {
      const radio = (Math.floor(intento / 8) + 1) * 44;
      const angulo = (intento % 8) * Math.PI / 4;
      candidata = { x: punto.x + Math.cos(angulo) * radio, y: punto.y + Math.sin(angulo) * radio };
      intento++;
    }
    ocupadas.push(candidata);
    return candidata;
  });
}
