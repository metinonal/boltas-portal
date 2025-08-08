const axios = require('axios')
const ExcelJS = require('exceljs')

exports.getDahiliRaporPage = async (req, res) => {
  try {
    res.render("ikyonetim/dahili-rapor", {
      title: "Dahili Rapor Sistemi",
      user: req.session.user
    })
  } catch (err) {
    console.error("Dahili rapor sayfası görüntülenirken bir hata oluştu:", err)
    res.status(500).send("Dahili rapor sayfası görüntülenirken bir hata oluştu.")
  }
}

exports.getReportData = async (req, res) => {
  try {
    const { startDate, endDate, filterType } = req.body

    let reportData

    if (filterType === 'today') {
      reportData = await getReportDataForToday()
    } else if (filterType === 'yesterday') {
      reportData = await getReportDataForYesterday()
    } else if (filterType === 'last7Days') {
      reportData = await getReportDataForLast7Days()
    } else if (filterType === 'last30Days') {
      reportData = await getReportDataForLast30Days()
    } else if (filterType === 'thisMonth') {
      reportData = await getReportDataForThisMonth()
    } else if (filterType === 'lastMonth') {
      reportData = await getReportDataForLastMonth()
    } else if (filterType === 'custom' && startDate && endDate) {
      reportData = await getReportDataFromApi(startDate, endDate)
    } else {
      return res.status(400).json({
        success: false,
        message: "Geçersiz filtreleme seçeneği veya tarih aralığı"
      })
    }

    if (reportData && reportData.success) {
      // Gelen veriyi konsola yazdır (debug için)
      console.log('API Response Data:', JSON.stringify(reportData.data, null, 2))
      
      res.json({
        success: true,
        data: reportData.data,
        message: "Veriler başarıyla alındı"
      })
    } else {
      res.status(500).json({
        success: false,
        message: "Veri alınamadı"
      })
    }

  } catch (error) {
    console.error("Rapor verisi alınırken hata:", error)
    res.status(500).json({
      success: false,
      message: "Veri alınırken bir hata oluştu: " + error.message
    })
  }
}

async function getReportDataFromApi(startDate, endDate) {
  try {
    if (!startDate || !endDate) {
      throw new Error("Başlangıç ve bitiş tarihi gereklidir")
    }

    // Tarihleri API formatına çevir
    const formattedStartDate = new Date(startDate).toISOString().replace('Z', '+03:00')
    const formattedEndDate = new Date(endDate + 'T23:59:59.999').toISOString().replace('Z', '+03:00')

    const apiUrl = `http://192.168.200.239:92/api/services/app/CCReport/GetUserStat?startDate=${encodeURIComponent(formattedStartDate)}&endDate=${encodeURIComponent(formattedEndDate)}`

    console.log('API URL:', apiUrl)

    const response = await axios.get(apiUrl, {
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })

    console.log('Full API Response:', JSON.stringify(response.data, null, 2))

    if (response.data && response.data.success) {
      // API'den gelen veri yapısını kontrol et
      let resultData = response.data.result

      // Eğer result bir object ise ve items property'si varsa
      if (resultData && typeof resultData === 'object' && !Array.isArray(resultData)) {
        if (resultData.items && Array.isArray(resultData.items)) {
          resultData = resultData.items
        } else if (resultData.data && Array.isArray(resultData.data)) {
          resultData = resultData.data
        } else {
          // Eğer tek bir object ise array'e çevir
          resultData = [resultData]
        }
      }

      // Eğer resultData hala array değilse boş array döndür
      if (!Array.isArray(resultData)) {
        resultData = []
      }

      return {
        success: true,
        data: resultData
      }
    } else {
      throw new Error("API'den veri alınamadı")
    }

  } catch (error) {
    console.error("API'den veri alınırken hata:", error)
    throw error
  }
}

async function getReportDataForToday() {
  const today = new Date()
  const formattedDate = today.toISOString().split('T')[0]
  return getReportDataFromApi(formattedDate, formattedDate)
}

async function getReportDataForYesterday() {
  const today = new Date()
  today.setDate(today.getDate() - 1)
  const formattedDate = today.toISOString().split('T')[0]
  return getReportDataFromApi(formattedDate, formattedDate)
}

