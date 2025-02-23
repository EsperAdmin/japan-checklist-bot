const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const mongoSanitize = require('mongo-sanitize');
const { validate: uuidValidate } = require('uuid');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('active')
        .setDescription('Set a trip as your active trip')
        .addStringOption(option => option.setName('trip_id').setDescription('Trip ID').setRequired(true)),
    async execute(interaction, { trips, activeTrips }) {
        const tripId = mongoSanitize(interaction.options.getString('trip_id'));
        if (!uuidValidate(tripId)) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('Invalid trip ID format!')
                .setFooter({
                    text: 'Your japan travel companion!',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
            return await interaction.editReply({ embeds: [embed] });
        }

        const userId = mongoSanitize(interaction.user.id);
        const trip = await trips.findOne({ tripId, users: userId });

        if (!trip) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('Trip not found or you don’t have access!')
                .setFooter({
                    text: 'Your japan travel companion!',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
            return await interaction.editReply({ embeds: [embed] });
        }

        await activeTrips.deleteMany({ userId });
        await activeTrips.insertOne({ userId, tripId });

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('Active Trip Set')
            .setDescription(`**${trip.name}** is now your active trip!`)
            .setFooter({
                text: 'Your japan travel companion!',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    },
};