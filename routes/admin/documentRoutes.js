const express = require("express");
const documentController = require("../../controllers/admin/documentController");

const router = express.Router();

// Admin paneli ana sayfası
router.get("/docs-edit", documentController.getDocs);
router.get('/docs-edit/docs-add', documentController.showAddDocPage);
router.post('/docs-edit/docs-add', documentController.addDoc);
router.get('/docs-edit/docs-update/:id', documentController.showUpdateDocPage);
router.post('/docs-edit/docs-update/:id', documentController.updateDoc);
router.get('/docs-edit/docs-delete/:id', documentController.deleteDoc);


module.exports = router;
