'use strict';


window.VetLabCamera = (() => {

    let stream = null;

    let video = null;

    let canvas = null;

    let context = null;

    let guideElement = null;

    let qualityTimer = null;


    /* =====================================================
       CONFIGURACIÓN DE LA GUÍA EXIGO

       Esta geometría corresponde a la guía visual:

       left:   19%
       top:    20%
       width:  62%
       height: 57%

       La parte inferior es ligeramente más estrecha.
    ===================================================== */

    const GUIDE = {

        left: 0.19,

        top: 0.20,

        width: 0.62,

        height: 0.57,

        /*
         * Cada esquina inferior entra un 2.5%
         * respecto al ancho total de la guía.
         */

        bottomInset: 0.025
    };


    const LIMITS = {

        minBrightness: 42,

        maxBrightness: 238,

        minSharpness: 45,

        maxGlare: 0.20
    };


    /* =====================================================
       INICIALIZAR CÁMARA
    ===================================================== */

    async function init(
        videoElement,
        canvasElement,
        guide
    ) {

        stop();


        video =
            videoElement;


        canvas =
            canvasElement;


        guideElement =
            guide || null;


        context =
            canvas.getContext(
                '2d',
                {
                    willReadFrequently: true
                }
            );


        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {

            throw new Error(
                'El navegador no permite utilizar la cámara.'
            );
        }


        stream =
            await navigator.mediaDevices.getUserMedia({

                audio: false,

                video: {

                    facingMode: {
                        ideal: 'environment'
                    },

                    width: {
                        ideal: 1920
                    },

                    height: {
                        ideal: 1080
                    }
                }
            });


        video.srcObject =
            stream;


        await new Promise(resolve => {

            if (
                video.readyState >= 2
            ) {

                resolve();

                return;
            }


            video.onloadedmetadata =
                () => resolve();
        });


        await video.play();
    }


    /* =====================================================
       DETENER CÁMARA
    ===================================================== */

    function stop() {

        if (qualityTimer) {

            clearInterval(
                qualityTimer
            );

            qualityTimer =
                null;
        }


        if (stream) {

            stream
                .getTracks()
                .forEach(
                    track =>
                        track.stop()
                );

            stream =
                null;
        }
    }


    /* =====================================================
       FRAME ORIGINAL
    ===================================================== */

    function drawVideoFrame() {

        if (
            !video ||
            !video.videoWidth ||
            !video.videoHeight
        ) {

            return false;
        }


        canvas.width =
            video.videoWidth;


        canvas.height =
            video.videoHeight;


        context.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height
        );


        return true;
    }


    /* =====================================================
       MAPEO VISOR → IMAGEN REAL

       El video usa object-fit: cover.

       Eso significa que Safari puede recortar parte de la
       imagen original para llenar el visor.

       Esta función calcula exactamente qué píxel original
       corresponde a una posición visible de la pantalla.
    ===================================================== */

    function screenPointToSource(
        displayX,
        displayY
    ) {

        const displayWidth =
            video.clientWidth;


        const displayHeight =
            video.clientHeight;


        const sourceWidth =
            video.videoWidth;


        const sourceHeight =
            video.videoHeight;


        const scale =
            Math.max(

                displayWidth /
                sourceWidth,

                displayHeight /
                sourceHeight
            );


        const renderedWidth =
            sourceWidth *
            scale;


        const renderedHeight =
            sourceHeight *
            scale;


        const cropX =
            (
                renderedWidth -
                displayWidth
            ) / 2;


        const cropY =
            (
                renderedHeight -
                displayHeight
            ) / 2;


        const sourceX =
            (
                displayX +
                cropX
            ) /
            scale;


        const sourceY =
            (
                displayY +
                cropY
            ) /
            scale;


        return {

            x:
                Math.max(
                    0,
                    Math.min(
                        sourceWidth,
                        sourceX
                    )
                ),

            y:
                Math.max(
                    0,
                    Math.min(
                        sourceHeight,
                        sourceY
                    )
                )
        };
    }


    /* =====================================================
       CUATRO PUNTOS DE LA GUÍA

       A -------- B
        \        /
         \      /
          D----C

       La diferencia es muy leve.
    ===================================================== */

    function getGuideDisplayPoints() {

        const width =
            video.clientWidth;


        const height =
            video.clientHeight;


        /*
         * Si tenemos el elemento real usamos su posición
         * exacta. Así CSS y JavaScript siempre coinciden.
         */

        if (guideElement) {

            const guideRect =
                guideElement.getBoundingClientRect();


            const videoRect =
                video.getBoundingClientRect();


            const x =
                guideRect.left -
                videoRect.left;


            const y =
                guideRect.top -
                videoRect.top;


            const w =
                guideRect.width;


            const h =
                guideRect.height;


            const inset =
                w *
                GUIDE.bottomInset;


            return {

                topLeft: {
                    x,
                    y
                },

                topRight: {
                    x:
                        x + w,
                    y
                },

                bottomRight: {
                    x:
                        x + w - inset,
                    y:
                        y + h
                },

                bottomLeft: {
                    x:
                        x + inset,
                    y:
                        y + h
                }
            };
        }


        /*
         * Fallback basado en porcentajes.
         */

        const x =
            width *
            GUIDE.left;


        const y =
            height *
            GUIDE.top;


        const w =
            width *
            GUIDE.width;


        const h =
            height *
            GUIDE.height;


        const inset =
            w *
            GUIDE.bottomInset;


        return {

            topLeft: {
                x,
                y
            },

            topRight: {
                x:
                    x + w,
                y
            },

            bottomRight: {
                x:
                    x + w - inset,
                y:
                    y + h
            },

            bottomLeft: {
                x:
                    x + inset,
                y:
                    y + h
            }
        };
    }


    function getGuideSourcePoints() {

        const display =
            getGuideDisplayPoints();


        return {

            topLeft:
                screenPointToSource(
                    display.topLeft.x,
                    display.topLeft.y
                ),

            topRight:
                screenPointToSource(
                    display.topRight.x,
                    display.topRight.y
                ),

            bottomRight:
                screenPointToSource(
                    display.bottomRight.x,
                    display.bottomRight.y
                ),

            bottomLeft:
                screenPointToSource(
                    display.bottomLeft.x,
                    display.bottomLeft.y
                )
        };
    }


    /* =====================================================
       NORMALIZACIÓN DEL TRAPECIO

       Como nuestra guía tiene una perspectiva muy ligera,
       rectificamos cada línea horizontal antes del OCR.

       El resultado vuelve a ser rectangular.
    ===================================================== */

    function rectifyGuide(
        sourceCanvas,
        points
    ) {

        const topWidth =

            points.topRight.x -
            points.topLeft.x;


        const bottomWidth =

            points.bottomRight.x -
            points.bottomLeft.x;


        const leftHeight =

            points.bottomLeft.y -
            points.topLeft.y;


        const rightHeight =

            points.bottomRight.y -
            points.topRight.y;


        const averageWidth =
            (
                topWidth +
                bottomWidth
            ) / 2;


        const averageHeight =
            (
                leftHeight +
                rightHeight
            ) / 2;


        /*
         * Limitamos tamaño para no gastar demasiada RAM
         * en Safari del iPhone.
         */

        const maxWidth =
            1100;


        const scale =
            Math.min(
                1,
                maxWidth /
                averageWidth
            );


        const outputWidth =
            Math.max(
                600,
                Math.round(
                    averageWidth *
                    scale
                )
            );


        const outputHeight =
            Math.max(
                700,
                Math.round(
                    averageHeight *
                    scale
                )
            );


        const output =
            document.createElement(
                'canvas'
            );


        output.width =
            outputWidth;


        output.height =
            outputHeight;


        const outCtx =
            output.getContext(
                '2d',
                {
                    willReadFrequently: true
                }
            );


        /*
         * Rectificamos línea por línea.
         *
         * Para cada altura interpolamos los límites
         * izquierdo y derecho del trapecio.
         */

        for (
            let outputY = 0;
            outputY < outputHeight;
            outputY++
        ) {

            const t =
                outputHeight > 1
                    ? outputY /
                      (
                          outputHeight -
                          1
                      )
                    : 0;


            const leftX =
                points.topLeft.x +
                (
                    points.bottomLeft.x -
                    points.topLeft.x
                ) *
                t;


            const rightX =
                points.topRight.x +
                (
                    points.bottomRight.x -
                    points.topRight.x
                ) *
                t;


            const leftY =
                points.topLeft.y +
                (
                    points.bottomLeft.y -
                    points.topLeft.y
                ) *
                t;


            const rightY =
                points.topRight.y +
                (
                    points.bottomRight.y -
                    points.topRight.y
                ) *
                t;


            const sourceY =
                (
                    leftY +
                    rightY
                ) / 2;


            const rowWidth =
                rightX -
                leftX;


            if (
                rowWidth <= 1
            ) {

                continue;
            }


            outCtx.drawImage(

                sourceCanvas,

                leftX,
                sourceY,
                rowWidth,
                1,

                0,
                outputY,
                outputWidth,
                1
            );
        }


        return output;
    }


    /* =====================================================
       OBTENER IMAGEN NORMALIZADA
    ===================================================== */

    function getGuideCrop(
        sourceCanvas
    ) {

        /*
         * Si estamos usando una fotografía de galería
         * no existe correspondencia física con el visor.

         * Para esas fotos usamos las proporciones generales.
         */

        if (
            !video ||
            !video.videoWidth ||
            !video.clientWidth
        ) {

            return cropByPercentages(
                sourceCanvas
            );
        }


        const points =
            getGuideSourcePoints();


        return rectifyGuide(
            sourceCanvas,
            points
        );
    }


    /* =====================================================
       RECORTE PORCENTUAL PARA FOTOS IMPORTADAS
    ===================================================== */

    function cropByPercentages(
        sourceCanvas
    ) {

        const x =
            sourceCanvas.width *
            GUIDE.left;


        const y =
            sourceCanvas.height *
            GUIDE.top;


        const width =
            sourceCanvas.width *
            GUIDE.width;


        const height =
            sourceCanvas.height *
            GUIDE.height;


        const inset =
            width *
            GUIDE.bottomInset;


        const points = {

            topLeft: {

                x,
                y
            },

            topRight: {

                x:
                    x + width,

                y
            },

            bottomRight: {

                x:
                    x +
                    width -
                    inset,

                y:
                    y +
                    height
            },

            bottomLeft: {

                x:
                    x +
                    inset,

                y:
                    y +
                    height
            }
        };


        return rectifyGuide(
            sourceCanvas,
            points
        );
    }


    /* =====================================================
       LUMINOSIDAD
    ===================================================== */

    function calculateBrightness(
        imageData
    ) {

        const data =
            imageData.data;


        let total = 0;

        let samples = 0;


        for (
            let i = 0;
            i < data.length;
            i += 40
        ) {

            total +=

                data[i] *
                0.299 +

                data[i + 1] *
                0.587 +

                data[i + 2] *
                0.114;


            samples++;
        }


        return samples
            ? total /
              samples
            : 0;
    }


    /* =====================================================
       REFLEJO
    ===================================================== */

    function calculateGlare(
        imageData
    ) {

        const data =
            imageData.data;


        let glarePixels =
            0;


        let samples =
            0;


        for (
            let i = 0;
            i < data.length;
            i += 40
        ) {

            if (
                data[i] > 248 &&
                data[i + 1] > 248 &&
                data[i + 2] > 248
            ) {

                glarePixels++;
            }


            samples++;
        }


        return samples
            ? glarePixels /
              samples
            : 0;
    }


    /* =====================================================
       NITIDEZ
    ===================================================== */

    function calculateSharpness(
        imageData,
        width,
        height
    ) {

        const data =
            imageData.data;


        let total =
            0;


        let samples =
            0;


        const step =
            4;


        function gray(
            index
        ) {

            return (

                data[index] +

                data[index + 1] +

                data[index + 2]

            ) / 3;
        }


        for (
            let y = step;
            y < height - step;
            y += step
        ) {

            for (
                let x = step;
                x < width - step;
                x += step
            ) {

                const center =
                    (
                        y *
                        width +
                        x
                    ) *
                    4;


                const right =
                    (
                        y *
                        width +
                        x +
                        step
                    ) *
                    4;


                const bottom =
                    (
                        (
                            y +
                            step
                        ) *
                        width +
                        x
                    ) *
                    4;


                total +=

                    Math.abs(
                        gray(
                            center
                        ) -
                        gray(
                            right
                        )
                    ) +

                    Math.abs(
                        gray(
                            center
                        ) -
                        gray(
                            bottom
                        )
                    );


                samples++;
            }
        }


        return samples
            ? total /
              samples
            : 0;
    }


    /* =====================================================
       ANÁLISIS DE CALIDAD
    ===================================================== */

    function analyzeCanvas(
        sourceCanvas
    ) {

        const crop =
            getGuideCrop(
                sourceCanvas
            );


        const analysis =
            document.createElement(
                'canvas'
            );


        const analysisWidth =
            280;


        const ratio =
            crop.height /
            crop.width;


        analysis.width =
            analysisWidth;


        analysis.height =
            Math.max(
                250,
                Math.round(
                    analysisWidth *
                    ratio
                )
            );


        const analysisCtx =
            analysis.getContext(
                '2d',
                {
                    willReadFrequently: true
                }
            );


        analysisCtx.drawImage(
            crop,
            0,
            0,
            analysis.width,
            analysis.height
        );


        const imageData =
            analysisCtx.getImageData(
                0,
                0,
                analysis.width,
                analysis.height
            );


        const brightness =
            calculateBrightness(
                imageData
            );


        const glare =
            calculateGlare(
                imageData
            );


        const sharpness =
            calculateSharpness(
                imageData,
                analysis.width,
                analysis.height
            );


        const lightGood =

            brightness >=
                LIMITS.minBrightness &&

            brightness <=
                LIMITS.maxBrightness;


        const glareGood =

            glare <=
            LIMITS.maxGlare;


        const sharpnessGood =

            sharpness >=
            LIMITS.minSharpness;


        const goodCount =

            [
                lightGood,
                glareGood,
                sharpnessGood
            ]
                .filter(
                    Boolean
                )
                .length;


        let qualityLevel =
            'poor';


        if (
            goodCount === 3
        ) {

            qualityLevel =
                'good';

        } else if (
            goodCount >= 2
        ) {

            qualityLevel =
                'acceptable';
        }


        return {

            qualityLevel,

            acceptable:
                qualityLevel !==
                'poor',

            brightness,

            glare,

            sharpness,

            checks: {

                light:
                    lightGood,

                glare:
                    glareGood,

                sharpness:
                    sharpnessGood
            },

            crop
        };
    }


    /* =====================================================
       MONITOREO EN VIVO
    ===================================================== */

    function analyzeCurrentFrame() {

        if (
            !drawVideoFrame()
        ) {

            return null;
        }


        return analyzeCanvas(
            canvas
        );
    }


    function startQualityMonitoring(
        callback
    ) {

        if (
            qualityTimer
        ) {

            clearInterval(
                qualityTimer
            );
        }


        qualityTimer =
            setInterval(
                () => {

                    const quality =
                        analyzeCurrentFrame();


                    if (
                        quality &&
                        callback
                    ) {

                        callback(
                            quality
                        );
                    }

                },
                550
            );
    }


    /* =====================================================
       CAPTURAR
    ===================================================== */

    function capture() {

        if (
            !drawVideoFrame()
        ) {

            throw new Error(
                'La cámara todavía no está lista.'
            );
        }


        const quality =
            analyzeCanvas(
                canvas
            );


        return {

            fullImage:
                canvas.toDataURL(
                    'image/jpeg',
                    0.95
                ),

            normalized:
                quality.crop.toDataURL(
                    'image/jpeg',
                    0.97
                ),

            quality
        };
    }


    /* =====================================================
       FOTO IMPORTADA
    ===================================================== */

    function loadFile(
        file
    ) {

        return new Promise(
            (
                resolve,
                reject
            ) => {

                const reader =
                    new FileReader();


                reader.onload =
                    event => {

                        const image =
                            new Image();


                        image.onload =
                            () => {

                                const source =
                                    document.createElement(
                                        'canvas'
                                    );


                                source.width =
                                    image.naturalWidth;


                                source.height =
                                    image.naturalHeight;


                                source
                                    .getContext(
                                        '2d'
                                    )
                                    .drawImage(
                                        image,
                                        0,
                                        0
                                    );


                                /*
                                 * En fotos importadas usamos porcentajes,
                                 * porque la fotografía no fue tomada
                                 * directamente dentro de nuestro visor.
                                 */

                                const crop =
                                    cropByPercentages(
                                        source
                                    );


                                const quality =
                                    analyzeImportedCrop(
                                        crop
                                    );


                                resolve({

                                    fullImage:
                                        event.target.result,

                                    normalized:
                                        crop.toDataURL(
                                            'image/jpeg',
                                            0.97
                                        ),

                                    quality
                                });
                            };


                        image.onerror =
                            () =>
                                reject(
                                    new Error(
                                        'No se pudo abrir la fotografía.'
                                    )
                                );


                        image.src =
                            event.target.result;
                    };


                reader.onerror =
                    () =>
                        reject(
                            new Error(
                                'No se pudo leer la fotografía.'
                            )
                        );


                reader.readAsDataURL(
                    file
                );
            }
        );
    }


    function analyzeImportedCrop(
        crop
    ) {

        const analysis =
            document.createElement(
                'canvas'
            );


        analysis.width =
            280;


        analysis.height =
            Math.round(

                280 *

                crop.height /
                crop.width
            );


        const ctx =
            analysis.getContext(
                '2d',
                {
                    willReadFrequently: true
                }
            );


        ctx.drawImage(
            crop,
            0,
            0,
            analysis.width,
            analysis.height
        );


        const data =
            ctx.getImageData(
                0,
                0,
                analysis.width,
                analysis.height
            );


        const brightness =
            calculateBrightness(
                data
            );


        const glare =
            calculateGlare(
                data
            );


        const sharpness =
            calculateSharpness(
                data,
                analysis.width,
                analysis.height
            );


        const light =
            brightness >=
                LIMITS.minBrightness &&
            brightness <=
                LIMITS.maxBrightness;


        const glareGood =
            glare <=
            LIMITS.maxGlare;


        const sharpnessGood =
            sharpness >=
            LIMITS.minSharpness;


        const count =
            [
                light,
                glareGood,
                sharpnessGood
            ]
                .filter(
                    Boolean
                )
                .length;


        return {

            qualityLevel:
                count === 3
                    ? 'good'
                    : count >= 2
                        ? 'acceptable'
                        : 'poor',

            checks: {

                light,

                glare:
                    glareGood,

                sharpness:
                    sharpnessGood
            },

            brightness,

            glare,

            sharpness,

            crop
        };
    }


    return {

        init,

        stop,

        capture,

        loadFile,

        startQualityMonitoring,

        getGuideRect:
            () => ({
                ...GUIDE
            })
    };

})();
