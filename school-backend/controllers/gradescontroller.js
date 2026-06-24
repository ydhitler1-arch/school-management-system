const Grade = require('../models/Grade');
const Student = require('../models/Student');

// GET /api/grades?classId=...&studentId=...&examType=...
exports.getGrades = async (req, res) => {
    try {
        const filter = {};
        if (req.query.classId)   filter.class   = req.query.classId;
        if (req.query.studentId) filter.student = req.query.studentId;
        if (req.query.examType)  filter.examType = req.query.examType;

        const grades = await Grade.find(filter)
            .populate('student', 'name rollNo')
            .populate('class', 'className section')
            .populate('recordedBy', 'name')
            .sort({ createdAt: -1 });

        res.json(grades);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch grades" });
    }
};

// GET /api/grades/report/:studentId
// returns all grades for a student grouped by subject — the report card view
exports.getReportCard = async (req, res) => {
    try {
        const student = await Student.findById(req.params.studentId)
            .populate('class', 'className section');
        if (!student) return res.status(404).json({ error: "Student not found" });

        const grades = await Grade.find({ student: req.params.studentId })
            .populate('class', 'className section')
            .sort({ subject: 1, createdAt: -1 });

        // group by subject
        const bySubject = {};
        grades.forEach(g => {
            if (!bySubject[g.subject]) bySubject[g.subject] = [];
            bySubject[g.subject].push({
                examType: g.examType,
                marksObtained: g.marksObtained,
                totalMarks: g.totalMarks,
                grade: g.grade,
                remarks: g.remarks
            });
        });

        res.json({ student, bySubject });
    } catch (err) {
        res.status(500).json({ error: "Could not fetch report card" });
    }
};

// GET /api/grades/:id
exports.getGradeById = async (req, res) => {
    try {
        const grade = await Grade.findById(req.params.id)
            .populate('student', 'name rollNo')
            .populate('class', 'className section')
            .populate('recordedBy', 'name');
        if (!grade) return res.status(404).json({ error: "Grade not found" });
        res.json(grade);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch grade" });
    }
};

// POST /api/grades
exports.addGrade = async (req, res) => {
    try {
        const { student, class: classId, subject, examType, marksObtained, totalMarks, remarks } = req.body;
        const grade = new Grade({
            student,
            class: classId,
            subject,
            examType,
            marksObtained,
            totalMarks,
            remarks,
            recordedBy: req.user.id
        });
        await grade.save();
        await grade.populate('student', 'name rollNo');
        await grade.populate('class', 'className section');
        res.status(201).json(grade);
    } catch (err) {
        res.status(400).json({ error: "Could not add grade" });
    }
};

// PUT /api/grades/:id
exports.updateGrade = async (req, res) => {
    try {
        const { subject, examType, marksObtained, totalMarks, remarks } = req.body;

        const grade = await Grade.findById(req.params.id);
        if (!grade) return res.status(404).json({ error: "Grade not found" });

        grade.subject        = subject        ?? grade.subject;
        grade.examType       = examType       ?? grade.examType;
        grade.marksObtained  = marksObtained  ?? grade.marksObtained;
        grade.totalMarks     = totalMarks     ?? grade.totalMarks;
        grade.remarks        = remarks        ?? grade.remarks;

        await grade.save(); // triggers the pre-save grade recalculation
        await grade.populate('student', 'name rollNo');
        await grade.populate('class', 'className section');
        res.json(grade);
    } catch (err) {
        res.status(400).json({ error: "Could not update grade" });
    }
};

// DELETE /api/grades/:id
exports.deleteGrade = async (req, res) => {
    try {
        const grade = await Grade.findByIdAndDelete(req.params.id);
        if (!grade) return res.status(404).json({ error: "Grade not found" });
        res.json({ message: "Grade deleted" });
    } catch (err) {
        res.status(500).json({ error: "Could not delete grade" });
    }
};
