const { sql } = require("../config/config")

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
    const result = await request.query("SELECT * FROM [dbo].[v_PersonelZimmet] WHERE PersonelMail = @email")
    return result.recordset
  } catch (err) {
    console.error("MSSQL zimmet sorgu hatası:", err)
    return []
  }
}

module.exports = { getUserByEmail, getPersonelZimmet }
