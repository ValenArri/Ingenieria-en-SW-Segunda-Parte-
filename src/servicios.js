import { convocatoria, distritos, charlas } from './datos.js';

// FECHAS Y ESTADO DE LA CONVOCATORIA
export function fechaActual(escenario, periodo = convocatoria, real = new Date()) {
  // Desplaza la fecha de referencia junto con la convocatoria seleccionada en la demo.
  const inicio = new Date(periodo.inicio);
  const fin = new Date(periodo.fin);
  if (escenario === 'futura') return new Date(inicio.getTime() - 24 * 60 * 60 * 1000);
  if (escenario === 'cerrada') return new Date(fin.getTime() + 1);
  if (escenario === 'real') return new Date(real);
  return new Date(inicio.getTime() + 5 * 24 * 60 * 60 * 1000);
}

export function estadoConvocatoria(fecha, periodo = convocatoria) {
  // Compara la fecha recibida con los límites configurados y devuelve el estado visible.
  if (fecha < new Date(periodo.inicio)) return 'Próximamente';

  return fecha <= new Date(periodo.fin)
    ? 'Inscripción abierta'
    : 'Convocatoria cerrada';
}

// NORMALIZACIÓN DE DATOS DEL FORMULARIO
export function normalizar(datos) {
  // Copia el borrador y aplica primero una limpieza general de los campos de texto.
  const resultado = Object.fromEntries(
    Object.entries(datos).map(([clave, valor]) => [
      clave,
      typeof valor === 'string' ? valor.trim() : valor,
    ]),
  );

  resultado.dni = (resultado.dni || '').replace(/[.\s]/g, '');
  resultado.correo = (resultado.correo || '').toLowerCase();
  resultado.intereses = [...new Set(resultado.intereses || [])];
  if (resultado.afiliacion !== 'si') resultado.partido = '';

  // Devuelve una copia lista para validar y persistir.
  return resultado;
}

// VALIDACIÓN POR PASO DEL FORMULARIO
export function validar(datos, fecha, paso = null) {
  // Acumula errores por nombre de campo; null valida el formulario completo.
  const errores = {};

  const requerir = (campo, mensaje) => {
    // Registra el mensaje bajo el nombre del campo para que la interfaz lo ubique.
    if (!datos[campo]) errores[campo] = mensaje;
  };

  if (paso === null || paso === 1) {
    // Paso 1: identidad, contacto y distrito electoral.
    const camposObligatorios = [
      'nombre',
      'apellido',
      'nacimiento',
      'direccion',
      'distrito',
      'telefono',
      'correo',
    ];
    camposObligatorios.forEach(campo => requerir(campo, 'Completá este campo.'));

    if (!/^\d{7,8}$/.test(datos.dni || '')) {
      errores.dni = 'Ingresá un DNI de 7 u 8 dígitos.';
    }
    if (!distritos.includes(datos.distrito)) {
      errores.distrito = 'Seleccioná un distrito electoral.';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.correo || '')) {
      errores.correo = 'Ingresá un correo válido, por ejemplo nombre@correo.com.';
    }

    const digitosTelefono = (datos.telefono || '').replace(/\D/g, '');
    const telefonoValido =
      /^[+\d\s()-]+$/.test(datos.telefono || '') &&
      digitosTelefono.length >= 8 &&
      digitosTelefono.length <= 15;
    if (!telefonoValido) {
      errores.telefono = 'Ingresá un teléfono de entre 8 y 15 dígitos.';
    }

    const nacimiento = new Date(datos.nacimiento + 'T12:00:00-03:00');
    const formatoNacimientoValido = /^\d{4}-\d{2}-\d{2}$/.test(datos.nacimiento || '');
    const fechaNacimientoValida =
      !Number.isNaN(+nacimiento) &&
      nacimiento.toISOString().slice(0, 10) === datos.nacimiento;
    const nacimientoEnRango = nacimiento <= fecha && nacimiento.getFullYear() >= 1900;
    const partesFechaActual = Object.fromEntries(
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Argentina/Buenos_Aires',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(fecha).map(({ type, value }) => [type, value]),
    );
    const fechaMinima16 = `${Number(partesFechaActual.year) - 16}-${partesFechaActual.month}-${partesFechaActual.day}`;
    const edadMinimaCumplida = datos.nacimiento <= fechaMinima16;
    if (!formatoNacimientoValido || !fechaNacimientoValida || !nacimientoEnRango) {
      errores.nacimiento = 'Ingresá una fecha de nacimiento válida, no futura.';
    } else if (!edadMinimaCumplida) {
      errores.nacimiento = 'Tenés que tener al menos 16 años para postularte.';
    }

    for (const campo of ['nombre', 'apellido', 'direccion']) {
      if ((datos[campo] || '').length > 120) {
        errores[campo] = 'Usá un máximo de 120 caracteres.';
      }
    }
  }

  if (paso === null || paso === 2) {
    // Paso 2: antecedentes, afiliación y referencias a charlas disponibles.
    for (const campo of ['experiencia', 'capacitacion', 'afiliacion']) {
      if (!['si', 'no'].includes(datos[campo])) errores[campo] = 'Elegí una opción.';
    }
    if (
      datos.afiliacion === 'si' &&
      (!datos.partido || datos.partido.length > 120)
    ) {
      errores.partido = 'Indicá el partido o agrupación (hasta 120 caracteres).';
    }
    const interesesInvalidos = (datos.intereses || []).some(
      id => !charlas.some(charla => charla.id === id),
    );
    if (interesesInvalidos) {
      errores.intereses = 'Seleccioná una charla válida.';
    }
  }

  return errores;
}

