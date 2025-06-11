const express = require("express")
const router = express.Router()
const userController = require("../../controllers/ikyonetim/userController")
const { authMiddleware, sessionTimeoutMiddleware } = require("../../middlewares/authMiddleware")
const requireRole = require("../../middlewares/roleMiddleware")

// Kullanıcı yönetimi sayfası
router.get(
  "/kullanici-yonetimi",
  sessionTimeoutMiddleware,
  authMiddleware,
  requireRole("ik"),
  userController.getUserManagement,
)

// Kullanıcıları getir
router.get("/kullanicilar", sessionTimeoutMiddleware, authMiddleware, requireRole("ik"), userController.getUsers)

// Kullanıcı yetki güncelle
router.post(
  "/kullanici-yetki-guncelle",
  sessionTimeoutMiddleware,
  authMiddleware,
  requireRole("ik"),
  userController.updateUserRole,
)

module.exports = router
