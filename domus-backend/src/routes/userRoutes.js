const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const userController = require('../controllers/userController');
const adminMiddleware = require('../middlewares/adminMiddleware');
const checkSubscription = require('../middlewares/checkSubscription');

router.get(
    '/me',
    authMiddleware,
    userController.getMe
);

router.put(
    '/me',
    authMiddleware,
    userController.updateMe
);

router.put(
    '/company',
    authMiddleware,
    adminMiddleware,
    userController.updateCompany
);

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