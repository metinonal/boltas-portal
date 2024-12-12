const { getDb } = require('../../data/db'); // MongoClient bağlantısını içe aktar
const { ObjectId } = require('mongodb');
const fs = require('fs');
const path = require('path');
const cache = require('memory-cache');

// Cache temizleme fonksiyonu
const clearCache = () => {
    cache.clear();
    console.log('Cache temizlendi');
};

// Slider güncelleme sayfasını göster
exports.showUpdateSliderPage = async (req, res) => {
    try {
        const db = getDb();
        const { id } = req.params;

        // Veritabanından ilgili slider'ı bul
        const slider = await db.collection('sliders').findOne({ _id: new ObjectId(id) });

        if (!slider) {
            return res.status(404).send("Slider bulunamadı.");
        }

        // Güncelleme sayfasını render et ve slider bilgilerini gönder
        res.render('admin/slider-update', { slider });
    } catch (err) {
        console.error(err);
        res.status(500).send(`
            <h1>Internal Server Error</h1>
            <p>Slider güncelleme sayfası görüntülenirken bir hata oluştu.</p>
            <pre>${err.message}</pre>
        `);
    }
};

// Slider güncelleme işlemi
exports.updateSlider = async (req, res) => {
    try {
        const db = getDb();
        const { id } = req.params;
        const { title, description, link, isActive, isMain } = req.body;

        const slider = await db.collection('sliders').findOne({ _id: new ObjectId(id) });

        if (!slider) {
            return res.status(404).send("Slider bulunamadı.");
        }

        let imageUrl = slider.imageUrl;

        if (req.file) {
            const oldImagePath = path.join(__dirname, '../../public', slider.imageUrl);
            fs.unlink(oldImagePath, (err) => {
                if (err) console.error("Eski dosya silinirken hata oluştu:", err);
            });
            imageUrl = `/uploads/${req.file.filename}`;
        }

        await db.collection('sliders').updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    title,
                    imageUrl,
                    description,
                    link,
                    isActive: isActive === '1',
                    isMain: isMain === '1',
                    updatedAt: new Date()
                }
            }
        );

        clearCache();
        res.redirect("/ikyonetim/slider-edit");
    } catch (err) {
        console.error(err);
        res.status(500).send("Slider güncellenirken bir hata oluştu.");
    }
};

// Slider ekleme sayfasını göster
exports.sliderAddPage = (req, res) => {
    res.render("admin/slider-add", { error: null });
};

// Slider ekleme işlemi
exports.sliderAdd = async (req, res) => {
    try {
        const db = getDb();

        if (!req.file) {
            return res.status(400).send("Lütfen bir resim dosyası yükleyin.");
        }

        const { title, description, link, isActive, isMain } = req.body;
        const imageUrl = `/uploads/${req.file.filename}`;

        await db.collection('sliders').insertOne({
            title,
            imageUrl,
            description,
            link,
            isActive: isActive === '1',
            isMain: isMain === '1',
            createdAt: new Date()
        });

        clearCache();
        res.redirect("/ikyonetim/slider-edit");
    } catch (err) {
        console.error(err);
        res.status(500).send("Slider eklenirken bir hata oluştu.");
    }
};

// Slider silme işlemi
exports.deleteSlider = async (req, res) => {
    try {
        const db = getDb();
        const { id } = req.params;

        const slider = await db.collection('sliders').findOne({ _id: new ObjectId(id) });

        if (!slider) {
            return res.status(404).send("Slider bulunamadı.");
        }

        const imagePath = path.join(__dirname, '../../public', slider.imageUrl);
        await db.collection('sliders').deleteOne({ _id: new ObjectId(id) });

        fs.unlink(imagePath, (err) => {
            if (err) console.error("Dosya silinirken hata oluştu:", err);
        });

        clearCache();
        res.redirect("/ikyonetim/slider-edit");
    } catch (err) {
        console.error(err);
        res.status(500).send("Slider silinirken bir hata oluştu.");
    }
};

// Slider düzenleme sayfasını göster
exports.sliderEditPage = async (req, res) => {
    try {
        const db = getDb();

        // Slider koleksiyonundan tüm verileri al
        const sliders = await db.collection('sliders').find().toArray();

        // Tarihi dd/mm/yyyy formatına dönüştür
        const formattedSliders = sliders.map(slider => ({
            ...slider,
            createdAt: slider.createdAt
                ? slider.createdAt.toLocaleDateString('tr-TR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                })
                : '',
            isActive: slider.isActive ? 1 : 0,
            isMain: slider.isMain ? 1 : 0
        }));

        // Verileri 'admin/slider-edit' sayfasında render et
        res.render("admin/slider-edit", {
            sliders: formattedSliders
        });
    } catch (err) {
        console.log(err);
        res.status(500).send(`
            <h1>Internal Server Error</h1>
            <p>Slider edit sayfası görüntülenirken bir hata oluştu.</p>
            <pre>${err.message}</pre>
        `);
    }
};
