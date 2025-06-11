const Product = require("../../models/Product")
const fs = require("fs")
const path = require("path")

// Admin pazaryeri yönetim sayfası
exports.getMarketplaceAdmin = async (req, res) => {
  try {
    // Bekleyen, onaylanan ve reddedilen ürünleri ayrı ayrı getir
    const pendingProducts = await Product.find({ status: "beklemede" }).sort({ createdAt: -1 })
    const approvedProducts = await Product.find({ status: "onaylandı" }).sort({ createdAt: -1 })
    const rejectedProducts = await Product.find({ status: "reddedildi" }).sort({ createdAt: -1 })

    res.render("ikyonetim/marketplace-admin", {
      title: "Pazaryeri Yönetimi",
      pendingProducts,
      approvedProducts,
      rejectedProducts,
    })
  } catch (err) {
    console.error("Pazaryeri yönetim sayfası getirilirken hata oluştu:", err)
    res.status(500).send("Pazaryeri yönetim sayfası getirilirken bir hata oluştu.")
  }
}

// Ürün onaylama
exports.approveProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.status(404).send("Ürün bulunamadı")
    }

    product.status = "onaylandı"
    product.rejectionReason = "" // Red nedenini temizle
    await product.save()

    res.redirect("/ikyonetim/pazaryeri")
  } catch (err) {
    console.error("Ürün onaylanırken hata oluştu:", err)
    res.status(500).send("Ürün onaylanırken bir hata oluştu.")
  }
}

// Ürün reddetme
exports.rejectProduct = async (req, res) => {
  try {
    const { rejectReason } = req.body

    // Red nedeni zorunlu
    if (!rejectReason || rejectReason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Red nedeni belirtilmesi zorunludur.",
      })
    }

    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Ürün bulunamadı",
      })
    }

    product.status = "reddedildi"
    product.rejectionReason = rejectReason.trim()
    await product.save()

    // AJAX isteği ise JSON döndür
    if (req.headers["content-type"] === "application/json") {
      return res.json({ success: true, message: "Ürün reddedildi." })
    }

    // Normal form isteği ise redirect yap
    res.redirect("/ikyonetim/pazaryeri")
  } catch (err) {
    console.error("Ürün reddedilirken hata oluştu:", err)

    // AJAX isteği ise JSON döndür
    if (req.headers["content-type"] === "application/json") {
      return res.status(500).json({
        success: false,
        message: "Ürün reddedilirken bir hata oluştu.",
      })
    }

    res.status(500).send("Ürün reddedilirken bir hata oluştu.")
  }
}

// Ürün silme
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.status(404).send("Ürün bulunamadı")
    }

    // Ürün resimlerini sil
    if (product.images && product.images.length > 0) {
      product.images.forEach((image) => {
        const imagePath = path.join(__dirname, "../../public", image)
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath)
        }
      })
    }

    await Product.findByIdAndDelete(req.params.id)

    res.redirect("/ikyonetim/pazaryeri")
  } catch (err) {
    console.error("Ürün silinirken hata oluştu:", err)
    res.status(500).send("Ürün silinirken bir hata oluştu.")
  }
}
