const { getDb } = require('../../data/db'); // MongoClient bağlantısını içe aktar
const { ObjectId } = require('mongodb');

// Giriş sayfasını göster
exports.loginPage = (req, res) => {
    res.render("admin/login", { error: null });
};

// Kimlik doğrulama işlemi
exports.authenticate = async (req, res) => {
    const { username, password } = req.body;

    try {
        // MongoDB bağlantısını al
        const db = getDb();
        if (!db) {
            throw new Error("Veritabanı bağlantısı kurulamadı.");
        }

        // Kullanıcıyı MongoDB'den ara
        const user = await db.collection('users').findOne({ userMail: username, userPassword: password });

        if (user) {
            req.session.authenticated = true;
            res.redirect("/ikyonetim");
        } else {
            res.render("admin/login", { error: "Kullanıcı adı veya şifre yanlış" });
        }
    } catch (err) {
        console.error("Kimlik doğrulama hatası:", err);
        res.status(500).send("Internal Server Error");
    }
};

// Çıkış işlemi
exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.log("Çıkış sırasında hata oluştu:", err);
            res.status(500).send("Internal Server Error");
        } else {
            res.redirect("/login");
        }
    });
};
