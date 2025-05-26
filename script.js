// ======= DOM Elements =======
const unitSelect = document.getElementById('unit');
const dpiGroup = document.getElementById('dpi-group');
const dpiInput = document.getElementById('dpi');
const unitLabels = document.querySelectorAll('.unit-label');
const photoWidthInput = document.getElementById('photo-width');
const photoHeightInput = document.getElementById('photo-height');
const photoDimsHint = document.querySelector('.hint');

const pageSizeRadios = document.getElementsByName('page-size');
const customPageSizeSection = document.querySelector('.custom-page-size');
const customWidthInput = document.getElementById('custom-width');
const customHeightInput = document.getElementById('custom-height');

const photoUploadInput = document.getElementById('photo-upload');
const photoPreviewContainer = document.querySelector('.photo-preview-container');
const photoPreview = document.getElementById('photo-preview');
const photoPreviewWrapper = document.getElementById('photo-preview-wrapper');
const cropBox = document.getElementById('crop-box');
const adjustTools = document.querySelector('.adjust-tools');
const zoomInBtn = document.getElementById('zoom-in');
const zoomOutBtn = document.getElementById('zoom-out');
const rotateLeftBtn = document.getElementById('rotate-left');
const rotateRightBtn = document.getElementById('rotate-right');
const cropToggleBtn = document.getElementById('crop-toggle');

const numPhotosInput = document.getElementById('num-photos');
const autoSpacingToggle = document.getElementById('auto-spacing');
const spacingControls = document.getElementById('spacing-controls');
const hSpacingInput = document.getElementById('h-spacing');
const vSpacingInput = document.getElementById('v-spacing');
const autoMarginsToggle = document.getElementById('auto-margins');
const marginControls = document.getElementById('margin-controls');
const marginTopInput = document.getElementById('margin-top');
const marginBottomInput = document.getElementById('margin-bottom');
const marginLeftInput = document.getElementById('margin-left');
const marginRightInput = document.getElementById('margin-right');

const outputCanvas = document.getElementById('output-canvas');
const formatSelect = document.getElementById('format');
const downloadBtn = document.getElementById('download-btn');
const downloadHQBtn = document.getElementById('download-hq-btn');
const shareBtn = document.getElementById('share-btn');

// ======= State Variables =======
let unit = 'mm';
let dpi = 300;
let photoWidth = 35;
let photoHeight = 45;
let pageSize = 'a4';
let customPage = { width: 210, height: 297 };
let uploadedImage = null;
let imgObj = new window.Image();
let imgLoaded = false;
let imgURL = null;

// Photo adjustment
let zoom = 1.0;
let rotate = 0;
let pan = { x: 0, y: 0 }, isPanning = false, panStart = { x: 0, y: 0 };
let cropActive = false;
let cropRect = null; // { x, y, w, h }

// Arrangement
let numPhotos = 8;
let autoSpacing = true, hSpacing = 15, vSpacing = 15;
let autoMargins = true, marginTop = 15, marginBottom = 15, marginLeft = 15, marginRight = 15;

// ======= Helper Functions =======
function updateUnitLabels() {
    unitLabels.forEach(label => label.textContent = unit);
}

function updatePhotoDimsHint() {
    if (unit === 'mm') {
        photoDimsHint.textContent = 'Standard passport photo size is 35mm x 45mm';
    } else if (unit === 'inch') {
        photoDimsHint.textContent = 'Standard passport photo size is 1.38in x 1.77in';
    } else {
        photoDimsHint.textContent = 'Standard passport photo size is 413px x 531px (at 300 DPI)';
    }
}

function getPhotoDimsPx() {
    if (unit === 'px') {
        return {
            width: parseInt(photoWidthInput.value) || 300,
            height: parseInt(photoHeightInput.value) || 400
        };
    }
    const w = parseFloat(photoWidthInput.value);
    const h = parseFloat(photoHeightInput.value);
    if (unit === 'mm') {
        return {
            width: Math.round(w * dpi / 25.4),
            height: Math.round(h * dpi / 25.4)
        };
    } else if (unit === 'inch') {
        return {
            width: Math.round(w * dpi),
            height: Math.round(h * dpi)
        };
    }
    return { width: 300, height: 400 };
}

