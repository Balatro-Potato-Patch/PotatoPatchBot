import { Constants } from '@projectdysnomia/dysnomia';
import { udb } from '../helpers/data.js';
import { getLogin } from "../server/main.js";
import { checkOrg } from "../helpers/gh.js";

/** @type {import('@projectdysnomia/dysnomia').ChatInputApplicationCommandStructure} */
const metadata = {
    name: 'link',
    description: 'Link your GitHub command.',
    type: Constants.ApplicationCommandTypes.CHAT_INPUT,
    options: [],
    dmPermission: false,
};

/**
 * @param {import('@projectdysnomia/dysnomia').CommandInteraction | import('@projectdysnomia/dysnomia').ComponentInteraction} interaction
 * @param {import('@projectdysnomia/dysnomia').Client} client
 */
const execute = async (interaction, client) => {
    const user = interaction.user;
    const ghu = udb.get(user.id)

    if (ghu) { // Org checks
        await interaction.defer(Constants.MessageFlags.EPHEMERAL);
        const status = await checkOrg(ghu.lastUsername);
        if (status === "active")
            return interaction.createMessage({ content: "Your GitHub account is already linked and in the org. You're good to go!", flags: Constants.MessageFlags.EPHEMERAL });
        else {
            return interaction.createMessage({
                flags: Constants.MessageFlags.EPHEMERAL | Constants.MessageFlags.IS_COMPONENTS_V2,
                components: [
                    {
                        type: Constants.ComponentTypes.TEXT_DISPLAY,
                        content: "Your GitHub account is linked. Now you must join the organization. Click the button below to begin the process."
                    },
                    {
                        type: Constants.ComponentTypes.ACTION_ROW,
                        components: [
                            {
                                type: Constants.ComponentTypes.BUTTON,
                                style: Constants.ButtonStyles.PRIMARY,
                                label: "Join Organization",
                                custom_id: "org",
                            }
                        ]
                    },

                ]
            });
        }
    } else { // Account Linking
        const name = interaction.member?.nick || user.globalName || user.username;
        const url = getLogin(user.id, name);

        await interaction.createMessage({
            flags: Constants.MessageFlags.EPHEMERAL | Constants.MessageFlags.IS_COMPONENTS_V2,
            components: [
                {
                    type: Constants.ComponentTypes.TEXT_DISPLAY,
                    content: "To partipate in events you must link your GitHub account. This is to allow access to the appropriate repos.\nTo link your account, please click the button below:\n-# Do not share this link with anyone."
                },
                {
                    type: Constants.ComponentTypes.ACTION_ROW,
                    components: [
                        {
                            type: Constants.ComponentTypes.BUTTON,
                            style: Constants.ButtonStyles.LINK,
                            url: url,
                            label: "Login and Link GitHub Account"
                        }
                    ]
                },
                {
                    type: Constants.ComponentTypes.TEXT_DISPLAY,
                    content: "Once your account is linked, click the following button to join the organization."
                },
                {
                    type: Constants.ComponentTypes.ACTION_ROW,
                    components: [
                        {
                            type: Constants.ComponentTypes.BUTTON,
                            style: Constants.ButtonStyles.PRIMARY,
                            label: "Join Organization",
                            custom_id: "org",
                        }
                    ]
                },

            ]
        });
    }
};

export {
    metadata,
    execute,
}
