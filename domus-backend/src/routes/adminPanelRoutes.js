const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const superAdminMiddleware = require('../middlewares/superAdminMiddleware');
const adminPanelController = require('../controllers/adminPanelController');

router.get('/stats', authMiddleware, superAdminMiddleware, adminPanelController.getStats);
router.get('/companies', authMiddleware, superAdminMiddleware, adminPanelController.listCompanies);
router.put('/companies/:id/status', authMiddleware, superAdminMiddleware, adminPanelController.updateCompanyStatus);

module.exports = router;