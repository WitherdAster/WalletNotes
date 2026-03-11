const db = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


exports.register = (req, res) => {

    const { name, phone, password } = req.body;

    // VALIDASI INPUT
    if (!name || !phone || !password) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    // CEK NOMOR SUDAH TERDAFTAR
    const checkUser = "SELECT * FROM users WHERE phone = ?";

    db.query(checkUser, [phone], async (err, result) => {

        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err
            });
        }

        if (result.length > 0) {
            return res.status(400).json({
                message: "Phone already registered"
            });
        }

        try {

            // HASH PASSWORD
            const hashedPassword = await bcrypt.hash(password, 10);

            // INSERT USER
            const insertUser = "INSERT INTO users (name, phone, password) VALUES (?, ?, ?)";

            db.query(insertUser, [name, phone, hashedPassword], (err, result) => {

                if (err) {
                    return res.status(500).json({
                        message: "Insert user failed",
                        error: err
                    });
                }

                res.json({
                    message: "User registered successfully"
                });

            });

        } catch (error) {

            res.status(500).json({
                message: "Password hashing failed",
                error: error
            });

        }

    });

};

exports.login = (req, res) => {

    const { phone, password } = req.body;

    // VALIDASI INPUT
    if (!phone || !password) {
        return res.status(400).json({
            message: "Phone and password are required"
        });
    }

    // CEK USER BERDASARKAN PHONE
    const query = "SELECT * FROM users WHERE phone = ?";

    db.query(query, [phone], async (err, result) => {

        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err
            });
        }

        if (result.length === 0) {
            return res.status(400).json({
                message: "User not found"
            });
        }

        const user = result[0];

        // CEK PASSWORD
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(400).json({
                message: "Wrong password"
            });
        }

        // BUAT TOKEN LOGIN
        // const token = jwt.sign(
        //     { id: user.id, phone: user.phone },
        //     SECRET_KEY,
        //     { expiresIn: "7d" }
        // );

        const token = jwt.sign(
            { id: user.user_id, phone: user.phone },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            message: "Login success",
            token: token,
            user: {
                id: user.id,
                name: user.name,
                phone: user.phone
            }
        });

    });

};
