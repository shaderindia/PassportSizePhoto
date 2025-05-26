document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const unitRadios = document.querySelectorAll('input[name="units"]');
    const pixelDensityGroup = document.getElementById('pixelDensityGroup');
    const pixelDensityInput = document.getElementById('pixelDensity');
    const photoWidthInput = document.getElementById('photoWidth');
    const photoLengthInput = document.getElementById('photoLength');
    const photoWidthUnit = document.getElementById('photoWidthUnit');
    const photoLengthUnit = document.getElementById('photoLengthUnit');
    const pageSizeRadios = document.querySelectorAll('input[name="pageSize"]');
    const customPageSize = document.getElementById('customPageSize');
    const customPageWidthInput = document.getElementById('customPageWidth');
    const customPageHeightInput = document.getElementById('customPageHeight');
    const customPageWidthUnit = document.getElementById('customPageWidthUnit');
    const customPageHeightUnit = document.getElementById('customPageHeightUnit');
    const uploadArea = document.getElementById('uploadArea');
    const photoUploadInput = document.getElementById('photoUpload');
    const browsePhotosLink = document.getElementById('browsePhotos');
    const photoPreviewContainer = document.getElementById('photoPreviewContainer');
    const photoPreview = document.getElementById('photoPreview');
    const photoControls = document.getElementById('photoControls');
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    const rotateLeftBtn = document.getElementById('rotateLeft');
    const rotateRightBtn = document.getElementById('rotateRight');
    const cropPhotoBtn = document.getElementById('cropPhoto');
    const croppingOverlay = document.getElementById('croppingOverlay');
    const cropBox = document.getElementById('cropBox');
    const cropBoxHandles = cropBox.querySelectorAll('.handle'); // Get handles
    const photoHint = document.getElementById('photoHint');
    const numPhotosInput = document.getElementById('numPhotos');
    const autoSpacingCheckbox = document.getElementById('autoSpacing');
    const manualSpacingDiv = document.getElementById('manualSpacing');
    const horizontalSpacingInput = document.getElementById('horizontalSpacing');
    const horizontalSpacingValue = document.getElementById('horizontalSpacingValue');
    const verticalSpacingInput = document.getElementById('verticalSpacing');
    const verticalSpacingValue = document.getElementById('verticalSpacingValue');
    const autoMarginCheckbox = document.getElementById('autoMargin');
    const manualMarginDiv = document.getElementById('manualMargin');
    const topMarginInput = document.getElementById('topMargin');
    const topMarginValue = document.getElementById('topMarginValue');
    const leftMarginInput = document.getElementById('leftMargin');
    const leftMarginValue = document.getElementById('leftMarginValue');
    const outputPreview = document.getElementById('outputPreview');
    const downloadFormatSelect = document.getElementById('downloadFormat');
    const downloadBtn = document.getElementById('downloadBtn');
    const shareAppBtn = document.getElementById('shareAppBtn');

    // Default values and state
    let currentUnit = 'mm';
    let photoFile = null;
    let imgData = {
        src: '', // Base64 encoded image data
        naturalWidth: 0, // Original image width
        naturalHeight: 0, // Original image height
        scale: 1, // Visual scale of the image within photoPreview
        rotation: 0, // Rotation in degrees
        offsetX: 0, // Pan X offset for visual adjustment
        offsetY: 0, // Pan Y offset for visual adjustment
        crop: { x: 0, y: 0, width: 0, height: 0 } // Crop box coordinates relative to *transformed* image
    };
    let isCropping = false;
    let isDraggingPhoto = false;
    let isDraggingCropBox = false;
    let isResizingCropBox = false;
    let resizeHandleType = null; // 'top-left', 'bottom-right'
    let startPointerX, startPointerY; // Mouse/touch start position
    let startOffsetX, startOffsetY; // Image's offset at drag start
    let cropBoxStartWidth, cropBoxStartHeight, cropBoxStartX, cropBoxStartY; // Crop box dimensions at resize/drag start

    // --- Unit and Dimension Logic ---
    const updateUnitLabels = () => {
        currentUnit = document.querySelector('input[name="units"]:checked').value;
        const unitElements = [
            photoWidthUnit, photoLengthUnit,
            customPageWidthUnit, customPageHeightUnit,
            horizontalSpacingValue, verticalSpacingValue,
            topMarginValue, leftMarginValue
        ];

        unitElements.forEach(el => {
            if (el) { // Check if element exists
                el.textContent = currentUnit === 'pixel' ? 'px' : currentUnit;
            }
        });

        // Toggle pixel density input visibility
        if (currentUnit === 'pixel') {
            pixelDensityGroup.style.display = 'flex';
        } else {
            pixelDensityGroup.style.display = 'none';
        }

        // Adjust default values based on unit for photo dimensions
        if (currentUnit === 'mm') {
            if (photoWidthInput.value === '300' || photoWidthInput.value === '400') photoWidthInput.value = '35';
            if (photoLengthInput.value === '300' || photoLengthInput.value === '400') photoLengthInput.value = '45';
        } else if (currentUnit === 'pixel') {
            if (photoWidthInput.value === '35' || photoLengthInput.value === '45') photoWidthInput.value = '300';
            if (photoLengthInput.value === '35' || photoLengthInput.value === '45') photoLengthInput.value = '400';
        }
        generatePhotoSheet(); // Recalculate preview on unit change
    };

    unitRadios.forEach(radio => {
        radio.addEventListener('change', updateUnitLabels);
    });
    updateUnitLabels(); // Initial call

    // Page Size Logic
    const toggleCustomPageSize = () => {
        if (document.getElementById('pageCustom').checked) {
            customPageSize.style.display = 'flex';
        } else {
            customPageSize.style.display = 'none';
        }
        generatePhotoSheet(); // Recalculate preview on page size change
    };

    pageSizeRadios.forEach(radio => {
        radio.addEventListener('change', toggleCustomPageSize);
    });
    toggleCustomPageSize(); // Initial call

    // Spacing and Margin Logic
    const toggleManualSpacing = () => {
        manualSpacingDiv.style.display = autoSpacingCheckbox.checked ? 'none' : 'flex';
        generatePhotoSheet(); // Recalculate preview on toggle
    };
    autoSpacingCheckbox.addEventListener('change', toggleManualSpacing);
    toggleManualSpacing(); // Initial call

    const toggleManualMargin = () => {
        manualMarginDiv.style.display = autoMarginCheckbox.checked ? 'none' : 'flex';
        generatePhotoSheet(); // Recalculate preview on toggle
    };
    autoMarginCheckbox.addEventListener('change', toggleManualMargin);
    toggleManualMargin(); // Initial call

    horizontalSpacingInput.addEventListener('input', () => {
        horizontalSpacingValue.textContent = `${horizontalSpacingInput.value}${currentUnit}`;
        generatePhotoSheet(); // Recalculate preview on input
    });
    verticalSpacingInput.addEventListener('input', () => {
        verticalSpacingValue.textContent = `${verticalSpacingInput.value}${currentUnit}`;
        generatePhotoSheet(); // Recalculate preview on input
    });
    topMarginInput.addEventListener('input', () => {
        topMarginValue.textContent = `${topMarginInput.value}${currentUnit}`;
        generatePhotoSheet(); // Recalculate preview on input
    });
    leftMarginInput.addEventListener('input', () => {
        leftMarginValue.textContent = `${leftMarginInput.value}${currentUnit}`;
        generatePhotoSheet(); // Recalculate preview on input
    });


    // --- Photo Upload and Preview Logic ---
    browsePhotosLink.addEventListener('click', (e) => {
        e.preventDefault();
        photoUploadInput.click();
    });

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        handleFiles(files);
    });

    photoUploadInput.addEventListener('change', (e) => {
        const files = e.target.files;
        handleFiles(files);
    });

    const handleFiles = (files) => {
        if (files.length > 0) {
            photoFile = files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                photoPreview.src = e.target.result;
                photoPreview.style.display = 'block';
                photoPreviewContainer.style.display = 'flex'; // Ensure container is visible
                photoControls.style.display = 'flex';
                photoHint.style.display = 'block';

                imgData.src = e.target.result;
                imgData.scale = 1;
                imgData.rotation = 0;
                imgData.offsetX = 0;
                imgData.offsetY = 0;
                croppingOverlay.style.display = 'none'; // Hide overlay initially
                isCropping = false; // Reset cropping state

                // Get natural dimensions after image loads
                photoPreview.onload = () => {
                    imgData.naturalWidth = photoPreview.naturalWidth;
                    imgData.naturalHeight = photoPreview.naturalHeight;
                    // Reset crop data relative to image's natural size
                    imgData.crop = { x: 0, y: 0, width: imgData.naturalWidth, height: imgData.naturalHeight };
                    updatePhotoPreviewStyles();
                    generatePhotoSheet(); // Generate initial sheet after photo loads
                };
            };
            reader.readAsDataURL(photoFile);
        }
    };

    const updatePhotoPreviewStyles = () => {
        photoPreview.style.transform = `
            translate(${imgData.offsetX}px, ${imgData.offsetY}px)
            scale(${imgData.scale})
            rotate(${imgData.rotation}deg)
        `;
    };

    // --- Photo Controls (Zoom, Rotate, Pan/Drag) ---
    zoomInBtn.addEventListener('click', () => {
        imgData.scale += 0.1;
        updatePhotoPreviewStyles();
        generatePhotoSheet(); // Update sheet if image content changed
    });

    zoomOutBtn.addEventListener('click', () => {
        imgData.scale = Math.max(0.1, imgData.scale - 0.1);
        updatePhotoPreviewStyles();
        generatePhotoSheet(); // Update sheet if image content changed
    });

    rotateLeftBtn.addEventListener('click', () => {
        imgData.rotation = (imgData.rotation - 90) % 360;
        updatePhotoPreviewStyles();
        generatePhotoSheet(); // Update sheet if image content changed
    });

    rotateRightBtn.addEventListener('click', () => {
        imgData.rotation = (imgData.rotation + 90) % 360;
        updatePhotoPreviewStyles();
        generatePhotoSheet(); // Update sheet if image content changed
    });

    // Pan/Drag Photo within container
    photoPreviewContainer.addEventListener('mousedown', (e) => {
        // Only start dragging if not in cropping mode and mouse is over the image
        if (!isCropping && e.target === photoPreview) {
            isDraggingPhoto = true;
            startPointerX = e.clientX;
            startPointerY = e.clientY;
            startOffsetX = imgData.offsetX;
            startOffsetY = imgData.offsetY;
            photoPreview.style.cursor = 'grabbing';
            e.preventDefault(); // Prevent default browser drag behavior
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (isDraggingPhoto) {
            const dx = e.clientX - startPointerX;
            const dy = e.clientY - startPointerY;
            imgData.offsetX = startOffsetX + dx;
            imgData.offsetY = startOffsetY + dy;
            updatePhotoPreviewStyles();
        } else if (isResizingCropBox) {
            const previewContainerRect = photoPreviewContainer.getBoundingClientRect();
            const currentMouseX = e.clientX - previewContainerRect.left; // Mouse X relative to container
            const currentMouseY = e.clientY - previewContainerRect.top;  // Mouse Y relative to container

            const photoWidthVal = parseFloat(photoWidthInput.value);
            const photoLengthVal = parseFloat(photoLengthInput.value);
            if (photoWidthVal === 0 || photoLengthVal === 0) return; // Prevent division by zero
            const photoRatio = photoWidthVal / photoLengthVal;

            let newWidth, newHeight, newX, newY;

            if (resizeHandleType === 'bottom-right') {
                newWidth = cropBoxStartWidth + (currentMouseX - startPointerX);
                newHeight = newWidth / photoRatio; // Maintain aspect ratio

                // Ensure dimensions don't go below minimum
                newWidth = Math.max(20, newWidth);
                newHeight = Math.max(20, newHeight);

                // Ensure crop box doesn't exceed container bounds when resizing
                newWidth = Math.min(newWidth, previewContainerRect.width - cropBox.offsetLeft);
                newHeight = Math.min(newHeight, previewContainerRect.height - cropBox.offsetTop);

                // Apply the new dimensions
                cropBox.style.width = `${newWidth}px`;
                cropBox.style.height = `${newHeight}px`;
            } else if (resizeHandleType === 'top-left') {
                newWidth = cropBoxStartWidth - (currentMouseX - startPointerX);
                newHeight = newWidth / photoRatio;

                newWidth = Math.max(20, newWidth);
                newHeight = Math.max(20, newHeight);

                // Calculate new top-left position
                newX = cropBoxStartX + (cropBoxStartWidth - newWidth);
                newY = cropBoxStartY + (cropBoxStartHeight - newHeight);

                // Adjust if new position goes out of bounds (prioritize not going below 0)
                if (newX < 0) {
                    newX = 0;
                    newWidth = cropBoxStartX + cropBoxStartWidth;
                    newHeight = newWidth / photoRatio;
                }
                if (newY < 0) {
                    newY = 0;
                    newHeight = cropBoxStartY + cropBoxStartHeight;
                    newWidth = newHeight * photoRatio;
                }

                cropBox.style.width = `${newWidth}px`;
                cropBox.style.height = `${newHeight}px`;
                cropBox.style.left = `${newX}px`;
                cropBox.style.top = `${newY}px`;
            }
            // Update imgData.crop based on the new cropBox style values
            imgData.crop.x = cropBox.offsetLeft;
            imgData.crop.y = cropBox.offsetTop;
            imgData.crop.width = cropBox.offsetWidth;
            imgData.crop.height = cropBox.offsetHeight;
        } else if (isDraggingCropBox) {
            const previewContainerRect = photoPreviewContainer.getBoundingClientRect();
            const currentMouseX = e.clientX - previewContainerRect.left;
            const currentMouseY = e.clientY - previewContainerRect.top;

            const dx = currentMouseX - startPointerX;
            const dy = currentMouseY - startPointerY;

            let newX = cropBoxStartX + dx;
            let newY = cropBoxStartY + dy;

            // Keep crop box within preview container boundaries
            newX = Math.max(0, Math.min(newX, previewContainerRect.width - cropBox.offsetWidth));
            newY = Math.max(0, Math.min(newY, previewContainerRect.height - cropBox.offsetHeight));

            cropBox.style.left = `${newX}px`;
            cropBox.style.top = `${newY}px`;
            imgData.crop.x = newX;
            imgData.crop.y = newY; // Update internal model
        }
    });

    document.addEventListener('mouseup', () => {
        isDraggingPhoto = false;
        isDraggingCropBox = false;
        isResizingCropBox = false;
        resizeHandleType = null;

        if (!isCropping && photoPreview.style.display === 'block') {
             photoPreview.style.cursor = 'grab'; // Reset cursor for panning
        } else if (isCropping) {
            cropBox.style.cursor = 'move'; // Reset cursor for dragging crop box
        }
        // After any photo manipulation (pan/zoom/crop), regenerate the sheet
        generatePhotoSheet();
    });


    cropPhotoBtn.addEventListener('click', () => {
        isCropping = !isCropping;
        if (isCropping) {
            if (!photoFile) {
                alert("Please upload a photo first.");
                isCropping = false;
                return;
            }
            const photoWidthVal = parseFloat(photoWidthInput.value);
            const photoLengthVal = parseFloat(photoLengthInput.value);
            if (isNaN(photoWidthVal) || isNaN(photoLengthVal) || photoWidthVal <= 0 || photoLengthVal <= 0) {
                alert("Please set valid positive photo dimensions (width and height) before cropping.");
                isCropping = false;
                return;
            }
            photoPreview.style.cursor = 'default'; // Disable photo pan when cropping
            croppingOverlay.style.display = 'flex';

            const photoRatio = photoWidthVal / photoLengthVal;
            const previewRect = photoPreviewContainer.getBoundingClientRect();

            let cropWidth, cropHeight;

            // Calculate crop box size based on the photoPreviewContainer dimensions and desired aspect ratio
            if (previewRect.width / previewRect.height > photoRatio) {
                cropHeight = previewRect.height * 0.8; // Start with 80% of container height
                cropWidth = cropHeight * photoRatio;
            } else {
                cropWidth = previewRect.width * 0.8; // Start with 80% of container width
                cropHeight = cropWidth / photoRatio;
            }

            // Ensure crop box fits within container and is not too small
            cropWidth = Math.max(50, Math.min(cropWidth, previewRect.width));
            cropHeight = Math.max(50, Math.min(cropHeight, previewRect.height));

            // Adjust one dimension if the other hits its max, to maintain ratio
            if (cropWidth === previewRect.width) {
                cropHeight = cropWidth / photoRatio;
            } else if (cropHeight === previewRect.height) {
                cropWidth = cropHeight * photoRatio;
            }


            cropBox.style.width = `${cropWidth}px`;
            cropBox.style.height = `${cropHeight}px`;
            cropBox.style.left = `${(previewRect.width - cropWidth) / 2}px`;
            cropBox.style.top = `${(previewRect.height - cropHeight) / 2}px`;
            cropBox.style.cursor = 'move'; // For dragging the box itself

            // Update internal crop data (relative to preview container)
            imgData.crop.x = cropBox.offsetLeft;
            imgData.crop.y = cropBox.offsetTop;
            imgData.crop.width = cropBox.offsetWidth;
            imgData.crop.height = cropBox.offsetHeight;

        } else {
            croppingOverlay.style.display = 'none';
            photoPreview.style.cursor = 'grab'; // Re-enable photo pan
            generatePhotoSheet(); // Regenerate sheet with new crop applied
        }
    });

    // Handle resize handles mousedown
    cropBoxHandles.forEach(handle => {
        handle.addEventListener('mousedown', (e) => {
            if (isCropping) {
                isResizingCropBox = true;
                resizeHandleType = e.target.classList.contains('top-left') ? 'top-left' : 'bottom-right';
                cropBoxStartWidth = cropBox.offsetWidth;
                cropBoxStartHeight = cropBox.offsetHeight;
                cropBoxStartX = cropBox.offsetLeft;
                cropBoxStartY = cropBox.offsetTop;
                startPointerX = e.clientX - photoPreviewContainer.getBoundingClientRect().left;
                startPointerY = e.clientY - photoPreviewContainer.getBoundingClientRect().top;
                e.stopPropagation(); // Prevent dragging crop box itself
                e.preventDefault();
            }
        });
    });

    cropBox.addEventListener('mousedown', (e) => {
        if (isCropping && e.target === cropBox) { // Only drag if directly on crop box, not handles
            isDraggingCropBox = true;
            const previewContainerRect = photoPreviewContainer.getBoundingClientRect();
            startPointerX = e.clientX - previewContainerRect.left;
            startPointerY = e.clientY - previewContainerRect.top;
            cropBoxStartX = cropBox.offsetLeft;
            cropBoxStartY = cropBox.offsetTop;
            cropBox.style.cursor = 'grabbing';
            e.preventDefault();
        }
    });


    // --- Core Functionality (Simulated with Canvas) ---

    // Utility function to convert units
    const convertToPixels = (value, fromUnit, toDPI) => {
        if (fromUnit === 'mm') {
            return (value / 25.4) * toDPI;
        } else if (fromUnit === 'inch') {
            return value * toDPI;
        } else { // 'pixel'
            return value;
        }
    };

    const generatePhotoSheet = () => {
        if (!photoFile || !imgData.src) {
            outputPreview.innerHTML = '<p>Upload a photo and set dimensions to see a preview.</p>';
            return;
        }

        const photoWidthVal = parseFloat(photoWidthInput.value);
        const photoLengthVal = parseFloat(photoLengthInput.value);
        let pageWidthVal, pageHeightVal;

        const selectedPageSize = document.querySelector('input[name="pageSize"]:checked').value;
        if (selectedPageSize === 'A4') {
            pageWidthVal = 210; // mm
            pageHeightVal = 297; // mm
        } else if (selectedPageSize === '4R') {
            pageWidthVal = 102; // mm
            pageHeightVal = 152; // mm
        } else { // Custom
            pageWidthVal = parseFloat(customPageWidthInput.value);
            pageHeightVal = parseFloat(customPageHeightInput.value);
        }

        // Validate essential inputs
        if (isNaN(photoWidthVal) || isNaN(photoLengthVal) || photoWidthVal <= 0 || photoLengthVal <= 0 ||
            isNaN(pageWidthVal) || isNaN(pageHeightVal) || pageWidthVal <= 0 || pageHeightVal <= 0) {
            outputPreview.innerHTML = '<p>Please enter valid positive dimensions for photos and page size.</p>';
            return;
        }


        const dpi = parseFloat(pixelDensityInput.value || 300);

        const photoPxWidth = convertToPixels(photoWidthVal, currentUnit, dpi);
        const photoPxHeight = convertToPixels(photoLengthVal, currentUnit, dpi);
        const pagePxWidth = convertToPixels(pageWidthVal, 'mm', dpi); // Page size always based on mm for A4/4R
        const pagePxHeight = convertToPixels(pageHeightVal, 'mm', dpi);

        const numPhotos = parseInt(numPhotosInput.value);
        if (isNaN(numPhotos) || numPhotos <= 0) {
            outputPreview.innerHTML = '<p>Please enter a valid number of photos (at least 1).</p>';
            return;
        }

        let hSpace = parseFloat(horizontalSpacingInput.value);
        let vSpace = parseFloat(verticalSpacingInput.value);
        let topM = parseFloat(topMarginInput.value);
        let leftM = parseFloat(leftMarginInput.value);

        // Convert spacing and margins to pixels
        hSpace = convertToPixels(hSpace, currentUnit, dpi);
        vSpace = convertToPixels(vSpace, currentUnit, dpi);
        topM = convertToPixels(topM, currentUnit, dpi);
        leftM = convertToPixels(leftM, currentUnit, dpi);

        // Calculate photos per row and number of rows (initially based on manual/default)
        let photosPerRow = Math.floor((pagePxWidth - 2 * leftM + hSpace) / (photoPxWidth + hSpace));
        photosPerRow = Math.max(1, photosPerRow); // Ensure at least 1 photo per row

        let numRows = Math.ceil(numPhotos / photosPerRow);

        // Calculate automatic spacing and margins if enabled
        if (autoSpacingCheckbox.checked) {
            const availableWidthForPhotos = pagePxWidth - (2 * leftM); // Assume margins are fixed for calc
            photosPerRow = Math.floor(availableWidthForPhotos / photoPxWidth);
            photosPerRow = Math.max(1, photosPerRow);

            if (photosPerRow > 1) {
                hSpace = (pagePxWidth - (photosPerRow * photoPxWidth)) / (photosPerRow + 1);
            } else {
                hSpace = (pagePxWidth - photoPxWidth) / 2; // Center horizontally if only one photo per row
            }

            const availableHeightForPhotos = pagePxHeight - (2 * topM); // Assume margins are fixed for calc
            numRows = Math.ceil(numPhotos / photosPerRow);
            numRows = Math.max(1, numRows); // Ensure at least 1 row

            if (numRows > 1) {
                vSpace = (pagePxHeight - (numRows * photoPxHeight)) / (numRows + 1);
            } else {
                vSpace = (pagePxHeight - photoPxHeight) / 2; // Center vertically if only one row
            }
        }

        if (autoMarginCheckbox.checked) {
            topM = vSpace;
            leftM = hSpace;
        }

        // Create a canvas for preview
        const canvas = document.createElement('canvas');
        canvas.width = pagePxWidth;
        canvas.height = pagePxHeight;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const img = new Image();
        img.src = imgData.src; // Use the raw image source for drawing
        img.onload = () => {
            // Create a temporary canvas to apply transforms (zoom, pan, rotate) to the original image
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = imgData.naturalWidth;
            tempCanvas.height = imgData.naturalHeight;
            const tempCtx = tempCanvas.getContext('2d');

            // Apply rotation and pan to the temporary canvas
            tempCtx.save();
            tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
            tempCtx.rotate(imgData.rotation * Math.PI / 180);
            tempCtx.translate(-tempCanvas.width / 2, -tempCanvas.height / 2);

            // Draw the original image onto the temporary canvas.
            // This is where pan and scale become critical.
            // It's tricky to map the imgData.offsetX/Y and imgData.scale (which are for CSS display)
            // precisely to drawImage arguments for a transformed source.
            // A common approach for interactive image manipulation is to have a "render" function
            // that draws the scaled/panned/rotated image to a fixed-size buffer (like the `photoPreviewContainer`).
            // Then, the crop box is relative to that buffer.
            // For this *final output* canvas, we need to map the crop *from the original image*.

            // A more robust image manipulation library (like Cropper.js or Fabric.js) handles this complex mapping.
            // For this basic demo, we'll simplify how pan/zoom/crop affects the final output:
            // It will largely ignore pan/zoom unless directly for cropping, and mainly focus on the crop box.

            // To map the crop box (which is on the scaled/panned/rotated image within photoPreviewContainer)
            // back to the original image:
            // This is the most complex part to do perfectly without a library.
            // For now, let's assume `imgData.crop` holds the crop rectangle *relative to the untransformed image*
            // This is a simplification. The `isCropping` logic would need to compute this better.

            let srcX, srcY, srcWidth, srcHeight;

            if (isCropping && imgData.crop.width > 0 && imgData.crop.height > 0) {
                // To perform the crop on the *original* image accurately based on the
                // CSS-transformed preview, we'd need inverse transformations.
                // A simplified direct mapping if no rotation/complex scale on source for this demo:
                // Map the displayed crop box on the *container* back to the natural image dimensions.
                const previewContainerWidth = photoPreviewContainer.offsetWidth;
                const previewContainerHeight = photoPreviewContainer.offsetHeight;

                // How much larger is the natural image than its "fit" within the container
                // (before user zoom/pan/rotate)?
                // Let's assume the photoPreview is object-fit: contain initially.
                // Calculate the actual dimensions the natural image is "contained" into.
                let containedImgWidth = imgData.naturalWidth;
                let containedImgHeight = imgData.naturalHeight;

                if (containedImgWidth / containedImgHeight > previewContainerWidth / previewContainerHeight) {
                    containedImgHeight = previewContainerWidth / (imgData.naturalWidth / imgData.naturalHeight);
                    containedImgWidth = previewContainerWidth;
                } else {
                    containedImgWidth = previewContainerHeight * (imgData.naturalWidth / imgData.naturalHeight);
                    containedImgHeight = previewContainerHeight;
                }

                // Ratio of natural image to the contained image
                const ratioNaturalToContainedX = imgData.naturalWidth / containedImgWidth;
                const ratioNaturalToContainedY = imgData.naturalHeight / containedImgHeight;


                // Adjustments for pan/zoom/rotate in the *preview* need to be converted to
                // a transformation matrix to properly map the crop box back to the original image pixels.
                // For this direct drawImage approach without a full matrix library:
                // We'll calculate the source rectangle (sx, sy, sWidth, sHeight) from the imgData.crop values.
                // This will be an approximation unless imgData.crop was calculated accurately
                // based on the *actual* transformed image state.

                srcX = (imgData.crop.x - imgData.offsetX) * ratioNaturalToContainedX; // Rough mapping
                srcY = (imgData.crop.y - imgData.offsetY) * ratioNaturalToContainedY; // Rough mapping
                srcWidth = imgData.crop.width * ratioNaturalToContainedX;
                srcHeight = imgData.crop.height * ratioNaturalToContainedY;

                // Ensure source rectangle is within original image bounds
                srcX = Math.max(0, srcX);
                srcY = Math.max(0, srcY);
                srcWidth = Math.min(srcWidth, imgData.naturalWidth - srcX);
                srcHeight = Math.min(srcHeight, imgData.naturalHeight - srcY);

                 // Draw the cropped portion from the original image to the destination photo area
                ctx.drawImage(img, srcX, srcY, srcWidth, srcHeight, x, y, photoPxWidth, photoPxHeight);

            } else {
                // If not cropping, draw the original image scaled to fit the photo area.
                // This will use object-fit: cover logic.
                let sourceX = 0;
                let sourceY = 0;
                let sourceWidth = imgData.naturalWidth;
                let sourceHeight = imgData.naturalHeight;

                let destAspectRatio = photoPxWidth / photoPxHeight;
                let sourceAspectRatio = sourceWidth / sourceHeight;

                if (sourceAspectRatio > destAspectRatio) {
                    // Source image is wider than destination, need to crop source horizontally
                    const newSourceWidth = sourceHeight * destAspectRatio;
                    sourceX = (sourceWidth - newSourceWidth) / 2;
                    sourceWidth = newSourceWidth;
                } else {
                    // Source image is taller than destination, need to crop source vertically
                    const newSourceHeight = sourceWidth / destAspectRatio;
                    sourceY = (sourceHeight - newSourceHeight) / 2;
                    sourceHeight = newSourceHeight;
                }
                ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, x, y, photoPxWidth, photoPxHeight);
            }
            ctx.restore(); // Restore context to remove clip from previous photo


            let photoCount = 0;
            for (let row = 0; row < numRows; row++) {
                for (let col = 0; col < photosPerRow; col++) {
                    if (photoCount >= numPhotos) break;

                    const x = leftM + col * (photoPxWidth + hSpace);
                    const y = topM + row * (photoPxHeight + vSpace);

                    // Re-draw the same transformed image (from tempCtx) to each passport photo spot
                    // This is where the actual image data is put on the final sheet.
                    // Instead of redrawing the source image from scratch each time,
                    // a robust solution would pre-process the single output passport photo first
                    // (applying zoom, pan, rotate, crop) and then stamping that final passport photo.
                    // For this demo, we'll perform a simplified draw for each.

                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(x, y, photoPxWidth, photoPxHeight);
                    ctx.clip(); // Clip to the desired photo area for this instance

                    // Draw the image from the temporary canvas (which has rotation)
                    // If you wanted to apply imgData.scale and imgData.offset here,
                    // you'd need to calculate their effect on the source image, which is non-trivial.
                    // For simplicity, we'll draw the image based on its natural dimensions
                    // and let it fill the allocated photoPxWidth/Height.
                    // If isCropping, the drawImage below uses the calculated source rectangle.
                    // If not cropping, it attempts to 'cover' the destination area.

                    // If you need the exact preview transform applied to the output,
                    // you'd draw img to tempCanvas with all transforms and then
                    // draw tempCanvas (cropped) onto the main canvas.

                    // For the final output, let's prioritize getting the correct aspect ratio and crop.
                    // The pan/zoom of the *preview* might not perfectly translate to the small output image
                    // without a more complex image processing pipeline.
                    if (isCropping && imgData.crop.width > 0 && imgData.crop.height > 0) {
                        // Re-calculate the source rectangle for the final output canvas
                        // This needs to correctly map the PREVIEW crop box (in preview container pixels)
                        // back to the ORIGINAL image's pixels. This is the hardest part.
                        // Without a full image manipulation library, this is an approximation.

                        // Get the ratio of the original image's dimensions to the photoPreviewContainer's dimensions
                        const imgToContainerRatioX = imgData.naturalWidth / photoPreviewContainer.offsetWidth;
                        const imgToContainerRatioY = imgData.naturalHeight / photoPreviewContainer.offsetHeight;

                        // Account for the image's own CSS transform scale and offset in the preview
                        // This is a highly complex area for client-side JS without a dedicated library.
                        // For a simplified demo, let's assume the crop box is relative to the
                        // *visible* (scaled and panned) image in the preview.

                        // A more reliable way: draw the original image to a temporary canvas, apply ALL transforms (rotate, scale, pan),
                        // then crop from that temp canvas and draw the cropped portion.
                        // Given the current simple setup, we'll use a direct image-to-canvas mapping for crop.
                        // This is an approximation of how the on-screen crop box maps to the original image.

                        // The issue here is `imgData.crop` is in `photoPreviewContainer`'s coordinates.
                        // `imgData.naturalWidth/Height` are original image.
                        // We need to translate the crop box from container coordinates to original image coordinates.
                        let sx = imgData.crop.x * imgToContainerRatioX;
                        let sy = imgData.crop.y * imgToContainerRatioY;
                        let sWidth = imgData.crop.width * imgToContainerRatioX;
                        let sHeight = imgData.crop.height * imgToContainerRatioY;

                        // Correct for any initial object-fit: contain scaling if image is smaller than container
                        const imgDisplayWidth = imgData.naturalWidth / imgData.scale; // rough estimate of displayed width
                        const imgDisplayHeight = imgData.naturalHeight / imgData.scale; // rough estimate of displayed height

                        // Ensure source rectangle doesn't exceed image bounds
                        sx = Math.max(0, sx);
                        sy = Math.max(0, sy);
                        sWidth = Math.min(sWidth, imgData.naturalWidth - sx);
                        sHeight = Math.min(sHeight, imgData.naturalHeight - sy);

                        ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, photoPxWidth, photoPxHeight);

                    } else {
                         // If not cropping, fill the destination area (photoPxWidth, photoPxHeight)
                         // by 'covering' it with the original image (cropping edges if aspect ratio differs)
                         let sourceX = 0;
                         let sourceY = 0;
                         let sourceWidth = imgData.naturalWidth;
                         let sourceHeight = imgData.naturalHeight;

                         let destAspectRatio = photoPxWidth / photoPxHeight;
                         let sourceAspectRatio = sourceWidth / sourceHeight;

                         if (sourceAspectRatio > destAspectRatio) {
                             // Image is wider than destination, crop source horizontally
                             const newSourceWidth = sourceHeight * destAspectRatio;
                             sourceX = (sourceWidth - newSourceWidth) / 2;
                             sourceWidth = newSourceWidth;
                         } else {
                             // Image is taller than destination, crop source vertically
                             const newSourceHeight = sourceWidth / destAspectRatio;
                             sourceY = (sourceHeight - newSourceHeight) / 2;
                             sourceHeight = newSourceHeight;
                         }
                         ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, x, y, photoPxWidth, photoPxHeight);
                    }
                    ctx.restore(); // Restore context to remove clip

                    // Draw dotted lines for cutting
                    ctx.strokeStyle = '#999';
                    ctx.lineWidth = 1;
                    ctx.setLineDash([2, 2]);

                    // Border around each photo
                    ctx.beginPath();
                    ctx.rect(x, y, photoPxWidth, photoPxHeight);
                    ctx.stroke();

                    ctx.setLineDash([]); // Reset line dash

                    photoCount++;
                }
                if (photoCount >= numPhotos) break;
            }

            outputPreview.innerHTML = '';
            outputPreview.appendChild(canvas);

            // Adjust canvas display for responsive preview
            canvas.style.maxWidth = '100%';
            canvas.style.height = 'auto';
        };
        img.onerror = () => {
            outputPreview.innerHTML = '<p>Error loading image for preview. Please try again.</p>';
        };
    };

    // Update preview whenever relevant inputs change
    const inputsToWatchForPreview = [
        photoWidthInput, photoLengthInput,
        numPhotosInput,
        horizontalSpacingInput, verticalSpacingInput,
        topMarginInput, leftMarginInput,
        pixelDensityInput, customPageWidthInput, customPageHeightInput
    ];
    inputsToWatchForPreview.forEach(input => input.addEventListener('input', generatePhotoSheet));


    // --- Download Functionality ---
    downloadBtn.addEventListener('click', () => {
        const canvas = outputPreview.querySelector('canvas');
        if (canvas) {
            const format = downloadFormatSelect.value;
            const filename = `passport_photos.${format}`;
            let quality = 0.9; // For JPG, 0-1

            // Trigger the download
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, `image/${format}`, quality);
        } else {
            alert('Please generate the photo sheet first!');
        }
    });

    // --- Share App Button ---
    shareAppBtn.addEventListener('click', async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Nishix Passport Photo Maker',
                    text: 'Create perfect passport photos with ease!',
                    url: window.location.href, // Or your app's deployed URL
                });
                console.log('App shared successfully');
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            // Fallback for browsers that don't support Web Share API
            prompt('You can share this app by copying the link:', window.location.href);
        }
    });

    // Initial calls on page load
    updateUnitLabels();
    toggleCustomPageSize();
    toggleManualSpacing();
    toggleManualMargin();
});
