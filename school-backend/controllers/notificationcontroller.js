const Fee  = require('../models/Fee');
const User = require('../models/User');
const { sendEmail, overdueEmailTemplate } = require('../utils/email');

// POST /api/notify/overdue
// Sends overdue fee reminder emails to all parents who have an email on file
exports.sendOverdueReminders = async (req, res) => {
    try {
        // get all overdue fees with student info
        const overdueFees = await Fee.find({ status: 'overdue' })
            .populate('student', 'name');

        if (overdueFees.length === 0) {
            return res.json({ message: "No overdue fees found. No emails sent.", sent: 0 });
        }

        // group by student
        const byStudent = {};
        overdueFees.forEach(f => {
            if (!f.student) return;
            const sid = f.student._id.toString();
            if (!byStudent[sid]) byStudent[sid] = { student: f.student, fees: [] };
            byStudent[sid].fees.push(f);
        });

        let sent    = 0;
        let skipped = 0;
        const errors = [];

        for (const sid of Object.keys(byStudent)) {
            const { student, fees } = byStudent[sid];

            // find the parent account linked to this student
            const parent = await User.findOne({ role: 'parent', studentId: student._id });

            if (!parent || !parent.email) {
                skipped++;
                continue;
            }

            const html    = overdueEmailTemplate(student.name, fees);
            const success = await sendEmail({
                to:      parent.email,
                subject: `Fee Payment Reminder — ${student.name}`,
                html
            });

            if (success) sent++;
            else errors.push(parent.email);
        }

        res.json({
            message: `Reminders sent: ${sent}. Skipped (no parent email): ${skipped}.`,
            sent, skipped,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (err) {
        console.error('sendOverdueReminders error:', err);
        res.status(500).json({ error: "Could not send reminders" });
    }
};

// POST /api/notify/test — sends a test email to the logged-in admin
exports.sendTestEmail = async (req, res) => {
    try {
        const user    = await User.findById(req.user.id).select('email name');
        const success = await sendEmail({
            to:      user.email,
            subject: 'Test Email — School Management System',
            html:    `<p>Hi ${user.name},</p><p>Your email notifications are working correctly.</p>`
        });
        if (success) res.json({ message: `Test email sent to ${user.email}` });
        else res.status(500).json({ error: "Email failed — check your SMTP settings in .env" });
    } catch (err) {
        res.status(500).json({ error: "Could not send test email" });
    }
};
