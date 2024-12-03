const dbConnection = require('../../data/db');

exports.loginPage = (req, res) => {
    res.render("admin/login", { error: null });
};

exports.authenticate = async (req, res) => {
    const { username, password } = req.body;

    try {
        const db = dbConnection.getDb(); // Bağlantıyı al
        const user = await db.collection("users").findOne({ userMail: username, userPassword: password });

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
