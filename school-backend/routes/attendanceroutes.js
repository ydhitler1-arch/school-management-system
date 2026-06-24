const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendancecontroller');
const { authenticate, authorize } = require('../middleware/auth');

// any logged-in user can view and mark attendance
router.get('/', authenticate, attendanceController.getAttendance);
router.get('/students/:classId', authenticate, attendanceController.getStudentsForClass);
router.get('/:id', authenticate, attendanceController.getAttendanceById);
router.post('/', authenticate, attendanceController.markAttendance);

// only admins can update or delete
router.put('/:id', authenticate, authorize('admin'), attendanceController.updateAttendance);
router.delete('/:id', authenticate, authorize('admin'), attendanceController.deleteAttendance);

module.exports = router;