function getPageDimsPx() {
    let w, h;
    if (pageSize === 'a4') {
        w = 210; h = 297;
    } else if (pageSize === '4r') {
        w = 102; h = 152;
    } else {
        w = parseFloat(customWidthInput.value) || 210;
        h = parseFloat(customHeightInput.value) || 297;
    }
    if (unit === 'px') {
        return {
            width: Math.round(w),
            height: Math.round(h)
        };
    } else if (unit === 'mm') {
        return {
            width: Math.round(w * dpi / 25.4),
            height: Math.round(h * dpi / 25.4)
        };
    } else {
        return {
            width: Math.round(w * dpi),
            height: Math.round(h * dpi)
        };
    }
}

function getSpacingPx() {
    if (unit === 'px') {
        return {
            h: parseInt(hSpacingInput.value) || 15,
            v: parseInt(vSpacingInput.value) || 15
        };
    }
    if (unit === 'mm') {
        return {
            h: Math.round((parseInt(hSpacingInput.value) || 15) * dpi / 25.4),
            v: Math.round((parseInt(vSpacingInput.value) || 15) * dpi / 25.4)
        };
    }
    return {
        h: Math.round((parseInt(hSpacingInput.value) || 15) * dpi),
        v: Math.round((parseInt(vSpacingInput.value) || 15) * dpi)
    };
}

function getMarginsPx() {
    function convert(val) {
        if (unit === 'px') return parseInt(val) || 15;
        if (unit === 'mm') return Math.round((parseInt(val) || 15) * dpi / 25.4);
        return Math.round((parseInt(val) || 15) * dpi);
    }
    return {
        top: convert(marginTopInput.value),
        bottom: convert(marginBottomInput.value),
        left: convert(marginLeftInput.value),
        right: convert(marginRightInput.value)
    };
}

// ======= Event Handlers =======

// -- Unit selection & DPI
unitSelect.addEventListener('change', () => {
    unit = unitSelect.value;
    updateUnitLabels();
    if (unit === 'px') {
        dpiGroup.classList.remove('hidden');
        if (photoWidthInput.value < 50) photoWidthInput.value = 300;
        if (photoHeightInput.value < 50) photoHeightInput.value = 400;
    } else {
        dpiGroup.classList.add('hidden');
        if (unit === 'mm') {
            photoWidthInput.value = 35;
            photoHeightInput.value = 45;
        } else if (unit === 'inch') {
            photoWidthInput.value = (35/25.4).toFixed(2);
            photoHeightInput.value = (45/25.4).toFixed(2);
        }
    }
    updatePhotoDimsHint();
    renderCanvas();
});

dpiInput.addEventListener('input', () => {
    let v = Math.max(50, Math.min(1200, parseInt(dpiInput.value) || 300));
    dpi = v;
    dpiInput.value = v;
    renderCanvas();
});

// -- Photo dimensions
photoWidthInput.addEventListener('input', renderCanvas);
photoHeightInput.addEventListener('input', renderCanvas);

// -- Page size
pageSizeRadios.forEach(radio => radio.addEventListener('change', () => {
    pageSize = document.querySelector('input[name="page-size"]:checked').value;
    if (pageSize === 'custom') {
        customPageSizeSection.classList.remove('hidden');
    } else {
        customPageSizeSection.classList.add('hidden');
    }
    renderCanvas();
}));
customWidthInput.addEventListener('input', renderCanvas);
customHeightInput.addEventListener('input', renderCanvas);

// -- Arrangement
numPhotosInput.addEventListener('input', () => {
    numPhotos = Math.max(1, parseInt(numPhotosInput.value) || 8);
    numPhotosInput.value = numPhotos;
    renderCanvas();
});
autoSpacingToggle.addEventListener('change', () => {
    autoSpacing = autoSpacingToggle.checked;
    spacingControls.classList.toggle('hidden', autoSpacing);
    renderCanvas();
});
hSpacingInput.addEventListener('input', renderCanvas);
vSpacingInput.addEventListener('input', renderCanvas);

autoMarginsToggle.addEventListener('change', () => {
    autoMargins = autoMarginsToggle.checked;
    marginControls.classList.toggle('hidden', autoMargins);
    renderCanvas();
});
marginTopInput.addEventListener('input', renderCanvas);
marginBottomInput.addEventListener('input', renderCanvas);
marginLeftInput.addEventListener('input', renderCanvas);
marginRightInput.addEventListener('input', renderCanvas);

