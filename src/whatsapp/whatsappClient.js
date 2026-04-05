const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
} = require("@whiskeysockets/baileys");


const qrcode = require("qrcode-terminal");
const pino = require("pino");
const readline = require("readline");
const handleMessage = require("./messageHandler");

const usePairingCode = true;

const logger = pino({ level: "silent" });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) =>
  new Promise((resolve) => rl.question(query, (answer) => resolve(answer)));

async function startWhatsApp() {
  console.log("🚀 Starting WhatsApp Bot...");

    const { state, saveCreds } = await useMultiFileAuthState("auth");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        logger,
        printQRInTerminal: !usePairingCode,
        auth: state,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        version,
        syncFullHistory: true,
        generateHighQualityLinkPreview: true,
    });

    // Handle Pairing
    if (usePairingCode && !sock.authState.creds.registered) {
        try {
        const phoneNumber = await question("☘️ Masukan Nomor Yang Diawali Dengan 62 :\n")
        const code = await sock.requestPairingCode(phoneNumber.trim())
        console.log(`🎁 Pairing Code : ${code}`)
        } catch (err) {
        console.error("Failed to get pairing code:", err)
        }
    }

    sock.ev.on("creds.update", saveCreds)

    sock.ev.on("connection.update", (update) => {
        const { connection } = update
        if (connection === "close") {
        console.log("❌  Koneksi Terputus, Mencoba Menyambung Ulang")
        
        // Sambungkan Ulang
        startWhatsApp()
        
        } else if (connection === "open") {
        console.log("✔  Bot Berhasil Terhubung Ke WhatsApp")
        }
    })

    sock.ev.on("messages.upsert", async (msg) => {

        const message = msg.messages[0];

        if (!message.message) return;

        if (message.key.fromMe) return;

        let senderJid;

        if (message.key.participant) {
            senderJid = message.key.participant;
        } else {
            senderJid = message.key.remoteJid;
        }

        // const senderNumber = sender.getPhoneNumber();

        const text =
            message.message.conversation ||
            message.message.extendedTextMessage?.text;
        if (!text) return;

        console.log(`📩 ${senderJid} : ${text}`);


        handleMessage(sock, senderJid, text);

    });

}

module.exports = startWhatsApp;
