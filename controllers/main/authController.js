const ldap = require('ldapjs');
require('dotenv').config();
const { getUserByEmail } = require('../../models/userModel');
const RoleModel = require('../../models/User'); // MongoDB'deki roller

const loginPage = (req, res) => {
  if (req.session && req.session.authenticated) {
    return res.redirect('/'); // Giriş yapılmışsa ana sayfaya gönder
  }
  return res.render('main/login');
};

const authenticate = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send('Kullanıcı adı ve şifre zorunludur.');
  }

  const client = ldap.createClient({
    url: process.env.LDAP_URL,
  });

  client.bind(username, password, async (err) => {
    if (err) {
      console.error(`LDAP hatası (${username}):`, err.message);
      return res.render('main/login', { error: 'Email veya şifre hatalı.' });
    }

    client.unbind();

    // 1. MSSQL'den kullanıcıyı al
    const user = await getUserByEmail(username);

    if (!user) {
      return res.status(404).send('Kullanıcı MSSQL veritabanında bulunamadı.');
    }

    // 2. MongoDB'den rollerini al
    let mongoUser = await RoleModel.findOne({ email: username });

    // Eğer MongoDB'de yoksa otomatik oluştur
    if (!mongoUser) {
      mongoUser = await RoleModel.create({ email: username, roles: ['member'] });
    }

    // 3. Session’a MSSQL kullanıcı bilgisi ve roller yaz
    req.session.authenticated = true;
    req.session.user = { // MSSQL'den gelen tüm kullanıcı bilgisi
      displayName: `${user.Adi} ${user.Soyadi}`,
      Adi: user.Adi,
      Soyadi: user.Soyadi,
      SicilNo: user.SicilNo,
      DogumTarihi: user.DogumTarihi,
      Cinsiyet: user.Cinsiyet,
      YakaRengi: user.YakaRengi,
      IsYeriGirisTarihi: user.IsYeriGirisTarihi,
      Organizasyon: user.Organizasyon,
      Departman: user.Departman,
      UnvanGrubu: user.UnvanGrubu,
      Unvan: user.Unvan,
      EMail: user.EMail,
      IsyeriKodu: user.IsyeriKodu,
      IsyeriKisaAdi: user.IsyeriKisaAdi,
      RaporlandigiYonetici: user.RaporlandigiYonetici,
      RaporlandigiYoneticiEMail: user.RaporlandigiYoneticiEMail,
      UstOrganizasyon: user.UstOrganizasyon,
      OgrenimSeviyesi: user.OgrenimSeviyesi,
      PersonelinKullandigiDil: user.PersonelinKullandigiDil,
      CepTelefonu: user.CepTelefonu,
      LOKASYON: user.LOKASYON
    }; 
               
    req.session.roles = mongoUser.roles; // MongoDB'den gelen roller
    req.session.lastAccessTime = Date.now();

    return res.redirect('/');
  });
};

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error("Session silme hatası:", err);
    res.redirect('/login');
  });
};

module.exports = { loginPage, authenticate, logout };
