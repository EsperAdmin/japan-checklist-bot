const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const mongoSanitize = require('mongo-sanitize');
const { validate: uuidValidate } = require('uuid');
const sanitizeHtml = require('sanitize-html');

function containsDisallowedWords(text, disallowedWords) {
    const lowerText = text.toLowerCase();
    return disallowedWords.some(word => new RegExp(`\\b${word}\\b`).test(lowerText));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('manage')
        .setDescription('Manage your active trip')
        .addSubcommand(subcommand =>
            subcommand
                .setName('complete')
                .setDescription('Mark an item as complete in your active trip')
                .addIntegerOption(option => option.setName('item_id').setDescription('Item ID').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove an item from your active trip')
                .addIntegerOption(option => option.setName('item_id').setDescription('Item ID').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('uncomplete')
                .setDescription('Mark an item as incomplete in your active trip')
                .addIntegerOption(option => option.setName('item_id').setDescription('Item ID').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('adduser')
                .setDescription('Send a request to add a user to your active trip')
                .addUserOption(option => option.setName('user').setDescription('User to invite').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('removeuser')
                .setDescription('Remove a user from your active trip')
                .addUserOption(option => option.setName('user').setDescription('User to remove').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('delete')
                .setDescription('Delete one of your trips (interactive selection)')
        ),
    async execute(interaction, { trips, activeTrips, requests, disallowedWords }) {
        const subcommand = interaction.options.getSubcommand();
        const userId = mongoSanitize(interaction.user.id);

        if (subcommand === 'complete') {
            const itemId = interaction.options.getInteger('item_id');
            if (!Number.isInteger(itemId) || itemId < 1) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Error')
                    .setDescription('Item ID must be a positive integer!')
                    .setFooter({
                        text: 'Your japan travel companion!',
                        iconURL: interaction.client.user.displayAvatarURL()
                    })
                    .setTimestamp();
                return await interaction.editReply({ embeds: [embed] });
            }

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
                    .setDescription('Invalid trip ID format!')
                    .setFooter({
                        text: 'Your japan travel companion!',
                        iconURL: interaction.client.user.displayAvatarURL()
                    })
                    .setTimestamp();
                return await interaction.editReply({ embeds: [embed] });
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
            const item = items.find(i => i.id === itemId);
            if (!item) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Error')
                    .setDescription(`Item #${itemId} not found!`)
                    .setFooter({
                        text: 'Your japan travel companion!',
                        iconURL: interaction.client.user.displayAvatarURL()
                    })
                    .setTimestamp();
                return await interaction.editReply({ embeds: [embed] });
            }

            item.complete = true;
            await trips.updateOne({ tripId: sanitizedTripId }, { $set: { items } });

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Item Completed')
                .setDescription(`Marked item #${itemId} (**${item.name}**) as complete in **${activeTrip.name}**!`)
                .setFooter({
                    text: 'Your japan travel companion!',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'remove') {
            const itemId = interaction.options.getInteger('item_id');
            if (!Number.isInteger(itemId) || itemId < 1) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Error')
                    .setDescription('Item ID must be a positive integer!')
                    .setFooter({
                        text: 'Your japan travel companion!',
                        iconURL: interaction.client.user.displayAvatarURL()
                    })
                    .setTimestamp();
                return await interaction.editReply({ embeds: [embed] });
            }

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
                    .setDescription('Invalid trip ID format!')
                    .setFooter({
                        text: 'Your japan travel companion!',
                        iconURL: interaction.client.user.displayAvatarURL()
                    })
                    .setTimestamp();
                return await interaction.editReply({ embeds: [embed] });
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

            let items = activeTrip.items.filter(i => i.id !== itemId);
            if (items.length === activeTrip.items.length) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Error')
                    .setDescription(`Item #${itemId} not found!`)
                    .setFooter({
                        text: 'Your japan travel companion!',
                        iconURL: interaction.client.user.displayAvatarURL()
                    })
                    .setTimestamp();
                return await interaction.editReply({ embeds: [embed] });
            }

            items = items.map((item, index) => ({ ...item, id: index + 1 }));
            await trips.updateOne({ tripId: sanitizedTripId }, { $set: { items } });

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Item Removed')
                .setDescription(`Removed item #${itemId} from **${activeTrip.name}**!`)
                .setFooter({
                    text: 'Your japan travel companion!',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'uncomplete') {
            const itemId = interaction.options.getInteger('item_id');
            if (!Number.isInteger(itemId) || itemId < 1) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Error')
                    .setDescription('Item ID must be a positive integer!')
                    .setFooter({
                        text: 'Your japan travel companion!',
                        iconURL: interaction.client.user.displayAvatarURL()
                    })
                    .setTimestamp();
                return await interaction.editReply({ embeds: [embed] });
            }

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
                    .setDescription('Invalid trip ID format!')
                    .setFooter({
                        text: 'Your japan travel companion!',
                        iconURL: interaction.client.user.displayAvatarURL()
                    })
                    .setTimestamp();
                return await interaction.editReply({ embeds: [embed] });
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
            const item = items.find(i => i.id === itemId);
            if (!item) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Error')
                    .setDescription(`Item #${itemId} not found!`)
                    .setFooter({
                        text: 'Your japan travel companion!',
                        iconURL: interaction.client.user.displayAvatarURL()
                    })
                    .setTimestamp();
                return await interaction.editReply({ embeds: [embed] });
            }

            item.complete = false;
            await trips.updateOne({ tripId: sanitizedTripId }, { $set: { items } });

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Item Uncompleted')
                .setDescription(`Marked item #${itemId} (**${item.name}**) as incomplete in **${activeTrip.name}**!`)
                .setFooter({
                    text: 'Your japan travel companion!',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'adduser') {
            const targetUser = interaction.options.getUser('user');
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
                    .setDescription('Invalid trip ID format!')
                    .setFooter({
                        text: 'Your japan travel companion!',
                        iconURL: interaction.client.user.displayAvatarURL()
                    })
                    .setTimestamp();
                return await interaction.editReply({ embeds: [embed] });
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

            const sanitizedTripName = sanitizeHtml(activeTrip.name, {
                allowedTags: [],
                allowedAttributes: {},
            }).trim();

            if (containsDisallowedWords(sanitizedTripName, disallowedWords)) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Error')
                    .setDescription('The active trip name contains inappropriate language and cannot be shared.')
                    .setFooter({
                        text: 'Your japan travel companion!',
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
                        text: 'Your japan travel companion!',
                        iconURL: interaction.client.user.displayAvatarURL()
                    })
                    .setTimestamp();
                return await interaction.editReply({ embeds: [embed] });
            }

            const requestId = require('uuid').v4();
            await requests.insertOne({
                requestId,
                tripId: sanitizedTripId,
                targetUserId: mongoSanitize(targetUser.id),
                requesterId: userId
            });

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Request Sent')
                .setDescription(`Sent a request to <@${targetUser.id}> to join **${sanitizedTripName}**!\nThey can accept with \`/requests\`.`)
                .setFooter({
                    text: 'Your japan travel companion!',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'removeuser') {
            const targetUser = interaction.options.getUser('user');
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
                    .setDescription('Invalid trip ID format!')
                    .setFooter({
                        text: 'Your japan travel companion!',
                        iconURL: interaction.client.user.displayAvatarURL()
                    })
                    .setTimestamp();
                return await interaction.editReply({ embeds: [embed] });
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

            const targetUserId = mongoSanitize(targetUser.id);
            const users = activeTrip.users;
            if (!users.includes(targetUserId)) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Error')
                    .setDescription(`<@${targetUserId}> is not in **${activeTrip.name}**!`)
                    .setFooter({
                        text: 'Your japan travel companion!',
                        iconURL: interaction.client.user.displayAvatarURL()
                    })
                    .setTimestamp();
                return await interaction.editReply({ embeds: [embed] });
            }

            if (targetUserId === activeTrip.userId) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Error')
                    .setDescription('You cannot remove the trip creator!')
                    .setFooter({
                        text: 'Your japan travel companion!',
                        iconURL: interaction.client.user.displayAvatarURL()
                    })
                    .setTimestamp();
                return await interaction.editReply({ embeds: [embed] });
            }

            users.splice(users.indexOf(targetUserId), 1);
            await trips.updateOne({ tripId: sanitizedTripId }, { $set: { users } });
            await activeTrips.deleteOne({ userId: targetUserId, tripId: sanitizedTripId });

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('User Removed')
                .setDescription(`Removed <@${targetUserId}> from **${activeTrip.name}**!`)
                .setFooter({
                    text: 'Your japan travel companion!',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
            await interaction.editReply({ embeds: [embed] });
        } else if (subcommand === 'delete') {
            const userTrips = await trips.find({ userId }).toArray();
            if (userTrips.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Error')
                    .setDescription('You have no trips to delete!')
                    .setFooter({
                        text: 'Your japan travel companion!',
                        iconURL: interaction.client.user.displayAvatarURL()
                    })
                    .setTimestamp();
                return await interaction.editReply({ embeds: [embed] });
            }

            const tripOptions = userTrips.map(trip => ({
                label: trip.name,
                value: trip.tripId,
                description: `ID: ${trip.tripId}`
            }));

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('delete_trip_select')
                .setPlaceholder('Select a trip to delete')
                .addOptions(tripOptions.slice(0, 25)); // Discord limits to 25 options

            const row = new ActionRowBuilder().addComponents(selectMenu);

            const embed = new EmbedBuilder()
                .setColor('#FF4500')
                .setTitle('Delete a Trip')
                .setDescription('Select a trip from the dropdown below to delete it. Only trips you created are shown.')
                .setFooter({
                    text: 'Your japan travel companion!',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed], components: [row] });
        }
    },
};