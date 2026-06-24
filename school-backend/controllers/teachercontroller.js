const Teacher = require('../models/Teacher');

// GET /api/teachers
exports.getTeachers = async (req, res) => {
    try {
        const teachers = await Teacher.find();
        res.json(teachers);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch teachers" });
    }
};

// GET /api/teachers/:id
exports.getTeacherById = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) return res.status(404).json({ error: "Teacher not found" });
        res.json(teacher);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch teacher" });
    }
};

// POST /api/teachers
exports.addTeacher = async (req, res) => {
    try {
        const { name, subject, email } = req.body;
        const teacher = new Teacher({ name, subject, email });
        await teacher.save();
        res.status(201).json(teacher);
    } catch (err) {
        res.status(400).json({ error: "Could not add teacher" });
    }
};

// PUT /api/teachers/:id
exports.updateTeacher = async (req, res) => {
    try {
        const { name, subject, email } = req.body;
        const teacher = await Teacher.findByIdAndUpdate(
            req.params.id,
            { name, subject, email },
            { new: true, runValidators: true }
        );
        if (!teacher) return res.status(404).json({ error: "Teacher not found" });
        res.json(teacher);
    } catch (err) {
        res.status(400).json({ error: "Could not update teacher" });
    }
};

// DELETE /api/teachers/:id
exports.deleteTeacher = async (req, res) => {
    try {
        const teacher = await Teacher.findByIdAndDelete(req.params.id);
        if (!teacher) return res.status(404).json({ error: "Teacher not found" });
        res.json({ message: "Teacher deleted" });
    } catch (err) {
        res.status(500).json({ error: "Could not delete teacher" });
    }
};
