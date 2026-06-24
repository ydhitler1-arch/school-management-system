requireLogin();

const API_BASE_TEACHERS = `${API_BASE}/teachers`;

const tbody         = document.getElementById("teachers-tbody");
const form          = document.getElementById("teacher-form");
const idField       = document.getElementById("teacher-id");
const nameField     = document.getElementById("name");
const subjectField  = document.getElementById("subject");
const emailField    = document.getElementById("email");
const passwordField = document.getElementById("password");
const formTitle     = document.getElementById("form-title");
const submitBtn     = document.getElementById("submit-btn");
const cancelBtn     = document.getElementById("cancel-btn");
const statusMsg     = document.getElementById("status-msg");

// search elements
const searchName      = document.getElementById("search-name");
const searchSubject   = document.getElementById("search-subject");
const clearSearchBtn  = document.getElementById("clear-search-btn");
const resultsCount    = document.getElementById("results-count");

const user    = getUser();
const isAdmin = user && user.role === "admin";

let allTeachers = [];

function showMessage(text, isError = false) {
    statusMsg.textContent = text;
    statusMsg.className = "msg " + (isError ? "error" : "success");
}

function resetForm() {
    idField.value = "";
    form.reset();
    formTitle.textContent = "Add Teacher";
    submitBtn.textContent = "Add Teacher";
    cancelBtn.style.display = "none";
}

// ── filter in-memory ───────────────────────────────────────────────────
function applyFilter() {
    const nameQuery    = searchName.value.trim().toLowerCase();
    const subjectQuery = searchSubject.value.trim().toLowerCase();

    const filtered = allTeachers.filter(t => {
        const nameMatch    = !nameQuery    || (t.name    || "").toLowerCase().includes(nameQuery);
        const subjectMatch = !subjectQuery || (t.subject || "").toLowerCase().includes(subjectQuery);
        return nameMatch && subjectMatch;
    });

    renderTeachers(filtered);
}

searchName.addEventListener("input", applyFilter);
searchSubject.addEventListener("input", applyFilter);
clearSearchBtn.addEventListener("click", () => {
    searchName.value    = "";
    searchSubject.value = "";
    applyFilter();
});

// ── render teachers ────────────────────────────────────────────────────
function renderTeachers(teachers) {
    tbody.innerHTML = "";

    if (teachers.length === 0) {
        const msg = allTeachers.length === 0
            ? `No teachers yet.${isAdmin ? " Add one using the form." : ""}`
            : "No teachers match your search.";
        tbody.innerHTML = `<tr><td colspan="4" class="small">${msg}</td></tr>`;
        resultsCount.textContent = "";
        return;
    }

    resultsCount.textContent =
        teachers.length === allTeachers.length
            ? `${teachers.length} teacher${teachers.length !== 1 ? "s" : ""}`
            : `${teachers.length} of ${allTeachers.length} teachers`;

    teachers.forEach(t => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${t.name || ""}</td>
            <td>${t.subject || ""}</td>
            <td>${t.email || ""}</td>
            <td>
                ${isAdmin ? `
                <button type="button" class="edit-btn" data-id="${t._id}">Edit</button>
                <button type="button" class="delete-btn" data-id="${t._id}">Delete</button>
                ` : ""}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ── load all teachers ──────────────────────────────────────────────────
async function loadTeachers() {
    try {
        const res = await authFetch(API_BASE_TEACHERS);
        if (!res.ok) throw new Error();
        allTeachers = await res.json();
        applyFilter();
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" class="small">Could not load teachers.</td></tr>`;
        showMessage("Could not load teachers. Is the backend running?", true);
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
    const id = idField.value;
    const payload = {
        name:    nameField.value.trim(),
        subject: subjectField.value.trim(),
        email:   emailField.value.trim()
    };
    if (!id && passwordField) payload.password = passwordField.value;

    try {
        const res = await authFetch(`${API_BASE_TEACHERS}${id ? "/" + id : ""}`, {
            method: id ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) {
            showMessage(data.details ? data.details.map(d => d.message).join(", ") : (data.error || "Could not save."), true);
            return;
        }
        showMessage(id ? "Teacher updated." : "Teacher added.");
        resetForm();
        loadTeachers();
    } catch (err) {
        showMessage("Could not save teacher.", true);
    }
});

// ── table click handler ────────────────────────────────────────────────
tbody.addEventListener("click", async (e) => {
    const target = e.target;
    const id     = target.dataset.id;
    if (!id) return;

    if (target.classList.contains("delete-btn")) {
        if (!confirm("Delete this teacher? Their login account will also be removed.")) return;
        try {
            const res = await authFetch(`${API_BASE_TEACHERS}/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            showMessage("Teacher deleted.");
            loadTeachers();
        } catch (err) {
            showMessage("Could not delete teacher.", true);
        }
    }

    if (target.classList.contains("edit-btn")) {
        try {
            const res = await authFetch(`${API_BASE_TEACHERS}/${id}`);
            if (!res.ok) throw new Error();
            const t = await res.json();
            idField.value           = t._id;
            nameField.value         = t.name    || "";
            subjectField.value      = t.subject || "";
            emailField.value        = t.email   || "";
            formTitle.textContent   = "Edit Teacher";
            submitBtn.textContent   = "Update Teacher";
            cancelBtn.style.display = "inline-block";
            // hide password field on edit — password changes handled separately
            if (passwordField) {
                passwordField.style.display = "none";
                passwordField.required = false;
            }
        } catch (err) {
            showMessage("Could not load teacher details.", true);
        }
    }
});

cancelBtn.addEventListener("click", () => {
    resetForm();
    // restore password field when cancelling edit
    if (passwordField) {
        passwordField.style.display = "";
        passwordField.required = false;
    }
});

loadTeachers();
