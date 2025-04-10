const bilgiBankasi = require('../models/bilgiBankasi');

module.exports = async (req, res, next) => {
    try {
        const aktifBilgiler = await bilgiBankasi.find({ isActive: true });
        res.locals.bilgiTopbar = aktifBilgiler;
        next();
    } catch (err) {
        console.error('Bilgi middleware hatası:', err);
        res.locals.bilgiTopbar = [];
        next();
    }
};
