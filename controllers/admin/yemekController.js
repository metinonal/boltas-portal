const path = require("path");
const fs = require("fs");
const { parseExcel } = require("../../models/menuModel");
const moment = require("moment");

// Yemek listesi görünümü
exports.getYemekListesiPanel = (req, res) => {
    try {
        res.render("admin/yemek-listesi", { title: "Yemek Listesi Yükleme" });
    } catch (err) {
        console.error("Yemek listesi paneli görüntülenirken bir hata oluştu:", err);
        res.status(500).send("Yemek listesi paneli görüntülenirken bir hata oluştu.");
    }
};

// Excel dosyası yükleme işlemi
exports.uploadExcel = (req, res) => {
    try {
        const uploadDir = path.join(__dirname, "../../public/menu-imgs");
        const uploadedFilePath = path.join(uploadDir, req.file.filename);

        // Eski Excel dosyalarını kaldır
        fs.readdir(uploadDir, (err, files) => {
            if (err) {
                console.error("Klasördeki dosyalar okunamadı:", err);
                return;
            }
            files.forEach((file) => {
                // 'menu.json' dosyasını silme
                if (file !== "menu.json") {
                    const filePath = path.join(uploadDir, file);
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error(`Dosya silinemedi: ${filePath}`, err);
                        } else {
                            console.log(`Silindi: ${filePath}`);
                        }
                    });
                }
            });
        });

        // Yeni yüklenen Excel dosyasını işle
        const menuData = parseExcel(uploadedFilePath);

        // JSON dosyasını 'menu.json' olarak kaydet
        const jsonFilePath = path.join(uploadDir, "menu.json");
        fs.writeFileSync(jsonFilePath, JSON.stringify(menuData, null, 4), "utf-8");

        // İşlem tamamlandıktan sonra kullanıcıyı yönlendir
        res.redirect("/admin/yemek-listesi");
    } catch (err) {
        console.error("Excel dosyası yüklenirken bir hata oluştu:", err);
        res.status(500).send("Excel dosyası yüklenirken bir hata oluştu.");
    }
};
