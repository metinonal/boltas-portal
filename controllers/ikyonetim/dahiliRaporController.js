const axios = require("axios")
const ExcelJS = require("exceljs")
const ldap = require("ldapjs")
require("dotenv").config()

exports.getDahiliRaporPage = async (req, res) => {
  try {
    res.render("ikyonetim/dahili-rapor", {
      title: "Dahili Rapor Sistemi",
      user: req.session.user,
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

    if (filterType === "today") {
      reportData = await getReportDataForToday()
    } else if (filterType === "yesterday") {
      reportData = await getReportDataForYesterday()
    } else if (filterType === "last7Days") {
      reportData = await getReportDataForLast7Days()
    } else if (filterType === "last30Days") {
      reportData = await getReportDataForLast30Days()
    } else if (filterType === "thisMonth") {
      reportData = await getReportDataForThisMonth()
    } else if (filterType === "lastMonth") {
      reportData = await getReportDataForLastMonth()
    } else if (filterType === "custom" && startDate && endDate) {
      reportData = await getReportDataFromApi(startDate, endDate)
    } else {
      return res.status(400).json({
        success: false,
        message: "Geçersiz filtreleme seçeneği veya tarih aralığı",
      })
    }

    if (reportData && reportData.success) {
      // Gelen veriyi konsola yazdır (debug için)
      // console.log('API Response Data:', JSON.stringify(reportData.data, null, 2))

      res.json({
        success: true,
        data: reportData.data,
        message: "Veriler başarıyla alındı",
      })
    } else {
      res.status(500).json({
        success: false,
        message: "Veri alınamadı",
      })
    }
  } catch (error) {
    console.error("Rapor verisi alınırken hata:", error)
    res.status(500).json({
      success: false,
      message: "Veri alınırken bir hata oluştu: " + error.message,
    })
  }
}

async function getReportDataFromApi(startDate, endDate) {
  try {
    if (!startDate || !endDate) {
      throw new Error("Başlangıç ve bitiş tarihi gereklidir")
    }

    // Tarihleri API formatına çevir
    const formattedStartDate = new Date(startDate).toISOString().replace("Z", "+03:00")
    const formattedEndDate = new Date(endDate + "T23:59:59.999").toISOString().replace("Z", "+03:00")

    const apiUrl = `http://192.168.200.239:92/api/services/app/CCReport/GetUserStat?startDate=${encodeURIComponent(formattedStartDate)}&endDate=${encodeURIComponent(formattedEndDate)}`

    console.log("API URL:", apiUrl)

    const response = await axios.get(apiUrl, {
      timeout: 30000,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    })

    // console.log('Full API Response:', JSON.stringify(response.data, null, 2))

    if (response.data && response.data.success) {
      // API'den gelen veri yapısını kontrol et
      let resultData = response.data.result

      // Eğer result bir object ise ve items property'si varsa
      if (resultData && typeof resultData === "object" && !Array.isArray(resultData)) {
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
        data: resultData,
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
  const formattedDate = today.toISOString().split("T")[0]
  return getReportDataFromApi(formattedDate, formattedDate)
}

async function getReportDataForYesterday() {
  const today = new Date()
  today.setDate(today.getDate() - 1)
  const formattedDate = today.toISOString().split("T")[0]
  return getReportDataFromApi(formattedDate, formattedDate)
}

async function getReportDataForLast7Days() {
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - 6)
  const formattedStartDate = startDate.toISOString().split("T")[0]
  const formattedEndDate = today.toISOString().split("T")[0]
  return getReportDataFromApi(formattedStartDate, formattedEndDate)
}

async function getReportDataForLast30Days() {
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - 29)
  const formattedStartDate = startDate.toISOString().split("T")[0]
  const formattedEndDate = today.toISOString().split("T")[0]
  return getReportDataFromApi(formattedStartDate, formattedEndDate)
}

async function getReportDataForThisMonth() {
  const today = new Date()
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
  const formattedStartDate = startDate.toISOString().split("T")[0]
  const formattedEndDate = today.toISOString().split("T")[0]
  return getReportDataFromApi(formattedStartDate, formattedEndDate)
}

async function getReportDataForLastMonth() {
  const today = new Date()
  // Geçen ayın ilk günü
  const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  // Geçen ayın son günü
  const endDate = new Date(today.getFullYear(), today.getMonth(), 0)
  const formattedStartDate = startDate.toISOString().split("T")[0]
  const formattedEndDate = endDate.toISOString().split("T")[0]
  return getReportDataFromApi(formattedStartDate, formattedEndDate)
}

async function getUserInfoFromLDAP(dahiliNo) {
  return new Promise((resolve, reject) => {
    if (!dahiliNo || dahiliNo === "N/A") {
      resolve({ departman: "Bilinmiyor", unvan: "Bilinmiyor" })
      return
    }

    const client = ldap.createClient({
      url: process.env.LDAP_URL,
      timeout: 10000,
      connectTimeout: 15000,
      reconnect: false,
    })

    client.on("error", (err) => {
      console.error("LDAP Client Hatası:", err.message)
      resolve({ departman: "Bilinmiyor", unvan: "Bilinmiyor" })
    })

    // Service account ile bağlan (eğer varsa) veya anonymous bind dene
    const bindDN = process.env.LDAP_SERVICE_USER || ""
    const bindPassword = process.env.LDAP_SERVICE_PASSWORD || ""

    const performBind = (username, password) => {
      client.bind(username, password, (bindErr) => {
        if (bindErr) {
          console.error(`LDAP bind hatası (${username}):`, bindErr.message)
          client.unbind()
          resolve({ departman: "Bilinmiyor", unvan: "Bilinmiyor" })
          return
        }

        const searchOptions = {
          filter: `(&(objectClass=user)(physicalDeliveryOfficeName=${dahiliNo})(!(userAccountControl:1.2.840.113556.1.4.803:=2)))`,
          scope: "sub",
          attributes: ["department", "title", "physicalDeliveryOfficeName", "displayName"],
          sizeLimit: 1,
        }
        
        // console.log("LDAP arama seçenekleri:", searchOptions)

        client.search(process.env.LDAP_BASE_DN, searchOptions, (searchErr, searchRes) => {
          if (searchErr) {
            console.error("LDAP arama hatası:", searchErr.message, " | Dahili:", dahiliNo)
            client.unbind()
            resolve({ departman: "Bilinmiyor", unvan: "Bilinmiyor" })
            return
          }
        
          let userFound = false
          let userData = { departman: "Bilinmiyor", unvan: "Bilinmiyor" }
        
          searchRes.on("searchEntry", (entry) => {
            try {
              userFound = true
              const attributes = {}
        
              if (entry.attributes && Array.isArray(entry.attributes)) {
                entry.attributes.forEach((attr) => {
                  if (attr && attr.type && attr.values && attr.values.length > 0) {
                    attributes[attr.type] = attr.values[0]
                  }
                })
              }
        
              userData = {
                departman: attributes.department || "Bilinmiyor",
                unvan: attributes.title || "Bilinmiyor",
              }
            } catch (entryError) {
              console.error("LDAP entry işleme hatası (Dahili:", dahiliNo, "):", entryError)
            }
          })
        
          searchRes.on("error", (err) => {
            console.error(
              "LDAP arama sonuç hatası (Dahili:",
              dahiliNo,
              ", Filter:",
              searchOptions.filter,
              "):",
              err.message
            )
            client.unbind()
            resolve({ departman: "Bilinmiyor", unvan: "Bilinmiyor" })
          })
        
          searchRes.on("end", (result) => {
            client.unbind()
            resolve(userData)
          })
        })        
      })
    }

    // Eğer service account bilgileri varsa onlarla bağlan, yoksa anonymous dene
    if (bindDN && bindPassword) {
      performBind(bindDN, bindPassword)
    } else {
      // Anonymous bind dene
      performBind("", "")
    }

    // Timeout için güvenlik
    setTimeout(() => {
      try {
        client.unbind()
      } catch (e) {
        // Ignore
      }
      resolve({ departman: "Bilinmiyor", unvan: "Bilinmiyor" })
    }, 15000)
  })
}

exports.downloadExcel = async (req, res) => {
  try {
    console.log("Excel download request body:", req.body)

    const { startDate, endDate, filterType } = req.body

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Tarih bilgileri eksik",
      })
    }

    console.log(`Excel için veri API'den çekiliyor: ${startDate} - ${endDate}`)

    let reportData

    if (filterType === "today") {
      reportData = await getReportDataForToday()
    } else if (filterType === "yesterday") {
      reportData = await getReportDataForYesterday()
    } else if (filterType === "last7Days") {
      reportData = await getReportDataForLast7Days()
    } else if (filterType === "last30Days") {
      reportData = await getReportDataForLast30Days()
    } else if (filterType === "thisMonth") {
      reportData = await getReportDataForThisMonth()
    } else if (filterType === "lastMonth") {
      reportData = await getReportDataForLastMonth()
    } else if (filterType === "custom") {
      reportData = await getReportDataFromApi(startDate, endDate)
    } else {
      return res.status(400).json({
        success: false,
        message: "Geçersiz filtreleme seçeneği",
      })
    }

    if (!reportData || !reportData.success || !Array.isArray(reportData.data) || reportData.data.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Excel için veri bulunamadı",
      })
    }

    const data = reportData.data
    console.log(`Excel için ${data.length} adet veri işleniyor...`)

    const userStats = {}

    for (const item of data) {
      const userName = item.contact_user || "N/A"
      const dahiliNo = item.src || "N/A"

      if (!userStats[userName]) {
        // LDAP'tan departman ve unvan bilgilerini çek
        const ldapInfo = await getUserInfoFromLDAP(dahiliNo)

        userStats[userName] = {
          userName: userName,
          dahiliNo: dahiliNo,
          departman: ldapInfo.departman,
          unvan: ldapInfo.unvan,
          totalInbound: 0,
          totalOutbound: 0,
          totalAnswered: 0,
          totalMissed: 0,
          totalTransferred: 0,
          totalInboundDuration: 0,
          totalOutboundDuration: 0,
        }
      }

      // Sum all values for each user
      userStats[userName].totalInbound +=
        (item.answeredCallCount || 0) + (item.noAnsweredCallCount || 0) + (item.transferredCallCount || 0)
      userStats[userName].totalOutbound += item.outboundCallCount || 0
      userStats[userName].totalAnswered += item.answeredCallCount || 0
      userStats[userName].totalMissed += item.noAnsweredCallCount || 0
      userStats[userName].totalTransferred += item.transferredCallCount || 0
      userStats[userName].totalInboundDuration += item.inboundCallDuration || 0
      userStats[userName].totalOutboundDuration += item.outboundCallDuration || 0
    }

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Dahili Rapor")

    worksheet.addRow([
      "Kullanıcı Adı",
      "Dahili No",
      "Departman",
      "Unvan",
      "Gelen Çağrı",
      "Giden Çağrı",
      "Cevaplanan",
      "Cevaplanmayan",
      "Transfer Edilen",
      "Gelen Çağrı Süresi (sn)",
      "Giden Çağrı Süresi (sn)",
      "Cevap Verme Oranı (%)",
    ])

    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true }
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE6E6FA" },
    }

    Object.values(userStats).forEach((user) => {
      // Calculate answer rate percentage
      const totalIncomingCalls = user.totalAnswered + user.totalMissed
      const answerRate = totalIncomingCalls > 0 ? ((user.totalAnswered / totalIncomingCalls) * 100).toFixed(2) : "0.00"

      worksheet.addRow([
        user.userName,
        user.dahiliNo,
        user.departman,
        user.unvan,
        user.totalInbound,
        user.totalOutbound,
        user.totalAnswered,
        user.totalMissed,
        user.totalTransferred,
        user.totalInboundDuration,
        user.totalOutboundDuration,
        answerRate + "%",
      ])
    })

    worksheet.columns.forEach((column) => {
      column.width = 15
    })

    const buffer = await workbook.xlsx.writeBuffer()

    const fileName = `dahili_rapor_${startDate}_${endDate}.xlsx`

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`)
    res.send(buffer)

    console.log("Excel dosyası başarıyla oluşturuldu:", fileName)
  } catch (error) {
    console.error("Excel dosyası oluşturulurken hata:", error)
    res.status(500).json({
      success: false,
      message: "Excel dosyası oluşturulamadı: " + error.message,
    })
  }
}
