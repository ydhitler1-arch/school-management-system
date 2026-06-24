const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementcontroller');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/',    authenticate, announcementController.getAnnouncements);
router.post('/',   authenticate, authorize('admin'), announcementController.addAnnouncement);
router.delete('/:id', authenticate, authorize('admin'), announcementController.deleteAnnouncement);

module.exports = router;
