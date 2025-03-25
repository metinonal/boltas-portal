require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const qs = require('qs');
const libqp = require('libqp');

// JSON'daki UTF-8 Türkçe karakterleri için quoted-printable encode
const encodeQuotedPrintableFull = (str) => {
    return Buffer.from(str, 'utf8')
        .toString('hex')               // örnek: '53656c696d20c59ec4b0'
        .match(/.{1,2}/g)              // 2'li gruplara ayır: ['53','65',...]
        .map(byte => `=${byte.toUpperCase()}`) // her biri =XX formatına dönsün
        .join('');
};


// TELEFON REHBERİ GÖRÜNTÜLEME
const getPhoneDirectory = (req, res) => {
    const filePath = path.join(process.cwd(), 'phone', 'ADUserExport.json');

    if (!fs.existsSync(filePath)) {
        console.error('Dosya bulunamadı:', filePath);
        return res.status(404).send('JSON dosyası bulunamadı.');
    }

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Dosya okuma hatası:', err);
            return res.status(500).send('JSON dosyası okunamadı.');
        }

        const sanitizedData = data.replace(/^﻿/, '');

        try {
            const users = JSON.parse(sanitizedData);

            const filteredUsers = users.filter(user => {
                return (
                    (user.userAccountControl === 512 || user.userAccountControl === 66048) &&
                    user.Mobile &&
                    user.msExchHideFromAddressLists === null &&
                    user.Mobile.startsWith('+90')
                );
            });

            const formattedUsers = filteredUsers.map(user => ({
                DisplayName: user.DisplayName,
                mail: user.mail,
                Mobile: user.Mobile,
                physicalDeliveryOfficeName: user.physicalDeliveryOfficeName,
                userAccountControl: user.userAccountControl
            }));

            res.render('main/telefon-rehberi', {
                users: formattedUsers,
                fs
            });
        } catch (parseError) {
            console.error('JSON parse hatası:', parseError.message);
            console.error('Hatalı JSON içeriği:', sanitizedData);
            res.status(500).send('JSON parse edilirken bir hata oluştu.');
        }
    });
};

// VCF OLUŞTURMA VE MAIL GÖNDERME
const sendVcf = (req, res) => {
    const filePath = path.join(process.cwd(), 'phone', 'ADUserExport.json');

    if (!fs.existsSync(filePath)) {
        return res.status(404).send('JSON dosyası bulunamadı.');
    }

    fs.readFile(filePath, 'utf8', async (err, data) => {
        if (err) return res.status(500).send('Dosya okuma hatası.');

        const sanitizedData = data.replace(/^﻿/, '');

        try {
            const users = JSON.parse(sanitizedData);
            const filteredUsers = users.filter(user =>
                (user.userAccountControl === 512 || user.userAccountControl === 66048) &&
                user.Mobile &&
                user.msExchHideFromAddressLists === null &&
                user.Mobile.startsWith('+90')
            );

            const vcfData = filteredUsers.map(user => {
                const nameEncoded = encodeQuotedPrintableFull(user.DisplayName || 'Bilinmeyen');
                const mobile = user.Mobile.replace(/^\+90/, '0').replace(/\s+/g, '');

                return `BEGIN:VCARD
VERSION:2.1
N;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:;${nameEncoded};;;
FN;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:${nameEncoded}
TEL;CELL:${mobile}
END:VCARD`;
            }).join('\n');

            // Klasör varsa kontrol et
            const phoneFolderPath = path.join(process.cwd(), 'phone');
            if (!fs.existsSync(phoneFolderPath)) {
                fs.mkdirSync(phoneFolderPath);
            }

            const vcfPath = path.join(phoneFolderPath, 'contacts.vcf');
            fs.writeFileSync(vcfPath, vcfData); // VCF sadece yazılıyor

            // E-posta bilgileri
            const emailPrefix = req.body.emailPrefix.trim();
            const Mail_Kime = `${emailPrefix}@boltas.com`;
            const Mail_Baslik = 'Telefon Rehberi Dosyanız';
            const Mail_Icerik = `
                <p>Merhaba,</p>
                <p>Telefon rehberinize ait .vcf dosyası sistemde oluşturulmuştur.</p>
                <p>Lütfen <strong>portaldaki telefon rehberi</strong> sekmesinden dosyayı indiriniz.</p>
                <p>İyi çalışmalar.</p>
            `;


            // API'ye sadece bu 3 veriyi POST et
            const response = await axios.post(
                'http://irp.boltas.com/API/MAIL/api.php',
                qs.stringify({
                    Mail_Kime,
                    Mail_Baslik,
                    Mail_Icerik,
                    secret: process.env.MAIL_SECRET_KEY
                }),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );
            
            console.log("VCF dosyası,", Mail_Kime, "adresine gönderildi.");                        

            res.redirect('/telefon-rehberi');
        } catch (err) {
            console.error('VCF oluşturma ya da mail gönderme hatası:', err);
            res.status(500).send('Bir hata oluştu.');
        }
    });
};

module.exports = {
    getPhoneDirectory,
    sendVcf
};
