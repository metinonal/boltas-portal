const express = require("express")
const fs = require("fs")
const https = require("https")
const http = require("http")
const path = require("path")
const bodyParser = require("body-parser")
const session = require("express-session")
const MongoStore = require("connect-mongo")
const dotenv = require("dotenv")
const connectDB = require("./data/db")
const azureService = require("./services/azureService")
const cron = require("node-cron")
const { exportADUsers } = require("./services/exportADUserService")
const setUserLocals = require("./middlewares/setUserLocals") // header kısmındaki profil bilgilerini gosteren fonk

// exportADUsers();

const { connectMSSQL, connectMongo } = require("./config/config")
const { authMiddleware, sessionTimeoutMiddleware } = require("./middlewares/authMiddleware")

dotenv.config()
const app = express()
connectDB()

// SSL Sertifikası (.pfx dosyası)
const options = {
  pfx: fs.readFileSync(path.join(__dirname, "STAR.BOLTAS.COM.pfx")),
  passphrase: "Bolat2020!*",
}

// HTTP'den HTTPS'ye yönlendirme
const redirectToHttps = (req, res, next) => {
  if (!req.secure) {
    return res.redirect(`https://${req.headers.host}${req.url}`)
  }
  next()
}

const httpApp = express()
httpApp.use(redirectToHttps)
http.createServer(httpApp).listen(80, () => {
  console.log("HTTP server is running on http://localhost:80 and redirecting to HTTPS")
})

// View ve statik dosyalar
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))
app.use(express.static("public"))
app.use(express.static("node_modules"))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// ✅ Kalıcı session – MongoDB tabanlı
app.use(
  session({
    secret: "boltas",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.DB_URI,
      collectionName: "sessions",
    }),
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 gün
      secure: false,
      httpOnly: true,
    },
  }),
)

app.use(setUserLocals)

connectMSSQL()
connectMongo()

// ✅ Login yönlendirme sistemi
app.use((req, res, next) => {
  const publicPaths = ["/login", "/logout"]

  // Eğer zaten giriş yaptıysa ve /login'e gelmeye çalışıyorsa ana sayfaya gönder
  if (req.session.authenticated && req.path === "/login") {
    return res.redirect("/")
  }

  // Giriş yapılmamışsa ve izin verilen yollardan biri değilse login sayfasına yönlendir
  if (!req.session.authenticated && !publicPaths.includes(req.path) && req.method === "GET") {
    return res.redirect("/login")
  }

  // Giriş yapılmışsa veya login/logout gibi public path'lerdeyse devam et
  return next()
})

// Route'lar
const adminRoutes = require("./routes/ikyonetim/adminRoutes")
const userRoutes = require("./routes/ikyonetim/userRoutes")
const yemekRoutes = require("./routes/ikyonetim/yemekRoutes")
const sliderRoutes = require("./routes/ikyonetim/sliderRoutes")
const documentRoutes = require("./routes/ikyonetim/documentRoutes")
const authRoutes = require("./routes/main/authRoutes")
const userController = require("./controllers/main/userController")
const bilgiBankasiRoutes = require("./routes/ikyonetim/bilgiBankasiRoutes")
const marketplaceAdminRoutes = require("./routes/ikyonetim/marketplaceAdminRoutes")
const sozlukAdminRoutes = require("./routes/ikyonetim/sozlukRoutes")

const menuRoutes = require("./routes/main/menuRoutes")
const indexRoutes = require("./routes/main/indexRoutes")
const phoneRoutes = require("./routes/main/phoneRoutes")
const marketplaceRoutes = require("./routes/main/marketplaceRoutes")
const sozlukRoutes = require("./routes/main/sozlukRoutes")
const pdfRoutes = require("./routes/main/pdfRoutes")

//Middleware ler

const bilgiMiddleware = require("./middlewares/bilgiMiddleware")
app.use(bilgiMiddleware)

// Routing
app.use(authRoutes)
app.get("/profile", sessionTimeoutMiddleware, authMiddleware, userController.mainProfile)
app.use("/ikyonetim", yemekRoutes)
app.use("/ikyonetim", bilgiBankasiRoutes)
app.use("/ikyonetim", sliderRoutes)
app.use("/ikyonetim", documentRoutes)
app.use("/ikyonetim", adminRoutes)
app.use("/ikyonetim", userRoutes)
app.use("/ikyonetim", marketplaceAdminRoutes)
app.use("/ikyonetim/sozluk", sozlukAdminRoutes)
app.use("/", menuRoutes)
app.use("/", phoneRoutes)
app.use("/pazaryeri", marketplaceRoutes)
app.use("/sozluk", sozlukRoutes)
app.use("/pdf-araclari", pdfRoutes)
app.use("/", indexRoutes)

// Global hata yakalayıcı
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send("Bir şeyler ters gitti!")
})

// 404 sayfası - tüm route'lardan sonra tanımlanmalı
app.use((req, res) => {
  res.status(404).render("main/404")
})

// HTTPS başlat
https.createServer(options, app).listen(443, (err) => {
  if (err) {
    return console.log("An error occurred:", err)
  }
  console.log("The HTTPS server is running on https://localhost:443")
})

// Cron görevleri
async function runTask() {
  console.log("Profil fotoğrafı indirme işlemi başladı.")
  try {
    await azureService.downloadAllProfilePhotos()
    console.log("Profil fotoğrafı indirme işlemi tamamlandı.")
  } catch (error) {
    console.error("Hata oluştu:", error)
  }
}

cron.schedule("0 */6 * * *", () => {
  runTask()
})

cron.schedule("0 3 * * *", () => {
  console.log("Günlük AD verisi çekiliyor...")
  exportADUsers()
})

console.log("Uygulama çalışıyor...")
runTask()
