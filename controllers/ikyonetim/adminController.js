const Settings = require("../../models/Settings")

exports.getAdminPanel = async (req, res) => {
  try {
    // Ayarları getir
    const settingsData = await Settings.find({})
    const settings = {}

    settingsData.forEach((setting) => {
      settings[setting.key] = setting.value
    })

    res.render("ikyonetim/index", {
      title: "Admin Paneli",
      settings: settings,
    })
  } catch (err) {
    console.error("Admin paneli görüntülenirken bir hata oluştu:", err)
    res.status(500).send("Admin paneli görüntülenirken bir hata oluştu.")
  }
}

exports.updateSetting = async (req, res) => {
  try {
    const { key, value } = req.body
    const updatedBy = req.session.user.displayName || req.session.user.email

    await Settings.findOneAndUpdate(
      { key: key },
      {
        value: value,
        updatedBy: updatedBy,
        updatedAt: new Date(),
      },
      { upsert: true, new: true },
    )

    res.json({ success: true, message: "Ayar başarıyla güncellendi" })
  } catch (error) {
    console.error("Ayar güncellenirken hata:", error)
    res.status(500).json({ success: false, message: "Ayar güncellenirken hata oluştu" })
  }
}
