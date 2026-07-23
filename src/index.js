import { Client, Constants } from "@projectdysnomia/dysnomia";
import { actions, commands, loadCommands } from "./helpers/commands.js";
import { listen } from "./server/main.js";
import { loadEnvFile } from 'node:process';

try {
    loadEnvFile();
} catch(e) { console.error("Error loading env file. If everything boots like normal you can probably ignore this") }
["TOKEN","GH_CLIENT_ID","GH_CLIENT_SECRET","GH_PAT","GH_ORG_NAME"].forEach(v => {
    if (!process.env[v]) throw new Error(`Missing required ENV variable "${v}"`);
});

const register = await loadCommands();

listen();

const client = new Client(`Bot ${process.env.TOKEN}`, {
    allowedMentions: {
        repliedUser: true,
        everyone: false,
        roles: false,
        users: false,
    },
    gateway: {
        intents: [
            Constants.Intents.guilds,
            Constants.Intents.guildMessages,
        ],
    }
});


client.on('ready', async () => {
    console.log(`Logged in as ${client.user.username}#${client.user.discriminator}`);
    await register(client);
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.type === Constants.InteractionTypes.APPLICATION_COMMAND) {
        const command = commands.get(interaction.data.name);
        if (!command) return interaction.createMessage({ content: 'Unknown command.', flags: Constants.MessageFlags.EPHEMERAL });
        try {
            await command.execute(interaction, client);
        } catch (e) {
            console.error(e);
            await interaction.createMessage({ content: 'An error occurred while executing this command.', flags: Constants.MessageFlags.EPHEMERAL });
        }
    } else if (interaction.type === Constants.InteractionTypes.MESSAGE_COMPONENT) {
        const id = interaction.data.custom_id;
        const action = actions.get(id);
        if (!action) return interaction.createMessage({ content: 'Unkown component (whar).', flags: Constants.MessageFlags.EPHEMERAL });
        try {
            await action.execute(interaction, client);
        } catch (e) {
            console.error(e);
            await interaction.createMessage({ content: 'An error occurred while executing.', flags: Constants.MessageFlags.EPHEMERAL });
        }
    }

});

import Util from 'node:util';
client.on('messageCreate', async (message) => {
    // Worlds worst command handler for my presious eval
    if (message.author.bot) return;
    if (message.author.id === client.user.id) return;
    if (!message.guildID) return;
    if (!message.member) return;
    if (message.author.id !== "517371142508380170") return; // We love hard coded ids

    const prefixMention = new RegExp(`^<@!?${client.user.id}>\\s+`);

    let content;
    if (prefixMention.test(message.content)) {
        const match = message.content.match(prefixMention);
        content = message.content
            .slice(match[0].length)
            .trim();
    }
    if (!content) return;

    const args = content
        .split(' ');
    const command = args.shift().toLowerCase();

    if (command !== "eval") { // This may be a crime
        return
    }

    try {
        const embed = {
            footer: {
                text: `Eval command executed by ${message.author.username}`
            },
            timestamp: new Date().toISOString()
        };
        let code = args.join(' ');
        let response;
        let e = false;
        try {
            if (code.includes('await') && !message.content.includes('\n'))
                code = '( async () => {return ' + code + '})()';
            else if (code.includes('await') && message.content.includes('\n'))
                code = '( async () => {' + code + '})()';
            response = await eval(code);
            if (typeof response !== 'string') {
                response = Util.inspect(response, { depth: 3 });
            }
        } catch (err) {
            e = true;
            response = err.toString();
            try {

                const Linter = await (await import('eslint')).Linter;
                let linter = new Linter();
                let lint = linter.verify(code, { 'env': { 'commonjs': true, 'es2021': true, 'node': true }, 'extends': 'eslint:recommended', 'parserOptions': { 'ecmaVersion': 12 } });
                let error = lint.find(e => e.fatal);
                if (error) {
                    let line = code.split('\n')[error.line - 1];
                    let match = line.slice(error.column - 1).match(/\w+/i);
                    let length = match ? match[0].length : 1;
                    response = `${line}
                    ${' '.repeat(error.column - 1)}${'^'.repeat(length)}
                    [${error.line}:${error.column}] ${error.message} `;
                }
            } catch (e) { }

        }
        response = response.replace(process.env.TOKEN, 'no');
        response = response.replace(process.env.GH_CLIENT_SECRET, 'no');
        response = response.replace(process.env.GH_PAT, 'no');
        const length = `\`\`\`${response}\`\`\``.length;
        embed.title = e ? '**Error**' : '**Success**';
        embed.color = e ? 0xe74c3c : 0x2ecc71;
        embed.description = `\`\`\`${response.substr(0, 2042)}\`\`\``;
        if (length >= 4097) {
            console.debug(`An eval command executed by ${message.author.username}'s response was too long (${length}/4096) the response was:
                ${response}`);
            embed.fields = [{
                name: 'Note:',
                value: `The response was too long with a length of \`${length}/4096\` characters. it was logged to the console`
            }];
        }
        await message.channel.createMessage({ embeds: [embed] });
    } catch (e) {
        console.error(`Error running ${command}\n`, e);
        message.channel.createMessage('Error running command. ```\n' + e.toString() + '\n```');
    }
});
await client.connect();