// -- Photo Upload
photoUploadInput.addEventListener('change', (e) => {
    if (photoUploadInput.files && photoUploadInput.files[0]) {
        let file = photoUploadInput.files[0];
        if (!file.type.startsWith('image/')) return;
        if (imgURL) URL.revokeObjectURL(imgURL);
        imgURL = URL.createObjectURL(file);
        imgObj.src = imgURL;
        imgObj.onload = () => {
            imgLoaded = true;
            zoom = 1.0;
            rotate = 0;
            pan = { x: 0, y: 0 };
            photoPreviewContainer.classList.remove('hidden');
            photoPreview.src = imgURL;
            cropRect = null;
            cropActive = false;
            cropBox.classList.add('hidden');
            showCropUI(false);
            updatePreviewTransform();
            renderCanvas();
        };
    }
});

// -- Adjustment Tools
zoomInBtn.addEventListener('click', () => {
    zoom = Math.min(zoom * 1.11, 7);
    updatePreviewTransform();
});
zoomOutBtn.addEventListener('click', () => {
    zoom = Math.max(zoom / 1.11, 0.2);
    updatePreviewTransform();
});
rotateLeftBtn.addEventListener('click', () => {
    rotate = (rotate - 90) % 360;
    updatePreviewTransform();
});
rotateRightBtn.addEventListener('click', () => {
    rotate = (rotate + 90) % 360;
    updatePreviewTransform();
});

// ====== Improved Crop UI ======

// Add overlay dynamically
let cropOverlay = null;
function showCropUI(show) {
    if (!cropOverlay) {
        cropOverlay = document.createElement('div');
        cropOverlay.className = 'crop-overlay';
        photoPreviewWrapper.appendChild(cropOverlay);
    }
    cropOverlay.style.display = show ? 'block' : 'none';
    cropBox.classList.toggle('active', show);
}

// Add handles dynamically
function addCropHandles() {
    cropBox.innerHTML = '';
    ['nw','n','ne','e','se','s','sw','w'].forEach(pos => {
        let h = document.createElement('div');
        h.className = `crop-handle ${pos}`;
        h.dataset.handle = pos;
        cropBox.appendChild(h);
    });
    // Add size indicator
    let size = document.createElement('div');
    size.className = 'crop-size-indicator';
    size.id = 'crop-size-indicator';
    cropBox.appendChild(size);
}
function updateCropSizeIndicator() {
    const dims = getPhotoDimsPx();
    let pvW = photoPreviewWrapper.clientWidth;
    let pvH = photoPreviewWrapper.clientHeight;
    let w = dims.width, h = dims.height;
    let unitStr = unit;
    if (cropRect) {
        // Map preview px to user units for size
        if (unit === 'px') {
            w = Math.round(cropRect.w);
            h = Math.round(cropRect.h);
        } else if (unit === 'mm') {
            w = (cropRect.w * 25.4 / dpi).toFixed(1);
            h = (cropRect.h * 25.4 / dpi).toFixed(1);
        } else {
            w = (cropRect.w / dpi).toFixed(2);
            h = (cropRect.h / dpi).toFixed(2);
        }
    }
    document.getElementById('crop-size-indicator').textContent = `${w} × ${h} ${unitStr}`;
}

// Show/hide crop UI
cropToggleBtn.addEventListener('click', () => {
    cropActive = !cropActive;
    cropToggleBtn.classList.toggle('active', cropActive);
    showCropUI(cropActive);
    if (cropActive) {
        // Start crop box in center with correct aspect ratio
        let pvW = photoPreviewWrapper.clientWidth, pvH = photoPreviewWrapper.clientHeight;
        let dims = getPhotoDimsPx();
        let asp = dims.width / dims.height;
        let w = pvW * 0.7, h = pvH * 0.7;
        if (w / h > asp) w = h * asp; else h = w / asp;
        cropRect = {
            x: (pvW - w) / 2,
            y: (pvH - h) / 2,
            w: w,
            h: h
        };
        updateCropBox();
        cropBox.classList.remove('hidden');
        addCropHandles();
        updateCropSizeIndicator();
    } else {
        cropBox.classList.add('hidden');
        showCropUI(false);
    }
    updatePreviewTransform();
});

