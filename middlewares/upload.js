const multer = require('multer');
const path = require('path');

// Dosyanın nereye kaydedileceğini ve dosya adını belirle
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/'); // Dosyaların kaydedileceği klasör
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext); // Benzersiz bir dosya adı oluştur
    }
});

// Dosya türü kontrolü
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Yalnızca resim dosyaları yüklenebilir!'), false);
    }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
