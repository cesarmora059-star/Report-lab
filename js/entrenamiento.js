'use strict';


document.addEventListener(
    'DOMContentLoaded',
    initTraining
);


async function initTraining() {


    const CONFIG =
        window.EXIGO_CONFIG;


    const video =
        document.querySelector(
            '#training-video'
        );


    const cameraCanvas =
        document.querySelector(
            '#training-camera-canvas'
        );


    const guide =
        document.querySelector(
            '#training-guide'
        );


    const captureButton =
        document.querySelector(
            '#capture-training'
        );


    const selectPhotoButton =
        document.querySelector(
            '#select-training-photo'
        );


    const fileInput =
        document.querySelector(
            '#training-file'
        );


    const captureSection =
        document.querySelector(
            '#capture-section'
        );


    const labelSection =
        document.querySelector(
            '#label-section'
        );


    const speciesSelect =
        document.querySelector(
            '#training-species'
        );


    const normalizedPreview =
        document.querySelector(
            '#training-normalized-preview'
        );


    const fieldsContainer =
        document.querySelector(
            '#training-fields'
        );


    const saveButton =
        document.querySelector(
            '#save-sample'
        );


    const discardButton =
        document.querySelector(
            '#discard-sample'
        );


    const datasetCount =
        document.querySelector(
            '#dataset-count'
        );


    const cropCount =
        document.querySelector(
            '#crop-count'
        );


    const exportButton =
        document.querySelector(
            '#export-dataset'
        );


    const clearButton =
        document.querySelector(
            '#clear-dataset'
        );


    let currentNormalizedImage =
        null;


    let currentCanvas =
        null;


    let currentFields =
        [];


    const database =
        await openDatabase();


    /* =====================================================
       INICIAR CÁMARA
    ===================================================== */

    try {

        await VetLabCamera.init(
            video,
            cameraCanvas,
            guide
        );

    } catch (error) {

        console.warn(
            'No se pudo abrir cámara:',
            error
        );
    }


    await updateStats();



    /* =====================================================
       CAPTURAR
    ===================================================== */

    captureButton.addEventListener(
        'click',
        () => {

            try {

                const capture =
                    VetLabCamera.capture();


                prepareSample(
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



    /* =====================================================
       GALERÍA
    ===================================================== */

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


                prepareSample(
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
       ESPECIE
    ===================================================== */

    speciesSelect.addEventListener(
        'change',
        () => {

            if (
                currentCanvas
            ) {

                renderFields();
            }
        }
    );



    /* =====================================================
       PREPARAR MUESTRA
    ===================================================== */

    async function prepareSample(
        dataURL
    ) {

        VetLabCamera.stop();


        currentNormalizedImage =
            dataURL;


        normalizedPreview.src =
            dataURL;


        currentCanvas =
            await imageDataURLToCanvas(
                dataURL
            );


        captureSection.hidden =
            true;


        labelSection.hidden =
            false;


        renderFields();


        labelSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }



    /* =====================================================
       RECORTE
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
            sw * scale;


        output.height =
            sh * scale;


        const context =
            output.getContext(
                '2d'
            );


        context.imageSmoothingEnabled =
            true;


        context.drawImage(

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



    /* =====================================================
       CAMPOS
    ===================================================== */

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


        /*
         * ID
         */

        addTrainingField({

            id: 'owner',

            label: 'ID',

            type: 'text',

            region:
                CONFIG.screen.owner
        });


        /*
         * ID2
         */

        addTrainingField({

            id: 'patient',

            label: 'ID2',

            type: 'text',

            region:
                CONFIG.screen.patient
        });


        /*
         * DOG / CAT
         */

        addTrainingField({

            id: 'species',

            label: 'DOG / CAT',

            type: 'species',

            fixedValue:
                profile.code,

            region:
                CONFIG.screen.species
        });


        /*
         * PARÁMETROS
         */

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
                currentCanvas,
                field.region,
                field.type ===
                    'numeric'
                    ? 5
                    : 4
            );


        const cropDataURL =
            cropCanvas.toDataURL(
                'image/png'
            );


        const card =
            document.createElement(
                'div'
            );


        card.className =
            'training-field';


        let inputMode =
            'text';


        if (
            field.type ===
            'numeric'
        ) {

            inputMode =
                'decimal';
        }


        const initialValue =
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
                    inputmode="${inputMode}"
                    data-field="${field.id}"
                    value="${initialValue}"
                    autocomplete="off"
                    ${field.fixedValue ? 'readonly' : ''}
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
       GUARDAR EJEMPLO
    ===================================================== */

    saveButton.addEventListener(
        'click',
        async () => {

            if (
                !currentCanvas
            ) {

                return;
            }


            const species =
                speciesSelect.value;


            const labels = [];


            currentFields.forEach(
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
                        field.type ===
                        'text'
                    ) {

                        value =
                            value.toUpperCase();
                    }


                    if (
                        field.type ===
                        'species'
                    ) {

                        value =
                            CONFIG[
                                species
                            ].code;
                    }


                    if (
                        field.type ===
                        'numeric'
                    ) {

                        value =
                            normalizeNumericLabel(
                                value
                            );
                    }


                    /*
                     * Si un ID está realmente vacío
                     * simplemente no se utilizará
                     * como muestra textual.
                     */

                    labels.push({

                        id:
                            field.id,

                        label:
                            field.label,

                        type:
                            field.type,

                        value,

                        cropDataURL:
                            field.cropDataURL
                    });
                }
            );


            const numericMissing =
                labels.some(
                    item =>
                        item.type ===
                            'numeric' &&
                        !item.value
                );


            if (
                numericMissing
            ) {

                alert(
                    'Complete todos los resultados numéricos antes de guardar.'
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


            alert(
                'Ejemplo guardado correctamente.'
            );


            await updateStats();


            resetCapture();
        }
    );



    /* =====================================================
       DESCARTAR
    ===================================================== */

    discardButton.addEventListener(
        'click',
        resetCapture
    );



    async function resetCapture() {

        currentNormalizedImage =
            null;


        currentCanvas =
            null;


        currentFields =
            [];


        fieldsContainer.innerHTML =
            '';


        labelSection.hidden =
            true;


        captureSection.hidden =
            false;


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


        captureSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }



    /* =====================================================
       EXPORTAR DATASET
    ===================================================== */

    exportButton.addEventListener(
        'click',
        async () => {

            if (
                !window.JSZip
            ) {

                alert(
                    'No se pudo cargar el exportador ZIP.'
                );


                return;
            }


            const samples =
                await getAllSamples(
                    database
                );


            if (
                !samples.length
            ) {

                alert(
                    'Todavía no hay ejemplos guardados.'
                );


                return;
            }


            const zip =
                new JSZip();


            const metadata = [];


            for (
                const sample of samples
            ) {

                const folder =
                    zip.folder(
                        sample.id
                    );


                const sampleMeta = {

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

                    /*
                     * Campos vacíos de texto no
                     * se exportan para entrenamiento.
                     */

                    if (
                        field.type === 'text' &&
                        !field.value
                    ) {

                        continue;
                    }


                    const safeName =
                        sanitizeFilename(
                            field.id
                        );


                    const fileName =
                        `${safeName}.png`;


                    const base64 =
                        field.cropDataURL.split(
                            ','
                        )[1];


                    folder.file(
                        fileName,
                        base64,
                        {
                            base64: true
                        }
                    );


                    sampleMeta.fields.push({

                        id:
                            field.id,

                        label:
                            field.label,

                        type:
                            field.type,

                        value:
                            field.value,

                        image:
                            `${sample.id}/${fileName}`
                    });
                }


                metadata.push(
                    sampleMeta
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
                    type: 'blob'
                });


            downloadBlob(

                blob,

                `exigo_dataset_${dateForFilename()}.zip`
            );
        }
    );



    /* =====================================================
       BORRAR DATASET
    ===================================================== */

    clearButton.addEventListener(
        'click',
        async () => {

            const confirmDelete =
                confirm(
                    '¿Está seguro de borrar todos los ejemplos guardados en este dispositivo?'
                );


            if (
                !confirmDelete
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


        let crops =
            0;


        samples.forEach(
            sample => {

                crops +=
                    sample.fields.filter(
                        field =>
                            field.value
                    ).length;
            }
        );


        cropCount.textContent =
            String(
                crops
            );
    }
}



/* =========================================================
   NORMALIZAR NÚMEROS
========================================================= */

function normalizeNumericLabel(
    value
) {

    return String(
        value || ''
    )

        .trim()

        .replace(
            ',',
            '.'
        )

        .replace(
            /[^0-9.]/g,
            ''
        );
}



/* =========================================================
   IMAGEN → CANVAS
========================================================= */

function imageDataURLToCanvas(
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
                () => {

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


                    resolve(
                        canvas
                    );
                };


            image.onerror =
                reject;


            image.src =
                dataURL;
        }
    );
}



/* =========================================================
   ID DE EJEMPLO
========================================================= */

function createSampleId() {

    const now =
        new Date();


    const pad =
        value =>
            String(
                value
            ).padStart(
                2,
                '0'
            );


    const random =
        Math.random()
            .toString(36)
            .slice(
                2,
                6
            )
            .toUpperCase();


    return (

        'EXIGO_' +

        now.getFullYear() +

        pad(
            now.getMonth() + 1
        ) +

        pad(
            now.getDate()
        ) +

        '_' +

        pad(
            now.getHours()
        ) +

        pad(
            now.getMinutes()
        ) +

        pad(
            now.getSeconds()
        ) +

        '_' +

        random
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

                    const db =
                        event.target.result;


                    if (
                        !db.objectStoreNames.contains(
                            'samples'
                        )
                    ) {

                        db.createObjectStore(
                            'samples',
                            {
                                keyPath:
                                    'id'
                            }
                        );
                    }
                };


            request.onsuccess =
                () => {

                    resolve(
                        request.result
                    );
                };


            request.onerror =
                () => {

                    reject(
                        request.error
                    );
                };
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


            const store =
                transaction.objectStore(
                    'samples'
                );


            store.put(
                sample
            );


            transaction.oncomplete =
                () => resolve();


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

            const transaction =
                database.transaction(
                    'samples',
                    'readonly'
                );


            const store =
                transaction.objectStore(
                    'samples'
                );


            const request =
                store.getAll();


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


            const store =
                transaction.objectStore(
                    'samples'
                );


            store.clear();


            transaction.oncomplete =
                () => resolve();


            transaction.onerror =
                () =>
                    reject(
                        transaction.error
                    );
        }
    );
}



/* =========================================================
   EXPORTACIÓN
========================================================= */

function sanitizeFilename(
    value
) {

    return String(
        value || 'field'
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
