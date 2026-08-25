const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/authMiddleware');
const reminderController = require('../controllers/reminderController');

router.get('/', authMiddleware, reminderController.getReminders);
router.post('/', authMiddleware, reminderController.createReminder);
router.put('/:id', authMiddleware, reminderController.toggleReminder);
router.delete('/:id', authMiddleware, reminderController.deleteReminder);

module.exports = router;