exports.authMiddleware = (req, res, next) => {
    if (!req.session.authenticated) {
        return res.redirect("/login");
    }
    next();
};

exports.sessionTimeoutMiddleware = (req, res, next) => {
    if (req.session.authenticated && req.session.cookie.maxAge > 0) {
        const currentTime = new Date().getTime();
        const lastAccessTime = req.session.lastAccessTime || currentTime;
        const sessionTimeout = req.session.cookie.maxAge;
        const elapsedTime = currentTime - lastAccessTime;

        if (elapsedTime > sessionTimeout) {
            req.session.destroy((err) => {
                if (err) {
                    console.error('Oturum sonlandırma hatası:', err);
                }
            });
            return res.redirect("/login");
        } else {
            req.session.lastAccessTime = currentTime;
        }
    }
    next();
};
