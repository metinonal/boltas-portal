exports.getAdminPanel = (req, res) => {
    try {
        res.render("ikyonetim/index", { title: "Admin Paneli" }); // Admin panelinin ana sayfası
    } catch (err) {
        console.error("Admin paneli görüntülenirken bir hata oluştu:", err);
        res.status(500).send("Admin paneli görüntülenirken bir hata oluştu.");
    }
};
