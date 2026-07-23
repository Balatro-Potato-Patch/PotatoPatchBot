import { execute as cmdExecute } from '../commands/link.js';

const metadata = {
    name: 'link',
};

/**
 * @param {import('@projectdysnomia/dysnomia').ComponentInteraction} interaction
 * @param {import('@projectdysnomia/dysnomia').Client} client
 */
const execute = async (interaction, client) => {
    return cmdExecute(interaction, client);
};

export {
    metadata,
    execute,
}


