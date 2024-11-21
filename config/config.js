require('dotenv').config();

const config = {
    db: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    },
    
    sessionSecret: process.env.SESSION_SECRET,
    PORT: process.env.PORT || 3000,
};
    

module.exports = config;
