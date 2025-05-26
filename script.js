// This is the full, advanced logic as per your requirements.
document.addEventListener('DOMContentLoaded', function () {
  // ==== Element References ====
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
  const showCutlinesCheck = document.getElementById('show-cutlines');
  const photoUploadInput = document.getElementById('photo-upload');
  const photoPreviewContainer = document.getElementById('preview-section');
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

  // ==== State ====
  let unit = 'mm';
  let dpi = 300;
  let pageSize = 'a4';
  let imgObj = new window.Image();
  let imgLoaded = false;
  let imgURL = null;
  let zoom = 1.0, rotate = 0, pan = { x: 0, y: 0 };
  let cropActive = false, cropRect = null;

  // ==== Unit Conversion ====
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
    photoWidthInput.value = +convert(+photoWidthInput.value, oldUnit, newUnit).toFixed(2);
    photoHeightInput.value = +convert(+photoHeightInput.value, oldUnit, newUnit).toFixed(2);
    customWidthInput.value = +convert(+customWidthInput.value, oldUnit, newUnit).toFixed(2);
    customHeightInput.value = +convert(+customHeightInput.value, oldUnit, newUnit).toFixed(2);
    hSpacingInput.value = +convert(+hSpacingInput.value, oldUnit, newUnit).toFixed(2);
    vSpacingInput.value = +convert(+vSpacingInput.value, oldUnit, newUnit).toFixed(2);
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

  // ==== UI Event Handlers ====
  unitSelect.addEventListener('change', () => {
    let oldUnit = unit;
    unit = unitSelect.value;
    if (unit === "px") {
      photoWidthInput.value = 300;
      photoHeightInput.value = 400;
    } else {
      photoWidthInput.value = 35;
      photoHeightInput.value = 45;
    }
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
  if (showCutlinesCheck) showCutlinesCheck.addEventListener('change', renderCanvas);

  // ==== Photo Upload ====
  photoUploadInput.addEventListener('change', (e) => {
    if (photoUploadInput.files && photoUploadInput.files[0]) {
      let file = photoUploadInput.files[0];
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file!');
        return;
      }
      if (imgURL) URL.revokeObjectURL(imgURL);
      imgURL = URL.createObjectURL(file);
      imgObj = new window.Image();
      imgObj.onload = function () {
        imgLoaded = true;
        photoPreviewContainer.classList.remove('hidden');
        photoPreview.src = imgURL;
        zoom = 1.0;
        rotate = 0;
        pan = { x: 0, y: 0 };
        cropRect = null;
        cropActive = false;
        cropBox.classList.add('hidden');
        showCropUI(false);
        updatePreviewTransform();
        renderCanvas();
      };
      imgObj.src = imgURL;
    }
  });

  // ==== Preview Pan & Zoom ====
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
  photoPreviewWrapper.addEventListener('wheel', (e) => {
    if (!imgLoaded) return;
    e.preventDefault();
    let scale = Math.exp(-e.deltaY / 240);
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

  // ==== Crop UI (as before, omitted for brevity; see previous answers) ====
  // ... cropping logic (crop toggle, drag, resize, etc.) same as before ...

  // ==== Download/Share (as before, omitted for brevity) ====
  // ... download/share code as in your working script ...

  // ==== Init ====
  function setDefaultMargins() {
    marginTopInput.value = 10;
    marginBottomInput.value = 10;
    marginLeftInput.value = 10;
    marginRightInput.value = 10;
  }
  function init() {
    if (unitSelect.value === "px") {
      photoWidthInput.value = 300;
      photoHeightInput.value = 400;
    } else {
      photoWidthInput.value = 35;
      photoHeightInput.value = 45;
    }
    customWidthInput.value = 210;
    customHeightInput.value = 297;
    hSpacingInput.value = 10;
    vSpacingInput.value = 10;
    setDefaultMargins();
    autocenterCheck.checked = false; // Auto margin OFF by default
    if (showCutlinesCheck) showCutlinesCheck.checked = true; // Chain dot line ON by default
    renderCanvas();
  }
  init();

  // ==== Render Output Sheet (with all required fixes) ====
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

    // Only do auto margin if user requests and it FITS
    if (autocenterCheck.checked && np <= maxCols * maxRows) {
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

    // Chain dot line ON/OFF
    let showCutlines = showCutlinesCheck ? showCutlinesCheck.checked : true;
    if (showCutlines) {
      ctx.save();
      ctx.strokeStyle = "#e57300";
      ctx.setLineDash([5, 7]);
      ctx.lineWidth = 1.1;
      // Verticals (between columns)
      for (let c = 1; c < cols; c++) {
        let x = margins.left + c * dims.width + (c - 1) * spacing.h + spacing.h / 2;
        ctx.beginPath();
        ctx.moveTo(x, margins.top);
        ctx.lineTo(x, pageDims.height - margins.bottom);
        ctx.stroke();
      }
      // Horizontals (between rows)
      for (let r = 1; r < rows; r++) {
        let y = margins.top + r * dims.height + (r - 1) * spacing.v + spacing.v / 2;
        ctx.beginPath();
        ctx.moveTo(margins.left, y);
        ctx.lineTo(pageDims.width - margins.right, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Draw photos with thin black border on all four sides
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
          // Thin black border (all four sides)
          ctx.save();
          ctx.strokeStyle = "#111";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([]);
          ctx.strokeRect(x, y, dims.width, dims.height);
          ctx.restore();
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

  // ==== Crop and Download code remains unchanged ====
  // ... (Crop/Download/Share code as before) ...
});
