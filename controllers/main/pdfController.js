// PDF araçları controller
exports.index = (req, res) => {
  res.render("main/pdf-araclari/index", {
    title: "PDF Araçları",
    user: req.session.user,
  })
}

exports.pdfAyir = (req, res) => {
  res.render("main/pdf-araclari/pdf-ayir", {
    title: "PDF Ayır",
    user: req.session.user,
  })
}

exports.pdfBirlestir = (req, res) => {
  res.render("main/pdf-araclari/pdf-birlestir", {
    title: "PDF Birleştir",
    user: req.session.user,
  })
}

exports.pdfSikistir = (req, res) => {
  res.render("main/pdf-araclari/pdf-sikistir", {
    title: "PDF Sıkıştır",
    user: req.session.user,
  })
}

exports.pdfResimCikar = (req, res) => {
  res.render("main/pdf-araclari/pdf-resim-cikar", {
    title: "PDF'ten Resim Çıkar",
    user: req.session.user,
  })
}

exports.resimPdf = (req, res) => {
  res.render("main/pdf-araclari/resim-pdf", {
    title: "Resimden PDF Oluştur",
    user: req.session.user,
  })
}
