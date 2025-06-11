const Product = require("../../models/Product")
const User = require("../../models/User")
const fs = require("fs")
const path = require("path")

// Tüm onaylı ürünleri getir (filtreleme, sıralama ve pagination ile)
exports.getAllProducts = async (req, res) => {
  try {
    // Kullanıcının pazaryeri şartlarını kabul edip etmediğini kontrol et
    const userEmail =
      req.session.user.EMail || req.session.user.email || req.session.user.mail || req.session.user.username
    let user = await User.findOne({ email: userEmail })

    if (!user) {
      // Kullanıcı yoksa oluştur
      user = new User({
        email: userEmail,
        marketplaceTermsAccepted: false,
      })
      await user.save()
    }

    // Sayfalama parametreleri
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 12
    const skip = (page - 1) * limit

    // Filtreleme parametreleri - sadece aktif, satılmamış ve süresi dolmamış ürünler
    const filters = {
      status: "onaylandı",
      isActive: true,
      isSold: false,
      expiresAt: { $gt: new Date() },
    }

    // Durum filtresi
    if (req.query.conditions && req.query.conditions.length > 0) {
      const conditions = Array.isArray(req.query.conditions) ? req.query.conditions : [req.query.conditions]
      filters.condition = { $in: conditions }
    }

    // Konum filtresi
    if (req.query.location) {
      const location = req.query.location

      // "Diğer" seçeneği seçildiyse, ana şehirler dışındaki konumları dahil et
      if (location === "Diğer") {
        const mainCities = ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya"]
        filters.location = { $nin: mainCities }
      }
      // "Tümü" seçeneği seçilmediyse, seçilen konumu filtrele
      else if (location !== "Tümü") {
        filters.location = location
      }
    }

    // Arama filtresi
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i")
      filters.$or = [{ title: searchRegex }, { description: searchRegex }]
    }

    // Sıralama parametresi
    let sortOption = { createdAt: -1 } // Varsayılan: En yeni

    if (req.query.sort) {
      switch (req.query.sort) {
        case "newest":
          sortOption = { createdAt: -1 }
          break
        case "oldest":
          sortOption = { createdAt: 1 }
          break
        case "price-asc":
          sortOption = { price: 1 }
          break
        case "price-desc":
          sortOption = { price: -1 }
          break
        case "name-asc":
          sortOption = { title: 1 }
          break
        case "name-desc":
          sortOption = { title: -1 }
          break
      }
    }

    // Toplam ürün sayısını al
    const totalProducts = await Product.countDocuments(filters)
    const totalPages = Math.ceil(totalProducts / limit)

    // Ürünleri getir
    const products = await Product.find(filters).sort(sortOption).skip(skip).limit(limit)

    const filterParams = {
      minPrice: req.query.minPrice || 0,
      maxPrice: req.query.maxPrice || 10000,
      conditions: req.query.conditions || [],
      location: req.query.location || "Tümü",
    }

    // API isteği mi yoksa sayfa isteği mi kontrol et
    if (req.xhr || req.query.format === "json") {
      // API isteği - JSON yanıtı döndür
      return res.json({
        products,
        pagination: {
          page,
          limit,
          totalProducts,
          totalPages,
        },
      })
    }

    // Normal sayfa isteği - HTML sayfasını render et
    res.render("main/marketplace/index", {
      title: "Pazaryeri",
      products,
      pagination: {
        page,
        limit,
        totalProducts,
        totalPages,
      },
      filters: filterParams,
      sort: req.query.sort || "newest",
      search: req.query.search || "",
      termsAccepted: user.marketplaceTermsAccepted,
    })
  } catch (err) {
    console.error("Ürünler getirilirken hata oluştu:", err)
    res.status(500).send("Ürünler getirilirken bir hata oluştu.")
  }
}

