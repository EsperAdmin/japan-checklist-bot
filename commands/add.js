const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const sanitizeHtml = require('sanitize-html');
const mongoSanitize = require('mongo-sanitize');
const { validate: uuidValidate } = require('uuid');

function containsDisallowedWords(text, disallowedWords) {
    const lowerText = text.toLowerCase();
    return disallowedWords.some(word => new RegExp(`\\b${word}\\b`).test(lowerText));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add')
        .setDescription('Add an item to your active trip')
        .addStringOption(option => option.setName('item').setDescription('Item name').setRequired(true)),
    async execute(interaction, { trips, activeTrips, disallowedWords }) {
        let item = interaction.options.getString('item');

        if (item.length > 100) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('Item name must be 100 characters or less!')
                .setFooter({
                    text: 'Your japan travel companion!',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
            return await interaction.editReply({ embeds: [embed] });
        }

        item = sanitizeHtml(item, {
            allowedTags: [],
            allowedAttributes: {},
        }).trim();

        if (containsDisallowedWords(item, disallowedWords)) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('Item name contains inappropriate language and cannot be used.')
                .setFooter({
                    text: 'Your japan travel companion!',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
            return await interaction.editReply({ embeds: [embed] });
        }

        if (!item) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('Item name cannot be empty after sanitization!')
                .setFooter({
                    text: 'Your japan travel companion!',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
            return await interaction.editReply({ embeds: [embed] });
        }

        const userId = mongoSanitize(interaction.user.id);
        const activeTripEntry = await activeTrips.findOne({ userId });
        if (!activeTripEntry) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('No active trip set! Use `/active` to set one.')
                .setFooter({
                    text: 'Your japan travel companion!',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
            return await interaction.editReply({ embeds: [embed] });
        }

        if (!uuidValidate(activeTripEntry.tripId)) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('Invalid trip ID format!');
            return await interaction.editReply({ embeds: [embed] })
            .setFooter({
                text: 'Your japan travel companion!',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();
        }

        const sanitizedTripId = mongoSanitize(activeTripEntry.tripId);
        const activeTrip = await trips.findOne({ tripId: sanitizedTripId, users: userId });
        if (!activeTrip) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('Active trip not found or you don’t have access!')
                .setFooter({
                    text: 'Your japan travel companion!',
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
                    text: 'Your japan travel companion!',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
            return await interaction.editReply({ embeds: [embed] });
        }

        const itemId = items.length + 1;
        items.push({ id: itemId, name: item, complete: false });
        await trips.updateOne({ tripId: sanitizedTripId }, { $set: { items } });

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('Item Added')
            .setDescription(`Added **${item}** as item #${itemId} to **${activeTrip.name}**!`)
            .setFooter({
                text: 'Your japan travel companion!',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    },
};