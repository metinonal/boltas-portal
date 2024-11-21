// services/main/currencyService.js
const axios = require('axios');
const xml2js = require('xml2js');

const getExchangeRates = async () => {
    try {
        const response = await axios.get('https://www.tcmb.gov.tr/kurlar/today.xml');
        const xmlData = response.data;

        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(xmlData);

        const currencies = result.Tarih_Date.Currency;
        const rates = {};

        currencies.forEach(currency => {
            const code = currency.$.CurrencyCode;
            const forexSelling = currency.ForexSelling;
            if (forexSelling) {
                rates[code] = parseFloat(forexSelling).toFixed(2);
            }
        });

        return rates;
    } catch (error) {
        console.error('Döviz kurları alınırken hata oluştu:', error);
        throw new Error('Döviz kurları alınamadı.');
    }
};

module.exports = { getExchangeRates };
