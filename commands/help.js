const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('View a list of all commands and their details'),
    async execute(interaction) {
        const commands = [
            { name: '/active', description: 'Set a trip as your active trip using its ID.' },
            { name: '/add', description: 'Add an item to your active trip’s checklist (max 25 items).' },
            { name: '/admin', description: 'Owner-only: Manage trips and blacklist (subcommands: alltrips, blacklist, blacklistview).' },
            { name: '/create', description: 'Create a new trip (max 10 per user) and set it as active.' },
            { name: '/japan', description: 'Get a random image of Japan from Unsplash.' },
            { name: '/list', description: 'List all your trips with pagination.' },
            { name: '/manage', description: 'Modify your active trip (subcommands: complete, remove, uncomplete, adduser, removeuser, delete).' },
            { name: '/requests', description: 'View and accept/decline trip join requests.' },
            { name: '/stats', description: 'View bot statistics (e.g., active trips, servers).' },
            { name: '/view', description: 'View your active trip or a specific trip by name.' }
        ];

        const commandsPerPage = 5;
        const totalPages = Math.ceil(commands.length / commandsPerPage);

        function generateEmbed(page) {
            const start = (page - 1) * commandsPerPage;
            const end = start + commandsPerPage;
            const paginatedCommands = commands.slice(start, end);

            const commandList = paginatedCommands.map(cmd => `**${cmd.name}**\n${cmd.description}`).join('\n\n');

            return new EmbedBuilder()
                .setColor('#1ABC9C')
                .setTitle('Checklist Bot Help')
                .setDescription(commandList)
                .addFields({ name: 'Page', value: `${page}/${totalPages}`, inline: true })
                .setFooter({
                    text: 'This is an open-source Discord bot created with Grok 3 by xAI.',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
        }

        const initialEmbed = generateEmbed(1);
        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`prev_help_${interaction.user.id}_1`)
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId(`next_help_${interaction.user.id}_1`)
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(totalPages <= 1)
            );

        await interaction.editReply({
            embeds: [initialEmbed],
            components: commands.length > commandsPerPage ? [buttons] : []
        });
    },
};