// Pazaryeri şartlarını kabul etme
exports.acceptTerms = async (req, res) => {
  try {
    const userEmail =
      req.session.user.EMail || req.session.user.email || req.session.user.mail || req.session.user.username

    await User.findOneAndUpdate({ email: userEmail }, { marketplaceTermsAccepted: true }, { upsert: true })

    res.json({ success: true })
  } catch (err) {
    console.error("Şartlar kabul edilirken hata oluştu:", err)
    res.status(500).json({ success: false, message: "Bir hata oluştu." })
  }
}

// Kategoriye göre ürünleri getir (filtreleme, sıralama ve pagination ile)
exports.getProductsByCategory = async (req, res) => {
  try {
    const category = req.params.category

    // Kullanıcının pazaryeri şartlarını kabul edip etmediğini kontrol et
    const userEmail =
      req.session.user.EMail || req.session.user.email || req.session.user.mail || req.session.user.username
    let user = await User.findOne({ email: userEmail })

    if (!user) {
      user = new User({
        email: userEmail,
        marketplaceTermsAccepted: false,
      })
      await user.save()
    }

    // Sayfalama parametreleri
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 12
    const skip = (page - 1) * limit

    // Filtreleme parametreleri
    const filters = {
      category,
      status: "onaylandı",
      isActive: true,
      isSold: false,
      expiresAt: { $gt: new Date() },
    }

    // Durum filtresi
    if (req.query.conditions && req.query.conditions.length > 0) {
      const conditions = Array.isArray(req.query.conditions) ? req.query.conditions : [req.query.conditions]
      filters.condition = { $in: conditions }
    }

    // Konum filtresi
    if (req.query.location) {
      const location = req.query.location

      // "Diğer" seçeneği seçildiyse, ana şehirler dışındaki konumları dahil et
      if (location === "Diğer") {
        const mainCities = ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya"]
        filters.location = { $nin: mainCities }
      }
      // "Tümü" seçeneği seçilmediyse, seçilen konumu filtrele
      else if (location !== "Tümü") {
        filters.location = location
      }
    }

    // Arama filtresi
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, "i")
      filters.$or = [{ title: searchRegex }, { description: searchRegex }]
    }

    // Sıralama parametresi
    let sortOption = { createdAt: -1 } // Varsayılan: En yeni

    if (req.query.sort) {
      switch (req.query.sort) {
        case "newest":
          sortOption = { createdAt: -1 }
          break
        case "oldest":
          sortOption = { createdAt: 1 }
          break
        case "price-asc":
          sortOption = { price: 1 }
          break
        case "price-desc":
          sortOption = { price: -1 }
          break
        case "name-asc":
          sortOption = { title: 1 }
          break
        case "name-desc":
          sortOption = { title: -1 }
          break
      }
    }

    // Toplam ürün sayısını al
    const totalProducts = await Product.countDocuments(filters)
    const totalPages = Math.ceil(totalProducts / limit)

    // Ürünleri getir
    const products = await Product.find(filters).sort(sortOption).skip(skip).limit(limit)

    const filterParams = {
      minPrice: req.query.minPrice || 0,
      maxPrice: req.query.maxPrice || 10000,
      conditions: req.query.conditions || [],
      location: req.query.location || "Tümü",
    }

    // API isteği mi yoksa sayfa isteği mi kontrol et
    if (req.xhr || req.query.format === "json") {
      // API isteği - JSON yanıtı döndür
      return res.json({
        products,
        pagination: {
          page,
          limit,
          totalProducts,
          totalPages,
        },
      })
    }

    // Normal sayfa isteği - HTML sayfasını render et
    res.render("main/marketplace/category", {
      title: `${category} Kategorisi`,
      category,
      products,
      pagination: {
        page,
        limit,
        totalProducts,
        totalPages,
      },
      filters: filterParams,
      sort: req.query.sort || "newest",
      search: req.query.search || "",
      termsAccepted: user.marketplaceTermsAccepted,
    })
  } catch (err) {
    console.error("Kategori ürünleri getirilirken hata oluştu:", err)
    res.status(500).send("Kategori ürünleri getirilirken bir hata oluştu.")
  }
}

