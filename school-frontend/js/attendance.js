requireLogin();

const API_ATT = `${API_BASE}/attendance`;
const user = getUser();
const isAdmin = user && user.role === "admin";

const statusMsg      = document.getElementById("status-msg");
const markClassSel   = document.getElementById("mark-class");
const markDateIn     = document.getElementById("mark-date");
const loadStudentsBtn= document.getElementById("load-students-btn");
const checklistSec   = document.getElementById("checklist-section");
const checklistTitle = document.getElementById("checklist-title");
const checklist      = document.getElementById("student-checklist");
const noStudentsMsg  = document.getElementById("no-students-msg");
const markAllPresent = document.getElementById("mark-all-present-btn");
const markAllAbsent  = document.getElementById("mark-all-absent-btn");
const submitBtn      = document.getElementById("submit-attendance-btn");
const filterClassSel = document.getElementById("filter-class");
const filterDateIn   = document.getElementById("filter-date");
const filterBtn      = document.getElementById("filter-btn");
const clearFilterBtn = document.getElementById("clear-filter-btn");
const historyTbody   = document.getElementById("history-tbody");
const editModal      = document.getElementById("edit-modal");
const editModalTitle = document.getElementById("edit-modal-title");
const editChecklist  = document.getElementById("edit-checklist");
const editSaveBtn    = document.getElementById("edit-save-btn");
const editCancelBtn  = document.getElementById("edit-cancel-btn");

// set today's date as default in the date picker
markDateIn.value = new Date().toISOString().split("T")[0];

let currentStudents  = []; // students loaded for the mark-attendance checklist
let editingRecordId  = null;

function showMessage(text, isError = false) {
    statusMsg.textContent = text;
    statusMsg.className = "msg " + (isError ? "error" : "success");
}

function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// ── populate class dropdowns ────────────────────────────────────────────
async function loadClassOptions() {
    try {
        const res = await authFetch(`${API_BASE}/classes`);
        const classes = await res.json();
        [markClassSel, filterClassSel].forEach((sel, i) => {
            const base = i === 0 ? `<option value="">-- Select class --</option>` : `<option value="">All classes</option>`;
            sel.innerHTML = base;
            classes.forEach(c => {
                const opt = document.createElement("option");
                opt.value = c._id;
                opt.textContent = c.section ? `${c.className} - ${c.section}` : c.className;
                sel.appendChild(opt);
            });
        });
    } catch (err) { /* not fatal */ }
}

// ── build a toggle-button checklist row ────────────────────────────────
function buildChecklistItem(student, status, container) {
    const li = document.createElement("li");
    li.dataset.id = student._id || student.student._id;
    li.innerHTML = `
        <span>${student.name || student.student.name} <span class="roll">Roll: ${student.rollNo ?? student.student.rollNo ?? "-"}</span></span>
        <button type="button" class="toggle-btn ${status}" data-status="${status}">
            ${status.charAt(0).toUpperCase() + status.slice(1)}
        </button>
    `;
    container.appendChild(li);
}

function bindToggle(container) {
    container.addEventListener("click", (e) => {
        if (!e.target.classList.contains("toggle-btn")) return;
        const btn = e.target;
        const newStatus = btn.dataset.status === "present" ? "absent" : "present";
        btn.dataset.status = newStatus;
        btn.className = `toggle-btn ${newStatus}`;
        btn.textContent = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
    });
}

function setAll(container, status) {
    container.querySelectorAll(".toggle-btn").forEach(btn => {
        btn.dataset.status = status;
        btn.className = `toggle-btn ${status}`;
        btn.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    });
}

// ── load students for mark-attendance checklist ─────────────────────────
loadStudentsBtn.addEventListener("click", async () => {
    const classId = markClassSel.value;
    if (!classId) { showMessage("Please select a class first.", true); return; }
    if (!markDateIn.value) { showMessage("Please select a date.", true); return; }

    try {
        const res = await authFetch(`${API_ATT}/students/${classId}`);
        currentStudents = await res.json();

        checklist.innerHTML = "";
        checklistSec.style.display = "none";
        noStudentsMsg.style.display = "none";

        if (currentStudents.length === 0) {
            noStudentsMsg.style.display = "block";
            return;
        }

        const className = markClassSel.options[markClassSel.selectedIndex].text;
        checklistTitle.textContent = `${className} — ${formatDate(markDateIn.value)}`;
        currentStudents.forEach(s => buildChecklistItem(s, "present", checklist));
        bindToggle(checklist);
        checklistSec.style.display = "block";
        showMessage("");
    } catch (err) {
        showMessage("Could not load students.", true);
    }
});

markAllPresent.addEventListener("click", () => setAll(checklist, "present"));
markAllAbsent.addEventListener("click",  () => setAll(checklist, "absent"));

