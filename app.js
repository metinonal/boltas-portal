const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const session = require("express-session");
const path = require("path");

// Rota dosyaları
const indexRoutes = require("./routes/main/indexRoutes"); // Ana Sayfa Rotası
const adminRoutes = require("./routes/admin/adminRoutes"); // Admin Paneli Rotası
const menuRoutes = require("./routes/main/menuRoutes"); // Menü Rotası
const yemekRoutes = require("./routes/admin/yemekRoutes"); // Yemek Yönetimi Rotası


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
    })
);

// Rotalar
app.use("/admin", adminRoutes); // Admin rotaları
app.use("/admin", yemekRoutes); // Admin rotaları
app.use("/", menuRoutes); // Menü rotaları
app.use("/", indexRoutes); // Ana sayfa rotaları

// Hata İşleyici Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Bir şeyler ters gitti!");
});

// Sunucuyu başlat
app.listen(5000, function (err) {
    if (err) {
        return console.log("An error occurred:", err);
    }
    console.log("The server is running on http://localhost:5000");
});
