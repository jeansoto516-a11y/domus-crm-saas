const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const userController = require('../controllers/userController');

router.get(
    '/',
    authMiddleware,
    userController.getBrokers
);

router.post(
    '/',
    authMiddleware,
    userController.createBroker
);

router.put(
    '/:id',
    authMiddleware,
    userController.updateBroker
);

router.delete(
    '/:id',
    authMiddleware,
    userController.deleteBroker
);

module.exports = router;