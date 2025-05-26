document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const unitRadios = document.querySelectorAll('input[name="units"]');
    const pixelDensityGroup = document.getElementById('pixelDensityGroup');
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
        src: '',
        scale: 1,
        rotation: 0,
        x: 0, // for panning during zoom/crop
        y: 0, // for panning during zoom/crop
        crop: { x: 0, y: 0, width: 0, height: 0 } // Cropping area
    };
    let isCropping = false;
    let isDraggingCropBox = false;
    let isResizingCropBox = false;
    let startX, startY;
    let cropBoxStartWidth, cropBoxStartHeight, cropBoxStartX, cropBoxStartY;

    // --- Unit and Dimension Logic ---
    const updateUnitLabels = () => {
        currentUnit = document.querySelector('input[name="units"]:checked').value;
        const unitLabels = [photoWidthUnit, photoLengthUnit, customPageWidthUnit, customPageHeightUnit, horizontalSpacingValue, verticalSpacingValue, topMarginValue, leftMarginValue];

        unitLabels.forEach(label => {
            if (label) { // Check if element exists
                label.textContent = currentUnit === 'pixel' ? 'px' : currentUnit;
            }
        });

        // Toggle pixel density input visibility
        if (currentUnit === 'pixel') {
            pixelDensityGroup.style.display = 'flex';
        } else {
            pixelDensityGroup.style.display = 'none';
        }

        // Adjust default values based on unit if needed
        // For simplicity, we'll keep mm as primary input and convert internally for pixel if needed
        if (currentUnit === 'mm') {
            if (photoWidthInput.value === '400') photoWidthInput.value = '35';
            if (photoLengthInput.value === '400') photoLengthInput.value = '45';
        } else if (currentUnit === 'pixel') {
            // Placeholder: A real app would convert mm to px based on DPI
            // For now, just set a pixel default if unit is pixel
            if (photoWidthInput.value === '35') photoWidthInput.value = '300';
            if (photoLengthInput.value === '45') photoLengthInput.value = '400';
        }
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
    };

    pageSizeRadios.forEach(radio => {
        radio.addEventListener('change', toggleCustomPageSize);
    });
    toggleCustomPageSize(); // Initial call

    // Spacing and Margin Logic
    const toggleManualSpacing = () => {
        manualSpacingDiv.style.display = autoSpacingCheckbox.checked ? 'none' : 'flex';
    };
    autoSpacingCheckbox.addEventListener('change', toggleManualSpacing);
    toggleManualSpacing(); // Initial call

    const toggleManualMargin = () => {
        manualMarginDiv.style.display = autoMarginCheckbox.checked ? 'none' : 'flex';
    };
    autoMarginCheckbox.addEventListener('change', toggleManualMargin);
    toggleManualMargin(); // Initial call

    horizontalSpacingInput.addEventListener('input', () => {
        horizontalSpacingValue.textContent = `${horizontalSpacingInput.value}${currentUnit}`;
    });
    verticalSpacingInput.addEventListener('input', () => {
        verticalSpacingValue.textContent = `${verticalSpacingInput.value}${currentUnit}`;
    });
    topMarginInput.addEventListener('input', () => {
        topMarginValue.textContent = `${topMarginInput.value}${currentUnit}`;
    });
    leftMarginInput.addEventListener('input', () => {
        leftMarginValue.textContent = `${leftMarginInput.value}${currentUnit}`;
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
                imgData.x = 0;
                imgData.y = 0;
                croppingOverlay.style.display = 'none'; // Hide overlay initially
                updatePhotoPreviewStyles();
            };
            reader.readAsDataURL(photoFile);
        }
    };

    const updatePhotoPreviewStyles = () => {
        photoPreview.style.transform = `
            translate(${imgData.x}px, ${imgData.y}px)
            scale(${imgData.scale})
            rotate(${imgData.rotation}deg)
        `;
        // For cropping, this would ideally be done on a canvas for actual manipulation
    };

    // --- Photo Controls (Zoom, Rotate, Crop) ---
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

    cropPhotoBtn.addEventListener('click', () => {
        isCropping = !isCropping;
        if (isCropping) {
            croppingOverlay.style.display = 'flex';
            // Set initial crop box size based on desired aspect ratio
            const previewRect = photoPreview.getBoundingClientRect();
            const photoRatio = photoWidthInput.value / photoLengthInput.value;

            let cropWidth, cropHeight;
            if (previewRect.width / previewRect.height > photoRatio) {
                cropHeight = previewRect.height * 0.7; // Start with 70% of height
                cropWidth = cropHeight * photoRatio;
            } else {
                cropWidth = previewRect.width * 0.7; // Start with 70% of width
                cropHeight = cropWidth / photoRatio;
            }

            cropBox.style.width = `${cropWidth}px`;
            cropBox.style.height = `${cropHeight}px`;
            cropBox.style.left = `${(previewRect.width - cropWidth) / 2}px`;
            cropBox.style.top = `${(previewRect.height - cropHeight) / 2}px`;
            cropBox.style.cursor = 'grab';

            // Store initial crop box dimensions
            imgData.crop.width = cropWidth;
            imgData.crop.height = cropHeight;
            imgData.crop.x = (previewRect.width - cropWidth) / 2;
            imgData.crop.y = (previewRect.height - cropHeight) / 2;

        } else {
            croppingOverlay.style.display = 'none';
            // In a real app, you'd apply the crop here to a canvas or send to server
        }
    });

    // --- Cropping Interaction (Drag & Resize) ---
    croppingOverlay.addEventListener('mousedown', (e) => {
        if (isCropping) {
            const cropBoxRect = cropBox.getBoundingClientRect();
            const mouseX = e.clientX;
            const mouseY = e.clientY;

            // Check if resizing from corners/edges (simplified for example)
            const handleSize = 10;
            if (mouseX > cropBoxRect.right - handleSize && mouseY > cropBoxRect.bottom - handleSize) {
                isResizingCropBox = true;
                cropBoxStartWidth = cropBoxRect.width;
                cropBoxStartHeight = cropBoxRect.height;
                startX = e.clientX;
                startY = e.clientY;
                cropBox.style.cursor = 'nwse-resize';
            } else if (mouseX > cropBoxRect.left && mouseX < cropBoxRect.right &&
                       mouseY > cropBoxRect.top && mouseY < cropBoxRect.bottom) {
                isDraggingCropBox = true;
                startX = e.clientX;
                startY = e.clientY;
                cropBoxStartX = cropBox.offsetLeft;
                cropBoxStartY = cropBox.offsetTop;
                cropBox.style.cursor = 'grabbing';
            }
            e.preventDefault();
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (isCropping && (isDraggingCropBox || isResizingCropBox)) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            const previewRect = photoPreviewContainer.getBoundingClientRect();

            if (isDraggingCropBox) {
                let newX = cropBoxStartX + dx;
                let newY = cropBoxStartY + dy;

                // Keep crop box within preview container boundaries
                newX = Math.max(0, Math.min(newX, previewRect.width - cropBox.offsetWidth));
                newY = Math.max(0, Math.min(newY, previewRect.height - cropBox.offsetHeight));

                cropBox.style.left = `${newX}px`;
                cropBox.style.top = `${newY}px`;
                imgData.crop.x = newX;
                imgData.crop.y = newY;
            } else if (isResizingCropBox) {
                let newWidth = cropBoxStartWidth + dx;
                let newHeight = cropBoxStartHeight + dy;

                // Maintain aspect ratio during resize
                const photoRatio = photoWidthInput.value / photoLengthInput.value;
                newHeight = newWidth / photoRatio; // Adjust height based on new width and aspect ratio

                // Ensure crop box doesn't exceed preview container bounds
                newWidth = Math.min(newWidth, previewRect.width - cropBox.offsetLeft);
                newHeight = Math.min(newHeight, previewRect.height - cropBox.offsetTop);

                // Re-calculate newHeight based on newWidth if photoRatio is important for width
                if (photoRatio > 0) { // Avoid division by zero
                    newHeight = newWidth / photoRatio;
                } else { // Fallback if ratio is zero (e.g., photoLength is 0)
                    newHeight = newWidth; // Assume square for simplicity if ratio is invalid
                }

                cropBox.style.width = `${newWidth}px`;
                cropBox.style.height = `${newHeight}px`;
                imgData.crop.width = newWidth;
                imgData.crop.height = newHeight;
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


    // --- Core Functionality (Simulated) ---
    // In a real application, these functions would involve canvas manipulation or server-side image processing.
    // Here, they will primarily update the preview area.

    const generatePhotoSheet = () => {
        if (!photoFile) {
            outputPreview.innerHTML = '<p>Please upload a photo first.</p>';
            return;
        }

        const photoWidth = parseFloat(photoWidthInput.value);
        const photoLength = parseFloat(photoLengthInput.value);
        let pageWidth, pageHeight;

        const selectedPageSize = document.querySelector('input[name="pageSize"]:checked').value;
        if (selectedPageSize === 'A4') {
            pageWidth = 210; // mm
            pageHeight = 297; // mm
        } else if (selectedPageSize === '4R') {
            pageWidth = 102; // mm
            pageHeight = 152; // mm
        } else { // Custom
            pageWidth = parseFloat(customPageWidthInput.value);
            pageHeight = parseFloat(customPageHeightInput.value);
        }

        // Convert all dimensions to pixels for canvas (assuming 300 DPI for demo)
        const dpi = parseFloat(document.getElementById('pixelDensity').value || 300);
        const mmToPx = (mm) => (mm / 25.4) * dpi; // Convert mm to inches, then inches to pixels

        const photoPxWidth = currentUnit === 'pixel' ? photoWidth : mmToPx(photoWidth);
        const photoPxHeight = currentUnit === 'pixel' ? photoLength : mmToPx(photoLength);
        const pagePxWidth = currentUnit === 'pixel' && selectedPageSize !== 'custom' ? photoPxWidth * 4 : mmToPx(pageWidth); // Placeholder for pixel page sizes
        const pagePxHeight = currentUnit === 'pixel' && selectedPageSize !== 'custom' ? photoPxHeight * 6 : mmToPx(pageHeight);

        const numPhotos = parseInt(numPhotosInput.value);
        let hSpace = autoSpacingCheckbox.checked ? 0 : parseFloat(horizontalSpacingInput.value);
        let vSpace = autoSpacingCheckbox.checked ? 0 : parseFloat(verticalSpacingInput.value);
        let topM = autoMarginCheckbox.checked ? 0 : parseFloat(topMarginInput.value);
        let leftM = autoMarginCheckbox.checked ? 0 : parseFloat(leftMarginInput.value);

        // Convert spacing and margins to pixels
        hSpace = currentUnit === 'pixel' ? hSpace : mmToPx(hSpace);
        vSpace = currentUnit === 'pixel' ? vSpace : mmToPx(vSpace);
        topM = currentUnit === 'pixel' ? topM : mmToPx(topM);
        leftM = currentUnit === 'pixel' ? leftM : mmToPx(leftM);

        // Basic calculation for arranging photos
        const photosPerRow = Math.floor((pagePxWidth - 2 * leftM + hSpace) / (photoPxWidth + hSpace));
        const numRows = Math.ceil(numPhotos / photosPerRow);

        // Calculate automatic spacing and margins if enabled
        if (autoSpacingCheckbox.checked) {
            if (photosPerRow > 1) {
                hSpace = (pagePxWidth - (photosPerRow * photoPxWidth)) / (photosPerRow + 1);
            } else {
                hSpace = 0; // No horizontal space if only one photo per row
            }
            vSpace = (pagePxHeight - (numRows * photoPxHeight)) / (numRows + 1);
        }

        if (autoMarginCheckbox.checked) {
            topM = vSpace; // Set top margin to automatic vertical space
            leftM = hSpace; // Set left margin to automatic horizontal space
        }

        // Create a canvas for preview (client-side simulation)
        const canvas = document.createElement('canvas');
        canvas.width = pagePxWidth;
        canvas.height = pagePxHeight;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const img = new Image();
        img.src = photoPreview.src; // Use the current state of the preview image
        img.onload = () => {
            let photoCount = 0;
            for (let row = 0; row < numRows; row++) {
                for (let col = 0; col < photosPerRow; col++) {
                    if (photoCount >= numPhotos) break;

                    const x = leftM + col * (photoPxWidth + hSpace);
                    const y = topM + row * (photoPxHeight + vSpace);

                    // Draw the image onto the canvas, applying transformations
                    ctx.save();
                    ctx.translate(x + photoPxWidth / 2, y + photoPxHeight / 2);
                    ctx.rotate(imgData.rotation * Math.PI / 180);
                    ctx.scale(imgData.scale, imgData.scale);

                    // For actual cropping, you'd use drawImage with 9 arguments
                    // ctx.drawImage(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
                    // For this simplified demo, we just draw the scaled/rotated image
                    ctx.drawImage(img, -photoPxWidth / 2, -photoPxHeight / 2, photoPxWidth, photoPxHeight);

                    ctx.restore();

                    // Draw dotted lines for cutting
                    ctx.strokeStyle = '#999';
                    ctx.lineWidth = 1;
                    ctx.setLineDash([2, 2]);

                    // Horizontal lines
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + photoPxWidth, y);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(x, y + photoPxHeight);
                    ctx.lineTo(x + photoPxWidth, y + photoPxHeight);
                    ctx.stroke();

                    // Vertical lines
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x, y + photoPxHeight);
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(x + photoPxWidth, y);
                    ctx.lineTo(x + photoPxWidth, y + photoPxHeight);
                    ctx.stroke();

                    ctx.setLineDash([]); // Reset line dash

                    photoCount++;
                }
                if (photoCount >= numPhotos) break;
            }

            outputPreview.innerHTML = '';
            outputPreview.appendChild(canvas);
        };
        img.onerror = () => {
            outputPreview.innerHTML = '<p>Error loading image for preview. Please try again.</p>';
        };
    };

    // Update preview whenever relevant inputs change
    const inputsToWatch = [
        photoWidthInput, photoLengthInput,
        numPhotosInput,
        horizontalSpacingInput, verticalSpacingInput,
        topMarginInput, leftMarginInput,
        document.getElementById('pixelDensity')
    ];
    inputsToWatch.forEach(input => input.addEventListener('input', generatePhotoSheet));
    unitRadios.forEach(radio => radio.addEventListener('change', generatePhotoSheet));
    pageSizeRadios.forEach(radio => radio.addEventListener('change', generatePhotoSheet));
    autoSpacingCheckbox.addEventListener('change', generatePhotoSheet);
    autoMarginCheckbox.addEventListener('change', generatePhotoSheet);

    // Initial preview generation when photo is loaded
    photoUploadInput.addEventListener('change', generatePhotoSheet);


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

    // Initial updates on page load
    updateUnitLabels();
    toggleCustomPageSize();
    toggleManualSpacing();
    toggleManualMargin();
    // No initial generatePhotoSheet call until a photo is uploaded
});
