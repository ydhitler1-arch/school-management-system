// parent portal — only accessible by users with role='parent'
const user = getUser();
if (!user) { window.location.href = "/pages/login.html"; }
if (user && user.role !== "parent") { window.location.href = "/index.html"; }

const API_PARENT = `${API_BASE}/parent`;

function formatDate(iso) {
    return new Date(iso).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
}
function formatCurrency(n) { return "₹" + Number(n).toLocaleString("en-IN"); }

function gradeBadge(g) {
    const colors = { "A+":"#1b7a3d", A:"#1b7a3d", B:"#1a56db", C:"#b7770d", D:"#e65100", F:"#c0392b" };
    const bgs    = { "A+":"#e6f4ea", A:"#e6f4ea", B:"#e8f0fe", C:"#fef9e7", D:"#fff3e0", F:"#fce8e6" };
    const c = colors[g] || "#475569";
    const b = bgs[g]    || "#f0f0f0";
    return `<span style="background:${b};color:${c};padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700">${g || "—"}</span>`;
}

// ── tabs ───────────────────────────────────────────────────────────────
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
    });
});

// ── load child profile ─────────────────────────────────────────────────
async function loadChild() {
    try {
        const res     = await authFetch(`${API_PARENT}/child`);
        const student = await res.json();
        document.getElementById("child-name").textContent = student.name || "Student";
        const cls = student.class
            ? (student.class.section ? `${student.class.className} - ${student.class.section}` : student.class.className)
            : "";
        document.getElementById("child-meta").textContent =
            `${cls}${student.rollNo ? "  •  Roll No: " + student.rollNo : ""}${student.age ? "  •  Age: " + student.age : ""}`;
    } catch (err) { /* silent */ }
}

// ── load grades ────────────────────────────────────────────────────────
async function loadGrades() {
    const body = document.getElementById("grades-body");
    try {
        const res  = await authFetch(`${API_PARENT}/grades`);
        const data = await res.json();
        const subjects = Object.keys(data.bySubject || {});

        if (subjects.length === 0) {
            body.innerHTML = `<p class="small" style="color:var(--gray-400)">No grades recorded yet.</p>`;
            return;
        }

        let html = `<table class="report-table">`;
        subjects.forEach(subject => {
            html += `<tr><td colspan="4" class="subject-heading">${subject}</td></tr>`;
            html += `<tr style="background:#f9f9fb"><th>Exam</th><th>Marks</th><th>%</th><th>Grade</th></tr>`;
            data.bySubject[subject].forEach(entry => {
                const pct = ((entry.marksObtained / entry.totalMarks) * 100).toFixed(1);
                html += `<tr>
                    <td>${entry.examType}</td>
                    <td>${entry.marksObtained}/${entry.totalMarks}</td>
                    <td>${pct}%</td>
                    <td>${gradeBadge(entry.grade)}</td>
                </tr>`;
                if (entry.remarks) {
                    html += `<tr><td colspan="4" style="color:#888;font-size:12px;padding:2px 12px 8px">${entry.remarks}</td></tr>`;
                }
            });
        });
        html += `</table>`;
        body.innerHTML = html;
    } catch (err) {
        body.innerHTML = `<p class="small" style="color:var(--gray-400)">Could not load grades.</p>`;
    }
}

