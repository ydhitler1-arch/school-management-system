const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        default: null
    },
    rollNo: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Student', studentSchema);
