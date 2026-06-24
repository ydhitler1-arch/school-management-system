const nodemailer = require('nodemailer');

// create a reusable transporter using env variables
// supports Gmail (use App Password, not regular password)
// or any SMTP service like SendGrid, Mailgun, etc.
function createTransporter() {
    return nodemailer.createTransport({
        host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
        port:   Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
}

// send a single email
async function sendEmail({ to, subject, html }) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('Email not sent: SMTP_USER or SMTP_PASS not set in .env');
        return false;
    }
    try {
        const transporter = createTransporter();
        await transporter.sendMail({
            from: `"School Management System" <${process.env.SMTP_USER}>`,
            to, subject, html
        });
        return true;
    } catch (err) {
        console.error('Email send failed:', err.message);
        return false;
    }
}

// overdue fee reminder email template
function overdueEmailTemplate(studentName, fees) {
    const rows = fees.map(f => `
        <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0">${f.feeType}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0">₹${f.amount.toLocaleString('en-IN')}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#c0392b;font-weight:600">
                ${new Date(f.dueDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
            </td>
        </tr>`).join('');

    const total = fees.reduce((s, f) => s + f.amount, 0);

    return `
    <!DOCTYPE html>
    <html>
    <body style="font-family:Segoe UI,Arial,sans-serif;background:#f8fafc;margin:0;padding:20px">
        <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08)">
            <div style="background:linear-gradient(90deg,#1241a8,#1a56db);padding:24px 28px">
                <h1 style="color:#fff;margin:0;font-size:20px">School Management System</h1>
                <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px">Fee Payment Reminder</p>
            </div>
            <div style="padding:24px 28px">
                <p style="font-size:15px;color:#1e293b">Dear Parent,</p>
                <p style="font-size:14px;color:#475569">
                    This is a reminder that the following fees for <strong>${studentName}</strong>
                    are overdue. Please arrange payment at the earliest.
                </p>

                <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:13px">
                    <thead>
                        <tr style="background:#f8fafc">
                            <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#64748b">Fee Type</th>
                            <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#64748b">Amount</th>
                            <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#64748b">Due Date</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                    <tfoot>
                        <tr style="background:#fce8e6">
                            <td style="padding:10px 12px;font-weight:700;color:#c0392b">Total Overdue</td>
                            <td style="padding:10px 12px;font-weight:700;color:#c0392b">₹${total.toLocaleString('en-IN')}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>

                <p style="font-size:13px;color:#475569">
                    Please contact the school office if you have any questions.
                </p>
                <p style="font-size:13px;color:#94a3b8;margin-top:24px">
                    This is an automated reminder from the School Management System.
                </p>
            </div>
        </div>
    </body>
    </html>`;
}

module.exports = { sendEmail, overdueEmailTemplate };
