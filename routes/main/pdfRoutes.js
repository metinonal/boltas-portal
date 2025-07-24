const express = require("express")
const router = express.Router()
const pdfController = require("../../controllers/main/pdfController")
const upload = require("../../middlewares/upload")

// PDF araçları ana sayfası
router.get("/", pdfController.index)

// PDF ayırma
router.get("/pdf-ayir", pdfController.pdfAyir)
router.post("/api/pdf-ayir", upload.single("pdfFile"), pdfController.apiPdfAyir)

// PDF birleştirme
router.get("/pdf-birlestir", pdfController.pdfBirlestir)
router.post("/api/pdf-birlestir", upload.array("pdfFiles"), pdfController.apiPdfBirlestir)

// PDF sıkıştırma
router.get("/pdf-sikistir", pdfController.pdfSikistir)
router.post("/api/pdf-sikistir", upload.single("pdfFile"), pdfController.apiPdfSikistir)

// PDF'ten resim çıkarma
router.get("/pdf-resim-cikar", pdfController.pdfResimCikar)
router.post("/api/pdf-resim-cikar", upload.single("pdfFile"), pdfController.apiPdfResimCikar)

// Resimden PDF oluşturma
router.get("/resim-pdf", pdfController.resimPdf)
router.post("/api/resim-pdf", upload.array("imageFiles"), pdfController.apiResimPdf)

// PDF döndürme
router.get("/pdf-dondur", pdfController.pdfDondur)
router.post("/api/pdf-dondur", upload.single("pdfFile"), pdfController.apiPdfDondur)

// Word'den PDF
router.get("/word-pdf", pdfController.wordPdf)
router.post("/api/word-pdf", upload.single("wordFile"), pdfController.apiWordPdf)

// Excel'den PDF
router.get("/excel-pdf", pdfController.excelPdf)
router.post("/api/excel-pdf", upload.single("excelFile"), pdfController.apiExcelPdf)

// HTML'den PDF
router.get("/html-pdf", pdfController.htmlPdf)
router.post("/api/html-pdf", upload.single("htmlFile"), pdfController.apiHtmlPdf)
router.post("/api/html-url-pdf", pdfController.apiHtmlUrlPdf)
router.post("/api/html-code-pdf", pdfController.apiHtmlCodePdf)

module.exports = router
