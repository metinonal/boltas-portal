const { authMain } = require("../../middlewares/authMiddleware")
const { getPersonelZimmet } = require("../../models/userModel")

const mainProfile = async (req, res) => {
  try {
    const user = req.session.user
    const zimmetler = await getPersonelZimmet(user.EMail)
    res.render("main/profile", { user, zimmetler })
  } catch (error) {
    console.error("Profil sayfası hatası:", error)
    res.render("main/profile", { user: req.session.user, zimmetler: [] })
  }
}

module.exports = { mainProfile }
