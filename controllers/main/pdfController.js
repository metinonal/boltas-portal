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
  