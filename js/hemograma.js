'use strict';

const $ = selector => document.querySelector(selector);

const imagenInput = $('#imagen');
const botonLeer = $('#leer-imagen');
const vistaPrevia = $('#vista-previa');
const estadoOCR = $('#estado-ocr');

const form = $('#form-reporte');
const tbody = $('#filas-resultados');

const especieSelect = $('#especie');

const calidadGeneral = $('#calidad-general');
const avisosCalidad = $('#avisos-calidad');

const CONFIG = window.VETLAB_CONFIG;


/* =========================================================
   ESTADO
========================================================= */

let ultimaPantalla = null;
let resultadosActuales = [];
let especieActual = '';



/* =========================================================
   UTILIDADES
========================================================= */

function hoyLocal() {

  const fecha = new Date();

  const offset = fecha.getTimezoneOffset();

  return new Date(
    fecha.getTime() - offset * 60000
  )
    .toISOString()
    .slice(0, 10);
}


function generarNumeroReporte() {

  const fecha = new Date();

  const dos = numero =>
    String(numero).padStart(2, '0');

  const base =
    fecha.getFullYear() +
    dos(fecha.getMonth() + 1) +
    dos(fecha.getDate()) +
    '-' +
    dos(fecha.getHours()) +
    dos(fecha.getMinutes()) +
    dos(fecha.getSeconds());

  let aleatorio;

  if (
    window.crypto &&
    window.crypto.getRandomValues
  ) {

    const valores =
      window.crypto.getRandomValues(
        new Uint16Array(1)
      );

    aleatorio =
      valores[0]
        .toString(36)
        .toUpperCase()
        .slice(0, 3);

  } else {

    aleatorio =
      Math.random()
        .toString(36)
        .slice(2, 5)
        .toUpperCase();

  }

  return `${base}-${aleatorio}`;
}


function mostrarEstado(texto, tipo = '') {

  estadoOCR.hidden = false;

  estadoOCR.className =
    'status-box' +
    (tipo ? ` ${tipo}` : '');

  estadoOCR.textContent = texto;
}


function escaparHTML(valor) {

  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


/*
 * BARQUERO → Barquero
 * MARIA JOSE → Maria Jose
 * JUAN-CARLOS → Juan-Carlos
 */
function normalizarNombre(valor) {

  const texto = String(valor || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

  if (!texto) {
    return '';
  }

  return texto
    .split(' ')
    .map(palabra => {

      return palabra
        .split('-')
        .map(parte => {

          if (!parte) {
            return '';
          }

          return (
            parte.charAt(0).toUpperCase() +
            parte.slice(1)
          );

        })
        .join('-');

    })
    .join(' ');
}


function numeroValido(valor) {

  const n = Number(valor);

  return Number.isFinite(n);
}


function diferenciaRelativa(a, b) {

  if (!numeroValido(a) || !numeroValido(b)) {
    return Infinity;
  }

  const mayor =
    Math.max(
      Math.abs(Number(a)),
      Math.abs(Number(b)),
      0.0001
    );

  return (
    Math.abs(Number(a) - Number(b)) /
    mayor
  );
}


/* =========================================================
   IMAGEN
========================================================= */

function cargarImagen(file) {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onload = evento => {

      const img = new Image();

      img.onload = () => resolve(img);

      img.onerror = () =>
        reject(
          new Error(
            'No se pudo abrir la fotografía.'
          )
        );

      img.src = evento.target.result;
    };

    reader.onerror = () =>
      reject(
        new Error(
          'No se pudo leer la fotografía.'
        )
      );

    reader.readAsDataURL(file);
  });
}


function imagenACanvas(img) {

  const limite = 2000;

  const escala =
    Math.min(
      1,
      limite /
      Math.max(
        img.naturalWidth,
        img.naturalHeight
      )
    );

  const ancho =
    Math.round(
      img.naturalWidth * escala
    );

  const alto =
    Math.round(
      img.naturalHeight * escala
    );

  const canvas =
    document.createElement('canvas');

  canvas.width = ancho;
  canvas.height = alto;

  const ctx =
    canvas.getContext(
      '2d',
      { willReadFrequently: true }
    );

  ctx.drawImage(
    img,
    0,
    0,
    ancho,
    alto
  );

  return canvas;
}


