// seedTestData.js
require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');
const Teacher = require('./models/Teacher');
const Student = require('./models/Student');
const Class = require('./models/Class');

const MONGO_URI = process.env.MONGO_URI;
const DEFAULT_PASSWORD = 'Test@1234'; // login password for all admins + teachers

// ---------- ADMINS (login only) ----------
const admins = [
  { name: 'Priya Sharma', email: 'admin1@school.test', role: 'admin' },
  { name: 'Rahul Verma',  email: 'admin2@school.test', role: 'admin' },
];

// ---------- TEACHERS (login + profile) ----------
const teachers = [
  { name: 'Anjali Mehta',  email: 'teacher1@school.test',  subject: 'Mathematics' },
  { name: 'Vikram Singh',  email: 'teacher2@school.test',  subject: 'English' },
  { name: 'Sneha Iyer',    email: 'teacher3@school.test',  subject: 'Science' },
  { name: 'Arjun Nair',    email: 'teacher4@school.test',  subject: 'Social Studies' },
  { name: 'Kavita Reddy',  email: 'teacher5@school.test',  subject: 'Hindi' },
  { name: 'Rohit Kapoor',  email: 'teacher6@school.test',  subject: 'Computer Science' },
  { name: 'Meera Joshi',   email: 'teacher7@school.test',  subject: 'Physical Education' },
  { name: 'Sanjay Gupta',  email: 'teacher8@school.test',  subject: 'Art' },
  { name: 'Neha Bhatt',    email: 'teacher9@school.test',  subject: 'Geography' },
  { name: 'Aditya Rao',    email: 'teacher10@school.test', subject: 'History' },
];

// ---------- CLASSES ----------
const classDefs = [
  { className: 'Grade 1',  section: 'A' },
  { className: 'Grade 2',  section: 'A' },
  { className: 'Grade 3',  section: 'A' },
  { className: 'Grade 4',  section: 'B' },
  { className: 'Grade 5',  section: 'A' },
  { className: 'Grade 6',  section: 'B' },
  { className: 'Grade 7',  section: 'A' },
  { className: 'Grade 8',  section: 'B' },
  { className: 'Grade 9',  section: 'A' },
  { className: 'Grade 10', section: 'B' },
];

// ---------- STUDENTS (50 total) ----------
const studentFirstNames = [
  'Aarav','Vivaan','Aditya','Vihaan','Arjun','Sai','Reyansh','Krishna','Ishaan','Shaurya',
  'Atharv','Advik','Pranav','Dhruv','Kabir','Ananya','Diya','Aadhya','Saanvi','Myra',
  'Aarohi','Anika','Navya','Kiara','Pari','Ira','Riya','Siya','Tara','Zara',
  'Aryan','Dev','Yash','Karan','Nikhil','Rohan','Aman','Veer','Laksh','Om',
  'Isha','Jiya','Kyra','Mira','Nisha','Pooja','Rhea','Sara','Tia','Urvi'
];

// ---------- MAIN ----------
async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Clear old test data only (keeps your real admin from seedAdmin.js safe)
    console.log('🧹 Clearing old test data...');
    await User.deleteMany({ email: /@school\.test$/ });
    await Teacher.deleteMany({ email: /@school\.test$/ });
    await Student.deleteMany({});  // students have no email, so clear all
    await Class.deleteMany({});    // clear all classes
    console.log('   Done.\n');

    // 2. Create admin User logins
    //    Using create() (not insertMany) so the pre-save hook hashes passwords
    console.log('👑 Creating admin logins...');
    const adminUsers = [];
    for (const a of admins) {
      const u = await User.create({ ...a, password: DEFAULT_PASSWORD });
      adminUsers.push(u);
    }
    console.log(`   Created ${adminUsers.length} admins\n`);

    // 3. Create teacher User logins
    console.log('🔐 Creating teacher logins...');
    const teacherUsers = [];
    for (const t of teachers) {
      const u = await User.create({
        name: t.name,
        email: t.email,
        password: DEFAULT_PASSWORD,
        role: 'teacher',
      });
      teacherUsers.push(u);
    }
    console.log(`   Created ${teacherUsers.length} teacher logins\n`);

    // 4. Create Teacher profile records
    console.log('👨‍🏫 Creating teacher profiles...');
    const teacherDocs = await Teacher.insertMany(teachers);
    console.log(`   Created ${teacherDocs.length} teacher profiles\n`);

    // 5. Create Classes, each with a class teacher assigned
    console.log('🏫 Creating classes...');
    const classDocs = await Class.insertMany(
      classDefs.map((c, i) => ({
        ...c,
        classTeacher: teacherDocs[i % teacherDocs.length]._id,
      }))
    );
    console.log(`   Created ${classDocs.length} classes\n`);

    // 6. Create Students — 5 per class, with roll numbers 1–5
    console.log('🎒 Creating students...');
    const studentDocs = await Student.insertMany(
      studentFirstNames.map((fname, i) => {
        const classIndex = i % classDocs.length;       // spreads evenly: 0..9, 0..9, ...
        const rollNo = Math.floor(i / classDocs.length) + 1; // 1..5
        const age = 5 + classIndex + Math.floor(Math.random() * 2); // rough age per grade
        return {
          name: `${fname} Kumar`,
          age,
          class: classDocs[classIndex]._id,
          rollNo,
        };
      })
    );
    console.log(`   Created ${studentDocs.length} students\n`);

    // ---------- SUMMARY ----------
    console.log('🎉 Seed complete!');
    console.log('-----------------------------------');
    console.log(`Admin logins:     ${adminUsers.length}`);
    console.log(`Teacher logins:   ${teacherUsers.length}`);
    console.log(`Teacher profiles: ${teacherDocs.length}`);
    console.log(`Classes:          ${classDocs.length}`);
    console.log(`Students:         ${studentDocs.length}`);
    console.log('-----------------------------------');
    console.log(`Password for ALL admin + teacher logins: ${DEFAULT_PASSWORD}`);
    console.log('Example logins:');
    console.log('   admin1@school.test    (admin)');
    console.log('   teacher1@school.test  (teacher)');
    console.log('-----------------------------------');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();