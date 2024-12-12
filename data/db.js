const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB bağlantısı başarılı');
    } catch (err) {
        console.error('MongoDB bağlantı hatası:', err);
        process.exit(1);
    }
};

module.exports = connectDB;
