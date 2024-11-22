const express = require("express");
const router = express.Router();
const menuController = require("../../controllers/main/menuController");

// Bugünün menüsünü JSON olarak dönen rota
router.get("/today-menu", menuController.getTodayMenu);
router.get("/yemek-listesi", menuController.getAllMenus);


module.exports = router;

