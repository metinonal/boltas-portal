const Sozluk = require("../../models/Sozluk")

// Ana sözlük sayfası
exports.getSozluk = async (req, res) => {
  try {
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

    // Verileri getir
    const sozlukler = await Sozluk.find(filter).sort({ kelime: 1 }).limit(100)

    let harfler = await Sozluk.distinct("harf", { aktif: true })

    // Boş veya null harfleri filtrele
    harfler = harfler.filter((h) => h && h.trim() !== "")

    // Türkçe alfabetik sıralama
    const turkceAlfabe = [
      "A",
      "B",
      "C",
      "Ç",
      "D",
      "E",
      "F",
      "G",
      "Ğ",
      "H",
      "I",
      "İ",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
      "Ö",
      "P",
      "R",
      "S",
      "Ş",
      "T",
      "U",
      "Ü",
      "V",
      "Y",
      "Z",
    ]

    harfler.sort((a, b) => {
      const indexA = turkceAlfabe.indexOf(a)
      const indexB = turkceAlfabe.indexOf(b)

      if (indexA === -1 && indexB === -1) return a.localeCompare(b, "tr")
      if (indexA === -1) return 1
      if (indexB === -1) return -1

      return indexA - indexB
    })

    console.log("Bulunan harfler:", harfler) // Debug için

    // Kategorileri getir
    const kategoriler = await Sozluk.distinct("kategori", { aktif: true })

    // İstatistikler
    const toplamKelime = await Sozluk.countDocuments({ aktif: true })
    const toplamHarf = harfler.length
    const toplamKategori = kategoriler.length

    res.render("main/sozluk", {
      sozlukler,
      harfler,
      kategoriler,
      search,
      selectedHarf: harf,
      selectedKategori: kategori,
      toplamKelime,
      toplamHarf,
      toplamKategori,
    })
  } catch (error) {
    console.error("Sözlük sayfası hatası:", error)
    res.status(500).render("main/404")
  }
}

// AJAX ile kelime arama
exports.searchSozluk = async (req, res) => {
  try {
    const { search, harf, kategori } = req.query

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

    const sozlukler = await Sozluk.find(filter).sort({ kelime: 1 }).limit(100)

    res.json({
      success: true,
      data: sozlukler,
      count: sozlukler.length,
    })
  } catch (error) {
    console.error("Sözlük arama hatası:", error)
    res.status(500).json({ success: false, message: "Arama hatası" })
  }
}
