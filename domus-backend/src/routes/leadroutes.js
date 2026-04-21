const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');
const checkSubscription = require('../middlewares/checkSubscription'); // TRIAL DE 14 DIAS PARA PAGAMENTO

//BASE PARA CRIAR AS DASHBOARDS E ESTATÍSTICAS
router.get('/stats', authMiddleware, checkSubscription, leadController.getLeadsStats);
router.get('/dashboard', authMiddleware, checkSubscription, leadController.getDashboard);

// criar lead 
router.post('/', authMiddleware, checkSubscription, leadController.createLead);

// listar leads
router.get('/', authMiddleware, checkSubscription, leadController.getLeads);

// atualizar lead
router.put('/:id', authMiddleware, checkSubscription, leadController.updateLead);

// criar pagamento
router.post('/webhook', paymentController.webhook);
router.post('/payment',paymentController.createPayment);
router.post('/conduz/webhook', paymentController.webhook);

module.exports = router;