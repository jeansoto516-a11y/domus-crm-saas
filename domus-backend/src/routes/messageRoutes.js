const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const superAdminMiddleware = require('../middlewares/superAdminMiddleware');
const messageController = require('../controllers/messageController');

// lado da imobiliaria (somente admin da imobiliaria)
router.get('/', authMiddleware, adminMiddleware, messageController.getMyMessages);
router.post('/', authMiddleware, adminMiddleware, messageController.sendMyMessage);

// lado do super admin
router.get('/company/:companyId', authMiddleware, superAdminMiddleware, messageController.getCompanyMessages);
router.post('/company/:companyId', authMiddleware, superAdminMiddleware, messageController.sendCompanyMessage);

module.exports = router;