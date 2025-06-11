const express = require("express")
const router = express.Router()
const adminController = require("../../controllers/ikyonetim/adminController")
const { authMiddleware, sessionTimeoutMiddleware } = require("../../middlewares/authMiddleware")
const requireRole = require("../../middlewares/roleMiddleware")

// Admin paneli ana sayfası
router.get("/", sessionTimeoutMiddleware, authMiddleware, requireRole("ik"), adminController.getAdminPanel)

// Ayar güncelleme
router.post(
  "/ayar-guncelle",
  sessionTimeoutMiddleware,
  authMiddleware,
  requireRole("ik"),
  adminController.updateSetting,
)

module.exports = router
