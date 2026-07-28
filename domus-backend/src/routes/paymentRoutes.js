const express = require('express');
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/status', authMiddleware, paymentController.getSubscriptionStatus);

router.post('/checkout/card', authMiddleware, paymentController.createCardSubscription);
router.post('/checkout/pix', authMiddleware, paymentController.createPixCharge);
router.post('/webhook', paymentController.webhook);
router.post('/conduz/webhook', paymentController.webhook);

module.exports = router;