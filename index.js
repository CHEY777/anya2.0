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

// Safety check: Ensure sessionName is defined
if (!sessionName) {
    console.error(color('Error: sessionName is not defined in config.js. Please define it.', 'red'));
    process.exit(1);
}

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

    // Fetch the latest Baileys version
    let { version, isLatest } = await fetchLatestBaileysVersion().catch(err => {
        console.error(color('Error fetching Baileys version:', 'red'), err);
        return { version: [2, 2410, 1], isLatest: false }; // Fallback version
    });

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
ㅤ     ㅤ🤏🏻 *𝗟 𝗘 𝗙 𝗧* 🐤
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

    // Message Sending Functions
    Miku.send5ButImg = async (jid, text = '', footer = '', img, but = [], thumb = null, options = {}) => {
        let mediaOptions = { image: img };
        if (thumb) mediaOptions.jpegThumbnail = thumb;
        let message = await prepareWAMessageMedia(mediaOptions, { upload: Miku.waUploadToServer });
        var template = generateWAMessageFromContent(jid, proto.Message.fromObject({
            templateMessage: {
                hydratedTemplate: {
                    imageMessage: message.imageMessage,
                    "hydratedContentText": text,
                    "hydratedFooterText": footer,
                    "hydratedButtons": but
                }
            }
        }), options);
        Miku.relayMessage(jid, template.message, { messageId: template.key.id });
    };

    Miku.sendButtonText = (jid, buttons = [], text, footer, quoted = '', options = {}) => {
        let buttonMessage = {
            text,
            footer,
            buttons,
            headerType: 2,
            ...options
        };
        Miku.sendMessage(jid, buttonMessage, { quoted, ...options });
    };

    Miku.sendText = (jid, text, quoted = '', options) => Miku.sendMessage(jid, { text: text, ...options }, { quoted });

    Miku.sendImage = async (jid, path, caption = '', quoted = '', options) => {
        let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        return await Miku.sendMessage(jid, { image: buffer, caption: caption, ...options }, { quoted });
    };

    Miku.sendVideo = async (jid, path, caption = '', quoted = '', gif = false, options) => {
        let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        return await Miku.sendMessage(jid, { video: buffer, caption: caption, gifPlayback: gif, ...options }, { quoted });
    };

    Miku.sendAudio = async (jid, path, quoted = '', ptt = false, options) => {
        let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        return await Miku.sendMessage(jid, { audio: buffer, ptt: ptt, ...options }, { quoted });
    };

    Miku.sendTextWithMentions = async (jid, text, quoted, options = {}) => Miku.sendMessage(jid, { text: text, contextInfo: { mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net') }, ...options }, { quoted });

    Miku.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        let buffer;
        if (options && (options.packname || options.author)) {
            buffer = await writeExifImg(buff, options);
        } else {
            buffer = await imageToWebp(buff);
        }
        await Miku.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
        return buffer;
    };

    Miku.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0);
        let buffer;
        if (options && (options.packname || options.author)) {
            buffer = await writeExifVid(buff, options);
        } else {
            buffer = await videoToWebp(buff);
        }
        await Miku.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted });
        return buffer;
    };

    Miku.sendMedia = async (jid, path, fileName = '', caption = '', quoted = '', options = {}) => {
        let types = await Miku.getFile(path, true);
        let { mime, ext, res, data, filename } = types;
        if (res && res.status !== 200 || file.length <= 65536) {
            try { throw { json: JSON.parse(file.toString()) } }
            catch (e) { if (e.json) throw e.json }
        }
        let type = '', mimetype = mime, pathFile = filename;
        if (options.asDocument) type = 'document';
        if (options.asSticker || /webp/.test(mime)) {
            let { writeExif } = require('./lib/exif');
            let media = { mimetype: mime, data };
            pathFile = await writeExif(media, { packname: options.packname ? options.packname : global.packname, author: options.author ? options.author : global.author, categories: options.categories ? options.categories : [] });
            await fs.promises.unlink(filename);
            type = 'sticker';
            mimetype = 'image/webp';
        } else if (/image/.test(mime)) type = 'image';
        else if (/video/.test(mime)) type = 'video';
        else if (/audio/.test(mime)) type = 'audio';
        else type = 'document';
        await Miku.sendMessage(jid, { [type]: { url: pathFile }, caption, mimetype, fileName, ...options }, { quoted, ...options });
        return fs.promises.unlink(pathFile);
    };

    Miku.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
        let quoted = message.msg ? message.msg : message;
        let mime = (message.msg || message).mimetype || '';
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
        const stream = await downloadContentFromMessage(quoted, messageType);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        let type = await FileType.fromBuffer(buffer);
        let trueFileName = attachExtension ? (filename + '.' + type.ext) : filename;
        await fs.writeFileSync(trueFileName, buffer);
        return trueFileName;
    };

    Miku.downloadMediaMessage = async (message) => {
        let mime = (message.msg || message).mimetype || '';
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0];
        const stream = await downloadContentFromMessage(message, messageType);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        return buffer;
    };

    Miku.copyNForward = async (jid, message, forceForward = false, options = {}) => {
        let vtype;
        if (options.readViewOnce) {
            message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined);
            vtype = Object.keys(message.message.viewOnceMessage.message)[0];
            delete (message.message && message.message.ignore ? message.message.ignore : (message.message || undefined));
            delete message.message.viewOnceMessage.message[vtype].viewOnce;
            message.message = { ...message.message.viewOnceMessage.message };
        }
        let mtype = Object.keys(message.message)[0];
        let content = await generateForwardMessageContent(message, forceForward);
        let ctype = Object.keys(content)[0];
        let context = {};
        if (mtype != "conversation") context = message.message[mtype].contextInfo;
        content[ctype].contextInfo = { ...context, ...content[ctype].contextInfo };
        const waMessage = await generateWAMessageFromContent(jid, content, options ? { ...content[ctype], ...options, ...(options.contextInfo ? { contextInfo: { ...content[ctype].contextInfo, ...options.contextInfo } } : {}) } : {});
        await Miku.relayMessage(jid, waMessage.message, { messageId: waMessage.key.id });
        return waMessage;
    };

    Miku.sendListMsg = (jid, text = '', footer = '', title = '', butText = '', sects = [], quoted) => {
        let sections = sects;
        var listMes = {
            text: text,
            footer: footer,
            title: title,
            buttonText: butText,
            sections
        };
        Miku.sendMessage(jid, listMes, { quoted: quoted });
    };

    Miku.cMod = (jid, copy, text = '', sender = Miku.user.id, options = {}) => {
        let mtype = Object.keys(copy.message)[0];
        let isEphemeral = mtype === 'ephemeralMessage';
        if (isEphemeral) {
            mtype = Object.keys(copy.message.ephemeralMessage.message)[0];
        }
        let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message;
        let content = msg[mtype];
        if (typeof content === 'string') msg[mtype] = text || content;
        else if (content.caption) content.caption = text || content.caption;
        else if (content.text) content.text = text || content.text;
        if (typeof content !== 'string') msg[mtype] = { ...content, ...options };
        if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant;
        else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant;
        if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid;
        else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid;
        copy.key.remoteJid = jid;
        copy.key.fromMe = sender === Miku.user.id;
        return proto.WebMessageInfo.fromObject(copy);
    };

    Miku.getFile = async (PATH, save) => {
        let res;
        let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0);
        let type = await FileType.fromBuffer(data) || { mime: 'application/octet-stream', ext: '.bin' };
        filename = path.join(__filename, '../src/' + new Date * 1 + '.' + type.ext);
        if (data && save) fs.promises.writeFile(filename, data);
        return { res, filename, size: await getSizeMedia(data), ...type, data };
    };

    Miku.send5ButGif = async (jid, text = '', footer = '', gif, but = [], options = {}) => {
        let message = await prepareWAMessageMedia({ video: gif, gifPlayback: true }, { upload: Miku.waUploadToServer });
        var template = generateWAMessageFromContent(jid, proto.Message.fromObject({
            templateMessage: {
                hydratedTemplate: {
                    videoMessage: message.videoMessage,
                    "hydratedContentText": text,
                    "hydratedFooterText": footer,
                    "hydratedButtons": but
                }
            }
        }), options);
        Miku.relayMessage(jid, template.message, { messageId: template.key.id });
    };

    Miku.send5ButVid = async (jid, text = '', footer = '', vid, but = [], options = {}) => {
        let message = await prepareWAMessageMedia({ video: vid }, { upload: Miku.waUploadToServer });
        var template = generateWAMessageFromContent(jid, proto.Message.fromObject({
            templateMessage: {
                hydratedTemplate: {
                    videoMessage: message.videoMessage,
                    "hydratedContentText": text,
                    "hydratedFooterText": footer,
                    "hydratedButtons": but
                }
            }
        }), options);
        Miku.relayMessage(jid, template.message, { messageId: template.key.id });
    };

    Miku.send5ButMsg = (jid, text = '', footer = '', but = []) => {
        let templateButtons = but;
        var templateMessage = {
            text: text,
            footer: footer,
            templateButtons: templateButtons
        };
        Miku.sendMessage(jid, templateMessage);
    };

    Miku.sendFile = async (jid, PATH, fileName, quoted = {}, options = {}) => {
        let types = await Miku.getFile(PATH, true);
        let { filename, size, ext, mime, data } = types;
        let type = '', mimetype = mime, pathFile = filename;
        if (options.asDocument) type = 'document';
        if (options.asSticker || /webp/.test(mime)) {
            let { writeExif } = require('./lib/exif');
            let media = { mimetype: mime, data };
            pathFile = await writeExif(media, { packname: global.packname, author: global.packname, categories: options.categories ? options.categories : [] });
            await fs.promises.unlink(filename);
            type = 'sticker';
            mimetype = 'image/webp';
        } else if (/image/.test(mime)) type = 'image';
        else if (/video/.test(mime)) type = 'video';
        else if (/audio/.test(mime)) type = 'audio';
        else type = 'document';
        await Miku.sendMessage(jid, { [type]: { url: pathFile }, mimetype, fileName, ...options }, { quoted, ...options });
        return fs.promises.unlink(pathFile);
    };

    Miku.parseMention = async (text) => {
        return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net');
    };

    return Miku;
}

startMiku().catch(err => {
    console.error(color('Error starting bot:', 'red'), err);
    process.exit(1);
});

let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.redBright(`${__filename} Updated`));
    delete require.cache[file];
    require(file);
});
