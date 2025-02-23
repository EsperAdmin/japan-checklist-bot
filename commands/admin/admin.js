const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const mongoSanitize = require('mongo-sanitize');
const { validate: uuidValidate } = require('uuid');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('Owner-only administration commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('alltrips')
                .setDescription('View and manage all trips')
                .addStringOption(option => option.setName('trip_id').setDescription('Trip ID to manage (optional)'))
                .addStringOption(option => option.setName('action').setDescription('Action: delete, adduser, removeuser (optional)'))
                .addUserOption(option => option.setName('user').setDescription('User to add/remove (if applicable)'))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('blacklist')
                .setDescription('Add or remove a user from the blacklist')
                .addStringOption(option => option.setName('action').setDescription('Action: add or remove').setRequired(true))
                .addUserOption(option => option.setName('user').setDescription('User to add/remove').setRequired(true))
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('blacklistview')
                .setDescription('View the current blacklist')
        ),
    async execute(interaction, { trips, activeTrips, blacklist }) {
        const ownerId = process.env.BOT_OWNER_ID;
        if (interaction.user.id !== ownerId) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('This command is restricted to the bot owner!')
                .setFooter({
                    text: 'Your japan travel companion!',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();
            return await interaction.editReply({ embeds: [embed] });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'alltrips') {
            const tripId = mongoSanitize(interaction.options.getString('trip_id'));
            const action = interaction.options.getString('action');
            const user = interaction.options.getUser('user');

            if (tripId && action) {
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

                const trip = await trips.findOne({ tripId });
                if (!trip) {
                    const embed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('Error')
                        .setDescription(`Trip ID ${tripId} not found!`)
                        .setFooter({
                            text: 'Your japan travel companion!',
                            iconURL: interaction.client.user.displayAvatarURL()
                        })
                        .setTimestamp();
                    return await interaction.editReply({ embeds: [embed] });
                }

                if (action === 'delete') {
                    await trips.deleteOne({ tripId });
                    await activeTrips.deleteMany({ tripId });
                    const embed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('Trip Deleted')
                        .setDescription(`Trip **${trip.name}** (ID: ${tripId}) has been deleted!`)
                        .setFooter({
                            text: 'Your japan travel companion!',
                            iconURL: interaction.client.user.displayAvatarURL()
                        })
                        .setTimestamp();
                    return await interaction.editReply({ embeds: [embed] });
                } else if (action === 'adduser' && user) {
                    if (trip.users.includes(user.id)) {
                        const embed = new EmbedBuilder()
                            .setColor('#FFA500')
                            .setTitle('Warning')
                            .setDescription(`<@${user.id}> is already in **${trip.name}**!`)
                            .setFooter({
                                text: 'Your japan travel companion!',
                                iconURL: interaction.client.user.displayAvatarURL()
                            })
                            .setTimestamp();
                        return await interaction.editReply({ embeds: [embed] });
                    }
                    await trips.updateOne({ tripId }, { $push: { users: mongoSanitize(user.id) } });
                    const embed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('User Added')
                        .setDescription(`Added <@${user.id}> to **${trip.name}** (ID: ${tripId})!`)
                        .setFooter({
                            text: 'Your japan travel companion!',
                            iconURL: interaction.client.user.displayAvatarURL()
                        })
                        .setTimestamp();
                    return await interaction.editReply({ embeds: [embed] });
                } else if (action === 'removeuser' && user) {
                    if (!trip.users.includes(user.id)) {
                        const embed = new EmbedBuilder()
                            .setColor('#FF0000')
                            .setTitle('Error')
                            .setDescription(`<@${user.id}> is not in **${trip.name}**!`)
                            .setFooter({
                                text: 'Your japan travel companion!',
                                iconURL: interaction.client.user.displayAvatarURL()
                            })
                            .setTimestamp();
                        return await interaction.editReply({ embeds: [embed] });
                    }
                    if (user.id === trip.userId) {
                        const embed = new EmbedBuilder()
                            .setColor('#FF0000')
                            .setTitle('Error')
                            .setDescription('Cannot remove the trip creator!')
                            .setFooter({
                                text: 'Your japan travel companion!',
                                iconURL: interaction.client.user.displayAvatarURL()
                            })
                            .setTimestamp();
                        return await interaction.editReply({ embeds: [embed] });
                    }
                    await trips.updateOne({ tripId }, { $pull: { users: mongoSanitize(user.id) } });
                    await activeTrips.deleteOne({ userId: mongoSanitize(user.id), tripId });
                    const embed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('User Removed')
                        .setDescription(`Removed <@${user.id}> from **${trip.name}** (ID: ${tripId})!`)
                        .setFooter({
                            text: 'Your japan travel companion!',
                            iconURL: interaction.client.user.displayAvatarURL()
                        })
                        .setTimestamp();
                    return await interaction.editReply({ embeds: [embed] });
                } else {
                    const embed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('Error')
                        .setDescription('Invalid action or missing user! Use: delete, adduser, removeuser.')
                        .setFooter({
                            text: 'Your japan travel companion!',
                            iconURL: interaction.client.user.displayAvatarURL()
                        })
                        .setTimestamp();
                    return await interaction.editReply({ embeds: [embed] });
                }
            }

            const allTrips = await trips.find({}).toArray();
            const tripsPerPage = 10;
            const totalPages = Math.ceil(allTrips.length / tripsPerPage);
            const paginatedTrips = allTrips.slice(0, tripsPerPage)
                .map((t, i) => `${i + 1}. ${t.name} (ID: ${t.tripId}, Creator: <@${t.userId}>)`)
                .join('\n') || 'None';

            const embed = new EmbedBuilder()
                .setColor('#FF00FF')
                .setTitle('All Trips')
                .setDescription(paginatedTrips)
                .addFields({ name: 'Page', value: `1/${totalPages}`, inline: true });

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId(`prev_admin_alltrips_1`).setLabel('Previous').setStyle(ButtonStyle.Primary).setDisabled(true),
                    new ButtonBuilder().setCustomId(`next_admin_alltrips_1`).setLabel('Next').setStyle(ButtonStyle.Primary).setDisabled(totalPages <= 1)
                );

            await interaction.editReply({
                embeds: [embed],
                components: allTrips.length > tripsPerPage ? [buttons] : []
            });
        } else if (subcommand === 'blacklist') {
            const action = interaction.options.getString('action').toLowerCase();
            const user = interaction.options.getUser('user');
            const userId = mongoSanitize(user.id);

            if (action === 'add') {
                if (await blacklist.findOne({ userId })) {
                    const embed = new EmbedBuilder()
                        .setColor('#FFA500')
                        .setTitle('Warning')
                        .setDescription(`<@${userId}> is already blacklisted!`)
                        .setFooter({
                            text: 'Your japan travel companion!',
                            iconURL: interaction.client.user.displayAvatarURL()
                        })
                        .setTimestamp();
                    return await interaction.editReply({ embeds: [embed] });
                }
                await blacklist.insertOne({ userId });
                const embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('User Blacklisted')
                    .setDescription(`<@${userId}> (ID: ${userId}) has been added to the blacklist!`)
                    .setFooter({
                        text: 'Your japan travel companion!',
                        iconURL: interaction.client.user.displayAvatarURL()
                    })
                    .setTimestamp();
                await interaction.editReply({ embeds: [embed] });
            } else if (action === 'remove') {
                if (!await blacklist.findOne({ userId })) {
                    const embed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('Error')
                        .setDescription(`<@${userId}> is not blacklisted!`)
                        .setFooter({
                            text: 'Your japan travel companion!',
                            iconURL: interaction.client.user.displayAvatarURL()
                        })
                        .setTimestamp();
                    return await interaction.editReply({ embeds: [embed] });
                }
                await blacklist.deleteOne({ userId });
                const embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('User Removed from Blacklist')
                    .setDescription(`<@${userId}> (ID: ${userId}) has been removed from the blacklist!`)
                    .setFooter({
                        text: 'Your japan travel companion!',
                        iconURL: interaction.client.user.displayAvatarURL()
                    })
                    .setTimestamp();
                await interaction.editReply({ embeds: [embed] });
            } else {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Error')
                    .setDescription('Invalid action! Use: add or remove.')
                    .setFooter({
                        text: 'Your japan travel companion!',
                        iconURL: interaction.client.user.displayAvatarURL()
                    })
                    .setTimestamp();
                await interaction.editReply({ embeds: [embed] });
            }
        } else if (subcommand === 'blacklistview') {
            const blacklistedUsers = await blacklist.find({}).toArray();
            const usersPerPage = 10;
            const totalPages = Math.ceil(blacklistedUsers.length / usersPerPage);
            const paginatedUsers = blacklistedUsers.slice(0, usersPerPage)
                .map((u, i) => `${i + 1}. <@${u.userId}> (ID: ${u.userId})`)
                .join('\n') || 'None';

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Blacklisted Users')
                .setDescription(paginatedUsers)
                .addFields({ name: 'Page', value: `1/${totalPages}`, inline: true })                .setFooter({
                    text: 'Your japan travel companion!',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId(`prev_admin_blacklistview_1`).setLabel('Previous').setStyle(ButtonStyle.Primary).setDisabled(true),
                    new ButtonBuilder().setCustomId(`next_admin_blacklistview_1`).setLabel('Next').setStyle(ButtonStyle.Primary).setDisabled(totalPages <= 1)
                );

            await interaction.editReply({
                embeds: [embed],
                components: blacklistedUsers.length > usersPerPage ? [buttons] : []
            });
        }
    },
};