const Teacher = require('../models/Teacher');
const User = require('../models/User');
const mongoose = require('mongoose');

// GET /api/teachers
exports.getTeachers = async (req, res) => {
    try {
        const teachers = await Teacher.find({ isActive: true })
            .populate('userId', 'name email role');
        res.json(teachers);
    } catch (err) {
        console.error('getTeachers error:', err);
        res.status(500).json({ error: "Could not fetch teachers" });
    }
};

// GET /api/teachers/:id
exports.getTeacherById = async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id)
            .populate('userId', 'name email role');
        if (!teacher) return res.status(404).json({ error: "Teacher not found" });
        res.json(teacher);
    } catch (err) {
        console.error('getTeacherById error:', err);
        res.status(500).json({ error: "Could not fetch teacher" });
    }
};

// POST /api/teachers
// Creates a User login AND a Teacher profile atomically
exports.addTeacher = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { name, subject, email, password } = req.body;

        if (!name || !subject || !email || !password) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                error: "name, subject, email and password are all required"
            });
        }

        // check for duplicate email up front
        const existingUser = await User.findOne({ email: email.toLowerCase() }).session(session);
        if (existingUser) {
            await session.abortTransaction();
            session.endSession();
            return res.status(409).json({ error: "A user with this email already exists" });
        }

        // create the login account (password hashed by User pre-save hook)
        const [user] = await User.create([{
            name, email, password, role: 'teacher'
        }], { session });

        // create the linked teacher profile
        const [teacher] = await Teacher.create([{
            userId: user._id,
            name, subject, email
        }], { session });

        await session.commitTransaction();
        session.endSession();
        res.status(201).json(teacher);
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error('addTeacher error:', err);
        res.status(400).json({ error: "Could not add teacher" });
    }
};

// PUT /api/teachers/:id
// Updates Teacher profile AND keeps linked User in sync
exports.updateTeacher = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { name, subject, email } = req.body;

        const teacher = await Teacher.findById(req.params.id).session(session);
        if (!teacher) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ error: "Teacher not found" });
        }

        // if email is changing, make sure no other user already has it
        if (email && email.toLowerCase() !== teacher.email) {
            const clash = await User.findOne({
                email: email.toLowerCase(),
                _id: { $ne: teacher.userId }
            }).session(session);
            if (clash) {
                await session.abortTransaction();
                session.endSession();
                return res.status(409).json({ error: "Email already in use by another account" });
            }
        }

        // update Teacher profile
        if (name)    teacher.name    = name;
        if (subject) teacher.subject = subject;
        if (email)   teacher.email   = email;
        await teacher.save({ session });

        // keep linked User in sync (name + email only — never touch password here)
        if (teacher.userId) {
            const userUpdate = {};
            if (name)  userUpdate.name  = name;
            if (email) userUpdate.email = email;
            if (Object.keys(userUpdate).length) {
                await User.findByIdAndUpdate(teacher.userId, userUpdate, { session });
            }
        }

        await session.commitTransaction();
        session.endSession();
        res.json(teacher);
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error('updateTeacher error:', err);
        res.status(400).json({ error: "Could not update teacher" });
    }
};

// DELETE /api/teachers/:id — soft delete (sets isActive: false on Teacher, disables User login)
exports.deleteTeacher = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const teacher = await Teacher.findById(req.params.id).session(session);
        if (!teacher) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ error: "Teacher not found" });
        }

        // soft delete the teacher profile
        teacher.isActive = false;
        await teacher.save({ session });

        // also deactivate the linked User login so they can no longer sign in
        if (teacher.userId) {
            await User.findByIdAndUpdate(
                teacher.userId,
                { isActive: false },
                { session }
            );
        }

        await session.commitTransaction();
        session.endSession();
        res.json({ message: "Teacher deactivated" });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error('deleteTeacher error:', err);
        res.status(500).json({ error: "Could not deactivate teacher" });
    }
};
