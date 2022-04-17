const { token } = require(`./config.json`);
const userData = require(`./UserList.json`);
const charData = require(`./CharList.json`);
const { Client } = require(`discord.js`);
const fs = require(`fs`);
const client = new Client({
    intents: [`GUILDS`, `GUILD_MESSAGES`, `DIRECT_MESSAGES`],
    partials: [`CHANNEL`]
});
const defaultThreshold = 2000;
const maxUserThreshold = 4000;
const saveThreshold = 5000;
const rollCommands = [`ha`, `hg`, `hx`, `mx`, `ma`, `mk`,`wa`, `wg`, `wx`,];
let userList = userData;
let charList = charData;

client.once(`ready`, () => {
    console.log(`Ready!`);
    updatePlayerThresholds();
    updateCharacterList();
});

client.login(token);

client.on(`messageCreate`, msg => {
    if (msg.author.id === `956334957855387678`) return; //bot ID
    if (msg.author.id === `432610292342587392`) { //Mudae ID
        if (msg.embeds) {
            let name;
            let index;
            let rank;
            let timeStamp = Date.now();
            if (msg.embeds[0].description.includes(`Claim Rank`)) {
                name = msg.embeds[0].author.name;
                index = msg.embeds[0].description.indexOf(`Claim Rank`) + 13; //Claim Rank: # = 13
                rank = msg.embeds[0].description.slice(index);
                index = rank.indexOf(`\n`);
                rank = rank.slice(0, index);
                let charInList = false;
                let temp = charList
                charList.Characters.forEach((character, index) => {
                    if (character.name === name) {
                        if (charInList) {
                            temp.Characters[index].splice(index, 1) //removes duplicate entries
                        }
                        charInList = true;
                        if (rank > saveThreshold) {
                            temp.Characters[index].splice(index, 1) //remove character if out of savethreshold range
                        }
                        else {
                            temp.Characters[index].rank = rank;
                            temp.Characters[index].timeStamp = timeStamp;
                        }
                    }
                });
                if (!charInList && rank <= saveThreshold) {
                    temp.Characters.push({
                        name: name,
                        rank: rank,
                        timeStamp: timeStamp
                    });
                }
                // if (temp.Characters.length > saveThreshold) {
                //     temp.Characters.splice(5000, (temp.Characters.length - saveThreshold)); //Keep list to saveThreshold length at most it should only be removing one entry but still generalized it incase saveThreshold gets lowered and it needs to remove a lot
                // }
                fs.writeFileSync(`./CharList.json`, JSON.stringify(temp, null, 4));
            }
            if (rollCommands.includes(msg.interaction?.commandName)) {
                if (msg.embeds[0].footer.text.includes("Belongs to")) return; //character already owned
                name = msg.embeds[0].author.name;
                userList.Users.forEach(user => {
                    if (user.id === msg.interaction.user.id) {
                        charList.Characters.forEach(character => {
                            if (character.name === name) {
                                if (character.rank <= user.threshold) {
                                    let newDate = new Date(character.timeStamp)
                                    client.users.send(user.id, `${name}\nRank: ${character.rank}\nLast Updated: ${newDate.getMonth() + 1}/${newDate.getDate()}/${newDate.getFullYear()}`);
                               }
                            }   
                        });
                    }
                });  
            }
        }
    }
    if (msg.channel.type === `DM`) {
        userList = JSON.parse(fs.readFileSync('./UserList.json'));
        let str = msg.content;
        let userIndex
        let userInList = false;
        userList.Users.forEach((user, index) => {
            if (user.id === msg.author.id) {
                userInList = true;
                userIndex = index;
            }
        });
        if (str.toLowerCase().startsWith(`join`)) {
            if (userInList) {
                msg.channel.send(`You have already joined.\nYour threshold is ${userList.Users[userIndex].threshold}.\nTo change it, reply "Threshold #".`);
            }
            else {
                msg.channel.send(`You have joined the bot! It will message you when you roll someone whose claim rank is lower than your set threshold!\nBy default your threshold is set to ${defaultThreshold}. The highest threshold you can set is ${maxUserThreshold}.\nTo change it, reply "Threshold #".`);
                userList.Users.push({
                    id: msg.author.id,
                    threshold: defaultThreshold
                });
                fs.writeFileSync('./UserList.json', JSON.stringify(userList, null, 4));
            }
        }
        if (str.toLowerCase().startsWith(`threshold`)) {
            if (userInList) {
                let content = str.split(` `)
                if (content[1]) {
                    let newThreshold = parseInt(content[1]);
                    if (isNaN(newThreshold)) {
                        msg.react(`❌`);
                    }
                    else {
                        if (newThreshold > maxUserThreshold) {
                            msg.channel.send(`The max threshold is ${maxUserThreshold}.`);
                            newThreshold = maxUserThreshold;
                        }
                        msg.channel.send(`Your new threshold is now ${newThreshold}.`);
                        userList.Users[userIndex].threshold = newThreshold;
                        fs.writeFileSync('./UserList.json', JSON.stringify(userList, null, 4));
                    }
                }
            }
            else {
                msg.channel.send(`You have not joined the bot yet! Reply "Join" to start!`);
            }
        }
        if (str.toLowerCase().startsWith(`leave`)) {
            if (userInList) {
                userList.Users.splice(userIndex, 1);
                fs.writeFileSync('./UserList.json', JSON.stringify(userList, null, 4));
            }
            else {
                msg.channel.send(`You already aren't in the bot!`);
            }
        }
    }
});
client.on(`messageUpdate`, (oldMsg, newMsg) => {
    if (oldMsg.author.id !== `432610292342587392`) return; //Mudae ID
    if (oldMsg.embeds && newMsg.embeds) {
        if (!oldMsg.embeds[0].description.includes(`Claim Rank`)) return; //if no claim rank, no logging gonna happen
        if (oldMsg.embeds[0].author.name === newMsg.embeds[0].author.name) return; //same character, probably just going through images
        let name;
        let index;
        let rank;
        let timeStamp = Date.now();
        name = newMsg.embeds[0].author.name;
        index = newMsg.embeds[0].description.indexOf(`Claim Rank`) + 13; //Claim Rank: # = 13
        rank = newMsg.embeds[0].description.slice(index);
        index = rank.indexOf(`\n`);
        rank = rank.slice(0, index);
        let charInList = false;
        let temp = charList
        charList.Characters.forEach((character, index) => {
            if (character.name === name) {
                if (charInList) {
                    temp.Characters[index].splice(index, 1) //removes duplicate entries
                }
                charInList = true;
                if (rank > saveThreshold) {
                    temp.Characters[index].splice(index, 1) //remove character if out of savethreshold range
                }
                else {
                    temp.Characters[index].rank = rank;
                    temp.Characters[index].timeStamp = timeStamp;
                }
            }
        });
        if (!charInList && rank <= saveThreshold) {
            temp.Characters.push({
                name: name,
                rank: rank,
                timeStamp: timeStamp
            });
        }
        // if (temp.Characters.length > saveThreshold) {
        //     temp.Characters.splice(savethreshold, (temp.Characters.length - saveThreshold)); //Keep list to saveThreshold length at most it should only be removing one entry but still generalized it incase saveThreshold gets lowered and it needs to remove a lot
        // }
        fs.writeFileSync(`./CharList.json`, JSON.stringify(temp, null, 4));
    }
});
/**Updates Player Thresholds if maxThreshold is made smaller*/
function updatePlayerThresholds() {
for (let user of userList.Users) {
    if (user.threshold > maxUserThreshold) {
        user.threshold = maxUserThreshold;
        client.users.send(user.id, `Your threshold was higher than the maximum threshold and has been adjusted to ${maxUserThreshold}. This is most likely because the maximum threshold was lowered recently.`);
    }
}
fs.writeFileSync('./UserList.json', JSON.stringify(userList, null, 4));
}
/**Prunes the Character List in case the save threshold is made smaller*/
function updateCharacterList() {
    let charsToRemove = [];
    let temp = charList;
    charList.Characters.forEach(character => {
        if (character.rank > saveThreshold) {
            charsToRemove.push(character.name);
        }
    });
    if (charsToRemove.length === 0) return;
    charsToRemove.forEach(removal => {
        charList = temp;
        charList.Characters.forEach((character, index) => {
            if (removal === character.name) {
                temp.Characters.splice(index, 1);
            }
        });
    });
    fs.writeFileSync(`./CharList.json`, JSON.stringify(temp, null, 4));
}
