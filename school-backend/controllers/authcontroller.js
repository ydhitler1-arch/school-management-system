const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (user) => {
    return jwt.sign(
        { id: user._id, name: user.name, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );
};

// POST /api/auth/login (public)
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
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ error: "Login failed" });
    }
};

// POST /api/auth/register (admin only - creates a teacher or admin login)
exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const existing = await User.findOne({ email: email.toLowerCase().trim() });
        if (existing) return res.status(400).json({ error: "A user with this email already exists" });

        const user = new User({
            name,
            email,
            password,
            role: role === 'admin' ? 'admin' : 'teacher'
        });
        await user.save();

        res.status(201).json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        });
    } catch (err) {
        res.status(400).json({ error: "Could not create user" });
    }
};

// GET /api/auth/users (admin only)
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch users" });
    }
};

// DELETE /api/auth/users/:id (admin only)
exports.deleteUser = async (req, res) => {
    try {
        if (req.user.id === req.params.id) {
            return res.status(400).json({ error: "You can't delete the account you're currently logged in as" });
        }
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json({ message: "User deleted" });
    } catch (err) {
        res.status(500).json({ error: "Could not delete user" });
    }
};
