const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const session = require("express-session");
const path = require("path");
const indexRoutes = require('./routes/main/indexRoutes'); // İndex Rotası
const currencyRoutes = require('./routes/main/currencyRoutes'); //Döviz Rotası

// Görüntü motorunun tercihi
app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));

// Statik dosyaların projeye dahil edilmesi
app.use(express.static('public'));
app.use(express.static('node_modules'));

// Body parser Middleware'i
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/', currencyRoutes);
app.use('/', indexRoutes);

app.listen(3000, function (err) {
    if (err) {
        return console.log("An error occurred:", err);
    }
    console.log("The server is running on http://localhost:3000 ");
});