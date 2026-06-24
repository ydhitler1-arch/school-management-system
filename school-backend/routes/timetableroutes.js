const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetablecontroller');
const { authenticate, authorize } = require('../middleware/auth');

// everyone can view, only admins can edit
router.get('/',    authenticate, timetableController.getTimetable);
router.post('/',   authenticate, authorize('admin'), timetableController.saveDaySchedule);
router.delete('/', authenticate, authorize('admin'), timetableController.clearDaySchedule);

module.exports = router;
