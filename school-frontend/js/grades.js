requireLogin();

const API_GRADES = `${API_BASE}/grades`;
const user    = getUser();
const isAdmin = user && user.role === "admin";

const statusMsg     = document.getElementById("status-msg");
const filterClassSel= document.getElementById("filter-class");
const filterExamSel = document.getElementById("filter-exam");
const filterBtn     = document.getElementById("filter-btn");
const clearBtn      = document.getElementById("clear-btn");
const gradesTbody   = document.getElementById("grades-tbody");

const formCard      = document.getElementById("form-card");
const formTitle     = document.getElementById("form-title");
const gradeForm     = document.getElementById("grade-form");
const gradeIdField  = document.getElementById("grade-id");
const formClassSel  = document.getElementById("form-class");
const formStudentSel= document.getElementById("form-student");
const formSubject   = document.getElementById("form-subject");
const formExam      = document.getElementById("form-exam");
const formObtained  = document.getElementById("form-obtained");
const formTotal     = document.getElementById("form-total");
const formRemarks   = document.getElementById("form-remarks");
const submitBtn     = document.getElementById("submit-btn");
const cancelBtn     = document.getElementById("cancel-btn");

const reportModal   = document.getElementById("report-modal");
const reportName    = document.getElementById("report-name");
const reportMeta    = document.getElementById("report-meta");
const reportBody    = document.getElementById("report-body");
const reportCloseBtn= document.getElementById("report-close-btn");

function showMessage(text, isError = false) {
    statusMsg.textContent = text;
    statusMsg.className = "msg " + (isError ? "error" : "success");
}

function gradeBadge(g) {
    const cls = (g || "F").replace("+", "\\+");
    return `<span class="grade-badge grade-${g || "F"}">${g || "F"}</span>`;
}

function resetForm() {
    gradeIdField.value = "";
    gradeForm.reset();
    formStudentSel.innerHTML = `<option value="">-- Select student --</option>`;
    formTitle.textContent = "Add Grade";
    submitBtn.textContent = "Add Grade";
    cancelBtn.style.display = "none";
}

// ── load class options into all dropdowns ──────────────────────────────
async function loadClassOptions() {
    try {
        const res = await authFetch(`${API_BASE}/classes`);
        const classes = await res.json();
        [filterClassSel, formClassSel].forEach((sel, i) => {
            const blank = i === 0 ? `<option value="">All classes</option>` : `<option value="">-- Select class --</option>`;
            sel.innerHTML = blank;
            classes.forEach(c => {
                const opt = document.createElement("option");
                opt.value = c._id;
                opt.textContent = c.section ? `${c.className} - ${c.section}` : c.className;
                sel.appendChild(opt);
            });
        });
    } catch (err) { /* not fatal */ }
}

// ── when a class is chosen in the form, load its students ─────────────
formClassSel.addEventListener("change", async () => {
    formStudentSel.innerHTML = `<option value="">-- Select student --</option>`;
    const classId = formClassSel.value;
    if (!classId) return;
    try {
        const res = await authFetch(`${API_BASE}/attendance/students/${classId}`);
        const students = await res.json();
        students.forEach(s => {
            const opt = document.createElement("option");
            opt.value = s._id;
            opt.textContent = `${s.name}${s.rollNo ? ` (Roll: ${s.rollNo})` : ""}`;
            formStudentSel.appendChild(opt);
        });
        if (students.length === 0) {
            const opt = document.createElement("option");
            opt.disabled = true;
            opt.textContent = "No students in this class";
            formStudentSel.appendChild(opt);
        }
    } catch (err) { /* not fatal */ }
});

