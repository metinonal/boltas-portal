require('dotenv').config();
const mongoose = require('mongoose');
const sql = require('mssql');

const config = {
    db: {
        uri: process.env.DB_URI, // MongoDB bağlantı URI'si
        name: process.env.DB_NAME, // Veritabanı adı
    },
    sessionSecret: process.env.SESSION_SECRET,
    PORT: process.env.PORT || 3000,
};

/// --- SQL Server Ayarları --- ///
const dbConfig = {
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_SERVER,
    database: process.env.MSSQL_DATABASE,
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
    requestTimeout: 30000,      // Sorgu zaman aşımı (ms)
    connectionTimeout: 30000    // Bağlantı zaman aşımı (ms)
};

const connectMSSQL = async () => {
    try {
        await sql.connect(dbConfig);
        console.log("✅ MSSQL bağlantısı başarılı.");
    } catch (err) {
        console.error("❌ MSSQL bağlantı hatası:", err);
    }
};

/// --- MongoDB Ayarları --- ///
const connectMongo = async () => {
    try {
        await mongoose.connect(process.env.DB_URI);
        console.log("✅ MongoDB bağlantısı başarılı.");
    } catch (err) {
        console.error("❌ MongoDB bağlantı hatası:", err);
    }
};

module.exports = {
    config,
    connectMSSQL,
    connectMongo,
    sql
};
