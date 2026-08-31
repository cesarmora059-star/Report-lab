'use strict';


document.addEventListener(
    'DOMContentLoaded',
    start
);


async function start() {


    const $ =
        selector =>
            document.querySelector(
                selector
            );


    const cameraApp =
        $('#camera-app');


    const video =
        $('#camera-video');


    const canvas =
        $('#analysis-canvas');


    const screenGuide =
        $('#screen-guide');


    const captureButton =
        $('#capture-button');


    const fileButton =
        $('#file-button');


    const fileInput =
        $('#file-input');


    const qualityDot =
        $('#quality-dot');


    const qualityTitle =
        $('#quality-title');


    const qualityMessage =
        $('#quality-message');


    const checkLight =
        $('#check-light');


    const checkSharpness =
        $('#check-sharpness');


    const checkGlare =
        $('#check-glare');


    const photoReview =
        $('#photo-review');


    const capturedPreview =
        $('#captured-preview');


    const finalQuality =
        $('#final-quality');


    const cancelReview =
        $('#cancel-review');


    const retakeButton =
        $('#retake-button');


    const usePhotoButton =
        $('#use-photo-button');


    const processing =
        $('#processing-screen');


    const processingMessage =
        $('#processing-message');


    const processingBar =
        $('#processing-progress-bar');


    const resultScreen =
        $('#result-screen');


    const normalizedPreview =
        $('#normalized-preview');


    const backToCamera =
        $('#back-to-camera');


    const repeatReading =
        $('#repeat-reading');


    const confirmationForm =
        $('#confirmation-form');


    const ownerInput =
        $('#owner-input');


    const patientInput =
        $('#patient-input');


    const speciesInput =
        $('#species-input');


    const ageInput =
        $('#age-input');


    const recordInput =
        $('#record-input');


    const dateInput =
        $('#date-input');


    const vetInput =
        $('#vet-input');


    const notesInput =
        $('#notes-input');


    const detectedSpecies =
        $('#detected-species');


    const recognitionStatus =
        $('#recognition-status');


    const validationBadge =
        $('#validation-badge');


    const validationMessages =
        $('#validation-messages');


    const resultsBody =
        $('#results-body');


    let currentCapture =
        null;


    let currentReading =
        null;


    /* =====================================================
       UTILIDADES
    ===================================================== */

    function today() {

        const now =
            new Date();


        const offset =
            now.getTimezoneOffset();


        return new Date(
            now.getTime() -
            offset * 60000
        )
            .toISOString()
            .slice(
                0,
                10
            );
    }


    function reportNumber() {

        const now =
            new Date();


        const two =
            value =>
                String(
                    value
                ).padStart(
                    2,
                    '0'
                );


        const base =

            now.getFullYear() +

            two(
                now.getMonth() + 1
            ) +

            two(
                now.getDate()
            ) +

            '-' +

            two(
                now.getHours()
            ) +

            two(
                now.getMinutes()
            ) +

            two(
                now.getSeconds()
            );


        const random =
            Math.random()
                .toString(36)
                .slice(
                    2,
                    5
                )
                .toUpperCase();


        return (
            `${base}-${random}`
        );
    }


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


    /* =====================================================
       CALIDAD
    ===================================================== */

    function updateQuality(
        quality
    ) {

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


        screenGuide.classList.remove(
            'guide-good',
            'guide-warning'
        );


        captureButton.disabled =
            false;


        if (
            quality.qualityLevel ===
            'good'
        ) {

            screenGuide
                .classList
                .add(
                    'guide-good'
                );


            qualityDot.className =
                'quality-dot good';


            qualityTitle.textContent =
                'Lista para capturar';


            qualityMessage.textContent =
                'La imagen se ve adecuada';


            return;
        }


        screenGuide
            .classList
            .add(
                'guide-warning'
            );


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
                'Confirme el encuadre';
        }
    }


    /* =====================================================
       CÁMARA
    ===================================================== */

    async function startCamera() {

        currentCapture =
            null;


        cameraApp.hidden =
            false;


        photoReview.hidden =
            true;


        processing.hidden =
            true;


        resultScreen.hidden =
            true;


        captureButton.disabled =
            false;


        qualityDot.className =
            'quality-dot checking';


        qualityTitle.textContent =
            'Preparando cámara…';


        qualityMessage.textContent =
            'Un momento';


        try {

            /*
             * AHORA PASAMOS TAMBIÉN LA GUÍA.
             *
             * camara.js usa la posición real del elemento
             * para calcular el recorte exacto.
             */

            await VetLabCamera.init(
                video,
                canvas,
                screenGuide
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

            console.error(
                error
            );


            qualityDot.className =
                'quality-dot warning';


            qualityTitle.textContent =
                'No se pudo abrir la cámara';


            qualityMessage.textContent =
                'Seleccione una fotografía desde Fotos';


            captureButton.disabled =
                true;
        }
    }


    /* =====================================================
       REVISIÓN
    ===================================================== */

    function showPhotoReview(
        capture
    ) {

        currentCapture =
            capture;


        VetLabCamera.stop();


        cameraApp.hidden =
            true;


        photoReview.hidden =
            false;


        processing.hidden =
            true;


        resultScreen.hidden =
            true;


        capturedPreview.src =
            capture.fullImage;


        const problems = [];


        if (
            !capture.quality.checks.light
        ) {

            problems.push(
                'iluminación'
            );
        }


        if (
            !capture.quality.checks.sharpness
        ) {

            problems.push(
                'nitidez'
            );
        }


        if (
            !capture.quality.checks.glare
        ) {

            problems.push(
                'reflejos'
            );
        }


        if (
            capture.quality.qualityLevel ===
            'good'
        ) {

            finalQuality.className =
                'final-quality good';


            finalQuality.innerHTML = `

                <strong>
                    ✓ Buena fotografía
                </strong>

                <span>
                    La pantalla quedó dentro de la guía
                    y la imagen tiene buena calidad.
                </span>
            `;

        } else {

            finalQuality.className =
                'final-quality warning';


            finalQuality.innerHTML = `

                <strong>
                    ⚠ Fotografía utilizable
                </strong>

                <span>
                    Puede continuar.
                    ${
                        problems.length
                            ? `Podría mejorar: ${problems.join(', ')}.`
                            : ''
                    }
                </span>
            `;
        }
    }


    captureButton.addEventListener(
        'click',
        () => {

            try {

                showPhotoReview(
                    VetLabCamera.capture()
                );

            } catch (error) {

                console.error(
                    error
                );


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


                showPhotoReview(
                    capture
                );

            } catch (error) {

                console.error(
                    error
                );


                alert(
                    'No se pudo abrir la fotografía.'
                );
            }


            fileInput.value =
                '';
        }
    );


    cancelReview.addEventListener(
        'click',
        startCamera
    );


    retakeButton.addEventListener(
        'click',
        startCamera
    );


    backToCamera.addEventListener(
        'click',
        startCamera
    );


    repeatReading.addEventListener(
        'click',
        startCamera
    );


    /* =====================================================
       PROGRESO
    ===================================================== */

    function showProgress(
        data
    ) {

        let percent =
            0;


        switch (
            data.stage
        ) {

            case 'image':

                processingMessage.textContent =
                    'Preparando fotografía…';

                percent =
                    5;

                break;


            case 'ocr':

                processingMessage.textContent =
                    'Iniciando lector…';

                percent =
                    12;

                break;


            case 'species':

                processingMessage.textContent =
                    'Detectando perro o gato…';

                percent =
                    18;

                break;


            case 'identity':

                processingMessage.textContent =
                    'Leyendo paciente y propietario…';

                percent =
                    28;

                break;


            case 'parameter':

                processingMessage.textContent =
                    `Leyendo ${data.name}…`;


                percent =

                    30 +

                    (
                        data.current /
                        data.total
                    ) *

                    65;

                break;
        }


        processingBar.style.width =
            `${Math.min(
                100,
                percent
            )}%`;
    }


    /* =====================================================
       OCR
    ===================================================== */

    usePhotoButton.addEventListener(
        'click',
        async () => {

            if (
                !currentCapture
            ) {

                return;
            }


            photoReview.hidden =
                true;


            processing.hidden =
                false;


            processingBar.style.width =
                '2%';


            try {

                currentReading =
                    await ExigoReader.read(

                        currentCapture.normalized,

                        showProgress
                    );


                processingBar.style.width =
                    '100%';


                normalizedPreview.src =
                    currentCapture.normalized;


                renderReading(
                    currentReading
                );


                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            250
                        )
                );


                processing.hidden =
                    true;


                resultScreen.hidden =
                    false;


            } catch (error) {

                console.error(
                    error
                );


                processing.hidden =
                    true;


                photoReview.hidden =
                    false;


                alert(
                    error.message ||
                    'No se pudo leer el hemograma.'
                );
            }
        }
    );


    /* =====================================================
       RESULTADOS
    ===================================================== */

    function statusText(
        status
    ) {

        if (
            status === 'ALTO'
        ) {

            return '↑ Alto';
        }


        if (
            status === 'BAJO'
        ) {

            return '↓ Bajo';
        }


        if (
            status === 'NORMAL'
        ) {

            return 'Normal';
        }


        return 'Revisar';
    }


    function referenceText(
        parameter
    ) {

        const decimals =
            parameter.decimals;


        const min =
            decimals
                ? Number(
                    parameter.min
                ).toFixed(
                    decimals
                )
                : parameter.min;


        const max =
            decimals
                ? Number(
                    parameter.max
                ).toFixed(
                    decimals
                )
                : parameter.max;


        return (
            `${min} – ${max}`
        );
    }


    function createResultsTable(
        parameters
    ) {

        resultsBody.innerHTML =
            '';


        parameters.forEach(
            parameter => {

                const status =
                    ExigoReader.statusFor(
                        parameter.value,
                        parameter
                    );


                const row =
                    document.createElement(
                        'tr'
                    );


                if (
                    !parameter.value ||
                    parameter.confidence < 50
                ) {

                    row.classList.add(
                        'needs-review'
                    );
                }


                row.innerHTML = `

                    <th>
                        ${parameter.name}
                    </th>

                    <td>

                        <input
                            class="result-input"
                            data-parameter="${parameter.id}"
                            inputmode="decimal"
                            value="${parameter.value || ''}"
                            required
                        >

                        <small>
                            ${
                                parameter.confidence
                                    ? `OCR ${Math.round(parameter.confidence)}%`
                                    : 'Confirmar'
                            }
                        </small>

                    </td>

                    <td>
                        ${parameter.unit}
                    </td>

                    <td>
                        ${referenceText(parameter)}
                    </td>

                    <td>

                        <span
                            class="result-status ${status.toLowerCase()}"
                            data-status="${parameter.id}"
                        >
                            ${statusText(status)}
                        </span>

                    </td>
                `;


                resultsBody.appendChild(
                    row
                );
            }
        );


        document
            .querySelectorAll(
                '.result-input'
            )
            .forEach(
                input => {

                    input.addEventListener(
                        'input',
                        () => {

                            updateResultStatus(
                                input.dataset.parameter
                            );


                            updateValidation();
                        }
                    );
                }
            );
    }


    function getCurrentParameters() {

        const config =
            ExigoReader.getConfig(
                speciesInput.value
            );


        return config.parameters.map(
            parameter => {

                const input =
                    document.querySelector(
                        `[data-parameter="${parameter.id}"]`
                    );


                return {

                    ...parameter,

                    value:
                        input
                            ? input.value.trim()
                            : '',

                    confidence:
                        100
                };
            }
        );
    }


    function updateResultStatus(
        id
    ) {

        const config =
            ExigoReader.getConfig(
                speciesInput.value
            );


        const parameter =
            config.parameters.find(
                item =>
                    item.id === id
            );


        if (!parameter) {

            return;
        }


        const input =
            document.querySelector(
                `[data-parameter="${id}"]`
            );


        const badge =
            document.querySelector(
                `[data-status="${id}"]`
            );


        const status =
            ExigoReader.statusFor(
                input.value,
                parameter
            );


        badge.className =
            `result-status ${status.toLowerCase()}`;


        badge.textContent =
            statusText(
                status
            );
    }


    /* =====================================================
       VALIDACIÓN
    ===================================================== */

    function updateValidation() {

        const parameters =
            getCurrentParameters();


        const messages =
            ExigoReader.validate(
                speciesInput.value,
                parameters
            );


        validationMessages.innerHTML =
            '';


        if (
            !messages.length
        ) {

            validationBadge.className =
                'validation-badge good';


            validationBadge.textContent =
                'Coherente';


            validationMessages.innerHTML = `

                <div class="validation-message good">

                    ✓ Las principales relaciones
                    matemáticas del hemograma son coherentes.

                </div>
            `;


            return;
        }


        const errors =
            messages.filter(
                message =>
                    message.type ===
                    'error'
            );


        validationBadge.className =
            errors.length
                ? 'validation-badge error'
                : 'validation-badge warning';


        validationBadge.textContent =
            `${messages.length} por revisar`;


        messages.forEach(
            message => {

                const div =
                    document.createElement(
                        'div'
                    );


                div.className =
                    `validation-message ${message.type}`;


                div.textContent =
                    message.text;


                validationMessages.appendChild(
                    div
                );
            }
        );
    }


    /* =====================================================
       MOSTRAR LECTURA
    ===================================================== */

    function renderReading(
        reading
    ) {

        ownerInput.value =
            reading.identity.owner;


        patientInput.value =
            reading.identity.patient;


        speciesInput.value =
            reading.species;


        detectedSpecies.textContent =
            reading.speciesDetected
                ? reading.config.label
                : 'Confirmar manualmente';


        recognitionStatus.textContent =
            reading.speciesDetected
                ? 'Lectura completada'
                : 'Revisión necesaria';


        createResultsTable(
            reading.parameters
        );


        dateInput.value =
            today();


        updateValidation();
    }


    /* =====================================================
       CAMBIO DE ESPECIE
    ===================================================== */

    speciesInput.addEventListener(
        'change',
        () => {

            const config =
                ExigoReader.getConfig(
                    speciesInput.value
                );


            createResultsTable(
                config.parameters.map(
                    parameter => ({
                        ...parameter,
                        value: '',
                        confidence: 0
                    })
                )
            );


            detectedSpecies.textContent =
                config.label;


            updateValidation();
        }
    );


    /* =====================================================
       REPORTE
    ===================================================== */

    confirmationForm.addEventListener(
        'submit',
        event => {

            event.preventDefault();


            const parameters =
                getCurrentParameters();


            const validations =
                ExigoReader.validate(
                    speciesInput.value,
                    parameters
                );


            const missing =
                validations.some(
                    message =>
                        message.type ===
                        'error'
                );


            if (
                missing
            ) {

                updateValidation();


                alert(
                    'Hay valores que todavía necesitan confirmarse.'
                );


                return;
            }


            const rows =
                parameters.map(
                    parameter => {

                        const status =
                            ExigoReader.statusFor(
                                parameter.value,
                                parameter
                            );


                        return {

                            id:
                                parameter.id,

                            parametro:
                                parameter.name,

                            resultado:
                                parameter.value,

                            unidad:
                                parameter.unit,

                            minimo:
                                parameter.min,

                            maximo:
                                parameter.max,

                            referencia:
                                referenceText(
                                    parameter
                                ),

                            estado:
                                status
                        };
                    }
                );


            const report = {

                propietario:
                    ExigoReader.normalizeName(
                        ownerInput.value
                    ),

                paciente:
                    ExigoReader.normalizeName(
                        patientInput.value
                    ),

                especie:
                    speciesInput.value,

                edad:
                    ageInput.value.trim(),

                expediente:
                    recordInput.value.trim(),

                veterinario:
                    ExigoReader.normalizeName(
                        vetInput.value
                    ),

                fecha:
                    dateInput.value,

                reporte:
                    reportNumber(),

                observaciones:
                    notesInput.value
                        .trim()
                        .slice(
                            0,
                            800
                        ),

                equipo:
                    'Exigo H400',

                controlCalidad:
                    validations.map(
                        item =>
                            item.text
                    ),

                filas:
                    rows
            };


            sessionStorage.setItem(
                'vetlab_ultimo_reporte',
                JSON.stringify(
                    report
                )
            );


            window.location.href =
                './reporte.html';
        }
    );


    await startCamera();
}
