const express = require('express');
const router = express.Router();
const { loginPage, authenticate, logout } = require('../../controllers/main/authController');

const blockIfAuthenticated = (req, res, next) => {
    if (req.session && req.session.authenticated) {
      return res.redirect('/');
    }
    next();
  };

router.get('/login', blockIfAuthenticated, loginPage);
router.post('/login', authenticate);
router.get('/logout', logout);

module.exports = router;
