const menuController = require("./menuController");
const axios = require('axios');
const xml2js = require('xml2js');
const { getDb } = require('../../data/db'); // MongoClient bağlantısını içe aktar
const { ObjectId } = require('mongodb');

exports.indexPage = async (req, res) => {
    try {
        // Bugünün menüsünü veri işleyici fonksiyonla al
        const todayMenu = menuController.getTodayMenuData();

        // TCMB döviz kurları API'sine istek yap
        const response = await axios.get('https://www.tcmb.gov.tr/kurlar/today.xml');

        // XML verisini JSON'a çevir
        xml2js.parseString(response.data, async (err, result) => {
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

            try {
                // MongoDB bağlantısını al
                const db = getDb();
                if (!db) {
                    throw new Error("Veritabanı bağlantısı kurulamadı.");
                }

                // Slider verilerini al ve isMain değeri true olanları en üste getir
                const sliders = await db.collection('sliders').find().sort({ isMain: -1 }).toArray();

                // Ana sayfa görünümüne döviz kurları, bugünün menüsü ve slider verilerini gönder
                res.render('main/index', { todayMenu, currencies, sliders });
            } catch (sliderError) {
                console.error('Slider verileri alınırken hata oluştu:', sliderError);
                res.status(500).send('Slider verileri alınırken bir sorun oluştu.');
            }
        });
    } catch (err) {
        console.error('API çağrısı sırasında hata oluştu:', err);
        res.status(500).send('Ana sayfada bir sorun var.');
    }
};
