requireLogin();

const API_BASE_CLASSES = `${API_BASE}/classes`;

const tbody = document.getElementById("classes-tbody");
const form = document.getElementById("class-form");
const idField = document.getElementById("class-id");
const classNameField = document.getElementById("className");
const sectionField = document.getElementById("section");
const classTeacherField = document.getElementById("classTeacher");
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
    formTitle.textContent = "Add Class";
    submitBtn.textContent = "Add Class";
    cancelBtn.style.display = "none";
}

async function loadTeacherOptions() {
    try {
        const res = await authFetch(`${API_BASE}/teachers`);
        if (!res.ok) throw new Error();
        const teachers = await res.json();
        classTeacherField.innerHTML = `<option value="">-- Select class teacher --</option>`;
        teachers.forEach(t => {
            const opt = document.createElement("option");
            opt.value = t._id;
            opt.textContent = t.name + (t.subject ? ` (${t.subject})` : "");
            classTeacherField.appendChild(opt);
        });
        if (teachers.length === 0) {
            const opt = document.createElement("option");
            opt.disabled = true;
            opt.textContent = "No teachers added yet";
            classTeacherField.appendChild(opt);
        }
    } catch (err) { /* not fatal */ }
}

async function loadClasses() {
    try {
        const res = await authFetch(API_BASE_CLASSES);
        if (!res.ok) throw new Error();
        const classes = await res.json();

        if (classes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="small">No classes yet.${isAdmin ? " Add one using the form." : ""}</td></tr>`;
            return;
        }

        tbody.innerHTML = "";
        classes.forEach(c => {
            const tr = document.createElement("tr");
            const teacherName = c.classTeacher ? c.classTeacher.name : "";
            tr.innerHTML = `
                <td>${c.className || ""}</td>
                <td>${c.section || ""}</td>
                <td>${teacherName}</td>
                <td>
                    ${isAdmin ? `
                    <button type="button" class="edit-btn" data-id="${c._id}">Edit</button>
                    <button type="button" class="delete-btn" data-id="${c._id}">Delete</button>
                    ` : ""}
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" class="small">Could not load classes.</td></tr>`;
        showMessage("Could not load classes. Is the backend running on port 5000?", true);
    }
}

if (!isAdmin) {
    const formCard = form.closest(".card");
    if (formCard) formCard.style.display = "none";
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
        className: classNameField.value.trim(),
        section: sectionField.value.trim(),
        classTeacher: classTeacherField.value || null
    };
    const id = idField.value;
    try {
        const res = await authFetch(`${API_BASE_CLASSES}${id ? "/" + id : ""}`, {
            method: id ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) {
            showMessage(data.details ? data.details.map(d => d.message).join(", ") : (data.error || "Could not save."), true);
            return;
        }
        showMessage(id ? "Class updated." : "Class added.");
        resetForm();
        loadClasses();
    } catch (err) {
        showMessage("Could not save class.", true);
    }
});

tbody.addEventListener("click", async (e) => {
    const target = e.target;
    const id = target.dataset.id;
    if (!id) return;

    if (target.classList.contains("delete-btn")) {
        if (!confirm("Delete this class?")) return;
        try {
            const res = await authFetch(`${API_BASE_CLASSES}/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error();
            showMessage("Class deleted.");
            loadClasses();
        } catch (err) {
            showMessage("Could not delete class.", true);
        }
    }

    if (target.classList.contains("edit-btn")) {
        try {
            const res = await authFetch(`${API_BASE_CLASSES}/${id}`);
            if (!res.ok) throw new Error();
            const c = await res.json();
            idField.value = c._id;
            classNameField.value = c.className || "";
            sectionField.value = c.section || "";
            classTeacherField.value = c.classTeacher ? c.classTeacher._id : "";
            formTitle.textContent = "Edit Class";
            submitBtn.textContent = "Update Class";
            cancelBtn.style.display = "inline-block";
        } catch (err) {
            showMessage("Could not load class details.", true);
        }
    }
});

cancelBtn.addEventListener("click", resetForm);
loadTeacherOptions();
loadClasses();
