const Slider = require('../../models/Slider'); // Slider modelini içe aktar
const fs = require('fs');
const path = require('path');

exports.showUpdateSliderPage = async (req, res) => {
    try {
        const { id } = req.params;

        // Veritabanından ilgili slider'ı bul
        const slider = await Slider.findById(id);

        if (!slider) {
            return res.status(404).send("Slider bulunamadı.");
        }

        // Güncelleme sayfasını render et ve slider bilgilerini gönder
        res.render('ikyonetim/slider-update', { slider });
    } catch (err) {
        console.error(err);
        res.status(500).send(`
            <h1>Internal Server Error</h1>
            <p>Slider güncelleme sayfası görüntülenirken bir hata oluştu.</p>
            <pre>${err.message}</pre>
        `);
    }
};

exports.updateSlider = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, link, isActive, count } = req.body;

        // Güncellenecek slider'ı bul
        const slider = await Slider.findById(id);
        if (!slider) {
            return res.status(404).send("Slider bulunamadı.");
        }

        // Eğer yeni bir resim yüklenmişse eski resmi sil ve yeni resmi kaydet
        if (req.file) {
            const oldImagePath = path.join(__dirname, '../../public', slider.imageUrl);
            if (fs.existsSync(oldImagePath)) {
                fs.unlink(oldImagePath, (err) => {
                    if (err) console.error("Eski dosya silinirken hata oluştu:", err);
                });
            }
            slider.imageUrl = `/uploads/${req.file.filename}`;
        }

        // Title ve Description boş olabilir, sadece tanımlıysa güncelle
        if (title !== undefined) {
            slider.title = title;
        }
        if (description !== undefined) {
            slider.description = description;
        }

        // Diğer alanları güncelle
        slider.link = link;
        slider.isActive = isActive === '1' || isActive === true;
        slider.count = isNaN(parseInt(count, 10)) ? slider.count : parseInt(count, 10);

        // Güncellemeyi kaydet
        await slider.save();

        res.redirect('/ikyonetim/slider-edit');
    } catch (err) {
        console.error(err);
        res.status(500).send(`
            <h1>Internal Server Error</h1>
            <p>Slider güncellenirken bir hata oluştu.</p>
            <pre>${err.message}</pre>
        `);
    }
};

// Slider ekleme sayfasını göster
exports.sliderAddPage = (req, res) => {
    res.render("ikyonetim/slider-add", { error: null });
};

// Slider ekleme işlemi
exports.sliderAdd = async (req, res) => {
    try {
        // Dosya yüklenip yüklenmediğini kontrol et
        if (!req.file) {
            return res.status(400).send(`
                <h1>Bad Request</h1>
                <p>Lütfen bir resim dosyası yükleyin.</p>
            `);
        }

        const { title, description, link, isActive, count } = req.body;
        const imageUrl = `/uploads/${req.file.filename}`;

        // Yeni slider belgesi oluştur
        const newSlider = new Slider({
            title,
            imageUrl,
            description,
            link,
            isActive: isActive === '1' ? true : false,
            count: parseInt(count, 10), // count değerini tam sayı olarak al
            createdAt: new Date()
        });

        // Slider'ı veritabanına kaydet
        await newSlider.save();

        // Başarılı ekleme sonrası yönlendirme
        res.redirect("/ikyonetim/slider-edit");
    } catch (err) {
        console.error(err);
        res.status(500).send(`
            <h1>Internal Server Error</h1>
            <p>Slider eklenirken bir hata oluştu.</p>
            <pre>${err.message}</pre>
        `);
    }
};

exports.deleteSlider = async (req, res) => {
    try {
        const { id } = req.params;

        // Veritabanından ilgili slider'ı bul
        const slider = await Slider.findById(id);

        if (!slider) {
            return res.status(404).send("Slider bulunamadı.");
        }

        // Resim dosyasının yolunu al
        const imagePath = path.join(__dirname, '../../public', slider.imageUrl);

        // Slider'ı veritabanından sil
        await Slider.findByIdAndDelete(id);

        // Dosyayı sil
        fs.unlink(imagePath, (err) => {
            if (err) {
                console.error("Dosya silinirken hata oluştu:", err);
            } else {
                console.log("Dosya başarıyla silindi.");
            }
        });

        // Başarılı silme sonrası yönlendirme
        res.redirect("/ikyonetim/slider-edit");
    } catch (err) {
        console.error(err);
        res.status(500).send(`
            <h1>Internal Server Error</h1>
            <p>Slider silinirken bir hata oluştu.</p>
            <pre>${err.message}</pre>
        `);
    }
};

exports.sliderEditPage = async (req, res) => {
    try {
        // Slider koleksiyonundan tüm verileri count değerine göre sıralı al
        const sliders = await Slider.find().sort({ count: 1 });

        // Tarihi dd/mm/yyyy formatına dönüştür
        const formattedSliders = sliders.map(slider => ({
            ...slider._doc,
            createdAt: slider.createdAt.toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }),
            isActive: slider.isActive ? 1 : 0
        }));

        // Verileri 'ikyonetim/slider-edit' sayfasında render et
        res.render("ikyonetim/slider-edit", {
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
