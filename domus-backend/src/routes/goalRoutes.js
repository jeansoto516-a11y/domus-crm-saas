const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const checkSubscription = require('../middlewares/checkSubscription');
const goalController = require('../controllers/goalController');

router.get('/topics', authMiddleware, checkSubscription, goalController.getTopics);
router.post('/topics', authMiddleware, checkSubscription, adminMiddleware, goalController.createTopic);

router.get('/', authMiddleware, checkSubscription, goalController.getGoals);
router.post('/', authMiddleware, checkSubscription, adminMiddleware, goalController.setGoal);
router.put('/:id/progress', authMiddleware, checkSubscription, goalController.updateProgress);
router.delete('/:id', authMiddleware, checkSubscription, adminMiddleware, goalController.deleteGoal);

module.exports = router;