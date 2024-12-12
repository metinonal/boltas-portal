const express = require("express");
const app = express();
const connectDB = require('./data/db');
const bodyParser = require("body-parser");
const session = require("express-session");
const path = require("path");

connectDB();

//Admin Rota dosyaları
const adminRoutes = require("./routes/admin/adminRoutes"); // Admin Paneli Rotası
const yemekRoutes = require("./routes/admin/yemekRoutes"); // Yemek Yönetimi Rotası
const sliderRoutes = require("./routes/admin/sliderRoutes"); // Yemek Yönetimi Rotası

//Main Rota dosyaları
const menuRoutes = require("./routes/main/menuRoutes"); // Menü Rotası
const indexRoutes = require("./routes/main/indexRoutes"); // Ana Sayfa Rotası


const authRoutes = require('./routes/admin/authRoutes'); // auth rotası
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

// Session Middleware (isteğe bağlı)
app.use(
    session({
        secret: "boltas", // Güçlü bir anahtar seçin
        resave: false,
        saveUninitialized: true,
        cookie: {
            maxAge: 30 * 60 * 1000 // Session duration set to 30 minutes / Oturum süresi 30 dakika olarak ayarlanır
        }
    })
);

app.use(sessionTimeoutMiddleware);

app.use(authRoutes);

// Rotalar
app.use("/ikyonetim", authMiddleware, yemekRoutes); // Admin rotaları
app.use("/ikyonetim", authMiddleware, sliderRoutes); // Admin rotaları
app.use("/ikyonetim", authMiddleware, adminRoutes); // Admin rotaları
app.use("/", menuRoutes); // Menü rotaları
app.use("/", indexRoutes); // Ana sayfa rotaları

// Hata İşleyici Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Bir şeyler ters gitti!");
});

// Sunucuyu başlat
app.listen(3000, function (err) {
    if (err) {
        return console.log("An error occurred:", err);
    }
    console.log("The server is running on http://localhost:3000");
});
