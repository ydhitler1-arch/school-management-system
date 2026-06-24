const express = require('express');
const router  = express.Router();
const parentController = require('../controllers/parentcontroller');
const { authenticate, authorize } = require('../middleware/auth');

// all routes require login and parent role
router.get('/child',      authenticate, authorize('parent'), parentController.getChild);
router.get('/grades',     authenticate, authorize('parent'), parentController.getGrades);
router.get('/attendance', authenticate, authorize('parent'), parentController.getAttendance);
router.get('/fees',       authenticate, authorize('parent'), parentController.getFees);

module.exports = router;
