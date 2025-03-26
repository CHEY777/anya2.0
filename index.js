const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const Pino = require("pino");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info");

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: Pino({ level: "silent" })
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === "close") {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== 401;
            console.log("Connection closed due to", lastDisconnect.error, "Reconnecting:", shouldReconnect);
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === "open") {
            console.log("Bot connected successfully!");
        }
    });

    sock.ev.on("messages.upsert", async (m) => {
        try {
            const msg = m.messages[0];
            if (!msg.message) return;
            const sender = msg.key.remoteJid;
            const messageType = Object.keys(msg.message)[0];

            if (messageType === "conversation" || messageType === "extendedTextMessage") {
                const text = msg.message.conversation || msg.message.extendedTextMessage.text;
                console.log(`Received message: ${text}`);

                if (text.toLowerCase() === "ping") {
                    await sock.sendMessage(sender, { text: "Pong!" }, { quoted: msg });
                }
            }
        } catch (err) {
            console.error("Error handling message:", err);
        }
    });
}

startBot();
