import { readdir } from 'fs/promises';

const optionsToObj = (options) => {
    const obj = {};
    for (const option of options) {
        obj[option.name] = option.value;
    }
    return obj;
};

const commands = new Map();
const actions = new Map();

const loadCommands = async () => {
    const commandFiles = await readdir('./src/commands');
    for (const file of commandFiles) {
        if (!file.endsWith(".js")) continue;
        const command = await import(`../commands/${file}`);
        if (command)
            commands.set(command.metadata.name, command);
    }

    const actionFiles = await readdir('./src/actions');
    for (const file of actionFiles) {
        if (!file.endsWith(".js")) continue;
        const action = await import(`../actions/${file}`);
        if (action)
            actions.set(action.metadata.name, action);
    }
    /**
     * @param {import('@projectdysnomia/dysnomia').Client} client 
     */
    return (client) => client.bulkEditCommands([...commands.values()].map(command => command.metadata));
}

export {
    optionsToObj,
    commands,
    actions,
    loadCommands,
};
