const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { v4: uuidv4 } = require('uuid');
const sanitizeHtml = require('sanitize-html');
const mongoSanitize = require('mongo-sanitize');

function containsDisallowedWords(text, disallowedWords) {
    const lowerText = text.toLowerCase();
    return disallowedWords.some(word => new RegExp(`\\b${word}\\b`).test(lowerText));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create')
        .setDescription('Create a new trip')
        .addStringOption(option => option.setName('name').setDescription('Trip name').setRequired(true)),
    async execute(interaction, { trips, activeTrips, disallowedWords }) {
        let name = interaction.options.getString('name');
        
        if (name.length > 100) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('Trip name must be 100 characters or less!')
                .setFooter({
                    text: 'Your japan travel companion!',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
            return await interaction.editReply({ embeds: [embed] });
        }

        name = sanitizeHtml(name, {
            allowedTags: [],
            allowedAttributes: {},
        }).trim();

        if (containsDisallowedWords(name, disallowedWords)) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('Trip name contains inappropriate language and cannot be used.')
                .setFooter({
                    text: 'Your japan travel companion!',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
            return await interaction.editReply({ embeds: [embed] });
        }

        if (!name) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('Trip name cannot be empty after sanitization!')
                .setFooter({
                    text: 'Your japan travel companion!',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
            return await interaction.editReply({ embeds: [embed] });
        }

        const userId = mongoSanitize(interaction.user.id);
        const userTripCount = await trips.countDocuments({ userId });

        if (userTripCount >= 10) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('You have reached the maximum limit of 10 trips!')
                .setFooter({
                    text: 'Your japan travel companion!',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
            return await interaction.editReply({ embeds: [embed] });
        }

        const tripId = uuidv4();

        await trips.insertOne({
            tripId,
            name,
            userId,
            items: [],
            users: [userId]
        });
        await activeTrips.deleteMany({ userId });
        await activeTrips.insertOne({ userId, tripId });

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('Trip Created')
            .setDescription(`**${name}** has been created and set as your active trip!`)
            .addFields({ name: 'Trip ID', value: tripId })
            .setFooter({
                text: 'Your japan travel companion!',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    },
};