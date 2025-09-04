const ldap = require("ldapjs")
require("dotenv").config()
const { getUserFromLDAP } = require("../../models/userModel") // LDAP fonksiyonunu import et
const RoleModel = require("../../models/User") // MongoDB'deki roller

const loginPage = (req, res) => {
  if (req.session && req.session.authenticated) {
    return res.redirect("/") // Giriş yapılmışsa ana sayfaya gönder
  }
  return res.render("main/login")
}

const authenticate = async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).send("Kullanıcı adı ve şifre zorunludur.")
  }

  // Kullanıcı adını farklı formatlarda hazırla
  let loginUsername = username
  let searchEmail = username

  // Eğer @ içermiyorsa domain ekle
  if (!username.includes("@")) {
    loginUsername = username + process.env.LDAP_UPN_SUFFIX
    searchEmail = loginUsername
  }


  const client = ldap.createClient({
    url: process.env.MSSQL_URL,
    timeout: 10000,
    connectTimeout: 15000,
    reconnect: false,
  })

  client.on("error", (err) => {
    console.error("LDAP Client Hatası:", err.message)
  })

  // İlk olarak verilen kullanıcı adı ile dene
  client.bind(loginUsername, password, async (err) => {
    if (err) {
      console.error(`LDAP hatası (${loginUsername}):`, err.message)

      // Alternatif format dene: DOMAIN\username
      if (!username.includes("\\") && !username.includes("@")) {
        const domainUsername = `${process.env.LDAP_DOMAIN_NETBIOS}\\${username}`

        client.bind(domainUsername, password, async (domainErr) => {
          if (domainErr) {
            console.error(`LDAP hatası (${domainUsername}):`, domainErr.message)
            client.unbind()
            return res.render("main/login", { error: "Email veya şifre hatalı." })
          }

          await handleSuccessfulAuth(client, searchEmail, domainUsername, password, req, res)
        })
      } else {
        client.unbind()
        return res.render("main/login", { error: "Email veya şifre hatalı." })
      }
    } else {
      // console.log("LDAP authentication başarılı:", loginUsername)
      await handleSuccessfulAuth(client, searchEmail, loginUsername, password, req, res)
    }
  })
}

const handleSuccessfulAuth = async (client, searchEmail, authenticatedUsername, password, req, res) => {
  try {
    // Client'ı kapat, yeni bir bağlantı açacağız
    client.unbind()


    // 1. LDAP'tan kullanıcı bilgilerini al
    const user = await getUserFromLDAP(searchEmail, authenticatedUsername, password)

    if (!user) {
      console.log("Kullanıcı LDAP'ta bulunamadı:", searchEmail)
      return res.status(404).send("Kullanıcı LDAP veritabanında bulunamadı.")
    }


    // 2. MongoDB'den rollerini al
    let mongoUser = await RoleModel.findOne({ email: user.EMail })

    // Eğer MongoDB'de yoksa otomatik oluştur
    if (!mongoUser) {
      console.log("MongoDB'de kullanıcı bulunamadı, oluşturuluyor:", user.EMail)
      mongoUser = await RoleModel.create({ email: user.EMail, roles: ["member"] })
    }

    // 3. Session'a LDAP kullanıcı bilgisi ve roller yaz
    req.session.authenticated = true
    req.session.user = {
      displayName: user.displayName,
      Adi: user.Adi,
      Soyadi: user.Soyadi,
      Organizasyon: user.Organizasyon,
      Departman: user.Departman,
      Unvan: user.Unvan,
      EMail: user.EMail,
      RaporlandigiYonetici: user.RaporlandigiYonetici,
      RaporlandigiYoneticiEMail: user.RaporlandigiYoneticiEMail,
      UstOrganizasyon: user.UstOrganizasyon,
      OgrenimSeviyesi: user.OgrenimSeviyesi,
      PersonelinKullandigiDil: user.PersonelinKullandigiDil,
      CepTelefonu: user.CepTelefonu,
      DahiliNumarasi: user.DahiliNumarasi,
    }

    req.session.roles = mongoUser.roles // MongoDB'den gelen roller
    req.session.lastAccessTime = Date.now()

    return res.redirect("/")
  } catch (error) {
    console.error("Kullanıcı bilgileri alınırken hata:", error)
    return res.status(500).send("Kullanıcı bilgileri alınırken bir hata oluştu: " + error.message)
  }
}

const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error("Session silme hatası:", err)
    res.redirect("/login")
  })
}

module.exports = { loginPage, authenticate, logout }
