const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const checkSubscription = require('../middlewares/checkSubscription');
const adminMiddleware = require('../middlewares/adminMiddleware');
const saleController = require('../controllers/saleController');

router.get('/', authMiddleware, checkSubscription, adminMiddleware, saleController.getSales);
router.post('/', authMiddleware, checkSubscription, adminMiddleware, saleController.createSale);
router.delete('/:id', authMiddleware, checkSubscription, adminMiddleware, saleController.deleteSale);

module.exports = router;