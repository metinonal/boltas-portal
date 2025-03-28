const fs = require('fs');
const path = require('path');

module.exports = (req, res, next) => {
    if (req.session && req.session.user) {
        const { displayName, EMail, Unvan } = req.session.user;

        res.locals.displayName = displayName;
        res.locals.EMail = EMail;
        res.locals.Unvan = Unvan;

        const photoPath = path.join(__dirname, '../public/uploads/pphotos/', `${EMail}.png`);
        res.locals.userPhoto = fs.existsSync(photoPath) ? `${EMail}.png` : 'default.jpg';
    } else {
        res.locals.displayName = null;
        res.locals.EMail = null;
        res.locals.Unvan = null;
        res.locals.userPhoto = 'default.jpg';
    }
    next();
};
