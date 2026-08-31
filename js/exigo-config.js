'use strict';


window.EXIGO_CONFIG = {

    /*
     * Todas las coordenadas son relativas.
     *
     * 0 = inicio de la imagen
     * 1 = final de la imagen
     *
     * Así funcionan aunque la imagen tenga
     * diferentes resoluciones.
     */

    screen: {

        owner: {
            id: 'owner',
            label: 'ID',
            type: 'text',

            x: 0.02,
            y: 0.008,
            width: 0.72,
            height: 0.055
        },


        patient: {
            id: 'patient',
            label: 'ID2',
            type: 'text',

            x: 0.02,
            y: 0.057,
            width: 0.72,
            height: 0.055
        },


        species: {
            id: 'species',
            label: 'DOG / CAT',
            type: 'species',

            x: 0.72,
            y: 0.035,
            width: 0.27,
            height: 0.075
        }
    },


    /* =====================================================
       CANINO
    ===================================================== */

    perro: {

        code: 'DOG',

        label: 'Canino',

        parameters: [

            {
                id: 'WBC',
                label: 'WBC',

                decimals: 1,

                min: 6.0,
                max: 17.0,

                unit: '×10⁹/L',

                x: 0.225,
                y: 0.118,

                width: 0.245,
                height: 0.044
            },


            {
                id: 'LYM',
                label: 'LYM',

                decimals: 1,

                min: 0.9,
                max: 5.0,

                unit: '×10⁹/L',

                x: 0.225,
                y: 0.160,

                width: 0.245,
                height: 0.044
            },


            {
                id: 'MONO',
                label: 'MONO',

                decimals: 1,

                min: 0.3,
                max: 1.5,

                unit: '×10⁹/L',

                x: 0.225,
                y: 0.202,

                width: 0.245,
                height: 0.044
            },


            {
                id: 'NEUT',
                label: 'NEUT',

                decimals: 1,

                min: 3.5,
                max: 12.0,

                unit: '×10⁹/L',

                x: 0.225,
                y: 0.244,

                width: 0.245,
                height: 0.044
            },


            {
                id: 'EOS',
                label: 'EOS',

                decimals: 1,

                min: 0.1,
                max: 1.5,

                unit: '×10⁹/L',

                x: 0.225,
                y: 0.286,

                width: 0.245,
                height: 0.044
            },


            {
                id: 'HGB',
                label: 'HGB',

                decimals: 1,

                min: 12.0,
                max: 18.0,

                unit: 'g/dL',

                x: 0.225,
                y: 0.340,

                width: 0.245,
                height: 0.044
            },


            {
                id: 'HCT',
                label: 'HCT',

                decimals: 1,

                min: 37.0,
                max: 55.0,

                unit: '%',

                x: 0.225,
                y: 0.390,

                width: 0.245,
                height: 0.044
            },


            {
                id: 'RBC',
                label: 'RBC',

                decimals: 2,

                min: 5.50,
                max: 8.50,

                unit: '×10¹²/L',

                x: 0.225,
                y: 0.438,

                width: 0.245,
                height: 0.044
            },


            {
                id: 'MCV',
                label: 'MCV',

                decimals: 1,

                min: 60.0,
                max: 72.0,

                unit: 'fL',

                x: 0.225,
                y: 0.480,

                width: 0.245,
                height: 0.044
            },


            {
                id: 'MCHC',
                label: 'MCHC',

                decimals: 1,

                min: 32.0,
                max: 38.5,

                unit: 'g/dL',

                x: 0.225,
                y: 0.522,

                width: 0.245,
                height: 0.044
            },


            {
                id: 'RDW',
                label: 'RDW%',

                decimals: 1,

                min: 12.0,
                max: 17.5,

                unit: '%',

                x: 0.225,
                y: 0.564,

                width: 0.245,
                height: 0.044
            },


            {
                id: 'PLT',
                label: 'PLT',

                decimals: 0,

                min: 200,
                max: 500,

                unit: '×10⁹/L',

                x: 0.225,
                y: 0.615,

                width: 0.245,
                height: 0.044
            }
        ]
    },


    /* =====================================================
       FELINO
    ===================================================== */

    gato: {

        code: 'CAT',

        label: 'Felino',

        parameters: [

            {
                id: 'WBC',
                label: 'WBC',

                decimals: 1,

                min: 5.5,
                max: 19.5,

                unit: '×10⁹/L',

                x: 0.225,
                y: 0.142,

                width: 0.245,
                height: 0.044
            },


            {
                id: 'LYM',
                label: 'LYM',

                decimals: 1,

                min: 1.0,
                max: 7.0,

                unit: '×10⁹/L',

                x: 0.225,
                y: 0.192,

                width: 0.245,
                height: 0.044
            },


            {
                id: 'MONO',
                label: 'MONO',

                decimals: 1,

                min: 0.2,
                max: 1.0,

                unit: '×10⁹/L',

                x: 0.225,
                y: 0.242,

                width: 0.245,
                height: 0.044
            },


            {
                id: 'GRAN',
                label: 'GRAN',

                decimals: 1,

                min: 2.8,
                max: 13.0,

                unit: '×10⁹/L',

                x: 0.225,
                y: 0.292,

                width: 0.245,
                height: 0.044
            },


            {
                id: 'HGB',
                label: 'HGB',

                decimals: 1,

                min: 8.0,
                max: 15.0,

                unit: 'g/dL',

                x: 0.225,
                y: 0.390,

                width: 0.245,
                height: 0.044
            },


            {
                id: 'HCT',
                label: 'HCT',

                decimals: 1,

                min: 25.0,
                max: 45.0,

                unit: '%',

                x: 0.225,
                y: 0.445,

                width: 0.245,
                height: 0.044
            },


            {
                id: 'RBC',
                label: 'RBC',

                decimals: 2,

                min: 5.00,
                max: 11.00,

                unit: '×10¹²/L',

                x: 0.225,
                y: 0.495,

                width: 0.245,
                height: 0.044
            },


            {
                id: 'MCV',
                label: 'MCV',

                decimals: 1,

                min: 39.0,
                max: 50.0,

                unit: 'fL',

                x: 0.225,
                y: 0.540,

                width: 0.245,
                height: 0.044
            },


            {
                id: 'MCHC',
                label: 'MCHC',

                decimals: 1,

                min: 31.0,
                max: 38.5,

                unit: 'g/dL',

                x: 0.225,
                y: 0.585,

                width: 0.245,
                height: 0.044
            },


            {
                id: 'RDW',
                label: 'RDW%',

                decimals: 1,

                min: 14.0,
                max: 18.5,

                unit: '%',

                x: 0.225,
                y: 0.630,

                width: 0.245,
                height: 0.044
            },


            {
                id: 'PLT',
                label: 'PLT',

                decimals: 0,

                min: 200,
                max: 500,

                unit: '×10⁹/L',

                x: 0.225,
                y: 0.686,

                width: 0.245,
                height: 0.044
            }
        ]
    }
};
