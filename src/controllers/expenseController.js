const db = require("../config/database");

exports.addExpense = async (req, res) => {
    const { title, amount, sources } = req.body;

    // user_id diambil dari token login
    const user_id = req.user.id;

    // validasi input
    if (!title || !amount) {
        return res.status(400).json({
            message: "Title dan amount harus diisi"
        });
    }

    const query = `INSERT INTO notes (user_id, title, amount, sources) VALUES (?, ?, ?, ?)`;

    try {
        await db.promise().query(query, [user_id, title, amount, sources || "Manual"]);
        res.json({
            message: "Pengeluaran berhasil dicatat"
        });
    } catch (err) {
        res.status(500).json({
            message: "Gagal menyimpan pengeluaran",
            error: err.message
        });
    }
};

exports.getExpense = async (req, res) => {
    // user_id diambil dari token login
    const user_id = req.user.id;

    const query = `SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC`;

    try {
        const [rows] = await db.promise().query(query, [user_id]);
        res.json({
            message: "pengeluaran berhasil ditemukan",
            data: rows
        });
    } catch (err) {
        res.status(500).json({
            message: "Data tidak ditemukan",
            error: err.message
        });
    }
};

exports.deleteExpense = async (req, res) => {
    const id_notes = req.params.id;
    const user_id = req.user.id;

    const query = `DELETE FROM notes WHERE id_notes = ? AND user_id = ?`;

    try {
        const [result] = await db.promise().query(query, [id_notes, user_id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Pengeluaran tidak ditemukan"
            });
        }
        res.json({
            message: "Pengeluaran berhasil dihapus"
        });
    } catch (err) {
        res.status(500).json({
            message: "Gagal menghapus pengeluaran",
            error: err.message
        });
    }
};

exports.updateExpense = async (req, res) => {
    const id_notes = req.params.id;
    const user_id = req.user.id;
    const { title, amount } = req.body;

    if (!title || !amount) {
        return res.status(400).json({
            message: "Title dan amount harus diisi"
        });
    }

    const query = `UPDATE notes SET title = ?, amount = ? WHERE id_notes = ? AND user_id = ?`;

    try {
        const [result] = await db.promise().query(query, [title, amount, id_notes, user_id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Pengeluaran tidak ditemukan"
            });
        }
        res.json({
            message: "Pengeluaran berhasil diupdate"
        });
    } catch (err) {
        res.status(500).json({
            message: "Gagal mengupdate pengeluaran",
            error: err.message
        });
    }
};

exports.getExpenseSummary = async (req, res) => {
    const user_id = req.user.id;
    const query = `
        SELECT
        IFNULL(SUM(amount),0) as total,
        IFNULL(SUM(CASE WHEN DATE(created_at) = CURDATE() THEN amount ELSE 0 END),0) as today,
        IFNULL(SUM(CASE
            WHEN MONTH(created_at) = MONTH(CURDATE())
            AND YEAR(created_at) = YEAR(CURDATE())
            THEN amount
            ELSE 0
        END),0) as this_month,
        COUNT(*) as total_transactions
        FROM notes
        WHERE user_id = ?
    `;

    try {
        const [rows] = await db.promise().query(query, [user_id]);
        res.json({
            message: "Summary berhasil diambil",
            data: rows[0]
        });
    } catch (err) {
        res.status(500).json({
            message: "Gagal mengambil ringkasan pengeluaran",
            error: err.message
        });
    }
};

