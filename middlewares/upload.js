const multer = require("multer")
const path = require("path")
const fs = require("fs")

// Upload klasörünü oluştur
const uploadDir = "uploads"
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// Dosya depolama ayarları
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    // Güvenli dosya adı oluştur
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")
    cb(null, uniqueSuffix + "-" + sanitizedName)
  },
})

// Dosya filtreleme
const fileFilter = (req, file, cb) => {
  // İzin verilen dosya türleri
  const allowedTypes = {
    // Doküman türleri
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",

    // Web türleri
    ".html": "text/html",
    ".htm": "text/html",
    ".txt": "text/plain",
    ".rtf": "application/rtf",

    // Resim türleri
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".bmp": "image/bmp",
    ".tiff": "image/tiff",
    ".webp": "image/webp",

    // Diğer
    ".zip": "application/zip",
    ".rar": "application/x-rar-compressed",
  }

  const fileExt = path.extname(file.originalname).toLowerCase()

  if (allowedTypes[fileExt]) {
    // MIME type kontrolü
    const expectedMimeType = allowedTypes[fileExt]
    if (
      file.mimetype === expectedMimeType ||
      file.mimetype === "application/octet-stream" || // Bazı dosyalar generic olarak gelir
      (fileExt === ".docx" && file.mimetype.includes("document")) ||
      (fileExt === ".xlsx" && file.mimetype.includes("spreadsheet"))
    ) {
      cb(null, true)
    } else {
      cb(new Error(`Dosya türü uyumsuzluğu: ${file.mimetype} beklenen: ${expectedMimeType}`), false)
    }
  } else {
    cb(new Error(`Desteklenmeyen dosya türü: ${fileExt}`), false)
  }
}

// Multer yapılandırması
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 10, // Maksimum 10 dosya
  },
})

// Hata yakalama middleware'i
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = "Dosya yükleme hatası"

    switch (error.code) {
      case "LIMIT_FILE_SIZE":
        message = "Dosya boyutu çok büyük (maksimum 50MB)"
        break
      case "LIMIT_FILE_COUNT":
        message = "Çok fazla dosya (maksimum 10 dosya)"
        break
      case "LIMIT_UNEXPECTED_FILE":
        message = "Beklenmeyen dosya alanı"
        break
      case "LIMIT_PART_COUNT":
        message = "Çok fazla form alanı"
        break
      case "LIMIT_FIELD_KEY":
        message = "Alan adı çok uzun"
        break
      case "LIMIT_FIELD_VALUE":
        message = "Alan değeri çok uzun"
        break
      case "LIMIT_FIELD_COUNT":
        message = "Çok fazla alan"
        break
      default:
        message = error.message
    }

    return res.status(400).json({ error: message })
  } else if (error) {
    return res.status(400).json({ error: error.message })
  }

  next()
}

// Upload middleware'ini export et
module.exports = upload
module.exports.handleUploadError = handleUploadError

// Temizlik fonksiyonu - eski dosyaları sil
const cleanupOldFiles = () => {
  const uploadPath = path.join(__dirname, "..", uploadDir)

  if (!fs.existsSync(uploadPath)) return

  const files = fs.readdirSync(uploadPath)
  const now = Date.now()
  const maxAge = 24 * 60 * 60 * 1000 // 24 saat

  files.forEach((file) => {
    const filePath = path.join(uploadPath, file)
    const stats = fs.statSync(filePath)

    if (now - stats.mtime.getTime() > maxAge) {
      try {
        fs.unlinkSync(filePath)
        console.log(`Eski dosya silindi: ${file}`)
      } catch (error) {
        console.error(`Dosya silinemedi: ${file}`, error)
      }
    }
  })
}

// Her 6 saatte bir temizlik yap
setInterval(cleanupOldFiles, 6 * 60 * 60 * 1000)

// İlk başlatmada da temizlik yap
setTimeout(cleanupOldFiles, 5000)