/* =========================================================
   LOCALIZAR PANTALLA
========================================================= */

function mayorSecuencia(valores) {

  if (!valores.length) {
    return null;
  }

  let inicioMejor = valores[0];
  let finMejor = valores[0];

  let inicioActual = valores[0];
  let anterior = valores[0];

  for (
    let i = 1;
    i < valores.length;
    i++
  ) {

    const actual = valores[i];

    if (
      actual - anterior >
      Math.max(4, anterior * 0.015)
    ) {

      if (
        anterior - inicioActual >
        finMejor - inicioMejor
      ) {

        inicioMejor = inicioActual;
        finMejor = anterior;
      }

      inicioActual = actual;
    }

    anterior = actual;
  }

  if (
    anterior - inicioActual >
    finMejor - inicioMejor
  ) {

    inicioMejor = inicioActual;
    finMejor = anterior;
  }

  return [
    inicioMejor,
    finMejor
  ];
}


function localizarPantalla(canvas) {

  const ctx =
    canvas.getContext(
      '2d',
      { willReadFrequently: true }
    );

  const ancho = canvas.width;
  const alto = canvas.height;

  const imagen =
    ctx.getImageData(
      0,
      0,
      ancho,
      alto
    );

  const data = imagen.data;


  function luminosidad(x, y) {

    const i =
      (y * ancho + x) * 4;

    return (
      data[i] * 0.299 +
      data[i + 1] * 0.587 +
      data[i + 2] * 0.114
    );
  }


  const pasoX =
    Math.max(
      2,
      Math.floor(ancho / 600)
    );

  const pasoY =
    Math.max(
      2,
      Math.floor(alto / 700)
    );


  /*
   * Ignoramos la parte superior de la fotografía
   * para no confundir etiquetas, cajas o reflejos
   * del equipo con la pantalla.
   */

  const inicioY =
    Math.floor(alto * 0.15);

  const finY =
    Math.floor(alto * 0.95);


  const filas = [];


  for (
    let y = inicioY;
    y < finY;
    y += pasoY
  ) {

    let claros = 0;
    let total = 0;

    for (
      let x =
        Math.floor(ancho * 0.05);
      x <
        Math.floor(ancho * 0.95);
      x += pasoX
    ) {

      total++;

      if (
        luminosidad(x, y) >
        145
      ) {

        claros++;
      }
    }

    const proporcion =
      claros / total;

    if (proporcion > 0.34) {
      filas.push(y);
    }
  }


  const rangoY =
    mayorSecuencia(filas);


  if (!rangoY) {

    throw new Error(
      'No pude localizar claramente la pantalla del analizador.'
    );
  }


  let y0 =
    Math.max(
      0,
      rangoY[0] -
      Math.round(alto * 0.015)
    );

  let y1 =
    Math.min(
      alto,
      rangoY[1] +
      Math.round(alto * 0.015)
    );


  const columnas = [];


  for (
    let x =
      Math.floor(ancho * 0.05);
    x <
      Math.floor(ancho * 0.95);
    x += pasoX
  ) {

    let claros = 0;
    let total = 0;

    for (
      let y = y0;
      y < y1;
      y += pasoY
    ) {

      total++;

      if (
        luminosidad(x, y) >
        145
      ) {

        claros++;
      }
    }


    if (
      total &&
      claros / total > 0.40
    ) {

      columnas.push(x);
    }
  }


  const rangoX =
    mayorSecuencia(columnas);


  if (!rangoX) {

    throw new Error(
      'No pude determinar los bordes laterales de la pantalla.'
    );
  }


  let x0 =
    Math.max(
      0,
      rangoX[0] -
      Math.round(ancho * 0.015)
    );

  let x1 =
    Math.min(
      ancho,
      rangoX[1] +
      Math.round(ancho * 0.015)
    );


  const anchoPantalla =
    x1 - x0;

  const altoPantalla =
    y1 - y0;


  if (
    anchoPantalla <
      ancho * 0.40 ||
    altoPantalla <
      alto * 0.40
  ) {

    throw new Error(
      'La pantalla ocupa muy poco espacio en la fotografía. Acerque un poco más el iPhone.'
    );
  }


  const salida =
    document.createElement('canvas');

  salida.width = anchoPantalla;
  salida.height = altoPantalla;


  salida
    .getContext('2d')
    .drawImage(
      canvas,
      x0,
      y0,
      anchoPantalla,
      altoPantalla,
      0,
      0,
      anchoPantalla,
      altoPantalla
    );


  return salida;
}


