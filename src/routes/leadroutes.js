const express = require('express');
const router = express.Router();

const leadController = require('../controllers/leadController');
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkSubscription = require('../middlewares/checkSubscription');

// DASHBOARD
router.get(
    '/dashboard',
    authMiddleware,
    checkSubscription,
    leadController.getDashboard
);

// CRIAR LEAD
router.post(
    '/',
    authMiddleware,
    checkSubscription,
    leadController.createLead
);

//LISTAR LEADS
router.get(
    '/',
    authMiddleware,
    checkSubscription,
    leadController.getLeads
);

//ATUALIZAR LEAD (STATUS PIPELINE)
router.put(
    '/:id',
    authMiddleware,
    checkSubscription,
    leadController.updateLead
);

//PAGAMENTOS
router.post(
    '/payment',
    paymentController.createPayment
);

//WEBHOOKS
router.post(
    '/webhook',
    paymentController.webhook
);

router.post(
    '/conduz/webhook',
    paymentController.webhook
);

module.exports = router;