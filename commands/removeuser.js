const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removeuser')
        .setDescription('Remove a user from your active trip')
        .addUserOption(option => option.setName('user').setDescription('User to remove').setRequired(true)),
    async execute(interaction, { trips, activeTrips }) {
        const targetUser = interaction.options.getUser('user');
        const userId = interaction.user.id;
        const activeTripEntry = await activeTrips.findOne({ userId });

        if (!activeTripEntry) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('No active trip set! Use `/active` to set one.');
            return await interaction.editReply({ embeds: [embed] });
        }

        const activeTrip = await trips.findOne({ tripId: activeTripEntry.tripId, users: userId });
        if (!activeTrip) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('Active trip not found or you don\'t have access!');
            return await interaction.editReply({ embeds: [embed] });
        }

        const users = activeTrip.users;
        if (!users.includes(targetUser.id)) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription(`<@${targetUser.id}> is not in **${activeTrip.name}**!`);
            return await interaction.editReply({ embeds: [embed] });
        }

        if (targetUser.id === activeTrip.userId) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('You cannot remove the trip creator!');
            return await interaction.editReply({ embeds: [embed] });
        }

        users.splice(users.indexOf(targetUser.id), 1);
        await trips.updateOne({ tripId: activeTrip.tripId }, { $set: { users } });
        await activeTrips.deleteOne({ userId: targetUser.id, tripId: activeTrip.tripId }); // Remove their active status if set

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('User Removed')
            .setDescription(`Removed <@${targetUser.id}> from **${activeTrip.name}**!`);
        await interaction.editReply({ embeds: [embed] });
    },
};