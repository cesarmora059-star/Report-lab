'use strict';


window.ExigoPerspective = (() => {


    const OUTPUT_WIDTH = 900;
    const OUTPUT_HEIGHT = 1200;


    /* =====================================================
       OPEN CV
    ===================================================== */

    async function waitForOpenCV() {

        const start =
            Date.now();


        while (
            Date.now() - start <
            15000
        ) {

            if (
                window.cv &&
                typeof cv.Mat === 'function'
            ) {

                return true;
            }


            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        150
                    )
            );
        }


        throw new Error(
            'OpenCV no terminó de cargar.'
        );
    }



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
                    () =>
                        resolve(
                            image
                        );


                image.onerror =
                    () =>
                        reject(
                            new Error(
                                'No se pudo abrir la imagen.'
                            )
                        );


                image.src =
                    dataURL;
            }
        );
    }



    async function dataURLToCanvas(
        dataURL
    ) {

        const image =
            await loadImage(
                dataURL
            );


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



    /* =====================================================
       ORDENAR ESQUINAS
    ===================================================== */

    function orderPoints(
        points
    ) {

        if (
            points.length !== 4
        ) {

            throw new Error(
                'Se requieren exactamente cuatro puntos.'
            );
        }


        const bySum =
            [...points]
                .sort(
                    (
                        a,
                        b
                    ) =>
                        (
                            a.x +
                            a.y
                        ) -
                        (
                            b.x +
                            b.y
                        )
                );


        const tl =
            bySum[0];


        const br =
            bySum[3];


        const remaining =
            points.filter(
                point =>
                    point !== tl &&
                    point !== br
            );


        let tr;
        let bl;


        if (
            remaining[0].x >
            remaining[1].x
        ) {

            tr =
                remaining[0];

            bl =
                remaining[1];

        } else {

            tr =
                remaining[1];

            bl =
                remaining[0];
        }


        return {

            tl,
            tr,
            br,
            bl
        };
    }



    /* =====================================================
       GEOMETRÍA
    ===================================================== */

    function distance(
        a,
        b
    ) {

        return Math.hypot(
            a.x - b.x,
            a.y - b.y
        );
    }



    function polygonArea(
        points
    ) {

        let area = 0;


        for (
            let i = 0;
            i < points.length;
            i++
        ) {

            const j =
                (
                    i + 1
                ) %
                points.length;


            area +=
                points[i].x *
                points[j].y;


            area -=
                points[j].x *
                points[i].y;
        }


        return Math.abs(
            area / 2
        );
    }



    function evaluateQuad(
        ordered,
        width,
        height
    ) {

        const points = [

            ordered.tl,
            ordered.tr,
            ordered.br,
            ordered.bl
        ];


        const area =
            polygonArea(
                points
            );


        const imageArea =
            width *
            height;


        const areaRatio =
            area /
            imageArea;


        if (
            areaRatio < 0.25
        ) {

            return -Infinity;
        }


        const top =
            distance(
                ordered.tl,
                ordered.tr
            );


        const bottom =
            distance(
                ordered.bl,
                ordered.br
            );


        const left =
            distance(
                ordered.tl,
                ordered.bl
            );


        const right =
            distance(
                ordered.tr,
                ordered.br
            );


        if (
            top < 1 ||
            bottom < 1 ||
            left < 1 ||
            right < 1
        ) {

            return -Infinity;
        }


        const averageWidth =
            (
                top +
                bottom
            ) / 2;


        const averageHeight =
            (
                left +
                right
            ) / 2;


        const ratio =
            averageWidth /
            averageHeight;


        /*
         * La pantalla que estamos recibiendo
         * debe ser claramente vertical.
         */

        if (
            ratio < 0.45 ||
            ratio > 1.05
        ) {

            return -Infinity;
        }


        const centerX =

            (
                ordered.tl.x +
                ordered.tr.x +
                ordered.br.x +
                ordered.bl.x
            ) /
            4;


        const centerY =

            (
                ordered.tl.y +
                ordered.tr.y +
                ordered.br.y +
                ordered.bl.y
            ) /
            4;


        const centerDistance =

            Math.hypot(

                centerX -
                width / 2,

                centerY -
                height / 2

            ) /

            Math.hypot(
                width / 2,
                height / 2
            );


        const widthDifference =

            Math.abs(
                top -
                bottom
            ) /

            Math.max(
                top,
                bottom
            );


        const heightDifference =

            Math.abs(
                left -
                right
            ) /

            Math.max(
                left,
                right
            );


        /*
         * Mayor área = mejor.
         * Más centrado = mejor.
         * Lados muy deformados = penalización.
         */

        return (

            areaRatio * 5

            -

            centerDistance * 1.2

            -

            widthDifference * 0.7

            -

            heightDifference * 0.7
        );
    }



    /* =====================================================
       DETECTAR CUADRILÁTERO
    ===================================================== */

    async function detect(
        dataURL
    ) {

        await waitForOpenCV();


        const canvas =
            await dataURLToCanvas(
                dataURL
            );


        const src =
            cv.imread(
                canvas
            );


        const gray =
            new cv.Mat();


        const blurred =
            new cv.Mat();


        const edges =
            new cv.Mat();


        const closed =
            new cv.Mat();


        const contours =
            new cv.MatVector();


        const hierarchy =
            new cv.Mat();


        try {

            cv.cvtColor(
                src,
                gray,
                cv.COLOR_RGBA2GRAY
            );


            cv.GaussianBlur(

                gray,

                blurred,

                new cv.Size(
                    5,
                    5
                ),

                0,
                0,

                cv.BORDER_DEFAULT
            );


            cv.Canny(
                blurred,
                edges,
                45,
                130
            );


            const kernel =
                cv.getStructuringElement(

                    cv.MORPH_RECT,

                    new cv.Size(
                        7,
                        7
                    )
                );


            cv.morphologyEx(

                edges,

                closed,

                cv.MORPH_CLOSE,

                kernel
            );


            kernel.delete();


            cv.findContours(

                closed,

                contours,

                hierarchy,

                cv.RETR_LIST,

                cv.CHAIN_APPROX_SIMPLE
            );


            let best =
                null;


            let bestScore =
                -Infinity;


            const minimumArea =

                canvas.width *
                canvas.height *
                0.18;


            for (
                let i = 0;
                i < contours.size();
                i++
            ) {

                const contour =
                    contours.get(
                        i
                    );


                const area =
                    cv.contourArea(
                        contour
                    );


                if (
                    area <
                    minimumArea
                ) {

                    contour.delete();

                    continue;
                }


                const perimeter =
                    cv.arcLength(
                        contour,
                        true
                    );


                const approx =
                    new cv.Mat();


                cv.approxPolyDP(

                    contour,

                    approx,

                    perimeter *
                    0.025,

                    true
                );


                contour.delete();


                if (
                    approx.rows !== 4 ||
                    !cv.isContourConvex(
                        approx
                    )
                ) {

                    approx.delete();

                    continue;
                }


                const points = [];


                for (
                    let row = 0;
                    row < 4;
                    row++
                ) {

                    points.push({

                        x:
                            approx
                                .intPtr(
                                    row,
                                    0
                                )[0],

                        y:
                            approx
                                .intPtr(
                                    row,
                                    0
                                )[1]
                    });
                }


                approx.delete();


                const ordered =
                    orderPoints(
                        points
                    );


                const score =
                    evaluateQuad(

                        ordered,

                        canvas.width,

                        canvas.height
                    );


                if (
                    score >
                    bestScore
                ) {

                    bestScore =
                        score;

                    best =
                        ordered;
                }
            }


            if (!best) {

                return {

                    success:
                        false,

                    canvas,

                    points:
                        defaultPoints(
                            canvas.width,
                            canvas.height
                        ),

                    score:
                        0
                };
            }


            return {

                success:
                    true,

                canvas,

                points:
                    best,

                score:
                    bestScore
            };


        } finally {

            src.delete();
            gray.delete();
            blurred.delete();
            edges.delete();
            closed.delete();
            contours.delete();
            hierarchy.delete();
        }
    }



    /* =====================================================
       PUNTOS DE RESPALDO
    ===================================================== */

    function defaultPoints(
        width,
        height
    ) {

        return {

            tl: {
                x:
                    width * 0.04,

                y:
                    height * 0.03
            },

            tr: {
                x:
                    width * 0.96,

                y:
                    height * 0.03
            },

            br: {
                x:
                    width * 0.94,

                y:
                    height * 0.97
            },

            bl: {
                x:
                    width * 0.06,

                y:
                    height * 0.97
            }
        };
    }



    /* =====================================================
       PERSPECTIVA
    ===================================================== */

    function rectify(
        sourceCanvas,
        points
    ) {

        if (
            !window.cv ||
            typeof cv.Mat !==
            'function'
        ) {

            throw new Error(
                'OpenCV no está disponible.'
            );
        }


        const ordered =
            points.tl
                ? points
                : orderPoints(
                    points
                );


        const src =
            cv.imread(
                sourceCanvas
            );


        const destination =
            new cv.Mat();


        const sourcePoints =
            cv.matFromArray(

                4,

                1,

                cv.CV_32FC2,

                [

                    ordered.tl.x,
                    ordered.tl.y,

                    ordered.tr.x,
                    ordered.tr.y,

                    ordered.br.x,
                    ordered.br.y,

                    ordered.bl.x,
                    ordered.bl.y
                ]
            );


        const destinationPoints =
            cv.matFromArray(

                4,

                1,

                cv.CV_32FC2,

                [

                    0,
                    0,

                    OUTPUT_WIDTH - 1,
                    0,

                    OUTPUT_WIDTH - 1,
                    OUTPUT_HEIGHT - 1,

                    0,
                    OUTPUT_HEIGHT - 1
                ]
            );


        const matrix =
            cv.getPerspectiveTransform(

                sourcePoints,

                destinationPoints
            );


        try {

            cv.warpPerspective(

                src,

                destination,

                matrix,

                new cv.Size(
                    OUTPUT_WIDTH,
                    OUTPUT_HEIGHT
                ),

                cv.INTER_CUBIC,

                cv.BORDER_REPLICATE,

                new cv.Scalar()
            );


            const outputCanvas =
                document.createElement(
                    'canvas'
                );


            outputCanvas.width =
                OUTPUT_WIDTH;


            outputCanvas.height =
                OUTPUT_HEIGHT;


            cv.imshow(
                outputCanvas,
                destination
            );


            return outputCanvas;


        } finally {

            src.delete();
            destination.delete();

            sourcePoints.delete();
            destinationPoints.delete();

            matrix.delete();
        }
    }



    /* =====================================================
       EXPORTAR
    ===================================================== */

    return {

        detect,

        rectify,

        defaultPoints,

        outputSize: {

            width:
                OUTPUT_WIDTH,

            height:
                OUTPUT_HEIGHT
        }
    };

})();
