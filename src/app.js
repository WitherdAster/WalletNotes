require('dotenv').config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const expenseRoutes = require("./routes/expenseRoutes");

// Update this import
const { startWhatsApp, getSocket } = require("./whatsapp/whatsappClient");

const app = express();
const PORT = process.env.PORT || 3000; // Use PORT env

app.use(cors());
app.use(express.json());

// Routes
app.use("/api", authRoutes);
app.use("/api", expenseRoutes);

// --- NEW WHATSAPP ADMIN ROUTES ---
let pairingCode = null;

app.post("/api/whatsapp/connect", async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        const sock = getSocket();

        if (!sock) return res.status(500).json({ status: "error", message: "Socket not ready" });

        // Request pairing code from Baileys
        pairingCode = await sock.requestPairingCode(phoneNumber.trim());
        
        res.json({ status: "success", message: "Pairing code requested" });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

app.get("/api/whatsapp/pairing-code", (req, res) => {
    if (pairingCode) {
        res.json({ status: "success", pairingCode: pairingCode });
    } else {
        res.status(404).json({ status: "error", message: "Code not generated yet" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // 🔥 Start WhatsApp AFTER the server is already listening
    startWhatsApp().catch(err => {        console.error("WhatsApp Error during startup:", err);
    });
});