const moment = require("moment");
const fs = require("fs");
const path = require("path");

// Bugünün menüsünü döndürür (sadece veri)
exports.getTodayMenuData = () => {
    try {
        const jsonFilePath = path.join(__dirname, "../../public/menu-imgs/menu.json");
        const menuData = JSON.parse(fs.readFileSync(jsonFilePath, "utf-8"));

        const today = moment().format("YYYY-MM-DD");
        return menuData.find((item) => item.date === today) || null;
    } catch (err) {
        console.error("Menü verisi alınırken bir hata oluştu:", err);
        return null;
    }
};

// Bugünün menüsünü JSON olarak döndürür (rota işleyici)
exports.getTodayMenu = (req, res) => {
    try {
        const todayMenu = exports.getTodayMenuData(); // Yukarıdaki işlevi çağır
        res.json(todayMenu || { message: "Bugün için yemek bulunamadı." });
    } catch (err) {
        console.error("Menü verisi alınırken bir hata oluştu:", err);
        res.status(500).json({ message: "Menü bilgisi alınırken bir hata oluştu." });
    }
};

exports.getAllMenus = (req, res) => {
    try {
        // JSON dosyasının yolunu belirle
        const jsonFilePath = path.join(__dirname, "../../public/menu-imgs/menu.json");

        // Dosyayı oku ve JSON olarak parse et
        const menuData = JSON.parse(fs.readFileSync(jsonFilePath, "utf-8"));

        // Tüm yemek listesini ejs'e gönder
        res.render("main/yemek-listesi", { menuData });
    } catch (err) {
        console.error("Tüm yemek listesi alınırken bir hata oluştu:", err);
        res.status(500).send("Yemek listesi yüklenirken bir hata oluştu.");
    }
};