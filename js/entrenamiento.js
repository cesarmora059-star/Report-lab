'use strict';


document.addEventListener(
    'DOMContentLoaded',
    initTraining
);


async function initTraining() {


    const CONFIG =
        window.EXIGO_CONFIG;


    const $ =
        selector =>
            document.querySelector(
                selector
            );


    const video =
        $('#training-video');


    const cameraCanvas =
        $('#training-camera-canvas');


    const guide =
        $('#training-guide');


    const captureButton =
        $('#capture-training');


    const selectPhotoButton =
        $('#select-training-photo');


    const fileInput =
        $('#training-file');


    const captureSection =
        $('#capture-section');


    const perspectiveSection =
        $('#perspective-section');


    const labelSection =
        $('#label-section');


    const perspectiveSource =
        $('#perspective-source');


    const rectifiedImage =
        $('#rectified-image');


    const perspectiveStatus =
        $('#perspective-status');


    const perspectiveDescription =
        $('#perspective-description');


    const cornerEditor =
        $('#corner-editor');


    const polygon =
        $('#perspective-polygon');


    const perspectiveRepeat =
        $('#perspective-repeat');


    const perspectiveAuto =
        $('#perspective-auto');


    const perspectiveConfirm =
        $('#perspective-confirm');


    const speciesSelect =
        $('#training-species');


    const normalizedPreview =
        $('#training-normalized-preview');


    const fieldsContainer =
        $('#training-fields');


    const saveButton =
        $('#save-sample');


    const discardButton =
        $('#discard-sample');


    const datasetCount =
        $('#dataset-count');


    const cropCount =
        $('#crop-count');


    const exportButton =
        $('#export-dataset');


    const clearButton =
        $('#clear-dataset');


    const handles = {

        tl:
            $('#corner-tl'),

        tr:
            $('#corner-tr'),

        br:
            $('#corner-br'),

        bl:
            $('#corner-bl')
    };


    let currentGuideImage =
        null;


    let currentGuideCanvas =
        null;


    let currentPoints =
        null;


    let currentRectifiedCanvas =
        null;


    let currentFields =
        [];


    let draggingCorner =
        null;


    const database =
        await openDatabase();


    /* =====================================================
       CÁMARA
    ===================================================== */

    async function startCamera() {

        captureSection.hidden =
            false;


        perspectiveSection.hidden =
            true;


        labelSection.hidden =
            true;


        try {

            await VetLabCamera.init(
                video,
                cameraCanvas,
                guide
            );

        } catch (error) {

            console.warn(
                error
            );
        }
    }


    await startCamera();


    await updateStats();



    /* =====================================================
       CAPTURA
    ===================================================== */

    captureButton.addEventListener(
        'click',
        () => {

            try {

                const capture =
                    VetLabCamera.capture();


                beginPerspective(
                    capture.normalized
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



    selectPhotoButton.addEventListener(
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


                beginPerspective(
                    capture.normalized
                );

            } catch (error) {

                console.error(
                    error
                );


                alert(
                    'No se pudo procesar la fotografía.'
                );
            }


            fileInput.value =
                '';
        }
    );



    /* =====================================================
       PERSPECTIVA
    ===================================================== */

    async function beginPerspective(
        dataURL
    ) {

        VetLabCamera.stop();


        currentGuideImage =
            dataURL;


        captureSection.hidden =
            true;


        perspectiveSection.hidden =
            false;


        labelSection.hidden =
            true;


        perspectiveSource.src =
            dataURL;


        perspectiveStatus.className =
            'perspective-status checking';


        perspectiveStatus.innerHTML = `

            <strong>
                Detectando pantalla
            </strong>

            <span>
                Buscando las cuatro esquinas del LCD…
            </span>
        `;


        perspectiveDescription.textContent =
            'Buscando automáticamente las esquinas del LCD…';


        try {

            const detection =
                await ExigoPerspective.detect(
                    dataURL
                );


            currentGuideCanvas =
                detection.canvas;


            currentPoints =
                clonePoints(
                    detection.points
                );


            if (
                detection.success
            ) {

                perspectiveStatus.className =
                    'perspective-status good';


                perspectiveStatus.innerHTML = `

                    <strong>
                        ✓ Pantalla detectada
                    </strong>

                    <span>
                        Revise las cuatro esquinas antes de continuar.
                    </span>
                `;


                perspectiveDescription.textContent =
                    'La detección automática encontró un contorno compatible con el LCD.';

            } else {

                perspectiveStatus.className =
                    'perspective-status warning';


                perspectiveStatus.innerHTML = `

                    <strong>
                        ⚠ Ajuste manual necesario
                    </strong>

                    <span>
                        Mueva los cuatro puntos hasta las esquinas reales de la pantalla.
                    </span>
                `;


                perspectiveDescription.textContent =
                    'No se encontró una pantalla con suficiente seguridad.';
            }


            await waitForImageLayout();


            updateCornerEditor();


            updateRectifiedPreview();


        } catch (error) {

            console.error(
                error
            );


            alert(
                'No se pudo analizar la perspectiva.'
            );


            await startCamera();
        }
    }



    function clonePoints(
        points
    ) {

        return {

            tl: {
                ...points.tl
            },

            tr: {
                ...points.tr
            },

            br: {
                ...points.br
            },

            bl: {
                ...points.bl
            }
        };
    }



    function waitForImageLayout() {

        return new Promise(
            resolve => {

                if (
                    perspectiveSource.complete &&
                    perspectiveSource.clientWidth
                ) {

                    requestAnimationFrame(
                        resolve
                    );

                    return;
                }


                perspectiveSource.onload =
                    () =>
                        requestAnimationFrame(
                            resolve
                        );
            }
        );
    }



    /* =====================================================
       COORDENADAS IMAGEN ↔ INTERFAZ
    ===================================================== */

    function imagePointToDisplay(
        point
    ) {

        const width =
            perspectiveSource.clientWidth;


        const height =
            perspectiveSource.clientHeight;


        return {

            x:
                point.x /
                currentGuideCanvas.width *
                width,

            y:
                point.y /
                currentGuideCanvas.height *
                height
        };
    }



    function displayPointToImage(
        x,
        y
    ) {

        return {

            x:
                x /
                perspectiveSource.clientWidth *
                currentGuideCanvas.width,

            y:
                y /
                perspectiveSource.clientHeight *
                currentGuideCanvas.height
        };
    }



    function updateCornerEditor() {

        if (
            !currentPoints
        ) {

            return;
        }


        const width =
            perspectiveSource.clientWidth;


        const height =
            perspectiveSource.clientHeight;


        const svgPoints = [];


        [
            'tl',
            'tr',
            'br',
            'bl'
        ]
            .forEach(
                key => {

                    const display =
                        imagePointToDisplay(
                            currentPoints[
                                key
                            ]
                        );


                    const handle =
                        handles[
                            key
                        ];


                    handle.style.left =
                        `${display.x}px`;


                    handle.style.top =
                        `${display.y}px`;


                    svgPoints.push(

                        `${display.x / width * 1000},${display.y / height * 1000}`
                    );
                }
            );


        polygon.setAttribute(
            'points',
            svgPoints.join(
                ' '
            )
        );
    }



    function updateRectifiedPreview() {

        if (
            !currentGuideCanvas ||
            !currentPoints
        ) {

            return;
        }


        try {

            currentRectifiedCanvas =
                ExigoPerspective.rectify(

                    currentGuideCanvas,

                    currentPoints
                );


            rectifiedImage.src =
                currentRectifiedCanvas
                    .toDataURL(
                        'image/jpeg',
                        0.96
                    );


        } catch (error) {

            console.error(
                error
            );
        }
    }



    /* =====================================================
       ARRASTRAR ESQUINAS
    ===================================================== */

    Object.entries(
        handles
    )
        .forEach(
            (
                [
                    key,
                    handle
                ]
            ) => {

                handle.addEventListener(
                    'pointerdown',
                    event => {

                        draggingCorner =
                            key;


                        handle.setPointerCapture(
                            event.pointerId
                        );


                        event.preventDefault();
                    }
                );


                handle.addEventListener(
                    'pointermove',
                    event => {

                        if (
                            draggingCorner !==
                            key
                        ) {

                            return;
                        }


                        const rect =
                            cornerEditor
                                .getBoundingClientRect();


                        let x =
                            event.clientX -
                            rect.left;


                        let y =
                            event.clientY -
                            rect.top;


                        x =
                            Math.max(
                                0,
                                Math.min(
                                    perspectiveSource.clientWidth,
                                    x
                                )
                            );


                        y =
                            Math.max(
                                0,
                                Math.min(
                                    perspectiveSource.clientHeight,
                                    y
                                )
                            );


                        currentPoints[
                            key
                        ] =
                            displayPointToImage(
                                x,
                                y
                            );


                        updateCornerEditor();


                        event.preventDefault();
                    }
                );


                handle.addEventListener(
                    'pointerup',
                    () => {

                        draggingCorner =
                            null;


                        updateRectifiedPreview();
                    }
                );


                handle.addEventListener(
                    'pointercancel',
                    () => {

                        draggingCorner =
                            null;


                        updateRectifiedPreview();
                    }
                );
            }
        );



    /* =====================================================
       REDETECTAR
    ===================================================== */

    perspectiveAuto.addEventListener(
        'click',
        async () => {

            if (
                !currentGuideImage
            ) {

                return;
            }


            perspectiveStatus.className =
                'perspective-status checking';


            perspectiveStatus.innerHTML = `

                <strong>
                    Detectando otra vez
                </strong>

                <span>
                    Analizando bordes…
                </span>
            `;


            try {

                const detection =
                    await ExigoPerspective.detect(
                        currentGuideImage
                    );


                currentGuideCanvas =
                    detection.canvas;


                currentPoints =
                    clonePoints(
                        detection.points
                    );


                updateCornerEditor();

                updateRectifiedPreview();


                perspectiveStatus.className =
                    detection.success
                        ? 'perspective-status good'
                        : 'perspective-status warning';


                perspectiveStatus.innerHTML =
                    detection.success
                        ? `
                            <strong>✓ Pantalla detectada</strong>
                            <span>Revise las esquinas.</span>
                          `
                        : `
                            <strong>⚠ Ajuste manual</strong>
                            <span>Mueva los cuatro puntos.</span>
                          `;


            } catch (error) {

                console.error(
                    error
                );
            }
        }
    );



    perspectiveRepeat.addEventListener(
        'click',
        startCamera
    );



    perspectiveConfirm.addEventListener(
        'click',
        () => {

            if (
                !currentRectifiedCanvas
            ) {

                return;
            }


            prepareLabeling(
                currentRectifiedCanvas
            );
        }
    );



    /* =====================================================
       ETIQUETADO
    ===================================================== */

    function prepareLabeling(
        rectifiedCanvas
    ) {

        currentGuideCanvas =
            rectifiedCanvas;


        const dataURL =
            rectifiedCanvas
                .toDataURL(
                    'image/jpeg',
                    0.97
                );


        normalizedPreview.src =
            dataURL;


        perspectiveSection.hidden =
            true;


        labelSection.hidden =
            false;


        renderFields();


        labelSection.scrollIntoView({

            behavior:
                'smooth',

            block:
                'start'
        });
    }



    speciesSelect.addEventListener(
        'change',
        () => {

            if (
                currentGuideCanvas &&
                !labelSection.hidden
            ) {

                renderFields();
            }
        }
    );



    /* =====================================================
       RECORTES
    ===================================================== */

    function cropRegion(
        sourceCanvas,
        region,
        scale = 4
    ) {

        const sx =
            Math.round(
                sourceCanvas.width *
                region.x
            );


        const sy =
            Math.round(
                sourceCanvas.height *
                region.y
            );


        const sw =
            Math.max(
                1,
                Math.round(
                    sourceCanvas.width *
                    region.width
                )
            );


        const sh =
            Math.max(
                1,
                Math.round(
                    sourceCanvas.height *
                    region.height
                )
            );


        const output =
            document.createElement(
                'canvas'
            );


        output.width =
            sw *
            scale;


        output.height =
            sh *
            scale;


        output
            .getContext(
                '2d'
            )
            .drawImage(

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



    function renderFields() {

        fieldsContainer.innerHTML =
            '';


        currentFields =
            [];


        const species =
            speciesSelect.value;


        const profile =
            CONFIG[
                species
            ];


        addTrainingField({

            id:
                'owner',

            label:
                'ID',

            type:
                'text',

            region:
                CONFIG.screen.owner
        });


        addTrainingField({

            id:
                'patient',

            label:
                'ID2',

            type:
                'text',

            region:
                CONFIG.screen.patient
        });


        addTrainingField({

            id:
                'species',

            label:
                'DOG / CAT',

            type:
                'species',

            fixedValue:
                profile.code,

            region:
                CONFIG.screen.species
        });


        profile.parameters.forEach(
            parameter => {

                addTrainingField({

                    id:
                        parameter.id,

                    label:
                        parameter.label,

                    type:
                        'numeric',

                    decimals:
                        parameter.decimals,

                    region:
                        parameter
                });
            }
        );
    }



    function addTrainingField(
        field
    ) {

        const cropCanvas =
            cropRegion(

                currentGuideCanvas,

                field.region,

                field.type ===
                    'numeric'
                    ? 5
                    : 4
            );


        const cropDataURL =
            cropCanvas
                .toDataURL(
                    'image/png'
                );


        const card =
            document.createElement(
                'div'
            );


        card.className =
            'training-field';


        const initial =
            field.fixedValue ||
            '';


        card.innerHTML = `

            <div class="training-crop">

                <img
                    src="${cropDataURL}"
                    alt="${field.label}"
                >

            </div>


            <div class="training-field-body">

                <div class="training-field-header">

                    <strong>
                        ${field.label}
                    </strong>

                    <span>
                        ${field.type}
                    </span>

                </div>


                <input
                    type="text"
                    inputmode="${
                        field.type === 'numeric'
                            ? 'decimal'
                            : 'text'
                    }"
                    data-field="${field.id}"
                    value="${initial}"
                    autocomplete="off"
                    ${
                        field.fixedValue
                            ? 'readonly'
                            : ''
                    }
                >

            </div>
        `;


        fieldsContainer.appendChild(
            card
        );


        currentFields.push({

            ...field,

            cropDataURL
        });
    }



    /* =====================================================
       GUARDAR DATASET
    ===================================================== */

    saveButton.addEventListener(
        'click',
        async () => {

            const species =
                speciesSelect.value;


            const labels =
                currentFields.map(
                    field => {

                        const input =
                            document.querySelector(
                                `[data-field="${field.id}"]`
                            );


                        let value =
                            input
                                ? input.value.trim()
                                : '';


                        if (
                            field.type === 'text'
                        ) {

                            value =
                                value.toUpperCase();
                        }


                        if (
                            field.type === 'species'
                        ) {

                            value =
                                CONFIG[
                                    species
                                ].code;
                        }


                        if (
                            field.type === 'numeric'
                        ) {

                            value =
                                normalizeNumericLabel(
                                    value
                                );
                        }


                        return {

                            id:
                                field.id,

                            label:
                                field.label,

                            type:
                                field.type,

                            value,

                            cropDataURL:
                                field.cropDataURL
                        };
                    }
                );


            const missingNumeric =
                labels.some(
                    item =>
                        item.type ===
                            'numeric' &&
                        !item.value
                );


            if (
                missingNumeric
            ) {

                alert(
                    'Complete todos los valores numéricos.'
                );


                return;
            }


            const sample = {

                id:
                    createSampleId(),

                createdAt:
                    new Date()
                        .toISOString(),

                species,

                speciesCode:
                    CONFIG[
                        species
                    ].code,

                fields:
                    labels
            };


            await saveSample(

                database,

                sample
            );


            await updateStats();


            alert(
                'Ejemplo guardado.'
            );


            await startCamera();
        }
    );



    discardButton.addEventListener(
        'click',
        startCamera
    );



    /* =====================================================
       ESTADÍSTICAS
    ===================================================== */

    async function updateStats() {

        const samples =
            await getAllSamples(
                database
            );


        datasetCount.textContent =
            String(
                samples.length
            );


        const crops =
            samples.reduce(
                (
                    total,
                    sample
                ) =>

                    total +

                    sample.fields.filter(
                        field =>
                            field.value
                    ).length,

                0
            );


        cropCount.textContent =
            String(
                crops
            );
    }



    /* =====================================================
       EXPORTACIÓN
    ===================================================== */

    exportButton.addEventListener(
        'click',
        async () => {

            const samples =
                await getAllSamples(
                    database
                );


            if (
                !samples.length
            ) {

                alert(
                    'No hay ejemplos guardados.'
                );


                return;
            }


            const zip =
                new JSZip();


            const metadata =
                [];


            for (
                const sample of samples
            ) {

                const folder =
                    zip.folder(
                        sample.id
                    );


                const meta = {

                    id:
                        sample.id,

                    createdAt:
                        sample.createdAt,

                    species:
                        sample.species,

                    speciesCode:
                        sample.speciesCode,

                    fields:
                        []
                };


                for (
                    const field of sample.fields
                ) {

                    if (
                        !field.value
                    ) {

                        continue;
                    }


                    const filename =
                        `${sanitizeFilename(field.id)}.png`;


                    const base64 =
                        field.cropDataURL
                            .split(
                                ','
                            )[1];


                    folder.file(

                        filename,

                        base64,

                        {
                            base64:
                                true
                        }
                    );


                    meta.fields.push({

                        id:
                            field.id,

                        label:
                            field.label,

                        type:
                            field.type,

                        value:
                            field.value,

                        image:
                            `${sample.id}/${filename}`
                    });
                }


                metadata.push(
                    meta
                );
            }


            zip.file(

                'labels.json',

                JSON.stringify(
                    metadata,
                    null,
                    2
                )
            );


            const blob =
                await zip.generateAsync({
                    type:
                        'blob'
                });


            downloadBlob(

                blob,

                `exigo_dataset_${dateForFilename()}.zip`
            );
        }
    );



    clearButton.addEventListener(
        'click',
        async () => {

            if (
                !confirm(
                    '¿Borrar todo el dataset de este dispositivo?'
                )
            ) {

                return;
            }


            await clearSamples(
                database
            );


            await updateStats();
        }
    );



    /* =====================================================
       RESIZE
    ===================================================== */

    window.addEventListener(
        'resize',
        () => {

            if (
                currentPoints &&
                !perspectiveSection.hidden
            ) {

                updateCornerEditor();
            }
        }
    );
}



/* =========================================================
   UTILIDADES
========================================================= */

function normalizeNumericLabel(
    value
) {

    return String(
        value || ''
    )

        .trim()

        .replace(
            /,/g,
            '.'
        )

        .replace(
            /[^0-9.]/g,
            ''
        );
}



function createSampleId() {

    return (

        'EXIGO_' +

        new Date()
            .toISOString()
            .replace(
                /[-:.TZ]/g,
                ''
            )
            .slice(
                0,
                14
            ) +

        '_' +

        Math.random()
            .toString(36)
            .slice(
                2,
                6
            )
            .toUpperCase()
    );
}



function sanitizeFilename(
    value
) {

    return String(
        value
    )
        .replace(
            /[^a-z0-9_-]/gi,
            '_'
        );
}



function dateForFilename() {

    return new Date()
        .toISOString()
        .slice(
            0,
            10
        )
        .replace(
            /-/g,
            ''
        );
}



function downloadBlob(
    blob,
    filename
) {

    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            'a'
        );


    link.href =
        url;


    link.download =
        filename;


    document.body.appendChild(
        link
    );


    link.click();


    setTimeout(
        () => {

            URL.revokeObjectURL(
                url
            );

            link.remove();

        },
        1000
    );
}



/* =========================================================
   INDEXED DB
========================================================= */

function openDatabase() {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            const request =
                indexedDB.open(
                    'VetLabExigoTraining',
                    1
                );


            request.onupgradeneeded =
                event => {

                    const database =
                        event.target.result;


                    if (
                        !database
                            .objectStoreNames
                            .contains(
                                'samples'
                            )
                    ) {

                        database
                            .createObjectStore(
                                'samples',
                                {
                                    keyPath:
                                        'id'
                                }
                            );
                    }
                };


            request.onsuccess =
                () =>
                    resolve(
                        request.result
                    );


            request.onerror =
                () =>
                    reject(
                        request.error
                    );
        }
    );
}



function saveSample(
    database,
    sample
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            const transaction =
                database.transaction(
                    'samples',
                    'readwrite'
                );


            transaction
                .objectStore(
                    'samples'
                )
                .put(
                    sample
                );


            transaction.oncomplete =
                resolve;


            transaction.onerror =
                () =>
                    reject(
                        transaction.error
                    );
        }
    );
}



function getAllSamples(
    database
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            const request =
                database
                    .transaction(
                        'samples',
                        'readonly'
                    )
                    .objectStore(
                        'samples'
                    )
                    .getAll();


            request.onsuccess =
                () =>
                    resolve(
                        request.result ||
                        []
                    );


            request.onerror =
                () =>
                    reject(
                        request.error
                    );
        }
    );
}



function clearSamples(
    database
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            const transaction =
                database.transaction(
                    'samples',
                    'readwrite'
                );


            transaction
                .objectStore(
                    'samples'
                )
                .clear();


            transaction.oncomplete =
                resolve;


            transaction.onerror =
                () =>
                    reject(
                        transaction.error
                    );
        }
    );
}
