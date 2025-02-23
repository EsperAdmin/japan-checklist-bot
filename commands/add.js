const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
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
        .setName('add')
        .setDescription('Add an item to your active trip')
        .addStringOption(option => option.setName('item').setDescription('Item name').setRequired(true)),
    async execute(interaction, { trips, activeTrips }) {
        let item = interaction.options.getString('item');

        // Sterilize the input
        item = sanitizeHtml(item, {
            allowedTags: [],
            allowedAttributes: {},
        }).trim();

        // Check for disallowed words (exact match)
        if (containsDisallowedWords(item)) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('Item name contains inappropriate language and cannot be used.')
                .setFooter({
                    text: 'Your Japan Travel Buddy!',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
            return await interaction.editReply({ embeds: [embed] });
        }

        // Ensure item is not empty after sterilization
        if (!item) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('Item name cannot be empty after sanitization!')
                .setFooter({
                    text: 'Your Japan Travel Buddy!',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
            return await interaction.editReply({ embeds: [embed] });
        }

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

        const items = activeTrip.items;
        if (items.length >= 25) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('Maximum item limit of 25 reached for this trip!')           
                .setFooter({
                    text: 'Your Japan Travel Buddy!',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
            return await interaction.editReply({ embeds: [embed] });
        }

        const itemId = items.length + 1;
        items.push({ id: itemId, name: item, complete: false });
        await trips.updateOne({ tripId: activeTrip.tripId }, { $set: { items } });

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('Item Added')
            .setDescription(`Added **${item}** as item #${itemId} to **${activeTrip.name}**!`)
            .setFooter({
                text: 'Your Japan Travel Buddy!',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    },
};