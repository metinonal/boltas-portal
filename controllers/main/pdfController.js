const fs = require("fs")
const path = require("path")
const puppeteer = require("puppeteer")
const PDFDocument = require("pdfkit")
const mammoth = require("mammoth")
const xlsx = require("xlsx")
const { createCanvas, loadImage } = require("canvas")

// PDF araçları ana sayfası
exports.index = (req, res) => {
  res.render("main/pdf-araclari/index", {
    title: "PDF Araçları",
    user: req.user,
  })
}

// PDF ayırma sayfası
exports.pdfAyir = (req, res) => {
  res.render("main/pdf-araclari/pdf-ayir", {
    title: "PDF Ayır",
    user: req.user,
  })
}

// PDF birleştirme sayfası
exports.pdfBirlestir = (req, res) => {
  res.render("main/pdf-araclari/pdf-birlestir", {
    title: "PDF Birleştir",
    user: req.user,
  })
}

// PDF sıkıştırma sayfası
exports.pdfSikistir = (req, res) => {
  res.render("main/pdf-araclari/pdf-sikistir", {
    title: "PDF Sıkıştır",
    user: req.user,
  })
}

// PDF'ten resim çıkarma sayfası
exports.pdfResimCikar = (req, res) => {
  res.render("main/pdf-araclari/pdf-resim-cikar", {
    title: "PDF'ten Resim Çıkar",
    user: req.user,
  })
}

// Resimden PDF oluşturma sayfası
exports.resimPdf = (req, res) => {
  res.render("main/pdf-araclari/resim-pdf", {
    title: "Resimden PDF Oluştur",
    user: req.user,
  })
}

// PDF döndürme sayfası
exports.pdfDondur = (req, res) => {
  res.render("main/pdf-araclari/pdf-dondur", {
    title: "PDF Döndür",
    user: req.user,
  })
}

// Word'den PDF sayfası
exports.wordPdf = (req, res) => {
  res.render("main/pdf-araclari/word-pdf", {
    title: "Word'den PDF",
    user: req.user,
  })
}

// Excel'den PDF sayfası
exports.excelPdf = (req, res) => {
  res.render("main/pdf-araclari/excel-pdf", {
    title: "Excel'den PDF",
    user: req.user,
  })
}

// HTML'den PDF sayfası
exports.htmlPdf = (req, res) => {
  res.render("main/pdf-araclari/html-pdf", {
    title: "HTML'den PDF",
    user: req.user,
  })
}

