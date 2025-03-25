const { ConfidentialClientApplication } = require("@azure/msal-node");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const config = {
  auth: {
    clientId: "3f3de26d-20b6-45f2-aa6b-c8874327eb21",
    authority: "https://login.microsoftonline.com/a1b1e336-3d52-4767-8dc6-00efcd0b1dd9",
    clientSecret: "Qof8Q~ZpjP99dcQAEBzNASl1ePRn57gatkPkDbDm",
  },
};

const clientApp = new ConfidentialClientApplication(config);

async function getAccessToken() {
  try {
    const authResponse = await clientApp.acquireTokenByClientCredential({
      scopes: ["https://graph.microsoft.com/.default"],
    });
    return authResponse.accessToken;
  } catch (error) {
    console.error("Access Token Hatası:", error);
    throw error;
  }
}

async function getAllUsers() {
  const token = await getAccessToken();
  let url = "https://graph.microsoft.com/v1.0/users";
  let allUsers = [];

  try {
    while (url) {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      allUsers = allUsers.concat(
        response.data.value.map((user) => ({
          id: user.id,
          email: user.mail || user.userPrincipalName,
        }))
      );

      url = response.data["@odata.nextLink"] || null;
    }
    return allUsers;
  } catch (error) {
    console.error("Kullanıcı Verileri Hatası:", error);
    return [];
  }
}

async function downloadProfilePhoto(userId, email, token) {
  const url = `https://graph.microsoft.com/v1.0/users/${userId}/photo/$value`;
  const fileName = `${email}.png`.replace(/[\/\\:*?"<>|]/g, "");
  const filePath = path.join(__dirname, "../public/uploads/pphotos", fileName); // Yeni kayıt yolu

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: "arraybuffer",
    });

    fs.writeFileSync(filePath, response.data);
    // console.log(`Profil fotoğrafı kaydedildi: ${fileName}`);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      // console.log(`Profil fotoğrafı bulunamadı (${email}).`);
    } else {
      // console.error(`Profil fotoğrafı indirilemedi (${email}):`, error.message);
    }
  }
}

async function downloadAllProfilePhotos() {
  const folderPath = path.join(__dirname, "../public/uploads/pphotos");

  // Eğer klasör yoksa oluştur
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const token = await getAccessToken();
  const users = await getAllUsers();

  for (const user of users) {
    if (user.email) {
      // console.log(`Profil fotoğrafı indiriliyor: ${user.email}`);
      await downloadProfilePhoto(user.id, user.email, token);
    } else {
      console.log(`E-posta bulunamadı: ${user.id}`);
    }
  }
}

module.exports = {
  downloadAllProfilePhotos,
};
