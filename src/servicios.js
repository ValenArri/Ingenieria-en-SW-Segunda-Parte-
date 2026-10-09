import { convocatoria, distritos, charlas } from './datos.js';

// FECHAS Y ESTADO DE LA CONVOCATORIA
export function fechaActual(escenario, real = new Date()) {
  // El escenario de demo reemplaza la fecha real; el escenario real usa el argumento recibido.
  const fechasDeDemo = {
    abierta: '2026-10-06T12:00:00-03:00',
    cerrada: '2026-10-31T12:00:00-03:00',
    futura: '2026-09-28T12:00:00-03:00',
  };

  return new Date(fechasDeDemo[escenario] || real);
}

export function estadoConvocatoria(fecha) {
  // Compara la fecha recibida con los límites configurados y devuelve el estado visible.
  if (fecha < new Date(convocatoria.inicio)) return 'Próximamente';

  return fecha <= new Date(convocatoria.fin)
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
    if (!formatoNacimientoValido || !fechaNacimientoValida || !nacimientoEnRango) {
      errores.nacimiento = 'Ingresá una fecha de nacimiento válida, no futura.';
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
export function registrarSolicitud(datos, repositorio, fecha) {
  // Esta validación final protege el registro aunque la interfaz ya haya validado cada paso.
  if (estadoConvocatoria(fecha) !== 'Inscripción abierta') {
    throw new Error('La convocatoria no está abierta. No se puede registrar la postulación.');
  }

  const normalizados = normalizar(datos);
  if (Object.keys(validar(normalizados, fecha)).length) {
    throw new Error('Revisá los datos de la solicitud antes de enviarla.');
  }

  const estado = repositorio.leer();
  // Busca duplicados por DNI dentro de la convocatoria actual antes de crear el comprobante.
  const duplicada = estado.solicitudes.some(
    solicitud =>
      solicitud.dni === normalizados.dni &&
      solicitud.convocatoriaId === convocatoria.id,
  );
  if (duplicada) {
    throw new Error(
      'Ya existe una postulación con ese DNI',
    );
  }

  const solicitud = {
    ...normalizados,
    id: 'MA-' + crypto.randomUUID().slice(0, 8).toUpperCase(),
    convocatoriaId: convocatoria.id,
    creado: fecha.toISOString(),
    estado: 'Pendiente de evaluación',
    ejemplo: false,
  };

  // Persiste la solicitud y actualiza cuál debe mostrarse como última postulación.
  repositorio.guardar({
    ...estado,
    solicitudes: [...estado.solicitudes, solicitud],
    ultimaId: solicitud.id,
  });
  return solicitud;
}
