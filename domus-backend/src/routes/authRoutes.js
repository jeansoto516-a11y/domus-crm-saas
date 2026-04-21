const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// cadastro
router.post('/register', authController.register);

// login (COLOCA AQUI)
router.post('/login', authController.login);

module.exports = router;