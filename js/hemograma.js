'use strict';


document.addEventListener(
    'DOMContentLoaded',
    iniciarAplicacion
);


async function iniciarAplicacion() {

    const cameraApp =
        document.querySelector(
            '#camera-app'
        );

    const video =
        document.querySelector(
            '#camera-video'
        );

    const canvas =
        document.querySelector(
            '#analysis-canvas'
        );

    const captureButton =
        document.querySelector(
            '#capture-button'
        );

    const fileButton =
        document.querySelector(
            '#file-button'
        );

    const fileInput =
        document.querySelector(
            '#file-input'
        );


    const qualityDot =
        document.querySelector(
            '#quality-dot'
        );

    const qualityTitle =
        document.querySelector(
            '#quality-title'
        );

    const qualityMessage =
        document.querySelector(
            '#quality-message'
        );


    const checkLight =
        document.querySelector(
            '#check-light'
        );

    const checkSharpness =
        document.querySelector(
            '#check-sharpness'
        );

    const checkGlare =
        document.querySelector(
            '#check-glare'
        );


    const review =
        document.querySelector(
            '#photo-review'
        );

    const preview =
        document.querySelector(
            '#captured-preview'
        );

    const finalQuality =
        document.querySelector(
            '#final-quality'
        );

    const cancelReview =
        document.querySelector(
            '#cancel-review'
        );

    const retakeButton =
        document.querySelector(
            '#retake-button'
        );

    const usePhotoButton =
        document.querySelector(
            '#use-photo-button'
        );


    const processing =
        document.querySelector(
            '#processing-screen'
        );

    const processingMessage =
        document.querySelector(
            '#processing-message'
        );


    const resultScreen =
        document.querySelector(
            '#result-screen'
        );

    const normalizedPreview =
        document.querySelector(
            '#normalized-preview'
        );

    const newPhotoButton =
        document.querySelector(
            '#new-photo-button'
        );


    let currentCapture = null;


    /* =====================================================
       CALIDAD EN PANTALLA
    ===================================================== */

    function setCheck(
        element,
        good
    ) {

        element.classList.toggle(
            'good',
            good
        );

        element.classList.toggle(
            'bad',
            !good
        );
    }


    function updateQuality(
        quality
    ) {

        if (!quality) {
            return;
        }


        setCheck(
            checkLight,
            quality.checks.light
        );


        setCheck(
            checkSharpness,
            quality.checks.sharpness
        );


        setCheck(
            checkGlare,
            quality.checks.glare
        );


        if (
            quality.acceptable
        ) {

            qualityDot.className =
                'quality-dot good';

            qualityTitle.textContent =
                'Buena captura';

            qualityMessage.textContent =
                'Mantenga el teléfono firme';

            captureButton.disabled =
                false;

            return;
        }


        qualityDot.className =
            'quality-dot warning';

        captureButton.disabled =
            true;


        if (
            !quality.checks.sharpness
        ) {

            qualityTitle.textContent =
                'Mantenga el teléfono firme';

            qualityMessage.textContent =
                'La imagen todavía está borrosa';

            return;
        }


        if (
            !quality.checks.glare
        ) {

            qualityTitle.textContent =
                'Evite el reflejo';

            qualityMessage.textContent =
                'Cambie ligeramente el ángulo';

            return;
        }


        if (
            !quality.checks.light
        ) {

            qualityTitle.textContent =
                'Ajuste la iluminación';

            qualityMessage.textContent =
                'La pantalla no se distingue bien';

            return;
        }


        qualityTitle.textContent =
            'Alinee la pantalla';

        qualityMessage.textContent =
            'Use las cuatro esquinas como guía';
    }


    /* =====================================================
       INICIAR CÁMARA
    ===================================================== */

    async function startCamera() {

        cameraApp.hidden =
            false;

        review.hidden =
            true;

        processing.hidden =
            true;

        resultScreen.hidden =
            true;


        qualityDot.className =
            'quality-dot checking';

        qualityTitle.textContent =
            'Preparando cámara…';

        qualityMessage.textContent =
            'Un momento';

        captureButton.disabled =
            true;


        try {

            await VetLabCamera.init(
                video,
                canvas
            );


            qualityTitle.textContent =
                'Alinee la pantalla';

            qualityMessage.textContent =
                'Use las cuatro esquinas como guía';


            VetLabCamera
                .startQualityMonitoring(
                    updateQuality
                );


        } catch (error) {

            console.error(error);


            qualityDot.className =
                'quality-dot warning';

            qualityTitle.textContent =
                'No se pudo abrir la cámara';

            qualityMessage.textContent =
                'Puede seleccionar una fotografía';


            captureButton.disabled =
                true;
        }
    }


    /* =====================================================
       MOSTRAR REVISIÓN
    ===================================================== */

    function showReview(
        capture
    ) {

        currentCapture =
            capture;


        VetLabCamera.stop();


        cameraApp.hidden =
            true;

        review.hidden =
            false;

        processing.hidden =
            true;

        resultScreen.hidden =
            true;


        preview.src =
            capture.fullImage;


        const quality =
            capture.quality;


        const problems = [];


        if (
            !quality.checks.light
        ) {

            problems.push(
                'Iluminación'
            );
        }


        if (
            !quality.checks.sharpness
        ) {

            problems.push(
                'Nitidez'
            );
        }


        if (
            !quality.checks.glare
        ) {

            problems.push(
                'Reflejos'
            );
        }


        if (
            quality.acceptable
        ) {

            finalQuality.className =
                'final-quality good';

            finalQuality.innerHTML = `
                <strong>✓ Fotografía aceptable</strong>
                <span>
                    Revise que las cuatro esquinas de la
                    pantalla estén dentro de las guías.
                </span>
            `;

            usePhotoButton.disabled =
                false;

        } else {

            finalQuality.className =
                'final-quality warning';

            finalQuality.innerHTML = `
                <strong>⚠ Recomendamos repetirla</strong>
                <span>
                    Revisar: ${problems.join(', ')}.
                </span>
            `;

            /*
             * En una prueba clínica prefiero no
             * aceptar automáticamente una foto
             * que sabemos que tiene mala calidad.
             */

            usePhotoButton.disabled =
                true;
        }
    }


    /* =====================================================
       TOMAR FOTO
    ===================================================== */

    captureButton.addEventListener(
        'click',
        () => {

            try {

                const capture =
                    VetLabCamera.capture();

                showReview(
                    capture
                );

            } catch (error) {

                console.error(error);

                alert(
                    'No se pudo tomar la fotografía.'
                );
            }
        }
    );


    /* =====================================================
       GALERÍA
    ===================================================== */

    fileButton.addEventListener(
        'click',
        () => {

            fileInput.click();
        }
    );


    fileInput.addEventListener(
        'change',
        async () => {

            const file =
                fileInput.files?.[0];


            if (!file) {
                return;
            }


            try {

                const capture =
                    await VetLabCamera.loadFile(
                        file
                    );

                showReview(
                    capture
                );

            } catch (error) {

                console.error(error);

                alert(
                    'No se pudo procesar la fotografía.'
                );
            }


            fileInput.value = '';
        }
    );


    /* =====================================================
       REPETIR
    ===================================================== */

    async function retake() {

        currentCapture =
            null;

        await startCamera();
    }


    cancelReview.addEventListener(
        'click',
        retake
    );


    retakeButton.addEventListener(
        'click',
        retake
    );


    newPhotoButton.addEventListener(
        'click',
        retake
    );


    /* =====================================================
       USAR FOTO
    ===================================================== */

    usePhotoButton.addEventListener(
        'click',
        async () => {

            if (
                !currentCapture ||
                !currentCapture.quality.acceptable
            ) {

                return;
            }


            review.hidden =
                true;

            processing.hidden =
                false;


            processingMessage.textContent =
                'Normalizando pantalla del Exigo…';


            /*
             * Permitimos que Safari dibuje la
             * pantalla de procesamiento.
             */

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        250
                    )
            );


            /*
             * Guardamos temporalmente la imagen
             * normalizada.
             *
             * En el siguiente paso esta será
             * enviada al nuevo lector OCR.
             */

            try {

                sessionStorage.setItem(
                    'vetlab_exigo_image',
                    currentCapture.normalized
                );

            } catch (error) {

                console.warn(
                    'La imagen es demasiado grande para sessionStorage.',
                    error
                );
            }


            processingMessage.textContent =
                'Captura preparada';


            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        400
                    )
            );


            normalizedPreview.src =
                currentCapture.normalized;


            processing.hidden =
                true;

            resultScreen.hidden =
                false;
        }
    );


    /* =====================================================
       INICIO
    ===================================================== */

    await startCamera();
}
