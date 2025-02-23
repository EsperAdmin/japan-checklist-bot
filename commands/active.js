const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('active')
        .setDescription('Set a trip as your active trip')
        .addStringOption(option => option.setName('trip_id').setDescription('Trip ID').setRequired(true)),
    async execute(interaction, { trips, activeTrips }) {
        const tripId = interaction.options.getString('trip_id');
        const userId = interaction.user.id;
        const trip = await trips.findOne({ tripId, users: userId });

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

        await activeTrips.deleteMany({ userId }); // Remove old active trip for this user
        await activeTrips.insertOne({ userId, tripId });

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('Active Trip Set')
            .setDescription(`**${trip.name}** is now your active trip!`)
            .setFooter({
                text: 'Your Japan Travel Buddy!',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();
            
        await interaction.editReply({ embeds: [embed] });
    },
};