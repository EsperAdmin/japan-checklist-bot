const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('view')
        .setDescription('View a trip (active by default)')
        .addStringOption(option => option.setName('name').setDescription('Trip name (optional)')),
    async execute(interaction, { trips, activeTrips }) {
        const name = interaction.options.getString('name');
        const userId = interaction.user.id;
        let trip;

        if (name) {
            trip = await trips.findOne({ users: userId, name });
        } else {
            const activeTripEntry = await activeTrips.findOne({ userId });
            if (!activeTripEntry) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Error')
                    .setDescription('No active trip set! Use `/active` to set one.')
                    .setFooter({
                        text: 'Your Japan Travel Buddy!',
                        iconURL: interaction.client.user.displayAvatarURL()
                    })
                    .setTimestamp();
                return await interaction.editReply({ embeds: [embed] });
            }
            trip = await trips.findOne({ tripId: activeTripEntry.tripId, users: userId });
        }

        if (!trip) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('Trip not found or you don\'t have access!')
                .setFooter({
                    text: 'Your Japan Travel Buddy!',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
            return await interaction.editReply({ embeds: [embed] });
        }

        const itemsPerPage = 10;
        const items = trip.items;
        const totalPages = Math.ceil(items.length / itemsPerPage);
        const paginatedItems = items.slice(0, itemsPerPage).map(i => `${i.id}. ${i.name} ${i.complete ? '[✅]' : '[]'}`).join('\n') || 'None';
        const users = trip.users.map(u => `<@${u}>`).join(', ');

        const embed = new EmbedBuilder()
            .setColor('#3498DB')
            .setTitle(`${trip.name}`)
            .setDescription(`Trip ID: ${trip.tripId}`)
            .addFields(
                { name: 'Users', value: users, inline: true },
                { name: 'Items', value: paginatedItems },
                { name: 'Page', value: `1/${totalPages}`, inline: true }
            )
            .setFooter({
                text: 'Your Japan Travel Buddy!',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId(`prev_trip_${trip.tripId}_1`).setLabel('Previous').setStyle(ButtonStyle.Primary).setDisabled(true),
                new ButtonBuilder().setCustomId(`next_trip_${trip.tripId}_1`).setLabel('Next').setStyle(ButtonStyle.Primary).setDisabled(totalPages <= 1)
            );

        await interaction.editReply({
            embeds: [embed],
            components: items.length > itemsPerPage ? [buttons] : []
        });
    },
};