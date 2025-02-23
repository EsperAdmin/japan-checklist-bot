const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list')
        .setDescription('List all your trips'),
    async execute(interaction, { trips, activeTrips }) {
        const userId = interaction.user.id;
        const userTrips = await trips.find({ users: userId }).toArray();
        const activeTripEntry = await activeTrips.findOne({ userId });
        const activeTripId = activeTripEntry ? activeTripEntry.tripId : null;

        const tripsPerPage = 10;
        const totalPages = Math.ceil(userTrips.length / tripsPerPage);
        const paginatedTrips = userTrips.slice(0, tripsPerPage)
            .map((t, i) => `${i + 1}. ${t.name} (ID: ${t.tripId}) ${t.tripId === activeTripId ? '**[Active]**' : ''}`)
            .join('\n') || 'None';

        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle('Your Trips')
            .setDescription(paginatedTrips)
            .addFields({ name: 'Page', value: `1/${totalPages}`, inline: true })
            .setFooter({
                text: 'Your Japan Travel Buddy!',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId(`prev_list_${userId}_1`).setLabel('Previous').setStyle(ButtonStyle.Primary).setDisabled(true),
                new ButtonBuilder().setCustomId(`next_list_${userId}_1`).setLabel('Next').setStyle(ButtonStyle.Primary).setDisabled(totalPages <= 1)
            );

        await interaction.editReply({
            embeds: [embed],
            components: userTrips.length > tripsPerPage ? [buttons] : []
        });
    },
};