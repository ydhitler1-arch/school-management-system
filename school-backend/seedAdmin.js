// One-time script to create your first admin login.
// Run from inside school-backend/:
//   node seedAdmin.js "Your Name" admin@email.com yourPassword123
//
// After this, log in on the website and use the Users page to create
// any further admin or teacher accounts - you won't need this script again.

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function seed() {
    const [, , name, email, password] = process.argv;

    if (!name || !email || !password) {
        console.log('Usage: node seedAdmin.js "Your Name" admin@email.com yourPassword123');
        process.exit(1);
    }

    if (!process.env.MONGO_URI) {
        console.log('MONGO_URI is not set. Make sure your .env file exists (see .env.example).');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGO_URI);

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
        console.log(`A user with the email "${email}" already exists. Nothing was created.`);
        process.exit(0);
    }

    const admin = new User({ name, email, password, role: 'admin' });
    await admin.save();

    console.log(`Admin account created: ${admin.email}`);
    console.log('You can now log in on the website with this email and password.');
    process.exit(0);
}

seed().catch(err => {
    console.error('Failed to create admin account:', err.message);
    process.exit(1);
});
