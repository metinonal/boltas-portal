const User = require('../../models/User'); // User modelini içe aktar

// Giriş sayfasını göster
exports.loginPage = (req, res) => {
    res.render("ikyonetim/login", { error: null });
};

// Kimlik doğrulama işlemi
exports.authenticate = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Kullanıcıyı MongoDB'den ara
        const user = await User.findOne({ userMail: username, userPassword: password });

        if (user) {
            req.session.authenticated = true;
            res.redirect("/ikyonetim");
        } else {
            res.render("ikyonetim/login", { error: "Kullanıcı adı veya şifre yanlış" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Internal Server Error");
    }
};

// Çıkış işlemi
exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.log(err);
            res.status(500).send("Internal Server Error");
        } else {
            res.redirect("/login");
        }
    });
};