/* =========================================================
   RECORTES FIJOS
========================================================= */

function recortar(
  canvas,
  x,
  y,
  ancho,
  alto
) {

  const sx =
    Math.round(
      canvas.width * x
    );

  const sy =
    Math.round(
      canvas.height * y
    );

  const sw =
    Math.round(
      canvas.width * ancho
    );

  const sh =
    Math.round(
      canvas.height * alto
    );


  const salida =
    document.createElement('canvas');


  /*
   * Ampliamos cada zona.
   * Tesseract trabaja mejor con caracteres grandes.
   */

  const factor = 4;

  salida.width = sw * factor;
  salida.height = sh * factor;


  const ctx =
    salida.getContext(
      '2d',
      { willReadFrequently: true }
    );


  ctx.drawImage(
    canvas,
    sx,
    sy,
    sw,
    sh,
    0,
    0,
    salida.width,
    salida.height
  );


  return salida;
}


function mejorarParaOCR(
  canvas,
  umbral = 155
) {

  const ctx =
    canvas.getContext(
      '2d',
      { willReadFrequently: true }
    );

  const imagen =
    ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );

  const data =
    imagen.data;


  for (
    let i = 0;
    i < data.length;
    i += 4
  ) {

    const gris =
      data[i] * 0.299 +
      data[i + 1] * 0.587 +
      data[i + 2] * 0.114;


    const valor =
      gris > umbral
        ? 255
        : 0;


    data[i] = valor;
    data[i + 1] = valor;
    data[i + 2] = valor;
  }


  ctx.putImageData(
    imagen,
    0,
    0
  );


  return canvas;
}


/* =========================================================
   OCR INDIVIDUAL
========================================================= */

async function reconocerZona(
  worker,
  canvas,
  whitelist
) {

  await worker.setParameters({

    tessedit_pageseg_mode: '7',

    tessedit_char_whitelist:
      whitelist,

    preserve_interword_spaces:
      '1'
  });


  const resultado =
    await worker.recognize(canvas);


  return {

    texto:
      String(
        resultado.data.text || ''
      ).trim(),

    confianza:
      Number(
        resultado.data.confidence || 0
      )
  };
}


function limpiarNumero(
  texto,
  decimales
) {

  let limpio =
    String(texto || '')
      .trim()
      .replace(/,/g, '.')
      .replace(/O/gi, '0')
      .replace(/[^\d.]/g, '');


  if (!limpio) {
    return '';
  }


  /*
   * Si hay varios puntos conservamos solo uno.
   */

  const partes =
    limpio.split('.');


  if (partes.length > 2) {

    limpio =
      partes.shift() +
      '.' +
      partes.join('');
  }


  /*
   * Si el Exigo muestra 12.1 y OCR devuelve 121,
   * sabemos por la plantilla que debe tener
   * un decimal.
   */

  if (
    !limpio.includes('.') &&
    decimales > 0
  ) {

    const soloDigitos =
      limpio.replace(/\D/g, '');


    if (
      soloDigitos.length >
      decimales
    ) {

      limpio =
        soloDigitos.slice(
          0,
          -decimales
        ) +
        '.' +
        soloDigitos.slice(
          -decimales
        );
    }
  }


  const numero =
    Number(limpio);


  if (
    !Number.isFinite(numero)
  ) {

    return '';
  }


  if (decimales === 0) {
    return String(
      Math.round(numero)
    );
  }


  return numero.toFixed(decimales);
}


