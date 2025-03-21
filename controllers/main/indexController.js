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

const connectToDatabase = async () => {
    let connected = false;
    const maxRetries = 50; // Maksimum deneme sayısı
    let attempt = 0;

    while (!connected && attempt < maxRetries) {
        try {
            await sql.connect(config);
            connected = true;
        } catch (error) {
            attempt++;
            console.log(`Bağlantı denemesi ${attempt} başarısız. Yeniden deneniyor...`);
            if (attempt === maxRetries) {
                throw new Error('Veritabanı bağlantısı sağlanamadı.');
            }
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 saniye bekle
        }
    }
};

exports.indexPage = async (req, res) => {
    try {
        const todayMenu = menuController.getTodayMenuData();

        // Veritabanına bağlan
        await connectToDatabase();

        // ✅ Doğum günü verisini çek
        const birthdayResult = await sql.query(`
            DECLARE @tarih DATE = GETDATE();
            SELECT *
            FROM [vHROrganizationFromOrtakIK_ALL]
            WHERE MONTH(@tarih) = MONTH(DogumTarihi)
              AND DAY(@tarih) = DAY(DogumTarihi)
              AND CEMP_ENDDATE is null;
        `);

        const birthdays = birthdayResult.recordset;

        // ✅ Son 7 gün içinde işe girenleri çek
        const newHiresResult = await sql.query(`
            SELECT * 
            FROM [vHROrganizationFromOrtakIK_ALL]
            WHERE IsYeriGirisTarihi >= DATEADD(DAY, -7, GETDATE())
              AND IsYeriGirisTarihi <= GETDATE();
        `);

        const newHires = newHiresResult.recordset;

        // ✅ Son 7 gün içinde işten ayrılanları çek
        const leaversResult = await sql.query(`
            SELECT * 
            FROM [vHROrganizationFromOrtakIK_ALL]
            WHERE CEMP_ENDDATE >= DATEADD(DAY, -7, GETDATE())
              AND CEMP_ENDDATE <= GETDATE();
        `);

        const leavers = leaversResult.recordset;

        // ✅ Döviz bilgilerini çek
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

                // ✅ Verileri index.ejs sayfasına gönder
                res.render('main/index', {
                    todayMenu,
                    currencies,
                    sliders,
                    docs,
                    birthdays,
                    newHires, // Son 7 gün içinde işe girenler
                    leavers,  // Son 7 gün içinde işten ayrılanlar
                });
            } catch (sliderError) {
                console.error('Slider verileri alınırken hata oluştu:', sliderError);
                res.status(500).send('Slider verileri alınırken bir sorun oluştu.');
            }
        });
    } catch (err) {
        console.error('API çağrısı sırasında hata oluştu:', err);
        res.status(500).send('Veritabanı bağlantısı zaman aşımına uğradı.');
    }
};
