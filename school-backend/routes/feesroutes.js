const express = require('express');
const router = express.Router();
const feesController = require('../controllers/feescontroller');
const { authenticate, authorize } = require('../middleware/auth');

// summary must be before /:id
router.get('/summary', authenticate, feesController.getFeeSummary);

router.get('/',    authenticate, feesController.getFees);
router.get('/:id', authenticate, feesController.getFeeById);

// both roles can add fees and mark as paid
router.post('/',           authenticate, feesController.addFee);
router.patch('/:id/pay',   authenticate, feesController.markAsPaid);

// only admin can edit or delete
router.put('/:id',    authenticate, authorize('admin'), feesController.updateFee);
router.delete('/:id', authenticate, authorize('admin'), feesController.deleteFee);

module.exports = router;
