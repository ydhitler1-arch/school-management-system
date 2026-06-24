const jwt = require('jsonwebtoken');

// verifies the JWT and attaches decoded user info to req.user
exports.authenticate = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: "No token provided" });
    }
    const token = header.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};

// restricts a route to specific roles, e.g. authorize('admin', 'teacher')
exports.authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: "You do not have permission to perform this action" });
        }
        next();
    };
};
