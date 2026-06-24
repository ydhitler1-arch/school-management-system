const Announcement = require('../models/Announcement');

// GET /api/announcements — all announcements, newest first
exports.getAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find()
            .populate('postedBy', 'name role')
            .sort({ createdAt: -1 })
            .limit(20);
        res.json(announcements);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch announcements" });
    }
};

// POST /api/announcements — admin only
exports.addAnnouncement = async (req, res) => {
    try {
        const { title, message, priority } = req.body;
        if (!title || !message) {
            return res.status(400).json({ error: "Title and message are required" });
        }
        const announcement = await Announcement.create({
            title, message,
            priority: priority || 'normal',
            postedBy: req.user.id
        });
        await announcement.populate('postedBy', 'name role');
        res.status(201).json(announcement);
    } catch (err) {
        res.status(400).json({ error: "Could not post announcement" });
    }
};

// DELETE /api/announcements/:id — admin only
exports.deleteAnnouncement = async (req, res) => {
    try {
        const a = await Announcement.findByIdAndDelete(req.params.id);
        if (!a) return res.status(404).json({ error: "Announcement not found" });
        res.json({ message: "Announcement deleted" });
    } catch (err) {
        res.status(500).json({ error: "Could not delete announcement" });
    }
};