// Ürün detayını getir
exports.getProductDetail = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.status(404).send("Ürün bulunamadı")
    }

    // Erişim kontrolü - sadece onaylı ürünler herkese açık
    const userEmail =
      req.session.user.EMail || req.session.user.email || req.session.user.mail || req.session.user.username

    // Ürün onaylanmamışsa sadece ürün sahibi ve admin erişebilir
    if (product.status !== "onaylandı") {
      const isOwner = product.seller === userEmail
      const isAdmin = req.session.user.role === "admin" || req.session.user.isAdmin

      if (!isOwner && !isAdmin) {
        return res.status(403).send("Bu ürüne erişim yetkiniz yok")
      }
    }

    // Görüntülenme sayısını artır (sadece onaylı ürünler için)
    if (product.status === "onaylandı") {
      product.viewCount += 1
      await product.save()
    }

    // Kullanıcının bu ürünü favorilere eklemiş mi kontrol et
    const isFavorited = product.favoritedBy.includes(userEmail)

    res.render("main/marketplace/product-detail", {
      title: product.title,
      product,
      isFavorited,
      currentUserEmail: userEmail,
    })
  } catch (err) {
    console.error("Ürün detayı getirilirken hata oluştu:", err)
    res.status(500).send("Ürün detayı getirilirken bir hata oluştu.")
  }
}

// Ürün ekleme sayfasını getir
exports.getAddProductPage = (req, res) => {
  try {
    res.render("main/marketplace/add-product", {
      title: "Ürün Ekle",
    })
  } catch (err) {
    console.error("Ürün ekleme sayfası getirilirken hata oluştu:", err)
    res.status(500).send("Ürün ekleme sayfası getirilirken bir hata oluştu.")
  }
}

// Ürün ekle
exports.addProduct = async (req, res) => {
  try {
    const { title, description, category, condition, location, phoneNumber } = req.body

    // Kullanıcı bilgilerini kontrol et
    if (!req.session || !req.session.user) {
      return res.status(401).send("Bu işlemi gerçekleştirmek için giriş yapmalısınız.")
    }

    // Kullanıcı bilgilerini logla
    console.log("Session user:", req.session.user)

    // Kullanıcı e-posta kontrolü - EMail alanını kontrol et
    const userEmail =
      req.session.user.EMail || req.session.user.email || req.session.user.mail || req.session.user.username
    if (!userEmail) {
      return res.status(400).send("Kullanıcı e-posta bilgisi bulunamadı.")
    }

    // Kullanıcı adı kontrolü - Adi ve Soyadi alanlarını kontrol et
    let sellerName = "Bilinmeyen Kullanıcı"
    if (req.session.user.Adi && req.session.user.Soyadi) {
      sellerName = `${req.session.user.Adi} ${req.session.user.Soyadi}`
    } else if (req.session.user.firstName && req.session.user.lastName) {
      sellerName = `${req.session.user.firstName} ${req.session.user.lastName}`
    } else if (req.session.user.displayName) {
      sellerName = req.session.user.displayName
    } else if (req.session.user.name) {
      sellerName = req.session.user.name
    }

    // Kullanıcı unvanı kontrolü
    let sellerTitle = ""
    if (req.session.user.Unvan) {
      sellerTitle = req.session.user.Unvan
    } else if (req.session.user.UnvanGrubu) {
      sellerTitle = req.session.user.UnvanGrubu
    } else if (req.session.user.title) {
      sellerTitle = req.session.user.title
    }

    // Resim dosyalarını kaydet
    const images = []
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        images.push(`/uploads/marketplace/${file.filename}`)
      })
    }

    // Yeni ürün oluştur
    const newProduct = new Product({
      title,
      description,
      category,
      condition,
      images,
      seller: userEmail,
      sellerName: sellerName,
      sellerTitle: sellerTitle,
      phoneNumber: phoneNumber || "",
      location,
      expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 gün sonra expire
    })

    await newProduct.save()

    res.redirect("/pazaryeri/urunlerim?success=true")
  } catch (err) {
    console.error("Ürün eklenirken hata oluştu:", err)
    res.status(500).send("Ürün eklenirken bir hata oluştu: " + err.message)
  }
}

