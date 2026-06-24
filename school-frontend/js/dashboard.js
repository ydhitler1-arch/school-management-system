// populate welcome message and date
const user = getUser();
const welcomeMsg  = document.getElementById("welcome-msg");
const welcomeDate = document.getElementById("welcome-date");

if (user && welcomeMsg) {
    welcomeMsg.textContent = `Welcome back, ${user.name}`;
}
if (welcomeDate) {
    welcomeDate.textContent = new Date().toLocaleDateString("en-IN", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
}

// fetch each stat in parallel and populate the cards
async function loadStats() {
    try {
        const [studentsRes, teachersRes, classesRes, feeSummaryRes] = await Promise.all([
            authFetch(`${API_BASE}/students`),
            authFetch(`${API_BASE}/teachers`),
            authFetch(`${API_BASE}/classes`),
            authFetch(`${API_BASE}/fees/summary`)
        ]);

        if (studentsRes.ok) {
            const students = await studentsRes.json();
            document.getElementById("stat-students").textContent = students.length;
        }

        if (teachersRes.ok) {
            const teachers = await teachersRes.json();
            document.getElementById("stat-teachers").textContent = teachers.length;
        }

        if (classesRes.ok) {
            const classes = await classesRes.json();
            document.getElementById("stat-classes").textContent = classes.length;
        }

        if (feeSummaryRes.ok) {
            const fees = await feeSummaryRes.json();
            document.getElementById("stat-fees-pending").textContent = fees.countPending;
            document.getElementById("stat-fees-overdue").textContent = fees.countOverdue;
        }
    } catch (err) {
        // stats failing silently is fine — the dashboard still loads
    }
}

loadStats();
