const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");
const path = require('path');const pino = require("pino");
const handleMessage = require("./messageHandler");

const logger = pino({ level: "silent" });
let sock;

async function startWhatsApp() {
    console.log("🚀 Starting WhatsApp Bot...");
    
    // 🔥 Changed "auth" to "whatsapp_session_data" and made it an absolute path
    const sessionDir = path.join(__dirname, '../../whatsapp_session_data');
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
    
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        logger,
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        version,
        syncFullHistory: true,
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
        const { connection } = update;
        if (connection === "close") {
            console.log("❌ Koneksi Terputus, Mencoba Menyambung Ulang");
            setTimeout(startWhatsApp, 5000); // Wait 5s before reconnecting
        } else if (connection === "open") {
            console.log("✔ Bot Berhasil Terhubung Ke WhatsApp");
        }
    });

    sock.ev.on("messages.upsert", async (msg) => {
        const message = msg.messages[0];
        if (!message.message || message.key.fromMe) return;
        const senderJid = message.key.participant || message.key.remoteJid;
        const text = message.message.conversation || message.message.extendedTextMessage?.text;
        if (text) handleMessage(sock, senderJid, text);
    });

    return sock;
}

module.exports = { startWhatsApp, getSocket: () => sock };