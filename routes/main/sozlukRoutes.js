const express = require("express")
const router = express.Router()
const sozlukController = require("../../controllers/main/sozlukController")

// Ana sözlük sayfası
router.get("/", sozlukController.getSozluk)

// Kelime arama (AJAX)
router.get("/search", sozlukController.searchSozluk)

module.exports = router