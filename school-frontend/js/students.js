requireLogin();

const API_BASE_STUDENTS = `${API_BASE}/students`;

const tbody = document.getElementById("students-tbody");
const form = document.getElementById("student-form");
const idField = document.getElementById("student-id");
const nameField = document.getElementById("name");
const ageField = document.getElementById("age");
const classField = document.getElementById("class");
const rollNoField = document.getElementById("rollNo");
const formTitle = document.getElementById("form-title");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-btn");
const statusMsg = document.getElementById("status-msg");

const user = getUser();
const isAdmin = user && user.role === "admin";

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

async function loadClassOptions() {
    try {
        const res = await authFetch(`${API_BASE}/classes`);
        if (!res.ok) throw new Error();
        const classes = await res.json();
        classField.innerHTML = `<option value="">-- Select class --</option>`;
        classes.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c._id;
            opt.textContent = c.section ? `${c.className} - ${c.section}` : c.className;
            classField.appendChild(opt);
        });
        if (classes.length === 0) {
            const opt = document.createElement("option");
            opt.disabled = true;
            opt.textContent = "No classes added yet";
            classField.appendChild(opt);
        }
    } catch (err) { /* not fatal */ }
}

async function loadStudents() {
    try {
        const res = await authFetch(API_BASE_STUDENTS);
        if (!res.ok) throw new Error();
        const students = await res.json();

        if (students.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="small">No students yet.${isAdmin ? " Add one using the form." : ""}</td></tr>`;
            return;
        }

        tbody.innerHTML = "";
        students.forEach(s => {
            const tr = document.createElement("tr");
            const className = s.class ? (s.class.section ? `${s.class.className} - ${s.class.section}` : s.class.className) : "";
            tr.innerHTML = `
                <td>${s.name || ""}</td>
                <td>${s.age ?? ""}</td>
                <td>${className}</td>
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
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="small">Could not load students.</td></tr>`;
        showMessage("Could not load students. Is the backend running on port 5000?", true);
    }
}

if (!isAdmin) {
    const formCard = form.closest(".card");
    if (formCard) formCard.style.display = "none";
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
        name: nameField.value.trim(),
        age: Number(ageField.value),
        class: classField.value || null,
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

tbody.addEventListener("click", async (e) => {
    const target = e.target;
    const id = target.dataset.id;
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
            idField.value = s._id;
            nameField.value = s.name || "";
            ageField.value = s.age ?? "";
            classField.value = s.class ? s.class._id : "";
            rollNoField.value = s.rollNo ?? "";
            formTitle.textContent = "Edit Student";
            submitBtn.textContent = "Update Student";
            cancelBtn.style.display = "inline-block";
        } catch (err) {
            showMessage("Could not load student details.", true);
        }
    }
});

cancelBtn.addEventListener("click", resetForm);
loadClassOptions();
loadStudents();
