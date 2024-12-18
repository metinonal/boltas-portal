require('dotenv').config();

const config = {
    db: {
        uri: process.env.DB_URI, // MongoDB bağlantı URI'si
        name: process.env.DB_NAME, // Veritabanı adı
    },
    sessionSecret: process.env.SESSION_SECRET,
    PORT: process.env.PORT || 3000,
};

module.exports = config;
