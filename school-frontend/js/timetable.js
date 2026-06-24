requireLogin();

const API_TT  = `${API_BASE}/timetable`;
const user    = getUser();
const isAdmin = user && user.role === "admin";

const statusMsg    = document.getElementById("status-msg");
const classSelect  = document.getElementById("class-select");
const loadTtBtn    = document.getElementById("load-tt-btn");
const ttSection    = document.getElementById("tt-section");
const ttGrid       = document.getElementById("tt-grid");
const editorCard   = document.getElementById("editor-card");
const editDay      = document.getElementById("edit-day");
const loadDayBtn   = document.getElementById("load-day-btn");
const periodsEditor= document.getElementById("periods-editor");
const periodsList  = document.getElementById("periods-list");
const addPeriodBtn = document.getElementById("add-period-btn");
const saveDayBtn   = document.getElementById("save-day-btn");
const clearDayBtn  = document.getElementById("clear-day-btn");

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
let currentClassId  = null;
let currentTimetable= null;
let allTeachers     = [];

function showMessage(text, isError = false) {
    statusMsg.textContent = text;
    statusMsg.className = "msg " + (isError ? "error" : "success");
}

// ── load class and teacher options ─────────────────────────────────────
async function loadOptions() {
    try {
        const [classRes, teacherRes] = await Promise.all([
            authFetch(`${API_BASE}/classes`),
            authFetch(`${API_BASE}/teachers`)
        ]);
        const classes  = await classRes.json();
        allTeachers    = await teacherRes.json();

        classSelect.innerHTML = `<option value="">-- Select a class to view timetable --</option>`;
        classes.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c._id;
            opt.textContent = c.section ? `${c.className} - ${c.section}` : c.className;
            classSelect.appendChild(opt);
        });
    } catch (err) { /* not fatal */ }
}

// ── render the weekly timetable grid ──────────────────────────────────
function renderGrid(timetable) {
    const maxPeriods = Math.max(...DAYS.map(d => (timetable.days[d] || []).length), 0);
    if (maxPeriods === 0) {
        ttGrid.innerHTML = `<p class="small" style="padding:16px">No schedule set for this class yet.${isAdmin ? " Use the editor below to add one." : ""}</p>`;
        return;
    }

    let html = `<div class="tt-grid">`;
    // header row
    html += `<div class="tt-header">Period</div>`;
    DAYS.forEach(d => { html += `<div class="tt-header">${d.slice(0,3)}</div>`; });

    // period rows
    for (let p = 0; p < maxPeriods; p++) {
        html += `<div class="tt-cell tt-period-label">P${p + 1}</div>`;
        DAYS.forEach(d => {
            const period = (timetable.days[d] || [])[p];
            if (period) {
                html += `<div class="tt-cell">
                    <div class="tt-subject">${period.subject}</div>
                    ${period.teacher ? `<div class="tt-teacher">${period.teacher.name}</div>` : ""}
                    ${period.startTime ? `<div class="tt-time">${period.startTime}${period.endTime ? " – " + period.endTime : ""}</div>` : ""}
                </div>`;
            } else {
                html += `<div class="tt-cell"><span class="tt-empty">—</span></div>`;
            }
        });
    }
    html += `</div>`;
    ttGrid.innerHTML = html;
}

// ── load timetable for selected class ─────────────────────────────────
loadTtBtn.addEventListener("click", async () => {
    const classId = classSelect.value;
    if (!classId) { showMessage("Please select a class first.", true); return; }

    try {
        const res = await authFetch(`${API_TT}?classId=${classId}`);
        if (!res.ok) throw new Error();
        currentTimetable = await res.json();
        currentClassId   = classId;

        renderGrid(currentTimetable);
        ttSection.style.display  = "block";
        if (isAdmin) editorCard.style.display = "block";
        showMessage("");
    } catch (err) {
        showMessage("Could not load timetable.", true);
    }
});

