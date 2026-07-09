const express = require('express');
const leadController = require('../controllers/leadController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/dashboard', authMiddleware, leadController.getDashboard);
router.post('/', authMiddleware, leadController.createLead);
router.get('/', authMiddleware, leadController.getLeads);
router.put('/:id', authMiddleware, leadController.updateLead);
router.delete('/:id', authMiddleware, leadController.deleteLead);

module.exports = router;
