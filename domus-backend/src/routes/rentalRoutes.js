const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const checkSubscription = require('../middlewares/checkSubscription');
const adminMiddleware = require('../middlewares/adminMiddleware');
const rentalAccessMiddleware = require('../middlewares/rentalAccessMiddleware');
const rentalController = require('../controllers/rentalController');

router.get('/properties', authMiddleware, checkSubscription, rentalAccessMiddleware, rentalController.getProperties);
router.post('/properties', authMiddleware, checkSubscription, rentalAccessMiddleware, rentalController.createProperty);
router.put('/properties/:id', authMiddleware, checkSubscription, adminMiddleware, rentalController.updateProperty);
router.delete('/properties/:id', authMiddleware, checkSubscription, adminMiddleware, rentalController.deleteProperty);
router.post('/generate-month', authMiddleware, checkSubscription, adminMiddleware, rentalController.generateMonthlyPayments);
router.get('/payments', authMiddleware, checkSubscription, rentalAccessMiddleware, rentalController.getPayments);
router.put('/payments/:id/status', authMiddleware, checkSubscription, adminMiddleware, rentalController.updatePaymentStatus);
router.get('/dashboard', authMiddleware, checkSubscription, rentalAccessMiddleware, rentalController.getDashboard);
module.exports = router;