// Kullanıcının kendi ürünlerini getir
exports.getUserProducts = async (req, res) => {
  try {
    // EMail alanını kontrol et
    const userEmail =
      req.session.user.EMail || req.session.user.email || req.session.user.mail || req.session.user.username

    if (!userEmail) {
      return res.status(400).send("Kullanıcı e-posta bilgisi bulunamadı.")
    }

    const products = await Product.find({ seller: userEmail }).sort({ createdAt: -1 })

    res.render("main/marketplace/user-products", {
      title: "Ürünlerim",
      products,
      success: req.query.success === "true",
    })
  } catch (err) {
    console.error("Kullanıcı ürünleri getirilirken hata oluştu:", err)
    res.status(500).send("Kullanıcı ürünleri getirilirken bir hata oluştu.")
  }
}

// Kullanıcının kendi ürününü silme
exports.deleteUserProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.status(404).send("Ürün bulunamadı")
    }

    // EMail alanını kontrol et
    const userEmail =
      req.session.user.EMail || req.session.user.email || req.session.user.mail || req.session.user.username

    // Sadece ürün sahibi silebilir
    if (product.seller !== userEmail) {
      return res.status(403).send("Bu işlem için yetkiniz yok")
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

    res.redirect("/pazaryeri/urunlerim?success=true")
  } catch (err) {
    console.error("Ürün silinirken hata oluştu:", err)
    res.status(500).send("Ürün silinirken bir hata oluştu.")
  }
}

// Ürün düzenleme sayfasını getir
exports.getEditProductPage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.status(404).send("Ürün bulunamadı")
    }

    // EMail alanını kontrol et
    const userEmail =
      req.session.user.EMail || req.session.user.email || req.session.user.mail || req.session.user.username

    // Sadece ürün sahibi düzenleyebilir
    if (product.seller !== userEmail) {
      return res.status(403).send("Bu işlem için yetkiniz yok")
    }

    res.render("main/marketplace/edit-product", {
      title: "Ürün Düzenle",
      product,
    })
  } catch (err) {
    console.error("Ürün düzenleme sayfası getirilirken hata oluştu:", err)
    res.status(500).send("Ürün düzenleme sayfası getirilirken bir hata oluştu.")
  }
}

// Ürün düzenle
exports.updateProduct = async (req, res) => {
  try {
    const { title, description, category, condition, location, keepImages, phoneNumber } = req.body
    const productId = req.params.id

    const product = await Product.findById(productId)

    if (!product) {
      return res.status(404).send("Ürün bulunamadı")
    }

    // EMail alanını kontrol et
    const userEmail =
      req.session.user.EMail || req.session.user.email || req.session.user.mail || req.session.user.username

    // Sadece ürün sahibi düzenleyebilir
    if (product.seller !== userEmail) {
      return res.status(403).send("Bu işlem için yetkiniz yok")
    }

    // Kullanıcı unvanı kontrolü (güncelleme sırasında da unvanı güncelleyelim)
    let sellerTitle = ""
    if (req.session.user.Unvan) {
      sellerTitle = req.session.user.Unvan
    } else if (req.session.user.UnvanGrubu) {
      sellerTitle = req.session.user.UnvanGrubu
    } else if (req.session.user.title) {
      sellerTitle = req.session.user.title
    }

    // Korunacak resimler
    let updatedImages = []
    if (keepImages) {
      // keepImages bir dizi olabilir veya tek bir değer olabilir
      if (Array.isArray(keepImages)) {
        updatedImages = keepImages
      } else {
        updatedImages = [keepImages]
      }
    }

    // Silinecek resimleri belirle ve sil
    if (product.images && product.images.length > 0) {
      product.images.forEach((image) => {
        if (!updatedImages.includes(image)) {
          const imagePath = path.join(__dirname, "../../public", image)
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath)
            console.log(`Resim silindi: ${imagePath}`)
          } else {
            console.log(`Resim bulunamadı: ${imagePath}`)
          }
        }
      })
    }

    // Yeni resimler ekle
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        const imagePath = `/uploads/marketplace/${file.filename}`
        updatedImages.push(imagePath)
        console.log(`Yeni resim eklendi: ${imagePath}`)
      })
    }

    console.log("Güncellenmiş resimler:", updatedImages)

    // Ürünü güncelle ve durumunu "beklemede" olarak ayarla
    await Product.findByIdAndUpdate(productId, {
      title,
      description,
      category,
      condition,
      location,
      images: updatedImages,
      sellerTitle: sellerTitle,
      phoneNumber: phoneNumber || "",
      status: "beklemede",
      rejectionReason: "",
      updatedAt: Date.now(),
      expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 gün süre ver
    })

    res.redirect("/pazaryeri/urunlerim?success=true")
  } catch (err) {
    console.error("Ürün güncellenirken hata oluştu:", err)
    res.status(500).send("Ürün güncellenirken bir hata oluştu: " + err.message)
  }
}

