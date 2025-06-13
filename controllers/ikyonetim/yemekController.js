const path = require("path");
const fs = require("fs");
const { parseExcel } = require("../../models/menuModel");

// Panel Görüntüleme
exports.getYemekListesiPanel = (req, res) => {
    try {
        res.render("ikyonetim/yemek-listesi", { title: "Yemek Listesi Yükleme" });
    } catch (err) {
        console.error("Yemek listesi paneli hatası:", err);
        res.status(500).send("Yemek listesi paneli görüntülenirken hata oluştu.");
    }
};

// Ortak Excel Yükleme Fonksiyonu
const uploadMenuExcel = async (location, req, res) => {
    try {
        const uploadDir = path.join(__dirname, `../../public/menu-imgs/${location}`);
        
        // Klasör yoksa oluştur
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const uploadedFilePath = path.join(uploadDir, req.file.filename);

        // Excel dosyasını işle
        const menuData = await parseExcel(uploadedFilePath);

        // Excel okunduktan sonra tüm klasörü temizle
        fs.readdir(uploadDir, (err, files) => {
            if (err) {
                console.error("Klasör okunamadı:", err);
                return;
            }
            files.forEach((file) => {
                const filePath = path.join(uploadDir, file);
                if (file !== `${location}-menu.json`) {
                    fs.unlink(filePath, (err) => {
                        if (err) console.error("Dosya silinemedi:", filePath);
                    });
                }
            });
        });

        // Menü JSON dosyasını kaydet
        const jsonFilePath = path.join(uploadDir, `${location}-menu.json`);
        fs.writeFileSync(jsonFilePath, JSON.stringify(menuData, null, 4), "utf-8");

        // Sayfaya yönlendir
        res.redirect("/ikyonetim/yemek-listesi");
    } catch (err) {
        console.error("Excel yükleme hatası:", err);
        res.status(500).send("Excel dosyası yüklenirken bir hata oluştu.");
    }
};

// İstanbul için çağrı
exports.uploadIstanbulExcel = async (req, res) => {
    await uploadMenuExcel("istanbul", req, res);
};

// Dilovası için çağrı
exports.uploadDilovasiExcel = async (req, res) => {
    await uploadMenuExcel("dilovasi", req, res);
};
