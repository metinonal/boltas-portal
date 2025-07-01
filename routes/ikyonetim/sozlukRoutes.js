const express = require("express")
const router = express.Router()
const sozlukController = require("../../controllers/ikyonetim/sozlukController")

// Routes
router.get("/", sozlukController.getSozlukList)
router.get("/add", sozlukController.getAddSozluk)
router.post("/add", sozlukController.postAddSozluk)
router.get("/edit/:id", sozlukController.getEditSozluk)
router.post("/edit/:id", sozlukController.postEditSozluk)
router.delete("/delete/:id", sozlukController.deleteSozluk)
router.post("/bulk-actions", sozlukController.bulkActions)

module.exports = router
