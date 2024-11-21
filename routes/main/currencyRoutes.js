// routes/main/currencyRoutes.js
const express = require('express');
const router = express.Router();
const { showExchangeRates } = require('../../controllers/main/currencyController');

router.get('/', showExchangeRates);

module.exports = router;
