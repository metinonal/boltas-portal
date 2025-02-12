const express = require("express");
const bilgiBankasiController = require("../../controllers/ikyonetim/bilgiBankasiController");
const upload = require('../../middlewares/upload');

const router = express.Router();

// ikyonetim paneli ana sayfası
router.get("/bilgi-edit", bilgiBankasiController.getBilgi);
router.get("/bilgi-edit/bilgi-add", bilgiBankasiController.bilgiAddPage);
router.post("/bilgi-edit/bilgi-add", upload.single('image'), bilgiBankasiController.bilgiAdd);

module.exports = router;