/* =========================================================
   IDENTIDAD / ESPECIE
========================================================= */

function limpiarTextoNombre(texto) {

  return String(texto || '')
    .toUpperCase()

    .replace(/ID2?\s*:?\s*/g, ' ')

    .replace(
      /\bDOG\b|\bCAT\b|\b3P\b|\bOT\b/g,
      ' '
    )

    .replace(
      /[^A-ZÁÉÍÓÚÜÑ0-9 -]/g,
      ' '
    )

    .replace(/\s+/g, ' ')
    .trim();
}


async function leerIdentidad(
  worker,
  pantalla
) {

  /*
   * ID = propietario
   */

  const zonaPropietario =
    mejorarParaOCR(
      recortar(
        pantalla,
        0.00,
        0.008,
        0.74,
        0.050
      ),
      160
    );


  const propietarioOCR =
    await reconocerZona(
      worker,
      zonaPropietario,
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ÁÉÍÓÚÜÑ :-'
    );


  /*
   * ID2 = paciente
   */

  const zonaPaciente =
    mejorarParaOCR(
      recortar(
        pantalla,
        0.00,
        0.052,
        0.76,
        0.050
      ),
      160
    );


  const pacienteOCR =
    await reconocerZona(
      worker,
      zonaPaciente,
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ÁÉÍÓÚÜÑ :-'
    );


  return {

    propietario:
      normalizarNombre(
        limpiarTextoNombre(
          propietarioOCR.texto
        )
      ),

    paciente:
      normalizarNombre(
        limpiarTextoNombre(
          pacienteOCR.texto
        )
      ),

    confianzaPropietario:
      propietarioOCR.confianza,

    confianzaPaciente:
      pacienteOCR.confianza
  };
}


async function detectarEspecie(
  worker,
  pantalla
) {

  /*
   * Primero intentamos directamente la zona
   * donde aparece DOG / CAT.
   */

  const zona =
    mejorarParaOCR(
      recortar(
        pantalla,
        0.76,
        0.045,
        0.23,
        0.055
      ),
      155
    );


  const lectura =
    await reconocerZona(
      worker,
      zona,
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    );


  const texto =
    lectura.texto
      .toUpperCase();


  if (
    texto.includes('CAT')
  ) {

    return {
      especie: 'gato',
      confianza: lectura.confianza
    };
  }


  if (
    texto.includes('DOG')
  ) {

    return {
      especie: 'perro',
      confianza: lectura.confianza
    };
  }


  /*
   * Segunda comprobación:
   * buscamos GRAN vs NEUT/EOS.
   */

  const zonaDiferencial =
    mejorarParaOCR(
      recortar(
        pantalla,
        0.00,
        0.14,
        0.26,
        0.18
      ),
      155
    );


  const diferencial =
    await reconocerZona(
      worker,
      zonaDiferencial,
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    );


  const textoDif =
    diferencial.texto.toUpperCase();


  if (
    textoDif.includes('GRAN')
  ) {

    return {
      especie: 'gato',
      confianza:
        diferencial.confianza
    };
  }


  if (
    textoDif.includes('NEUT') ||
    textoDif.includes('EOS')
  ) {

    return {
      especie: 'perro',
      confianza:
        diferencial.confianza
    };
  }


  return {
    especie: '',
    confianza: 0
  };
}


/* =========================================================
   LEER RESULTADOS POR COORDENADAS
========================================================= */

async function leerParametros(
  worker,
  pantalla,
  especie
) {

  const parametros =
    CONFIG[especie].parametros;


  const resultados = [];


  for (
    let i = 0;
    i < parametros.length;
    i++
  ) {

    const parametro =
      parametros[i];


    mostrarEstado(
      `Leyendo ${parametro.nombre}... ${i + 1}/${parametros.length}`
    );


    /*
     * IMPORTANTE:
     *
     * Ya NO leemos toda la fila.
     *
     * Solo leemos la columna numérica
     * donde el Exigo muestra el resultado.
     */

    const zona =
      recortar(
        pantalla,

        0.235,

        parametro.y - 0.021,

        0.245,

        0.043
      );


    mejorarParaOCR(
      zona,
      155
    );


    const lectura =
      await reconocerZona(
        worker,
        zona,
        '0123456789.'
      );


    const resultado =
      limpiarNumero(
        lectura.texto,
        parametro.decimales
      );


    resultados.push({

      ...parametro,

      resultado,

      confianza:
        lectura.confianza

    });
  }


  return resultados;
}


