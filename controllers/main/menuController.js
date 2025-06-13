const moment = require("moment");
const fs = require("fs");
const path = require("path");

// 🔧 Lokasyona göre JSON yolunu döner
function getMenuFilePath(location) {
    if (!["istanbul", "dilovasi"].includes(location)) {
        throw new Error("Geçersiz lokasyon");
    }
    return path.join(__dirname, `../../public/menu-imgs/${location}/${location}-menu.json`);
}

// 🔎 Belirli şube için bugünkü menüyü döner
exports.getTodayMenuData = (location) => {
    try {
        const jsonFilePath = getMenuFilePath(location);
        const menuData = JSON.parse(fs.readFileSync(jsonFilePath, "utf-8"));
        const today = moment().format("YYYY-MM-DD");
        return menuData.find((item) => item.date === today) || null;
    } catch (err) {
        console.error(`[${location}] bugünkü menü alınamadı:`, err);
        return null;
    }
};

// 📦 Bugünkü menü (JSON response olarak kullanılabilir)
exports.getTodayMenu = (req, res) => {
    try {
        const location = req.query.location;
        const todayMenu = exports.getTodayMenuData(location);
        res.json(todayMenu || { message: "Bugün için yemek bulunamadı." });
    } catch (err) {
        console.error("Bugünkü menü JSON dönerken hata:", err);
        res.status(500).json({ message: "Menü bilgisi alınırken hata oluştu." });
    }
};

// 📋 Sekmeli görünüm için hem tüm menüler hem bugünkü menüler birlikte
exports.getAllMenus = (req, res) => {
    try {
        let menuDataIstanbul = [];
        let menuDataDilovasi = [];
        let todayMenuIstanbul = null;
        let todayMenuDilovasi = null;

        // İstanbul
        try {
            const istanbulPath = getMenuFilePath("istanbul");
            menuDataIstanbul = JSON.parse(fs.readFileSync(istanbulPath, "utf-8"));
            todayMenuIstanbul = menuDataIstanbul.find(m => m.date === moment().format("YYYY-MM-DD")) || null;
        } catch (e) {
            console.warn("İstanbul menüsü okunamadı:", e.message);
        }

        // Dilovası
        try {
            const dilovasiPath = getMenuFilePath("dilovasi");
            menuDataDilovasi = JSON.parse(fs.readFileSync(dilovasiPath, "utf-8"));
            todayMenuDilovasi = menuDataDilovasi.find(m => m.date === moment().format("YYYY-MM-DD")) || null;
        } catch (e) {
            console.warn("Dilovası menüsü okunamadı:", e.message);
        }

        // Hem günlük hem tüm menüler gönderiliyor
        res.render("main/yemek-listesi", {
            menuDataIstanbul,
            menuDataDilovasi,
            todayMenuIstanbul,
            todayMenuDilovasi
        });

    } catch (err) {
        console.error("Menüler alınırken genel hata:", err);
        res.status(500).send("Yemek listesi yüklenirken bir hata oluştu.");
    }
};
