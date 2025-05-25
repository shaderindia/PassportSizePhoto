const express = require("express");
const multer = require("multer");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");

const app = express();
const upload = multer({ dest: "uploads/" });

app.use(express.static("public"));

app.post("/remove-bg", upload.single("image"), async (req, res) => {
  const formData = new FormData();
  formData.append("image_file", fs.createReadStream(req.file.path));
  formData.append("size", "auto");

  try {
    const response = await axios({
      method: "post",
      url: "https://api.remove.bg/v1.0/removebg",
      data: formData,
      responseType: "arraybuffer",
      headers: {
        ...formData.getHeaders(),
        "X-Api-Key": "YOUR_REMOVE_BG_API_KEY"
      },
    });

    fs.unlinkSync(req.file.path);
    res.set("Content-Type", "image/png");
    res.send(response.data);
  } catch (error) {
    console.error("Error removing background:", error);
    res.status(500).send("Failed to remove background");
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
