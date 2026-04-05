const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const handleMessage = require("./messageHandler");

const logger = pino({ level: "silent" });
let sock; // Top-level variable to store the socket

async function startWhatsApp() {
    console.log("🚀 Starting WhatsApp Bot...");
    const { state, saveCreds } = await useMultiFileAuthState("auth");
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
            startWhatsApp();
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

// Export both the starter and a way to get the current socket
module.exports = { startWhatsApp, getSocket: () => sock };