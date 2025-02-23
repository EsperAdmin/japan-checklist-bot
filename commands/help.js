const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('View a list of all commands and their details'),
    async execute(interaction) {
        // Define all commands with descriptions
        const commands = [
            { name: '/active', description: 'Set a trip as your active trip using its ID.' },
            { name: '/add', description: 'Add an item to your active trip’s checklist (max 25 items).' },
            { name: '/adduser', description: 'Send a request to add a user to your active trip.' },
            { name: '/alltrips', description: 'Owner-only: View/manage all trips across the bot.' },
            { name: '/blacklist', description: 'Owner-only: Add/remove users from the bot blacklist.' },
            { name: '/blacklistview', description: 'Owner-only: View the list of blacklisted users.' },
            { name: '/complete', description: 'Mark an item as complete in your active trip.' },
            { name: '/create', description: 'Create a new trip (max 10 per user) and set it as active.' },
            { name: '/delete', description: 'Delete a trip by ID (creator only).' },
            { name: '/japan', description: 'Get a random image of Japan from Unsplash.' },
            { name: '/list', description: 'List all your trips with pagination.' },
            { name: '/remove', description: 'Remove an item from your active trip’s checklist.' },
            { name: '/removeuser', description: 'Remove a user from your active trip.' },
            { name: '/requests', description: 'View and accept/decline trip join requests.' },
            { name: '/stats', description: 'View bot statistics (e.g., active trips, servers).' },
            { name: '/uncomplete', description: 'Mark an item as incomplete in your active trip.' },
            { name: '/view', description: 'View your active trip or a specific trip by name.' },
            { name: 'View the source!', description: 'Visit the project [GitHub](https://github.com/EsperAdmin/japan-checklist-bot)' }

        ];

        const commandsPerPage = 5;
        const totalPages = Math.ceil(commands.length / commandsPerPage);

        // Function to generate embed for a given page
        function generateEmbed(page) {
            const start = (page - 1) * commandsPerPage;
            const end = start + commandsPerPage;
            const paginatedCommands = commands.slice(start, end);

            const commandList = paginatedCommands.map(cmd => `**${cmd.name}**\n${cmd.description}`).join('\n\n');

            return new EmbedBuilder()
                .setColor('#1ABC9C') // Teal color for a clean, modern look
                .setTitle('Japan Checklist Help Page')
                .setDescription(commandList)
                .addFields({ name: 'Page', value: `${page}/${totalPages}`, inline: true })
                .setFooter({
                    text: 'Your Japan Travel Buddy!',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
        }

        // Initial embed (page 1)
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

// Handle button interactions in index.js (already included in previous versions)