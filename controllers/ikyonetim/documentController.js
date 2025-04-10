const Doc = require('../../models/Doc');

// Tüm dökümanları listeleme sayfası
exports.getDocs = async (req, res) => {
    try {
        const docs = await Doc.find();

        const updatedDocs = docs.map(doc => ({
            ...doc.toObject(),
            isActive: doc.isActive ? 1 : 0
        }));

        res.render('ikyonetim/docs-edit', { docs: updatedDocs });
    } catch (err) {
        console.error("Dökümanlar alınırken hata oluştu:", err);
        res.status(500).send("Dökümanlar alınırken bir hata oluştu.");
    }
};

// Döküman ekleme sayfasını gösterme
exports.showAddDocPage = (req, res) => {
    res.render('ikyonetim/docs-add', { error: null });
};

// Döküman ekleme işlemi (sadece link üzerinden)
exports.addDoc = async (req, res) => {
    try {
        const { docName, docLink, isActive } = req.body;

        if (!docName || !docLink) {
            return res.status(400).send("Lütfen döküman adı ve linki giriniz.");
        }

        // En yüksek count değeri bulunur
        const lastDoc = await Doc.findOne().sort({ count: -1 });
        const nextCount = lastDoc ? lastDoc.count + 1 : 1;

        const newDoc = new Doc({
            docName,
            docLink,
            isActive: isActive === '1' ? true : false,
            count: nextCount
        });

        await newDoc.save();
        res.redirect('/ikyonetim/docs-edit');
    } catch (err) {
        console.error("Döküman eklenirken hata oluştu:", err);
        res.status(500).send("Döküman eklenirken bir hata oluştu.");
    }
};


// Döküman güncelleme sayfasını gösterme
exports.showUpdateDocPage = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await Doc.findById(id);

        if (!doc) {
            return res.status(404).send("Döküman bulunamadı.");
        }

        const formattedDoc = {
            ...doc._doc,
            isActive: doc.isActive ? 1 : 0
        };

        res.render('ikyonetim/docs-update', { doc: formattedDoc });
    } catch (err) {
        console.error("Döküman güncelleme sayfası görüntülenirken hata oluştu:", err);
        res.status(500).send("Döküman güncelleme sayfası görüntülenirken bir hata oluştu.");
    }
};

// Döküman güncelleme işlemi (sadece link üzerinden)
exports.updateDoc = async (req, res) => {
    try {
        const { id } = req.params;
        const { docName, docLink, isActive, count } = req.body;

        const doc = await Doc.findById(id);
        if (!doc) return res.status(404).send("Döküman bulunamadı.");

        // Güvenli sayı kontrolü
        const parsedCount = parseInt(count, 10);
        if (!isNaN(parsedCount)) {
            doc.count = parsedCount;
        }

        doc.docName = docName;
        doc.docLink = docLink;
        doc.isActive = isActive === '1';

        await doc.save();
        res.redirect('/ikyonetim/docs-edit');
    } catch (err) {
        console.error("Döküman güncellenirken hata oluştu:", err);
        res.status(500).send("Döküman güncellenirken bir hata oluştu.");
    }
};


// Döküman silme işlemi (sadece veritabanından silinir)
exports.deleteDoc = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await Doc.findById(id);

        if (!doc) {
            return res.status(404).send("Döküman bulunamadı.");
        }

        await Doc.findByIdAndDelete(id);
        res.redirect('/ikyonetim/docs-edit');
    } catch (err) {
        console.error("Döküman silinirken hata oluştu:", err);
        res.status(500).send("Döküman silinirken bir hata oluştu.");
    }
};
