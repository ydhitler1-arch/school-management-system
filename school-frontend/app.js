// ── theme system (runs immediately to avoid flash) ─────────────────────
(function() {
    const saved = localStorage.getItem("sms_theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = saved || (prefersDark ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
})();

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("sms_theme", theme);
    const btn = document.getElementById("theme-toggle");
    if (btn) {
        btn.textContent = theme === "dark" ? "☀️ Light" : "🌙 Dark";
        btn.title = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
    }
}

// ── navbar loader ──────────────────────────────────────────────────────
fetch("/components/navbar.html")
    .then(res => res.text())
    .then(html => {
        document.getElementById("navbar-placeholder").innerHTML = html;

        // apply theme to the toggle button after navbar loads
        const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
        applyTheme(currentTheme);

        // wire up the toggle
        const themeBtn = document.getElementById("theme-toggle");
        if (themeBtn) {
            themeBtn.addEventListener("click", () => {
                const current = document.documentElement.getAttribute("data-theme");
                applyTheme(current === "dark" ? "light" : "dark");
            });
        }

        // populate user info
        const user = getUser();
        if (user) {
            const nameEl    = document.getElementById("nav-user-name");
            const usersLink = document.getElementById("nav-users");
            const adminLink = document.getElementById("nav-admin");
            if (nameEl)    nameEl.textContent = `${user.name}`;
            if (usersLink && user.role === "admin") usersLink.style.display = "block";
            if (adminLink && user.role === "admin") adminLink.style.display = "block";
        }

        // highlight active nav link
        const currentPath = window.location.pathname;
        document.querySelectorAll(".nav ul li a").forEach(link => {
            const linkPath = new URL(link.href, window.location.origin).pathname;
            if (linkPath === currentPath || (currentPath === "/" && linkPath === "/index.html")) {
                link.classList.add("active");
            }
        });
    });
