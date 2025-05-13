const express = require("express")
const router = express.Router()
const marketplaceAdminController = require("../../controllers/ikyonetim/marketplaceAdminController")
const { authMiddleware, sessionTimeoutMiddleware } = require("../../middlewares/authMiddleware")
const requireRole = require("../../middlewares/roleMiddleware")

// Admin pazaryeri yönetim sayfası
router.get(
  "/pazaryeri",
  sessionTimeoutMiddleware,
  authMiddleware,
  requireRole("ik"),
  marketplaceAdminController.getMarketplaceAdmin,
)

// Ürün onaylama
router.post(
  "/pazaryeri/onay/:id",
  sessionTimeoutMiddleware,
  authMiddleware,
  requireRole("ik"),
  marketplaceAdminController.approveProduct,
)

// Ürün reddetme
router.post(
  "/pazaryeri/red/:id",
  sessionTimeoutMiddleware,
  authMiddleware,
  requireRole("ik"),
  marketplaceAdminController.rejectProduct,
)

// Ürün silme
router.post(
  "/pazaryeri/sil/:id",
  sessionTimeoutMiddleware,
  authMiddleware,
  requireRole("ik"),
  marketplaceAdminController.deleteProduct,
)

module.exports = router
