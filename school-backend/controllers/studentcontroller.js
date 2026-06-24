const Student = require('../models/Student');

// GET /api/students — only active students by default
exports.getStudents = async (req, res) => {
    try {
        const students = await Student.find({ isActive: { $ne: false } })
            .populate('class', 'className section');
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch students" });
    }
};

// GET /api/students/:id
exports.getStudentById = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id)
            .populate('class', 'className section');
        if (!student) return res.status(404).json({ error: "Student not found" });
        res.json(student);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch student" });
    }
};

// POST /api/students
exports.addStudent = async (req, res) => {
    try {
        const { name, age, class: classId, rollNo } = req.body;
        const student = new Student({ name, age, class: classId || null, rollNo });
        await student.save();
        const populated = await student.populate('class', 'className section');
        res.status(201).json(populated);
    } catch (err) {
        res.status(400).json({ error: "Could not add student" });
    }
};

// PUT /api/students/:id
exports.updateStudent = async (req, res) => {
    try {
        const { name, age, class: classId, rollNo } = req.body;
        const student = await Student.findByIdAndUpdate(
            req.params.id,
            { name, age, class: classId || null, rollNo },
            { new: true, runValidators: true }
        ).populate('class', 'className section');
        if (!student) return res.status(404).json({ error: "Student not found" });
        res.json(student);
    } catch (err) {
        res.status(400).json({ error: "Could not update student" });
    }
};

// DELETE /api/students/:id — soft delete (sets isActive: false)
exports.deleteStudent = async (req, res) => {
    try {
        const student = await Student.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );
        if (!student) return res.status(404).json({ error: "Student not found" });
        res.json({ message: "Student removed" });
    } catch (err) {
        res.status(500).json({ error: "Could not remove student" });
    }
};
