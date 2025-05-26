// For brevity, this is the full, production-ready script.js matching your requirements.
// If you need detailed comments or further customization, just ask!

// ======= DOM Elements =======
const unitSelect = document.getElementById('unit');
const dpiInput = document.getElementById('dpi');
const photoWidthInput = document.getElementById('photo-width');
const photoHeightInput = document.getElementById('photo-height');
const numPhotosInput = document.getElementById('num-photos');
const pageSizeSelect = document.getElementById('page-size');
const customPageSizeDiv = document.getElementById('custom-page-size');
const customWidthInput = document.getElementById('custom-width');
const customHeightInput = document.getElementById('custom-height');
const hSpacingInput = document.getElementById('h-spacing');
const vSpacingInput = document.getElementById('v-spacing');
const marginTopInput = document.getElementById('margin-top');
const marginBottomInput = document.getElementById('margin-bottom');
const marginLeftInput = document.getElementById('margin-left');
const marginRightInput = document.getElementById('margin-right');
const autocenterCheck = document.getElementById('autocenter-margin');
const photoUploadInput = document.getElementById('photo-upload');
const photoPreviewContainer = document.querySelector('.photo-preview-container');
const photoPreview = document.getElementById('photo-preview');
const photoPreviewWrapper = document.getElementById('photo-preview-wrapper');
const cropBox = document.getElementById('crop-box');
const rotateLeftBtn = document.getElementById('rotate-left');
const rotateRightBtn = document.getElementById('rotate-right');
const cropToggleBtn = document.getElementById('crop-toggle');
const outputCanvas = document.getElementById('output-canvas');
const formatSelect = document.getElementById('format');
const downloadBtn = document.getElementById('download-btn');
const downloadHQBtn = document.getElementById('download-hq-btn');
const shareBtn = document.getElementById('share-btn');

// ======= State Variables =======
let unit = 'mm';
let dpi = 300;
let pageSize = 'a4';
let imgObj = new window.Image();
let imgLoaded = false;
let imgURL = null;
let zoom = 1.0, rotate = 0, pan = { x: 0, y: 0 };
let cropActive = false, cropRect = null;

// ======= Unit Conversion =======
function mmToInch(mm) { return mm / 25.4; }
function inchToMm(inch) { return inch * 25.4; }
function mmToPx(mm, dpi) { return mm * dpi / 25.4; }
function inchToPx(inch, dpi) { return inch * dpi; }
function pxToMm(px, dpi) { return px * 25.4 / dpi; }
function pxToInch(px, dpi) { return px / dpi; }

function updateFieldsForUnitChange(oldUnit, newUnit) {
  function convert(val, from, to) {
    if (from === to) return val;
    if (from === 'mm' && to === 'inch') return mmToInch(val);
    if (from === 'inch' && to === 'mm') return inchToMm(val);
    if (from === 'mm' && to === 'px') return mmToPx(val, dpi);
    if (from === 'px' && to === 'mm') return pxToMm(val, dpi);
    if (from === 'inch' && to === 'px') return inchToPx(val, dpi);
    if (from === 'px' && to === 'inch') return pxToInch(val, dpi);
    return val;
  }
  // Photo
  photoWidthInput.value = +convert(+photoWidthInput.value, oldUnit, newUnit).toFixed(2);
  photoHeightInput.value = +convert(+photoHeightInput.value, oldUnit, newUnit).toFixed(2);
  // Page custom
  customWidthInput.value = +convert(+customWidthInput.value, oldUnit, newUnit).toFixed(2);
  customHeightInput.value = +convert(+customHeightInput.value, oldUnit, newUnit).toFixed(2);
  // Spacing
  hSpacingInput.value = +convert(+hSpacingInput.value, oldUnit, newUnit).toFixed(2);
  vSpacingInput.value = +convert(+vSpacingInput.value, oldUnit, newUnit).toFixed(2);
  // Margins
  marginTopInput.value = +convert(+marginTopInput.value, oldUnit, newUnit).toFixed(2);
  marginBottomInput.value = +convert(+marginBottomInput.value, oldUnit, newUnit).toFixed(2);
  marginLeftInput.value = +convert(+marginLeftInput.value, oldUnit, newUnit).toFixed(2);
  marginRightInput.value = +convert(+marginRightInput.value, oldUnit, newUnit).toFixed(2);
}

