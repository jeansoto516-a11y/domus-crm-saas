const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const userController = require('../controllers/userController');
const adminMiddleware = require('../middlewares/adminMiddleware');
const checkSubscription = require('../middlewares/checkSubscription');
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

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

router.post(
    '/me/avatar',
    authMiddleware,
    upload.single('avatar'),
    userController.uploadAvatar
);

router.put(
    '/company',
    authMiddleware,
    adminMiddleware,
    userController.updateCompany
);

router.put(
    '/company/plan',
    authMiddleware,
    adminMiddleware,
    userController.updatePlan
);

router.get(
    '/plans',
    authMiddleware,
    userController.getPlans
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