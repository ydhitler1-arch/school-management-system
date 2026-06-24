const express = require('express');
const router  = express.Router();
const promoteController = require('../controllers/promotecontroller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/',  authenticate, authorize('admin'), promoteController.getClasses);
router.post('/', authenticate, authorize('admin'), promoteController.promoteStudents);

module.exports = router;
