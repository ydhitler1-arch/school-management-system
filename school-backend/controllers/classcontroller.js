const Class = require('../models/Class');

// GET /api/classes
exports.getClasses = async (req, res) => {
    try {
        const classes = await Class.find().populate('classTeacher', 'name subject email');
        res.json(classes);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch classes" });
    }
};

// GET /api/classes/:id
exports.getClassById = async (req, res) => {
    try {
        const classItem = await Class.findById(req.params.id).populate('classTeacher', 'name subject email');
        if (!classItem) return res.status(404).json({ error: "Class not found" });
        res.json(classItem);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch class" });
    }
};

// POST /api/classes
exports.addClass = async (req, res) => {
    try {
        const { className, section, classTeacher } = req.body;
        const classItem = new Class({
            className,
            section,
            classTeacher: classTeacher || null
        });
        await classItem.save();
        const populated = await classItem.populate('classTeacher', 'name subject email');
        res.status(201).json(populated);
    } catch (err) {
        res.status(400).json({ error: "Could not add class" });
    }
};

// PUT /api/classes/:id
exports.updateClass = async (req, res) => {
    try {
        const { className, section, classTeacher } = req.body;
        const classItem = await Class.findByIdAndUpdate(
            req.params.id,
            { className, section, classTeacher: classTeacher || null },
            { new: true, runValidators: true }
        ).populate('classTeacher', 'name subject email');
        if (!classItem) return res.status(404).json({ error: "Class not found" });
        res.json(classItem);
    } catch (err) {
        res.status(400).json({ error: "Could not update class" });
    }
};

// DELETE /api/classes/:id
exports.deleteClass = async (req, res) => {
    try {
        const classItem = await Class.findByIdAndDelete(req.params.id);
        if (!classItem) return res.status(404).json({ error: "Class not found" });
        res.json({ message: "Class deleted" });
    } catch (err) {
        res.status(500).json({ error: "Could not delete class" });
    }
};
