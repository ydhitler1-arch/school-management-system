requireAdmin(); // redirect non-admins immediately

const tbody = document.getElementById("users-tbody");
const form = document.getElementById("user-form");
const nameField = document.getElementById("name");
const emailField = document.getElementById("email");
const passwordField = document.getElementById("password");
const roleField = document.getElementById("role");
const statusMsg = document.getElementById("status-msg");

function showMessage(text, isError = false) {
    statusMsg.textContent = text;
    statusMsg.className = "msg " + (isError ? "error" : "success");
}

async function loadUsers() {
    try {
        const res = await authFetch(`${API_BASE}/auth/users`);
        if (!res.ok) throw new Error();
        const users = await res.json();

        if (users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="small">No users yet.</td></tr>`;
            return;
        }

        tbody.innerHTML = "";
        const currentUser = getUser();
        users.forEach(u => {
            const isMe = currentUser && u._id === currentUser.id;
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${u.name}${isMe ? ' <span class="small">(you)</span>' : ""}</td>
                <td>${u.email}</td>
                <td>${u.role}</td>
                <td>
                    ${isMe ? "" : `<button type="button" class="delete-btn" data-id="${u._id}">Delete</button>`}
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="4" class="small">Could not load users.</td></tr>`;
        showMessage("Could not load users.", true);
    }
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
        const res = await authFetch(`${API_BASE}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: nameField.value.trim(),
                email: emailField.value.trim(),
                password: passwordField.value,
                role: roleField.value
            })
        });
        const data = await res.json();
        if (!res.ok) {
            showMessage(data.error || "Could not create account.", true);
            return;
        }
        showMessage(`Account created for ${data.name} (${data.role}).`);
        form.reset();
        loadUsers();
    } catch (err) {
        showMessage("Could not create account.", true);
    }
});

tbody.addEventListener("click", async (e) => {
    const id = e.target.dataset.id;
    if (!id || !e.target.classList.contains("delete-btn")) return;
    if (!confirm("Delete this user account? They will no longer be able to log in.")) return;
    try {
        const res = await authFetch(`${API_BASE}/auth/users/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        showMessage("User deleted.");
        loadUsers();
    } catch (err) {
        showMessage("Could not delete user.", true);
    }
});

loadUsers();
