'use strict';

window.VetLabCamera = (() => {

    let stream = null;
    let video = null;
    let canvas = null;
    let ctx = null;
    let qualityTimer = null;
    let lastQuality = null;


    const QUALITY_LIMITS = {

        minBrightness: 45,

        maxBrightness: 235,

        minSharpness: 55,

        maxGlare: 0.18
    };


    async function init(videoElement, canvasElement) {

        video = videoElement;
        canvas = canvasElement;

        ctx = canvas.getContext(
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
                'Este navegador no permite utilizar la cámara directamente.'
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


        video.srcObject = stream;


        await new Promise(resolve => {

            if (video.readyState >= 2) {

                resolve();
                return;
            }

            video.onloadedmetadata =
                () => resolve();

        });


        await video.play();

        return true;
    }


    function stop() {

        if (qualityTimer) {

            clearInterval(qualityTimer);

            qualityTimer = null;
        }


        if (stream) {

            stream
                .getTracks()
                .forEach(track => track.stop());

            stream = null;
        }
    }


    function getGuideRect() {

        /*
         * Guía adaptada visualmente a la pantalla real del Exigo.
         * Más estrecha que antes y un poco más alta.
         */

        return {

            x: 0.18,

            y: 0.16,

            width: 0.64,

            height: 0.62
        };
    }


    function drawCurrentFrame() {

        const width =
            video.videoWidth;

        const height =
            video.videoHeight;


        if (!width || !height) {

            return false;
        }


        canvas.width = width;
        canvas.height = height;


        ctx.drawImage(
            video,
            0,
            0,
            width,
            height
        );


        return true;
    }


    function getGuideCrop(sourceCanvas) {

        const guide =
            getGuideRect();


        const sx =
            Math.round(
                sourceCanvas.width *
                guide.x
            );

        const sy =
            Math.round(
                sourceCanvas.height *
                guide.y
            );

        const sw =
            Math.round(
                sourceCanvas.width *
                guide.width
            );

        const sh =
            Math.round(
                sourceCanvas.height *
                guide.height
            );


        const output =
            document.createElement('canvas');


        /*
         * Relación vertical semejante a la pantalla del Exigo.
         */

        output.width = 900;
        output.height = 1200;


        const outputCtx =
            output.getContext(
                '2d',
                {
                    willReadFrequently: true
                }
            );


        outputCtx.drawImage(

            sourceCanvas,

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


    function calculateBrightness(imageData) {

        const data =
            imageData.data;

        let sum = 0;
        let count = 0;


        for (
            let i = 0;
            i < data.length;
            i += 40
        ) {

            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];


            const luminance =
                0.299 * r +
                0.587 * g +
                0.114 * b;


            sum += luminance;
            count++;
        }


        return count
            ? sum / count
            : 0;
    }


    function calculateGlare(imageData) {

        const data =
            imageData.data;

        let bright = 0;
        let count = 0;


        for (
            let i = 0;
            i < data.length;
            i += 40
        ) {

            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];


            if (
                r > 248 &&
                g > 248 &&
                b > 248
            ) {

                bright++;
            }


            count++;
        }


        return count
            ? bright / count
            : 0;
    }


    function calculateSharpness(
        imageData,
        width,
        height
    ) {

        const data =
            imageData.data;

        let total = 0;
        let count = 0;

        const step = 4;


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

                const index =
                    (y * width + x) * 4;


                const rightIndex =
                    (
                        y * width +
                        x + step
                    ) * 4;


                const bottomIndex =
                    (
                        (y + step) *
                        width +
                        x
                    ) * 4;


                const current =
                    (
                        data[index] +
                        data[index + 1] +
                        data[index + 2]
                    ) / 3;


                const right =
                    (
                        data[rightIndex] +
                        data[rightIndex + 1] +
                        data[rightIndex + 2]
                    ) / 3;


                const bottom =
                    (
                        data[bottomIndex] +
                        data[bottomIndex + 1] +
                        data[bottomIndex + 2]
                    ) / 3;


                total +=
                    Math.abs(
                        current - right
                    ) +
                    Math.abs(
                        current - bottom
                    );


                count++;
            }
        }


        return count
            ? total / count
            : 0;
    }


    function analyzeCanvas(sourceCanvas) {

        const crop =
            getGuideCrop(sourceCanvas);


        const analysis =
            document.createElement('canvas');


        analysis.width = 300;
        analysis.height = 400;


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
            calculateBrightness(imageData);


        const glare =
            calculateGlare(imageData);


        const sharpness =
            calculateSharpness(
                imageData,
                analysis.width,
                analysis.height
            );


        const lightGood =
            brightness >= QUALITY_LIMITS.minBrightness &&
            brightness <= QUALITY_LIMITS.maxBrightness;


        const glareGood =
            glare <= QUALITY_LIMITS.maxGlare;


        const sharpnessGood =
            sharpness >= QUALITY_LIMITS.minSharpness;


        const goodCount =
            [
                lightGood,
                glareGood,
                sharpnessGood
            ]
                .filter(Boolean)
                .length;


        const qualityLevel =
            goodCount === 3
                ? 'good'
                : goodCount === 2
                    ? 'acceptable'
                    : 'poor';


        return {

            acceptable:
                qualityLevel !== 'poor',

            qualityLevel,

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


    function analyzeCurrentFrame() {

        if (!drawCurrentFrame()) {

            return null;
        }


        lastQuality =
            analyzeCanvas(canvas);


        return lastQuality;
    }


    function startQualityMonitoring(callback) {

        if (qualityTimer) {

            clearInterval(qualityTimer);
        }


        qualityTimer =
            setInterval(
                () => {

                    const result =
                        analyzeCurrentFrame();


                    if (
                        result &&
                        callback
                    ) {

                        callback(result);
                    }

                },
                500
            );
    }


    function capture() {

        if (!drawCurrentFrame()) {

            throw new Error(
                'La cámara todavía no está lista.'
            );
        }


        const quality =
            analyzeCanvas(canvas);


        const fullImage =
            canvas.toDataURL(
                'image/jpeg',
                0.94
            );


        const normalized =
            quality.crop.toDataURL(
                'image/jpeg',
                0.96
            );


        return {

            fullImage,

            normalized,

            quality
        };
    }


    function loadFile(file) {

        return new Promise(
            (resolve, reject) => {

                const reader =
                    new FileReader();


                reader.onload =
                    event => {

                        const image =
                            new Image();


                        image.onload =
                            () => {

                                const source =
                                    document.createElement('canvas');


                                source.width =
                                    image.naturalWidth;

                                source.height =
                                    image.naturalHeight;


                                source
                                    .getContext('2d')
                                    .drawImage(
                                        image,
                                        0,
                                        0
                                    );


                                const quality =
                                    analyzeCanvas(source);


                                resolve({

                                    fullImage:
                                        event.target.result,

                                    normalized:
                                        quality.crop.toDataURL(
                                            'image/jpeg',
                                            0.96
                                        ),

                                    quality
                                });
                            };


                        image.onerror =
                            () =>
                                reject(
                                    new Error(
                                        'No se pudo abrir la imagen.'
                                    )
                                );


                        image.src =
                            event.target.result;
                    };


                reader.onerror =
                    () =>
                        reject(
                            new Error(
                                'No se pudo leer el archivo.'
                            )
                        );


                reader.readAsDataURL(file);
            }
        );
    }


    return {

        init,

        stop,

        capture,

        loadFile,

        startQualityMonitoring,

        analyzeCurrentFrame,

        getGuideRect
    };

})();
