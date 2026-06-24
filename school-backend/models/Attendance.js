const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    records: [
        {
            student: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Student',
                required: true
            },
            status: {
                type: String,
                enum: ['present', 'absent'],
                default: 'present'
            }
        }
    ],
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

// one attendance record per class per day
attendanceSchema.index({ date: 1, class: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
