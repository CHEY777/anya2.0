const fs = require("fs");
const chalk = require("chalk");
const QRCode = require('qrcode'); // QR code generation ke liye add kiya

// Bot Availability and Features
global.available = true;
global.autoReadGc = true;
global.autoReadAll = false;
global.antitags = true;

// Owner Information (Simplified)
global.Owner = ['918116781147'];
global.OwnerNumber = global.Owner; // Reference the same array
global.ownertag = global.Owner; // Reference the same array
global.OwnerName = "ᥴꫝꫀꪗ-𝙎𝙖𝙣💫🌙✨";

// Bot Branding
global.BotName = "Anya🩷";
global.packname = "Anya bot";
global.author = "By: chey🩷";
global.BotSourceCode = "https://github.com/Chey-san/Marin-Kitagawa-MD-Bot";
global.SupportGroupLink = "https://chat.whatsapp.com/EGHM5Nbert7JdO5pyxBN7s";
global.sessionName = "session";

// Command Prefix
global.prefa = ['-']; // Ensure this matches button IDs in Core.js

// Bot Settings
global.location = "West Bengal, India";
global.reactmoji = "🩷";
global.themeemoji = "💖";
global.vidmenu = { url: 'https://c.tenor.com/YGuLegQWubwAAAPo/miku-nakano-gotoubun-no-hanayome.mp4' };
global.websitex = "https://cheysan.cf/";
global.lolhuman = "KaysaS";

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

global.BotLogo = loadAsset("./Assets/pic1.jpg");
global.Thumb = loadAsset("./Assets/pic9.jpg");
global.Thumb1 = loadAsset("./Assets/pic5.jpg");
global.ErrorPic = loadAsset("./Assets/pic7.jpg");

// Anti-Link and Other Arrays
global.ntilinkytvid = [];
global.ntilinkytch = [];
global.ntilinkig = [];
global.ntilinkfb = [];
global.ntilinktg = [];
global.ntilinktt = [];
global.ntilinktwt = [];
global.ntilinkall = [];
global.nticall = [];
global.ntwame = [];
global.nttoxic = [];
global.ntnsfw = [];
global.ntvirtex = [];
global.rkyt = [];
global.wlcm = [];
global.gcrevoke = [];
global.autorep = [];
global.ntilink = [];

// Custom Messages
global.mess = {
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
global.limitawal = {
    premium: "Infinity",
    free: 100, // Updated to the second definition's value
    monayawal: 1000,
    rakyat: "Infinity"
};

global.rpg = {
    darahawal: 100,
    besiawal: 95,
    goldawal: 30,
    emeraldawal: 8,
    umpanawal: 10,
    potionawal: 5
};

// QR Code Generation Functions
global.generateQRCode = async (data) => {
    try {
        const qrCodeUrl = await QRCode.toDataURL(data); // QR code ko base64 URL mein convert karta hai
        return qrCodeUrl;
    } catch (error) {
        console.error(chalk.red('QR Code generation mein error:'), error);
        throw new Error('QR generation failed');
    }
};

// API Configuration (Use Environment Variables for Security)
global.APIs = {
    zenz: 'https://zenzapis.xyz',
};
global.APIKeys = {
    'https://zenzapis.xyz': process.env.ZENZ_API_KEY || '5d1197db351b', // Use env variable if available
};

// Flaming Text URLs
global.flaming = 'https://www6.flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=sketch-name&doScale=true&scaleWidth=800&scaleHeight=500&fontsize=100&text=';
global.fluming = 'https://www6.flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=fluffy-logo&doScale=true&scaleWidth=800&scaleHeight=500&fontsize=100&text=';
global.flarun = 'https://www6.flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=runner-logo&doScale=true&scaleWidth=800&scaleHeight=500&fontsize=100&text=';
global.flasmurf = 'https://www6.flamingtext.com/net-fu/proxy_form.cgi?&imageoutput=true&script=smurfs-logo&doScale=true&scaleWidth=800&scaleHeight=500&fontsize=100&text=';

// File Watcher for Hot Reloading
let file = require.resolve(__filename);
fs.watchFile(file, () => {
    fs.unwatchFile(file);
    console.log(chalk.redBright(`Update '${__filename}'`));
    delete require.cache[file];
    require(file);
});
