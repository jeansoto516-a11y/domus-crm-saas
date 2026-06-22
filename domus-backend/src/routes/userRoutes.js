const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const userController = require('../controllers/userController');

router.post(
    '/',
    authMiddleware,
    userController.createBroker
);

module.exports = router;