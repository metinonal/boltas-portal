const ldap = require("ldapjs");

/**
 * Belirtilen dahili numarasına sahip kullanıcıları LDAP'tan kontrol eder.
 * Eğer birden fazla kullanıcı varsa konsola listeler.
 * 
 * @param {string} dahiliNo Dahili numarası
 */
async function debugDuplicateDahili(dahiliNo) {
  return new Promise((resolve, reject) => {
    const client = ldap.createClient({
      url: "ldap://192.168.200.2:389",
      timeout: 10000,
      connectTimeout: 15000,
    });

    const bindDN = "metin.onal@boltas.com";
    const bindPassword = "Talisca34.";
    const baseDN = "DC=boltas,DC=com";

    client.bind(bindDN, bindPassword, (bindErr) => {
      if (bindErr) {
        console.error("LDAP bind hatası:", bindErr.message);
        client.unbind();
        return reject(bindErr);
      }

      const searchOptions = {
        filter: `(&(objectClass=user)(physicalDeliveryOfficeName=${dahiliNo}))`,
        scope: "sub",
        attributes: ["displayName", "sAMAccountName", "distinguishedName", "userAccountControl"],
      };

      client.search(baseDN, searchOptions, (err, res) => {
        if (err) {
          console.error("LDAP search error:", err.message);
          client.unbind();
          return reject(err);
        }

        const results = [];

        res.on("searchEntry", (entry) => {
          const attrs = {};
          entry.attributes.forEach((attr) => {
            attrs[attr.type] = attr.values;
          });
          results.push(attrs);
        });

        res.on("error", (err) => {
          console.error(`LDAP arama sonuç hatası (Dahili: ${dahiliNo}):`, err.message);
          client.unbind();
          reject(err);
        });

        res.on("end", () => {
          client.unbind();
          if (results.length > 1) {
            console.log(`⚠️ Dahili ${dahiliNo} birden fazla kullanıcıda mevcut:`);
            results.forEach((r) => {
              console.log(`   - ${r.displayName} (${r.sAMAccountName}) | DN: ${r.distinguishedName}`);
            });
          } else if (results.length === 1) {
            console.log(`✔️ Dahili ${dahiliNo} tek kullanıcıda: ${results[0].displayName}`);
          } else {
            console.log(`❌ Dahili ${dahiliNo} hiçbir kullanıcıda bulunamadı.`);
          }
          resolve(results);
        });
      });
    });
  });
}

// Komut satırından dahili numaraları ile çalıştırabilirsiniz
// Örn: node dahiliDuplicateCheck.js 6448 6456 6609
const dahililer = process.argv.slice(2);

(async () => {
  for (const d of dahililer) {
    try {
      await debugDuplicateDahili(d);
    } catch (err) {
      console.error(`Hata oluştu (Dahili: ${d}):`, err.message);
    }
  }
})();
