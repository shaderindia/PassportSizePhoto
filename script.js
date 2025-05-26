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
let cropDragging = false, cropResizing = false, cropStart = null;

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
            // Reset crop
            cropRect = null;
            cropActive = false;
            cropBox.classList.add('hidden');
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
cropToggleBtn.addEventListener('click', () => {
    cropActive = !cropActive;
    cropToggleBtn.classList.toggle('active', cropActive);
    if (cropActive) {
        // Start crop box in center with correct aspect ratio
        let pvW = photoPreviewWrapper.clientWidth, pvH = photoPreviewWrapper.clientHeight;
        let dims = getPhotoDimsPx();
        let asp = dims.width / dims.height;
        let w = pvW * 0.7, h = pvH * 0.7;
        if (w / h > asp) w = h * asp; else h = w / asp;
        cropRect = { x: (pvW - w) / 2, y: (pvH - h) / 2, w, h };
        updateCropBox();
        cropBox.classList.remove('hidden');
    } else {
        cropBox.classList.add('hidden');
    }
    updatePreviewTransform();
});

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

// -- Crop Box Dragging/Resizing
cropBox.addEventListener('mousedown', (e) => {
    if (!cropActive) return;
    let rect = cropBox.getBoundingClientRect();
    if (e.offsetX > rect.width - 18 && e.offsetY > rect.height - 18) {
        cropResizing = true;
    } else {
        cropDragging = true;
    }
    cropStart = { x: e.clientX, y: e.clientY, ...cropRect };
    e.preventDefault();
    e.stopPropagation();
});
window.addEventListener('mousemove', (e) => {
    if (cropActive && cropDragging) {
        let pvW = photoPreviewWrapper.clientWidth, pvH = photoPreviewWrapper.clientHeight;
        let dx = e.clientX - cropStart.x, dy = e.clientY - cropStart.y;
        cropRect.x = Math.max(0, Math.min(cropStart.x + dx, pvW - cropRect.w));
        cropRect.y = Math.max(0, Math.min(cropStart.y + dy, pvH - cropRect.h));
        updateCropBox();
    }
    if (cropActive && cropResizing) {
        let dims = getPhotoDimsPx();
        let asp = dims.width / dims.height;
        let pvW = photoPreviewWrapper.clientWidth, pvH = photoPreviewWrapper.clientHeight;
        let dx = e.clientX - cropStart.x, dy = e.clientY - cropStart.y;
        let newW = Math.max(36, cropStart.w + dx);
        let newH = newW / asp;
        if (cropRect.y + newH > pvH) newH = pvH - cropRect.y, newW = newH * asp;
        if (cropRect.x + newW > pvW) newW = pvW - cropRect.x, newH = newW / asp;
        cropRect.w = newW;
        cropRect.h = newH;
        updateCropBox();
    }
});
window.addEventListener('mouseup', () => {
    cropDragging = false;
    cropResizing = false;
});

// -- Update Preview Transform
function updatePreviewTransform() {
    if (!imgLoaded) return;
    photoPreview.style.transform = `translate(${pan.x}px,${pan.y}px) scale(${zoom}) rotate(${rotate}deg)`;
    // Crop box
    if (cropActive && cropRect) updateCropBox();
}
function updateCropBox() {
    if (!cropRect) return;
    cropBox.style.left = cropRect.x + 'px';
    cropBox.style.top = cropRect.y + 'px';
    cropBox.style.width = cropRect.w + 'px';
    cropBox.style.height = cropRect.h + 'px';
    // Add resize handle if not present
    if (!cropBox.querySelector('.resize-handle')) {
        let handle = document.createElement('div');
        handle.className = 'resize-handle';
        cropBox.appendChild(handle);
    }
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
    // In preview, get crop box in image coordinates
    if (cropActive && cropRect) {
        // Get preview box size
        let pvW = photoPreviewWrapper.clientWidth, pvH = photoPreviewWrapper.clientHeight;
        // Find what part of image is shown in preview
        let scale = Math.min(pvW / imgW, pvH / imgH) * zoom;
        // Offset introduced by pan
        let offsetX = (pvW - imgW * scale) / 2 + pan.x;
        let offsetY = (pvH - imgH * scale) / 2 + pan.y;
        // Crop box in preview coordinates
        let cropX = cropRect.x - offsetX;
        let cropY = cropRect.y - offsetY;
        let cropW = cropRect.w, cropH = cropRect.h;
        // Map to image coordinates
        let sx = cropX / scale;
        let sy = cropY / scale;
        let sw = cropW / scale;
        let sh = cropH / scale;
        // Clamp
        sx = Math.max(0, sx);
        sy = Math.max(0, sy);
        sw = Math.max(10, Math.min(sw, imgW - sx));
        sh = Math.max(10, Math.min(sh, imgH - sy));
        return { sx, sy, sw, sh };
    }
    // No crop: center region as much as possible
    let pvW = photoPreviewWrapper.clientWidth, pvH = photoPreviewWrapper.clientHeight;
    let scale = Math.min(pvW / imgW, pvH / imgH) * zoom;
    let viewW = pvW / scale, viewH = pvH / scale;
    let sx = Math.max(0, -pan.x / scale);
    let sy = Math.max(0, -pan.y / scale);
    let sw = Math.min(imgW - sx, viewW);
    let sh = Math.min(imgH - sy, viewH);

    // Rotation is not handled in canvas render (for user-friendliness: only crop/zoom/pan are reflected in output)
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
    // For high quality, temporarily scale up canvas 2x, then revert
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
        // Fallback: copy link
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
