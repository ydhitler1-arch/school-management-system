// ── shared export utilities ────────────────────────────────────────────

// convert an array of objects to a CSV string and trigger download
function exportToCSV(filename, headers, rows) {
    const escape = val => {
        const s = val === null || val === undefined ? "" : String(val);
        return s.includes(",") || s.includes('"') || s.includes("\n")
            ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csvRows = [
        headers.map(escape).join(","),
        ...rows.map(row => row.map(escape).join(","))
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// export students list to CSV
async function exportStudents() {
    try {
        const res      = await authFetch(`${API_BASE}/students`);
        const students = await res.json();
        const headers  = ["Name", "Age", "Class", "Section", "Roll No"];
        const rows     = students.map(s => [
            s.name || "",
            s.age  ?? "",
            s.class ? s.class.className : "",
            s.class ? s.class.section   : "",
            s.rollNo ?? ""
        ]);
        exportToCSV(`students_${today()}.csv`, headers, rows);
    } catch (err) { alert("Could not export students."); }
}

// export attendance for a specific date/class to CSV
async function exportAttendance(classId, date) {
    try {
        let url = `${API_BASE}/attendance?`;
        if (classId) url += `classId=${classId}&`;
        if (date)    url += `date=${date}`;
        const res     = await authFetch(url);
        const records = await res.json();

        const headers = ["Date", "Class", "Student Name", "Roll No", "Status"];
        const rows    = [];
        records.forEach(r => {
            const cls  = r.class ? (r.class.section ? `${r.class.className} ${r.class.section}` : r.class.className) : "";
            const d    = new Date(r.date).toLocaleDateString("en-IN");
            r.records.forEach(entry => {
                rows.push([
                    d,
                    cls,
                    entry.student ? entry.student.name : "",
                    entry.student ? (entry.student.rollNo ?? "") : "",
                    entry.status
                ]);
            });
        });
        if (rows.length === 0) { alert("No attendance records to export."); return; }
        exportToCSV(`attendance_${date || "all"}_${today()}.csv`, headers, rows);
    } catch (err) { alert("Could not export attendance."); }
}

// export fee records to CSV
async function exportFees(status) {
    try {
        const url  = `${API_BASE}/fees${status ? "?status=" + status : ""}`;
        const res  = await authFetch(url);
        const fees = await res.json();
        const headers = ["Student Name", "Fee Type", "Amount (₹)", "Due Date", "Status", "Paid Date"];
        const rows    = fees.map(f => [
            f.student ? f.student.name : "",
            f.feeType,
            f.amount,
            new Date(f.dueDate).toLocaleDateString("en-IN"),
            f.status,
            f.paidDate ? new Date(f.paidDate).toLocaleDateString("en-IN") : ""
        ]);
        if (rows.length === 0) { alert("No fee records to export."); return; }
        exportToCSV(`fees_${status || "all"}_${today()}.csv`, headers, rows);
    } catch (err) { alert("Could not export fees."); }
}

function today() {
    return new Date().toISOString().split("T")[0];
}
