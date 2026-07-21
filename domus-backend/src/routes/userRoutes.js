const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const userController = require('../controllers/userController');
const checkSubscription = require('../middlewares/checkSubscription');

router.get(
    '/',
    authMiddleware,
    checkSubscription,
    userController.getBrokers
);

router.post(
    '/',
    authMiddleware,
    checkSubscription,
    userController.createBroker
);

router.put(
    '/:id',
    authMiddleware,
    checkSubscription,
    userController.updateBroker
);

router.delete(
    '/:id',
    authMiddleware,
    checkSubscription,
    userController.deleteBroker
);

module.exports = router;