fetch("/components/navbar.html")
    .then(res => res.text())
    .then(html => {
        document.getElementById("navbar-placeholder").innerHTML = html;

        // populate user info in the navbar
        const user = getUser();
        if (user) {
            const nameEl     = document.getElementById("nav-user-name");
            const usersLink  = document.getElementById("nav-users");
            if (nameEl)    nameEl.textContent = `${user.name} (${user.role})`;
            if (usersLink && user.role === "admin") usersLink.style.display = "block";
            const adminLink = document.getElementById("nav-admin");
            if (adminLink && user.role === "admin") adminLink.style.display = "block";
        }

        // highlight the active nav link based on the current page path
        const currentPath = window.location.pathname;
        document.querySelectorAll(".nav ul li a").forEach(link => {
            const linkPath = new URL(link.href, window.location.origin).pathname;
            if (linkPath === currentPath || (currentPath === "/" && linkPath === "/index.html")) {
                link.classList.add("active");
            }
        });
    });
