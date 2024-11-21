// controllers/main/currencyController.js
const { getExchangeRates } = require('../../services/main/currencyService');

const showExchangeRates = async (req, res) => {
    try {
        const rates = await getExchangeRates();
        res.render('main/index', { rates });
    } catch (error) {
        console.error('Döviz kurları alınırken hata oluştu:', error);
        res.status(500).send('Döviz kurları alınamadı.');
    }
};

module.exports = { showExchangeRates };