async function getReportDataForLast7Days() {
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - 6)
  const formattedStartDate = startDate.toISOString().split('T')[0]
  const formattedEndDate = today.toISOString().split('T')[0]
  return getReportDataFromApi(formattedStartDate, formattedEndDate)
}

async function getReportDataForLast30Days() {
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - 29)
  const formattedStartDate = startDate.toISOString().split('T')[0]
  const formattedEndDate = today.toISOString().split('T')[0]
  return getReportDataFromApi(formattedStartDate, formattedEndDate)
}

async function getReportDataForThisMonth() {
  const today = new Date()
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
  const formattedStartDate = startDate.toISOString().split('T')[0]
  const formattedEndDate = today.toISOString().split('T')[0]
  return getReportDataFromApi(formattedStartDate, formattedEndDate)
}

async function getReportDataForLastMonth() {
  const today = new Date()
  // Geçen ayın ilk günü
  const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  // Geçen ayın son günü
  const endDate = new Date(today.getFullYear(), today.getMonth(), 0)
  const formattedStartDate = startDate.toISOString().split('T')[0]
  const formattedEndDate = endDate.toISOString().split('T')[0]
  return getReportDataFromApi(formattedStartDate, formattedEndDate)
}

exports.downloadExcel = async (req, res) => {
  try {
    console.log('Excel download request body:', req.body)
    
    const { startDate, endDate } = req.body
    let { data } = req.body
    
    // Eğer data string olarak geldiyse JSON.parse yap
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
        console.log('Data string\'den array\'e çevrildi, uzunluk:', data.length)
      } catch (parseError) {
        console.error('JSON parse hatası:', parseError)
        data = null
      }
    }
    
    // Eğer data hala geçerli değilse, tarih bilgilerinden API'den çek
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log('Veri frontend\'den gelmedi veya geçersiz, API\'den çekiliyor...')
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Tarih bilgileri eksik"
        })
      }
      
      const reportData = await getReportDataFromApi(startDate, endDate)
      
      if (reportData && reportData.success && Array.isArray(reportData.data)) {
        data = reportData.data
        console.log('API\'den veri çekildi, uzunluk:', data.length)
      } else {
        return res.status(400).json({
          success: false,
          message: "Excel için veri alınamadı"
        })
      }
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Excel için veri bulunamadı"
      })
    }

    console.log(`Excel için ${data.length} adet veri işleniyor...`)

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Dahili Rapor')

    // Başlık satırı - API field'larına göre güncellendi
    worksheet.addRow([
      'Kullanıcı Adı', 
      'Dahili No', 
      'Tarih',
      'Gelen Çağrı', 
      'Giden Çağrı', 
      'Cevaplanan', 
      'Cevaplanmayan',
      'Transfer Edilen',
      'Gelen Çağrı Süresi (sn)',
      'Giden Çağrı Süresi (sn)'
    ])

    // Başlık stilini ayarla
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    }

    // Veri satırları - API field'larına göre güncellendi
    data.forEach(item => {
      const callDate = new Date(item.callDate).toLocaleDateString('tr-TR')
      worksheet.addRow([
        item.contact_user || 'N/A',
        item.src || 'N/A',
        callDate,
        item.inboundCallCount || 0,
        item.outboundCallCount || 0,
        item.answeredCallCount || 0,
        item.noAnsweredCallCount || 0,
        item.transferredCallCount || 0,
        item.inboundCallDuration || 0,
        item.outboundCallDuration || 0
      ])
    })

    // Sütun genişliklerini ayarla
    worksheet.columns.forEach(column => {
      column.width = 15
    })

    // Excel dosyasını buffer olarak oluştur
    const buffer = await workbook.xlsx.writeBuffer()

    // Dosya adı
    const fileName = `dahili_rapor_${startDate}_${endDate}.xlsx`

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    res.send(buffer)

    console.log('Excel dosyası başarıyla oluşturuldu:', fileName)

  } catch (error) {
    console.error("Excel dosyası oluşturulurken hata:", error)
    res.status(500).json({
      success: false,
      message: "Excel dosyası oluşturulamadı: " + error.message
    })
  }
}
