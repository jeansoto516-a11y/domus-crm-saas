const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const checkSubscription = require('../middlewares/checkSubscription');
const adminMiddleware = require('../middlewares/adminMiddleware');
const metaAdsController = require('../controllers/metaAdsController');

router.get('/status', authMiddleware, checkSubscription, metaAdsController.getStatus);
router.put('/connect', authMiddleware, checkSubscription, adminMiddleware, metaAdsController.connect);
router.delete('/disconnect', authMiddleware, checkSubscription, adminMiddleware, metaAdsController.disconnect);
router.get('/insights', authMiddleware, checkSubscription, adminMiddleware, metaAdsController.getInsights);

module.exports = router;