const menuController = require("./menuController");

exports.indexPage = async (req, res) => {
    try {
        // Bugünün menüsünü veri işleyici fonksiyonla al
        const todayMenu = menuController.getTodayMenuData();

        // Ana sayfa görünümüne gönder
        res.render("main/index", { todayMenu });
    } catch (err) {
        console.error(err);
        res.status(500).send("Ana sayfada bir sorun var.");
    }
};
