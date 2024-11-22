const express = require("express");
const adminController = require("../../controllers/admin/adminController");

const router = express.Router();

// Admin paneli ana sayfası
router.get("/", adminController.getAdminPanel);

module.exports = router;
