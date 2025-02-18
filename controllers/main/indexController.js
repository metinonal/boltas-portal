const menuController = require("./menuController");
const axios = require('axios');
const xml2js = require('xml2js');
const sql = require('mssql');
const Slider = require('../../models/Slider');
const Docs = require('../../models/Doc');

const config = {
    user: 'userportal',
    password: 'Portal2025.!',
    server: '192.168.200.23',
    database: 'EntegrasyonDB',
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
};

exports.indexPage = async (req, res) => {
    try {
        const todayMenu = menuController.getTodayMenuData();

        await sql.connect(config);


        // aslı

        
        const birthdayResult = await sql.query(`
            DECLARE @tarih DATE = GETDATE();
            SELECT * 
            FROM [vHROrganizationFromOrtakIK_Sorwe] 
            WHERE MONTH(@tarih) = MONTH(DogumTarihi) 
              AND DAY(@tarih) = DAY(DogumTarihi) 
              AND YakaRengi = 'Beyaz';
        `);


            // test ortamı


        // const birthdayResult = await sql.query(`
        //     SELECT * 
        //     FROM [vHROrganizationFromOrtakIK_Sorwe] 
        //     WHERE SicilNo IN ('1458','2226');
        // `);
        
        const birthdays = birthdayResult.recordset;

        const response = await axios.get('https://www.tcmb.gov.tr/kurlar/today.xml');

        xml2js.parseString(response.data, async (err, result) => {
            if (err) {
                console.error('XML parse hatası:', err);
                return res.status(500).send('Veri işlenirken hata oluştu.');
            }

            const currencies = result.Tarih_Date.Currency.map((item) => ({
                currencyCode: item.$.CurrencyCode,
                currencyName: item.Isim[0],
                forexBuying: item.ForexBuying ? item.ForexBuying[0] : 'N/A',
                forexSelling: item.ForexSelling ? item.ForexSelling[0] : 'N/A',
            }));

            try {
                const sliders = await Slider.find().sort({ count: 1 });
                const docs = await Docs.find();

                res.render('main/index', {
                    todayMenu,
                    currencies,
                    sliders,
                    docs,
                    birthdays,
                });
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
