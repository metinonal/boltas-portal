const express = require("express")
const router = express.Router()
const pdfController = require("../../controllers/main/pdfController")

// PDF araçları ana sayfası
router.get("/", pdfController.index)

// PDF ayırma sayfası
router.get("/pdf-ayir", pdfController.pdfAyir)

// PDF birleştirme sayfası
router.get("/pdf-birlestir", pdfController.pdfBirlestir)

module.exports = router;
