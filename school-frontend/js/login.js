// redirect to home if already logged in
if (getToken()) {
    window.location.href = "/index.html";
}

const form = document.getElementById("login-form");
const emailField = document.getElementById("email");
const passwordField = document.getElementById("password");
const submitBtn = document.getElementById("submit-btn");
const statusMsg = document.getElementById("status-msg");

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    submitBtn.textContent = "Signing in...";
    submitBtn.disabled = true;
    statusMsg.textContent = "";
    statusMsg.className = "msg";

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: emailField.value.trim(),
                password: passwordField.value
            })
        });

        const data = await res.json();

        if (!res.ok) {
            statusMsg.textContent = data.error || "Login failed";
            statusMsg.className = "msg error";
            submitBtn.textContent = "Sign in";
            submitBtn.disabled = false;
            return;
        }

        // store the token and user info, then go to the dashboard
        localStorage.setItem("sms_token", data.token);
        localStorage.setItem("sms_user", JSON.stringify(data.user));
        // parents go to their own portal, everyone else goes to the dashboard
        window.location.href = data.user.role === "parent" ? "/pages/parent.html" : "/index.html";

    } catch (err) {
        statusMsg.textContent = "Could not reach the server. Is the backend running?";
        statusMsg.className = "msg error";
        submitBtn.textContent = "Sign in";
        submitBtn.disabled = false;
    }
});