// Ürünü satıldı olarak işaretle
exports.toggleSold = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.status(404).send("Ürün bulunamadı")
    }

    const userEmail =
      req.session.user.EMail || req.session.user.email || req.session.user.mail || req.session.user.username

    // Sadece ürün sahibi işaretleyebilir
    if (product.seller !== userEmail) {
      return res.status(403).send("Bu işlem için yetkiniz yok")
    }

    // Satıldı durumunu değiştir
    product.isSold = !product.isSold
    await product.save()

    res.redirect("/pazaryeri/urunlerim?success=true")
  } catch (err) {
    console.error("Ürün satıldı durumu güncellenirken hata oluştu:", err)
    res.status(500).send("Ürün satıldı durumu güncellenirken bir hata oluştu.")
  }
}

// Favorilere ekle
exports.addToFavorites = async (req, res) => {
  try {
    const productId = req.params.id
    const userEmail =
      req.session.user.EMail || req.session.user.email || req.session.user.mail || req.session.user.username

    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ success: false, message: "Ürün bulunamadı" })
    }

    // Zaten favorilerde mi kontrol et
    if (!product.favoritedBy.includes(userEmail)) {
      product.favoritedBy.push(userEmail)
      await product.save()
    }

    res.json({ success: true, message: "Ürün favorilere eklendi" })
  } catch (err) {
    console.error("Favorilere eklenirken hata oluştu:", err)
    res.status(500).json({ success: false, message: "Bir hata oluştu" })
  }
}

// Favorilerden çıkar
exports.removeFromFavorites = async (req, res) => {
  try {
    const productId = req.params.id
    const userEmail =
      req.session.user.EMail || req.session.user.email || req.session.user.mail || req.session.user.username

    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json({ success: false, message: "Ürün bulunamadı" })
    }

    // Favorilerden çıkar
    product.favoritedBy = product.favoritedBy.filter((email) => email !== userEmail)
    await product.save()

    res.json({ success: true, message: "Ürün favorilerden çıkarıldı" })
  } catch (err) {
    console.error("Favorilerden çıkarılırken hata oluştu:", err)
    res.status(500).json({ success: false, message: "Bir hata oluştu" })
  }
}

// Favori ürünleri getir
exports.getFavorites = async (req, res) => {
  try {
    const userEmail =
      req.session.user.EMail || req.session.user.email || req.session.user.mail || req.session.user.username

    const favoriteProducts = await Product.find({
      favoritedBy: userEmail,
      status: "onaylandı",
      isActive: true,
      isSold: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 })

    res.render("main/marketplace/favorites", {
      title: "Favorilerim",
      products: favoriteProducts,
    })
  } catch (err) {
    console.error("Favori ürünler getirilirken hata oluştu:", err)
    res.status(500).send("Favori ürünler getirilirken bir hata oluştu.")
  }
}