/* =========================================================
   ESTADO CLÍNICO
========================================================= */

function calcularEstado(
  resultado,
  minimo,
  maximo
) {

  if (
    !numeroValido(resultado)
  ) {

    return 'REVISAR';
  }


  const valor =
    Number(resultado);


  if (
    valor < Number(minimo)
  ) {

    return 'BAJO';
  }


  if (
    valor > Number(maximo)
  ) {

    return 'ALTO';
  }


  return 'NORMAL';
}


/* =========================================================
   TABLA DE CONFIRMACIÓN
========================================================= */

function crearTablaResultados(
  especie,
  resultados
) {

  tbody.innerHTML = '';


  const mapa =
    Object.fromEntries(
      resultados.map(
        resultado => [
          resultado.id,
          resultado
        ]
      )
    );


  CONFIG[especie]
    .parametros
    .forEach(parametro => {


      const dato =
        mapa[parametro.id] || {
          ...parametro,
          resultado: '',
          confianza: 0
        };


      const estado =
        calcularEstado(
          dato.resultado,
          parametro.minimo,
          parametro.maximo
        );


      const tr =
        document.createElement('tr');


      tr.dataset.parametro =
        parametro.id;


      if (
        dato.confianza < 60 ||
        !dato.resultado
      ) {

        tr.classList.add(
          'needs-review'
        );
      }


      tr.innerHTML = `

        <th>
          ${escaparHTML(parametro.nombre)}
        </th>


        <td>

          <input
            type="text"
            inputmode="decimal"
            class="resultado-input"
            data-id="${escaparHTML(parametro.id)}"
            value="${escaparHTML(dato.resultado)}"
            autocomplete="off"
            required
          >

          ${
            dato.confianza > 0
              ? `
                <small class="ocr-confidence">
                  OCR ${Math.round(dato.confianza)}%
                </small>
              `
              : ''
          }

        </td>


        <td>
          ${escaparHTML(parametro.unidad)}
        </td>


        <td>
          ${escaparHTML(
            `${formatearReferencia(
              parametro.minimo,
              parametro.decimales
            )} – ${formatearReferencia(
              parametro.maximo,
              parametro.decimales
            )}`
          )}
        </td>


        <td>

          <span
            class="result-state ${estado.toLowerCase()}"
            data-estado="${escaparHTML(parametro.id)}">

            ${textoEstado(estado)}

          </span>

        </td>
      `;


      tbody.appendChild(tr);
    });


  document
    .querySelectorAll(
      '.resultado-input'
    )
    .forEach(input => {

      input.addEventListener(
        'input',
        () => {

          actualizarFila(
            input.dataset.id
          );

          actualizarControlCalidad();

        }
      );

    });
}


function formatearReferencia(
  valor,
  decimales
) {

  const numero =
    Number(valor);

  if (
    !Number.isFinite(numero)
  ) {

    return String(valor);
  }

  if (decimales === 0) {
    return String(
      Math.round(numero)
    );
  }

  return numero.toFixed(decimales);
}


function textoEstado(estado) {

  switch (estado) {

    case 'ALTO':
      return '↑ Alto';

    case 'BAJO':
      return '↓ Bajo';

    case 'NORMAL':
      return 'Normal';

    default:
      return 'Revisar';
  }
}


function obtenerParametro(id) {

  return CONFIG[especieActual]
    ?.parametros
    .find(
      parametro =>
        parametro.id === id
    );
}


