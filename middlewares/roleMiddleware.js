const RoleModel = require('../models/User'); // MongoDB user schema

const requireRole = (requiredRole) => {
  return async (req, res, next) => {
    const email = req.session.user?.EMail; // MSSQL'den gelen e-posta

    if (!email) {
      return res.status(401).send('Oturum bulunamadı.');
    }

    try {
      const mongoUser = await RoleModel.findOne({ email });

      if (!mongoUser) {
        return res.status(403).send("Kullanıcı rol bilgisi bulunamadı.");
      }

      const roles = mongoUser.roles || [];

      // Admin her şeye erişebilir
      if (roles.includes('admin')) return next();

      // Gerekli role sahipse devam et
      if (!roles.includes(requiredRole)) {
        return res.status(403).send("Bu sayfaya erişim yetkiniz yok.");
      }

      next();
    } catch (err) {
      console.error("Rol kontrol hatası:", err);
      res.status(500).send("Sunucu hatası.");
    }
  };
};

module.exports = requireRole;
