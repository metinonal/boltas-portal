const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

// JSON dosyasını okuma
const usersFilePath = path.join(__dirname, '../phone/ADUserExport.json');
const outputDir = path.join(__dirname, '../public/uploads/pphotos');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

let browser;
let page;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function initializeBrowser() {
    browser = await puppeteer.launch({
        headless: false, // Tarayıcı açık kalacak
        args: ['--start-maximized'], // Tam ekran başlatma
    });

    page = await browser.newPage();
    console.log('Tarayıcı başlatıldı, SharePoint ana sayfasına gidiliyor...');

    await page.goto('https://boltas.sharepoint.com/');
    console.log('SharePoint sayfasına gidildi. 30 saniye bekleniyor...');

    // Kullanıcının giriş yapması için 30 saniye bekle
    await sleep(30000);
    console.log('İlk bekleme tamamlandı. Tarayıcı açık kalacak.');
}

async function fetchPhotos() {
    console.log('Profil fotoğrafları çekme işlemi başladı...');

    let users;
    try {
        const rawData = fs.readFileSync(usersFilePath, 'utf-8');
        const sanitizedData = rawData.replace(/\uFEFF/g, ''); // UTF-8 BOM karakterlerini temizle
        users = JSON.parse(sanitizedData);
    } catch (error) {
        console.error('JSON dosyası okunurken veya parse edilirken bir hata oluştu:', error.message);
        return;
    }

    const filteredUsers = users.filter(user => {
        return (
            (user.userAccountControl === 512 || user.userAccountControl === 66048) &&
            user.Mobile &&
            user.msExchHideFromAddressLists === null &&
            user.Mobile.startsWith('+90') // Telefon numarası +90 ile başlamalı
        );
    });

    for (const user of filteredUsers) {
        if (!user.mail) {
            console.warn(`Kullanıcının mail adresi bulunamadı: ${JSON.stringify(user)}`);
            continue;
        }

        const photoUrl = `https://boltas.sharepoint.com/_layouts/15/userphoto.aspx?size=L&accountname=${user.mail}`;
        console.log(`Profil fotoğrafı URL'si: ${photoUrl}`);

        try {
            const photoPage = await browser.newPage();
            await photoPage.goto(photoUrl, { waitUntil: 'networkidle2' });

            const imageBuffer = await photoPage.evaluate(() => {
                return fetch(document.location.href)
                    .then(res => res.arrayBuffer())
                    .then(buffer => Array.from(new Uint8Array(buffer)));
            });

            const outputPath = path.join(outputDir, `${user.mail}.jpg`);
            fs.writeFileSync(outputPath, Buffer.from(imageBuffer));
            console.log(`Fotoğraf kaydedildi: ${outputPath}`);

            await photoPage.close();
        } catch (error) {
            console.error(`Hata oluştu: ${user.mail}`, error.message);
        }
    }

    console.log('Tüm resimler çekildi.');
}

(async () => {
    console.log('Servis başlatılıyor...');
    await initializeBrowser(); // Tarayıcıyı başlat ve ilk işlemleri yap

    // Resim çekme işlemini 6 saatte bir çalıştır
    cron.schedule('0 */6 * * *', async () => {
        console.log('6 saatlik zamanlayıcı tetiklendi. Resimler çekiliyor...');
        await fetchPhotos();
    });

    // İlk resim çekme işlemini başlat
    await fetchPhotos();
})();
