const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (user) => {
    return jwt.sign(
        { id: user._id, name: user.name, role: user.role, studentId: user.studentId },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );
};

// POST /api/auth/login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) return res.status(401).json({ error: "Invalid email or password" });

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(401).json({ error: "Invalid email or password" });

        const token = signToken(user);
        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                studentId: user.studentId || null
            }
        });
    } catch (err) {
        res.status(500).json({ error: "Login failed" });
    }
};

// POST /api/auth/register — admin only
exports.register = async (req, res) => {
    try {
        const { name, email, password, role, studentId } = req.body;

        const existing = await User.findOne({ email: email.toLowerCase().trim() });
        if (existing) return res.status(400).json({ error: "A user with this email already exists" });

        const user = new User({
            name, email, password,
            role: ['admin', 'teacher', 'parent'].includes(role) ? role : 'teacher',
            studentId: role === 'parent' ? (studentId || null) : null
        });
        await user.save();

        res.status(201).json({
            id: user._id, name: user.name,
            email: user.email, role: user.role,
            studentId: user.studentId || null
        });
    } catch (err) {
        res.status(400).json({ error: "Could not create user" });
    }
};

// GET /api/auth/users
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .populate('studentId', 'name rollNo');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch users" });
    }
};

// GET /api/auth/me — returns the logged-in user's profile
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch profile" });
    }
};

// POST /api/auth/change-password
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "Current and new password are required" });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: "New password must be at least 6 characters" });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: "User not found" });

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) return res.status(401).json({ error: "Current password is incorrect" });

        user.password = newPassword; // pre-save hook will hash it
        await user.save();
        res.json({ message: "Password updated successfully" });
    } catch (err) {
        res.status(500).json({ error: "Could not update password" });
    }
};

// DELETE /api/auth/users/:id
exports.deleteUser = async (req, res) => {
    try {
        if (req.user.id === req.params.id) {
            return res.status(400).json({ error: "You can't delete your own account" });
        }
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json({ message: "User deleted" });
    } catch (err) {
        res.status(500).json({ error: "Could not delete user" });
    }
};