// ── submit attendance ───────────────────────────────────────────────────
submitBtn.addEventListener("click", async () => {
    const classId = markClassSel.value;
    const date    = markDateIn.value;
    if (!classId || !date) { showMessage("Select a class and date first.", true); return; }

    const records = Array.from(checklist.querySelectorAll("li")).map(li => ({
        student: li.dataset.id,
        status:  li.querySelector(".toggle-btn").dataset.status
    }));

    try {
        const res = await authFetch(API_ATT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ date, classId, records })
        });
        const data = await res.json();
        if (!res.ok) { showMessage(data.error || "Could not save attendance.", true); return; }

        showMessage("Attendance saved.");
        checklistSec.style.display = "none";
        checklist.innerHTML = "";
        loadHistory();
    } catch (err) {
        showMessage("Could not save attendance.", true);
    }
});

// ── history table ───────────────────────────────────────────────────────
async function loadHistory(classId = "", date = "") {
    try {
        let url = API_ATT + "?";
        if (classId) url += `classId=${classId}&`;
        if (date)    url += `date=${date}`;

        const res = await authFetch(url);
        const records = await res.json();

        if (records.length === 0) {
            historyTbody.innerHTML = `<tr><td colspan="5" class="small">No attendance records found.</td></tr>`;
            return;
        }

        historyTbody.innerHTML = "";
        records.forEach(r => {
            const total   = r.records.length;
            const present = r.records.filter(x => x.status === "present").length;
            const absent  = total - present;
            const cls     = r.class ? (r.class.section ? `${r.class.className} - ${r.class.section}` : r.class.className) : "";
            const tr      = document.createElement("tr");
            tr.className  = "history-row";
            tr.innerHTML  = `
                <td>${formatDate(r.date)}</td>
                <td>${cls}</td>
                <td><span class="badge present">${present}</span></td>
                <td><span class="badge absent">${absent}</span></td>
                <td>
                    <button type="button" class="edit-btn" data-id="${r._id}" style="padding:4px 10px;font-size:12px">View/Edit</button>
                    ${isAdmin ? `<button type="button" class="delete-btn" data-id="${r._id}" style="padding:4px 10px;font-size:12px">Delete</button>` : ""}
                </td>
            `;
            historyTbody.appendChild(tr);
        });
    } catch (err) {
        historyTbody.innerHTML = `<tr><td colspan="5" class="small">Could not load records.</td></tr>`;
    }
}

filterBtn.addEventListener("click", () => loadHistory(filterClassSel.value, filterDateIn.value));
clearFilterBtn.addEventListener("click", () => {
    filterClassSel.value = "";
    filterDateIn.value   = "";
    loadHistory();
});

// ── view/edit modal ─────────────────────────────────────────────────────
historyTbody.addEventListener("click", async (e) => {
    const id = e.target.dataset.id;
    if (!id) return;

    if (e.target.classList.contains("delete-btn")) {
        if (!confirm("Delete this attendance record?")) return;
        try {
            const res = await authFetch(`${API_ATT}/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            showMessage("Record deleted.");
            loadHistory();
        } catch (err) {
            showMessage("Could not delete record.", true);
        }
    }

    if (e.target.classList.contains("edit-btn")) {
        try {
            const res = await authFetch(`${API_ATT}/${id}`);
            const record = await res.json();
            editingRecordId = id;

            const cls = record.class ? (record.class.section
                ? `${record.class.className} - ${record.class.section}`
                : record.class.className) : "";
            editModalTitle.textContent = `${cls} — ${formatDate(record.date)}`;

            editChecklist.innerHTML = "";
            record.records.forEach(entry => buildChecklistItem(entry, entry.status, editChecklist));

            if (isAdmin) {
                bindToggle(editChecklist);
                editSaveBtn.style.display = "inline-block";
            } else {
                // teachers can view but not edit past records
                editChecklist.querySelectorAll && null;
                editSaveBtn.style.display = "none";
            }

            editModal.style.display = "flex";
        } catch (err) {
            showMessage("Could not load record.", true);
        }
    }
});

editSaveBtn.addEventListener("click", async () => {
    const records = Array.from(editChecklist.querySelectorAll("li")).map(li => ({
        student: li.dataset.id,
        status:  li.querySelector(".toggle-btn").dataset.status
    }));
    try {
        const res = await authFetch(`${API_ATT}/${editingRecordId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ records })
        });
        if (!res.ok) throw new Error();
        showMessage("Attendance updated.");
        editModal.style.display = "none";
        loadHistory();
    } catch (err) {
        showMessage("Could not update attendance.", true);
    }
});

editCancelBtn.addEventListener("click", () => { editModal.style.display = "none"; });

// close modal when clicking outside it
editModal.addEventListener("click", (e) => {
    if (e.target === editModal) editModal.style.display = "none";
});

// ── init ────────────────────────────────────────────────────────────────
loadClassOptions();
loadHistory();
