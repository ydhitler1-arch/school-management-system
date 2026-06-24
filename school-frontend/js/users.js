requireAdmin();

const tbody      = document.getElementById("users-tbody");
const form       = document.getElementById("user-form");
const nameField  = document.getElementById("name");
const emailField = document.getElementById("email");
const passField  = document.getElementById("password");
const roleField  = document.getElementById("role");
const studentRow = document.getElementById("student-row");
const studentSel = document.getElementById("studentId");
const statusMsg  = document.getElementById("status-msg");

function showMessage(text, isError = false) {
    statusMsg.textContent = text;
    statusMsg.className = "msg " + (isError ? "error" : "success");
}

// show student dropdown only when role = parent
roleField.addEventListener("change", () => {
    studentRow.style.display = roleField.value === "parent" ? "flex" : "none";
});

// load students into the parent-link dropdown
async function loadStudents() {
    try {
        const res      = await authFetch(`${API_BASE}/students`);
        const students = await res.json();
        studentSel.innerHTML = `<option value="">-- Link to student --</option>`;
        students.forEach(s => {
            const opt = document.createElement("option");
            opt.value = s._id;
            const cls = s.class ? ` (${s.class.className}${s.class.section ? " " + s.class.section : ""})` : "";
            opt.textContent = `${s.name}${cls}`;
            studentSel.appendChild(opt);
        });
    } catch (err) { /* not fatal */ }
}

async function loadUsers() {
    try {
        const res   = await authFetch(`${API_BASE}/auth/users`);
        if (!res.ok) throw new Error();
        const users = await res.json();

        if (users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="small">No users yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = "";
        const currentUser = getUser();
        users.forEach(u => {
            const isMe   = currentUser && u._id === currentUser.id;
            const linked = u.studentId ? (u.studentId.name || "—") : "—";
            const tr     = document.createElement("tr");
            tr.innerHTML = `
                <td>${u.name}${isMe ? ' <span class="small">(you)</span>' : ""}</td>
                <td>${u.email}</td>
                <td>${u.role}</td>
                <td>${linked}</td>
                <td>
                    ${isMe ? "" : `<button type="button" class="delete-btn" data-id="${u._id}">Delete</button>`}
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" class="small">Could not load users.</td></tr>`;
        showMessage("Could not load users.", true);
    }
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
        name:      nameField.value.trim(),
        email:     emailField.value.trim(),
        password:  passField.value,
        role:      roleField.value,
        studentId: roleField.value === "parent" ? (studentSel.value || null) : null
    };
    try {
        const res  = await authFetch(`${API_BASE}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) { showMessage(data.error || "Could not create account.", true); return; }
        showMessage(`Account created for ${data.name} (${data.role}).`);
        form.reset();
        studentRow.style.display = "none";
        loadUsers();
    } catch (err) {
        showMessage("Could not create account.", true);
    }
});

tbody.addEventListener("click", async (e) => {
    const id = e.target.dataset.id;
    if (!id || !e.target.classList.contains("delete-btn")) return;
    if (!confirm("Delete this user account?")) return;
    try {
        const res = await authFetch(`${API_BASE}/auth/users/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        showMessage("User deleted.");
        loadUsers();
    } catch (err) {
        showMessage("Could not delete user.", true);
    }
});

loadStudents();
loadUsers();
