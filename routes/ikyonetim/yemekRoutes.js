const express = require("express");
const multer = require("multer");
const yemekController = require("../../controllers/ikyonetim/yemekController");

const router = express.Router();
const upload = multer({ dest: "public/menu-imgs/" }); // Yükleme klasörü

// Yemek listesi yönetimi
router.get("/yemek-listesi", yemekController.getYemekListesiPanel); // Yemek listesi görünümü
router.post("/yemek-listesi", upload.single("yemekDosyasi"), yemekController.uploadExcel); // Excel dosyası yükleme

module.exports = router;
