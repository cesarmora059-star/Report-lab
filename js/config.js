'use strict';

/*
 * CONFIGURACIÓN CENTRAL DEL EXIGO
 *
 * Las posiciones x/y están expresadas como proporciones de la pantalla
 * detectada. Esto permite que una foto de 1500px y otra de 3000px
 * utilicen la misma plantilla.
 */

window.VETLAB_CONFIG = {

  perro: {
    codigo: 'DOG',
    nombre: 'Canino',

    parametros: [
      {
        id: 'WBC',
        nombre: 'WBC',
        decimales: 1,
        minimo: 6.0,
        maximo: 17.0,
        unidad: '×10⁹/L',
        y: 0.125
      },
      {
        id: 'LYM',
        nombre: 'LYM',
        decimales: 1,
        minimo: 0.9,
        maximo: 5.0,
        unidad: '×10⁹/L',
        y: 0.168
      },
      {
        id: 'MONO',
        nombre: 'MONO',
        decimales: 1,
        minimo: 0.3,
        maximo: 1.5,
        unidad: '×10⁹/L',
        y: 0.205
      },
      {
        id: 'NEUT',
        nombre: 'NEUT',
        decimales: 1,
        minimo: 3.5,
        maximo: 12.0,
        unidad: '×10⁹/L',
        y: 0.243
      },
      {
        id: 'EOS',
        nombre: 'EOS',
        decimales: 1,
        minimo: 0.1,
        maximo: 1.5,
        unidad: '×10⁹/L',
        y: 0.281
      },

      {
        id: 'HGB',
        nombre: 'HGB',
        decimales: 1,
        minimo: 12.0,
        maximo: 18.0,
        unidad: 'g/dL',
        y: 0.332
      },
      {
        id: 'HCT',
        nombre: 'HCT',
        decimales: 1,
        minimo: 37.0,
        maximo: 55.0,
        unidad: '%',
        y: 0.386
      },
      {
        id: 'RBC',
        nombre: 'RBC',
        decimales: 2,
        minimo: 5.50,
        maximo: 8.50,
        unidad: '×10¹²/L',
        y: 0.431
      },
      {
        id: 'MCV',
        nombre: 'MCV',
        decimales: 1,
        minimo: 60.0,
        maximo: 72.0,
        unidad: 'fL',
        y: 0.465
      },
      {
        id: 'MCHC',
        nombre: 'MCHC',
        decimales: 1,
        minimo: 32.0,
        maximo: 38.5,
        unidad: 'g/dL',
        y: 0.510
      },
      {
        id: 'RDW',
        nombre: 'RDW%',
        decimales: 1,
        minimo: 12.0,
        maximo: 17.5,
        unidad: '%',
        y: 0.552
      },
      {
        id: 'PLT',
        nombre: 'PLT',
        decimales: 0,
        minimo: 200,
        maximo: 500,
        unidad: '×10⁹/L',
        y: 0.603
      }
    ]
  },

  gato: {
    codigo: 'CAT',
    nombre: 'Felino',

    parametros: [
      {
        id: 'WBC',
        nombre: 'WBC',
        decimales: 1,
        minimo: 5.5,
        maximo: 19.5,
        unidad: '×10⁹/L',
        y: 0.157
      },
      {
        id: 'LYM',
        nombre: 'LYM',
        decimales: 1,
        minimo: 1.0,
        maximo: 7.0,
        unidad: '×10⁹/L',
        y: 0.213
      },
      {
        id: 'MONO',
        nombre: 'MONO',
        decimales: 1,
        minimo: 0.2,
        maximo: 1.0,
        unidad: '×10⁹/L',
        y: 0.261
      },
      {
        id: 'GRAN',
        nombre: 'GRAN',
        decimales: 1,
        minimo: 2.8,
        maximo: 13.0,
        unidad: '×10⁹/L',
        y: 0.310
      },

      {
        id: 'HGB',
        nombre: 'HGB',
        decimales: 1,
        minimo: 8.0,
        maximo: 15.0,
        unidad: 'g/dL',
        y: 0.414
      },
      {
        id: 'HCT',
        nombre: 'HCT',
        decimales: 1,
        minimo: 25.0,
        maximo: 45.0,
        unidad: '%',
        y: 0.480
      },
      {
        id: 'RBC',
        nombre: 'RBC',
        decimales: 2,
        minimo: 5.00,
        maximo: 11.00,
        unidad: '×10¹²/L',
        y: 0.534
      },
      {
        id: 'MCV',
        nombre: 'MCV',
        decimales: 1,
        minimo: 39.0,
        maximo: 50.0,
        unidad: 'fL',
        y: 0.580
      },
      {
        id: 'MCHC',
        nombre: 'MCHC',
        decimales: 1,
        minimo: 31.0,
        maximo: 38.5,
        unidad: 'g/dL',
        y: 0.626
      },
      {
        id: 'RDW',
        nombre: 'RDW%',
        decimales: 1,
        minimo: 14.0,
        maximo: 18.5,
        unidad: '%',
        y: 0.672
      },
      {
        id: 'PLT',
        nombre: 'PLT',
        decimales: 0,
        minimo: 200,
        maximo: 500,
        unidad: '×10⁹/L',
        y: 0.727
      }
    ]
  }
};
