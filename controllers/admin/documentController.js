const Doc = require('../../models/Doc');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Multer yapılandırması (dosya yükleme ayarları)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../public/uploads/docs');
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

// Multer upload nesnesi
const upload = multer({ storage });

// Tüm dökümanları listeleme sayfası
exports.getDocs = async (req, res) => {
    try {
        const docs = await Doc.find();
        res.render('admin/docs-edit', { docs });
    } catch (err) {
        console.error("Dökümanlar alınırken hata oluştu:", err);
        res.status(500).send("Dökümanlar alınırken bir hata oluştu.");
    }
};

// Döküman ekleme sayfasını gösterme
exports.showAddDocPage = (req, res) => {
    res.render('admin/docs-add', { error: null });
};

// Döküman ekleme işlemi
exports.addDoc = [
    upload.single('docFile'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).send("Lütfen bir dosya yükleyin.");
            }

            const { docName, docLink, isActive } = req.body;

            const newDoc = new Doc({
                docName,
                docLink,
                docFile: `/uploads/docs/${req.file.filename}`,
                isActive: isActive === '1' ? true : false
            });

            await newDoc.save();
            res.redirect('/ikyonetim/docs-edit');
        } catch (err) {
            console.error("Döküman eklenirken hata oluştu:", err);
            res.status(500).send("Döküman eklenirken bir hata oluştu.");
        }
    }
];

exports.showUpdateDocPage = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await Doc.findById(id);

        if (!doc) {
            return res.status(404).send("Döküman bulunamadı.");
        }

        // isActive değerini 1 veya 0 olarak dönüştür
        const formattedDoc = {
            ...doc._doc,
            isActive: doc.isActive ? 1 : 0
        };

        res.render('admin/docs-update', { doc: formattedDoc });
    } catch (err) {
        console.error("Döküman güncelleme sayfası görüntülenirken hata oluştu:", err);
        res.status(500).send("Döküman güncelleme sayfası görüntülenirken bir hata oluştu.");
    }
};



// Döküman güncelleme işlemi
exports.updateDoc = [
    upload.single('docFile'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { docName, docLink, isActive } = req.body;

            const doc = await Doc.findById(id);

            if (!doc) {
                return res.status(404).send("Döküman bulunamadı.");
            }

            // Eski dosyayı sil ve yeni dosyayı ekle
            if (req.file) {
                const oldFilePath = path.join(__dirname, '../../public', doc.docFile);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
                doc.docFile = `/uploads/docs/${req.file.filename}`;
            }

            // Diğer alanları güncelle
            doc.docName = docName;
            doc.docLink = docLink;
            doc.isActive = isActive === '1';

            await doc.save();

            res.redirect('/ikyonetim/docs-edit');
        } catch (err) {
            console.error("Döküman güncellenirken hata oluştu:", err);
            res.status(500).send("Döküman güncellenirken bir hata oluştu.");
        }
    }
];

// Döküman silme işlemi
exports.deleteDoc = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await Doc.findById(id);

        if (!doc) {
            return res.status(404).send("Döküman bulunamadı.");
        }

        // Dosya sisteminden dosyayı sil
        const filePath = path.join(__dirname, '../../public', doc.docFile);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await Doc.findByIdAndDelete(id);
        res.redirect('/ikyonetim/docs-edit');
    } catch (err) {
        console.error("Döküman silinirken hata oluştu:", err);
        res.status(500).send("Döküman silinirken bir hata oluştu.");
    }
};
