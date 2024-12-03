const { MongoClient } = require("mongodb");
const config = require("../config/config");

let db;

async function connectDB() {
    try {
        const client = new MongoClient(config.db.uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        db = client.db(config.db.name);
        console.log("MongoDB bağlantısı yapıldı");
    } catch (err) {
        console.error("MongoDB bağlantı hatası:", err);
    }
}

connectDB();

module.exports = {
    getDb: () => db
};