// ── load attendance ────────────────────────────────────────────────────
async function loadAttendance() {
    const tbody  = document.getElementById("att-tbody");
    const summary= document.getElementById("att-summary");
    try {
        const res  = await authFetch(`${API_PARENT}/attendance`);
        const data = await res.json();

        // overview cards
        const pct = data.summary.percentage;
        summary.innerHTML = `
            <div style="display:flex;gap:16px;flex-wrap:wrap">
                <div style="flex:1;min-width:120px;background:var(--gray-50);border-radius:8px;padding:12px 16px">
                    <div style="font-size:22px;font-weight:700;color:var(--primary)">${pct}%</div>
                    <div style="font-size:11px;color:var(--gray-600);text-transform:uppercase">Attendance Rate</div>
                    <div class="att-bar"><div class="att-bar-fill" style="width:${pct}%"></div></div>
                </div>
                <div style="flex:1;min-width:120px;background:var(--success-light);border-radius:8px;padding:12px 16px">
                    <div style="font-size:22px;font-weight:700;color:var(--success)">${data.summary.present}</div>
                    <div style="font-size:11px;color:var(--gray-600);text-transform:uppercase">Days Present</div>
                </div>
                <div style="flex:1;min-width:120px;background:var(--danger-light);border-radius:8px;padding:12px 16px">
                    <div style="font-size:22px;font-weight:700;color:var(--danger)">${data.summary.absent}</div>
                    <div style="font-size:11px;color:var(--gray-600);text-transform:uppercase">Days Absent</div>
                </div>
            </div>`;

        // update overview tab
        document.getElementById("ov-attendance").textContent = pct + "%";
        document.getElementById("ov-present").textContent   = data.summary.present;
        document.getElementById("ov-absent").textContent    = data.summary.absent;

        if (data.records.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="small">No attendance records yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = "";
        data.records.forEach(r => {
            const cls  = r.class ? (r.class.section ? `${r.class.className} - ${r.class.section}` : r.class.className) : "";
            const isPresentClass = r.status === "present" ? "badge present" : "badge absent";
            const tr   = document.createElement("tr");
            tr.innerHTML = `
                <td>${formatDate(r.date)}</td>
                <td>${cls}</td>
                <td><span class="${isPresentClass}">${r.status}</span></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="3" class="small">Could not load attendance.</td></tr>`;
    }
}

// ── load fees ──────────────────────────────────────────────────────────
async function loadFees() {
    const tbody  = document.getElementById("fees-tbody");
    const summary= document.getElementById("fee-summary");
    try {
        const res  = await authFetch(`${API_PARENT}/fees`);
        const data = await res.json();

        summary.innerHTML = `
            <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:4px">
                <div style="background:var(--success-light);border-radius:8px;padding:10px 16px;flex:1;min-width:120px">
                    <div style="font-weight:700;color:var(--success)">${formatCurrency(data.summary.totalPaid)}</div>
                    <div style="font-size:11px;color:var(--gray-600)">Paid</div>
                </div>
                <div style="background:var(--warning-light);border-radius:8px;padding:10px 16px;flex:1;min-width:120px">
                    <div style="font-weight:700;color:var(--warning)">${formatCurrency(data.summary.totalPending)}</div>
                    <div style="font-size:11px;color:var(--gray-600)">Pending</div>
                </div>
                <div style="background:var(--danger-light);border-radius:8px;padding:10px 16px;flex:1;min-width:120px">
                    <div style="font-weight:700;color:var(--danger)">${formatCurrency(data.summary.totalOverdue)}</div>
                    <div style="font-size:11px;color:var(--gray-600)">Overdue</div>
                </div>
            </div>`;

        // update overview
        document.getElementById("ov-fees-due").textContent = formatCurrency(data.summary.totalPending + data.summary.totalOverdue);

        if (data.fees.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="small">No fee records yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = "";
        data.fees.forEach(f => {
            const statusClass = `fee-status-${f.status}`;
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${f.feeType}</td>
                <td>${formatCurrency(f.amount)}</td>
                <td>${formatDate(f.dueDate)}</td>
                <td><span class="status-badge ${statusClass}">${f.status}</span></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" class="small">Could not load fees.</td></tr>`;
    }
}

// ── load announcements on overview tab ─────────────────────────────────
async function loadAnnouncements() {
    const body = document.getElementById("parent-announcements");
    try {
        const res  = await authFetch(`${API_BASE}/announcements`);
        const data = await res.json();
        if (data.length === 0) {
            body.innerHTML = `<p class="small" style="color:var(--gray-400)">No announcements.</p>`;
            return;
        }
        const priorityStyle = {
            normal:    { bg:'#f8fafc', border:'#e2e8f0', label:'',             color:'#475569' },
            important: { bg:'#e8f0fe', border:'#93c5fd', label:'📌 Important',  color:'#1a56db' },
            urgent:    { bg:'#fce8e6', border:'#fca5a5', label:'🚨 Urgent',     color:'#c0392b' }
        };
        body.innerHTML = data.slice(0, 5).map(a => {
            const s    = priorityStyle[a.priority] || priorityStyle.normal;
            const date = formatDate(a.createdAt);
            return `<div style="background:${s.bg};border:1px solid ${s.border};border-radius:8px;padding:12px 14px;margin-bottom:10px">
                ${s.label ? `<div style="font-size:11px;font-weight:700;color:${s.color};margin-bottom:4px">${s.label}</div>` : ""}
                <div style="font-weight:700;font-size:14px">${a.title}</div>
                <div style="font-size:13px;color:#475569;margin-top:4px">${a.message}</div>
                <div style="font-size:11px;color:#94a3b8;margin-top:6px">${date}</div>
            </div>`;
        }).join("");
    } catch (err) { /* silent */ }
}

// ── init ───────────────────────────────────────────────────────────────
loadChild();
loadGrades();
loadAttendance();
loadFees();
loadAnnouncements();
