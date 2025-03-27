const fs = require("fs");
const chalk = require("chalk");
const QRCode = require('qrcode'); // QR code generation ke liye

// Configuration object
const config = {};

// Bot Availability and Features
config.available = true;
config.autoReadGc = true;
config.autoReadAll = false;
config.antitags = true;

// Owner Information (Simplified)
config.Owner = ['918116781147'];
config.OwnerNumber = config.Owner; // Reference the same array
config.ownertag = config.Owner; // Reference the same array
config.OwnerName = "ᥴꫝꫀꪗ-𝙎𝙖𝙣💫🌙✨";

// Bot Branding
config.BotName = "Anya🩷";
config.packname = "Anya bot";
config.author = "By: chey🩷";
config.BotSourceCode = "https://github.com/Pika4O4/Anya-pika";
config.SupportGroupLink = "https://chat.whatsapp.com/H6CUtq40oRDKIofIEbf1qEl";
config.sessionName = "session";

// Command Prefix
config.prefa = ['-']; // Ensure this matches button IDs in Core.js

// Bot Settings
config.location = "West Bengal, India";
config.reactmoji = "🩷";
config.themeemoji = "💖";
config.vidmenu = { url: 'https://c.tenor.com/YGuLegQWubwAAAPo/miku-nakano-gotoubun-no-hanayome.mp4' };
config.websitex = "https://cheysan.cf/";
config.lolhuman = "KaysaS";

// Load Assets with Error Handling
const loadAsset = (path) => {
    try {
        if (fs.existsSync(path)) {
            return fs.readFileSync(path);
        } else {
            console.error(chalk.red(`File not found: ${path}`));
            return null; // Return null if file doesn't exist
        }
    } catch (err) {
        console.error(chalk.red(`Error loading file ${path}:`), err);
        return null;
    }
};

config.BotLogo = loadAsset("./Assets/pic1.jpg");
config.Thumb = loadAsset("./Assets/pic9.jpg");
config.Thumb1 = loadAsset("./Assets/pic5.jpg");
config.ErrorPic = loadAsset("./Assets/pic7.jpg");

// Anti-Link and Other Arrays
config.ntilinkytvid = [];
config.ntilinkytch = [];
config.ntilinkig = [];
config.ntilinkfb = [];
config.ntilinktg = [];
config.ntilinktt = [];
config.ntilinktwt = [];
config.ntilinkall = [];
config.nticall = [];
config.ntwame = [];
config.nttoxic = [];
config.ntnsfw = [];
config.ntvirtex = [];
config.rkyt = [];
config.wlcm = [];
config.gcrevoke = [];
config.autorep = [];
config.ntilink = [];

// Custom Messages
config.mess = {
    jobdone: 'Kaam ho gya darling...',
    useradmin: 'Sorry, only *Group Admins* can use this command !...Jaa pehle admin banke aa',
    botadmin: 'Sorry, i cant execute this command without being an *Admin* of this group......To chal ab *Admin* bna 😏',
    botowner: 'Only my *Owner*ᥴꫝꫀꪗ-𝙎𝙖𝙣💫🌙✨ can use this command, and who are you...why you used this command!',
    grouponly: 'This command is only made for *Groups*, and what the hell are you doing here!',
    privateonly: 'This command is only made for *Private Chat*, chal khopche me aa!',
    botonly: 'Only the *Bot itself* can use this command!',
    waiting: '_Command processing_ 𝓐𝔂𝓷𝓪 𝓫𝔂 𝓒𝓱𝓮𝔂.....',
    nolink: 'Please provide me *link*, Asap!',
    error: 'Error....kuchh to garbar hai dyaa!',
    banned: 'You are *Banned* fron using commands 😠!',
    bangc: 'This Group is *Banned* from using Commands 😡!',
    nonsfw: 'Dont be a pervert....Bc pdhai - likhai karo, IAS YAS bano par nhi tumhe to *nudity* dekhni hai 😒!'
};

// Merged Limits and RPG Settings
config.limitawal = {
    premium: "Infinity",
    free: 100,
    monayawal: 1000,
    rakyat: "Infinity"
};

config.rpg = {
    darahawal: 100,
    besiawal: 95,
    goldawal: 30,
    emeraldawal: 8,
    umpanawal: 10,
    potionawal: 5
};

// QR Code Generation Functions
config.generateQRCode = async (data) => {
    try {
        const qrCodeUrl = await QRCode.toDataURL(data); // QR code ko base64 URL mein convert karta hai
        console.log(chalk.cyan('QR Code Generated! Scan this QR to connect:'));
        console.log(qrCodeUrl);
        return qrCodeUrl;
    } catch (error) {
        console.error(chalk.red('QR Code generation mein error:'), error);
        throw new Error('QR generation failed');
    }
};

// API Configuration (Use Environment Variables for Security)
config.APIs = {
    zenz: 'https://zenzapis.xyz',
};
config.APIKeys = {
    'https://zenzapis.xyz': process.env.ZENZ_API_KEY || '5d1197db351b', // Use env variable if available
};

// Flaming Text URLs
config.flaming = 'https://www6.flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=sketch-name&doScale=true&scaleWidth=800&scaleHeight=500&fontsize=100&text=';
config.fluming = 'https://www6.flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=fluffy-logo&doScale=true&scaleWidth=800&scaleHeight=500&fontsize=100&text=';
config.flarun = 'https://www6.flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=runner-logo&doScale=true&scaleWidth=800&scaleHeight=500&fontsize=100&text=';
config.flasmurf = 'https://www6.flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=smurfs-logo&doScale=true&scaleWidth=800&scaleHeight=500&fontsize=100&text=';

// File Watcher for Hot Reloading
let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.redBright(`Update '${__filename}'`));
    delete require.cache[file];
    require(file);
});

// Export the config object
module.exports = config;
