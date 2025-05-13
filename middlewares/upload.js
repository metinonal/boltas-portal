const multer = require("multer")
const path = require("path")
const fs = require("fs")

// Yükleme klasörlerini oluştur
const createUploadDirs = () => {
  const dirs = [
    "./public/uploads",
    "./public/uploads/sliders",
    "./public/uploads/docs",
    "./public/uploads/bilgi",
    "./public/uploads/marketplace",
  ]

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  })
}

createUploadDirs()

// Dosya depolama yapılandırması
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Dosya türüne göre hedef klasörü belirle
    let uploadPath = "./public/uploads"

    if (req.originalUrl.includes("/sliders")) {
      uploadPath = "./public/uploads/sliders"
    } else if (req.originalUrl.includes("/docs")) {
      uploadPath = "./public/uploads/docs"
    } else if (req.originalUrl.includes("/bilgi")) {
      uploadPath = "./public/uploads/bilgi"
    } else if (req.originalUrl.includes("/pazaryeri")) {
      uploadPath = "./public/uploads/marketplace"
    }

    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    // Dosya adını oluştur: timestamp + rastgele sayı + orijinal uzantı
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  },
})

// Dosya filtreleme
const fileFilter = (req, file, cb) => {
  // İzin verilen dosya türleri - Resim formatlarını genişlettik
  const allowedTypes = /jpeg|jpg|png|gif|bmp|jfif|webp|pdf|doc|docx|xls|xlsx|ppt|pptx/

  // Dosya uzantısını kontrol et
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())

  // MIME türünü kontrol et - Bazı formatlar için MIME türü kontrolünü genişlettik
  const mimetype =
    file.mimetype.startsWith("image/") ||
    /application\/pdf|application\/msword|application\/vnd.openxmlformats-officedocument|application\/vnd.ms-excel|application\/vnd.ms-powerpoint/.test(
      file.mimetype,
    )

  if (extname && mimetype) {
    return cb(null, true)
  } else {
    cb(new Error("Sadece resim ve doküman dosyaları yüklenebilir!"))
  }
}

// Multer yapılandırması
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter,
})

module.exports = upload
