// script.js

document.addEventListener("DOMContentLoaded", () => {
  const unitSelect = document.getElementById("unitSelect");
  const dpiContainer = document.getElementById("dpiContainer");
  const dpiInput = document.getElementById("dpi");
  const photoWidthInput = document.getElementById("photoWidth");
  const photoHeightInput = document.getElementById("photoHeight");
  const unitLabels = document.querySelectorAll(".unit-label");

  const pageSizeRadios = document.querySelectorAll("input[name='pageSize']");
  const customPageContainer = document.getElementById("customPageContainer");
  const customPageWidthInput = document.getElementById("customPageWidth");
  const customPageHeightInput = document.getElementById("customPageHeight");

  const fileInput = document.getElementById("fileInput");
  const photoPreview = document.getElementById("photoPreview");
  const hint = document.getElementById("adjustHint");

  const cropToolBtn = document.getElementById("cropToolBtn");
  const cropBox = document.getElementById("cropBox");

  const hSpacingSlider = document.getElementById("horizontalSpacing");
  const vSpacingSlider = document.getElementById("verticalSpacing");
  const hSpacingLabel = document.getElementById("horizontalSpacingValue");
  const vSpacingLabel = document.getElementById("verticalSpacingValue");

  const zoomInBtn = document.getElementById("zoomInBtn");
  const zoomOutBtn = document.getElementById("zoomOutBtn");
  const rotateLeftBtn = document.getElementById("rotateLeftBtn");
  const rotateRightBtn = document.getElementById("rotateRightBtn");

  let cropActive = false;
  let uploadedImage = null;
  let scale = 1;
  let rotation = 0;

  function updateUnitLabels() {
    const unit = unitSelect.value;
    unitLabels.forEach(label => label.textContent = unit);
    dpiContainer.style.display = unit === "px" ? "block" : "none";
    updateSpacingLabels();
  }

  function updateSpacingLabels() {
    const unit = unitSelect.value;
    hSpacingLabel.textContent = `${hSpacingSlider.value} ${unit}`;
    vSpacingLabel.textContent = `${vSpacingSlider.value} ${unit}`;
  }

  unitSelect.addEventListener("change", updateUnitLabels);
  updateUnitLabels();

  pageSizeRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      customPageContainer.style.display = radio.value === "custom" ? "block" : "none";
    });
  });

  fileInput.addEventListener("change", () => {
    if (fileInput.files.length) {
      handleFileUpload(fileInput.files[0]);
    }
  });

  function handleFileUpload(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedImage = new Image();
      uploadedImage.onload = () => {
        photoPreview.src = uploadedImage.src;
        hint.classList.remove("hidden");
        resetTransforms();
      };
      uploadedImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function resetTransforms() {
    scale = 1;
    rotation = 0;
    updateTransforms();
  }

  function updateTransforms() {
    photoPreview.style.transform = `scale(${scale}) rotate(${rotation}deg)`;
  }

  cropToolBtn.addEventListener("click", () => {
    cropActive = !cropActive;
    cropBox.style.display = cropActive ? "block" : "none";
    photoPreview.style.pointerEvents = cropActive ? "none" : "auto";
    if (cropActive) {
      const aspectRatio = photoWidthInput.value / photoHeightInput.value;
      cropBox.style.width = "100px";
      cropBox.style.height = `${100 / aspectRatio}px`;
      cropBox.style.left = "100px";
      cropBox.style.top = "50px";
    }
  });

  zoomInBtn.addEventListener("click", () => {
    scale += 0.1;
    updateTransforms();
  });

  zoomOutBtn.addEventListener("click", () => {
    scale = Math.max(0.1, scale - 0.1);
    updateTransforms();
  });

  rotateLeftBtn.addEventListener("click", () => {
    rotation -= 90;
    updateTransforms();
  });

  rotateRightBtn.addEventListener("click", () => {
    rotation += 90;
    updateTransforms();
  });

  hSpacingSlider.addEventListener("input", updateSpacingLabels);
  vSpacingSlider.addEventListener("input", updateSpacingLabels);

  // Additional logic for generating final canvas, cropping and download will follow.
});
