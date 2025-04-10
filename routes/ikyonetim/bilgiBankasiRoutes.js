const express = require("express");
const bilgiBankasiController = require("../../controllers/ikyonetim/bilgiBankasiController");

const router = express.Router();

// Bilgi Bankası Yönetimi
router.get("/bilgi-edit", bilgiBankasiController.getBilgi);

// Yeni bilgi ekleme sayfası gösterme
router.get("/bilgi-edit/bilgi-add", bilgiBankasiController.bilgiAddPage);

// Yeni bilgi ekleme işlemi
router.post("/bilgi-edit/bilgi-add", bilgiBankasiController.bilgiAdd);

// Güncelleme formunu gösterme
router.get("/bilgi-edit/bilgi-update/:id", bilgiBankasiController.bilgiUpdatePage);

// Bilgi güncelleme işlemi
router.post("/bilgi-edit/bilgi-update/:id", bilgiBankasiController.bilgiUpdate);

// Bilgi silme işlemi
router.post("/bilgi-edit/bilgi-delete/:id", bilgiBankasiController.bilgiDelete);

module.exports = router;
