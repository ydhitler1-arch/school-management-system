const Student = require('../models/Student');
const Grade = require('../models/Grade');
const Attendance = require('../models/Attendance');
const Fee = require('../models/Fee');

// helper — get the student linked to the logged-in parent
async function getLinkedStudent(req, res) {
    const studentId = req.user.studentId;
    if (!studentId) {
        res.status(403).json({ error: "No student linked to this parent account. Contact the school admin." });
        return null;
    }
    const student = await Student.findById(studentId).populate('class', 'className section');
    if (!student) {
        res.status(404).json({ error: "Linked student not found." });
        return null;
    }
    return student;
}

// GET /api/parent/child — student profile
exports.getChild = async (req, res) => {
    try {
        const student = await getLinkedStudent(req, res);
        if (!student) return;
        res.json(student);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch student profile" });
    }
};

// GET /api/parent/grades — child's full report card
exports.getGrades = async (req, res) => {
    try {
        const student = await getLinkedStudent(req, res);
        if (!student) return;

        const grades = await Grade.find({ student: student._id })
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
        res.status(500).json({ error: "Could not fetch grades" });
    }
};

// GET /api/parent/attendance — child's attendance records
exports.getAttendance = async (req, res) => {
    try {
        const student = await getLinkedStudent(req, res);
        if (!student) return;

        // find all attendance records where this student appears
        const records = await Attendance.find({
            'records.student': student._id
        })
            .populate('class', 'className section')
            .sort({ date: -1 })
            .limit(60); // last 60 days worth

        // extract just this student's status from each record
        const studentRecords = records.map(r => {
            const entry = r.records.find(x => x.student.toString() === student._id.toString());
            return {
                date:    r.date,
                class:   r.class,
                status:  entry ? entry.status : 'absent'
            };
        });

        // calculate summary
        const total   = studentRecords.length;
        const present = studentRecords.filter(r => r.status === 'present').length;
        const pct     = total > 0 ? Math.round((present / total) * 100) : 0;

        res.json({ student, records: studentRecords, summary: { total, present, absent: total - present, percentage: pct } });
    } catch (err) {
        res.status(500).json({ error: "Could not fetch attendance" });
    }
};

// GET /api/parent/fees — child's fee records
exports.getFees = async (req, res) => {
    try {
        const student = await getLinkedStudent(req, res);
        if (!student) return;

        const fees = await Fee.find({ student: student._id }).sort({ dueDate: 1 });
        const summary = {
            totalPaid:    fees.filter(f => f.status === 'paid').reduce((s, f) => s + f.amount, 0),
            totalPending: fees.filter(f => f.status === 'pending').reduce((s, f) => s + f.amount, 0),
            totalOverdue: fees.filter(f => f.status === 'overdue').reduce((s, f) => s + f.amount, 0),
        };

        res.json({ student, fees, summary });
    } catch (err) {
        res.status(500).json({ error: "Could not fetch fees" });
    }
};
