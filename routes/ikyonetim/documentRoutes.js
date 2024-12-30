const express = require("express");
const documentController = require("../../controllers/ikyonetim/documentController");

const router = express.Router();

// ikyonetim paneli ana sayfası
router.get("/docs-edit", documentController.getDocs);
router.get('/docs-edit/docs-add', documentController.showAddDocPage);
router.post('/docs-edit/docs-add', documentController.addDoc);
router.get('/docs-edit/docs-update/:id', documentController.showUpdateDocPage);
router.post('/docs-edit/docs-update/:id', documentController.updateDoc);
router.post('/docs-edit/docs-delete/:id', documentController.deleteDoc);


module.exports = router;