function actualizarFila(id) {

  const parametro =
    obtenerParametro(id);

  if (!parametro) {
    return;
  }


  const input =
    document.querySelector(
      `.resultado-input[data-id="${id}"]`
    );


  const badge =
    document.querySelector(
      `[data-estado="${id}"]`
    );


  if (!input || !badge) {
    return;
  }


  const estado =
    calcularEstado(
      input.value,
      parametro.minimo,
      parametro.maximo
    );


  badge.className =
    `result-state ${estado.toLowerCase()}`;

  badge.textContent =
    textoEstado(estado);


  const fila =
    input.closest('tr');


  if (input.value.trim()) {

    fila.classList.remove(
      'needs-review'
    );

  } else {

    fila.classList.add(
      'needs-review'
    );
  }
}


/* =========================================================
   VALIDACIÓN MATEMÁTICA
========================================================= */

function obtenerValor(id) {

  const input =
    document.querySelector(
      `.resultado-input[data-id="${id}"]`
    );


  if (!input) {
    return NaN;
  }


  return Number(
    input.value
  );
}


function revisarCoherencia() {

  const avisos = [];


  const WBC =
    obtenerValor('WBC');

  const LYM =
    obtenerValor('LYM');

  const MONO =
    obtenerValor('MONO');


  /*
   * Comprobación diferencial leucocitario
   */

  if (
    especieActual === 'perro'
  ) {

    const NEUT =
      obtenerValor('NEUT');

    const EOS =
      obtenerValor('EOS');


    if (
      [
        WBC,
        LYM,
        MONO,
        NEUT,
        EOS
      ].every(Number.isFinite)
    ) {

      const suma =
        LYM +
        MONO +
        NEUT +
        EOS;


      if (
        diferenciaRelativa(
          WBC,
          suma
        ) > 0.06
      ) {

        avisos.push({
          tipo: 'warning',
          texto:
            `Revisar diferencial: LYM + MONO + NEUT + EOS = ${suma.toFixed(1)}, pero WBC = ${WBC.toFixed(1)}.`
        });
      }
    }

  } else if (
    especieActual === 'gato'
  ) {

    const GRAN =
      obtenerValor('GRAN');


    if (
      [
        WBC,
        LYM,
        MONO,
        GRAN
      ].every(Number.isFinite)
    ) {

      const suma =
        LYM +
        MONO +
        GRAN;


      if (
        diferenciaRelativa(
          WBC,
          suma
        ) > 0.06
      ) {

        avisos.push({
          tipo: 'warning',
          texto:
            `Revisar diferencial: LYM + MONO + GRAN = ${suma.toFixed(1)}, pero WBC = ${WBC.toFixed(1)}.`
        });
      }
    }
  }


  /*
   * HCT ≈ RBC × MCV / 10
   */

  const RBC =
    obtenerValor('RBC');

  const MCV =
    obtenerValor('MCV');

  const HCT =
    obtenerValor('HCT');


  if (
    [
      RBC,
      MCV,
      HCT
    ].every(Number.isFinite)
  ) {

    const hctCalculado =
      RBC * MCV / 10;


    if (
      diferenciaRelativa(
        HCT,
        hctCalculado
      ) > 0.04
    ) {

      avisos.push({
        tipo: 'warning',
        texto:
          `Revisar RBC, MCV o HCT. Por cálculo se esperaría HCT ≈ ${hctCalculado.toFixed(1)}%, pero se leyó ${HCT.toFixed(1)}%.`
      });
    }
  }


  /*
   * MCHC ≈ HGB / HCT × 100
   */

  const HGB =
    obtenerValor('HGB');

  const MCHC =
    obtenerValor('MCHC');


  if (
    [
      HGB,
      HCT,
      MCHC
    ].every(Number.isFinite) &&
    HCT !== 0
  ) {

    const mchcCalculado =
      HGB / HCT * 100;


    if (
      diferenciaRelativa(
        MCHC,
        mchcCalculado
      ) > 0.05
    ) {

      avisos.push({
        tipo: 'warning',
        texto:
          `Revisar HGB, HCT o MCHC. Por cálculo se esperaría MCHC ≈ ${mchcCalculado.toFixed(1)} g/dL, pero se leyó ${MCHC.toFixed(1)} g/dL.`
      });
    }
  }


  /*
   * Campos vacíos
   */

  document
    .querySelectorAll(
      '.resultado-input'
    )
    .forEach(input => {

      if (
        !input.value.trim()
      ) {

        avisos.push({
          tipo: 'error',
          texto:
            `Falta confirmar ${input.dataset.id}.`
        });
      }

    });


  return avisos;
}