// Dosya doğrulama fonksiyonu
function validateFile(file, allowedTypes, maxSize = 50 * 1024 * 1024) {
  // 50MB default
  if (!file) {
    return { valid: false, error: "Dosya seçilmedi" }
  }

  // Dosya boyutu kontrolü
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Dosya boyutu çok büyük. Maksimum ${Math.round(maxSize / (1024 * 1024))}MB olmalıdır.`,
    }
  }

  // Dosya türü kontrolü
  const fileExt = path.extname(file.originalname).toLowerCase()
  if (!allowedTypes.includes(fileExt)) {
    return {
      valid: false,
      error: `Desteklenmeyen dosya türü. İzin verilen türler: ${allowedTypes.join(", ")}`,
    }
  }

  // Dosya varlığı kontrolü
  if (!fs.existsSync(file.path)) {
    return { valid: false, error: "Dosya yüklenemedi veya bulunamadı" }
  }

  // Dosya içeriği kontrolü
  try {
    const stats = fs.statSync(file.path)
    if (stats.size === 0) {
      return { valid: false, error: "Dosya boş veya bozuk" }
    }
  } catch (error) {
    return { valid: false, error: "Dosya okunamadı" }
  }

  return { valid: true }
}

// API: Word'den PDF dönüştürme
exports.apiWordPdf = async (req, res) => {
  try {
    // Dosya doğrulama
    const validation = validateFile(req.file, [".docx", ".doc"], 25 * 1024 * 1024) // 25MB
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error })
    }

    const {
      pageOrientation = "portrait",
      quality = "medium",
      preserveFormatting = "true",
      includeImages = "true",
    } = req.body

    console.log("Word dosyası işleniyor:", req.file.originalname)

    let htmlContent = ""
    let browser = null

    try {
      // Word dosyasını HTML'e çevir
      if (req.file.originalname.toLowerCase().endsWith(".docx")) {
        // DOCX dosyası için mammoth kullan
        const result = await mammoth.convertToHtml({
          path: req.file.path,
          options: {
            includeDefaultStyleMap: true,
            includeEmbeddedStyleMap: true,
            convertImage: mammoth.images.imgElement((image) =>
              image.read("base64").then((imageBuffer) => ({
                src: "data:" + image.contentType + ";base64," + imageBuffer,
              })),
            ),
          },
        })
        htmlContent = result.value

        if (result.messages.length > 0) {
          console.log("Mammoth uyarıları:", result.messages)
        }
      } else if (req.file.originalname.toLowerCase().endsWith(".doc")) {
        // DOC dosyası için basit metin çıkarma
        const fileBuffer = fs.readFileSync(req.file.path)
        let textContent = ""

        try {
          // DOC dosyasından metin çıkarmaya çalış
          textContent = fileBuffer
            .toString("utf8")
            .replace(/[^\x20-\x7E\u00A0-\u00FF\u0100-\u017F\u0180-\u024F\u0590-\u05FF]/g, " ")
            .replace(/\s+/g, " ")
            .trim()
        } catch (error) {
          textContent = "DOC dosyası okunamadı. Lütfen DOCX formatında yükleyin."
        }

        htmlContent = `<div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px;">${textContent.replace(/\n/g, "<br>")}</div>`
      }

      // HTML içeriği boş mu kontrol et
      if (!htmlContent || htmlContent.trim().length === 0) {
        throw new Error("Word dosyasından içerik çıkarılamadı")
      }

      // HTML içeriğini düzenle
      const styledHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Times New Roman', serif;
              font-size: 12pt;
              line-height: 1.6;
              margin: 0;
              padding: 20px;
              color: #000;
            }
            h1, h2, h3, h4, h5, h6 {
              color: #000;
              margin-top: 20px;
              margin-bottom: 10px;
            }
            p {
              margin-bottom: 10px;
              text-align: justify;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 10px 0;
            }
            table, th, td {
              border: 1px solid #000;
            }
            th, td {
              padding: 8px;
              text-align: left;
            }
            img {
              max-width: 100%;
              height: auto;
            }
            .page-break {
              page-break-before: always;
            }
            ul, ol {
              margin: 10px 0;
              padding-left: 30px;
            }
            li {
              margin-bottom: 5px;
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
        </html>
      `

      console.log("HTML içeriği oluşturuldu, uzunluk:", styledHtml.length)

      // Puppeteer ile PDF oluştur
      browser = await puppeteer.launch({
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
          "--disable-web-security",
          "--allow-running-insecure-content",
        ],
      })

      const page = await browser.newPage()

      // Sayfa boyutunu ayarla
      await page.setViewport({ width: 1200, height: 800 })

      // HTML içeriğini yükle
      await page.setContent(styledHtml, {
        waitUntil: "networkidle0",
        timeout: 60000,
      })

      // PDF seçenekleri
      const pdfOptions = {
        format: "A4",
        landscape: pageOrientation === "landscape",
        printBackground: true,
        margin: {
          top: "2cm",
          right: "2cm",
          bottom: "2cm",
          left: "2cm",
        },
        preferCSSPageSize: false,
        displayHeaderFooter: true,
        headerTemplate: "<div></div>",
        footerTemplate: `
          <div style="font-size: 10px; text-align: center; width: 100%; margin: 0 auto;">
            <span class="pageNumber"></span> / <span class="totalPages"></span>
          </div>
        `,
      }

      // Kalite ayarları
      if (quality === "high") {
        pdfOptions.scale = 1.0
      } else if (quality === "low") {
        pdfOptions.scale = 0.8
      } else {
        pdfOptions.scale = 0.9
      }

      console.log("PDF oluşturuluyor...")
      const pdfBuffer = await page.pdf(pdfOptions)

      console.log("PDF başarıyla oluşturuldu, boyut:", pdfBuffer.length)

      // Response headers
      const fileName = path.parse(req.file.originalname).name + ".pdf"
      res.setHeader("Content-Type", "application/pdf")
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`)
      res.setHeader("Content-Length", pdfBuffer.length)

      // PDF'i gönder
      res.send(pdfBuffer)
    } catch (conversionError) {
      console.error("Dönüştürme hatası:", conversionError)
      throw conversionError
    } finally {
      // Browser'ı kapat
      if (browser) {
        try {
          await browser.close()
        } catch (closeError) {
          console.error("Browser kapatma hatası:", closeError)
        }
      }

      // Geçici dosyayı sil
      try {
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path)
        }
      } catch (deleteError) {
        console.error("Dosya silme hatası:", deleteError)
      }
    }
  } catch (error) {
    console.error("Word PDF dönüştürme hatası:", error)

    // Geçici dosyayı temizle
    try {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path)
      }
    } catch (deleteError) {
      console.error("Hata sonrası dosya silme hatası:", deleteError)
    }

    res.status(500).json({
      error: "PDF dönüştürme işlemi başarısız",
      details: error.message,
    })
  }
}