// ── build a period editor row ──────────────────────────────────────────
function buildPeriodRow(period = {}, index) {
    const div = document.createElement("div");
    div.className = "period-row";
    div.dataset.index = index;

    const teacherOptions = allTeachers.map(t =>
        `<option value="${t._id}" ${period.teacher && (period.teacher._id || period.teacher) === t._id ? "selected" : ""}>${t.name}</option>`
    ).join("");

    div.innerHTML = `
        <div class="period-num">P${index + 1}</div>
        <input class="input" type="text" placeholder="Subject" value="${period.subject || ""}" data-field="subject" style="font-size:12px;padding:6px 8px" />
        <select class="input" data-field="teacher" style="font-size:12px;padding:6px 8px">
            <option value="">-- Teacher --</option>
            ${teacherOptions}
        </select>
        <input class="input" type="time" value="${period.startTime || ""}" data-field="startTime" style="font-size:12px;padding:6px 8px" />
        <input class="input" type="time" value="${period.endTime   || ""}" data-field="endTime"   style="font-size:12px;padding:6px 8px" />
        <button type="button" class="remove-period-btn" title="Remove period">✕</button>
    `;

    div.querySelector(".remove-period-btn").addEventListener("click", () => {
        div.remove();
        // renumber remaining periods
        periodsList.querySelectorAll(".period-row").forEach((row, i) => {
            row.dataset.index = i;
            row.querySelector(".period-num").textContent = `P${i + 1}`;
        });
    });

    return div;
}

// ── load a day into the editor ─────────────────────────────────────────
loadDayBtn.addEventListener("click", () => {
    const day = editDay.value;
    if (!day) { showMessage("Select a day to edit.", true); return; }

    const dayPeriods = (currentTimetable && currentTimetable.days[day]) || [];
    periodsList.innerHTML = "";
    dayPeriods.forEach((p, i) => periodsList.appendChild(buildPeriodRow(p, i)));
    periodsEditor.style.display = "block";
    showMessage("");
});

addPeriodBtn.addEventListener("click", () => {
    const count = periodsList.querySelectorAll(".period-row").length;
    periodsList.appendChild(buildPeriodRow({}, count));
});

// ── save a day's schedule ──────────────────────────────────────────────
saveDayBtn.addEventListener("click", async () => {
    const day = editDay.value;
    if (!day || !currentClassId) { showMessage("Select a class and day first.", true); return; }

    const rows = periodsList.querySelectorAll(".period-row");
    const periods = Array.from(rows).map((row, i) => ({
        periodNumber: i + 1,
        subject:    row.querySelector("[data-field='subject']").value.trim(),
        teacher:    row.querySelector("[data-field='teacher']").value || null,
        startTime:  row.querySelector("[data-field='startTime']").value,
        endTime:    row.querySelector("[data-field='endTime']").value
    })).filter(p => p.subject); // skip rows with no subject

    try {
        const res = await authFetch(API_TT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ classId: currentClassId, day, periods })
        });
        if (!res.ok) throw new Error();
        showMessage(`${day} schedule saved.`);
        // reload and re-render
        const ttRes = await authFetch(`${API_TT}?classId=${currentClassId}`);
        currentTimetable = await ttRes.json();
        renderGrid(currentTimetable);
    } catch (err) {
        showMessage("Could not save schedule.", true);
    }
});

// ── clear a day's schedule ─────────────────────────────────────────────
clearDayBtn.addEventListener("click", async () => {
    const day = editDay.value;
    if (!day || !currentClassId) { showMessage("Select a class and day first.", true); return; }
    if (!confirm(`Clear the entire ${day} schedule for this class?`)) return;

    try {
        const res = await authFetch(API_TT, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ classId: currentClassId, day })
        });
        if (!res.ok) throw new Error();
        showMessage(`${day} schedule cleared.`);
        periodsList.innerHTML  = "";
        periodsEditor.style.display = "none";
        const ttRes = await authFetch(`${API_TT}?classId=${currentClassId}`);
        currentTimetable = await ttRes.json();
        renderGrid(currentTimetable);
    } catch (err) {
        showMessage("Could not clear schedule.", true);
    }
});

// ── init ───────────────────────────────────────────────────────────────
loadOptions();
