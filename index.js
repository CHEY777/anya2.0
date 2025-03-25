require("./config.js");
const {
    default: MikuConnect,
    useSingleFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    generateWAMessageFromContent,
    generateMessageID,
    downloadContentFromMessage,
    makeInMemoryStore,
    jidDecode,
    proto
} = require("@WhiskeySockets/Baileys");
const { state, saveState } = useSingleFileAuthState(`./${sessionName}.json`);
const pino = require('pino');
const fs = require('fs');
const chalk = require('chalk');
const FileType = require('file-type');
const path = require('path');
const CFonts = require('cfonts');
const { exec, spawn, execSync } = require("child_process");
const moment = require('moment-timezone');
const PhoneNumber = require('awesome-phonenumber');
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif');
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, sleep } = require('./lib/myfunc');
const figlet = require('figlet');
const { color } = require('./lib/color');
const qrcode = require('qrcode-terminal'); // For QR code display

const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });

async function startMiku() {
    console.log(color(figlet.textSync('Anya Bot MD', {
        font: 'Pagga',
        horizontalLayout: 'default',
        verticalLayout: 'default',
        width: 80,
        whitespaceBreak: true
    }), 'pink'));

    console.log(color('\nHello, I am Chey, the main developer of this bot.\n\nThanks for using: Anya Bot', 'aqua'));
    console.log(color('\nYou can follow me on GitHub: Chey-san', 'aqua'));

    let { version, isLatest } = await fetchLatestBaileysVersion();
    const Miku = MikuConnect({
        logger: pino({ level: 'silent' }), // Change to 'debug' for detailed logs if needed
        printQRInTerminal: false, // We'll handle QR manually
        browser: ['Anya by: Chey', 'Safari', '1.0.0'],
        auth: state,
        version
    });

    store.bind(Miku.ev);

    // QR Code and Connection Handling
    Miku.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log(color('QR Code Generated! Scan it with WhatsApp:', 'yellow'));
            qrcode.generate(qr, { small: true });
            console.log(color('If deploying, copy this QR from logs or use a session file.', 'yellow'));
        }

        if (connection === 'open') {
            console.log(color('Bot Connected Successfully!', 'green'));
        }

        if (connection === 'close') {
            let reason = lastDisconnect?.error?.output?.statusCode || 0;
            console.log(color(`Disconnected: ${reason}`, 'red'));
            if (reason === DisconnectReason.badSession) {
                console.log(color('Bad Session File, Deleting and Restarting...', 'red'));
                if (fs.existsSync(`./${sessionName}.json`)) fs.unlinkSync(`./${sessionName}.json`);
                startMiku();
            } else if (reason === DisconnectReason.connectionClosed) {
                console.log(color('Connection Closed, Reconnecting...', 'yellow'));
                startMiku();
            } else if (reason === DisconnectReason.connectionLost) {
                console.log(color('Connection Lost, Reconnecting...', 'yellow'));
                startMiku();
            } else if (reason === DisconnectReason.connectionReplaced) {
                console.log(color('Connection Replaced, Exiting...', 'red'));
                process.exit(1);
            } else if (reason === DisconnectReason.loggedOut) {
                console.log(color('Logged Out, Deleting Session and Restarting...', 'red'));
                if (fs.existsSync(`./${sessionName}.json`)) fs.unlinkSync(`./${sessionName}.json`);
                startMiku();
            } else if (reason === DisconnectReason.restartRequired) {
                console.log(color('Restart Required, Restarting...', 'yellow'));
                startMiku();
            } else if (reason === DisconnectReason.timedOut) {
                console.log(color('Connection Timed Out, Reconnecting...', 'yellow'));
                startMiku();
            } else {
                console.log(color(`Unknown Disconnect Reason: ${reason}`, 'red'));
                startMiku();
            }
        }
    });

    Miku.ev.on('creds.update', saveState);

    // Message Handling
    Miku.ev.on('messages.upsert', async chatUpdate => {
        try {
            let mek = chatUpdate.messages[0];
            if (!mek.message) return;
            mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message;
            if (mek.key && mek.key.remoteJid === 'status@broadcast') return;
            if (!Miku.public && !mek.key.fromMe && chatUpdate.type === 'notify') return;
            if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return;
            let m = smsg(Miku, mek, store);
            require("./Core")(Miku, m, chatUpdate, store);
        } catch (err) {
            console.log(color('Error in messages.upsert:', 'red'), err);
        }
    });

    // Group Update Handling
    Miku.ev.on('groups.update', async pea => {
        try {
            let ppgc = await Miku.profilePictureUrl(pea[0].id, 'image').catch(() => 'https://wallpapercave.com/wp/wp10524580.jpg');
            let wm_fatih = { url: ppgc };
            if (pea[0].announce == true) {
                Miku.sendMessage(pea[0].id, { image: wm_fatih, caption: 'Group has been *Closed!* Only *Admins* can send Messages!' });
            } else if (pea[0].announce == false) {
                Miku.sendMessage(pea[0].id, { image: wm_fatih, caption: 'Group has been *Opened!* Now *Everyone* can send Messages!' });
            } else if (pea[0].restrict == true) {
                Miku.sendMessage(pea[0].id, { image: wm_fatih, caption: 'Group Info modification has been *Restricted*, Now only *Admins* can edit Group Info!' });
            } else if (pea[0].restrict == false) {
                Miku.sendMessage(pea[0].id, { image: wm_fatih, caption: 'Group Info modification has been *Un-Restricted*, Now only *Everyone* can edit Group Info!' });
            } else {
                Miku.sendMessage(pea[0].id, { image: wm_fatih, caption: `Group Subject has been changed To:\n\n*${pea[0].subject}*` });
            }
        } catch (err) {
            console.log(color('Error in groups.update:', 'red'), err);
        }
    });

    // Group Participants Update
    Miku.ev.on('group-participants.update', async (anu) => {
        try {
            let metadata = await Miku.groupMetadata(anu.id);
            let participants = anu.participants;
            for (let num of participants) {
                let ppuser = await Miku.profilePictureUrl(num, 'image').catch(() => 'https://wallpapercave.com/wp/wp10753770.jpg');
                let ppgroup = await Miku.profilePictureUrl(anu.id, 'image').catch(() => 'https://telegra.ph/file/4cc2712eee93c105f6739.jpg');
                let targetname = await Miku.getName(num);

                if (anu.action == 'add') {
                    let mikutext = `
ㅤㅤ🐦 *𝗪 𝗘 𝗟 𝗖 𝗢 𝗠 𝗘* ✋🏻
╭╼━━━᚜𝓤𝓼𝓮𝓻 𝓪𝓭𝓭𝓮𝓭 ᚛━━━╾╮
╽
❤️ *Member name* : @${num.split("@")[0]}
╰╼━━━━━━━━━━━━━╾╯
╭╼━━᚜𝓖𝓻𝓸𝓾𝓹 𝓷𝓪𝓶𝓮 ᚛━━╾╮
╽
🥵 *Group name* : ${metadata.subject}
╰╼━━━━━━━━━━━━━╾╯
╭╼━━᚜ 𝓖𝓻𝓸𝓾𝓹 𝓭𝓮𝓼𝓬. ᚛━━╾╮
╽
🎃 *Group description* : ${metadata.desc || 'No description'}
╰╼━━━━━━━━━━━━━╾╯
Type *-help* to use this Bot 😚.
`;
                    Miku.sendMessage(anu.id, {
                        image: await getBuffer(ppgroup),
                        mentions: [num],
                        caption: mikutext
                    });
                } else if (anu.action == 'remove') {
                    let mikutext = `
ㅤ     ㅤ🤏🏻 *�_L 𝗘 𝗙 𝗧* 🐤
╭╼━━━᚜ 𝓤𝓼𝓮𝓻 𝓵𝓮𝓯𝓽  ᚛━━━╾╮
╽
🖤 *Member name* : @${num.split("@")[0]}
╰╼━━━━━━━━━━━━━╾╯
╭╼━━᚜𝓖𝓻𝓸𝓾𝓹 𝓷𝓪𝓶𝓮 ᚛━━╾╮
╽
🔥 *Group name* : ${metadata.subject}
╰╼━━━━━━━━━━━━━╾╯
❣️ *That was a nice time!*
*when we were together but now get lost, we will not gonna miss you though*.
`;
                    Miku.sendMessage(anu.id, {
                        image: await getBuffer(ppuser),
                        mentions: [num],
                        caption: mikutext
                    });
                }
            }
        } catch (err) {
            console.log(color('Error in group-participants.update:', 'red'), err);
        }
    });

    // Utility Functions
    Miku.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return decode.user && decode.server ? decode.user + '@' + decode.server : jid;
        }
        return jid;
    };

    Miku.getName = (jid, withoutContact = false) => {
        let id = Miku.decodeJid(jid);
        withoutContact = Miku.withoutContact || withoutContact;
        let v = id === '0@s.whatsapp.net' ? { id, name: 'WhatsApp' } : id === Miku.decodeJid(Miku.user.id) ? Miku.user : (store.contacts[id] || {});
        return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international');
    };

    Miku.sendContact = async (jid, kon, quoted = '', opts = {}) => {
        let list = kon.map(i => ({
            displayName: await Miku.getName(i + '@s.whatsapp.net'),
            vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await Miku.getName(i + '@s.whatsapp.net')}\nFN:${global.OwnerName}\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Click here to chat\nEND:VCARD`
        }));
        Miku.sendMessage(jid, { contacts: { displayName: `${list.length} Contact`, contacts: list }, ...opts }, { quoted });
    };

    Miku.public = true;
    Miku.serializeM = (m) => smsg(Miku, m, store);

    // Call Blocking
    Miku.ws.on('CB:call', async (json) => {
        const callerId = json.content[0].attrs['call-creator'];
        if (json.content[0].tag == 'offer') {
            let pa7rick = await Miku.sendContact(callerId, global.owner);
            Miku.sendMessage(callerId, { text: `Baka! You will be blocked automatically for calling me!` }, { quoted: pa7rick });
            await sleep(8000);
            await Miku.updateBlockStatus(callerId, "block");
        }
    });

    // Message Sending Functions (unchanged for brevity)
    Miku.sendText = (jid, text, quoted = '', options) => Miku.sendMessage(jid, { text: text, ...options }, { quoted });
    Miku.sendImage = async (jid, path, caption = '', quoted = '', options) => {
        let buffer = Buffer.isBuffer(path) ? path : /^https?:\/\//.test(path) ? await getBuffer(path) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        return await Miku.sendMessage(jid, { image: buffer, caption: caption, ...options }, { quoted });
    };

    return Miku;
}

startMiku();

let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.redBright(`${__filename} Updated`));
    delete require.cache[file];
    require(file);
});
