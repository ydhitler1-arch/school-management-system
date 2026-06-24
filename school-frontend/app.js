// ── theme system (runs immediately to avoid flash) ─────────────────────
(function() {
    const saved = localStorage.getItem("sms_theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.setAttribute("data-theme", saved || (prefersDark ? "dark" : "light"));
})();

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("sms_theme", theme);
    const icons = document.querySelectorAll("#theme-toggle, #theme-toggle-desktop");
    icons.forEach(btn => {
        if (btn) {
            const isMobile = btn.id === "theme-toggle";
            btn.textContent = theme === "dark"
                ? (isMobile ? "☀️" : "☀️ Light")
                : (isMobile ? "🌙" : "🌙 Dark");
        }
    });
}

// ── navbar loader ──────────────────────────────────────────────────────
fetch("/components/navbar.html")
    .then(res => res.text())
    .then(html => {
        document.getElementById("navbar-placeholder").innerHTML = html;

        // apply theme
        const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
        applyTheme(currentTheme);

        // theme toggle buttons (mobile + desktop)
        ["theme-toggle", "theme-toggle-desktop"].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener("click", () => {
                    const current = document.documentElement.getAttribute("data-theme");
                    applyTheme(current === "dark" ? "light" : "dark");
                });
            }
        });

        // ── hamburger menu ─────────────────────────────────────────────
        const hamburger = document.getElementById("hamburger");
        const drawer    = document.getElementById("nav-drawer");
        const overlay   = document.getElementById("nav-overlay");
        const closeBtn  = document.getElementById("drawer-close");

        function openDrawer() {
            drawer.classList.add("open");
            overlay.classList.add("open");
            hamburger.classList.add("open");
            document.body.style.overflow = "hidden";
        }

        function closeDrawer() {
            drawer.classList.remove("open");
            overlay.classList.remove("open");
            hamburger && hamburger.classList.remove("open");
            document.body.style.overflow = "";
        }

        if (hamburger) hamburger.addEventListener("click", openDrawer);
        if (closeBtn)  closeBtn.addEventListener("click", closeDrawer);
        if (overlay)   overlay.addEventListener("click", closeDrawer);

        // close drawer on nav link click
        if (drawer) {
            drawer.querySelectorAll("a").forEach(a => {
                a.addEventListener("click", closeDrawer);
            });
        }

        // ── user info ──────────────────────────────────────────────────
        const user = getUser();
        if (user) {
            const nameEl         = document.getElementById("nav-user-name");
            const drawerUserName = document.getElementById("drawer-user-name");

            if (nameEl)         nameEl.textContent = user.name;
            if (drawerUserName) drawerUserName.textContent = `${user.name} (${user.role})`;

            // show admin-only links in both drawer and desktop nav
            ["nav-users", "nav-users-desktop"].forEach(id => {
                const el = document.getElementById(id);
                if (el && user.role === "admin") el.style.display = "block";
            });
            ["nav-admin", "nav-admin-desktop"].forEach(id => {
                const el = document.getElementById(id);
                if (el && user.role === "admin") el.style.display = "block";
            });
        }

        // ── active nav link ────────────────────────────────────────────
        const currentPath = window.location.pathname;
        document.querySelectorAll(".nav-desktop-links a, .nav-links a").forEach(link => {
            const linkPath = new URL(link.href, window.location.origin).pathname;
            if (linkPath === currentPath || (currentPath === "/" && linkPath === "/index.html")) {
                link.classList.add("active");
            }
        });
    });
