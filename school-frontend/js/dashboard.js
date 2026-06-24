const user        = getUser();
const welcomeMsg  = document.getElementById("welcome-msg");
const welcomeDate = document.getElementById("welcome-date");

if (user && welcomeMsg) welcomeMsg.textContent = `Welcome back, ${user.name}`;
if (welcomeDate) {
    welcomeDate.textContent = new Date().toLocaleDateString("en-IN", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
}

function formatCurrency(n) {
    return "₹" + Number(n).toLocaleString("en-IN");
}

async function loadStats() {
    try {
        const [studentsRes, teachersRes, classesRes, feeSummaryRes] = await Promise.all([
            authFetch(`${API_BASE}/students`),
            authFetch(`${API_BASE}/teachers`),
            authFetch(`${API_BASE}/classes`),
            authFetch(`${API_BASE}/fees/summary`)
        ]);

        if (studentsRes.ok) {
            const s = await studentsRes.json();
            document.getElementById("stat-students").textContent = s.length;
        }
        if (teachersRes.ok) {
            const t = await teachersRes.json();
            document.getElementById("stat-teachers").textContent = t.length;
        }
        if (classesRes.ok) {
            const c = await classesRes.json();
            document.getElementById("stat-classes").textContent = c.length;
        }
        if (feeSummaryRes.ok) {
            const f = await feeSummaryRes.json();
            document.getElementById("stat-fees-pending").textContent = f.countPending;
            document.getElementById("stat-fees-overdue").textContent = f.countOverdue;
        }
    } catch (err) { /* silent */ }
}

async function loadOverdueAlerts() {
    try {
        const res  = await authFetch(`${API_BASE}/fees?status=overdue`);
        if (!res.ok) return;
        const fees = await res.json();
        if (fees.length === 0) return;

        const alertCard = document.getElementById("overdue-alert");
        const list      = document.getElementById("overdue-list");

        // show up to 5 most urgent overdue fees
        const top = fees.slice(0, 5);
        list.innerHTML = "";
        top.forEach(f => {
            const name = f.student ? f.student.name : "Unknown";
            const due  = new Date(f.dueDate).toLocaleDateString("en-IN", { day:"2-digit", month:"short" });
            const li   = document.createElement("li");
            li.innerHTML = `
                <span>
                    <span class="student-name">${name}</span>
                    <span class="fee-detail"> — ${f.feeType} (due ${due})</span>
                </span>
                <span class="overdue-amt">${formatCurrency(f.amount)}</span>
            `;
            list.appendChild(li);
        });

        if (fees.length > 5) {
            const li = document.createElement("li");
            li.innerHTML = `<span class="fee-detail">...and ${fees.length - 5} more overdue records</span><a href="/pages/fees.html" style="font-size:12px">View all</a>`;
            list.appendChild(li);
        }

        alertCard.style.display = "block";
    } catch (err) { /* silent */ }
}

async function loadTodayAttendance() {
    const body = document.getElementById("att-summary-body");
    try {
        const today = new Date().toISOString().split("T")[0];
        const res   = await authFetch(`${API_BASE}/attendance?date=${today}`);
        if (!res.ok) throw new Error();
        const records = await res.json();

        if (records.length === 0) {
            body.innerHTML = `<p class="small" style="color:var(--gray-400)">No attendance marked yet today.</p>
                <a href="/pages/attendance.html" style="font-size:12px">Mark now →</a>`;
            return;
        }

        let html = "";
        records.forEach(r => {
            const cls     = r.class ? (r.class.section ? `${r.class.className} - ${r.class.section}` : r.class.className) : "";
            const total   = r.records.length;
            const present = r.records.filter(x => x.status === "present").length;
            const pct     = total > 0 ? Math.round((present / total) * 100) : 0;
            html += `
                <div class="att-summary-row">
                    <div>
                        <div style="font-weight:600;font-size:13px">${cls}</div>
                        <div class="att-bar" style="width:120px">
                            <div class="att-bar-fill" style="width:${pct}%"></div>
                        </div>
                    </div>
                    <div style="text-align:right">
                        <div style="font-weight:700;font-size:14px">${present}/${total}</div>
                        <div style="font-size:11px;color:var(--gray-400)">${pct}% present</div>
                    </div>
                </div>`;
        });
        body.innerHTML = html;
    } catch (err) {
        body.innerHTML = `<p class="small" style="color:var(--gray-400)">Could not load attendance.</p>`;
    }
}

loadStats();
loadOverdueAlerts();
loadTodayAttendance();
