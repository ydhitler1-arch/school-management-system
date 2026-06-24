const express = require('express');
const router = express.Router();
const authController = require('../controllers/authcontroller');
const { authenticate, authorize } = require('../middleware/auth');
const { loginValidationRules, registerValidationRules, handleValidation } = require('../middleware/validators');

router.post('/login', loginValidationRules, handleValidation, authController.login);

// only an already-logged-in admin can create new logins
router.post('/register', authenticate, authorize('admin'), registerValidationRules, handleValidation, authController.register);
router.get('/users', authenticate, authorize('admin'), authController.getUsers);
router.delete('/users/:id', authenticate, authorize('admin'), authController.deleteUser);

module.exports = router;
