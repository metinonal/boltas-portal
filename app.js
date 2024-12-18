const express = require("express");
const fs = require("fs");
const https = require("https");
const http = require("http");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const connectDB = require('./data/db');

const app = express();
connectDB();

// SSL Sertifikası (.pfx dosyası)
const options = {
    pfx: fs.readFileSync(path.join(__dirname, "2025_yildiz.boltas.com.pfx")),
    passphrase: "Bolat2020!*" // Sertifika oluşturulurken belirlediğiniz şifre (varsa)
};

// HTTP'den HTTPS'ye yönlendirme
const redirectToHttps = (req, res, next) => {
    if (!req.secure) {
        return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
};

// HTTP Sunucusu (HTTPS'ye yönlendirme için)
const httpApp = express();
httpApp.use(redirectToHttps);
http.createServer(httpApp).listen(80, () => {
    console.log("HTTP server is running on http://localhost:80 and redirecting to HTTPS");
});

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
            maxAge: 30 * 60 * 1000 // Oturum süresi 30 dakika
        }
    })
);

// Middleware'ler ve Rotalar
const { sessionTimeoutMiddleware, authMiddleware } = require("./middlewares/authMiddleware");
const adminRoutes = require("./routes/admin/adminRoutes");
const yemekRoutes = require("./routes/admin/yemekRoutes");
const sliderRoutes = require("./routes/admin/sliderRoutes");
const menuRoutes = require("./routes/main/menuRoutes");
const indexRoutes = require("./routes/main/indexRoutes");
const authRoutes = require("./routes/admin/authRoutes");

app.use(sessionTimeoutMiddleware);
app.use(authRoutes);
app.use("/ikyonetim", authMiddleware, yemekRoutes);
app.use("/ikyonetim", authMiddleware, sliderRoutes);
app.use("/ikyonetim", authMiddleware, adminRoutes);
app.use("/", menuRoutes);
app.use("/", indexRoutes);

// Hata İşleyici Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Bir şeyler ters gitti!");
});

// HTTPS Sunucusu
https.createServer(options, app).listen(443, (err) => {
    if (err) {
        return console.log("An error occurred:", err);
    }
    console.log("The HTTPS server is running on https://localhost:443");
});