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
const socketIo = require("socket.io")

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
const sessionMiddleware = session({
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
})

app.use(sessionMiddleware)
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
const dahiliRaporRoutes = require("./routes/ikyonetim/dahiliRaporRoutes")

const menuRoutes = require("./routes/main/menuRoutes")
const indexRoutes = require("./routes/main/indexRoutes")
const phoneRoutes = require("./routes/main/phoneRoutes")
const marketplaceRoutes = require("./routes/main/marketplaceRoutes")
const sozlukRoutes = require("./routes/main/sozlukRoutes")
const pdfRoutes = require("./routes/main/pdfRoutes")
const messageRoutes = require("./routes/main/messageRoutes")

//Middleware ler

const bilgiMiddleware = require("./middlewares/bilgiMiddleware")
app.use(bilgiMiddleware)

// Routing
app.use(authRoutes)
app.get("/profile", sessionTimeoutMiddleware, authMiddleware, userController.mainProfile)
app.use("/", messageRoutes)
app.use("/ikyonetim", yemekRoutes)
app.use("/ikyonetim", bilgiBankasiRoutes)
app.use("/ikyonetim", sliderRoutes)
app.use("/ikyonetim", documentRoutes)
app.use("/ikyonetim", adminRoutes)
app.use("/ikyonetim", userRoutes)
app.use("/ikyonetim", dahiliRaporRoutes)
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

const httpsServer = https.createServer(options, app)
const io = socketIo(httpsServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
})

io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next)
})

io.on("connection", (socket) => {
  // console.log("[v0] Kullanıcı bağlandı:", socket.id)

  // Kullanıcı kimlik doğrulama
  const session = socket.request.session
  if (!session || !session.authenticated || !session.user) {
    // console.log("[v0] Kimlik doğrulaması başarısız, bağlantı kapatılıyor")
    socket.disconnect()
    return
  }

  const userEmail = session.user.EMail
  // console.log("[v0] Kimlik doğrulandı:", userEmail)

  // Kullanıcıyı kendi odasına ekle
  socket.join(userEmail)

  // Mesaj gönderme
  socket.on("sendMessage", async (data) => {
    try {
      // console.log("[v0] Mesaj gönderiliyor:", data)
      const { receiverEmail, message } = data

      const conversationId = [userEmail, receiverEmail].sort().join("_")

      // Mesajı veritabanına kaydet
      const Message = require("./models/Message")
      const newMessage = new Message({
        conversationId: conversationId, // Eksik olan conversationId eklendi
        sender: userEmail,
        receiver: receiverEmail,
        message: message,
        timestamp: new Date(),
        isRead: false,
      })

      await newMessage.save()
      // console.log("[v0] Mesaj veritabanına kaydedildi")

      // Mesajı gönderene geri gönder
      socket.emit("messageReceived", {
        conversationId: conversationId, // ConversationId eklendi
        sender: userEmail,
        receiver: receiverEmail,
        message: message,
        timestamp: newMessage.timestamp,
        isRead: false,
      })

      // Mesajı alıcıya gönder
      socket.to(receiverEmail).emit("newMessage", {
        conversationId: conversationId, // ConversationId eklendi
        sender: userEmail,
        receiver: receiverEmail,
        message: message,
        timestamp: newMessage.timestamp,
        isRead: false,
      })

      // console.log("[v0] Mesaj gerçek zamanlı olarak gönderildi")
    } catch (error) {
      console.error("[v0] Mesaj gönderme hatası:", error)
      socket.emit("messageError", { error: "Mesaj gönderilemedi" })
    }
  })

  // Mesaj okundu işareti
  socket.on("markAsRead", async (data) => {
    try {
      const { sender } = data
      const Message = require("./models/Message")

      await Message.updateMany({ sender: sender, receiver: userEmail, isRead: false }, { isRead: true })

      // Gönderene mesajların okunduğunu bildir
      socket.to(sender).emit("messagesRead", { reader: userEmail })
    } catch (error) {
      console.error("[v0] Mesaj okundu işareti hatası:", error)
    }
  })

  // Bağlantı koptuğunda
  socket.on("disconnect", () => {
    console.log("[v0] Kullanıcı bağlantısı koptu:", socket.id)
  })
})

global.io = io

// HTTPS başlat
httpsServer.listen(443, (err) => {
  if (err) {
    return console.log("An error occurred:", err)
  }
  console.log("The HTTPS server is running on https://localhost:443")
  console.log("Socket.IO server is ready for real-time messaging")
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
