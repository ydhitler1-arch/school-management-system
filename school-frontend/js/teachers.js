requireLogin();

const API_BASE_TEACHERS = `${API_BASE}/teachers`;

const tbody = document.getElementById("teachers-tbody");
const form = document.getElementById("teacher-form");
const idField = document.getElementById("teacher-id");
const nameField = document.getElementById("name");
const subjectField = document.getElementById("subject");
const emailField = document.getElementById("email");
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
    formTitle.textContent = "Add Teacher";
    submitBtn.textContent = "Add Teacher";
    cancelBtn.style.display = "none";
}

async function loadTeachers() {
    try {
        const res = await authFetch(API_BASE_TEACHERS);
        if (!res.ok) throw new Error();
        const teachers = await res.json();

        if (teachers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="small">No teachers yet.${isAdmin ? " Add one using the form." : ""}</td></tr>`;
            return;
        }

        tbody.innerHTML = "";
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
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" class="small">Could not load teachers.</td></tr>`;
        showMessage("Could not load teachers. Is the backend running on port 5000?", true);
    }
}

// hide the form entirely for non-admins
if (!isAdmin) {
    const formCard = form.closest(".card");
    if (formCard) formCard.style.display = "none";
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
        name: nameField.value.trim(),
        subject: subjectField.value.trim(),
        email: emailField.value.trim()
    };
    const id = idField.value;

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

tbody.addEventListener("click", async (e) => {
    const target = e.target;
    const id = target.dataset.id;
    if (!id) return;

    if (target.classList.contains("delete-btn")) {
        if (!confirm("Delete this teacher?")) return;
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
            idField.value = t._id;
            nameField.value = t.name || "";
            subjectField.value = t.subject || "";
            emailField.value = t.email || "";
            formTitle.textContent = "Edit Teacher";
            submitBtn.textContent = "Update Teacher";
            cancelBtn.style.display = "inline-block";
        } catch (err) {
            showMessage("Could not load teacher details.", true);
        }
    }
});

cancelBtn.addEventListener("click", resetForm);
loadTeachers();
