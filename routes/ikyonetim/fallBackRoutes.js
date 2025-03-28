const express = require('express');
const router = express.Router();

const { sessionTimeoutMiddleware, authMiddleware } = require('../../middlewares/main/authMiddleware');
const requireRole = require('../../middlewares/main/roleMiddleware');

// Bu route sadece /ikyonetim altında tanımlı olmayan yolları yakalar
router.all('*', sessionTimeoutMiddleware, authMiddleware, requireRole('ik'), (req, res) => {
  res.status(404).send('Sayfa bulunamadı ama erişim yetkin vardı.');
});

module.exports = router;
