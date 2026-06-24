const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    feeType: {
        type: String,
        enum: ['Tuition', 'Transport', 'Library', 'Sports', 'Exam', 'Other'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    dueDate: {
        type: Date,
        required: true
    },
    paidDate: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'overdue'],
        default: 'pending'
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

// auto-set status to overdue if due date has passed and still unpaid
feeSchema.pre('save', function (next) {
    if (this.status !== 'paid') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (this.dueDate < today) {
            this.status = 'overdue';
        }
    }
    next();
});

module.exports = mongoose.model('Fee', feeSchema);
