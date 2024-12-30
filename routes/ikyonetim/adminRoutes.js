const express = require("express");
const adminController = require("../../controllers/ikyonetim/adminController");

const router = express.Router();

// Admin paneli ana sayfası
router.get("/", adminController.getAdminPanel);

module.exports = router;