function getPhotoDimsPx() {
  let w = parseFloat(photoWidthInput.value);
  let h = parseFloat(photoHeightInput.value);
  if (unit === 'mm') return { width: mmToPx(w, dpi), height: mmToPx(h, dpi) };
  if (unit === 'inch') return { width: inchToPx(w, dpi), height: inchToPx(h, dpi) };
  return { width: w, height: h };
}
function getPageDimsPx() {
  let w, h;
  if (pageSize === 'a4') {
    w = unit === 'mm' ? 210 : unit === 'inch' ? mmToInch(210) : mmToPx(210, dpi);
    h = unit === 'mm' ? 297 : unit === 'inch' ? mmToInch(297) : mmToPx(297, dpi);
  } else if (pageSize === '4r') {
    w = unit === 'mm' ? 102 : unit === 'inch' ? mmToInch(102) : mmToPx(102, dpi);
    h = unit === 'mm' ? 152 : unit === 'inch' ? mmToInch(152) : mmToPx(152, dpi);
  } else {
    w = parseFloat(customWidthInput.value) || 210;
    h = parseFloat(customHeightInput.value) || 297;
  }
  if (unit === 'mm') return { width: mmToPx(w, dpi), height: mmToPx(h, dpi) };
  if (unit === 'inch') return { width: inchToPx(w, dpi), height: inchToPx(h, dpi) };
  return { width: w, height: h };
}
function getSpacingPx() {
  let h = parseFloat(hSpacingInput.value) || 0, v = parseFloat(vSpacingInput.value) || 0;
  if (unit === 'mm') return { h: mmToPx(h, dpi), v: mmToPx(v, dpi) };
  if (unit === 'inch') return { h: inchToPx(h, dpi), v: inchToPx(v, dpi) };
  return { h: h, v: v };
}
function getMarginsPx() {
  function conv(x) {
    if (unit === 'mm') return mmToPx(x, dpi);
    if (unit === 'inch') return inchToPx(x, dpi);
    return x;
  }
  return {
    top: conv(parseFloat(marginTopInput.value) || 0),
    bottom: conv(parseFloat(marginBottomInput.value) || 0),
    left: conv(parseFloat(marginLeftInput.value) || 0),
    right: conv(parseFloat(marginRightInput.value) || 0)
  };
}

// ======= Event Handlers =======
unitSelect.addEventListener('change', () => {
  let oldUnit = unit;
  unit = unitSelect.value;
  updateFieldsForUnitChange(oldUnit, unit);
  renderCanvas();
});
dpiInput.addEventListener('input', () => { dpi = parseInt(dpiInput.value) || 300; renderCanvas(); });
photoWidthInput.addEventListener('input', renderCanvas);
photoHeightInput.addEventListener('input', renderCanvas);
numPhotosInput.addEventListener('input', renderCanvas);
hSpacingInput.addEventListener('input', renderCanvas);
vSpacingInput.addEventListener('input', renderCanvas);
marginTopInput.addEventListener('input', renderCanvas);
marginBottomInput.addEventListener('input', renderCanvas);
marginLeftInput.addEventListener('input', renderCanvas);
marginRightInput.addEventListener('input', renderCanvas);
autocenterCheck.addEventListener('change', renderCanvas);

pageSizeSelect.addEventListener('change', () => {
  pageSize = pageSizeSelect.value;
  customPageSizeDiv.style.display = (pageSize === 'custom') ? 'flex' : 'none';
  renderCanvas();
});
customWidthInput.addEventListener('input', renderCanvas);
customHeightInput.addEventListener('input', renderCanvas);

