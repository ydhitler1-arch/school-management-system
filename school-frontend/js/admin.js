requireAdmin();

const promoteMsg   = document.getElementById("promote-msg");
const notifyMsg    = document.getElementById("notify-msg");
const fromClass    = document.getElementById("from-class");
const toClass      = document.getElementById("to-class");
const previewDiv   = document.getElementById("promote-preview");
const previewText  = document.getElementById("preview-text");
const previewBtn   = document.getElementById("preview-btn");
const promoteBtn   = document.getElementById("promote-btn");

function showMsg(el, text, isError = false) {
    el.textContent = text;
    el.className   = "msg " + (isError ? "error" : "success");
}

// ── load classes into dropdowns ────────────────────────────────────────
async function loadClasses() {
    try {
        const res     = await authFetch(`${API_BASE}/promote`);
        const classes = await res.json();

        [fromClass, toClass].forEach((sel, i) => {
            const blank = i === 0
                ? `<option value="">-- From class --</option>`
                : `<option value="">-- Graduate (no class) --</option>`;
            sel.innerHTML = blank;
            classes.forEach(c => {
                const opt = document.createElement("option");
                opt.value = c._id;
                opt.textContent = c.section ? `${c.className} - ${c.section}` : c.className;
                sel.appendChild(opt);
            });
        });
    } catch (err) { /* not fatal */ }
}

// ── preview promotion ──────────────────────────────────────────────────
previewBtn.addEventListener("click", async () => {
    const from = fromClass.value;
    if (!from) { showMsg(promoteMsg, "Select a source class first.", true); return; }

    try {
        const res      = await authFetch(`${API_BASE}/students`);
        const students = await res.json();
        const inClass  = students.filter(s => s.class && s.class._id === from);
        const fromName = fromClass.options[fromClass.selectedIndex].text;
        const toName   = toClass.value
            ? toClass.options[toClass.selectedIndex].text
            : "Graduated (no class)";

        if (inClass.length === 0) {
            showMsg(promoteMsg, "No active students found in this class.", true);
            previewDiv.style.display = "none";
            promoteBtn.style.display = "none";
            return;
        }

        previewText.innerHTML = `
            <strong>${inClass.length} student${inClass.length !== 1 ? "s" : ""}</strong>
            will be moved from <strong>${fromName}</strong> → <strong>${toName}</strong>.<br>
            <span style="color:var(--danger);font-size:12px">This cannot be undone automatically. Make sure you have the right classes selected.</span>`;
        previewDiv.style.display = "block";
        promoteBtn.style.display = "inline-block";
        showMsg(promoteMsg, "");
    } catch (err) {
        showMsg(promoteMsg, "Could not load student data.", true);
    }
});

// reset preview when dropdowns change
[fromClass, toClass].forEach(sel => sel.addEventListener("change", () => {
    previewDiv.style.display  = "none";
    promoteBtn.style.display  = "none";
}));

// ── confirm promotion ──────────────────────────────────────────────────
promoteBtn.addEventListener("click", async () => {
    const from = fromClass.value;
    const to   = toClass.value;
    if (!from) { showMsg(promoteMsg, "Select a source class.", true); return; }
    if (!confirm("Are you sure? This will update all students in the selected class.")) return;

    try {
        const res  = await authFetch(`${API_BASE}/promote`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fromClassId: from, toClassId: to || null })
        });
        const data = await res.json();
        if (!res.ok) { showMsg(promoteMsg, data.error || "Could not promote.", true); return; }
        showMsg(promoteMsg, data.message);
        previewDiv.style.display  = "none";
        promoteBtn.style.display  = "none";
        fromClass.value = "";
        toClass.value   = "";
    } catch (err) {
        showMsg(promoteMsg, "Could not promote students.", true);
    }
});

// ── email notifications ────────────────────────────────────────────────
document.getElementById("test-email-btn").addEventListener("click", async () => {
    showMsg(notifyMsg, "Sending test email...");
    try {
        const res  = await authFetch(`${API_BASE}/notify/test`, { method: "POST" });
        const data = await res.json();
        showMsg(notifyMsg, data.message || data.error, !res.ok);
    } catch (err) {
        showMsg(notifyMsg, "Could not send test email.", true);
    }
});

document.getElementById("send-reminders-btn").addEventListener("click", async () => {
    if (!confirm("Send overdue fee reminder emails to all parents with linked accounts?")) return;
    showMsg(notifyMsg, "Sending reminders...");
    try {
        const res  = await authFetch(`${API_BASE}/notify/overdue`, { method: "POST" });
        const data = await res.json();
        showMsg(notifyMsg, data.message || data.error, !res.ok);
    } catch (err) {
        showMsg(notifyMsg, "Could not send reminders.", true);
    }
});

// ── init ───────────────────────────────────────────────────────────────
loadClasses();
