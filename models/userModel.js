const { sql } = require("../config/config")
const ldap = require("ldapjs")
require("dotenv").config()

const getUserByEmail = async (email) => {
  const request = new sql.Request()
  request.input("email", sql.NVarChar, email)

  try {
    const result = await request.query("SELECT * FROM vHROrganizationFromOrtakIK_ALL WHERE EMail = @email")
    return result.recordset[0]
  } catch (err) {
    console.error("MSSQL sorgu hatası:", err)
    return null
  }
}

const getPersonelZimmet = async (email) => {
  const request = new sql.Request()
  request.input("email", sql.NVarChar, email)

  try {
    const result = await request.query(`
      SELECT 
        Ürün,
        Marka,
        Model,
        SeriNo,
        Imei1,
        PersonelMail,
        CASE 
          WHEN ISDATE(ZimmetTarihi) = 1 THEN CONVERT(datetime, ZimmetTarihi, 104)
          ELSE NULL
        END AS ZimmetTarihi
      FROM [dbo].[v_PersonelZimmet]
      WHERE PersonelMail = @email
    `)
    return result.recordset
  } catch (err) {
    console.error("MSSQL zimmet sorgu hatası:", err)
    return []
  }
}

// LDAP'tan kullanıcı bilgilerini çeken yeni fonksiyon
const getUserFromLDAP = async (email, authenticatedUsername, password) => {
  return new Promise((resolve, reject) => {
    const client = ldap.createClient({
      url: process.env.MSSQL_URL,
      timeout: 10000,
      connectTimeout: 15000,
      reconnect: false,
    })

    client.on("error", (err) => {
      console.error("LDAP bağlantı hatası:", err.message)
      reject(err)
    })

    // Authenticated user ile bağlan (anonymous değil)
    client.bind(authenticatedUsername, password, (bindErr) => {
      if (bindErr) {
        console.error("LDAP bind hatası:", bindErr.message)
        client.unbind()
        reject(bindErr)
        return
      }

      console.log("LDAP bind başarılı, kullanıcı aranıyor:", email)

      const searchOptions = {
        filter: `(|(mail=${email})(userPrincipalName=${email})(sAMAccountName=${email.split("@")[0]}))`,
        scope: "sub",
        attributes: [
          "cn",
          "displayName",
          "givenName",
          "sn",
          "mail",
          "userPrincipalName",
          "sAMAccountName",
          "telephoneNumber",
          "mobile",
          "department",
          "title",
          "employeeID",
          "employeeNumber",
          "manager",
          "company",
          "physicalDeliveryOfficeName",
          "distinguishedName",
          "memberOf",
          "whenCreated",
          "streetAddress",
          "l", // city
          "st", // state
          "postalCode",
          "co", // country
        ],
        sizeLimit: 1,
      }

      client.search(process.env.LDAP_BASE_DN, searchOptions, (searchErr, searchRes) => {
        if (searchErr) {
          console.error("LDAP arama hatası:", searchErr.message)
          client.unbind()
          reject(searchErr)
          return
        }

        let userFound = false
        let userData = null

        searchRes.on("searchEntry", (entry) => {
          try {
            userFound = true

            // entry.object yerine entry.attributes kullanarak daha güvenli erişim
            const attributes = {}

            if (entry.attributes && Array.isArray(entry.attributes)) {
              entry.attributes.forEach((attr) => {
                if (attr && attr.type) {
                  // Tek değerli alanlar için ilk değeri al, çok değerli alanlar için array olarak bırak
                  if (attr.vals && attr.vals.length > 0) {
                    if (attr.type === "memberOf" && attr.vals.length > 1) {
                      attributes[attr.type] = attr.vals
                    } else {
                      attributes[attr.type] = attr.vals[0]
                    }
                  }
                }
              })
            } else if (entry.object) {
              // Fallback: entry.object kullan
              Object.assign(attributes, entry.object)
            }

            // Manager bilgisini temizle (sadece CN kısmını al)
            let managerName = ""
            if (attributes.manager) {
              const managerMatch = attributes.manager.match(/CN=([^,]+)/)
              managerName = managerMatch ? managerMatch[1] : attributes.manager
            }

            // LDAP verilerini MSSQL formatına uygun şekilde dönüştür
            userData = {
              displayName:
                attributes.displayName ||
                attributes.cn ||
                `${attributes.givenName || ""} ${attributes.sn || ""}`.trim() ||
                attributes.sAMAccountName ||
                "Bilinmeyen Kullanıcı",
              Adi: attributes.givenName || "",
              Soyadi: attributes.sn || "",
              EMail: attributes.mail,
              Departman: attributes.department || "",
              Unvan: attributes.title || "",
              CepTelefonu: attributes.mobile,
              Organizasyon: attributes.company || "",
              DahiliNumarasi: attributes.physicalDeliveryOfficeName || "",
              RaporlandigiYonetici: managerName,
              RaporlandigiYoneticiEMail: null,
              UstOrganizasyon: null,
            }

          } catch (entryError) {
            console.error("LDAP entry işleme hatası:", entryError)
            console.log("Entry object:", entry)
          }
        })

        searchRes.on("error", (err) => {
          console.error("LDAP arama sonuç hatası:", err.message)
          client.unbind()
          reject(err)
        })

        searchRes.on("end", (result) => {
          client.unbind()

          if (userFound && userData) {
            resolve(userData)
          } else {
            console.log("Kullanıcı LDAP'ta bulunamadı:", email)
            resolve(null)
          }
        })
      })
    })

    // Timeout için güvenlik
    setTimeout(() => {
      try {
        client.unbind()
      } catch (e) {
        // Ignore
      }
      reject(new Error("LDAP sorgusu zaman aşımına uğradı"))
    }, 15000)
  })
}

module.exports = { getUserByEmail, getPersonelZimmet, getUserFromLDAP }
