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
        .setName('adduser')
        .setDescription('Send a request to add a user to your active trip')
        .addUserOption(option => option.setName('user').setDescription('User to invite').setRequired(true)),
    async execute(interaction, { trips, activeTrips, requests }) {
        const targetUser = interaction.options.getUser('user');
        const userId = interaction.user.id;
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

        const activeTrip = await trips.findOne({ tripId: activeTripEntry.tripId, users: userId });
        if (!activeTrip) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('Active trip not found or you don\'t have access!')
                .setFooter({
                    text: 'Your Japan Travel Buddy!',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
            return await interaction.editReply({ embeds: [embed] });
        }

        // Sterilize trip name for display and check for disallowed words (exact match)
        const sanitizedTripName = sanitizeHtml(activeTrip.name, {
            allowedTags: [],
            allowedAttributes: {},
        }).trim();

        if (containsDisallowedWords(sanitizedTripName)) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('The active trip name contains inappropriate language and cannot be shared.')
                .setFooter({
                    text: 'Your Japan Travel Buddy!',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
            return await interaction.editReply({ embeds: [embed] });
        }

        if (activeTrip.users.includes(targetUser.id)) {
            const embed = new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle('Warning')
                .setDescription(`<@${targetUser.id}> is already in **${sanitizedTripName}**!`)
                .setFooter({
                    text: 'Your Japan Travel Buddy!',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
            return await interaction.editReply({ embeds: [embed] });
        }

        const requestId = uuidv4();
        await requests.insertOne({
            requestId,
            tripId: activeTrip.tripId,
            targetUserId: targetUser.id,
            requesterId: userId
        });

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('Request Sent')
            .setDescription(`Sent a request to <@${targetUser.id}> to join **${sanitizedTripName}**!\nThey can accept with \`/requests\`.`)
            .setFooter({
                text: 'Your Japan Travel Buddy!',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    },
};