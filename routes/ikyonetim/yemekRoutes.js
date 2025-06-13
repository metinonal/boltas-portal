const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const yemekController = require("../../controllers/ikyonetim/yemekController");

const router = express.Router();

// Dinamik klasöre göre multer ayarı
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let subfolder = "default";

        if (req.originalUrl.includes("istanbul")) {
            subfolder = "istanbul";
        } else if (req.originalUrl.includes("dilovasi")) {
            subfolder = "dilovasi";
        }

        const uploadPath = path.join(__dirname, `../../public/menu-imgs/${subfolder}`);

        // Klasör yoksa oluştur
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueName + ext);
    }
});

const upload = multer({ storage });

// Yemek listesi yönetimi
router.get("/yemek-listesi", yemekController.getYemekListesiPanel);
router.post("/yemek-listesi-istanbul", upload.single("yemekDosyasiIstanbul"), yemekController.uploadIstanbulExcel);
router.post("/yemek-listesi-dilovasi", upload.single("yemekDosyasiDilovasi"), yemekController.uploadDilovasiExcel);

module.exports = router;
