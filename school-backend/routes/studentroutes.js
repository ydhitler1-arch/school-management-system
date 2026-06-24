const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentcontroller');
const { studentValidationRules, handleValidation } = require('../middleware/validators');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, studentController.getStudents);
router.get('/:id', authenticate, studentController.getStudentById);
router.post('/', authenticate, authorize('admin'), studentValidationRules, handleValidation, studentController.addStudent);
router.put('/:id', authenticate, authorize('admin'), studentValidationRules, handleValidation, studentController.updateStudent);
router.delete('/:id', authenticate, authorize('admin'), studentController.deleteStudent);

module.exports = router;
