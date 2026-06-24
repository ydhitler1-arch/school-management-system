const express = require('express');
const router = express.Router();
const classController = require('../controllers/classcontroller');
const { classValidationRules, handleValidation } = require('../middleware/validators');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, classController.getClasses);
router.get('/:id', authenticate, classController.getClassById);
router.post('/', authenticate, authorize('admin'), classValidationRules, handleValidation, classController.addClass);
router.put('/:id', authenticate, authorize('admin'), classValidationRules, handleValidation, classController.updateClass);
router.delete('/:id', authenticate, authorize('admin'), classController.deleteClass);

module.exports = router;
