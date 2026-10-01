const express = require('express');
const leadController = require('../controllers/leadController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkSubscription = require('../middlewares/checkSubscription');
const adminMiddleware = require('../middlewares/adminMiddleware');

const router = express.Router();

router.get('/dashboard', authMiddleware, checkSubscription, leadController.getDashboard);
router.get('/timeseries', authMiddleware, checkSubscription, leadController.getLeadsTimeseries);
router.get('/export', authMiddleware, checkSubscription, leadController.exportLeads);
router.get('/ranking', authMiddleware, checkSubscription, adminMiddleware, leadController.getBrokerRanking);
router.get('/stale', authMiddleware, checkSubscription, leadController.getStaleLeads);
router.get('/new-count', authMiddleware, checkSubscription, leadController.getNewLeadsCount);
router.put('/mark-seen', authMiddleware, checkSubscription, leadController.markLeadsSeen);
router.get('/public/:slug', leadController.getPublicCompany);
router.post('/public/:slug', leadController.createPublicLead);
router.get('/:id/profile', authMiddleware, checkSubscription, leadController.getLeadProfile);
router.get('/:id/suggestions', authMiddleware, checkSubscription, leadController.getLeadSuggestions);
router.put('/:id/profile', authMiddleware, checkSubscription, leadController.updateLeadProfile);
router.get('/:id/history', authMiddleware, checkSubscription, leadController.getLeadHistory);
router.post('/:id/history', authMiddleware, checkSubscription, leadController.addLeadNote);
router.post('/', authMiddleware, checkSubscription, leadController.createLead);
router.get('/', authMiddleware, checkSubscription, leadController.getLeads);
router.put('/:id', authMiddleware, checkSubscription, leadController.updateLead);
router.delete('/:id', authMiddleware, checkSubscription, leadController.deleteLead);

module.exports = router;