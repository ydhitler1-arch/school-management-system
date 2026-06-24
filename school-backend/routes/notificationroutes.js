const express = require('express');
const router  = express.Router();
const notificationController = require('../controllers/notificationcontroller');
const { authenticate, authorize } = require('../middleware/auth');

// admin only
router.post('/overdue', authenticate, authorize('admin'), notificationController.sendOverdueReminders);
router.post('/test',    authenticate, authorize('admin'), notificationController.sendTestEmail);

module.exports = router;
