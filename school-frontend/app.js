// ── theme (runs immediately to prevent flash) ──────────────────────────
(function() {
    const saved = localStorage.getItem("sms_theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.setAttribute("data-theme", saved || (prefersDark ? "dark" : "light"));
})();

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("sms_theme", theme);
    document.querySelectorAll("#theme-toggle, #theme-toggle-desktop").forEach(btn => {
        if (!btn) return;
        const isMobile = btn.id === "theme-toggle";
        btn.textContent = theme === "dark" ? (isMobile ? "☀️" : "☀️ Light") : (isMobile ? "🌙" : "🌙 Dark");
    });
}

// ── load navbar ────────────────────────────────────────────────────────
fetch("/components/navbar.html")
    .then(res => res.text())
    .then(html => {
        document.getElementById("navbar-placeholder").innerHTML = html;

        // apply saved theme
        applyTheme(document.documentElement.getAttribute("data-theme") || "light");

        // theme toggle buttons
        ["theme-toggle", "theme-toggle-desktop"].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.addEventListener("click", () => {
                applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
            });
        });

        // ── hamburger / drawer ─────────────────────────────────────────
        const hamburger = document.getElementById("hamburger");
        const drawer    = document.getElementById("nav-drawer");
        const overlay   = document.getElementById("nav-overlay");
        const closeBtn  = document.getElementById("drawer-close");

        function openDrawer() {
            drawer && drawer.classList.add("open");
            overlay && overlay.classList.add("open");
            hamburger && hamburger.classList.add("open");
            document.body.style.overflow = "hidden";
        }

        function closeDrawer() {
            drawer && drawer.classList.remove("open");
            overlay && overlay.classList.remove("open");
            hamburger && hamburger.classList.remove("open");
            document.body.style.overflow = "";
        }

        if (hamburger) hamburger.addEventListener("click", openDrawer);
        if (closeBtn)  closeBtn.addEventListener("click", closeDrawer);
        if (overlay)   overlay.addEventListener("click", closeDrawer);

        // close on link click inside drawer
        if (drawer) {
            drawer.querySelectorAll("a").forEach(a => a.addEventListener("click", closeDrawer));
        }

        // ── user info ──────────────────────────────────────────────────
        const user = getUser();
        if (user) {
            const nameEl      = document.getElementById("nav-user-name");
            const drawerName  = document.getElementById("drawer-user-name");
            const drawerRole  = document.getElementById("drawer-user-role");

            if (nameEl)     nameEl.textContent     = user.name;
            if (drawerName) drawerName.textContent  = user.name;
            if (drawerRole) drawerRole.textContent  = user.role.charAt(0).toUpperCase() + user.role.slice(1);

            // show admin links
            if (user.role === "admin") {
                ["nav-users", "nav-admin"].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.style.display = "flex";
                });
                ["nav-users-desktop", "nav-admin-desktop"].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.style.display = "block";
                });
            }
        }

        // ── active link highlight ──────────────────────────────────────
        const currentPath = window.location.pathname;
        document.querySelectorAll(".nav-desktop-links a, .nav-links a").forEach(link => {
            try {
                const linkPath = new URL(link.href, window.location.origin).pathname;
                if (linkPath === currentPath || (currentPath === "/" && linkPath === "/index.html")) {
                    link.classList.add("active");
                }
            } catch(e) {}
        });
    });
