const db = require('../../data/db');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);

// Slider güncelleme sayfasını göster
exports.showUpdateSliderPage = (req, res) => {
    const { id } = req.params;

    db.query('SELECT * FROM sliders WHERE id = ?', [id], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Slider güncelleme sayfası görüntülenirken bir hata oluştu.");
        }

        if (results.length === 0) {
            return res.status(404).send("Slider bulunamadı.");
        }

        const slider = results[0];
        res.render('admin/slider-update', { slider });
    });
};

// Slider güncelleme işlemi
exports.updateSlider = (req, res) => {
    const { id } = req.params;
    const { title, description, link, isActive, isMain } = req.body;

    db.query('SELECT * FROM sliders WHERE id = ?', [id], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Slider güncellenirken bir hata oluştu.");
        }

        if (results.length === 0) {
            return res.status(404).send("Slider bulunamadı.");
        }

        let imageUrl = results[0].imageUrl;

        if (req.file) {
            const oldImagePath = path.join(__dirname, '../../public', results[0].imageUrl);
            await unlinkAsync(oldImagePath).catch(err => console.error("Eski dosya silinirken hata oluştu:", err));
            imageUrl = `/uploads/${req.file.filename}`;
        }

        db.query(
            'UPDATE sliders SET title = ?, imageUrl = ?, description = ?, link = ?, isActive = ?, isMain = ? WHERE id = ?',
            [title, imageUrl, description, link, isActive === '1', isMain === '1', id],
            (err) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Slider güncellenirken bir hata oluştu.");
                }

                res.redirect('/ikyonetim/slider-edit');
            }
        );
    });
};

// Slider ekleme sayfasını göster
exports.sliderAddPage = (req, res) => {
    res.render("admin/slider-add", { error: null });
};

// Slider ekleme işlemi
exports.sliderAdd = (req, res) => {
    if (!req.file) {
        return res.status(400).send("Lütfen bir resim dosyası yükleyin.");
    }

    const { title, description, link, isActive, isMain } = req.body;
    const imageUrl = `/uploads/${req.file.filename}`;

    db.query(
        'INSERT INTO sliders (title, imageUrl, description, link, isActive, isMain, createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [title, imageUrl, description, link, isActive === '1', isMain === '1'],
        (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Slider eklenirken bir hata oluştu.");
            }

            res.redirect("/ikyonetim/slider-edit");
        }
    );
};

// Slider silme işlemi
exports.deleteSlider = (req, res) => {
    const { id } = req.params;

    db.query('SELECT * FROM sliders WHERE id = ?', [id], async (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Slider silinirken bir hata oluştu.");
        }

        if (results.length === 0) {
            return res.status(404).send("Slider bulunamadı.");
        }

        const imagePath = path.join(__dirname, '../../public', results[0].imageUrl);

        db.query('DELETE FROM sliders WHERE id = ?', [id], async (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send("Slider silinirken bir hata oluştu.");
            }

            await unlinkAsync(imagePath).catch(err => console.error("Dosya silinirken hata oluştu:", err));

            res.redirect("/ikyonetim/slider-edit");
        });
    });
};

// Slider düzenleme sayfasını göster
exports.sliderEditPage = (req, res) => {
    db.query('SELECT * FROM sliders', (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Slider edit sayfası görüntülenirken bir hata oluştu.");
        }

        // Tarihi dd/mm/yyyy formatına dönüştür
        const formattedSliders = results.map(slider => ({
            ...slider,
            createdAt: slider.createdAt ? new Date(slider.createdAt).toLocaleDateString('tr-TR') : '',
            isActive: slider.isActive ? 1 : 0,
            isMain: slider.isMain ? 1 : 0
        }));

        res.render("admin/slider-edit", { sliders: formattedSliders });
    });
};
