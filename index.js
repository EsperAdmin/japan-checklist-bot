const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { MongoClient } = require('mongodb');
require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const mongoClient = new MongoClient(process.env.MONGO_URI);
client.commands = new Collection();
let db;

async function connectMongo() {
    await mongoClient.connect();
    db = mongoClient.db('checklist_bot');
    console.log('Connected to MongoDB');
}

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag} (Shard ${client.shard.ids[0]})`);
    await connectMongo();
    await loadCommands();
    client.startTime = Date.now();
});

async function loadCommands() {
    const commandsPath = path.join(__dirname, 'commands');
    const commandFiles = await fs.readdir(commandsPath);
    const commands = [];

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
    }

    await client.application.commands.set(commands);
    console.log(`Registered ${commands.length} slash commands on Shard ${client.shard.ids[0]}!`);
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand() && !interaction.isButton()) return;

    const trips = db.collection('trips');
    const activeTrips = db.collection('activeTrips');
    const requests = db.collection('requests');
    const blacklist = db.collection('blacklist');

    if (await blacklist.findOne({ userId: interaction.user.id })) {
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('Access Denied')
            .setDescription('You are blacklisted from using this bot.');
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        await interaction.deferReply();
        try {
            await command.execute(interaction, { trips, activeTrips, requests, blacklist }, client);
        } catch (error) {
            console.error(error);
            const { EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription('An error occurred while executing the command.');
            await interaction.editReply({ embeds: [embed] });
        }
    } else if (interaction.isButton()) {
        const [action, type, id, page] = interaction.customId.split('_');
        const currentPage = parseInt(page);

        if (type === 'trip') {
            const trip = await trips.findOne({ tripId: id });
            if (!trip || !trip.users.includes(interaction.user.id)) {
                const { EmbedBuilder } = require('discord.js');
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Error')
                    .setDescription('Trip not found or you don\'t have access!');
                return await interaction.update({ embeds: [embed], components: [] });
            }

            const itemsPerPage = 10;
            const items = trip.items;
            const totalPages = Math.ceil(items.length / itemsPerPage);
            let newPage = currentPage;
            if (action === 'prev' && newPage > 1) newPage--;
            if (action === 'next' && newPage < totalPages) newPage++;

            const start = (newPage - 1) * itemsPerPage;
            const end = start + itemsPerPage;
            const paginatedItems = items.slice(start, end).map(i => `${i.id}. ${i.name} ${i.complete ? '[✓]' : '[ ]'}`).join('\n') || 'None';
            const users = trip.users.map(u => `<@${u}>`).join(', ');

            const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
            const embed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle(`${trip.name}`)
                .setDescription(`Trip ID: ${trip.tripId}`)
                .addFields(
                    { name: 'Users', value: users, inline: true },
                    { name: 'Items', value: paginatedItems },
                    { name: 'Page', value: `${newPage}/${totalPages}`, inline: true }
                );

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId(`prev_trip_${id}_${newPage}`).setLabel('Previous').setStyle(ButtonStyle.Primary).setDisabled(newPage === 1),
                    new ButtonBuilder().setCustomId(`next_trip_${id}_${newPage}`).setLabel('Next').setStyle(ButtonStyle.Primary).setDisabled(newPage === totalPages)
                );

            await interaction.update({ embeds: [embed], components: items.length > itemsPerPage ? [buttons] : [] });
        } else if (type === 'request') {
            const request = await requests.findOne({ requestId: id, targetUserId: interaction.user.id });
            if (!request) {
                const { EmbedBuilder } = require('discord.js');
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Error')
                    .setDescription('Request not found or not for you!');
                return await interaction.update({ embeds: [embed], components: [] });
            }

            const trip = await trips.findOne({ tripId: request.tripId });
            const { EmbedBuilder } = require('discord.js');
            if (action === 'accept') {
                await trips.updateOne({ tripId: trip.tripId }, { $push: { users: interaction.user.id } });
                await requests.deleteOne({ requestId: id });
                const embed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('Request Accepted')
                    .setDescription(`You’ve joined **${trip.name}**!`);
                await interaction.update({ embeds: [embed], components: [] });
            } else if (action === 'decline') {
                await requests.deleteOne({ requestId: id });
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Request Declined')
                    .setDescription(`You’ve declined to join **${trip.name}**.`);
                await interaction.update({ embeds: [embed], components: [] });
            }
        } else if (type === 'list') {
            const userId = id;
            const userTrips = await trips.find({ users: userId }).toArray();
            const activeTripEntry = await activeTrips.findOne({ userId });
            const activeTripId = activeTripEntry ? activeTripEntry.tripId : null;
            const tripsPerPage = 10;
            const totalPages = Math.ceil(userTrips.length / tripsPerPage);
            let newPage = currentPage;
            if (action === 'prev' && newPage > 1) newPage--;
            if (action === 'next' && newPage < totalPages) newPage++;

            const start = (newPage - 1) * tripsPerPage;
            const end = start + tripsPerPage;
            const paginatedTrips = userTrips.slice(start, end)
                .map((t, i) => `${start + i + 1}. ${t.name} (ID: ${t.tripId}) ${t.tripId === activeTripId ? '[Active]' : ''}`)
                .join('\n') || 'None';

            const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
            const embed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle('Your Trips')
                .setDescription(paginatedTrips)
                .addFields({ name: 'Page', value: `${newPage}/${totalPages}`, inline: true });

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId(`prev_list_${userId}_${newPage}`).setLabel('Previous').setStyle(ButtonStyle.Primary).setDisabled(newPage === 1),
                    new ButtonBuilder().setCustomId(`next_list_${userId}_${newPage}`).setLabel('Next').setStyle(ButtonStyle.Primary).setDisabled(newPage === totalPages)
                );

            await interaction.update({ embeds: [embed], components: userTrips.length > tripsPerPage ? [buttons] : [] });
        } else if (type === 'alltrips') {
            const allTrips = await trips.find({}).toArray();
            const tripsPerPage = 10;
            const totalPages = Math.ceil(allTrips.length / tripsPerPage);
            let newPage = currentPage;
            if (action === 'prev' && newPage > 1) newPage--;
            if (action === 'next' && newPage < totalPages) newPage++;

            const start = (newPage - 1) * tripsPerPage;
            const end = start + tripsPerPage;
            const paginatedTrips = allTrips.slice(start, end)
                .map((t, i) => `${start + i + 1}. ${t.name} (ID: ${t.tripId}, Creator: <@${t.userId}>)`)
                .join('\n') || 'None';

            const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
            const embed = new EmbedBuilder()
                .setColor('#FF00FF')
                .setTitle('All Trips')
                .setDescription(paginatedTrips)
                .addFields({ name: 'Page', value: `${newPage}/${totalPages}`, inline: true });

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId(`prev_alltrips_all_${newPage}`).setLabel('Previous').setStyle(ButtonStyle.Primary).setDisabled(newPage === 1),
                    new ButtonBuilder().setCustomId(`next_alltrips_all_${newPage}`).setLabel('Next').setStyle(ButtonStyle.Primary).setDisabled(newPage === totalPages)
                );

            await interaction.update({ embeds: [embed], components: allTrips.length > tripsPerPage ? [buttons] : [] });
        } else if (type === 'blacklist') {
            const blacklistedUsers = await blacklist.find({}).toArray();
            const usersPerPage = 10;
            const totalPages = Math.ceil(blacklistedUsers.length / usersPerPage);
            let newPage = currentPage;
            if (action === 'prev' && newPage > 1) newPage--;
            if (action === 'next' && newPage < totalPages) newPage++;

            const start = (newPage - 1) * usersPerPage;
            const end = start + usersPerPage;
            const paginatedUsers = blacklistedUsers.slice(start, end)
                .map((u, i) => `${start + i + 1}. <@${u.userId}> (ID: ${u.userId})`)
                .join('\n') || 'None';

            const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Blacklisted Users')
                .setDescription(paginatedUsers)
                .addFields({ name: 'Page', value: `${newPage}/${totalPages}`, inline: true });

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setCustomId(`prev_blacklist_all_${newPage}`).setLabel('Previous').setStyle(ButtonStyle.Primary).setDisabled(newPage === 1),
                    new ButtonBuilder().setCustomId(`next_blacklist_all_${newPage}`).setLabel('Next').setStyle(ButtonStyle.Primary).setDisabled(newPage === totalPages)
                );

            await interaction.update({ embeds: [embed], components: blacklistedUsers.length > usersPerPage ? [buttons] : [] });
        } else if (type === 'help') {
            const userId = id;
            if (interaction.user.id !== userId) return;

            const commands = [
                { name: '/active', description: 'Set a trip as your active trip using its ID.' },
                { name: '/add', description: 'Add an item to your active trip’s checklist (max 25 items).' },
                { name: '/adduser', description: 'Send a request to add a user to your active trip.' },
                { name: '/alltrips', description: 'Owner-only: View/manage all trips across the bot.' },
                { name: '/blacklist', description: 'Owner-only: Add/remove users from the bot blacklist.' },
                { name: '/blacklistview', description: 'Owner-only: View the list of blacklisted users.' },
                { name: '/complete', description: 'Mark an item as complete in your active trip.' },
                { name: '/create', description: 'Create a new trip (max 10 per user) and set it as active.' },
                { name: '/delete', description: 'Delete a trip by ID (creator only).' },
                { name: '/japan', description: 'Get a random image of Japan from Unsplash.' },
                { name: '/list', description: 'List all your trips with pagination.' },
                { name: '/remove', description: 'Remove an item from your active trip’s checklist.' },
                { name: '/removeuser', description: 'Remove a user from your active trip.' },
                { name: '/requests', description: 'View and accept/decline trip join requests.' },
                { name: '/stats', description: 'View bot statistics (e.g., active trips, servers).' },
                { name: '/uncomplete', description: 'Mark an item as incomplete in your active trip.' },
                { name: '/view', description: 'View your active trip or a specific trip by name.' }
            ];

            const commandsPerPage = 5;
            const totalPages = Math.ceil(commands.length / commandsPerPage);
            let newPage = currentPage;
            if (action === 'prev' && newPage > 1) newPage--;
            if (action === 'next' && newPage < totalPages) newPage++;

            const start = (newPage - 1) * commandsPerPage;
            const end = start + commandsPerPage;
            const paginatedCommands = commands.slice(start, end);

            const commandList = paginatedCommands.map(cmd => `**${cmd.name}**\n${cmd.description}`).join('\n\n');

            const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
            const embed = new EmbedBuilder()
                .setColor('#1ABC9C')
                .setTitle('Checklist Bot Help')
                .setDescription(commandList)
                .addFields({ name: 'Page', value: `${newPage}/${totalPages}`, inline: true })
                .setFooter({
                    text: 'This is an open-source Discord bot created with Grok 3 by xAI.',
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`prev_help_${userId}_${newPage}`)
                        .setLabel('Previous')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(newPage === 1),
                    new ButtonBuilder()
                        .setCustomId(`next_help_${userId}_${newPage}`)
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(newPage === totalPages)
                );

            await interaction.update({
                embeds: [embed],
                components: commands.length > commandsPerPage ? [buttons] : []
            });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);