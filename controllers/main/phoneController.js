const fs = require('fs');
const path = require('path');

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

            // fs modülünü EJS'de kullanılabilir hale getirin
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

module.exports = {
    getPhoneDirectory
};
