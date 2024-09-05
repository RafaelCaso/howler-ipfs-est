const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

const app = express();

app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.post("/upload", upload.single("file"), (req, res) => {
  if (req.file) {
    res.json({
      success: true,
      fileUrl: `http://localhost:5000/uploads/${req.file.filename}`,
    });
  } else {
    res.status(400).json({ success: false, message: "no file uploaded" });
  }
});

app.get("/files", (req, res) => {
  const fs = require("fs");
  const path = require("path");

  const uploadsDir = path.join(__dirname, "uploads");

  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      res.status(500).json({ success: false, message: "Unable to read files" });
    } else {
      const fileUrls = files.map(
        (file) => `http://localhost:5000/uploads/${file}`
      );
      res.json({ success: true, files: fileUrls });
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`app running on http://localhost:${PORT}`);
});
