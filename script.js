
let uploadedImage = null;
let canvas = document.getElementById('previewCanvas');
let ctx = canvas.getContext('2d');

document.getElementById('photoUpload').addEventListener('change', function(e) {
  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      uploadedImage = img;
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(e.target.files[0]);
});

document.getElementById('removeBg').addEventListener('click', async () => {
  const fileInput = document.getElementById("photoUpload");
  if (!fileInput.files[0]) return alert("Upload a photo first.");

  const formData = new FormData();
  formData.append("image", fileInput.files[0]);

  const response = await fetch("/remove-bg", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    alert("Failed to remove background");
    return;
  }

  const blob = await response.blob();
  const img = new Image();
  img.onload = function () {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    uploadedImage = img;
  };
  img.src = URL.createObjectURL(blob);
});

function convertToPixels(value, unit) {
  if (unit === "mm") return value * 3.7795275591;
  if (unit === "in") return value * 96;
  return value;
}

function generateLayout() {
  const unit = document.getElementById('unitSelect').value;
  const width = convertToPixels(parseFloat(document.getElementById('widthInput').value), unit);
  const height = convertToPixels(parseFloat(document.getElementById('heightInput').value), unit);
  const paper = document.getElementById('paperSize').value;

  const paperSizes = {
    "A4": [210 * 3.78, 297 * 3.78],
    "4x6": [4 * 96, 6 * 96],
    "5x7": [5 * 96, 7 * 96],
    "Letter": [8.5 * 96, 11 * 96]
  };

  const [pW, pH] = paperSizes[paper];
  canvas.width = pW;
  canvas.height = pH;
  ctx.clearRect(0, 0, pW, pH);

  if (!uploadedImage) {
    alert("Please upload an image first!");
    return;
  }

  let x = 0, y = 0;
  while (y + height <= pH) {
    x = 0;
    while (x + width <= pW) {
      ctx.drawImage(uploadedImage, x, y, width, height);
      x += width + 10;
    }
    y += height + 10;
  }
}

function downloadLayout() {
  const link = document.createElement('a');
  link.download = 'passport_photos.png';
  link.href = canvas.toDataURL();
  link.click();
}
