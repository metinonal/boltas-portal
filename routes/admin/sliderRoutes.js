const express = require("express");
const sliderController = require("../../controllers/admin/sliderController");
const upload = require('../../middlewares/upload');


const router = express.Router();

// Admin paneli ana sayfası
router.get("/slider-edit", sliderController.sliderEditPage);
router.get("/slider-edit/slider-update/:id", sliderController.showUpdateSliderPage);
router.post("/slider-edit/slider-update/:id", upload.single('image'), sliderController.updateSlider);
router.post("/slider-edit/slider-delete/:id", sliderController.deleteSlider);
router.get("/slider-edit/slider-add", sliderController.sliderAddPage);
router.post("/slider-edit/slider-add", upload.single('image'), sliderController.sliderAdd);

module.exports = router;
