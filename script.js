// ... previous code up to arrangement/crop logic remains unchanged ...

// ======= Multi-Page Navigation =======
const pages = [
    document.getElementById("page-1"),
    document.getElementById("page-2"),
    document.getElementById("page-3"),
    document.getElementById("page-4"),
];
const prevBtn = document.getElementById("prev-page");
const nextBtn = document.getElementById("next-page");
let pageIdx = 0;

function showPage(idx) {
    pages.forEach((page, i) => {
        page.classList.toggle("hidden", i !== idx);
    });
    prevBtn.classList.toggle("hidden", idx === 0);
    nextBtn.classList.toggle("hidden", idx === pages.length - 1);
}
prevBtn.addEventListener("click", () => {
    if (pageIdx > 0) pageIdx--;
    showPage(pageIdx);
});
nextBtn.addEventListener("click", () => {
    if (pageIdx < pages.length - 1) pageIdx++;
    showPage(pageIdx);
});
showPage(pageIdx);

// ==== Arrangement Calculation with Correct Fit ====
function renderCanvas() {
    let dims = getPhotoDimsPx();
    let pageDims = getPageDimsPx();
    let spacing = getSpacingPx();
    let margins = getMarginsPx();

    // Maximize columns first (fill left to right, then top to bottom)
    let maxCols = Math.floor((pageDims.width - margins.left - margins.right + spacing.h) / (dims.width + spacing.h));
    maxCols = Math.max(1, maxCols);
    let maxRows = Math.floor((pageDims.height - margins.top - margins.bottom + spacing.v) / (dims.height + spacing.v));
    maxRows = Math.max(1, maxRows);
    let maxPhotos = maxCols * maxRows;
    let np = Math.max(1, Math.min(parseInt(numPhotosInput.value) || 8, maxPhotos));

    let cols = Math.min(maxCols, np);
    let rows = Math.ceil(np / cols);

    // Auto spacing/margin
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
    ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
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

// ======= Crop Box: Drag to Move + Resize =======
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

let cropDragMode = null; // 'move' or one of 'nw','n','ne','e','se','s','sw','w'
let cropStartMouse = null;
let cropStartRect = null;

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
function attachCropListeners() {
    cropBox.addEventListener('mousedown', cropPointerDown);
    cropBox.addEventListener('touchstart', cropPointerDown, { passive: false });
    window.addEventListener('mousemove', cropPointerMove);
    window.addEventListener('touchmove', cropPointerMove, { passive: false });
    window.addEventListener('mouseup', cropPointerUp);
    window.addEventListener('touchend', cropPointerUp);
}
attachCropListeners();

// ==== The rest of your code (including preview, download, share, etc) remains unchanged ====
