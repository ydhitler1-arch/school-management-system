const { body, validationResult } = require('express-validator');

// Runs after the validation chains below; if any rule failed,
// responds with 400 and a clear list of what's wrong instead of
// letting bad data reach the database or returning a generic error.
exports.handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: "Validation failed",
            details: errors.array().map(e => ({ field: e.path, message: e.msg }))
        });
    }
    next();
};

exports.studentValidationRules = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ max: 100 }).withMessage('Name is too long'),
    body('age')
        .notEmpty().withMessage('Age is required')
        .isInt({ min: 1, max: 100 }).withMessage('Age must be a number between 1 and 100'),
    body('class')
        .optional({ checkFalsy: true })
        .isMongoId().withMessage('Invalid class selected'),
    body('rollNo')
        .optional({ checkFalsy: true })
        .isInt({ min: 0 }).withMessage('Roll number must be a positive number')
];

exports.teacherValidationRules = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ max: 100 }).withMessage('Name is too long'),
    body('subject')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 100 }).withMessage('Subject is too long'),
    body('email')
        .optional({ checkFalsy: true })
        .trim()
        .isEmail().withMessage('Must be a valid email address'),
    // password is only sent on create (POST); skip validation when absent on updates
    body('password')
        .if(body('password').exists({ checkFalsy: true }))
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

exports.classValidationRules = [
    body('className')
        .trim()
        .notEmpty().withMessage('Class name is required')
        .isLength({ max: 50 }).withMessage('Class name is too long'),
    body('section')
        .optional({ checkFalsy: true })
        .trim()
        .isLength({ max: 20 }).withMessage('Section is too long'),
    body('classTeacher')
        .optional({ checkFalsy: true })
        .isMongoId().withMessage('Invalid teacher selected')
];

exports.loginValidationRules = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Must be a valid email address'),
    body('password')
        .notEmpty().withMessage('Password is required')
];

exports.registerValidationRules = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ max: 100 }).withMessage('Name is too long'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Must be a valid email address'),
    body('password')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role')
        .optional()
        .isIn(['admin', 'teacher']).withMessage('Role must be admin or teacher')
];
