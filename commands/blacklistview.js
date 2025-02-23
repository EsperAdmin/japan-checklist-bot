const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blacklistview')
        .setDescription('View the bot blacklist (owner only)'),
    async execute(interaction, { blacklist }) {
        const ownerId = process.env.BOT_OWNER_ID;
        if (interaction.user.id !== ownerId) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('This command is restricted to the bot owner!');
            return await interaction.editReply({ embeds: [embed] });
        }

        const blacklistedUsers = await blacklist.find({}).toArray();
        const usersPerPage = 10;
        const totalPages = Math.ceil(blacklistedUsers.length / usersPerPage);
        const paginatedUsers = blacklistedUsers.slice(0, usersPerPage)
            .map((u, i) => `${i + 1}. <@${u.userId}> (ID: ${u.userId})`)
            .join('\n') || 'None';

        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('Blacklisted Users')
            .setDescription(paginatedUsers)
            .addFields({ name: 'Page', value: `1/${totalPages}`, inline: true });

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId(`prev_blacklist_all_1`).setLabel('Previous').setStyle(ButtonStyle.Primary).setDisabled(true),
                new ButtonBuilder().setCustomId(`next_blacklist_all_1`).setLabel('Next').setStyle(ButtonStyle.Primary).setDisabled(totalPages <= 1)
            );

        await interaction.editReply({
            embeds: [embed],
            components: blacklistedUsers.length > usersPerPage ? [buttons] : []
        });
    },
};