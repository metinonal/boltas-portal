const bilgiBankasi = require('../../models/bilgiBankasi');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Multer yapılandırması
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../public/uploads/bilgi');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

// Tüm kayıtları listeleme
exports.getBilgi = async (req, res) => {
    try {
        const bilgi = await bilgiBankasi.find();
        const updatedBilgi = bilgi.map(b => ({
            ...b.toObject(),
            isActive: b.isActive ? 1 : 0
        }));
        res.render('ikyonetim/bilgi-edit', { bilgi: updatedBilgi });
    } catch (err) {
        console.error("Listeleme hatası:", err);
        res.status(500).send("Kayıtlar alınamadı.");
    }
};

// Ekleme sayfasını göster
exports.bilgiAddPage = (req, res) => {
    res.render("ikyonetim/bilgi-add", { error: null });
};

// Yeni kayıt ekleme
exports.bilgiAdd = [
    upload.single('img'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).send("Lütfen resim dosyası yükleyin.");
            }

            const { header, description, link, isActive } = req.body;
            const img = `/uploads/bilgi/${req.file.filename}`;

            const newBilgi = new bilgiBankasi({
                header,
                img,
                description,
                link,
                isActive: isActive === '1',
                createdAt: new Date()
            });

            await newBilgi.save();
            res.redirect("/ikyonetim/bilgi-edit");
        } catch (err) {
            console.error("Ekleme hatası:", err);
            res.status(500).send("Kayıt eklenirken hata oluştu.");
        }
    }
];

// Güncelleme sayfasını göster
exports.bilgiUpdatePage = async (req, res) => {
    try {
        const bilgi = await bilgiBankasi.findById(req.params.id);
        if (!bilgi) return res.status(404).send("Kayıt bulunamadı.");

        res.render("ikyonetim/bilgi-update", { bilgi });
    } catch (err) {
        console.error("Sayfa getirme hatası:", err);
        res.status(500).send("Güncelleme sayfası yüklenemedi.");
    }
};

// Mevcut kaydı güncelle
exports.bilgiUpdate = [
    upload.single('img'),
    async (req, res) => {
        try {
            const { header, description, link, isActive } = req.body;
            const updateFields = {
                header,
                description,
                link,
                isActive: isActive === '1'
            };

            if (req.file) {
                updateFields.img = `/uploads/bilgi/${req.file.filename}`;
            }

            await bilgiBankasi.findByIdAndUpdate(req.params.id, updateFields);

            res.redirect("/ikyonetim/bilgi-edit");
        } catch (err) {
            console.error("Güncelleme hatası:", err);
            res.status(500).send("Kayıt güncellenirken hata oluştu.");
        }
    }
];

// Kayıt silme
exports.bilgiDelete = async (req, res) => {
    try {
        await bilgiBankasi.findByIdAndDelete(req.params.id);
        res.redirect("/ikyonetim/bilgi-edit");
    } catch (err) {
        console.error("Silme hatası:", err);
        res.status(500).send("Kayıt silinirken hata oluştu.");
    }
};
