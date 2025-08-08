const express = require("express")
const router = express.Router()
const dahiliRaporController = require("../../controllers/ikyonetim/dahiliRaporController")
const { authMiddleware, sessionTimeoutMiddleware } = require("../../middlewares/authMiddleware")
const requireRole = require("../../middlewares/roleMiddleware")

// Dahili rapor ana sayfası
router.get("/dahili-rapor", sessionTimeoutMiddleware, authMiddleware, requireRole("ik"), dahiliRaporController.getDahiliRaporPage)

// API'den veri çekme
router.post("/dahili-rapor/veri-cek", sessionTimeoutMiddleware, authMiddleware, requireRole("ik"), dahiliRaporController.getReportData)

// Excel indirme
router.post("/dahili-rapor/excel-indir", sessionTimeoutMiddleware, authMiddleware, requireRole("ik"), dahiliRaporController.downloadExcel)

module.exports = router
