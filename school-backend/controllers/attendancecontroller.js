const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

// GET /api/attendance?classId=...&date=...
// returns records filtered by class and/or date
exports.getAttendance = async (req, res) => {
    try {
        const filter = {};
        if (req.query.classId) filter.class = req.query.classId;
        if (req.query.date) {
            const d = new Date(req.query.date);
            const next = new Date(d);
            next.setDate(next.getDate() + 1);
            filter.date = { $gte: d, $lt: next };
        }

        const records = await Attendance.find(filter)
            .populate('class', 'className section')
            .populate('records.student', 'name rollNo')
            .populate('markedBy', 'name')
            .sort({ date: -1 });

        res.json(records);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch attendance" });
    }
};

// GET /api/attendance/:id
exports.getAttendanceById = async (req, res) => {
    try {
        const record = await Attendance.findById(req.params.id)
            .populate('class', 'className section')
            .populate('records.student', 'name rollNo')
            .populate('markedBy', 'name');
        if (!record) return res.status(404).json({ error: "Attendance record not found" });
        res.json(record);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch attendance record" });
    }
};

// GET /api/attendance/students/:classId
// returns all students in a class so the frontend can build the checklist
exports.getStudentsForClass = async (req, res) => {
    try {
        const students = await Student.find({ class: req.params.classId }).sort({ rollNo: 1, name: 1 });
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch students for this class" });
    }
};

// POST /api/attendance
// marks attendance for a class on a given date
exports.markAttendance = async (req, res) => {
    try {
        const { date, classId, records } = req.body;

        // normalise to midnight UTC so the unique index works correctly
        const day = new Date(date);
        day.setUTCHours(0, 0, 0, 0);

        const existing = await Attendance.findOne({ date: day, class: classId });
        if (existing) {
            return res.status(400).json({
                error: "Attendance has already been marked for this class on this date. Use edit to update it."
            });
        }

        const attendance = new Attendance({
            date: day,
            class: classId,
            records,
            markedBy: req.user.id
        });
        await attendance.save();

        const populated = await attendance
            .populate('class', 'className section')
        await attendance.populate('records.student', 'name rollNo');

        res.status(201).json(attendance);
    } catch (err) {
        res.status(400).json({ error: "Could not mark attendance" });
    }
};

// PUT /api/attendance/:id
// update an existing attendance record (e.g. correct a mistake)
exports.updateAttendance = async (req, res) => {
    try {
        const { records } = req.body;
        const attendance = await Attendance.findByIdAndUpdate(
            req.params.id,
            { records },
            { new: true, runValidators: true }
        )
            .populate('class', 'className section')
            .populate('records.student', 'name rollNo')
            .populate('markedBy', 'name');

        if (!attendance) return res.status(404).json({ error: "Attendance record not found" });
        res.json(attendance);
    } catch (err) {
        res.status(400).json({ error: "Could not update attendance" });
    }
};

// DELETE /api/attendance/:id
exports.deleteAttendance = async (req, res) => {
    try {
        const record = await Attendance.findByIdAndDelete(req.params.id);
        if (!record) return res.status(404).json({ error: "Attendance record not found" });
        res.json({ message: "Attendance record deleted" });
    } catch (err) {
        res.status(500).json({ error: "Could not delete attendance record" });
    }
};
