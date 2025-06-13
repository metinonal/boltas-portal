const express = require("express");
const router = express.Router();
const menuController = require("../../controllers/main/menuController");

// 📅 Bugünkü menüyü JSON olarak döner (lokasyon parametresi ile)
router.get("/today-menu", menuController.getTodayMenu);

// 📃 Tüm menüleri EJS olarak döner (lokasyon parametresi ile)
router.get("/yemek-listesi", menuController.getAllMenus);

module.exports = router;