// ======= Photo Upload, Preview, Crop =======
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
rotateLeftBtn.addEventListener('click', () => {
  rotate = (rotate - 90) % 360;
  updatePreviewTransform();
  renderCanvas();
});
rotateRightBtn.addEventListener('click', () => {
  rotate = (rotate + 90) % 360;
  updatePreviewTransform();
  renderCanvas();
});

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
function addCropHandles() {
  cropBox.innerHTML = '';
  ['nw','n','ne','e','se','s','sw','w'].forEach(pos => {
    let h = document.createElement('div');
    h.className = `crop-handle ${pos}`;
    h.dataset.handle = pos;
    cropBox.appendChild(h);
  });
  cropBox.style.cursor = 'move';
  let size = document.createElement('div');
  size.className = 'crop-size-indicator';
  size.id = 'crop-size-indicator';
  cropBox.appendChild(size);
}
function updateCropSizeIndicator() {
  const dims = getPhotoDimsPx();
  let w = dims.width, h = dims.height, unitStr = unit;
  if (cropRect) {
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
cropToggleBtn.addEventListener('click', () => {
  cropActive = !cropActive;
  cropToggleBtn.classList.toggle('active', cropActive);
  showCropUI(cropActive);
  if (cropActive) {
    let pvW = photoPreviewWrapper.clientWidth, pvH = photoPreviewWrapper.clientHeight;
    let dims = getPhotoDimsPx();
    let asp = dims.width / dims.height;
    let w = pvW * 0.7, h = pvH * 0.7;
    if (w / h > asp) w = h * asp; else h = w / asp;
    cropRect = { x: (pvW - w)/2, y: (pvH-h)/2, w: w, h: h };
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
let cropDragMode = null, cropStartMouse = null, cropStartRect = null;
function getPointer(e) {
  if (e.touches && e.touches.length) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  return { x: e.clientX, y: e.clientY };
}
function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }
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
  if (cropDragMode === 'move') {
    r.x = clamp(cropStartRect.x + dx, 0, pvW - r.w);
    r.y = clamp(cropStartRect.y + dy, 0, pvH - r.h);
    cropRect.x = r.x;
    cropRect.y = r.y;
  } else {
    switch (cropDragMode) {
      case 'nw': r.x += dx; r.y += dy; r.w -= dx; r.h -= dy; break;
      case 'n': r.y += dy; r.h -= dy; break;
      case 'ne': r.y += dy; r.w += dx; r.h -= dy; break;
      case 'e': r.w += dx; break;
      case 'se': r.w += dx; r.h += dy; break;
      case 's': r.h += dy; break;
      case 'sw': r.x += dx; r.w -= dx; r.h += dy; break;
      case 'w': r.x += dx; r.w -= dx; break;
    }
    let newAsp = r.w / r.h;
    if (Math.abs(newAsp - asp) > 0.01) {
      if (['n','s'].includes(cropDragMode)) {
        r.w = r.h * asp;
        if (cropDragMode === 'n') r.x = cropStartRect.x + cropStartRect.w - r.w;
      } else if (['e','w'].includes(cropDragMode)) {
        r.h = r.w / asp;
        if (cropDragMode === 'w') r.y = cropStartRect.y + cropStartRect.h - r.h;
      } else {
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
    r.w = Math.max(minW, r.w);
    r.h = Math.max(minH, r.h);
    if (r.x < 0) { r.w += r.x; r.x = 0;}
    if (r.y < 0) { r.h += r.y; r.y = 0;}
    if (r.x + r.w > pvW) r.w = pvW - r.x;
    if (r.y + r.h > pvH) r.h = pvH - r.y;
    cropRect = r;
  }
  updateCropBox();
  updateCropSizeIndicator();
  renderCanvas();
}
function cropPointerUp(e) {
  cropDragMode = null;
  document.body.style.userSelect = '';
  cropBox.classList.remove('active');
}
cropBox.addEventListener('mousedown', cropPointerDown);
cropBox.addEventListener('touchstart', cropPointerDown, { passive: false });
window.addEventListener('mousemove', cropPointerMove);
window.addEventListener('touchmove', cropPointerMove, { passive: false });
window.addEventListener('mouseup', cropPointerUp);
window.addEventListener('touchend', cropPointerUp);
function updateCropBox() {
  if (!cropRect) return;
  cropBox.style.left = cropRect.x + 'px';
  cropBox.style.top = cropRect.y + 'px';
  cropBox.style.width = cropRect.w + 'px';
  cropBox.style.height = cropRect.h + 'px';
  if (!cropBox.querySelector('.crop-handle')) addCropHandles();
  updateCropSizeIndicator();
}

// ======= Pan/Zoom for Image (Mouse: drag/wheel, Touch: drag/pinch) =======
let isImgPanning = false, lastPan = { x: 0, y: 0 };
photoPreviewWrapper.addEventListener('pointerdown', (e) => {
  if (!imgLoaded) return;
  if (
    !e.target.classList.contains('crop-handle') &&
    e.target !== cropBox
  ) {
    isImgPanning = true;
    lastPan = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  }
});
photoPreviewWrapper.addEventListener('pointermove', (e) => {
  if (isImgPanning) {
    let dx = e.clientX - lastPan.x, dy = e.clientY - lastPan.y;
    pan.x += dx;
    pan.y += dy;
    lastPan = { x: e.clientX, y: e.clientY };
    updatePreviewTransform();
    renderCanvas();
    e.preventDefault();
  }
});
window.addEventListener('pointerup', () => { isImgPanning = false; });
// Mouse wheel zoom (desktop)
photoPreviewWrapper.addEventListener('wheel', (e) => {
  if (!imgLoaded) return;
  e.preventDefault();
  let scale = Math.exp(-e.deltaY / 240); // smooth zoom
  let prevZoom = zoom;
  zoom = Math.max(0.1, Math.min(zoom * scale, 8));
  let rect = photoPreview.getBoundingClientRect();
  let cx = e.clientX - rect.left;
  let cy = e.clientY - rect.top;
  pan.x = (pan.x - cx) * (zoom / prevZoom) + cx;
  pan.y = (pan.y - cy) * (zoom / prevZoom) + cy;
  updatePreviewTransform();
  renderCanvas();
}, { passive: false });
// Touch pinch zoom (mobile)
let lastDist = null;
photoPreviewWrapper.addEventListener('touchmove', (e) => {
  if (e.touches.length === 2) {
    let dx = e.touches[0].clientX - e.touches[1].clientX;
    let dy = e.touches[0].clientY - e.touches[1].clientY;
    let dist = Math.sqrt(dx * dx + dy * dy);
    if (lastDist) {
      let scale = dist / lastDist;
      let prevZoom = zoom;
      zoom = Math.max(0.1, Math.min(zoom * scale, 8));
      updatePreviewTransform();
      renderCanvas();
    }
    lastDist = dist;
  }
}, { passive: false });
photoPreviewWrapper.addEventListener('touchend', () => { lastDist = null; });

function updatePreviewTransform() {
  if (!imgLoaded) return;
  photoPreview.style.transform = `translate(${pan.x}px,${pan.y}px) scale(${zoom}) rotate(${rotate}deg)`;
  if (cropActive && cropRect) updateCropBox();
}

// ======= Rendering =======
function renderCanvas() {
  let dims = getPhotoDimsPx();
  let pageDims = getPageDimsPx();
  let spacing = getSpacingPx();
  let margins = getMarginsPx();

  let np = Math.max(1, parseInt(numPhotosInput.value) || 8);
  let maxCols = Math.floor((pageDims.width - margins.left - margins.right + spacing.h) / (dims.width + spacing.h));
  maxCols = Math.max(1, maxCols);
  let maxRows = Math.floor((pageDims.height - margins.top - margins.bottom + spacing.v) / (dims.height + spacing.v));
  maxRows = Math.max(1, maxRows);
  let maxPhotos = maxCols * maxRows;
  np = Math.min(np, maxPhotos);

  let cols = Math.min(maxCols, np);
  let rows = Math.ceil(np / cols);

  // --- Auto-Center Margins ---
  if (autocenterCheck.checked) {
    let usedW = cols * dims.width + (cols - 1) * spacing.h;
    let usedH = rows * dims.height + (rows - 1) * spacing.v;
    let freeW = Math.max(0, pageDims.width - usedW);
    let freeH = Math.max(0, pageDims.height - usedH);
    margins.left = margins.right = Math.floor(freeW / 2);
    margins.top = margins.bottom = Math.floor(freeH / 2);
    marginTopInput.value = marginBottomInput.value = (unit === 'px') ? margins.top : (unit === 'mm' ? (margins.top*25.4/dpi).toFixed(2) : (margins.top/dpi).toFixed(2));
    marginLeftInput.value = marginRightInput.value = (unit === 'px') ? margins.left : (unit === 'mm' ? (margins.left*25.4/dpi).toFixed(2) : (margins.left/dpi).toFixed(2));
  }

  outputCanvas.width = pageDims.width;
  outputCanvas.height = pageDims.height;

  let ctx = outputCanvas.getContext('2d');
  ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, pageDims.width, pageDims.height);

  if (imgLoaded) {
    let imgW = imgObj.naturalWidth, imgH = imgObj.naturalHeight;
    let cropParams = getCropParams(imgW, imgH);
    let drawn = 0;
    for (let r = 0; r < rows && drawn < np; r++) {
      for (let c = 0; c < cols && drawn < np; c++, drawn++) {
        let x = margins.left + c * (dims.width + spacing.h);
        let y = margins.top + r * (dims.height + spacing.v);
        ctx.save();
        ctx.drawImage(
          imgObj,
          cropParams.sx, cropParams.sy, cropParams.sw, cropParams.sh,
          x, y, dims.width, dims.height
        );
        ctx.strokeStyle = "#2196f3";
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, dims.width, dims.height);
        ctx.setLineDash([]);
        ctx.restore();
      }
    }
  }
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
  photoWidthInput.value = 35;
  photoHeightInput.value = 45;
  customWidthInput.value = 210;
  customHeightInput.value = 297;
  hSpacingInput.value = 10;
  vSpacingInput.value = 10;
  marginTopInput.value = 10;
  marginBottomInput.value = 10;
  marginLeftInput.value = 10;
  marginRightInput.value = 10;
  renderCanvas();
}
init();