// API: Excel'den PDF dönüştürme
exports.apiExcelPdf = async (req, res) => {
  try {
    // Dosya doğrulama
    const validation = validateFile(req.file, [".xlsx", ".xls"], 25 * 1024 * 1024) // 25MB
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error })
    }

    const { pageOrientation = "landscape", pageSize = "A4", scaling = "100", selectedSheets = "[]" } = req.body

    let sheets = []
    try {
      sheets = JSON.parse(selectedSheets)
    } catch (parseError) {
      sheets = []
    }

    console.log("Excel dosyası işleniyor:", req.file.originalname)

    let browser = null

    try {
      // Excel dosyasını oku
      const workbook = xlsx.readFile(req.file.path)
      const sheetNames = workbook.SheetNames

      if (sheetNames.length === 0) {
        throw new Error("Excel dosyasında sayfa bulunamadı")
      }

      console.log("Excel sayfaları:", sheetNames)

      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              font-size: 10pt;
              margin: 0;
              padding: 15px;
            }
            .sheet-title {
              font-size: 14pt;
              font-weight: bold;
              margin: 20px 0 10px 0;
              color: #333;
              border-bottom: 2px solid #333;
              padding-bottom: 5px;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin-bottom: 30px;
              font-size: 9pt;
            }
            th, td {
              border: 1px solid #ccc;
              padding: 4px 6px;
              text-align: left;
              vertical-align: top;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .page-break {
              page-break-before: always;
            }
            .number {
              text-align: right;
            }
          </style>
        </head>
        <body>
      `

      // Seçilen sayfaları işle (eğer seçim yoksa tüm sayfalar)
      const sheetsToProcess = sheets.length > 0 ? sheets.filter((s) => sheetNames.includes(s)) : sheetNames

      if (sheetsToProcess.length === 0) {
        throw new Error("İşlenecek sayfa bulunamadı")
      }

      sheetsToProcess.forEach((sheetName, index) => {
        if (index > 0) {
          htmlContent += '<div class="page-break"></div>'
        }

        htmlContent += `<div class="sheet-title">${sheetName}</div>`

        const worksheet = workbook.Sheets[sheetName]

        try {
          const htmlTable = xlsx.utils.sheet_to_html(worksheet, {
            id: `sheet-${index}`,
            editable: false,
          })

          // HTML tablosunu temizle ve stil ekle
          const cleanTable = htmlTable
            .replace(/<table[^>]*>/, "<table>")
            .replace(/style="[^"]*"/g, "")
            .replace(/<td>(\d+\.?\d*)<\/td>/g, '<td class="number">$1</td>')

          htmlContent += cleanTable
        } catch (sheetError) {
          console.error(`Sayfa ${sheetName} işlenirken hata:`, sheetError)
          htmlContent += `<p>Sayfa ${sheetName} işlenemedi.</p>`
        }
      })

      htmlContent += "</body></html>"

      console.log("Excel HTML içeriği oluşturuldu")

      // Puppeteer ile PDF oluştur
      browser = await puppeteer.launch({
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      })

      const page = await browser.newPage()
      await page.setContent(htmlContent, { waitUntil: "networkidle0", timeout: 60000 })

      const pdfOptions = {
        format: pageSize.toUpperCase(),
        landscape: pageOrientation === "landscape",
        printBackground: true,
        margin: {
          top: "1cm",
          right: "1cm",
          bottom: "1cm",
          left: "1cm",
        },
        scale: Math.max(0.1, Math.min(2.0, Number.parseInt(scaling) / 100)),
        displayHeaderFooter: true,
        headerTemplate: "<div></div>",
        footerTemplate: `
          <div style="font-size: 8px; text-align: center; width: 100%;">
            Sayfa <span class="pageNumber"></span> / <span class="totalPages"></span>
          </div>
        `,
      }

      const pdfBuffer = await page.pdf(pdfOptions)

      console.log("Excel PDF başarıyla oluşturuldu")

      const fileName = path.parse(req.file.originalname).name + ".pdf"
      res.setHeader("Content-Type", "application/pdf")
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`)
      res.send(pdfBuffer)
    } catch (conversionError) {
      console.error("Excel dönüştürme hatası:", conversionError)
      throw conversionError
    } finally {
      if (browser) {
        try {
          await browser.close()
        } catch (closeError) {
          console.error("Browser kapatma hatası:", closeError)
        }
      }

      try {
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path)
        }
      } catch (deleteError) {
        console.error("Dosya silme hatası:", deleteError)
      }
    }
  } catch (error) {
    console.error("Excel PDF dönüştürme hatası:", error)

    // Geçici dosyayı temizle
    try {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path)
      }
    } catch (deleteError) {
      console.error("Hata sonrası dosya silme hatası:", deleteError)
    }

    res.status(500).json({
      error: "PDF dönüştürme işlemi başarısız",
      details: error.message,
    })
  }
}

