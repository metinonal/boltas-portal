require('dotenv').config();

const config = {
    db: {
        host: process.env.DB_HOST,       // MySQL sunucu adresi
        user: process.env.DB_USER,       // MySQL kullanıcı adı
        password: process.env.DB_PASSWORD, // MySQL şifre
        database: process.env.DB_NAME    // MySQL veritabanı adı
    },
    sessionSecret: process.env.SESSION_SECRET,
    PORT: process.env.PORT || 3000,
};

module.exports = config;
