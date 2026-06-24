const Student = require('../models/Student');
const Class   = require('../models/Class');

// GET /api/promote/classes — returns all classes for building the promotion UI
exports.getClasses = async (req, res) => {
    try {
        const classes = await Class.find().sort({ className: 1 });
        res.json(classes);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch classes" });
    }
};

// POST /api/promote
// Moves all students from one class to another (or graduates them)
exports.promoteStudents = async (req, res) => {
    try {
        const { fromClassId, toClassId } = req.body;

        if (!fromClassId) {
            return res.status(400).json({ error: "fromClassId is required" });
        }

        // find all active students in the source class
        const students = await Student.find({
            class: fromClassId,
            isActive: { $ne: false }
        });

        if (students.length === 0) {
            return res.status(400).json({ error: "No active students found in this class" });
        }

        if (toClassId) {
            // promote to next class
            await Student.updateMany(
                { class: fromClassId, isActive: { $ne: false } },
                { class: toClassId }
            );
            const toClass = await Class.findById(toClassId);
            res.json({
                message: `${students.length} student${students.length !== 1 ? "s" : ""} promoted to ${toClass ? toClass.className : "new class"}`,
                count: students.length
            });
        } else {
            // graduate — remove class assignment (they've left the school)
            await Student.updateMany(
                { class: fromClassId, isActive: { $ne: false } },
                { class: null }
            );
            res.json({
                message: `${students.length} student${students.length !== 1 ? "s" : ""} graduated (class assignment cleared)`,
                count: students.length
            });
        }
    } catch (err) {
        console.error("promoteStudents error:", err);
        res.status(500).json({ error: "Could not promote students" });
    }
};
