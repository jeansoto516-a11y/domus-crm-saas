const express = require('express');

const router = express.Router();

const leadController = require('../controllers/leadController');

const paymentController = require('../controllers/paymentController');

const authMiddleware = require('../middlewares/authMiddleware');

// DASHBOARD
router.get(
    '/dashboard',
    authMiddleware,
    leadController.getDashboard
);

// CRIAR LEAD
router.post(
    '/',
    authMiddleware,
    leadController.createLead
);

// LISTAR LEADS
router.get(
    '/',
    authMiddleware,
    leadController.getLeads
);

// ATUALIZAR LEAD
router.put(
    '/:id',
    authMiddleware,
    leadController.updateLead
);

// PAGAMENTO
router.post(
    '/payment',
    paymentController.createPayment
);

// WEBHOOK
router.post(
    '/webhook',
    paymentController.webhook
);

router.post(
    '/conduz/webhook',
    paymentController.webhook
);

module.exports = router;