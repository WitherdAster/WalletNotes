const db = require("../config/database");

exports.addExpense = (req, res) => {

    const { title, amount, sources } = req.body;

    // user_id diambil dari token login
    const user_id = req.user.id;

    // console.log(req.user);

    // validasi input
    if (!title || !amount) {
        return res.status(400).json({
            message: "Title dan amount harus diisi"
        });
    }

    const query = `    INSERT INTO notes (user_id, title, amount, sources)
    VALUES (?, ?, ?, ?)
    `;

    db.query(
        query,
        [user_id, title, amount, sources || "Manual"],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    message: "Gagal menyimpan pengeluaran",
                    error: err
                });
            }

            res.json({
                message: "Pengeluaran berhasil dicatat"
            });

        }
    );

};

exports.getExpense = (req, res) => {

    // user_id diambil dari token login
    const user_id = req.user.id;

    const query = `    
    SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC
    `;

    db.query(
        query,
        [user_id],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    message: "Data tidak ditemukan",
                    error: err
                });
            }

            res.json({
                message: "pengeluaran berhasil ditemukan",
                data: result
            });

        }
    );

};

exports.deleteExpense = (req, res) => {

    const id_notes = req.params.id;
    const user_id = req.user.id;

    const query = `DELETE FROM notes WHERE id_notes = ? AND user_id = ?`;

    db.query(query, [id_notes, user_id], (err, result) => {
        if (err) {
            return res.status(500).json({
                message: "Gagal menghapus pengeluaran",
                error: err
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Pengeluaran tidak ditemukan"
            });
        }

        res.json({
            message: "Pengeluaran berhasil dihapus"
        });
    });

};

exports.updateExpense = (req, res) => {

    const id_notes = req.params.id;
    const user_id = req.user.id;
    const { title, amount } = req.body;

     if (!title || !amount) {
        return res.status(400).json({
            message: "Title dan amount harus diisi"
        });
    }
    
    const query = `
    UPDATE notes 
    SET title = ?, amount = ? 
    WHERE id_notes = ? AND user_id = ?`;

    db.query(query, 
        [title, amount, id_notes, user_id], 
        (err, result) => {
        if (err) {
            return res.status(500).json({
                message: "Gagal mengupdate pengeluaran",
                error: err
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Pengeluaran tidak ditemukan"
            });
        }

        res.json({
            message: "Pengeluaran berhasil diupdate"
        });
    });

};
