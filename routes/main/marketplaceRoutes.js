const express = require("express")
const router = express.Router()
const marketplaceController = require("../../controllers/main/marketplaceController")
const { authMiddleware, sessionTimeoutMiddleware } = require("../../middlewares/authMiddleware")
const upload = require("../../middlewares/upload")

// Pazaryeri ana sayfası - tüm onaylı ürünleri göster
router.get("/", marketplaceController.getAllProducts)

// Pazaryeri şartlarını kabul etme
router.post("/sartlari-kabul-et", sessionTimeoutMiddleware, authMiddleware, marketplaceController.acceptTerms)

// Ürün detay sayfası
router.get("/urun/:id", marketplaceController.getProductDetail)

// Ürün ekleme sayfası (sadece giriş yapmış kullanıcılar)
router.get("/urun-ekle", sessionTimeoutMiddleware, authMiddleware, marketplaceController.getAddProductPage)

// Ürün ekleme işlemi (sadece giriş yapmış kullanıcılar)
router.post(
  "/urun-ekle",
  sessionTimeoutMiddleware,
  authMiddleware,
  upload.array("images", 10),
  marketplaceController.addProduct,
)

// Kullanıcının kendi ürünlerini görüntüleme
router.get("/urunlerim", sessionTimeoutMiddleware, authMiddleware, marketplaceController.getUserProducts)

// Kullanıcının kendi ürününü silme
router.post("/urun-sil/:id", sessionTimeoutMiddleware, authMiddleware, marketplaceController.deleteUserProduct)

// Ürünü satıldı olarak işaretleme
router.post("/urun-satildi/:id", sessionTimeoutMiddleware, authMiddleware, marketplaceController.toggleSold)

// Favorilere ekleme/çıkarma
router.post("/favorilere-ekle/:id", sessionTimeoutMiddleware, authMiddleware, marketplaceController.addToFavorites)
router.post(
  "/favorilerden-cikar/:id",
  sessionTimeoutMiddleware,
  authMiddleware,
  marketplaceController.removeFromFavorites,
)

// Favori ürünleri görüntüleme
router.get("/favorilerim", sessionTimeoutMiddleware, authMiddleware, marketplaceController.getFavorites)

// Kategori filtreleme
router.get("/kategori/:category", marketplaceController.getProductsByCategory)

// YENİ: Ürün düzenleme sayfası
router.get("/urun-duzenle/:id", authMiddleware, marketplaceController.getEditProductPage)

// YENİ: Ürün düzenleme işlemi
router.post("/urun-duzenle/:id", authMiddleware, upload.array("images", 10), marketplaceController.updateProduct)

module.exports = router
