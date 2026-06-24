const Timetable = require('../models/Timetable');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// GET /api/timetable?classId=...
// returns all timetable entries for a class, one per day
exports.getTimetable = async (req, res) => {
    try {
        if (!req.query.classId) {
            return res.status(400).json({ error: "classId is required" });
        }

        const entries = await Timetable.find({ class: req.query.classId })
            .populate('periods.teacher', 'name subject')
            .sort({ day: 1 });

        // return a full week structure — missing days are empty arrays
        const byDay = {};
        DAYS.forEach(d => { byDay[d] = []; });
        entries.forEach(e => { byDay[e.day] = e.periods; });

        res.json({ classId: req.query.classId, days: byDay });
    } catch (err) {
        res.status(500).json({ error: "Could not fetch timetable" });
    }
};

// POST /api/timetable — save or replace a full day's schedule for a class
exports.saveDaySchedule = async (req, res) => {
    try {
        const { classId, day, periods } = req.body;

        if (!classId || !day || !Array.isArray(periods)) {
            return res.status(400).json({ error: "classId, day, and periods are required" });
        }

        // upsert: create if doesn't exist, replace if it does
        const entry = await Timetable.findOneAndUpdate(
            { class: classId, day },
            { class: classId, day, periods },
            { new: true, upsert: true, runValidators: true }
        ).populate('periods.teacher', 'name subject');

        res.json(entry);
    } catch (err) {
        console.error('saveDaySchedule error:', err);
        res.status(400).json({ error: "Could not save timetable" });
    }
};

// DELETE /api/timetable — clear a day's schedule for a class
exports.clearDaySchedule = async (req, res) => {
    try {
        const { classId, day } = req.body;
        await Timetable.findOneAndDelete({ class: classId, day });
        res.json({ message: `${day} schedule cleared` });
    } catch (err) {
        res.status(500).json({ error: "Could not clear schedule" });
    }
};
