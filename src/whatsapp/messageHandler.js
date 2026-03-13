const db = require("../config/database");

module.exports = async (sock, sender, text) => {

    try {

        // ambil nomor whatsapp
        const phone = sender;

        // cek apakah user ada
        const userQuery = "SELECT * FROM users WHERE phone = ?";

        db.query(userQuery, [phone], (err, users) => {

            if (err) {
                console.log(err);
                return;
            }

            if (users.length === 0) {
                sock.sendMessage(sender + "@s.whatsapp.net", {
                    text: "Nomor anda belum terdaftar di aplikasi."
                });
                return;
            }

            const user = users[0];

            // parsing pesan
            const words = text.trim().split(" ");

            const amount = words[words.length - 1];
            const title = words.slice(0, -1).join(" ");

            if (isNaN(amount)) {
                sock.sendMessage(sender + "@s.whatsapp.net", {
                    text: "Format salah. Contoh: makan 15000"
                });
                return;
            }

            const insertQuery = `
            INSERT INTO notes (user_id, title, amount, sources)
            VALUES (?, ?, ?, 'WhatsApp')
            `;

            db.query(
                insertQuery,
                [user.user_id, title, amount],
                (err) => {

                    if (err) {
                        console.log(err);
                        return;
                    }

                    sock.sendMessage(sender + "@s.whatsapp.net", {
                        text: `Pengeluaran dicatat\n${title} - Rp${amount}`
                    });

                }
            );

        });

    } catch (error) {
        console.log(error);
    }

};
