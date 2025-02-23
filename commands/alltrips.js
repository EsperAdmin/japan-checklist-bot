const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('alltrips')
        .setDescription('View and manage all trips (owner only)')
        .addStringOption(option => option.setName('trip_id').setDescription('Trip ID to manage (optional)'))
        .addStringOption(option => option.setName('action').setDescription('Action: delete, adduser, removeuser (optional)'))
        .addUserOption(option => option.setName('user').setDescription('User to add/remove (if applicable)')),
    async execute(interaction, { trips, activeTrips }, client) {
        const ownerId = process.env.BOT_OWNER_ID;
        if (interaction.user.id !== ownerId) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('This command is restricted to the bot owner!');
            return await interaction.editReply({ embeds: [embed] });
        }

        const tripId = interaction.options.getString('trip_id');
        const action = interaction.options.getString('action');
        const user = interaction.options.getUser('user');

        if (tripId && action) {
            const trip = await trips.findOne({ tripId });
            if (!trip) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Error')
                    .setDescription(`Trip ID ${tripId} not found!`);
                return await interaction.editReply({ embeds: [embed] });
            }

            if (action === 'delete') {
                await trips.deleteOne({ tripId });
                await activeTrips.deleteMany({ tripId });
                const embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('Trip Deleted')
                    .setDescription(`Trip **${trip.name}** (ID: ${tripId}) has been deleted!`);
                return await interaction.editReply({ embeds: [embed] });
            } else if (action === 'adduser' && user) {
                if (trip.users.includes(user.id)) {
                    const embed = new EmbedBuilder()
                        .setColor('#FFA500')
                        .setTitle('Warning')
                        .setDescription(`<@${user.id}> is already in **${trip.name}**!`);
                    return await interaction.editReply({ embeds: [embed] });
                }
                await trips.updateOne({ tripId }, { $push: { users: user.id } });
                const embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('User Added')
                    .setDescription(`Added <@${user.id}> to **${trip.name}** (ID: ${tripId})!`);
                return await interaction.editReply({ embeds: [embed] });
            } else if (action === 'removeuser' && user) {
                if (!trip.users.includes(user.id)) {
                    const embed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('Error')
                        .setDescription(`<@${user.id}> is not in **${trip.name}**!`);
                    return await interaction.editReply({ embeds: [embed] });
                }
                if (user.id === trip.userId) {
                    const embed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('Error')
                        .setDescription('Cannot remove the trip creator!');
                    return await interaction.editReply({ embeds: [embed] });
                }
                await trips.updateOne({ tripId }, { $pull: { users: user.id } });
                await activeTrips.deleteOne({ userId: user.id, tripId });
                const embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('User Removed')
                    .setDescription(`Removed <@${user.id}> from **${trip.name}** (ID: ${tripId})!`);
                return await interaction.editReply({ embeds: [embed] });
            } else {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Error')
                    .setDescription('Invalid action or missing user! Use: delete, adduser, removeuser.');
                return await interaction.editReply({ embeds: [embed] });
            }
        }

        const allTrips = await trips.find({}).toArray();
        const tripsPerPage = 10;
        const totalPages = Math.ceil(allTrips.length / tripsPerPage);
        const paginatedTrips = allTrips.slice(0, tripsPerPage)
            .map((t, i) => `${i + 1}. ${t.name} (ID: ${t.tripId}, Creator: <@${t.userId}>)`)
            .join('\n') || 'None';

        const embed = new EmbedBuilder()
            .setColor('#FF00FF') // Magenta for owner command
            .setTitle('All Trips')
            .setDescription(paginatedTrips)
            .addFields({ name: 'Page', value: `1/${totalPages}`, inline: true });

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder().setCustomId(`prev_alltrips_all_1`).setLabel('Previous').setStyle(ButtonStyle.Primary).setDisabled(true),
                new ButtonBuilder().setCustomId(`next_alltrips_all_1`).setLabel('Next').setStyle(ButtonStyle.Primary).setDisabled(totalPages <= 1)
            );

        await interaction.editReply({
            embeds: [embed],
            components: allTrips.length > tripsPerPage ? [buttons] : []
        });
    },
};