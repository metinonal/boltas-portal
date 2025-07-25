const express = require("express");
const router = express.Router();
const phoneController = require("../../controllers/main/phoneController");

// Bugünün menüsünü JSON olarak dönen rota
router.get("/telefon-rehberi", phoneController.getPhoneDirectory);
router.post('/send-vcf', phoneController.sendVcf)

module.exports = router;

