const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { v4: uuidv4 } = require('uuid');
const sanitizeHtml = require('sanitize-html');
const fs = require('fs');
const path = require('path');

// Load disallowed words from JSON file
const disallowedWordsPath = path.join(__dirname, '..', 'disallowedWords.json');
const disallowedWords = JSON.parse(fs.readFileSync(disallowedWordsPath, 'utf8'));

function containsDisallowedWords(text) {
    const lowerText = text.toLowerCase();
    // Use word boundaries (\b) for exact match
    return disallowedWords.some(word => new RegExp(`\\b${word}\\b`).test(lowerText));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create')
        .setDescription('Create a new trip')
        .addStringOption(option => option.setName('name').setDescription('Trip name').setRequired(true)),
    async execute(interaction, { trips, activeTrips }) {
        let name = interaction.options.getString('name');
        
        // Sterilize the input
        name = sanitizeHtml(name, {
            allowedTags: [],
            allowedAttributes: {},
        }).trim();

        // Check for disallowed words (exact match)
        if (containsDisallowedWords(name)) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('Trip name contains inappropriate language and cannot be used.')
                .setFooter({
                    text: 'Your Japan Travel Buddy!',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
            return await interaction.editReply({ embeds: [embed] });
        }

        // Ensure name is not empty after sterilization
        if (!name) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('Trip name cannot be empty after sanitization!')
                .setFooter({
                    text: 'Your Japan Travel Buddy!',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
            return await interaction.editReply({ embeds: [embed] });
        }

        const userId = interaction.user.id;
        const userTripCount = await trips.countDocuments({ userId });

        if (userTripCount >= 10) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('You have reached the maximum limit of 10 trips!')
                .setFooter({
                    text: 'Your Japan Travel Buddy!',
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
                text: 'Your Japan Travel Buddy!',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    },
};