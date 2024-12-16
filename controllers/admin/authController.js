const db = require('../../data/db'); // MySQL bağlantısını içe aktar

// Giriş sayfasını göster
exports.loginPage = (req, res) => {
    res.render("admin/login", { error: null });
};

// Kimlik doğrulama işlemi
exports.authenticate = (req, res) => {
    const { username, password } = req.body;

    try {
        // Kullanıcıyı MySQL veritabanından ara
        const query = "SELECT * FROM users WHERE userMail = ? AND userPassword = ?";
        db.query(query, [username, password], (err, results) => {
            if (err) {
                console.error("Kimlik doğrulama hatası:", err);
                return res.status(500).send("Internal Server Error");
            }

            if (results.length > 0) {
                req.session.authenticated = true;
                res.redirect("/ikyonetim");
            } else {
                res.render("admin/login", { error: "Kullanıcı adı veya şifre yanlış" });
            }
        });
    } catch (err) {
        console.error("Kimlik doğrulama hatası:", err);
        res.status(500).send("Internal Server Error");
    }
};

// Çıkış işlemi
exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error("Çıkış sırasında hata oluştu:", err);
            res.status(500).send("Internal Server Error");
        } else {
            res.redirect("/login");
        }
    });
};
