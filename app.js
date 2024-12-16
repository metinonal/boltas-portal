const express = require("express");
const app = express();
const db = require('./data/db'); // MySQL bağlantısını içe aktar
const bodyParser = require("body-parser");
const session = require("express-session");
const path = require("path");
const config = require("./config/config");

// Admin Rota dosyaları
const adminRoutes = require("./routes/admin/adminRoutes"); // Admin Paneli Rotası
const yemekRoutes = require("./routes/admin/yemekRoutes"); // Yemek Yönetimi Rotası
const sliderRoutes = require("./routes/admin/sliderRoutes"); // Slider Yönetimi Rotası

// Main Rota dosyaları
const menuRoutes = require("./routes/main/menuRoutes"); // Menü Rotası
const indexRoutes = require("./routes/main/indexRoutes"); // Ana Sayfa Rotası

// Auth Rota dosyası
const authRoutes = require('./routes/admin/authRoutes'); // Auth rotası
const { sessionTimeoutMiddleware, authMiddleware } = require("./middlewares/authMiddleware");

// Görüntü motorunun tercihi
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Statik dosyaların projeye dahil edilmesi
app.use(express.static("public"));
app.use(express.static("node_modules"));

// Body parser Middleware'i
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session Middleware
app.use(
    session({
        secret: config.sessionSecret, // .env'den gelen secret anahtarı
        resave: false,
        saveUninitialized: true,
        cookie: {
            maxAge: 30 * 60 * 1000 // Oturum süresi 30 dakika olarak ayarlanır
        }
    })
);

// Session timeout middleware
app.use(sessionTimeoutMiddleware);

// Auth rotalarını dahil etme
app.use(authRoutes);

// Admin rotaları
app.use("/ikyonetim", authMiddleware, yemekRoutes);
app.use("/ikyonetim", authMiddleware, sliderRoutes);
app.use("/ikyonetim", authMiddleware, adminRoutes);

// Main rotaları
app.use("/", menuRoutes);
app.use("/", indexRoutes);

// Hata İşleyici Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Bir şeyler ters gitti!");
});

// Sunucuyu başlat
const PORT = config.PORT;
app.listen(PORT, (err) => {
    if (err) {
        return console.log("An error occurred:", err);
    }
    console.log(`The server is running on http://localhost:${PORT}`);
});
