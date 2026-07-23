import { Constants } from '@projectdysnomia/dysnomia';
import { udb } from '../helpers/data.js';
import { checkOrg, inviteUser } from "../helpers/gh.js";

const metadata = {
    name: 'org',
};

/**
 * @param {import('@projectdysnomia/dysnomia').ComponentInteraction} interaction
 * @param {import('@projectdysnomia/dysnomia').Client} client
 */
const execute = async (interaction, client) => {
    const user = interaction.user;
    if (!udb.has(user.id)) {
        return interaction.createMessage({ content: "Your GitHub account is not linked! Please run /link and link your account first.", flags: Constants.MessageFlags.EPHEMERAL });
    }

    const gh = udb.get(user.id)

    await interaction.defer(Constants.MessageFlags.EPHEMERAL);
    const status = await checkOrg(gh.lastUsername);
    if (status === "active") {
        return interaction.createMessage({ content: "You are already in the org. You're all set!", flags: Constants.MessageFlags.EPHEMERAL });
    }
    if (!status) { // Not invited
        await inviteUser(gh.ghID);
    }
    return interaction.createMessage({
        flags: Constants.MessageFlags.EPHEMERAL | Constants.MessageFlags.IS_COMPONENTS_V2,
        components: [
            {
                type: Constants.ComponentTypes.TEXT_DISPLAY,
                content: "I've sent you an invite to the org. You can accept it at this link:"
            },
            {
                type: Constants.ComponentTypes.ACTION_ROW,
                components: [
                    {
                        type: Constants.ComponentTypes.BUTTON,
                        style: Constants.ButtonStyles.LINK,
                        url: `https://github.com/orgs/${process.env.GH_ORG_NAME}/invitation`,
                        label: "View Invitation",
                    }
                ]
            },
            {
                type: Constants.ComponentTypes.TEXT_DISPLAY,
                content: "You also should have received an email/notification with the invitation, which you can accept from."
            },
        ]
    });   
};

export {
    metadata,
    execute,
}