// ── load grades table ──────────────────────────────────────────────────
async function loadGrades(classId = "", examType = "") {
    try {
        let url = API_GRADES + "?";
        if (classId)  url += `classId=${classId}&`;
        if (examType) url += `examType=${encodeURIComponent(examType)}`;

        const res    = await authFetch(url);
        const grades = await res.json();

        if (grades.length === 0) {
            gradesTbody.innerHTML = `<tr><td colspan="6" class="small">No grades found.</td></tr>`;
            return;
        }

        gradesTbody.innerHTML = "";
        grades.forEach(g => {
            const studentName = g.student ? g.student.name : "";
            const studentId   = g.student ? g.student._id  : "";
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>
                    <a href="#" class="report-link" data-id="${studentId}" style="color:#1a237e;text-decoration:underline;font-size:13px">${studentName}</a>
                </td>
                <td>${g.subject}</td>
                <td>${g.examType}</td>
                <td>${g.marksObtained}/${g.totalMarks}</td>
                <td>${gradeBadge(g.grade)}</td>
                <td>
                    ${isAdmin ? `
                    <button type="button" class="edit-btn" data-id="${g._id}" style="padding:4px 10px;font-size:12px">Edit</button>
                    <button type="button" class="delete-btn" data-id="${g._id}" style="padding:4px 10px;font-size:12px">Delete</button>
                    ` : ""}
                </td>
            `;
            gradesTbody.appendChild(tr);
        });
    } catch (err) {
        gradesTbody.innerHTML = `<tr><td colspan="6" class="small">Could not load grades.</td></tr>`;
    }
}

filterBtn.addEventListener("click", () => loadGrades(filterClassSel.value, filterExamSel.value));
clearBtn.addEventListener("click",  () => {
    filterClassSel.value = "";
    filterExamSel.value  = "";
    loadGrades();
});

// ── form submit ────────────────────────────────────────────────────────
gradeForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const obtained = Number(formObtained.value);
    const total    = Number(formTotal.value);
    if (obtained > total) {
        showMessage("Marks obtained cannot be greater than total marks.", true);
        return;
    }

    const id      = gradeIdField.value;
    const payload = {
        student:        formStudentSel.value,
        class:          formClassSel.value,
        subject:        formSubject.value.trim(),
        examType:       formExam.value,
        marksObtained:  obtained,
        totalMarks:     total,
        remarks:        formRemarks.value.trim()
    };

    try {
        const res = await authFetch(`${API_GRADES}${id ? "/" + id : ""}`, {
            method: id ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) { showMessage(data.error || "Could not save grade.", true); return; }
        showMessage(id ? "Grade updated." : "Grade added.");
        resetForm();
        loadGrades();
    } catch (err) {
        showMessage("Could not save grade.", true);
    }
});

cancelBtn.addEventListener("click", resetForm);

// teachers can add grades but cannot edit or delete — handled in the table buttons below

// ── table click handler (edit / delete / report card) ─────────────────
gradesTbody.addEventListener("click", async (e) => {
    const target = e.target;

    // report card link
    if (target.classList.contains("report-link")) {
        e.preventDefault();
        await showReportCard(target.dataset.id);
        return;
    }

    const id = target.dataset.id;
    if (!id) return;

    if (target.classList.contains("delete-btn")) {
        if (!confirm("Delete this grade entry?")) return;
        try {
            const res = await authFetch(`${API_GRADES}/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            showMessage("Grade deleted.");
            loadGrades();
        } catch (err) {
            showMessage("Could not delete grade.", true);
        }
    }

    if (target.classList.contains("edit-btn")) {
        try {
            const res = await authFetch(`${API_GRADES}/${id}`);
            const g = await res.json();
            gradeIdField.value      = g._id;
            // pre-select class then load students, then set student
            formClassSel.value = g.class ? g.class._id : "";
            formClassSel.dispatchEvent(new Event("change"));
            // wait a tick for students to load before setting value
            setTimeout(() => { formStudentSel.value = g.student ? g.student._id : ""; }, 400);
            formSubject.value       = g.subject;
            formExam.value          = g.examType;
            formObtained.value      = g.marksObtained;
            formTotal.value         = g.totalMarks;
            formRemarks.value       = g.remarks || "";
            formTitle.textContent   = "Edit Grade";
            submitBtn.textContent   = "Update Grade";
            cancelBtn.style.display = "inline-block";
        } catch (err) {
            showMessage("Could not load grade.", true);
        }
    }
});

// ── report card modal ──────────────────────────────────────────────────
async function showReportCard(studentId) {
    if (!studentId) return;
    try {
        const res  = await authFetch(`${API_GRADES}/report/${studentId}`);
        const data = await res.json();

        reportName.textContent = data.student.name;
        const cls = data.student.class
            ? (data.student.class.section
                ? `${data.student.class.className} - ${data.student.class.section}`
                : data.student.class.className)
            : "";
        reportMeta.textContent = `${cls}${data.student.rollNo ? `  •  Roll No: ${data.student.rollNo}` : ""}`;

        const subjects = Object.keys(data.bySubject);
        if (subjects.length === 0) {
            reportBody.innerHTML = `<p class="small">No grades recorded yet for this student.</p>`;
        } else {
            let html = `<table class="report-table">`;
            subjects.forEach(subject => {
                html += `<tr><td colspan="4" class="subject-heading">${subject}</td></tr>`;
                html += `<tr style="background:#f9f9fb">
                    <th>Exam</th><th>Marks</th><th>%</th><th>Grade</th>
                </tr>`;
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
            reportBody.innerHTML = html;
        }

        reportModal.style.display = "flex";
    } catch (err) {
        showMessage("Could not load report card.", true);
    }
}

reportCloseBtn.addEventListener("click", () => { reportModal.style.display = "none"; });
reportModal.addEventListener("click", (e) => { if (e.target === reportModal) reportModal.style.display = "none"; });

document.getElementById("report-print-btn").addEventListener("click", () => {
    window.print();
});

// ── init ───────────────────────────────────────────────────────────────
loadClassOptions();
loadGrades();