// Crop state
let cropDragMode = null; // 'move' or one of 'nw','n','ne','e','se','s','sw','w'
let cropStartMouse = null;
let cropStartRect = null;

// Mouse/touch helpers
function getPointer(e) {
    if (e.touches && e.touches.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
}
function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

// Crop interaction handlers
function cropPointerDown(e) {
    if (!cropActive) return;
    e.preventDefault();
    const pointer = getPointer(e);
    const handle = e.target.classList.contains('crop-handle') ? e.target.dataset.handle : null;
    cropDragMode = handle || 'move';
    cropStartMouse = pointer;
    cropStartRect = { ...cropRect };
    cropBox.classList.add('active');
    document.body.style.userSelect = 'none';
}
function cropPointerMove(e) {
    if (!cropActive || !cropDragMode) return;
    e.preventDefault();
    const pointer = getPointer(e);
    let dx = pointer.x - cropStartMouse.x;
    let dy = pointer.y - cropStartMouse.y;
    let pvW = photoPreviewWrapper.clientWidth;
    let pvH = photoPreviewWrapper.clientHeight;
    let dims = getPhotoDimsPx();
    let asp = dims.width / dims.height;
    let minW = 36, minH = minW / asp;

    let r = { ...cropStartRect };

    // Resizing
    if (cropDragMode !== 'move') {
        // Corners and edges
        switch (cropDragMode) {
            case 'nw':
                r.x += dx;
                r.y += dy;
                r.w -= dx;
                r.h -= dy;
                break;
            case 'n':
                r.y += dy;
                r.h -= dy;
                break;
            case 'ne':
                r.y += dy;
                r.w += dx;
                r.h -= dy;
                break;
            case 'e':
                r.w += dx;
                break;
            case 'se':
                r.w += dx;
                r.h += dy;
                break;
            case 's':
                r.h += dy;
                break;
            case 'sw':
                r.x += dx;
                r.w -= dx;
                r.h += dy;
                break;
            case 'w':
                r.x += dx;
                r.w -= dx;
                break;
        }
        // Maintain aspect ratio
        let newAsp = r.w / r.h;
        if (Math.abs(newAsp - asp) > 0.01) {
            if (['n','s'].includes(cropDragMode)) {
                // Vertical edge, adjust width to match aspect
                r.w = r.h * asp;
                if (cropDragMode === 'n') r.x = cropStartRect.x + cropStartRect.w - r.w;
            } else if (['e','w'].includes(cropDragMode)) {
                // Horizontal edge, adjust height
                r.h = r.w / asp;
                if (cropDragMode === 'w') r.y = cropStartRect.y + cropStartRect.h - r.h;
            } else {
                // corner, adjust to keep aspect by whichever side changes more
                let dw = r.w - cropStartRect.w, dh = r.h - cropStartRect.h;
                if (Math.abs(dw) > Math.abs(dh)) {
                    r.h = r.w / asp;
                    if (cropDragMode.endsWith('n')) r.y = cropStartRect.y + cropStartRect.h - r.h;
                } else {
                    r.w = r.h * asp;
                    if (cropDragMode.endsWith('w')) r.x = cropStartRect.x + cropStartRect.w - r.w;
                }
            }
        }
        // Min size
        r.w = Math.max(minW, r.w);
        r.h = Math.max(minH, r.h);
        // Clamp to bounds
        if (r.x < 0) { r.w += r.x; r.x = 0;}
        if (r.y < 0) { r.h += r.y; r.y = 0;}
        if (r.x + r.w > pvW) r.w = pvW - r.x;
        if (r.y + r.h > pvH) r.h = pvH - r.y;
        cropRect = r;
    }
    // Move
    if (cropDragMode === 'move') {
        r.x = clamp(cropStartRect.x + dx, 0, pvW - r.w);
        r.y = clamp(cropStartRect.y + dy, 0, pvH - r.h);
        cropRect.x = r.x;
        cropRect.y = r.y;
    }
    updateCropBox();
    updateCropSizeIndicator();
}
function cropPointerUp(e) {
    cropDragMode = null;
    document.body.style.userSelect = '';
    cropBox.classList.remove('active');
}

// Attach events
function attachCropListeners() {
    cropBox.addEventListener('mousedown', cropPointerDown);
    cropBox.addEventListener('touchstart', cropPointerDown, { passive: false });
    window.addEventListener('mousemove', cropPointerMove);
    window.addEventListener('touchmove', cropPointerMove, { passive: false });
    window.addEventListener('mouseup', cropPointerUp);
    window.addEventListener('touchend', cropPointerUp);
}
attachCropListeners();

// Update crop box position/size/handles
function updateCropBox() {
    if (!cropRect) return;
    cropBox.style.left = cropRect.x + 'px';
    cropBox.style.top = cropRect.y + 'px';
    cropBox.style.width = cropRect.w + 'px';
    cropBox.style.height = cropRect.h + 'px';
    if (!cropBox.querySelector('.crop-handle')) addCropHandles();
    updateCropSizeIndicator();
}

// -- Photo Preview: Pan & Crop
let previewDragging = false, previewStart = { x: 0, y: 0 }, panStartVal = { x: 0, y: 0 };
photoPreviewWrapper.addEventListener('mousedown', (e) => {
    if (!imgLoaded || cropActive) return;
    previewDragging = true;
    previewStart = { x: e.clientX, y: e.clientY };
    panStartVal = { ...pan };
});
photoPreviewWrapper.addEventListener('mousemove', (e) => {
    if (previewDragging && !cropActive) {
        let dx = e.clientX - previewStart.x, dy = e.clientY - previewStart.y;
        pan.x = panStartVal.x + dx;
        pan.y = panStartVal.y + dy;
        updatePreviewTransform();
    }
});
window.addEventListener('mouseup', () => previewDragging = false);

// -- Update Preview Transform
function updatePreviewTransform() {
    if (!imgLoaded) return;
    photoPreview.style.transform = `translate(${pan.x}px,${pan.y}px) scale(${zoom}) rotate(${rotate}deg)`;
    if (cropActive && cropRect) updateCropBox();
}

// ======= Canvas Rendering =======
function renderCanvas() {
    let dims = getPhotoDimsPx();
    let pageDims = getPageDimsPx();
    let spacing = getSpacingPx();
    let margins = getMarginsPx();

    // Arrangement calculation
    let np = Math.max(1, parseInt(numPhotosInput.value) || 8);
    let cols = Math.floor((pageDims.width - margins.left - margins.right + spacing.h) / (dims.width + spacing.h));
    if (cols < 1) cols = 1;
    let rows = Math.ceil(np / cols);

    // If auto spacing/margin enabled, recalculate
    if (autoSpacing) {
        let freeW = pageDims.width - margins.left - margins.right - cols * dims.width;
        spacing.h = cols > 1 ? Math.max(0, Math.floor(freeW / (cols - 1))) : 0;
        hSpacingInput.value = unit === 'px' ? spacing.h : unit === 'mm' ? Math.round(spacing.h * 25.4 / dpi) : (spacing.h / dpi).toFixed(2);
    }
    if (autoMargins) {
        let usedH = rows * dims.height + (rows - 1) * spacing.v;
        let freeH = Math.max(0, pageDims.height - usedH);
        margins.top = margins.bottom = Math.floor(freeH / 2);
        marginTopInput.value = marginBottomInput.value = unit === 'px' ? margins.top : unit === 'mm' ? Math.round(margins.top * 25.4 / dpi) : (margins.top / dpi).toFixed(2);
    }

    // Set canvas size
    outputCanvas.width = pageDims.width;
    outputCanvas.height = pageDims.height;

    let ctx = outputCanvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, pageDims.width, pageDims.height);

    // Draw each photo
    if (imgLoaded) {
        let imgW = imgObj.naturalWidth, imgH = imgObj.naturalHeight;
        let cropParams = getCropParams(imgW, imgH);
        let drawn = 0;
        for (let r = 0; r < rows && drawn < np; r++) {
            for (let c = 0; c < cols && drawn < np; c++, drawn++) {
                let x = margins.left + c * (dims.width + spacing.h);
                let y = margins.top + r * (dims.height + spacing.v);
                ctx.save();
                // Draw photo
                ctx.drawImage(
                    imgObj,
                    cropParams.sx, cropParams.sy, cropParams.sw, cropParams.sh,
                    x, y, dims.width, dims.height
                );
                // Dotted cutting lines
                ctx.strokeStyle = "#2196f3";
                ctx.setLineDash([6, 6]);
                ctx.lineWidth = 1.5;
                ctx.strokeRect(x, y, dims.width, dims.height);
                ctx.setLineDash([]);
                ctx.restore();
            }
        }
    }
    // Optionally, draw page border
    ctx.save();
    ctx.strokeStyle = "#b0bec5";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, pageDims.width, pageDims.height);
    ctx.restore();
}

