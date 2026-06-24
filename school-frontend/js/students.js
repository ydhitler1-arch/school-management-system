requireLogin();

const API_BASE_STUDENTS = `${API_BASE}/students`;

const tbody         = document.getElementById("students-tbody");
const form          = document.getElementById("student-form");
const idField       = document.getElementById("student-id");
const nameField     = document.getElementById("name");
const ageField      = document.getElementById("age");
const classField    = document.getElementById("class");
const rollNoField   = document.getElementById("rollNo");
const formTitle     = document.getElementById("form-title");
const submitBtn     = document.getElementById("submit-btn");
const cancelBtn     = document.getElementById("cancel-btn");
const statusMsg     = document.getElementById("status-msg");

// search & filter elements
const searchInput       = document.getElementById("search-input");
const filterClassSearch = document.getElementById("filter-class-search");
const clearSearchBtn    = document.getElementById("clear-search-btn");
const resultsCount      = document.getElementById("results-count");

const user    = getUser();
const isAdmin = user && user.role === "admin";

// all students loaded from the server — search filters this in-memory
let allStudents = [];

function showMessage(text, isError = false) {
    statusMsg.textContent = text;
    statusMsg.className = "msg " + (isError ? "error" : "success");
}

function resetForm() {
    idField.value = "";
    form.reset();
    formTitle.textContent = "Add Student";
    submitBtn.textContent = "Add Student";
    cancelBtn.style.display = "none";
}

function getClassName(s) {
    return s.class
        ? (s.class.section ? `${s.class.className} - ${s.class.section}` : s.class.className)
        : "";
}

// ── render whatever subset of students matches current search/filter ──
function renderStudents(students) {
    tbody.innerHTML = "";

    if (students.length === 0) {
        const msg = allStudents.length === 0
            ? `No students yet.${isAdmin ? " Add one using the form." : ""}`
            : "No students match your search.";
        tbody.innerHTML = `<tr><td colspan="5" class="small">${msg}</td></tr>`;
        resultsCount.textContent = "";
        return;
    }

    resultsCount.textContent =
        students.length === allStudents.length
            ? `${students.length} student${students.length !== 1 ? "s" : ""}`
            : `${students.length} of ${allStudents.length} students`;

    students.forEach(s => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${s.name || ""}</td>
            <td>${s.age ?? ""}</td>
            <td>${getClassName(s)}</td>
            <td>${s.rollNo ?? ""}</td>
            <td>
                ${isAdmin ? `
                <button type="button" class="edit-btn" data-id="${s._id}">Edit</button>
                <button type="button" class="delete-btn" data-id="${s._id}">Delete</button>
                ` : ""}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ── apply search + class filter against the in-memory list ────────────
function applyFilter() {
    const query      = searchInput.value.trim().toLowerCase();
    const classId    = filterClassSearch.value;

    const filtered = allStudents.filter(s => {
        const nameMatch  = !query || (s.name || "").toLowerCase().includes(query);
        const classMatch = !classId || (s.class && s.class._id === classId);
        return nameMatch && classMatch;
    });

    renderStudents(filtered);
}

// live search as user types
searchInput.addEventListener("input", applyFilter);
filterClassSearch.addEventListener("change", applyFilter);

clearSearchBtn.addEventListener("click", () => {
    searchInput.value        = "";
    filterClassSearch.value  = "";
    applyFilter();
});

// ── load class options into both dropdowns ─────────────────────────────
async function loadClassOptions() {
    try {
        const res = await authFetch(`${API_BASE}/classes`);
        if (!res.ok) throw new Error();
        const classes = await res.json();

        // form dropdown (for adding/editing students)
        classField.innerHTML = `<option value="">-- Select class --</option>`;
        // search filter dropdown
        filterClassSearch.innerHTML = `<option value="">All classes</option>`;

        classes.forEach(c => {
            const label = c.section ? `${c.className} - ${c.section}` : c.className;

            const opt1 = document.createElement("option");
            opt1.value = c._id;
            opt1.textContent = label;
            classField.appendChild(opt1);

            const opt2 = document.createElement("option");
            opt2.value = c._id;
            opt2.textContent = label;
            filterClassSearch.appendChild(opt2);
        });

        if (classes.length === 0) {
            const opt = document.createElement("option");
            opt.disabled = true;
            opt.textContent = "No classes added yet";
            classField.appendChild(opt);
        }
    } catch (err) { /* not fatal */ }
}

// ── fetch all students from server ────────────────────────────────────
async function loadStudents() {
    try {
        const res = await authFetch(API_BASE_STUDENTS);
        if (!res.ok) throw new Error();
        allStudents = await res.json();
        applyFilter(); // render with current search state
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="small">Could not load students.</td></tr>`;
        showMessage("Could not load students. Is the backend running?", true);
    }
}

// hide form for non-admins
if (!isAdmin) {
    const formCard = form.closest(".card");
    if (formCard) formCard.style.display = "none";
}

// ── form submit ────────────────────────────────────────────────────────
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
        name:   nameField.value.trim(),
        age:    Number(ageField.value),
        class:  classField.value || null,
        rollNo: rollNoField.value ? Number(rollNoField.value) : 0
    };
    const id = idField.value;
    try {
        const res = await authFetch(`${API_BASE_STUDENTS}${id ? "/" + id : ""}`, {
            method: id ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) {
            showMessage(data.details ? data.details.map(d => d.message).join(", ") : (data.error || "Could not save."), true);
            return;
        }
        showMessage(id ? "Student updated." : "Student added.");
        resetForm();
        loadStudents();
    } catch (err) {
        showMessage("Could not save student.", true);
    }
});

// ── table click handler ────────────────────────────────────────────────
tbody.addEventListener("click", async (e) => {
    const target = e.target;
    const id     = target.dataset.id;
    if (!id) return;

    if (target.classList.contains("delete-btn")) {
        if (!confirm("Delete this student?")) return;
        try {
            const res = await authFetch(`${API_BASE_STUDENTS}/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            showMessage("Student deleted.");
            loadStudents();
        } catch (err) {
            showMessage("Could not delete student.", true);
        }
    }

    if (target.classList.contains("edit-btn")) {
        try {
            const res = await authFetch(`${API_BASE_STUDENTS}/${id}`);
            if (!res.ok) throw new Error();
            const s = await res.json();
            idField.value           = s._id;
            nameField.value         = s.name || "";
            ageField.value          = s.age ?? "";
            classField.value        = s.class ? s.class._id : "";
            rollNoField.value       = s.rollNo ?? "";
            formTitle.textContent   = "Edit Student";
            submitBtn.textContent   = "Update Student";
            cancelBtn.style.display = "inline-block";
        } catch (err) {
            showMessage("Could not load student details.", true);
        }
    }
});

cancelBtn.addEventListener("click", resetForm);

document.getElementById("export-students-btn").addEventListener("click", () => exportStudents());

loadClassOptions();
loadStudents();
