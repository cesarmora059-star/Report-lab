'use strict';

const $ = selector => document.querySelector(selector);

const raw = sessionStorage.getItem('vetlab_ultimo_reporte');


if (!raw) {

  $('#report-sheet').innerHTML =
    '<p>No hay un reporte preparado.</p>';

  $('.download-actions').hidden = true;

} else {

  const datos = JSON.parse(raw);

  renderizarReporte(datos);

  $('#descargar-pdf')
    .addEventListener(
      'click',
      () => generarPDF(datos)
    );

  $('#descargar-word')
    .addEventListener(
      'click',
      () => generarWord(datos)
    );
}


/* =========================================================
   UTILIDADES
========================================================= */

function escapar(valor) {

  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


function especieTexto(datos) {

  return datos.especie === 'gato'
    ? 'Felino'
    : 'Canino';
}


function fechaTexto(valor) {

  const partes =
    String(valor || '')
      .split('-');

  if (partes.length === 3) {

    return (
      `${partes[2]}/` +
      `${partes[1]}/` +
      `${partes[0]}`
    );
  }

  return valor;
}


function nombreArchivo(datos, extension) {

  const paciente =
    String(
      datos.paciente ||
      'sin_nombre'
    )
      .replace(
        /[^a-z0-9_-]+/gi,
        '_'
      );

  return (
    `hemograma_${paciente}.` +
    extension
  );
}


function claseEstado(estado) {

  switch (estado) {

    case 'ALTO':
      return 'high';

    case 'BAJO':
      return 'low';

    default:
      return 'normal';
  }
}


function textoEstado(estado) {

  switch (estado) {

    case 'ALTO':
      return '↑ Alto';

    case 'BAJO':
      return '↓ Bajo';

    default:
      return '';
  }
}


/* =========================================================
   REPORTE EN PANTALLA
========================================================= */

function renderizarReporte(datos) {

  $('#titulo-paciente')
    .textContent =
      datos.paciente ||
      'Paciente sin nombre';

  $('#titulo-especie')
    .textContent =
      especieTexto(datos);


  const filas =
    datos.filas
      .map(fila => `

        <tr class="${claseEstado(fila.estado)}">

          <td class="parameter-name">
            ${escapar(fila.parametro)}
          </td>

          <td class="result-value">
            ${escapar(fila.resultado)}
          </td>

          <td>
            ${escapar(fila.unidad)}
          </td>

          <td>
            ${escapar(fila.referencia)}
          </td>

          <td class="state-cell">
            ${escapar(textoEstado(fila.estado))}
          </td>

        </tr>

      `)
      .join('');


  const alterados =
    datos.filas
      .filter(
        fila =>
          fila.estado === 'ALTO' ||
          fila.estado === 'BAJO'
      );


  const resumenAlterados =
    alterados.length

      ? alterados
          .map(
            fila =>
              `${fila.parametro} ${textoEstado(fila.estado)}`
          )
          .join(' · ')

      : 'Sin resultados fuera del intervalo de referencia.';


  $('#report-sheet').innerHTML = `

    <div class="laboratory-report-header">

      <div class="report-brand-left">

        <img
          src="./img/logo.jpg"
          class="logo-report"
          alt="Clínica Veterinaria Fortuna"
        >

        <div>

          <strong>
            CLÍNICA VETERINARIA FORTUNA
          </strong>

          <span>
            Laboratorio Clínico Veterinario
          </span>

        </div>

      </div>


      <div class="report-number">

        <span>
          HEMOGRAMA
        </span>

        <small>
          Reporte ${escapar(datos.reporte)}
        </small>

      </div>

    </div>


    <div class="patient-report-grid">

      <div>

        <span class="report-field-label">
          Paciente
        </span>

        <strong>
          ${escapar(datos.paciente || '—')}
        </strong>

      </div>


      <div>

        <span class="report-field-label">
          Propietario
        </span>

        <strong>
          ${escapar(datos.propietario || '—')}
        </strong>

      </div>


      <div>

        <span class="report-field-label">
          Especie
        </span>

        <strong>
          ${escapar(especieTexto(datos))}
        </strong>

      </div>


      <div>

        <span class="report-field-label">
          Edad
        </span>

        <strong>
          ${escapar(datos.edad || '—')}
        </strong>

      </div>


      <div>

        <span class="report-field-label">
          Expediente
        </span>

        <strong>
          ${escapar(datos.expediente || '—')}
        </strong>

      </div>


      <div>

        <span class="report-field-label">
          Fecha
        </span>

        <strong>
          ${escapar(fechaTexto(datos.fecha))}
        </strong>

      </div>

    </div>


    <div class="report-section-title">
      Resultados hematológicos
    </div>


    <div class="table-wrap">

      <table class="professional-report-table">

        <thead>

          <tr>

            <th>
              Parámetro
            </th>

            <th>
              Resultado
            </th>

            <th>
              Unidad
            </th>

            <th>
              Intervalo de referencia
            </th>

            <th>
              Estado
            </th>

          </tr>

        </thead>


        <tbody>
          ${filas}
        </tbody>

      </table>

    </div>


    <div class="report-summary">

      <strong>
        Resultados fuera de referencia
      </strong>

      <p>
        ${escapar(resumenAlterados)}
      </p>

    </div>


    ${
      datos.observaciones
        ? `

          <div class="report-observations">

            <strong>
              Observaciones del laboratorio
            </strong>

            <p>
              ${escapar(datos.observaciones)}
            </p>

          </div>

        `
        : ''
    }


    <div class="report-method">

      <div>

        <span>
          Analizador
        </span>

        <strong>
          ${escapar(datos.equipo || 'Exigo H400')}
        </strong>

      </div>


      <div>

        <span>
          Intervalos
        </span>

        <strong>
          Perfil ${escapar(especieTexto(datos))}
        </strong>

      </div>


      <div>

        <span>
          Médico veterinario
        </span>

        <strong>
          ${escapar(datos.veterinario || '—')}
        </strong>

      </div>

    </div>


    <p class="report-disclaimer">

      Los resultados deben interpretarse en conjunto con
      los hallazgos clínicos del paciente. Los valores
      identificados como altos o bajos corresponden a la
      comparación con el intervalo de referencia seleccionado
      para el analizador.

    </p>

  `;
}


/* =========================================================
   LOGO PARA PDF
   RESPETA SIEMPRE LA PROPORCIÓN ORIGINAL
========================================================= */

async function obtenerLogo() {

  try {

    const response =
      await fetch('./img/logo.jpg');

    if (!response.ok) {

      throw new Error(
        'No se pudo cargar el logo.'
      );
    }

    const blob =
      await response.blob();


    const dataURL =
      await new Promise(
        (resolve, reject) => {

          const reader =
            new FileReader();

          reader.onload =
            () =>
              resolve(
                reader.result
              );

          reader.onerror =
            reject;

          reader.readAsDataURL(
            blob
          );
        }
      );


    const dimensiones =
      await new Promise(
        (resolve, reject) => {

          const img =
            new Image();

          img.onload =
            () => {

              resolve({
                ancho:
                  img.naturalWidth,
                alto:
                  img.naturalHeight
              });
            };

          img.onerror =
            reject;

          img.src =
            dataURL;
        }
      );


    return {

      dataURL,

      ancho:
        dimensiones.ancho,

      alto:
        dimensiones.alto
    };

  } catch (error) {

    console.error(
      'No se pudo cargar el logo:',
      error
    );

    return null;
  }
}


/* =========================================================
   PDF
========================================================= */

async function generarPDF(datos) {

  const caja =
    $('#estado-reporte');


  try {

    if (!window.jspdf) {

      throw new Error(
        'No se cargó el generador de PDF.'
      );
    }


    const {
      jsPDF
    } =
      window.jspdf;


    const doc =
      new jsPDF({
        unit: 'pt',
        format: 'letter'
      });


    const azulOscuro =
      [20, 85, 107];

    const azul =
      [23, 121, 151];

    const gris =
      [95, 108, 117];

    const rojo =
      [180, 35, 24];


    /* =====================================================
       LOGO SIN DEFORMAR
    ===================================================== */

    const logo =
      await obtenerLogo();


    let inicioTextoX = 135;


    if (
      logo &&
      logo.ancho > 0 &&
      logo.alto > 0
    ) {

      const anchoMaximo = 82;
      const altoMaximo = 58;

      const proporcion =
        logo.ancho /
        logo.alto;


      let anchoLogo =
        anchoMaximo;

      let altoLogo =
        anchoLogo /
        proporcion;


      if (
        altoLogo >
        altoMaximo
      ) {

        altoLogo =
          altoMaximo;

        anchoLogo =
          altoLogo *
          proporcion;
      }


      doc.addImage(
        logo.dataURL,
        'JPEG',
        42,
        27,
        anchoLogo,
        altoLogo
      );


      inicioTextoX =
        42 +
        anchoLogo +
        14;
    }


    /* =====================================================
       ENCABEZADO
    ===================================================== */

    doc.setTextColor(
      ...azulOscuro
    );

    doc.setFontSize(15);

    doc.setFont(
      undefined,
      'bold'
    );

    doc.text(
      'CLÍNICA VETERINARIA FORTUNA',
      inicioTextoX,
      48
    );


    doc.setFontSize(8.5);

    doc.setFont(
      undefined,
      'normal'
    );

    doc.setTextColor(
      ...gris
    );

    doc.text(
      'Laboratorio Clínico Veterinario',
      inicioTextoX,
      63
    );


    doc.setFontSize(19);

    doc.setFont(
      undefined,
      'bold'
    );

    doc.setTextColor(
      ...azulOscuro
    );

    doc.text(
      'HEMOGRAMA',
      42,
      112
    );


    doc.setFontSize(8.5);

    doc.setFont(
      undefined,
      'normal'
    );

    doc.setTextColor(
      31,
      41,
      55
    );


    doc.text(
      `Reporte: ${datos.reporte}`,
      420,
      45
    );


    doc.text(
      `Fecha: ${fechaTexto(datos.fecha)}`,
      420,
      59
    );


    /* =====================================================
       DATOS DEL PACIENTE
    ===================================================== */

    const informacion = [

      [
        'PACIENTE',
        'PROPIETARIO',
        'ESPECIE'
      ],

      [
        datos.paciente || '—',
        datos.propietario || '—',
        especieTexto(datos)
      ],

      [
        'EDAD',
        'EXPEDIENTE',
        'ANALIZADOR'
      ],

      [
        datos.edad || '—',
        datos.expediente || '—',
        datos.equipo || 'Exigo H400'
      ]
    ];


    doc.autoTable({

      startY: 132,

      body:
        informacion,

      theme:
        'grid',

      styles: {

        fontSize: 8.5,

        cellPadding: 6,

        lineColor:
          [215, 226, 230],

        lineWidth:
          0.5
      },

      didParseCell:
        data => {

          if (
            data.row.index === 0 ||
            data.row.index === 2
          ) {

            data.cell.styles
              .fillColor =
                [238, 246, 248];

            data.cell.styles
              .textColor =
                azulOscuro;

            data.cell.styles
              .fontStyle =
                'bold';

            data.cell.styles
              .fontSize =
                7.5;
          }
        }
    });


    /* =====================================================
       TABLA CBC
    ===================================================== */

    const cuerpo =
      datos.filas.map(
        fila => [

          fila.parametro,

          fila.resultado,

          fila.unidad,

          fila.referencia,

          textoEstado(
            fila.estado
          )
        ]
      );


    doc.autoTable({

      startY:
        doc.lastAutoTable.finalY +
        18,

      head: [[
        'Parámetro',
        'Resultado',
        'Unidad',
        'Referencia',
        'Estado'
      ]],

      body:
        cuerpo,

      theme:
        'grid',

      headStyles: {

        fillColor:
          azul,

        textColor:
          255,

        fontStyle:
          'bold',

        halign:
          'left'
      },

      styles: {

        fontSize:
          8.5,

        cellPadding:
          5,

        lineColor:
          [215, 226, 230],

        lineWidth:
          0.4
      },

      columnStyles: {

        0: {
          fontStyle: 'bold'
        },

        1: {
          halign: 'right'
        },

        3: {
          halign: 'center'
        }
      },


      didParseCell:
        data => {

          if (
            data.section !==
            'body'
          ) {

            return;
          }


          const fila =
            datos.filas[
              data.row.index
            ];


          if (
            fila.estado ===
              'ALTO' ||
            fila.estado ===
              'BAJO'
          ) {

            if (
              data.column.index === 1 ||
              data.column.index === 4
            ) {

              data.cell.styles
                .textColor =
                  rojo;

              data.cell.styles
                .fontStyle =
                  'bold';
            }
          }
        }
    });


    let y =
      doc.lastAutoTable.finalY +
      18;


    /* =====================================================
       RESUMEN DE ALTERACIONES
    ===================================================== */

    const anormales =
      datos.filas.filter(
        fila =>
          fila.estado ===
            'ALTO' ||
          fila.estado ===
            'BAJO'
      );


    doc.setFontSize(
      8.5
    );

    doc.setFont(
      undefined,
      'bold'
    );

    doc.setTextColor(
      ...azulOscuro
    );

    doc.text(
      'RESULTADOS FUERA DE REFERENCIA',
      42,
      y
    );


    y += 14;


    doc.setFont(
      undefined,
      'normal'
    );

    doc.setTextColor(
      31,
      41,
      55
    );


    const textoAnormal =

      anormales.length

        ? anormales
            .map(
              fila =>
                `${fila.parametro}: ${fila.resultado} ${fila.unidad} (${textoEstado(fila.estado)})`
            )
            .join('   ·   ')

        : 'Sin resultados fuera del intervalo de referencia.';


    const lineasAnormales =
      doc.splitTextToSize(
        textoAnormal,
        520
      );


    doc.text(
      lineasAnormales,
      42,
      y
    );


    y +=
      lineasAnormales.length *
      11 +
      20;


    /* =====================================================
       OBSERVACIONES
    ===================================================== */

    if (
      datos.observaciones
    ) {

      doc.setFont(
        undefined,
        'bold'
      );

      doc.setTextColor(
        ...azulOscuro
      );

      doc.text(
        'OBSERVACIONES',
        42,
        y
      );


      y += 14;


      doc.setFont(
        undefined,
        'normal'
      );

      doc.setTextColor(
        31,
        41,
        55
      );


      const lineas =
        doc.splitTextToSize(
          datos.observaciones,
          520
        );


      doc.text(
        lineas,
        42,
        y
      );


      y +=
        lineas.length *
        11 +
        14;
    }


    /* =====================================================
       MÉTODO
    ===================================================== */

    doc.setFontSize(
      7.8
    );

    doc.setTextColor(
      ...gris
    );


    const metodo =
      `Analizador: ${
        datos.equipo ||
        'Exigo H400'
      } · Perfil: ${
        especieTexto(datos)
      } · Médico veterinario: ${
        datos.veterinario ||
        '—'
      }`;


    const lineasMetodo =
      doc.splitTextToSize(
        metodo,
        520
      );


    doc.text(
      lineasMetodo,
      42,
      Math.min(
        y + 10,
        710
      )
    );


    /* =====================================================
       PIE
    ===================================================== */

    doc.setFontSize(
      7
    );

    doc.setTextColor(
      ...gris
    );


    doc.text(
      'Los resultados deben correlacionarse con los hallazgos clínicos del paciente.',
      306,
      748,
      {
        align: 'center'
      }
    );


    doc.text(
      'Clínica Veterinaria Fortuna',
      306,
      761,
      {
        align: 'center'
      }
    );


    doc.save(
      nombreArchivo(
        datos,
        'pdf'
      )
    );


  } catch (error) {

    console.error(error);

    caja.hidden = false;

    caja.className =
      'status-box error';

    caja.textContent =
      error.message ||
      'No se pudo generar el PDF.';
  }
}


/* =========================================================
   WORD
========================================================= */

function generarWord(datos) {

  const filas =
    datos.filas
      .map(fila => `

        <tr>

          <td>
            ${escapar(fila.parametro)}
          </td>

          <td>
            ${escapar(fila.resultado)}
          </td>

          <td>
            ${escapar(fila.unidad)}
          </td>

          <td>
            ${escapar(fila.referencia)}
          </td>

          <td>
            ${escapar(textoEstado(fila.estado))}
          </td>

        </tr>

      `)
      .join('');


  const html = `

<!DOCTYPE html>

<html>

<head>

<meta charset="utf-8">

<style>

body {
  font-family: Arial, sans-serif;
  color: #1f2937;
}

h1 {
  color: #14556b;
  font-size: 19px;
  margin-bottom: 3px;
}

.subtitle {
  color: #607d8b;
  margin-top: 0;
}

.logo {
  max-width: 110px;
  max-height: 80px;
  width: auto;
  height: auto;
}

.header-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 18px;
}

.header-table td {
  vertical-align: middle;
}

.patient {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
}

.patient td {
  width: 33.33%;
  border: 1px solid #d5e2e6;
  padding: 9px;
}

.results {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

.results th,
.results td {
  border: 1px solid #d5e2e6;
  padding: 7px;
  font-size: 9pt;
}

.results th {
  color: white;
  background: #177997;
}

.small {
  color: #607d8b;
  font-size: 8pt;
}

</style>

</head>


<body>

<table class="header-table">

<tr>

<td style="width: 130px;">

<img
  src="./img/logo.jpg"
  class="logo"
  alt="Logo"
>

</td>

<td>

<h1>
CLÍNICA VETERINARIA FORTUNA
</h1>

<p class="subtitle">
Laboratorio Clínico Veterinario
</p>

</td>

</tr>

</table>


<h2>
HEMOGRAMA
</h2>


<table class="patient">

<tr>

<td>
<b>Paciente</b><br>
${escapar(datos.paciente || '—')}
</td>

<td>
<b>Propietario</b><br>
${escapar(datos.propietario || '—')}
</td>

<td>
<b>Especie</b><br>
${escapar(especieTexto(datos))}
</td>

</tr>


<tr>

<td>
<b>Edad</b><br>
${escapar(datos.edad || '—')}
</td>

<td>
<b>Expediente</b><br>
${escapar(datos.expediente || '—')}
</td>

<td>
<b>Fecha</b><br>
${escapar(fechaTexto(datos.fecha))}
</td>

</tr>

</table>


<table class="results">

<tr>

<th>
Parámetro
</th>

<th>
Resultado
</th>

<th>
Unidad
</th>

<th>
Referencia
</th>

<th>
Estado
</th>

</tr>

${filas}

</table>


${
  datos.observaciones
    ? `
      <p>
        <b>Observaciones:</b><br>
        ${escapar(datos.observaciones)}
      </p>
    `
    : ''
}


<p class="small">

Analizador:
${escapar(datos.equipo || 'Exigo H400')}
<br>

Médico veterinario:
${escapar(datos.veterinario || '—')}

</p>


</body>

</html>
`;


  const blob =
    new Blob(
      [
        '\ufeff',
        html
      ],
      {
        type:
          'application/msword'
      }
    );


  const enlace =
    document.createElement('a');


  enlace.href =
    URL.createObjectURL(
      blob
    );


  enlace.download =
    nombreArchivo(
      datos,
      'doc'
    );


  document.body.appendChild(
    enlace
  );


  enlace.click();


  setTimeout(
    () => {

      URL.revokeObjectURL(
        enlace.href
      );

      enlace.remove();

    },
    1000
  );
}
