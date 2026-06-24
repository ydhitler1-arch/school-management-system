requireLogin();

const API_FEES = `${API_BASE}/fees`;
const user    = getUser();
const isAdmin = user && user.role === "admin";

const statusMsg     = document.getElementById("status-msg");
const filterStatus  = document.getElementById("filter-status");
const filterType    = document.getElementById("filter-type");
const filterBtn     = document.getElementById("filter-btn");
const clearBtn      = document.getElementById("clear-btn");
const feesTbody     = document.getElementById("fees-tbody");

const formCard      = document.getElementById("form-card");
const formTitle     = document.getElementById("form-title");
const feeForm       = document.getElementById("fee-form");
const feeIdField    = document.getElementById("fee-id");
const formClass     = document.getElementById("form-class");
const formStudent   = document.getElementById("form-student");
const formType      = document.getElementById("form-type");
const formAmount    = document.getElementById("form-amount");
const formDue       = document.getElementById("form-due");
const formRemarks   = document.getElementById("form-remarks");
const submitBtn     = document.getElementById("submit-btn");
const cancelBtn     = document.getElementById("cancel-btn");

const sumPaid         = document.getElementById("sum-paid");
const sumPaidCount    = document.getElementById("sum-paid-count");
const sumPending      = document.getElementById("sum-pending");
const sumPendingCount = document.getElementById("sum-pending-count");
const sumOverdue      = document.getElementById("sum-overdue");
const sumOverdueCount = document.getElementById("sum-overdue-count");

function showMessage(text, isError = false) {
    statusMsg.textContent = text;
    statusMsg.className = "msg " + (isError ? "error" : "success");
}

function formatDate(iso) {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
}

function formatCurrency(n) {
    return "₹" + Number(n).toLocaleString("en-IN");
}

function statusBadge(s) {
    return `<span class="status-badge status-${s}">${s}</span>`;
}

function resetForm() {
    feeIdField.value = "";
    feeForm.reset();
    formStudent.innerHTML = `<option value="">-- Select student --</option>`;
    formTitle.textContent = "Add Fee Record";
    submitBtn.textContent = "Add Fee Record";
    cancelBtn.style.display = "none";
}

// ── summary cards ──────────────────────────────────────────────────────
async function loadSummary() {
    try {
        const res  = await authFetch(`${API_FEES}/summary`);
        const data = await res.json();
        sumPaid.textContent         = formatCurrency(data.totalPaid);
        sumPaidCount.textContent    = `${data.countPaid} payment${data.countPaid !== 1 ? "s" : ""}`;
        sumPending.textContent      = formatCurrency(data.totalPending);
        sumPendingCount.textContent = `${data.countPending} record${data.countPending !== 1 ? "s" : ""}`;
        sumOverdue.textContent      = formatCurrency(data.totalOverdue);
        sumOverdueCount.textContent = `${data.countOverdue} record${data.countOverdue !== 1 ? "s" : ""}`;
    } catch (err) { /* not fatal */ }
}

// ── class dropdown → student cascade ──────────────────────────────────
async function loadClasses() {
    try {
        const res = await authFetch(`${API_BASE}/classes`);
        const classes = await res.json();
        formClass.innerHTML = `<option value="">-- Filter by class --</option>`;
        classes.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c._id;
            opt.textContent = c.section ? `${c.className} - ${c.section}` : c.className;
            formClass.appendChild(opt);
        });
    } catch (err) { /* not fatal */ }
}

formClass.addEventListener("change", async () => {
    formStudent.innerHTML = `<option value="">-- Select student --</option>`;
    const classId = formClass.value;
    if (!classId) {
        // no class filter — load ALL students
        try {
            const res = await authFetch(`${API_BASE}/students`);
            const students = await res.json();
            students.forEach(s => {
                const opt = document.createElement("option");
                opt.value = s._id;
                opt.textContent = `${s.name}${s.rollNo ? ` (Roll: ${s.rollNo})` : ""}`;
                formStudent.appendChild(opt);
            });
        } catch (err) { /* not fatal */ }
        return;
    }
    try {
        const res = await authFetch(`${API_BASE}/attendance/students/${classId}`);
        const students = await res.json();
        students.forEach(s => {
            const opt = document.createElement("option");
            opt.value = s._id;
            opt.textContent = `${s.name}${s.rollNo ? ` (Roll: ${s.rollNo})` : ""}`;
            formStudent.appendChild(opt);
        });
        if (students.length === 0) {
            const opt = document.createElement("option");
            opt.disabled = true;
            opt.textContent = "No students in this class";
            formStudent.appendChild(opt);
        }
    } catch (err) { /* not fatal */ }
});

