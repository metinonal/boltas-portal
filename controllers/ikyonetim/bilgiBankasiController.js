const bilgiBankasi = require('../../models/bilgiBankasi');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Multer yapılandırması (dosya yükleme ayarları)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../public/uploads/bilgi');
        // Eğer dizin yoksa oluştur
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

exports.getBilgi = async (req, res) => {
    try {
        const bilgi = await bilgiBankasi.find();

        // isActive özelliğini her dökümana ekle
        const updatedBilgi = bilgi.map(bilgi => ({
            ...bilgi.toObject(),
            isActive: bilgi.isActive ? 1 : 0
        }));

        res.render('ikyonetim/bilgi-edit', { bilgi: updatedBilgi });
    } catch (err) {
        console.error("Dökümanlar alınırken hata oluştu:", err);
        res.status(500).send("Dökümanlar alınırken bir hata oluştu.");
    }
};

// Link ekleme sayfasını göster
exports.bilgiAddPage = (req, res) => {
    res.render("ikyonetim/bilgi-add", { error: null });
};

// Link ekleme işlemi
exports.bilgiAdd = async (req, res) => {
    try {
        // Dosya yüklenip yüklenmediğini kontrol et
        if (!req.file) {
            return res.status(400).send(`
                <h1>Bad Request</h1>
                <p>Lütfen bir resim dosyası yükleyin.</p>
            `);
        }

        const { header, description, link, isActive } = req.body;
        const img = `/uploads/bilgi/${req.file.filename}`;

        // Yeni link belgesi oluştur
        const newBilgi = new Bilgi({
            header,
            img,
            description,
            link,
            isActive: isActive === '1' ? true : false,
            createdAt: new Date()
        });

        // Linki veritabanına kaydet
        await newBilgi.save();

        // Başarılı ekleme sonrası yönlendirme
        res.redirect("/ikyonetim/bilgi-edit");
    } catch (err) {
        console.error(err);
        res.status(500).send(`
            <h1>Internal Server Error</h1>
            <p>Link eklenirken bir hata oluştu.</p>
            <pre>${err.message}</pre>
        `);
    }
};