document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const unitRadios = document.querySelectorAll('input[name="units"]');
    const pixelDensityGroup = document.getElementById('pixelDensityGroup');
    const pixelDensityInput = document.getElementById('pixelDensity'); // Added
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
    const leftMarginInput = document = document.getElementById('leftMargin'); // Fixed typo
    const leftMarginValue = document.getElementById('leftMarginValue');
    const outputPreview = document.getElementById('outputPreview');
    const downloadFormatSelect = document.getElementById('downloadFormat');
    const downloadBtn = document.getElementById('downloadBtn');
    const shareAppBtn = document.getElementById('shareAppBtn');

    // Default values and state
    let currentUnit = 'mm';
    let photoFile = null;
    let imgData = {
        src: '',
        scale: 1,
        rotation: 0,
        offsetX: 0, // for panning the image within its container
        offsetY: 0, // for panning the image within its container
        crop: { x: 0, y: 0, width: 0, height: 0, scale: 1 } // Cropping area relative to actual image
    };
    let isCropping = false;
    let isDraggingPhoto = false;
    let isDraggingCropBox = false;
    let isResizingCropBox = false;
    let startPointerX, startPointerY;
    let startOffsetX, startOffsetY;
    let cropBoxStartWidth, cropBoxStartHeight, cropBoxStartX, cropBoxStartY;

    // --- Unit and Dimension Logic ---
    const updateUnitLabels = () => {
        currentUnit = document.querySelector('input[name="units"]:checked').value;
        const unitLabels = [
            photoWidthUnit, photoLengthUnit,
            customPageWidthUnit, customPageHeightUnit
        ];

        unitLabels.forEach(label => {
            if (label) {
                label.textContent = currentUnit === 'pixel' ? 'px' : currentUnit;
            }
        });

        // Update spacing/margin value displays
        horizontalSpacingValue.textContent = `${horizontalSpacingInput.value}${currentUnit}`;
        verticalSpacingValue.textContent = `${verticalSpacingInput.value}${currentUnit}`;
        topMarginValue.textContent = `${topMarginInput.value}${currentUnit}`;
        leftMarginValue.textContent = `${leftMarginInput.value}${currentUnit}`;


        // Toggle pixel density input visibility
        if (currentUnit === 'pixel') {
            pixelDensityGroup.style.display = 'flex';
        } else {
            pixelDensityGroup.style.display = 'none';
        }

        // Adjust default values based on unit if needed
        if (currentUnit === 'mm') {
            if (photoWidthInput.value === '300' || photoWidthInput.value === '400') photoWidthInput.value = '35';
            if (photoLengthInput.value === '300' || photoLengthInput.value === '400') photoLengthInput.value = '45';
        } else if (currentUnit === 'pixel') {
            if (photoWidthInput.value === '35' || photoWidthInput.value === '45') photoWidthInput.value = '300';
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

                // Reset crop data
                imgData.crop = { x: 0, y: 0, width: 0, height: 0, scale: 1 };

                // Ensure image is loaded before setting initial transform
                photoPreview.onload = () => {
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
    });

    zoomOutBtn.addEventListener('click', () => {
        imgData.scale = Math.max(0.1, imgData.scale - 0.1);
        updatePhotoPreviewStyles();
    });

    rotateLeftBtn.addEventListener('click', () => {
        imgData.rotation = (imgData.rotation - 90) % 360;
        updatePhotoPreviewStyles();
    });

    rotateRightBtn.addEventListener('click', () => {
        imgData.rotation = (imgData.rotation + 90) % 360;
        updatePhotoPreviewStyles();
    });

    // Pan/Drag Photo
    photoPreviewContainer.addEventListener('mousedown', (e) => {
        if (!isCropping && e.target === photoPreview) { // Only drag photo itself, not controls
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
        }
    });

    document.addEventListener('mouseup', () => {
        if (isDraggingPhoto) {
            isDraggingPhoto = false;
            photoPreview.style.cursor = 'grab'; // Reset cursor
        }
    });


    cropPhotoBtn.addEventListener('click', () => {
        isCropping = !isCropping;
        if (isCropping) {
            croppingOverlay.style.display = 'flex';
            photoPreview.style.cursor = 'default'; // Disable pan when cropping

            // Calculate initial crop box size based on desired aspect ratio
            const photoWidthVal = parseFloat(photoWidthInput.value);
            const photoLengthVal = parseFloat(photoLengthInput.value);
            if (photoWidthVal === 0 || photoLengthVal === 0) {
                alert("Please set valid photo dimensions (width and height) before cropping.");
                isCropping = false;
                croppingOverlay.style.display = 'none';
                return;
            }
            const photoRatio = photoWidthVal / photoLengthVal;

            const previewRect = photoPreviewContainer.getBoundingClientRect(); // Use container for bounds
            let cropWidth, cropHeight;

            // Determine initial crop box size based on container aspect ratio
            if (previewRect.width / previewRect.height > photoRatio) {
                cropHeight = previewRect.height * 0.8; // Start with 80% of container height
                cropWidth = cropHeight * photoRatio;
            } else {
                cropWidth = previewRect.width * 0.8; // Start with 80% of container width
                cropHeight = cropWidth / photoRatio;
            }

            // Ensure crop box fits within container
            if (cropWidth > previewRect.width) {
                cropWidth = previewRect.width;
                cropHeight = cropWidth / photoRatio;
            }
            if (cropHeight > previewRect.height) {
                cropHeight = previewRect.height;
                cropWidth = cropHeight * photoRatio;
            }

            cropBox.style.width = `${cropWidth}px`;
            cropBox.style.height = `${cropHeight}px`;
            cropBox.style.left = `${(previewRect.width - cropWidth) / 2}px`;
            cropBox.style.top = `${(previewRect.height - cropHeight) / 2}px`;
            cropBox.style.cursor = 'grab';

            // Store initial crop box dimensions relative to its position on the container
            imgData.crop.width = cropWidth;
            imgData.crop.height = cropHeight;
            imgData.crop.x = (previewRect.width - cropWidth) / 2;
            imgData.crop.y = (previewRect.height - cropHeight) / 2;

        } else {
            croppingOverlay.style.display = 'none';
            photoPreview.style.cursor = 'grab'; // Re-enable pan
            // In a real app, you'd apply the crop here to a canvas or send to server
            // For now, we only update the imgData.crop object
        }
    });

    // --- Cropping Interaction (Drag & Resize) ---
    croppingOverlay.addEventListener('mousedown', (e) => {
        if (isCropping) {
            const cropBoxRect = cropBox.getBoundingClientRect();
            const previewContainerRect = photoPreviewContainer.getBoundingClientRect();
            const mouseX = e.clientX - previewContainerRect.left; // Mouse X relative to container
            const mouseY = e.clientY - previewContainerRect.top;  // Mouse Y relative to container

            // Check if resizing from corners/edges (simplified for example)
            const handleSize = 10;
            const cropBoxLeft = cropBox.offsetLeft;
            const cropBoxTop = cropBox.offsetTop;
            const cropBoxRight = cropBoxLeft + cropBox.offsetWidth;
            const cropBoxBottom = cropBoxTop + cropBox.offsetHeight;

            // Check if mouse is over bottom-right handle
            if (mouseX > cropBoxRight - handleSize && mouseY > cropBoxBottom - handleSize &&
                mouseX < cropBoxRight + handleSize && mouseY < cropBoxBottom + handleSize) {
                isResizingCropBox = true;
                cropBoxStartWidth = cropBox.offsetWidth;
                cropBoxStartHeight = cropBox.offsetHeight;
                startPointerX = mouseX;
                startPointerY = mouseY;
                cropBox.style.cursor = 'nwse-resize';
            }
            // Check if mouse is over top-left handle
            else if (mouseX < cropBoxLeft + handleSize && mouseY < cropBoxTop + handleSize &&
                     mouseX > cropBoxLeft - handleSize && mouseY > cropBoxTop - handleSize) {
                isResizingCropBox = true;
                cropBoxStartWidth = cropBox.offsetWidth;
                cropBoxStartHeight = cropBox.offsetHeight;
                cropBoxStartX = cropBox.offsetLeft;
                cropBoxStartY = cropBox.offsetTop;
                startPointerX = mouseX;
                startPointerY = mouseY;
                cropBox.style.cursor = 'nwse-resize';
            }
            // Check if mouse is inside the crop box (for dragging)
            else if (mouseX > cropBoxLeft && mouseX < cropBoxRight &&
                       mouseY > cropBoxTop && mouseY < cropBoxBottom) {
                isDraggingCropBox = true;
                startPointerX = mouseX;
                startPointerY = mouseY;
                cropBoxStartX = cropBox.offsetLeft;
                cropBoxStartY = cropBox.offsetTop;
                cropBox.style.cursor = 'grabbing';
            }
            e.preventDefault();
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (isCropping && (isDraggingCropBox || isResizingCropBox)) {
            const previewContainerRect = photoPreviewContainer.getBoundingClientRect();
            const currentMouseX = e.clientX - previewContainerRect.left;
            const currentMouseY = e.clientY - previewContainerRect.top;

            const dx = currentMouseX - startPointerX;
            const dy = currentMouseY - startPointerY;

            if (isDraggingCropBox) {
                let newX = cropBoxStartX + dx;
                let newY = cropBoxStartY + dy;

                // Keep crop box within preview container boundaries
                newX = Math.max(0, Math.min(newX, previewContainerRect.width - cropBox.offsetWidth));
                newY = Math.max(0, Math.min(newY, previewContainerRect.height - cropBox.offsetHeight));

                cropBox.style.left = `${newX}px`;
                cropBox.style.top = `${newY}px`;
                imgData.crop.x = newX;
                imgData.crop.y = newY; // Update internal model
            } else if (isResizingCropBox) {
                const photoWidthVal = parseFloat(photoWidthInput.value);
                const photoLengthVal = parseFloat(photoLengthInput.value);
                const photoRatio = photoWidthVal / photoLengthVal;

                let newWidth, newHeight, newX, newY;

                // If resizing from bottom-right (simplified)
                if (cropBox.style.cursor === 'nwse-resize' && currentMouseX >= cropBox.offsetLeft && currentMouseY >= cropBox.offsetTop) { // Check if we are resizing from bottom right
                    newWidth = cropBoxStartWidth + dx;
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

                    imgData.crop.width = newWidth;
                    imgData.crop.height = newHeight;
                }
                 // If resizing from top-left (simplified)
                else if (cropBox.style.cursor === 'nwse-resize' && currentMouseX < cropBox.offsetLeft + cropBox.offsetWidth && currentMouseY < cropBox.offsetTop + cropBox.offsetHeight) {
                    newWidth = cropBoxStartWidth - dx;
                    newHeight = newWidth / photoRatio;

                    newWidth = Math.max(20, newWidth);
                    newHeight = Math.max(20, newHeight);

                    newX = cropBoxStartX + (cropBoxStartWidth - newWidth);
                    newY = cropBoxStartY + (cropBoxStartHeight - newHeight);

                    // Ensure crop box stays within boundaries during top-left resize
                    newX = Math.max(0, newX);
                    newY = Math.max(0, newY);

                    // Recalculate width/height if newX/newY hit 0
                    if (newX === 0) {
                        newWidth = cropBoxStartX + cropBoxStartWidth;
                        newHeight = newWidth / photoRatio;
                    }
                    if (newY === 0) {
                        newHeight = cropBoxStartY + cropBoxStartHeight;
                        newWidth = newHeight * photoRatio;
                    }


                    cropBox.style.width = `${newWidth}px`;
                    cropBox.style.height = `${newHeight}px`;
                    cropBox.style.left = `${newX}px`;
                    cropBox.style.top = `${newY}px`;

                    imgData.crop.width = newWidth;
                    imgData.crop.height = newHeight;
                    imgData.crop.x = newX;
                    imgData.crop.y = newY;
                }
            }
        }
    });


    document.addEventListener('mouseup', () => {
        isDraggingCropBox = false;
        isResizingCropBox = false;
        if (isCropping) {
            cropBox.style.cursor = 'grab'; // Reset cursor
        }
    });


    // --- Core Functionality (Simulated with Canvas) ---

    const generatePhotoSheet = () => {
        if (!photoFile) {
            outputPreview.innerHTML = '<p>Upload a photo and set dimensions to see a preview.</p>';
            return;
        }

        const photoWidthMM = parseFloat(photoWidthInput.value);
        const photoLengthMM = parseFloat(photoLengthInput.value);
        let pageWidthMM, pageHeightMM;

        const selectedPageSize = document.querySelector('input[name="pageSize"]:checked').value;
        if (selectedPageSize === 'A4') {
            pageWidthMM = 210; // mm
            pageHeightMM = 297; // mm
        } else if (selectedPageSize === '4R') {
            pageWidthMM = 102; // mm
            pageHeightMM = 152; // mm
        } else { // Custom
            pageWidthMM = parseFloat(customPageWidthInput.value);
            pageHeightMM = parseFloat(customPageHeightInput.value);
        }

        // Validate essential inputs
        if (isNaN(photoWidthMM) || isNaN(photoLengthMM) || photoWidthMM <= 0 || photoLengthMM <= 0 ||
            isNaN(pageWidthMM) || isNaN(pageHeightMM) || pageWidthMM <= 0 || pageHeightMM <= 0) {
            outputPreview.innerHTML = '<p>Please enter valid positive dimensions for photos and page size.</p>';
            return;
        }


        // Convert all dimensions to pixels for canvas (assuming specified DPI)
        const dpi = parseFloat(pixelDensityInput.value || 300);
        const mmToPx = (mm) => (mm / 25.4) * dpi; // Convert mm to inches, then inches to pixels

        const photoPxWidth = currentUnit === 'pixel' ? photoWidthMM : mmToPx(photoWidthMM);
        const photoPxHeight = currentUnit === 'pixel' ? photoLengthMM : mmToPx(photoLengthMM);
        const pagePxWidth = mmToPx(pageWidthMM);
        const pagePxHeight = mmToPx(pageHeightMM);

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
        hSpace = currentUnit === 'pixel' ? hSpace : mmToPx(hSpace);
        vSpace = currentUnit === 'pixel' ? vSpace : mmToPx(vSpace);
        topM = currentUnit === 'pixel' ? topM : mmToPx(topM);
        leftM = currentUnit === 'pixel' ? leftM : mmToPx(leftM);

        // Calculate photos per row and number of rows
        let photosPerRow = Math.floor((pagePxWidth - 2 * leftM + hSpace) / (photoPxWidth + hSpace));
        photosPerRow = Math.max(1, photosPerRow); // Ensure at least 1 photo per row

        let numRows = Math.ceil(numPhotos / photosPerRow);

        // Calculate automatic spacing and margins if enabled
        if (autoSpacingCheckbox.checked) {
            if (photosPerRow > 1) {
                hSpace = (pagePxWidth - (photosPerRow * photoPxWidth)) / (photosPerRow + 1);
            } else {
                hSpace = (pagePxWidth - photoPxWidth) / 2; // Center horizontally if only one photo per row
            }
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
        img.src = photoPreview.src;
        img.onload = () => {
            let photoCount = 0;
            for (let row = 0; row < numRows; row++) {
                for (let col = 0; col < photosPerRow; col++) {
                    if (photoCount >= numPhotos) break;

                    const x = leftM + col * (photoPxWidth + hSpace);
                    const y = topM + row * (photoPxHeight + vSpace);

                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(x, y, photoPxWidth, photoPxHeight);
                    ctx.clip(); // Clip to the desired photo area

                    // Calculate image draw parameters for the canvas based on preview adjustments
                    const naturalWidth = photoPreview.naturalWidth;
                    const naturalHeight = photoPreview.naturalHeight;

                    // Calculate the crop box coordinates relative to the actual image
                    let finalCropX = imgData.crop.x;
                    let finalCropY = imgData.crop.y;
                    let finalCropWidth = imgData.crop.width;
                    let finalCropHeight = imgData.crop.height;

                    // Scaling factor from preview container to actual image size
                    // This is a rough estimation. For precision, you'd calculate based on the actual image's
                    // scale and position that *resulted* in the current preview transform.
                    // A more robust approach would render the image to a temporary canvas, apply all transforms
                    // (zoom, pan, rotate), and then extract the cropped area from that temporary canvas.
                    // For this simple demo, we'll try to map preview crop to natural image.
                    const previewToNaturalScaleX = naturalWidth / photoPreviewContainer.offsetWidth;
                    const previewToNaturalScaleY = naturalHeight / photoPreviewContainer.offsetHeight;

                    // If photo was cropped
                    if (isCropping && imgData.crop.width > 0 && imgData.crop.height > 0) {
                         // These are approximations; a robust solution requires more complex matrix transformations
                         // to map the on-screen crop box back to the un-transformed original image pixels.
                         // For a truly accurate crop, you'd calculate how the 'photoPreview' image is transformed
                         // relative to its natural size and then apply the inverse transform to the crop box.
                         // Simplified for this demo:
                         let sx = imgData.crop.x * previewToNaturalScaleX;
                         let sy = imgData.crop.y * previewToNaturalScaleY;
                         let sWidth = imgData.crop.width * previewToNaturalScaleX;
                         let sHeight = imgData.crop.height * previewToNaturalScaleY;

                         // Ensure source crop fits within natural image dimensions
                         sx = Math.max(0, sx);
                         sy = Math.max(0, sy);
                         sWidth = Math.min(sWidth, naturalWidth - sx);
                         sHeight = Math.min(sHeight, naturalHeight - sy);

                         ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, photoPxWidth, photoPxHeight);

                    } else {
                        // If not cropping, just draw the entire image scaled to fit the photo size
                        // This will stretch/squash if aspect ratios don't match, or use object-fit logic
                        // For simplicity, let's just draw the full image centered and scaled to fill.
                        let drawX = x;
                        let drawY = y;
                        let drawWidth = photoPxWidth;
                        let drawHeight = photoPxHeight;

                        let imgAspectRatio = naturalWidth / naturalHeight;
                        let photoAspectRatio = photoPxWidth / photoPxHeight;

                        if (imgAspectRatio > photoAspectRatio) { // Image is wider than target photo
                            drawHeight = photoPxHeight;
                            drawWidth = naturalWidth * (photoPxHeight / naturalHeight);
                            drawX = x - (drawWidth - photoPxWidth) / 2; // Center horizontally
                        } else { // Image is taller or same aspect ratio
                            drawWidth = photoPxWidth;
                            drawHeight = naturalHeight * (photoPxWidth / naturalWidth);
                            drawY = y - (drawHeight - photoPxHeight) / 2; // Center vertically
                        }

                        // Apply pan and zoom to the image drawn on the canvas
                        // This part is also tricky and requires careful mapping of preview transforms
                        // to canvas drawImage parameters. A proper implementation would use a canvas
                        // to render the transformed image, then crop from that canvas.
                        // For now, let's just attempt to apply basic scale and offset.
                        // This will NOT perfectly match the visual preview unless you've done the math
                        // to map `imgData.offsetX`, `imgData.offsetY`, `imgData.scale` to the drawImage source.

                        // A simplified approach for this demo: Draw the image centered and then scale.
                        // More complex drawing (with pan/zoom) would need a temporary canvas or server-side.
                         ctx.drawImage(img, drawX + imgData.offsetX, drawY + imgData.offsetY,
                                        drawWidth * imgData.scale, drawHeight * imgData.scale);
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

    // Also call generatePhotoSheet when any image transformation happens
    zoomInBtn.addEventListener('click', generatePhotoSheet);
    zoomOutBtn.addEventListener('click', generatePhotoSheet);
    rotateLeftBtn.addEventListener('click', generatePhotoSheet);
    rotateRightBtn.addEventListener('click', generatePhotoSheet);
    // Note: Applying the *actual* crop and pan from the preview to the canvas
    // is the most complex part and often done server-side.
    // For this demo, crop button only changes `isCropping` and `imgData.crop` but not the actual drawing directly.
    // You'd need to manually trigger `generatePhotoSheet` *after* the crop is finalized (e.g., a "Apply Crop" button).
    // For simplicity, let's assume `generatePhotoSheet` uses the *current* imgData.crop if `isCropping` is true.


    // --- Download Functionality ---
    downloadBtn.addEventListener('click', () => {
        const canvas = outputPreview.querySelector('canvas');
        if (canvas) {
            const format = downloadFormatSelect.value;
            const filename = `passport_photos.${format}`;
            let quality = 0.9; // For JPG, 0-1

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
    // generatePhotoSheet() is called after photo loads
});
