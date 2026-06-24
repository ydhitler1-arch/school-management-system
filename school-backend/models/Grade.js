const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    examType: {
        type: String,
        enum: ['Unit Test', 'Mid Term', 'Final Exam', 'Assignment', 'Project'],
        required: true
    },
    marksObtained: {
        type: Number,
        required: true,
        min: 0
    },
    totalMarks: {
        type: Number,
        required: true,
        min: 1
    },
    grade: {
        type: String,
        trim: true
    },
    remarks: {
        type: String,
        trim: true,
        default: ''
    },
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

// auto-calculate grade letter before saving
gradeSchema.pre('save', function (next) {
    const pct = (this.marksObtained / this.totalMarks) * 100;
    if      (pct >= 90) this.grade = 'A+';
    else if (pct >= 80) this.grade = 'A';
    else if (pct >= 70) this.grade = 'B';
    else if (pct >= 60) this.grade = 'C';
    else if (pct >= 50) this.grade = 'D';
    else                this.grade = 'F';
    next();
});

module.exports = mongoose.model('Grade', gradeSchema);