function getCropParams(imgW, imgH) {
    if (cropActive && cropRect) {
        let pvW = photoPreviewWrapper.clientWidth;
        let pvH = photoPreviewWrapper.clientHeight;
        let scale = Math.min(pvW / imgW, pvH / imgH) * zoom;
        let offsetX = (pvW - imgW * scale) / 2 + pan.x;
        let offsetY = (pvH - imgH * scale) / 2 + pan.y;
        let cropX = cropRect.x - offsetX;
        let cropY = cropRect.y - offsetY;
        let cropW = cropRect.w;
        let cropH = cropRect.h;
        let sx = cropX / scale;
        let sy = cropY / scale;
        let sw = cropW / scale;
        let sh = cropH / scale;
        sx = Math.max(0, sx);
        sy = Math.max(0, sy);
        sw = Math.max(10, Math.min(sw, imgW - sx));
        sh = Math.max(10, Math.min(sh, imgH - sy));
        return { sx, sy, sw, sh };
    }
    let pvW = photoPreviewWrapper.clientWidth, pvH = photoPreviewWrapper.clientHeight;
    let scale = Math.min(pvW / imgW, pvH / imgH) * zoom;
    let offsetX = (pvW - imgW * scale) / 2 + pan.x;
    let offsetY = (pvH - imgH * scale) / 2 + pan.y;
    let sx = Math.max(0, -offsetX / scale);
    let sy = Math.max(0, -offsetY / scale);
    let sw = Math.min(imgW - sx, pvW / scale);
    let sh = Math.min(imgH - sy, pvH / scale);
    return { sx, sy, sw, sh };
}

