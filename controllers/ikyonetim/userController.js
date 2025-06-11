const User = require("../../models/User")

exports.getUserManagement = async (req, res) => {
  try {
    res.render("ikyonetim/user-management")
  } catch (error) {
    res.status(500).send("Hata oluştu")
  }
}

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({})
    res.json({ success: true, users: users })
  } catch (error) {
    res.json({ success: false })
  }
}

exports.updateUserRole = async (req, res) => {
  try {
    const { userId, role } = req.body
    await User.findByIdAndUpdate(userId, { roles: [role] }, { new: true })
    res.json({ success: true })
  } catch (error) {
    res.json({ success: false })
  }
}
