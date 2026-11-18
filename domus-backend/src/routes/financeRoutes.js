const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const checkSubscription = require('../middlewares/checkSubscription');
const adminMiddleware = require('../middlewares/adminMiddleware');
const financeController = require('../controllers/financeController');

router.get('/summary', authMiddleware, checkSubscription, adminMiddleware, financeController.getSummary);
router.get('/future-rentals', authMiddleware, checkSubscription, adminMiddleware, financeController.getFutureRentals);
router.get('/deposits', authMiddleware, checkSubscription, adminMiddleware, financeController.getDeposits);

module.exports = router;