// ── fees table ─────────────────────────────────────────────────────────
async function loadFees(status = "", feeType = "") {
    try {
        let url = API_FEES + "?";
        if (status)  url += `status=${status}&`;
        if (feeType) url += `feeType=${encodeURIComponent(feeType)}`;

        const res  = await authFetch(url);
        const fees = await res.json();

        if (fees.length === 0) {
            feesTbody.innerHTML = `<tr><td colspan="6" class="small">No fee records found.</td></tr>`;
            return;
        }

        feesTbody.innerHTML = "";
        fees.forEach(f => {
            const name = f.student ? f.student.name : "";
            const tr   = document.createElement("tr");
            const isPaid = f.status === "paid";
            tr.innerHTML = `
                <td>${name}</td>
                <td>${f.feeType}</td>
                <td>${formatCurrency(f.amount)}</td>
                <td>${formatDate(f.dueDate)}</td>
                <td>${statusBadge(f.status)}</td>
                <td>
                    ${!isPaid ? `<button type="button" class="pay-btn" data-id="${f._id}" style="padding:4px 10px;font-size:12px;background:#1b7a3d;color:#fff;border:none;border-radius:5px;cursor:pointer">Mark Paid</button>` : ""}
                    ${isAdmin ? `
                        <button type="button" class="edit-btn" data-id="${f._id}" style="padding:4px 10px;font-size:12px">Edit</button>
                        <button type="button" class="delete-btn" data-id="${f._id}" style="padding:4px 10px;font-size:12px">Delete</button>
                    ` : ""}
                </td>
            `;
            feesTbody.appendChild(tr);
        });
    } catch (err) {
        feesTbody.innerHTML = `<tr><td colspan="6" class="small">Could not load fee records.</td></tr>`;
    }
}

filterBtn.addEventListener("click", () => loadFees(filterStatus.value, filterType.value));
clearBtn.addEventListener("click",  () => {
    filterStatus.value = "";
    filterType.value   = "";
    loadFees();
});

document.getElementById("export-fees-btn").addEventListener("click", () => {
    exportFees(filterStatus.value || null);
});

// ── form submit ────────────────────────────────────────────────────────
feeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = feeIdField.value;
    const payload = {
        student:  formStudent.value,
        feeType:  formType.value,
        amount:   Number(formAmount.value),
        dueDate:  formDue.value,
        remarks:  formRemarks.value.trim()
    };
    try {
        const res = await authFetch(`${API_FEES}${id ? "/" + id : ""}`, {
            method: id ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) { showMessage(data.error || "Could not save.", true); return; }
        showMessage(id ? "Fee record updated." : "Fee record added.");
        resetForm();
        loadFees();
        loadSummary();
    } catch (err) {
        showMessage("Could not save fee record.", true);
    }
});

cancelBtn.addEventListener("click", resetForm);

// hide form for non-admins (teachers can still mark fees as paid)
if (!isAdmin) formCard.style.display = "none";

// ── table click handler ────────────────────────────────────────────────
feesTbody.addEventListener("click", async (e) => {
    const target = e.target;
    const id     = target.dataset.id;
    if (!id) return;

    // mark as paid
    if (target.classList.contains("pay-btn")) {
        if (!confirm("Mark this fee as paid today?")) return;
        try {
            const res = await authFetch(`${API_FEES}/${id}/pay`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ paidDate: new Date().toISOString() })
            });
            if (!res.ok) { const d = await res.json(); showMessage(d.error || "Could not update.", true); return; }
            showMessage("Fee marked as paid.");
            loadFees(filterStatus.value, filterType.value);
            loadSummary();
        } catch (err) {
            showMessage("Could not mark as paid.", true);
        }
    }

    // delete
    if (target.classList.contains("delete-btn")) {
        if (!confirm("Delete this fee record?")) return;
        try {
            const res = await authFetch(`${API_FEES}/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            showMessage("Fee record deleted.");
            loadFees();
            loadSummary();
        } catch (err) {
            showMessage("Could not delete fee record.", true);
        }
    }

    // edit
    if (target.classList.contains("edit-btn")) {
        try {
            const res = await authFetch(`${API_FEES}/${id}`);
            const f   = await res.json();
            feeIdField.value        = f._id;
            formType.value          = f.feeType;
            formAmount.value        = f.amount;
            formDue.value           = f.dueDate ? f.dueDate.split("T")[0] : "";
            formRemarks.value       = f.remarks || "";
            // preload student by setting it in the dropdown
            formStudent.innerHTML   = "";
            const opt               = document.createElement("option");
            opt.value               = f.student._id;
            opt.textContent         = f.student.name;
            formStudent.appendChild(opt);
            formTitle.textContent   = "Edit Fee Record";
            submitBtn.textContent   = "Update Fee Record";
            cancelBtn.style.display = "inline-block";
        } catch (err) {
            showMessage("Could not load fee record.", true);
        }
    }
});

// ── init ───────────────────────────────────────────────────────────────
loadClasses();
loadSummary();
loadFees();
