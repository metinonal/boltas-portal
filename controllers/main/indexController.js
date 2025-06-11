const menuController = require("./menuController")
const axios = require("axios")
const axiosRetry = require("axios-retry").default
const xml2js = require("xml2js")
const sql = require("mssql")
const Slider = require("../../models/Slider")
const Docs = require("../../models/Doc")
const bilgiBankasi = require("../../models/bilgiBankasi")
const Settings = require("../../models/Settings")

// 🔧 Retry yapılandırması
axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 1000,
  retryCondition: (error) => {
    return error.code === "ECONNRESET" || error.code === "ETIMEDOUT"
  },
})

const config = {
  user: "userportal",
  password: "Portal2025.!",
  server: "192.168.200.23",
  database: "EntegrasyonDB",
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
}

const connectToDatabase = async () => {
  let connected = false
  const maxRetries = 50
  let attempt = 0

  while (!connected && attempt < maxRetries) {
    try {
      await sql.connect(config)
      connected = true
    } catch (error) {
      attempt++
      console.log(`Bağlantı denemesi ${attempt} başarısız. Yeniden deneniyor...`)
      if (attempt === maxRetries) {
        throw new Error("Veritabanı bağlantısı sağlanamadı.")
      }
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }
}

exports.indexPage = async (req, res) => {
  try {
    // Ayarları getir (sadece ön yüz için)
    const settingsData = await Settings.find({})
    const settings = {}

    settingsData.forEach((setting) => {
      settings[setting.key] = setting.value
    })

    const todayMenu = menuController.getTodayMenuData()

    // Veritabanına bağlan
    await connectToDatabase()

    const birthdayResult = await sql.query(`
          DECLARE @tarih DATE = GETDATE();
          SELECT *
          FROM [vHROrganizationFromOrtakIK_ALL]
          WHERE MONTH(@tarih) = MONTH(DogumTarihi)
            AND DAY(@tarih) = DAY(DogumTarihi)
            AND CEMP_ENDDATE IS NULL
            AND SicilNo != 1001;
      `)
    const birthdays = birthdayResult.recordset

    const newHiresResult = await sql.query(`
          SELECT * 
          FROM [vHROrganizationFromOrtakIK_ALL]
          WHERE IsYeriGirisTarihi >= DATEADD(DAY, -7, GETDATE())
            AND IsYeriGirisTarihi <= GETDATE();
      `)
    const newHires = newHiresResult.recordset

    const leaversResult = await sql.query(`
          SELECT * 
          FROM [vHROrganizationFromOrtakIK_ALL]
          WHERE CEMP_ENDDATE >= DATEADD(DAY, -8, CAST(GETDATE() AS DATE))
            AND CEMP_ENDDATE <= DATEADD(DAY, -1, CAST(GETDATE() AS DATE));
      `)
    const leavers = leaversResult.recordset

    // ✅ Döviz bilgilerini çek (hatalara karşı korumalı)
    let currencies = []

    try {
      const response = await axios.get("https://www.tcmb.gov.tr/kurlar/today.xml", {
        timeout: 5000,
      })

      const parsed = await xml2js.parseStringPromise(response.data)
      currencies = parsed.Tarih_Date.Currency.map((item) => ({
        currencyCode: item.$.CurrencyCode,
        currencyName: item.Isim[0],
        forexBuying: item.ForexBuying?.[0] || "N/A",
        forexSelling: item.ForexSelling?.[0] || "N/A",
      }))
    } catch (currencyError) {
      console.error("Döviz verisi alınamadı:", currencyError.message)
    }

    try {
      const sliders = await Slider.find().sort({ count: 1 })
      const docs = await Docs.find()
      const bilgi = await bilgiBankasi.find({ isActive: true })

      res.render("main/index", {
        todayMenu,
        currencies,
        sliders,
        docs,
        birthdays,
        newHires,
        leavers,
        bilgi,
        settings, // Ayarları ön yüze gönder
      })
    } catch (sliderError) {
      console.error("Slider verileri alınırken hata oluştu:", sliderError)
      res.status(500).send("Slider verileri alınırken bir sorun oluştu.")
    }
  } catch (err) {
    console.error("API çağrısı sırasında hata oluştu:", err)
    res.status(500).send("Veritabanı bağlantısı zaman aşımına uğradı.")
  }
}
