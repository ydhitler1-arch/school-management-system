const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teachercontroller');
const { teacherValidationRules, handleValidation } = require('../middleware/validators');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, teacherController.getTeachers);
router.get('/:id', authenticate, teacherController.getTeacherById);
router.post('/', authenticate, authorize('admin'), teacherValidationRules, handleValidation, teacherController.addTeacher);
router.put('/:id', authenticate, authorize('admin'), teacherValidationRules, handleValidation, teacherController.updateTeacher);
router.delete('/:id', authenticate, authorize('admin'), teacherController.deleteTeacher);

module.exports = router;
