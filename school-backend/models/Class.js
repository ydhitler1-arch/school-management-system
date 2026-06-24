const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    className: String,
    section: String,
    classTeacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        default: null
    }
});

module.exports = mongoose.model('Class', classSchema);
