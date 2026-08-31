'use strict';


document.addEventListener(
    'DOMContentLoaded',
    iniciarAplicacion
);


async function iniciarAplicacion() {

    const cameraApp =
        document.querySelector('#camera-app');

    const video =
        document.querySelector('#camera-video');

    const canvas =
        document.querySelector('#analysis-canvas');

    const captureButton =
        document.querySelector('#capture-button');

    const fileButton =
        document.querySelector('#file-button');

    const fileInput =
        document.querySelector('#file-input');


    const qualityDot =
        document.querySelector('#quality-dot');

    const qualityTitle =
        document.querySelector('#quality-title');

    const qualityMessage =
        document.querySelector('#quality-message');


    const checkLight =
        document.querySelector('#check-light');

    const checkSharpness =
        document.querySelector('#check-sharpness');

    const checkGlare =
        document.querySelector('#check-glare');


    const screenGuide =
        document.querySelector('#screen-guide');


    const review =
        document.querySelector('#photo-review');

    const preview =
        document.querySelector('#captured-preview');

    const finalQuality =
        document.querySelector('#final-quality');

    const cancelReview =
        document.querySelector('#cancel-review');

    const retakeButton =
        document.querySelector('#retake-button');

    const usePhotoButton =
        document.querySelector('#use-photo-button');


    const processing =
        document.querySelector('#processing-screen');

    const processingMessage =
        document.querySelector('#processing-message');


    const resultScreen =
        document.querySelector('#result-screen');

    const normalizedPreview =
        document.querySelector('#normalized-preview');

    const newPhotoButton =
        document.querySelector('#new-photo-button');


    let currentCapture = null;


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


    function updateGuideQuality(level) {

        screenGuide.classList.remove(
            'guide-good',
            'guide-warning'
        );


        if (level === 'good') {

            screenGuide.classList.add(
                'guide-good'
            );

        } else if (
            level === 'acceptable'
        ) {

            screenGuide.classList.add(
                'guide-warning'
            );
        }
    }


    function updateQuality(quality) {

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


        updateGuideQuality(
            quality.qualityLevel
        );


        /*
         * IMPORTANTE:
         * El botón ya NO se bloquea.
         */

        captureButton.disabled = false;


        if (
            quality.qualityLevel === 'good'
        ) {

            qualityDot.className =
                'quality-dot good';

            qualityTitle.textContent =
                'Lista para capturar';

            qualityMessage.textContent =
                'La calidad de imagen es buena';

            return;
        }


        if (
            quality.qualityLevel === 'acceptable'
        ) {

            qualityDot.className =
                'quality-dot warning';

            qualityTitle.textContent =
                'Puede capturar';

            if (
                !quality.checks.sharpness
            ) {

                qualityMessage.textContent =
                    'Mejore la nitidez si es posible';

            } else if (
                !quality.checks.glare
            ) {

                qualityMessage.textContent =
                    'Evite un poco más el reflejo';

            } else if (
                !quality.checks.light
            ) {

                qualityMessage.textContent =
                    'Ajuste ligeramente la iluminación';

            } else {

                qualityMessage.textContent =
                    'La imagen es utilizable';
            }

            return;
        }


        qualityDot.className =
            'quality-dot warning';

        qualityTitle.textContent =
            'Puede capturar, pero recomendamos ajustar';


        if (
            !quality.checks.sharpness
        ) {

            qualityMessage.textContent =
                'Mantenga el teléfono más firme';

            return;
        }


        if (
            !quality.checks.glare
        ) {

            qualityMessage.textContent =
                'Cambie ligeramente el ángulo';

            return;
        }


        if (
            !quality.checks.light
        ) {

            qualityMessage.textContent =
                'La iluminación puede mejorar';

            return;
        }


        qualityMessage.textContent =
            'Alinee mejor la pantalla';
    }


    async function startCamera() {

        cameraApp.hidden = false;
        review.hidden = true;
        processing.hidden = true;
        resultScreen.hidden = true;


        qualityDot.className =
            'quality-dot checking';

        qualityTitle.textContent =
            'Preparando cámara…';

        qualityMessage.textContent =
            'Un momento';


        /*
         * Botón activo desde el inicio.
         */

        captureButton.disabled = false;


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


    function showReview(capture) {

        currentCapture =
            capture;


        VetLabCamera.stop();


        cameraApp.hidden = true;
        review.hidden = false;
        processing.hidden = true;
        resultScreen.hidden = true;


        preview.src =
            capture.fullImage;


        const quality =
            capture.quality;


        const problems = [];


        if (
            !quality.checks.light
        ) {

            problems.push(
                'iluminación'
            );
        }


        if (
            !quality.checks.sharpness
        ) {

            problems.push(
                'nitidez'
            );
        }


        if (
            !quality.checks.glare
        ) {

            problems.push(
                'reflejos'
            );
        }


        /*
         * Siempre permitimos usar la fotografía.
         */

        usePhotoButton.disabled = false;


        if (
            quality.qualityLevel === 'good'
        ) {

            finalQuality.className =
                'final-quality good';

            finalQuality.innerHTML = `
                <strong>✓ Buena fotografía</strong>
                <span>
                    La calidad es adecuada para intentar la lectura.
                    Confirme que toda la pantalla esté dentro de las guías.
                </span>
            `;

            return;
        }


        if (
            quality.qualityLevel === 'acceptable'
        ) {

            finalQuality.className =
                'final-quality warning';

            finalQuality.innerHTML = `
                <strong>⚠ Fotografía utilizable</strong>
                <span>
                    Puede continuar.
                    ${problems.length
                        ? `Sería mejor mejorar: ${problems.join(', ')}.`
                        : ''
                    }
                </span>
            `;

            return;
        }


        finalQuality.className =
            'final-quality warning';

        finalQuality.innerHTML = `
            <strong>⚠ Recomendamos repetirla</strong>
            <span>
                Puede usarla si lo desea, pero detectamos:
                ${problems.length
                    ? problems.join(', ')
                    : 'calidad limitada'
                }.
            </span>
        `;
    }


    captureButton.addEventListener(
        'click',
        () => {

            try {

                const capture =
                    VetLabCamera.capture();

                showReview(capture);

            } catch (error) {

                console.error(error);

                alert(
                    'No se pudo tomar la fotografía.'
                );
            }
        }
    );


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

                showReview(capture);

            } catch (error) {

                console.error(error);

                alert(
                    'No se pudo procesar la fotografía.'
                );
            }


            fileInput.value = '';
        }
    );


    async function retake() {

        currentCapture = null;

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


    usePhotoButton.addEventListener(
        'click',
        async () => {

            if (!currentCapture) {

                return;
            }


            review.hidden = true;
            processing.hidden = false;


            processingMessage.textContent =
                'Normalizando pantalla del Exigo…';


            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        250
                    )
            );


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
                        350
                    )
            );


            normalizedPreview.src =
                currentCapture.normalized;


            processing.hidden = true;
            resultScreen.hidden = false;
        }
    );


    await startCamera();
}
