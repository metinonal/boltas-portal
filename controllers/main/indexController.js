exports.indexPage = async (req, res) => {
       try {
        res.render("main/index");
    } catch (err) {
        console.log(err);
        res.status(500).send("Ana sayfada bir sorun var.");
    }
};