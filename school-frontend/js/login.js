if (getToken()) {
    window.location.href = "/pages/dashboard.html";
}

const emailField  = document.getElementById("email");
const passwordField = document.getElementById("password");
const submitBtn   = document.getElementById("submit-btn");
const statusMsg   = document.getElementById("status-msg");

async function doLogin() {
    submitBtn.textContent = "Signing in...";
    submitBtn.disabled    = true;
    statusMsg.textContent = "";
    statusMsg.className   = "msg";

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email:    emailField.value.trim(),
                password: passwordField.value
            })
        });

        const data = await res.json();

        if (!res.ok) {
            statusMsg.textContent = data.error || "Login failed";
            statusMsg.className   = "msg error";
            submitBtn.textContent = "Sign In →";
            submitBtn.disabled    = false;
            return;
        }

        localStorage.setItem("sms_token", data.token);
        localStorage.setItem("sms_user", JSON.stringify(data.user));
        window.location.href = data.user.role === "parent" ? "/pages/parent.html" : "/pages/dashboard.html";

    } catch (err) {
        statusMsg.textContent = "Could not reach the server. Is the backend running?";
        statusMsg.className   = "msg error";
        submitBtn.textContent = "Sign In →";
        submitBtn.disabled    = false;
    }
}

submitBtn.addEventListener("click", doLogin);