// ======= Download Handling =======
downloadBtn.addEventListener('click', () => {
    let format = formatSelect.value;
    let link = document.createElement('a');
    link.download = `passport-photo.${format}`;
    link.href = outputCanvas.toDataURL(`image/${format === 'jpg' ? 'jpeg' : 'png'}`, 0.85);
    link.click();
});
downloadHQBtn.addEventListener('click', () => {
    let origW = outputCanvas.width, origH = outputCanvas.height;
    outputCanvas.width = origW * 2;
    outputCanvas.height = origH * 2;
    renderCanvas();
    let format = formatSelect.value;
    let link = document.createElement('a');
    link.download = `passport-photo-hq.${format}`;
    link.href = outputCanvas.toDataURL(`image/${format === 'jpg' ? 'jpeg' : 'png'}`, 1.0);
    link.click();
    outputCanvas.width = origW;
    outputCanvas.height = origH;
    renderCanvas();
});

// ======= Share Button =======
shareBtn.addEventListener('click', async () => {
    const shareData = {
        title: "Nishix Passport Photo Maker",
        text: "Create passport photos easily! Try Nishix Passport Photo Maker.",
        url: window.location.href
    };
    if (navigator.share) {
        try {
            await navigator.share(shareData);
        } catch (e) { /* ignore */ }
    } else {
        try {
            await navigator.clipboard.writeText(window.location.href);
            shareBtn.innerHTML = '<i class="fa fa-check"></i> Link Copied!';
            setTimeout(() => {
                shareBtn.innerHTML = '<i class="fa fa-share-alt"></i> Share this App';
            }, 1800);
        } catch (e) {
            prompt("Copy this link:", window.location.href);
        }
    }
});

// ======= Initial Setup =======
function init() {
    updateUnitLabels();
    updatePhotoDimsHint();
    renderCanvas();
    spacingControls.classList.toggle('hidden', autoSpacing);
    marginControls.classList.toggle('hidden', autoMargins);
}
init();
