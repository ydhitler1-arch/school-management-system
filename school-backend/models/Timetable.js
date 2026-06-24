const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema({
    periodNumber: { type: Number, required: true },
    subject:      { type: String, required: true, trim: true },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        default: null
    },
    startTime: { type: String, trim: true }, // e.g. "09:00"
    endTime:   { type: String, trim: true }  // e.g. "09:45"
}, { _id: false });

const timetableSchema = new mongoose.Schema({
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    day: {
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        required: true
    },
    periods: [periodSchema]
}, { timestamps: true });

// one timetable entry per class per day
timetableSchema.index({ class: 1, day: 1 }, { unique: true });

module.exports = mongoose.model('Timetable', timetableSchema);
