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

  const uploadArea = document.getElementById("uploadArea");
  const fileInput = document.getElementById("fileInput");
  const photoPreview = document.getElementById("photoPreview");
  const hint = document.getElementById("adjustHint");

  const cropToolBtn = document.getElementById("cropToolBtn");
  const cropBox = document.getElementById("cropBox");

  let cropActive = false;
  let uploadedImage = null;

  function updateUnitLabels() {
    const unit = unitSelect.value;
    unitLabels.forEach(label => label.textContent = unit);
    dpiContainer.style.display = unit === "px" ? "block" : "none";
  }

  unitSelect.addEventListener("change", updateUnitLabels);
  updateUnitLabels();

  pageSizeRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      customPageContainer.style.display = radio.value === "custom" ? "block" : "none";
    });
  });

  uploadArea.addEventListener("click", () => fileInput.click());

  uploadArea.addEventListener("dragover", (e) => {
    e.preventDefault();
    uploadArea.classList.add("drag-over");
  });

  uploadArea.addEventListener("dragleave", () => {
    uploadArea.classList.remove("drag-over");
  });

  uploadArea.addEventListener("drop", (e) => {
    e.preventDefault();
    uploadArea.classList.remove("drag-over");
    const files = e.dataTransfer.files;
    if (files.length) {
      handleFileUpload(files[0]);
    }
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
        photoPreview.style.transform = "";
      };
      uploadedImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  cropToolBtn.addEventListener("click", () => {
    cropActive = !cropActive;
    cropBox.style.display = cropActive ? "block" : "none";
    if (cropActive) {
      const aspectRatio = photoWidthInput.value / photoHeightInput.value;
      cropBox.style.width = "100px";
      cropBox.style.height = `${100 / aspectRatio}px`;
      cropBox.style.left = "100px";
      cropBox.style.top = "50px";
    }
  });

  // Add more code here for zoom, rotate, drag, crop, generate canvas, spacing, margins, download, etc.
});
