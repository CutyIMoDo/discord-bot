const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');
const prefix = config.prefix;
const fs = require('fs');
const { memory } = require('console');
client.guildsetting = require("./guildsetting.json");

/**login */

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity(`${prefix}help \|`, { type: 'LISTENING' });
    console.log("Working on " + client.guilds.cache.size + " server");
    client.guilds.cache.forEach(guild => {
        init(guild);
    })
})

client.login(config.token);

/**join guild */

client.on("guildCreate", (guild) => {
    init(guild);
})

/**init */

function init(guild) {
    if (!client.guildsetting[guild.id]) client.guildsetting[guild.id] = {};
    if (!client.guildsetting[guild.id]["key"]) client.guildsetting[guild.id]["key"] = {};
    settingwrite(client.guildsetting);
}

/**key word */

client.on('message', (msg) => {
    if (msg.author.bot) return;
    if (!msg.guild) return;
    var command = msg.content.substring(prefix.length).split(/[ \n]/)[0].trim();
    var suffix = msg.content.substring(prefix.length + command.length).trim();
    switch (prefix + command) {
        case prefix + "setlogchannel":
            setlogchannel(msg);
            return;
        case prefix + "learn":
            learn(msg, suffix);
            return;
        case prefix + "delete":
            del(msg, suffix);
            return;
        case prefix + "setwelcomechannel":
            setwelcome(msg, suffix);
            return
        case prefix + "init":
            init(msg.guild);
            return;
        default:
            messagereply(msg);
            return;
    }
})

/**reply */

function messagereply(msg) {
    fs.readFile("./guildsetting.json", function (err, ms) {
        if (err) throw err;
        var msgdata = JSON.parse(ms)
        for (var k in msgdata[msg.guild.id].key) {
            if (!msgdata[msg.guild.id].key[k]) return;
            if (msg.content.split(/[ \n]/)[0].trim() === k.trim()) { msg.channel.send(msgdata[msg.guild.id].key[k]) }
        };
    })
}

/**set log channel */

function setlogchannel(msg) {
    client.guildsetting[msg.guild.id].logchannel = msg.channel.id
    settingwrite(client.guildsetting);
    msg.reply("success!");
}

/**set welcome channel */

function setwelcome(msg) {
    client.guildsetting[msg.guild.id].welcomechannel = msg.channel.id
    settingwrite(client.guildsetting);
    msg.reply("success!");
}

/**guildsetting write */

function settingwrite(guildsetting) {
    fs.writeFile("./guildsetting.json", JSON.stringify(guildsetting, null, 4), err => {
        if (err) throw err;
    });
}

/**learn */

function learn(msg, suffix) {
    key = suffix.split("\|\|")[0].trim();
    reply = suffix.substring(suffix.split("\|\|")[0].length + 2).trim();
    if (!key || !reply) {
        msg.reply("你要我學啥?蝦?你要我學啥??")
        return
    };
    if (!client.guildsetting[msg.guild.id]) client.guildsetting[msg.guild.id] = {};
    if (!client.guildsetting[msg.guild.id]["key"]) client.guildsetting[msg.guild.id]["key"] = {};
    client.guildsetting[msg.guild.id]["key"][key] = reply
    settingwrite(client.guildsetting);
    msg.reply("success");
}

/**del learn */

function del(msg, suffix) {
    if (!client.guildsetting[msg.guild.id]) client.guildsetting[msg.guild.id] = {};
    if (!client.guildsetting[msg.guild.id]["key"]) client.guildsetting[msg.guild.id]["key"] = {};
    delete client.guildsetting[msg.guild.id]["key"][suffix.trim()];
    settingwrite(client.guildsetting);
    msg.reply("success");
}

/**log del text */

client.on("messageDelete", async messageDelete => {
    if (messageDelete.author.bot) return;
    if (!messageDelete.guild) return;
    if (!client.guildsetting[messageDelete.guild.id].logchannel) return;
    var Attachment = (messageDelete.attachments).array();
    var index = 1;
    let embed = new Discord.MessageEmbed()
        .setColor('#FF0000')
        .setTitle("訊息管理")
        .setDescription(`訊息已刪除`)
        .addField('訊息發送者', `<@${messageDelete.author.id}>`, true)
        .addField('訊息頻道', `<#${messageDelete.channel.id}>`, true)
        .setTimestamp()
        .setFooter(client.user.username, `${client.user.avatarURL()}`);
    if (Boolean(messageDelete.content)) { embed.addField('刪除訊息內容', `${messageDelete.content}`) };
    await Attachment.forEach(function (attachment) {
        embed.addField(`刪除附件${index}`, `${attachment.proxyURL}`);
        index = index + 1;
    })
    client.channels.fetch(client.guildsetting[messageDelete.guild.id].logchannel)
        .then(cnl => cnl.send(embed))
        .catch(console.error);
})

//**log update text */

client.on('messageUpdate', (oldMessage, newMessage) => {
    if (oldMessage.content === newMessage.content) return;
    if (oldMessage.author.bot) return;
    if (!oldMessage.guild) return;
    if (!client.guildsetting[oldMessage.guild.id].logchannel) return;
    let embed = new Discord.MessageEmbed()
        .setColor('#00FF00')
        .setTitle("訊息管理")
        .setDescription(`訊息已編輯`)
        .addField('編輯者', `<@${newMessage.author.id}>`, true)
        .addField('訊息頻道', `<#${oldMessage.channel.id}>`, true)
        .addField('原訊息內容', `${oldMessage.content}`)
        .addField('新訊息內容', `${newMessage.content}`)
        .setTimestamp()
        .setFooter(client.user.username, `${client.user.avatarURL()}`);
    client.channels.fetch(client.guildsetting[oldMessage.guild.id].logchannel)
        .then(cnl => cnl.send(embed))
        .catch(console.error);
})

/**welcome message */

client.on("guildMemberAdd", (member) => {
    if (!client.guildsetting[member.guild.id].welcomechannel) return;
    let embed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle("有新朋友加入伺服器囉!")
        .setDescription(`歡迎<@!${member.user.id}>~切嚕✩`)
        .setTimestamp()
        .setFooter(client.user.username, `${client.user.avatarURL()}`);
    if (Boolean(member.user.avatarURL())) { embed.setThumbnail(member.user.avatarURL()) };
    client.channels.fetch(client.guildsetting[member.guild.id].welcomechannel)
        .then(cnl => cnl.send(embed))
        .catch(console.error);
})

/**leave message */

client.on("guildMemberRemove", (member) => {
    if (!client.guildsetting[member.guild.id].welcomechannel) return;
    let embed = new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle("再見了朋友")
        .setDescription(`<@!${member.user.id}>已經離開伺服器了`)
        .setTimestamp()
        .setFooter(client.user.username, `${client.user.avatarURL()}`);
    if (Boolean(member.user.avatarURL())) { embed.setThumbnail(member.user.avatarURL()) };
    client.channels.fetch(client.guildsetting[member.guild.id].welcomechannel)
        .then(cnl => cnl.send(embed))
        .catch(console.error);
})