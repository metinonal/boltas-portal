const mysql = require('mysql2');
const config = require('../config/config');

const connection = mysql.createConnection({
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
});

connection.connect((err) => {
    if (err) {
        console.error("MySQL bağlantı hatası:", err);
        process.exit(1);
    } else {
        console.log("MySQL bağlantısı başarılı.");
    }
});

module.exports = connection;
