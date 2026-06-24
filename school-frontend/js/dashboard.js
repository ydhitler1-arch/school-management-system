const user        = getUser();
const welcomeMsg  = document.getElementById("welcome-msg");
const welcomeDate = document.getElementById("welcome-date");
const isAdmin     = user && user.role === "admin";

if (user && welcomeMsg) welcomeMsg.textContent = `Welcome back, ${user.name}`;
if (welcomeDate) {
    welcomeDate.textContent = new Date().toLocaleDateString("en-IN", {
        weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
}

function formatCurrency(n) { return "₹" + Number(n).toLocaleString("en-IN"); }

// ── stat cards ─────────────────────────────────────────────────────────
async function loadStats() {
    try {
        const [studentsRes, teachersRes, classesRes, feeSummaryRes] = await Promise.all([
            authFetch(`${API_BASE}/students`),
            authFetch(`${API_BASE}/teachers`),
            authFetch(`${API_BASE}/classes`),
            authFetch(`${API_BASE}/fees/summary`)
        ]);
        if (studentsRes.ok)   document.getElementById("stat-students").textContent      = (await studentsRes.json()).length;
        if (teachersRes.ok)   document.getElementById("stat-teachers").textContent      = (await teachersRes.json()).length;
        if (classesRes.ok)    document.getElementById("stat-classes").textContent       = (await classesRes.json()).length;
        if (feeSummaryRes.ok) {
            const f = await feeSummaryRes.json();
            document.getElementById("stat-fees-pending").textContent = f.countPending;
            document.getElementById("stat-fees-overdue").textContent = f.countOverdue;
        }
    } catch (err) { /* silent */ }
}

// ── overdue fee alerts ─────────────────────────────────────────────────
async function loadOverdueAlerts() {
    try {
        const res  = await authFetch(`${API_BASE}/fees?status=overdue`);
        if (!res.ok) return;
        const fees = await res.json();
        if (fees.length === 0) return;

        const alertCard = document.getElementById("overdue-alert");
        const list      = document.getElementById("overdue-list");
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
                <span class="overdue-amt">${formatCurrency(f.amount)}</span>`;
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

// ── today's attendance ─────────────────────────────────────────────────
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

// ── announcements ──────────────────────────────────────────────────────
const priorityStyle = {
    normal:    { bg: '#f8fafc', border: '#e2e8f0', label: '',            color: '#475569' },
    important: { bg: '#e8f0fe', border: '#93c5fd', label: '📌 Important', color: '#1a56db' },
    urgent:    { bg: '#fce8e6', border: '#fca5a5', label: '🚨 Urgent',    color: '#c0392b' }
};

async function loadAnnouncements() {
    const body = document.getElementById("announcements-body");
    try {
        const res = await authFetch(`${API_BASE}/announcements`);
        if (!res.ok) throw new Error();
        const announcements = await res.json();

        if (isAdmin) document.getElementById("new-announcement-btn").style.display = "inline-block";

        if (announcements.length === 0) {
            body.innerHTML = `<p class="small" style="color:var(--gray-400)">No announcements yet.${isAdmin ? " Post one using the + Post button." : ""}</p>`;
            return;
        }

        body.innerHTML = "";
        announcements.forEach(a => {
            const s    = priorityStyle[a.priority] || priorityStyle.normal;
            const date = new Date(a.createdAt).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
            const div  = document.createElement("div");
            div.style.cssText = `background:${s.bg};border:1px solid ${s.border};border-radius:8px;padding:12px 14px;margin-bottom:10px`;
            div.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:start">
                    <div>
                        ${s.label ? `<span style="font-size:11px;font-weight:700;color:${s.color};margin-bottom:4px;display:block">${s.label}</span>` : ""}
                        <div style="font-weight:700;font-size:14px;color:#1e293b">${a.title}</div>
                        <div style="font-size:13px;color:#475569;margin-top:4px;line-height:1.5">${a.message}</div>
                        <div style="font-size:11px;color:#94a3b8;margin-top:6px">Posted by ${a.postedBy ? a.postedBy.name : "Admin"} · ${date}</div>
                    </div>
                    ${isAdmin ? `<button class="delete-ann-btn" data-id="${a._id}" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:16px;padding:0 0 0 8px;line-height:1" title="Delete">✕</button>` : ""}
                </div>`;
            body.appendChild(div);
        });

        // delete handler
        body.addEventListener("click", async (e) => {
            if (!e.target.classList.contains("delete-ann-btn")) return;
            const id = e.target.dataset.id;
            if (!confirm("Delete this announcement?")) return;
            try {
                await authFetch(`${API_BASE}/announcements/${id}`, { method: "DELETE" });
                loadAnnouncements();
            } catch (err) { /* silent */ }
        });

    } catch (err) {
        body.innerHTML = `<p class="small" style="color:var(--gray-400)">Could not load announcements.</p>`;
    }
}

// ── post announcement modal ────────────────────────────────────────────
const annModal     = document.getElementById("ann-modal");
const annTitle     = document.getElementById("ann-title");
const annMessage   = document.getElementById("ann-message");
const annPriority  = document.getElementById("ann-priority");
const annSubmitBtn = document.getElementById("ann-submit-btn");
const annCancelBtn = document.getElementById("ann-cancel-btn");
const newAnnBtn    = document.getElementById("new-announcement-btn");

if (newAnnBtn) newAnnBtn.addEventListener("click", () => { annModal.style.display = "flex"; });
if (annCancelBtn) annCancelBtn.addEventListener("click", () => { annModal.style.display = "none"; annTitle.value = ""; annMessage.value = ""; });

if (annSubmitBtn) {
    annSubmitBtn.addEventListener("click", async () => {
        const title   = annTitle.value.trim();
        const message = annMessage.value.trim();
        if (!title || !message) { alert("Title and message are required."); return; }
        try {
            const res = await authFetch(`${API_BASE}/announcements`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, message, priority: annPriority.value })
            });
            if (!res.ok) throw new Error();
            annModal.style.display = "none";
            annTitle.value   = "";
            annMessage.value = "";
            loadAnnouncements();
        } catch (err) { alert("Could not post announcement."); }
    });
}

// ── init ───────────────────────────────────────────────────────────────
loadStats();
loadOverdueAlerts();
loadTodayAttendance();
loadAnnouncements();
