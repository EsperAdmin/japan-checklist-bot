const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delete')
        .setDescription('Delete a trip by ID (creator only)')
        .addStringOption(option => option.setName('trip_id').setDescription('Trip ID').setRequired(true)),
    async execute(interaction, { trips, activeTrips }) {
        const tripId = interaction.options.getString('trip_id');
        const userId = interaction.user.id;
        const trip = await trips.findOne({ tripId, userId }); // Only creator can delete

        if (!trip) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('Trip not found or you\'re not the creator!')
                .setFooter({
                    text: 'Your Japan Travel Buddy!',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
            return await interaction.editReply({ embeds: [embed] });
        }

        await trips.deleteOne({ tripId });
        await activeTrips.deleteMany({ tripId }); // Remove active status for all users

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('Trip Deleted')
            .setDescription(`Trip with ID **${tripId}** has been deleted!`)
            .setFooter({
                text: 'Your Japan Travel Buddy!',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    },
};