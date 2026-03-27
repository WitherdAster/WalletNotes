const db = require("../config/database");
const bcrypt = require("bcrypt");

// Track users who were prompted to link their WhatsApp to an existing account
const pendingRegistrations = new Map();

async function handleMessage(sock, senderJid, text) {
    //mengecek apakah wa_id sudah terdaftar di database
    const login = await db.promise().query(
                "SELECT * FROM users WHERE wa_id = ?",
                [senderJid]
            );
    //jika wa_id tidak ada maka diarahkan untuk login
    if (!login[0].length) {

        // If we already asked this sender to confirm their phone+password, process it
        if (pendingRegistrations.has(senderJid)) {
            const [phone, password] = text.split(",").map((s) => s.trim());

            if (!phone || !password) {
                await sock.sendMessage(senderJid, {
                    text: "Format salah. Silakan kirim: nomor,password (contoh: 6281234567890,password123)"
                });
                return;
            }

            const [rows] = await db.promise().query(
                "SELECT * FROM users WHERE phone = ?",
                [phone]
            );

            if (!rows.length) {
                await sock.sendMessage(senderJid, {
                    text: "Nomor telepon tidak ditemukan. Pastikan sudah mendaftar di aplikasi terlebih dahulu."
                });
                return;
            }

            const user = rows[0];
            const passwordMatches = await bcrypt.compare(password, user.password);

            if (!passwordMatches) {
                await sock.sendMessage(senderJid, {
                    text: "Password salah. Silakan coba lagi."
                });
                return;
            }

            // Link WhatsApp JID to the user
            await db.promise().query(
                "UPDATE users SET wa_id = ? WHERE user_id = ?",
                [senderJid, user.user_id]
            );

            pendingRegistrations.delete(senderJid);

            await sock.sendMessage(senderJid, {
                text: "Akun berhasil di-link! Silakan kirim catatan pengeluaran dengan format: judul jumlah\nContoh: Makan 15000"
            });
            return;
        }

        // Ask the user to reply with phone + password to link their account
        pendingRegistrations.set(senderJid, true);
        await sock.sendMessage(senderJid, {
            text: "Hi, Silahkan login dulu menggunakan format:\nNomor,Password\n(contoh: 6281234567890,password123)\nUntuk menghubungkan WhatsApp dengan akun Anda."
        });

        return;
    
    //jika wa_id sudah terdaftar maka diarahkan untuk mencatat pengeluaran
    } else {        
    
        try {

            const parts = text.split(" ");

            if (parts.length < 2) {

                await sock.sendMessage(senderJid, {
                    text: "Format salah.\nContoh:\nMakan 15000"
                });

                return;
            }

            const title = parts.slice(0, -1).join(" ");
            const amount = parseInt(parts[parts.length - 1]);

            if (isNaN(amount)) {

                await sock.sendMessage(senderJid, {
                    text: "Jumlah harus angka."
                });

                return;
            }

            // Use full WhatsApp JID (including @lid, @c.us, etc.) so it matches stored wa_id values
            let [user] = await db.promise().query(
                "SELECT * FROM users WHERE wa_id = ?",
                [senderJid]
            );

            // If the user exists by phone but not yet by wa_id, link the wa_id to the user record
            if (!user.length) {
                const senderPhone = senderJid.split("@")[0];
                const [phoneMatch] = await db.promise().query(
                    "SELECT * FROM users WHERE phone = ?",
                    [senderPhone]
                );

                if (phoneMatch.length) {
                    // Update wa_id so future messages are matched directly
                    await db.promise().query(
                        "UPDATE users SET wa_id = ? WHERE user_id = ?",
                        [senderJid, phoneMatch[0].user_id]
                    );

                    user = phoneMatch;
                }
            }

            if (!user.length) {
                await sock.sendMessage(senderJid, {
                    text: "Nomor WhatsApp belum terdaftar."
                });

                return;
            }

            const user_id = user[0].user_id;

            await db.promise().query(
                `INSERT INTO notes (user_id, title, amount, sources)
                VALUES (?, ?, ?, 'WhatsApp')`,
                [user_id, title, amount]
            );

            await sock.sendMessage(senderJid, {
                text: `Pengeluaran dicatat\n${title} - Rp${amount}`
            });

        } catch (err) {

            console.log(err);

            await sock.sendMessage(senderJid, {
                text: "Terjadi kesalahan sistem."
            });

        }

    }
}
    
module.exports = handleMessage;
