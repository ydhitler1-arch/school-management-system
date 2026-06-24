requireLogin();

const user = getUser();

// populate account details from stored user info
document.getElementById("profile-name").textContent  = user.name  || "—";
document.getElementById("profile-email").textContent = user.email || "—";
document.getElementById("profile-role").textContent  = user.role  || "—";

// fetch full profile from server to get createdAt
authFetch(`${API_BASE}/auth/me`)
    .then(res => res.ok ? res.json() : null)
    .then(data => {
        if (data && data.createdAt) {
            document.getElementById("profile-since").textContent =
                new Date(data.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit", month: "long", year: "numeric"
                });
        }
    })
    .catch(() => {});

// password change form
const form            = document.getElementById("password-form");
const currentPassword = document.getElementById("current-password");
const newPassword     = document.getElementById("new-password");
const confirmPassword = document.getElementById("confirm-password");
const statusMsg       = document.getElementById("status-msg");

function showMessage(text, isError = false) {
    statusMsg.textContent = text;
    statusMsg.className = "msg " + (isError ? "error" : "success");
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (newPassword.value.length < 6) {
        showMessage("New password must be at least 6 characters.", true);
        return;
    }
    if (newPassword.value !== confirmPassword.value) {
        showMessage("New passwords do not match.", true);
        return;
    }

    try {
        const res = await authFetch(`${API_BASE}/auth/change-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                currentPassword: currentPassword.value,
                newPassword: newPassword.value
            })
        });
        const data = await res.json();
        if (!res.ok) {
            showMessage(data.error || "Could not update password.", true);
            return;
        }
        showMessage("Password updated successfully.");
        form.reset();
    } catch (err) {
        showMessage("Could not update password. Try again.", true);
    }
});
