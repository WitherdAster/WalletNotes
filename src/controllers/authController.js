const db = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
    const { name, phone, password } = req.body;

    // VALIDASI INPUT
    if (!name || !phone || !password) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    try {
        // CEK NOMOR SUDAH TERDAFTAR
        const [rows] = await db.promise().query("SELECT * FROM users WHERE phone = ?", [phone]);

        if (rows.length > 0) {
            return res.status(400).json({
                message: "Phone already registered"
            });
        }

        // HASH PASSWORD
        const hashedPassword = await bcrypt.hash(password, 10);

        // INSERT USER (wa_id will be set later when the user sends a WhatsApp message)
        await db.promise().query("INSERT INTO users (name, phone, password) VALUES (?, ?, ?)", [name, phone, hashedPassword]);

        res.json({
            message: "User registered successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: "Error",
            error: error.message
        });
    }
};

exports.login = async (req, res) => {
    const { phone, password } = req.body;

    // VALIDASI INPUT
    if (!phone || !password) {
        return res.status(400).json({
            message: "Phone and password are required"
        });
    }

    try {
        // CEK USER BERDASARKAN PHONE
        const [rows] = await db.promise().query("SELECT * FROM users WHERE phone = ?", [phone]);

        if (rows.length === 0) {
            return res.status(400).json({
                message: "User not found"
            });
        }

        const user = rows[0];

        // CEK PASSWORD
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({
                message: "Invalid password"
            });
        }

        // GENERATE JWT TOKEN
        const token = jwt.sign(
            { id: user.user_id, name: user.name, phone: user.phone },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({
            message: "Login successful",
            token: token,
            user: {
                id: user.user_id,
                name: user.name,
                phone: user.phone
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Database error",
            error: error.message
        });
    }
};