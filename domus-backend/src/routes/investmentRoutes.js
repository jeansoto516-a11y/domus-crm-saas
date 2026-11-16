const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const checkSubscription = require('../middlewares/checkSubscription');
const adminMiddleware = require('../middlewares/adminMiddleware');
const investmentController = require('../controllers/investmentController');

router.get('/summary', authMiddleware, checkSubscription, adminMiddleware, investmentController.getSummary);
router.get('/', authMiddleware, checkSubscription, adminMiddleware, investmentController.getInvestments);
router.post('/', authMiddleware, checkSubscription, adminMiddleware, investmentController.createInvestment);
router.delete('/:id', authMiddleware, checkSubscription, adminMiddleware, investmentController.deleteInvestment);

module.exports = router;