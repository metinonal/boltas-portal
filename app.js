const express = require("express");
const app = express();
const { connectDB } = require('./data/db'); // MongoClient bağlantısı
const bodyParser = require("body-parser");
const session = require("express-session");
const path = require("path");

// MongoDB bağlantısını başlat
connectDB().then(() => {
    console.log("Veritabanı bağlantısı başarılı.");
}).catch(err => {
    console.error("Veritabanı bağlantısı başarısız:", err);
    process.exit(1);
});

// Admin Rota dosyaları
const adminRoutes = require("./routes/admin/adminRoutes"); // Admin Paneli Rotası
const yemekRoutes = require("./routes/admin/yemekRoutes"); // Yemek Yönetimi Rotası
const sliderRoutes = require("./routes/admin/sliderRoutes"); // Slider Yönetimi Rotası

// Main Rota dosyaları
const menuRoutes = require("./routes/main/menuRoutes"); // Menü Rotası
const indexRoutes = require("./routes/main/indexRoutes"); // Ana Sayfa Rotası

// Auth Rota dosyası
const authRoutes = require('./routes/admin/authRoutes'); // Auth Rotası
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
        secret: "boltas", // Güçlü bir anahtar seçin
        resave: false,
        saveUninitialized: true,
        cookie: {
            maxAge: 30 * 60 * 1000 // Oturum süresi 30 dakika
        }
    })
);

// Session timeout kontrolü
app.use(sessionTimeoutMiddleware);

// Auth rotalarını dahil etme
app.use(authRoutes);

// Admin rotaları
app.use("/ikyonetim", authMiddleware, adminRoutes); // Genel admin rotaları
app.use("/ikyonetim", authMiddleware, yemekRoutes); // Yemek yönetimi rotaları
app.use("/ikyonetim", authMiddleware, sliderRoutes); // Slider yönetimi rotaları

// Main rotaları
app.use("/", menuRoutes); // Menü rotaları
app.use("/", indexRoutes); // Ana sayfa rotaları

// Hata İşleyici Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Bir şeyler ters gitti!");
});

// Sunucuyu başlat
const PORT = process.env.PORT || 3000;
app.listen(PORT, (err) => {
    if (err) {
        return console.log("An error occurred:", err);
    }
    console.log(`The server is running on http://localhost:${PORT}`);
});