// API: HTML dosyasından PDF dönüştürme
exports.apiHtmlPdf = async (req, res) => {
  try {
    // Dosya doğrulama
    const validation = validateFile(req.file, [".html", ".htm"], 10 * 1024 * 1024) // 10MB
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error })
    }

    const {
      pageSize = "A4",
      pageOrientation = "portrait",
      margins = "default",
      includeBackground = "true",
      includeImages = "true",
    } = req.body

    // HTML dosyasını oku
    const htmlContent = fs.readFileSync(req.file.path, "utf8")

    if (!htmlContent || htmlContent.trim().length === 0) {
      throw new Error("HTML dosyası boş veya okunamadı")
    }

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })

    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: "networkidle0", timeout: 60000 })

    const pdfOptions = {
      format: pageSize.toUpperCase(),
      landscape: pageOrientation === "landscape",
      printBackground: includeBackground === "true",
      margin: getMarginSettings(margins),
    }

    const pdfBuffer = await page.pdf(pdfOptions)
    await browser.close()

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `attachment; filename="${path.parse(req.file.originalname).name}.pdf"`)
    res.send(pdfBuffer)

    // Geçici dosyayı sil
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }
  } catch (error) {
    console.error("HTML PDF dönüştürme hatası:", error)

    // Geçici dosyayı temizle
    try {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path)
      }
    } catch (deleteError) {
      console.error("Hata sonrası dosya silme hatası:", deleteError)
    }

    res.status(500).json({
      error: "PDF dönüştürme işlemi başarısız",
      details: error.message,
    })
  }
}

