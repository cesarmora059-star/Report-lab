'use strict';


window.ExigoReader = (() => {


    /* =====================================================
       CONFIGURACIÓN
    ===================================================== */

    const CONFIG = {


        perro: {

            code:
                'DOG',

            label:
                'Canino',

            parameters: [

                {
                    id: 'WBC',
                    name: 'WBC',
                    decimals: 1,
                    min: 6.0,
                    max: 17.0,
                    unit: '×10⁹/L',
                    y: 0.118
                },

                {
                    id: 'LYM',
                    name: 'LYM',
                    decimals: 1,
                    min: 0.9,
                    max: 5.0,
                    unit: '×10⁹/L',
                    y: 0.160
                },

                {
                    id: 'MONO',
                    name: 'MONO',
                    decimals: 1,
                    min: 0.3,
                    max: 1.5,
                    unit: '×10⁹/L',
                    y: 0.202
                },

                {
                    id: 'NEUT',
                    name: 'NEUT',
                    decimals: 1,
                    min: 3.5,
                    max: 12.0,
                    unit: '×10⁹/L',
                    y: 0.244
                },

                {
                    id: 'EOS',
                    name: 'EOS',
                    decimals: 1,
                    min: 0.1,
                    max: 1.5,
                    unit: '×10⁹/L',
                    y: 0.286
                },

                {
                    id: 'HGB',
                    name: 'HGB',
                    decimals: 1,
                    min: 12.0,
                    max: 18.0,
                    unit: 'g/dL',
                    y: 0.340
                },

                {
                    id: 'HCT',
                    name: 'HCT',
                    decimals: 1,
                    min: 37.0,
                    max: 55.0,
                    unit: '%',
                    y: 0.390
                },

                {
                    id: 'RBC',
                    name: 'RBC',
                    decimals: 2,
                    min: 5.50,
                    max: 8.50,
                    unit: '×10¹²/L',
                    y: 0.438
                },

                {
                    id: 'MCV',
                    name: 'MCV',
                    decimals: 1,
                    min: 60.0,
                    max: 72.0,
                    unit: 'fL',
                    y: 0.480
                },

                {
                    id: 'MCHC',
                    name: 'MCHC',
                    decimals: 1,
                    min: 32.0,
                    max: 38.5,
                    unit: 'g/dL',
                    y: 0.522
                },

                {
                    id: 'RDW',
                    name: 'RDW%',
                    decimals: 1,
                    min: 12.0,
                    max: 17.5,
                    unit: '%',
                    y: 0.564
                },

                {
                    id: 'PLT',
                    name: 'PLT',
                    decimals: 0,
                    min: 200,
                    max: 500,
                    unit: '×10⁹/L',
                    y: 0.615
                }
            ]
        },


        gato: {

            code:
                'CAT',

            label:
                'Felino',

            parameters: [

                {
                    id: 'WBC',
                    name: 'WBC',
                    decimals: 1,
                    min: 5.5,
                    max: 19.5,
                    unit: '×10⁹/L',
                    y: 0.142
                },

                {
                    id: 'LYM',
                    name: 'LYM',
                    decimals: 1,
                    min: 1.0,
                    max: 7.0,
                    unit: '×10⁹/L',
                    y: 0.192
                },

                {
                    id: 'MONO',
                    name: 'MONO',
                    decimals: 1,
                    min: 0.2,
                    max: 1.0,
                    unit: '×10⁹/L',
                    y: 0.242
                },

                {
                    id: 'GRAN',
                    name: 'GRAN',
                    decimals: 1,
                    min: 2.8,
                    max: 13.0,
                    unit: '×10⁹/L',
                    y: 0.292
                },

                {
                    id: 'HGB',
                    name: 'HGB',
                    decimals: 1,
                    min: 8.0,
                    max: 15.0,
                    unit: 'g/dL',
                    y: 0.390
                },

                {
                    id: 'HCT',
                    name: 'HCT',
                    decimals: 1,
                    min: 25.0,
                    max: 45.0,
                    unit: '%',
                    y: 0.445
                },

                {
                    id: 'RBC',
                    name: 'RBC',
                    decimals: 2,
                    min: 5.00,
                    max: 11.00,
                    unit: '×10¹²/L',
                    y: 0.495
                },

                {
                    id: 'MCV',
                    name: 'MCV',
                    decimals: 1,
                    min: 39.0,
                    max: 50.0,
                    unit: 'fL',
                    y: 0.540
                },

                {
                    id: 'MCHC',
                    name: 'MCHC',
                    decimals: 1,
                    min: 31.0,
                    max: 38.5,
                    unit: 'g/dL',
                    y: 0.585
                },

                {
                    id: 'RDW',
                    name: 'RDW%',
                    decimals: 1,
                    min: 14.0,
                    max: 18.5,
                    unit: '%',
                    y: 0.630
                },

                {
                    id: 'PLT',
                    name: 'PLT',
                    decimals: 0,
                    min: 200,
                    max: 500,
                    unit: '×10⁹/L',
                    y: 0.686
                }
            ]
        }
    };



    /* =====================================================
       IMAGEN
    ===================================================== */

    function loadImage(
        dataURL
    ) {

        return new Promise(
            (
                resolve,
                reject
            ) => {

                const image =
                    new Image();


                image.onload =
                    () => resolve(image);


                image.onerror =
                    () => reject(
                        new Error(
                            'No se pudo abrir la imagen del Exigo.'
                        )
                    );


                image.src =
                    dataURL;
            }
        );
    }



    function imageToCanvas(
        image
    ) {

        const canvas =
            document.createElement(
                'canvas'
            );


        canvas.width =
            image.naturalWidth;


        canvas.height =
            image.naturalHeight;


        canvas
            .getContext(
                '2d'
            )
            .drawImage(
                image,
                0,
                0
            );


        return canvas;
    }



    function crop(
        source,
        x,
        y,
        width,
        height,
        scale = 4
    ) {

        const sx =
            Math.max(
                0,
                Math.round(
                    source.width * x
                )
            );


        const sy =
            Math.max(
                0,
                Math.round(
                    source.height * y
                )
            );


        const sw =
            Math.max(
                1,
                Math.round(
                    source.width *
                    width
                )
            );


        const sh =
            Math.max(
                1,
                Math.round(
                    source.height *
                    height
                )
            );


        const output =
            document.createElement(
                'canvas'
            );


        output.width =
            sw * scale;


        output.height =
            sh * scale;


        output
            .getContext(
                '2d',
                {
                    willReadFrequently: true
                }
            )
            .drawImage(

                source,

                sx,
                sy,
                sw,
                sh,

                0,
                0,
                output.width,
                output.height
            );


        return output;
    }



    /* =====================================================
       PREPROCESAMIENTO
    ===================================================== */

    function thresholdCanvas(
        source,
        threshold
    ) {

        const output =
            document.createElement(
                'canvas'
            );


        output.width =
            source.width;


        output.height =
            source.height;


        const ctx =
            output.getContext(
                '2d',
                {
                    willReadFrequently: true
                }
            );


        ctx.drawImage(
            source,
            0,
            0
        );


        const imageData =
            ctx.getImageData(
                0,
                0,
                output.width,
                output.height
            );


        const data =
            imageData.data;


        for (
            let i = 0;
            i < data.length;
            i += 4
        ) {

            const gray =

                data[i] * 0.299 +

                data[i + 1] * 0.587 +

                data[i + 2] * 0.114;


            const value =
                gray >= threshold
                    ? 255
                    : 0;


            data[i] =
                value;

            data[i + 1] =
                value;

            data[i + 2] =
                value;
        }


        ctx.putImageData(
            imageData,
            0,
            0
        );


        return output;
    }



    function grayContrastCanvas(
        source
    ) {

        const output =
            document.createElement(
                'canvas'
            );


        output.width =
            source.width;


        output.height =
            source.height;


        const ctx =
            output.getContext(
                '2d',
                {
                    willReadFrequently: true
                }
            );


        ctx.drawImage(
            source,
            0,
            0
        );


        const imageData =
            ctx.getImageData(
                0,
                0,
                output.width,
                output.height
            );


        const data =
            imageData.data;


        for (
            let i = 0;
            i < data.length;
            i += 4
        ) {

            let gray =

                data[i] * 0.299 +

                data[i + 1] * 0.587 +

                data[i + 2] * 0.114;


            gray =
                (gray - 128) *
                1.55 +
                128;


            gray =
                Math.max(
                    0,
                    Math.min(
                        255,
                        gray
                    )
                );


            data[i] =
                gray;

            data[i + 1] =
                gray;

            data[i + 2] =
                gray;
        }


        ctx.putImageData(
            imageData,
            0,
            0
        );


        return output;
    }



    /* =====================================================
       OCR
    ===================================================== */

    async function recognize(
        worker,
        canvas,
        whitelist,
        pageSegMode = '7'
    ) {

        await worker.setParameters({

            tessedit_pageseg_mode:
                pageSegMode,

            tessedit_char_whitelist:
                whitelist,

            preserve_interword_spaces:
                '1'
        });


        const result =
            await worker.recognize(
                canvas
            );


        return {

            text:
                String(
                    result.data.text || ''
                ).trim(),

            confidence:
                Number(
                    result.data.confidence || 0
                )
        };
    }



    /* =====================================================
       NOMBRES
    ===================================================== */

    function normalizeName(
        value
    ) {

        const text =
            String(
                value || ''
            )
                .trim()
                .replace(
                    /\s+/g,
                    ' '
                )
                .toLowerCase();


        if (!text) {

            return '';
        }


        return text
            .split(' ')
            .map(
                word =>

                    word
                        .split('-')
                        .map(
                            piece =>

                                piece
                                    ? (
                                        piece
                                            .charAt(0)
                                            .toUpperCase() +

                                        piece
                                            .slice(1)
                                    )
                                    : ''
                        )
                        .join('-')
            )
            .join(' ');
    }



    function cleanNameOCR(
        value
    ) {

        return String(
            value || ''
        )

            .toUpperCase()

            .replace(
                /\bID2?\b\s*:?\s*/g,
                ' '
            )

            .replace(
                /\bDOG\b|\bCAT\b|\b3P\b|\bOT\b/g,
                ' '
            )

            .replace(
                /[^A-ZÁÉÍÓÚÜÑ0-9 -]/g,
                ' '
            )

            .replace(
                /\s+/g,
                ' '
            )

            .trim();
    }



    async function readIdentity(
        worker,
        screen
    ) {

        /*
         * Fila ID
         */

        const ownerCrop =
            crop(
                screen,
                0.00,
                0.010,
                0.76,
                0.052,
                4
            );


        /*
         * Fila ID2
         */

        const patientCrop =
            crop(
                screen,
                0.00,
                0.057,
                0.76,
                0.052,
                4
            );


        const ownerReading =
            await recognize(
                worker,
                grayContrastCanvas(
                    ownerCrop
                ),
                'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -:',
                '7'
            );


        const patientReading =
            await recognize(
                worker,
                grayContrastCanvas(
                    patientCrop
                ),
                'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -:',
                '7'
            );


        return {

            owner:
                normalizeName(
                    cleanNameOCR(
                        ownerReading.text
                    )
                ),

            patient:
                normalizeName(
                    cleanNameOCR(
                        patientReading.text
                    )
                ),

            ownerConfidence:
                ownerReading.confidence,

            patientConfidence:
                patientReading.confidence
        };
    }



    /* =====================================================
       ESPECIE
    ===================================================== */

    async function detectSpecies(
        worker,
        screen
    ) {

        const header =
            crop(
                screen,
                0.72,
                0.035,
                0.27,
                0.075,
                4
            );


        const headerReading =
            await recognize(
                worker,
                grayContrastCanvas(
                    header
                ),
                'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
                '7'
            );


        const headerText =
            headerReading.text
                .toUpperCase();


        if (
            headerText.includes(
                'DOG'
            )
        ) {

            return 'perro';
        }


        if (
            headerText.includes(
                'CAT'
            )
        ) {

            return 'gato';
        }


        /*
         * Segundo intento:
         * buscar GRAN / NEUT / EOS.
         */

        const differential =
            crop(
                screen,
                0.00,
                0.13,
                0.28,
                0.22,
                4
            );


        const differentialReading =
            await recognize(
                worker,
                grayContrastCanvas(
                    differential
                ),
                'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
                '6'
            );


        const text =
            differentialReading.text
                .toUpperCase();


        if (
            text.includes('GRAN')
        ) {

            return 'gato';
        }


        if (
            text.includes('NEUT') ||
            text.includes('EOS')
        ) {

            return 'perro';
        }


        return '';
    }



    /* =====================================================
       NÚMEROS
    ===================================================== */

    function parseNumeric(
        rawText,
        decimals
    ) {

        let text =
            String(
                rawText || ''
            )
                .trim()
                .replace(
                    /,/g,
                    '.'
                )
                .replace(
                    /O/gi,
                    '0'
                )
                .replace(
                    /[^0-9.]/g,
                    ''
                );


        if (!text) {

            return '';
        }


        const parts =
            text.split('.');


        if (
            parts.length > 2
        ) {

            text =
                parts.shift() +
                '.' +
                parts.join('');
        }


        /*
         * El Exigo usa decimales fijos.
         *
         * Ejemplo:
         * OCR = 196
         * HGB = 19.6
         */

        if (
            !text.includes('.') &&
            decimals > 0
        ) {

            const digits =
                text.replace(
                    /\D/g,
                    ''
                );


            if (
                digits.length >
                decimals
            ) {

                text =

                    digits.slice(
                        0,
                        -decimals
                    ) +

                    '.' +

                    digits.slice(
                        -decimals
                    );
            }
        }


        const number =
            Number(text);


        if (
            !Number.isFinite(
                number
            )
        ) {

            return '';
        }


        if (
            decimals === 0
        ) {

            return String(
                Math.round(
                    number
                )
            );
        }


        return number.toFixed(
            decimals
        );
    }



    async function readNumber(
        worker,
        screen,
        parameter
    ) {

        /*
         * SOLO la columna numérica.
         *
         * No intentamos OCR sobre etiquetas,
         * referencias ni H/L.
         */

        const numberCrop =
            crop(
                screen,

                0.225,

                parameter.y -
                    0.020,

                0.245,

                0.044,

                5
            );


        /*
         * Primera lectura:
         * umbral medio
         */

        const versionA =
            thresholdCanvas(
                numberCrop,
                155
            );


        const readingA =
            await recognize(
                worker,
                versionA,
                '0123456789.',
                '7'
            );


        const valueA =
            parseNumeric(
                readingA.text,
                parameter.decimals
            );


        /*
         * Si la confianza es razonable,
         * usamos esa lectura.
         */

        if (
            valueA &&
            readingA.confidence >= 58
        ) {

            return {

                value:
                    valueA,

                confidence:
                    readingA.confidence,

                raw:
                    readingA.text
            };
        }


        /*
         * Segunda lectura:
         * otro umbral.
         */

        const versionB =
            thresholdCanvas(
                numberCrop,
                180
            );


        const readingB =
            await recognize(
                worker,
                versionB,
                '0123456789.',
                '7'
            );


        const valueB =
            parseNumeric(
                readingB.text,
                parameter.decimals
            );


        /*
         * Si coinciden, excelente.
         */

        if (
            valueA &&
            valueB &&
            valueA === valueB
        ) {

            return {

                value:
                    valueA,

                confidence:
                    Math.max(
                        readingA.confidence,
                        readingB.confidence
                    ),

                raw:
                    `${readingA.text} / ${readingB.text}`
            };
        }


        /*
         * Elegimos la lectura con mayor confianza.
         */

        if (
            valueB &&
            readingB.confidence >
            readingA.confidence
        ) {

            return {

                value:
                    valueB,

                confidence:
                    readingB.confidence,

                raw:
                    readingB.text
            };
        }


        return {

            value:
                valueA,

            confidence:
                readingA.confidence,

            raw:
                readingA.text
        };
    }



    async function readParameters(
        worker,
        screen,
        species,
        progress
    ) {

        const parameters =
            CONFIG[
                species
            ].parameters;


        const output = [];


        for (
            let i = 0;
            i < parameters.length;
            i++
        ) {

            const parameter =
                parameters[i];


            if (progress) {

                progress({

                    stage:
                        'parameter',

                    name:
                        parameter.name,

                    current:
                        i + 1,

                    total:
                        parameters.length
                });
            }


            const reading =
                await readNumber(
                    worker,
                    screen,
                    parameter
                );


            output.push({

                ...parameter,

                value:
                    reading.value,

                confidence:
                    reading.confidence,

                raw:
                    reading.raw
            });
        }


        return output;
    }



    /* =====================================================
       ESTADO
    ===================================================== */

    function statusFor(
        value,
        parameter
    ) {

        const number =
            Number(value);


        if (
            !Number.isFinite(
                number
            )
        ) {

            return 'REVISAR';
        }


        if (
            number <
            parameter.min
        ) {

            return 'BAJO';
        }


        if (
            number >
            parameter.max
        ) {

            return 'ALTO';
        }


        return 'NORMAL';
    }



    /* =====================================================
       VALIDACIÓN
    ===================================================== */

    function relativeDifference(
        a,
        b
    ) {

        const divisor =
            Math.max(
                Math.abs(a),
                Math.abs(b),
                0.0001
            );


        return (
            Math.abs(
                a - b
            ) /
            divisor
        );
    }



    function validate(
        species,
        parameters
    ) {

        const messages = [];


        const map =
            Object.fromEntries(

                parameters.map(
                    item => [

                        item.id,

                        Number(
                            item.value
                        )
                    ]
                )
            );


        /*
         * DIFERENCIAL
         */

        if (
            species === 'perro'
        ) {

            const required = [

                map.WBC,
                map.LYM,
                map.MONO,
                map.NEUT,
                map.EOS
            ];


            if (
                required.every(
                    Number.isFinite
                )
            ) {

                const total =

                    map.LYM +

                    map.MONO +

                    map.NEUT +

                    map.EOS;


                if (
                    relativeDifference(
                        map.WBC,
                        total
                    ) > 0.06
                ) {

                    messages.push({

                        type:
                            'warning',

                        text:
                            `Revisar diferencial: LYM + MONO + NEUT + EOS = ${total.toFixed(1)}, pero WBC = ${map.WBC.toFixed(1)}.`
                    });
                }
            }

        } else {

            const required = [

                map.WBC,
                map.LYM,
                map.MONO,
                map.GRAN
            ];


            if (
                required.every(
                    Number.isFinite
                )
            ) {

                const total =

                    map.LYM +

                    map.MONO +

                    map.GRAN;


                if (
                    relativeDifference(
                        map.WBC,
                        total
                    ) > 0.06
                ) {

                    messages.push({

                        type:
                            'warning',

                        text:
                            `Revisar diferencial: LYM + MONO + GRAN = ${total.toFixed(1)}, pero WBC = ${map.WBC.toFixed(1)}.`
                    });
                }
            }
        }



        /*
         * HCT = RBC × MCV / 10
         */

        if (
            [
                map.RBC,
                map.MCV,
                map.HCT
            ]
                .every(
                    Number.isFinite
                )
        ) {

            const expectedHCT =

                map.RBC *
                map.MCV /
                10;


            if (
                relativeDifference(
                    expectedHCT,
                    map.HCT
                ) > 0.05
            ) {

                messages.push({

                    type:
                        'warning',

                    text:
                        `Revisar RBC, MCV o HCT. El cálculo esperado de HCT es aproximadamente ${expectedHCT.toFixed(1)}%.`
                });
            }
        }



        /*
         * MCHC = HGB / HCT × 100
         */

        if (
            [
                map.HGB,
                map.HCT,
                map.MCHC
            ]
                .every(
                    Number.isFinite
                ) &&
            map.HCT !== 0
        ) {

            const expectedMCHC =

                map.HGB /
                map.HCT *
                100;


            if (
                relativeDifference(
                    expectedMCHC,
                    map.MCHC
                ) > 0.06
            ) {

                messages.push({

                    type:
                        'warning',

                    text:
                        `Revisar HGB, HCT o MCHC. El cálculo esperado de MCHC es aproximadamente ${expectedMCHC.toFixed(1)} g/dL.`
                });
            }
        }



        parameters.forEach(
            parameter => {

                if (
                    !parameter.value
                ) {

                    messages.push({

                        type:
                            'error',

                        text:
                            `No se pudo confirmar ${parameter.name}.`
                    });

                } else if (
                    parameter.confidence <
                    50
                ) {

                    messages.push({

                        type:
                            'warning',

                        text:
                            `${parameter.name} tuvo baja confianza de lectura. Confirme visualmente el resultado.`
                    });
                }
            }
        );


        return messages;
    }



    /* =====================================================
       LECTURA COMPLETA
    ===================================================== */

    async function read(
        imageDataURL,
        progress
    ) {

        if (
            !window.Tesseract
        ) {

            throw new Error(
                'No se pudo cargar el motor OCR.'
            );
        }


        if (progress) {

            progress({
                stage:
                    'image'
            });
        }


        const image =
            await loadImage(
                imageDataURL
            );


        const screen =
            imageToCanvas(
                image
            );


        if (progress) {

            progress({
                stage:
                    'ocr'
            });
        }


        const worker =
            await Tesseract.createWorker(
                'eng'
            );


        try {

            if (progress) {

                progress({
                    stage:
                        'species'
                });
            }


            let species =
                await detectSpecies(
                    worker,
                    screen
                );


            /*
             * Si no se logra distinguir,
             * no inventamos.
             *
             * Empezamos con perro únicamente
             * como estructura provisional y
             * exigimos confirmación.
             */

            const speciesDetected =
                Boolean(
                    species
                );


            if (!species) {

                species =
                    'perro';
            }


            if (progress) {

                progress({
                    stage:
                        'identity'
                });
            }


            const identity =
                await readIdentity(
                    worker,
                    screen
                );


            const parameters =
                await readParameters(
                    worker,
                    screen,
                    species,
                    progress
                );


            const validations =
                validate(
                    species,
                    parameters
                );


            return {

                species,

                speciesDetected,

                identity,

                parameters,

                validations,

                config:
                    CONFIG[
                        species
                    ]
            };

        } finally {

            await worker.terminate();
        }
    }



    function getConfig(
        species
    ) {

        return CONFIG[
            species
        ];
    }



    return {

        read,

        validate,

        statusFor,

        getConfig,

        normalizeName
    };

})();
