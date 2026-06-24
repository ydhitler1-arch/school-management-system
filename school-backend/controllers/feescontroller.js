const Fee = require('../models/Fee');

// GET /api/fees?studentId=...&status=...&feeType=...
exports.getFees = async (req, res) => {
    try {
        const filter = {};
        if (req.query.studentId) filter.student  = req.query.studentId;
        if (req.query.status)    filter.status   = req.query.status;
        if (req.query.feeType)   filter.feeType  = req.query.feeType;

        const fees = await Fee.find(filter)
            .populate('student', 'name rollNo class')
            .populate({
                path: 'student',
                populate: { path: 'class', select: 'className section' }
            })
            .populate('recordedBy', 'name')
            .sort({ dueDate: 1 });

        res.json(fees);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch fees" });
    }
};

// GET /api/fees/summary
// total collected, pending, overdue amounts across all students
exports.getFeeSummary = async (req, res) => {
    try {
        const fees = await Fee.find();
        const summary = {
            totalPaid:    0,
            totalPending: 0,
            totalOverdue: 0,
            countPaid:    0,
            countPending: 0,
            countOverdue: 0
        };
        fees.forEach(f => {
            if (f.status === 'paid')    { summary.totalPaid    += f.amount; summary.countPaid++;    }
            if (f.status === 'pending') { summary.totalPending += f.amount; summary.countPending++; }
            if (f.status === 'overdue') { summary.totalOverdue += f.amount; summary.countOverdue++; }
        });
        res.json(summary);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch fee summary" });
    }
};

// GET /api/fees/:id
exports.getFeeById = async (req, res) => {
    try {
        const fee = await Fee.findById(req.params.id)
            .populate('student', 'name rollNo')
            .populate('recordedBy', 'name');
        if (!fee) return res.status(404).json({ error: "Fee record not found" });
        res.json(fee);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch fee record" });
    }
};

// POST /api/fees
exports.addFee = async (req, res) => {
    try {
        const { student, feeType, amount, dueDate, remarks } = req.body;
        const fee = new Fee({
            student, feeType, amount, dueDate, remarks,
            recordedBy: req.user.id
        });
        await fee.save();
        await fee.populate('student', 'name rollNo');
        res.status(201).json(fee);
    } catch (err) {
        res.status(400).json({ error: "Could not add fee record" });
    }
};

// PATCH /api/fees/:id/pay  — mark a fee as paid
exports.markAsPaid = async (req, res) => {
    try {
        const fee = await Fee.findById(req.params.id);
        if (!fee) return res.status(404).json({ error: "Fee record not found" });
        if (fee.status === 'paid') return res.status(400).json({ error: "This fee is already marked as paid" });

        fee.status   = 'paid';
        fee.paidDate = req.body.paidDate ? new Date(req.body.paidDate) : new Date();
        await fee.save();
        await fee.populate('student', 'name rollNo');
        res.json(fee);
    } catch (err) {
        res.status(400).json({ error: "Could not mark fee as paid" });
    }
};

// PUT /api/fees/:id
exports.updateFee = async (req, res) => {
    try {
        const { feeType, amount, dueDate, remarks } = req.body;
        const fee = await Fee.findById(req.params.id);
        if (!fee) return res.status(404).json({ error: "Fee record not found" });

        fee.feeType  = feeType  ?? fee.feeType;
        fee.amount   = amount   ?? fee.amount;
        fee.dueDate  = dueDate  ?? fee.dueDate;
        fee.remarks  = remarks  ?? fee.remarks;

        await fee.save();
        await fee.populate('student', 'name rollNo');
        res.json(fee);
    } catch (err) {
        res.status(400).json({ error: "Could not update fee record" });
    }
};

// DELETE /api/fees/:id
exports.deleteFee = async (req, res) => {
    try {
        const fee = await Fee.findByIdAndDelete(req.params.id);
        if (!fee) return res.status(404).json({ error: "Fee record not found" });
        res.json({ message: "Fee record deleted" });
    } catch (err) {
        res.status(500).json({ error: "Could not delete fee record" });
    }
};
