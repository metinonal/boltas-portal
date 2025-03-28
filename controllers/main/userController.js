const { authMain } = require('../../middlewares/authMiddleware');

const mainProfile = (req, res) => {
  const user = req.session.user;
  res.render('main/profile', { user });
};



module.exports = { mainProfile };