// API: URL'den PDF dönüştürme
exports.apiHtmlUrlPdf = async (req, res) => {
  try {
    const {
      url,
      pageSize = "A4",
      pageOrientation = "portrait",
      margins = "default",
      includeBackground = "true",
      waitForLoad = "false",
    } = req.body

    if (!url) {
      return res.status(400).json({ error: "URL gerekli" })
    }

    // URL doğrulama
    try {
      new URL(url)
    } catch (urlError) {
      return res.status(400).json({ error: "Geçersiz URL formatı" })
    }

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })

    const page = await browser.newPage()

    const waitUntil = waitForLoad === "true" ? "networkidle0" : "domcontentloaded"
    await page.goto(url, { waitUntil, timeout: 60000 })

    const pdfOptions = {
      format: pageSize.toUpperCase(),
      landscape: pageOrientation === "landscape",
      printBackground: includeBackground === "true",
      margin: getMarginSettings(margins),
    }

    const pdfBuffer = await page.pdf(pdfOptions)
    await browser.close()

    const urlObj = new URL(url)
    const filename = `${urlObj.hostname}.pdf`

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)
    res.send(pdfBuffer)
  } catch (error) {
    console.error("URL PDF dönüştürme hatası:", error)
    res.status(500).json({
      error: "PDF dönüştürme işlemi başarısız",
      details: error.message,
    })
  }
}

// API: HTML kodundan PDF dönüştürme
exports.apiHtmlCodePdf = async (req, res) => {
  try {
    const {
      htmlCode,
      pageSize = "A4",
      pageOrientation = "portrait",
      margins = "default",
      includeBackground = "true",
    } = req.body

    if (!htmlCode || htmlCode.trim().length === 0) {
      return res.status(400).json({ error: "HTML kodu gerekli" })
    }

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })

    const page = await browser.newPage()
    await page.setContent(htmlCode, { waitUntil: "networkidle0", timeout: 60000 })

    const pdfOptions = {
      format: pageSize.toUpperCase(),
      landscape: pageOrientation === "landscape",
      printBackground: includeBackground === "true",
      margin: getMarginSettings(margins),
    }

    const pdfBuffer = await page.pdf(pdfOptions)
    await browser.close()

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", 'attachment; filename="html-code.pdf"')
    res.send(pdfBuffer)
  } catch (error) {
    console.error("HTML kod PDF dönüştürme hatası:", error)
    res.status(500).json({
      error: "PDF dönüştürme işlemi başarısız",
      details: error.message,
    })
  }
}

// Yardımcı fonksiyon: Margin ayarları
function getMarginSettings(margins) {
  switch (margins) {
    case "none":
      return { top: 0, right: 0, bottom: 0, left: 0 }
    case "minimum":
      return { top: "0.5cm", right: "0.5cm", bottom: "0.5cm", left: "0.5cm" }
    case "maximum":
      return { top: "3cm", right: "3cm", bottom: "3cm", left: "3cm" }
    default:
      return { top: "1cm", right: "1cm", bottom: "1cm", left: "1cm" }
  }
}

// Diğer API fonksiyonları (placeholder)
exports.apiPdfAyir = async (req, res) => {
  res.status(501).json({ error: "Bu özellik henüz geliştirilmemiş" })
}

exports.apiPdfBirlestir = async (req, res) => {
  res.status(501).json({ error: "Bu özellik henüz geliştirilmemiş" })
}

exports.apiPdfSikistir = async (req, res) => {
  res.status(501).json({ error: "Bu özellik henüz geliştirilmemiş" })
}

exports.apiPdfResimCikar = async (req, res) => {
  res.status(501).json({ error: "Bu özellik henüz geliştirilmemiş" })
}

exports.apiResimPdf = async (req, res) => {
  res.status(501).json({ error: "Bu özellik henüz geliştirilmemiş" })
}

exports.apiPdfDondur = async (req, res) => {
  res.status(501).json({ error: "Bu özellik henüz geliştirilmemiş" })
}