function actualizarControlCalidad() {

  const avisos =
    revisarCoherencia();


  avisosCalidad.innerHTML = '';


  if (!avisos.length) {

    calidadGeneral.className =
      'quality-badge good';

    calidadGeneral.textContent =
      'Lectura coherente';


    avisosCalidad.innerHTML = `
      <div class="quality-message good">
        ✓ Las principales comprobaciones matemáticas son coherentes.
        Confirme visualmente los valores contra la fotografía antes de continuar.
      </div>
    `;

    return;
  }


  calidadGeneral.className =
    'quality-badge warning';

  calidadGeneral.textContent =
    `${avisos.length} por revisar`;


  avisos.forEach(aviso => {

    const div =
      document.createElement('div');

    div.className =
      `quality-message ${aviso.tipo}`;

    div.textContent =
      aviso.texto;

    avisosCalidad.appendChild(
      div
    );
  });
}


/* =========================================================
   ANÁLISIS COMPLETO
========================================================= */

async function analizarFotografia(
  file
) {

  if (
    !window.Tesseract
  ) {

    throw new Error(
      'No se pudo cargar Tesseract. Compruebe la conexión a Internet.'
    );
  }


  mostrarEstado(
    'Preparando fotografía...'
  );


  const img =
    await cargarImagen(file);


  if (
    img.naturalWidth < 500 ||
    img.naturalHeight < 500
  ) {

    throw new Error(
      'La fotografía tiene muy poca resolución.'
    );
  }


  const canvasOriginal =
    imagenACanvas(img);


  mostrarEstado(
    'Localizando pantalla del Exigo...'
  );


  const pantalla =
    localizarPantalla(
      canvasOriginal
    );


  ultimaPantalla =
    pantalla;


  const worker =
    await Tesseract.createWorker(
      'eng',
      1,
      {
        logger: mensaje => {

          if (
            mensaje.status ===
            'recognizing text'
          ) {

            // Se evita llenar la pantalla
            // con cada actualización interna.
          }
        }
      }
    );


  try {

    mostrarEstado(
      'Detectando DOG / CAT...'
    );


    const deteccionEspecie =
      await detectarEspecie(
        worker,
        pantalla
      );


    let especie =
      deteccionEspecie.especie;


    if (!especie) {

      throw new Error(
        'No pude identificar con seguridad DOG o CAT. Tome otra fotografía un poco más recta.'
      );
    }


    especieActual =
      especie;


    mostrarEstado(
      'Leyendo propietario y paciente...'
    );


    const identidad =
      await leerIdentidad(
        worker,
        pantalla
      );


    const resultados =
      await leerParametros(
        worker,
        pantalla,
        especie
      );


    resultadosActuales =
      resultados;


    return {

      especie,
      identidad,
      resultados
    };

  } finally {

    await worker.terminate();
  }
}


/* =========================================================
   EVENTOS
========================================================= */

$('#fecha').value =
  hoyLocal();

$('#numero_reporte').value =
  generarNumeroReporte();


imagenInput.addEventListener(
  'change',
  () => {

    const file =
      imagenInput.files?.[0];


    botonLeer.disabled =
      !file;


    if (!file) {

      vistaPrevia.hidden =
        true;

      return;
    }


    vistaPrevia.src =
      URL.createObjectURL(file);

    vistaPrevia.hidden =
      false;

    estadoOCR.hidden =
      true;

    form.hidden =
      true;
  }
);


