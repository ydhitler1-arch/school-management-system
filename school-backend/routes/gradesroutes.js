const express = require('express');
const router = express.Router();
const gradesController = require('../controllers/gradescontroller');
const { authenticate, authorize } = require('../middleware/auth');

// report card must be before /:id so it isn't swallowed by the param route
router.get('/report/:studentId', authenticate, gradesController.getReportCard);

router.get('/',    authenticate, gradesController.getGrades);
router.get('/:id', authenticate, gradesController.getGradeById);
router.post('/',   authenticate, gradesController.addGrade);
router.put('/:id', authenticate, authorize('admin'), gradesController.updateGrade);
router.delete('/:id', authenticate, authorize('admin'), gradesController.deleteGrade);

module.exports = router;
