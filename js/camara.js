'use strict';


window.VetLabCamera = (() => {

    let stream = null;

    let video = null;

    let canvas = null;

    let context = null;

    let qualityTimer = null;


    const LIMITS = {

        minBrightness: 42,

        maxBrightness: 238,

        minSharpness: 45,

        maxGlare: 0.20
    };


    async function init(
        videoElement,
        canvasElement
    ) {

        stop();


        video =
            videoElement;

        canvas =
            canvasElement;


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
                resolve;
        });


        await video.play();
    }



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



    function getGuideRect() {

        return {

            x: 0.18,

            y: 0.16,

            width: 0.64,

            height: 0.62
        };
    }



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



    function cropGuide(sourceCanvas) {

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


        /*
         * IMPORTANTE
         *
         * Conservamos la proporción original.
         * No deformamos la pantalla.
         */

        const maximumWidth =
            1100;


        const scale =
            Math.min(
                1,
                maximumWidth / sw
            );


        const outputWidth =
            Math.round(
                sw * scale
            );


        const outputHeight =
            Math.round(
                sh * scale
            );


        const output =
            document.createElement(
                'canvas'
            );


        output.width =
            outputWidth;

        output.height =
            outputHeight;


        const outputContext =
            output.getContext(
                '2d',
                {
                    willReadFrequently: true
                }
            );


        outputContext.drawImage(

            sourceCanvas,

            sx,
            sy,
            sw,
            sh,

            0,
            0,
            outputWidth,
            outputHeight
        );


        return output;
    }



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

                data[i] * 0.299 +

                data[i + 1] * 0.587 +

                data[i + 2] * 0.114;


            samples++;
        }


        return samples
            ? total / samples
            : 0;
    }



    function calculateGlare(
        imageData
    ) {

        const data =
            imageData.data;


        let glarePixels = 0;

        let samples = 0;


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
            ? glarePixels / samples
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

        let samples = 0;


        const step = 4;


        function gray(index) {

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
                    (y * width + x) * 4;


                const right =
                    (
                        y * width +
                        x + step
                    ) * 4;


                const bottom =
                    (
                        (y + step) *
                        width +
                        x
                    ) * 4;


                total +=

                    Math.abs(
                        gray(center) -
                        gray(right)
                    ) +

                    Math.abs(
                        gray(center) -
                        gray(bottom)
                    );


                samples++;
            }
        }


        return samples
            ? total / samples
            : 0;
    }



    function analyzeCanvas(
        sourceCanvas
    ) {

        const crop =
            cropGuide(
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
            Math.round(
                analysisWidth *
                ratio
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


        const imageData =
            ctx.getImageData(
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
                .filter(Boolean)
                .length;


        let qualityLevel =
            'poor';


        if (goodCount === 3) {

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
                qualityLevel !== 'poor',

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

        if (qualityTimer) {

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
                500
            );
    }



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


                                const quality =
                                    analyzeCanvas(
                                        source
                                    );


                                resolve({

                                    fullImage:
                                        event.target.result,

                                    normalized:
                                        quality.crop.toDataURL(
                                            'image/jpeg',
                                            0.97
                                        ),

                                    quality
                                });
                            };


                        image.onerror =
                            reject;


                        image.src =
                            event.target.result;
                    };


                reader.onerror =
                    reject;


                reader.readAsDataURL(
                    file
                );
            }
        );
    }



    return {

        init,

        stop,

        capture,

        loadFile,

        startQualityMonitoring,

        getGuideRect
    };

})();
