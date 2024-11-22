const express = require("express");
const router = express.Router();
const indexController = require("../../controllers/main/indexController");

router.get("/", indexController.indexPage);

module.exports = router;