// REGISTRO: valida de nuevo antes de persistir para proteger el dominio.
export function registrarSolicitud(datos, repositorio, fecha, convocatoriaActual = convocatoria) {
  // Esta validación final protege el registro aunque la interfaz ya haya validado cada paso.
  if (estadoConvocatoria(fecha, convocatoriaActual) !== 'Inscripción abierta') {
    throw new Error('La convocatoria no está abierta. No se puede registrar la postulación.');
  }

  const normalizados = normalizar(datos);
  if (Object.keys(validar(normalizados, fecha)).length) {
    throw new Error('Revisá los datos de la solicitud antes de enviarla.');
  }

  const estado = repositorio.leer();
  // Cada persona puede tener una inscripción por convocatoria, no una única inscripción global.
  const duplicada = estado.inscripciones.some(
    inscripcion =>
      inscripcion.dni === normalizados.dni &&
      inscripcion.convocatoriaId === convocatoriaActual.id,
  );
  if (duplicada) {
    throw new Error(
      'Ya existe una postulación con ese DNI para esta convocatoria.',
    );
  }

  const inscripcion = {
    ...normalizados,
    id: 'MA-' + crypto.randomUUID().slice(0, 8).toUpperCase(),
    convocatoriaId: convocatoriaActual.id,
    creado: fecha.toISOString(),
    estado: 'Pendiente de evaluación',
    ejemplo: false,
  };

  // Persiste la inscripción y actualiza cuál debe mostrarse como última postulación.
  repositorio.guardar({
    ...estado,
    inscripciones: [...estado.inscripciones, inscripcion],
    ultimaId: inscripcion.id,
  });
  return inscripcion;
}

export function resolverSolicitud(id, nuevoEstado, motivo, repositorio, convocatoriaActual = convocatoria) {
  if (!['Aprobada', 'Rechazada'].includes(nuevoEstado)) {
    throw new Error('Seleccioná un estado de resolución válido.');
  }

  const estado = repositorio.leer();
  if (estadoConvocatoria(fechaActual(estado.escenario, convocatoriaActual), convocatoriaActual) !== 'Convocatoria cerrada') {
    throw new Error('Solo se pueden revisar postulaciones cuando la convocatoria está cerrada.');
  }

  const motivoNormalizado = typeof motivo === 'string' ? motivo.trim() : '';
  if (nuevoEstado === 'Rechazada' && !motivoNormalizado) {
    throw new Error('Ingresá el motivo del rechazo.');
  }

  const solicitud = estado.inscripciones.find(registro => registro.id === id);
  if (!solicitud || solicitud.estado !== 'Pendiente de evaluación') {
    throw new Error('La postulación ya no está pendiente de evaluación.');
  }

  const inscripciones = estado.inscripciones.map(registro => {
    if (registro.id !== id) return registro;

    const resuelta = { ...registro, estado: nuevoEstado };
    if (nuevoEstado === 'Rechazada') resuelta.motivo = motivoNormalizado;
    else delete resuelta.motivo;
    return resuelta;
  });

  repositorio.guardar({ ...estado, inscripciones });
  return inscripciones.find(registro => registro.id === id);
}
