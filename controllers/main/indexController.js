const menuController = require("./menuController");
const axios = require('axios');
const xml2js = require('xml2js');

exports.indexPage = async (req, res) => {
    try {
      // Bugünün menüsünü veri işleyici fonksiyonla al
      const todayMenu = menuController.getTodayMenuData();
  
      // TCMB döviz kurları API'sine istek yap
      const response = await axios.get('https://www.tcmb.gov.tr/kurlar/today.xml');
  
      // XML verisini JSON'a çevir
      xml2js.parseString(response.data, (err, result) => {
        if (err) {
          console.error('XML parse hatası:', err);
          return res.status(500).send('Veri işlenirken hata oluştu.');
        }
  
        // Döviz kurlarını çek
        const currencies = result.Tarih_Date.Currency.map((item) => ({
          currencyCode: item.$.CurrencyCode,
          currencyName: item.Isim[0],
          forexBuying: item.ForexBuying ? item.ForexBuying[0] : 'N/A',
          forexSelling: item.ForexSelling ? item.ForexSelling[0] : 'N/A',
        }));
  
        // Ana sayfa görünümüne döviz kurları ve bugünün menüsünü gönder
        res.render('main/index', { todayMenu, currencies });
      });
    } catch (err) {
      console.error('API çağrısı sırasında hata oluştu:', err);
      res.status(500).send('Ana sayfada bir sorun var.');
    }
  };