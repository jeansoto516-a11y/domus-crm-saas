const express = require('express');
const leadController = require('../controllers/leadController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkSubscription = require('../middlewares/checkSubscription');

const router = express.Router();

router.get('/dashboard', authMiddleware, checkSubscription, leadController.getDashboard);
router.get('/export', authMiddleware, checkSubscription, leadController.exportLeads);
router.get('/:id/history', authMiddleware, checkSubscription, leadController.getLeadHistory);
router.post('/:id/history', authMiddleware, checkSubscription, leadController.addLeadNote);
router.post('/', authMiddleware, checkSubscription, leadController.createLead);
router.get('/', authMiddleware, checkSubscription, leadController.getLeads);
router.put('/:id', authMiddleware, checkSubscription, leadController.updateLead);
router.delete('/:id', authMiddleware, checkSubscription, leadController.deleteLead);

module.exports = router;