botonLeer.addEventListener(
  'click',
  async () => {

    const file =
      imagenInput.files?.[0];


    if (!file) {
      return;
    }


    botonLeer.disabled =
      true;

    botonLeer.textContent =
      'Leyendo fotografía...';


    try {

      const datos =
        await analizarFotografia(
          file
        );


      $('#propietario').value =
        datos.identidad.propietario;


      $('#paciente').value =
        datos.identidad.paciente;


      especieSelect.value =
        datos.especie;


      crearTablaResultados(
        datos.especie,
        datos.resultados
      );


      form.hidden =
        false;


      actualizarControlCalidad();


      const nombresRevisar =
        datos.identidad.confianzaPaciente < 65 ||
        datos.identidad.confianzaPropietario < 60;


      if (nombresRevisar) {

        mostrarEstado(
          'Lectura terminada. Revise especialmente los nombres y cualquier fila marcada para revisión.',
          'warning'
        );

      } else {

        mostrarEstado(
          'Lectura terminada. Confirme todos los valores contra la fotografía.',
          'success'
        );
      }


      form.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });


    } catch (error) {

      console.error(error);

      mostrarEstado(
        error.message ||
        'No se pudo procesar la fotografía.',
        'error'
      );

    } finally {

      botonLeer.disabled =
        false;

      botonLeer.textContent =
        'Leer resultados';
    }
  }
);


$('#volver-leer')
  .addEventListener(
    'click',
    () => {

      form.hidden = true;

      imagenInput.click();
    }
  );


/*
 * Si alguien cambia manualmente DOG/CAT,
 * usamos la tabla correspondiente.
 */

especieSelect.addEventListener(
  'change',
  () => {

    const nueva =
      especieSelect.value;


    if (
      !nueva ||
      nueva === especieActual
    ) {

      return;
    }


    especieActual =
      nueva;


    crearTablaResultados(
      nueva,
      []
    );


    actualizarControlCalidad();


    mostrarEstado(
      'La especie fue cambiada manualmente. Confirme todos los valores antes de generar el reporte.',
      'warning'
    );
  }
);


/* =========================================================
   GUARDAR REPORTE
========================================================= */

form.addEventListener(
  'submit',
  evento => {

    evento.preventDefault();


    const especie =
      especieSelect.value;


    if (!especie) {

      mostrarEstado(
        'Debe confirmar la especie.',
        'error'
      );

      return;
    }


    const avisos =
      revisarCoherencia();


    const faltantes =
      avisos.some(
        aviso =>
          aviso.tipo === 'error'
      );


    if (faltantes) {

      mostrarEstado(
        'Hay resultados sin completar. Revise la tabla antes de continuar.',
        'error'
      );

      actualizarControlCalidad();

      return;
    }


    const filas =
      CONFIG[especie]
        .parametros
        .map(parametro => {


          const input =
            document.querySelector(
              `.resultado-input[data-id="${parametro.id}"]`
            );


          const resultado =
            String(
              input?.value || ''
            ).trim();


          const estado =
            calcularEstado(
              resultado,
              parametro.minimo,
              parametro.maximo
            );


          return {

            id:
              parametro.id,

            parametro:
              parametro.nombre,

            resultado,

            unidad:
              parametro.unidad,

            minimo:
              parametro.minimo,

            maximo:
              parametro.maximo,

            referencia:
              `${formatearReferencia(
                parametro.minimo,
                parametro.decimales
              )} – ${formatearReferencia(
                parametro.maximo,
                parametro.decimales
              )}`,

            estado
          };
        });


    const datos = {

      propietario:
        normalizarNombre(
          $('#propietario').value
        ),

      paciente:
        normalizarNombre(
          $('#paciente').value
        ),

      especie,

      edad:
        $('#edad').value.trim(),

      expediente:
        $('#expediente').value.trim(),

      veterinario:
        normalizarNombre(
          $('#veterinario').value
        ),

      fecha:
        $('#fecha').value,

      reporte:
        $('#numero_reporte').value,

      observaciones:
        $('#observaciones')
          .value
          .trim()
          .slice(0, 800),

      equipo:
        'Exigo H400',

      controlCalidad:
        avisos.map(
          aviso => aviso.texto
        ),

      filas
    };


    sessionStorage.setItem(
      'vetlab_ultimo_reporte',
      JSON.stringify(datos)
    );


    location.href =
      './reporte.html';
  }
);
