const Sozluk = require("../../models/Sozluk")

// Sözlük listesi
exports.getSozlukList = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 20
    const search = req.query.search || ""
    const harf = req.query.harf || ""
    const kategori = req.query.kategori || ""

    // Filtreleme koşulları
    const filter = { aktif: true }

    if (search) {
      filter.$or = [{ kelime: { $regex: search, $options: "i" } }, { anlam: { $regex: search, $options: "i" } }]
    }

    if (harf) {
      filter.harf = harf
    }

    if (kategori) {
      filter.kategori = kategori
    }

    // Toplam kayıt sayısı
    const totalCount = await Sozluk.countDocuments(filter)

    // Sayfalama hesaplaması
    const totalPages = Math.ceil(totalCount / limit)
    const skip = (page - 1) * limit

    // Verileri getir
    const sozlukler = await Sozluk.find(filter).sort({ kelime: 1 }).skip(skip).limit(limit)

    // Harfleri getir (navigasyon için)
    const harfler = await Sozluk.distinct("harf", { aktif: true })
    harfler.sort()

    // Kategorileri getir
    const kategoriler = await Sozluk.distinct("kategori", { aktif: true })

    res.render("ikyonetim/sozluk-update", {
      sozlukler,
      harfler,
      kategoriler,
      currentPage: page,
      totalPages,
      totalCount,
      search,
      selectedHarf: harf,
      selectedKategori: kategori,
      limit,
    })
  } catch (error) {
    console.error("Sözlük listesi getirme hatası:", error)
    res.status(500).json({ success: false, message: "Sunucu hatası" })
  }
}

// Yeni kelime ekleme sayfası
exports.getAddSozluk = (req, res) => {
  res.render("ikyonetim/sozluk-add")
}

// Yeni kelime ekleme
exports.postAddSozluk = async (req, res) => {
  try {
    const { kelime, anlam, kategori } = req.body

    // Validation
    if (!kelime || !anlam) {
      return res.status(400).json({
        success: false,
        message: "Kelime ve anlam alanları zorunludur",
      })
    }

    // Aynı kelime var mı kontrol et
    const mevcutKelime = await Sozluk.findOne({
      kelime: { $regex: new RegExp(`^${kelime.trim()}$`, "i") },
      aktif: true,
    })

    if (mevcutKelime) {
      return res.status(400).json({
        success: false,
        message: "Bu kelime zaten sözlükte mevcut",
      })
    }

    // Harfi manuel olarak belirle
    const ilkHarf = kelime.trim().charAt(0).toUpperCase()

    const yeniSozluk = new Sozluk({
      kelime: kelime.trim(),
      anlam: anlam.trim(),
      harf: ilkHarf, // Manuel olarak set et
      kategori: kategori?.trim() || "Genel",
      olusturanKullanici: req.session?.user?.displayName || req.session?.user?.username || "Admin",
    })

    await yeniSozluk.save()

    res.json({
      success: true,
      message: "Kelime başarıyla eklendi",
      data: yeniSozluk,
    })
  } catch (error) {
    console.error("Kelime ekleme hatası:", error)
    res.status(500).json({ success: false, message: "Sunucu hatası: " + error.message })
  }
}

// Kelime düzenleme sayfası
exports.getEditSozluk = async (req, res) => {
  try {
    const sozluk = await Sozluk.findById(req.params.id)

    if (!sozluk) {
      return res.status(404).render("main/404")
    }

    res.render("ikyonetim/sozluk-edit", { sozluk })
  } catch (error) {
    console.error("Kelime düzenleme sayfası hatası:", error)
    res.status(500).render("main/404")
  }
}

// Kelime güncelleme
exports.postEditSozluk = async (req, res) => {
  try {
    const { kelime, anlam, kategori, aktif } = req.body

    // Validation
    if (!kelime || !anlam) {
      return res.status(400).json({
        success: false,
        message: "Kelime ve anlam alanları zorunludur",
      })
    }

    // Aynı kelime var mı kontrol et (kendisi hariç)
    const mevcutKelime = await Sozluk.findOne({
      kelime: { $regex: new RegExp(`^${kelime.trim()}$`, "i") },
      _id: { $ne: req.params.id },
      aktif: true,
    })

    if (mevcutKelime) {
      return res.status(400).json({
        success: false,
        message: "Bu kelime zaten sözlükte mevcut",
      })
    }

    // Harfi manuel olarak belirle
    const ilkHarf = kelime.trim().charAt(0).toUpperCase()

    const guncelSozluk = await Sozluk.findByIdAndUpdate(
      req.params.id,
      {
        kelime: kelime.trim(),
        anlam: anlam.trim(),
        harf: ilkHarf, // Manuel olarak set et
        kategori: kategori?.trim() || "Genel",
        aktif: true,
        guncellemeTarihi: new Date(),
      },
      { new: true },
    )

    if (!guncelSozluk) {
      return res.status(404).json({
        success: false,
        message: "Kelime bulunamadı",
      })
    }

    res.json({
      success: true,
      message: "Kelime başarıyla güncellendi",
      data: guncelSozluk,
    })
  } catch (error) {
    console.error("Kelime güncelleme hatası:", error)
    res.status(500).json({ success: false, message: "Sunucu hatası: " + error.message })
  }
}

// Kelime silme
exports.deleteSozluk = async (req, res) => {
  try {
    const sozluk = await Sozluk.findByIdAndDelete(req.params.id)

    if (!sozluk) {
      return res.status(404).json({
        success: false,
        message: "Kelime bulunamadı",
      })
    }

    res.json({
      success: true,
      message: "Kelime kalıcı olarak silindi",
    })
  } catch (error) {
    console.error("Kelime silme hatası:", error)
    res.status(500).json({ success: false, message: "Sunucu hatası: " + error.message })
  }
}


// Toplu işlemler
exports.bulkActions = async (req, res) => {
  try {
    const { action, ids } = req.body

    if (!action || !ids || !Array.isArray(ids)) {
      return res.status(400).json({
        success: false,
        message: "Geçersiz parametreler",
      })
    }

    let result
    switch (action) {
      case "delete":
        result = await Sozluk.deleteMany({ _id: { $in: ids } }) // <-- kalıcı silme
        break
      case "activate":
        result = await Sozluk.updateMany(
          { _id: { $in: ids } },
          { aktif: true, guncellemeTarihi: new Date() }
        )
        break
      case "deactivate":
        result = await Sozluk.updateMany(
          { _id: { $in: ids } },
          { aktif: false, guncellemeTarihi: new Date() }
        )
        break
      default:
        return res.status(400).json({
          success: false,
          message: "Geçersiz işlem",
        })
    }

    res.json({
      success: true,
      message: `${result.deletedCount || result.modifiedCount} kayıt işlendi`,
      count: result.deletedCount || result.modifiedCount,
    })
  } catch (error) {
    console.error("Toplu işlem hatası:", error)
    res.status(500).json({ success: false, message: "Sunucu hatası: " + error.message })
  }
}

