const { Client, GatewayIntentBits, Collection, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const { MongoClient } = require('mongodb');
const { RateLimiterMemory } = require('rate-limiter-flexible');
require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const mongoSanitize = require('mongo-sanitize');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const mongoClient = new MongoClient(process.env.MONGO_URI);
client.commands = new Collection();
let db;
let disallowedWords;

const rateLimiter = new RateLimiterMemory({ points: 10, duration: 60 });

async function connectMongo() {
    try {
        await mongoClient.connect();
        db = mongoClient.db('checklist_bot');
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection failed:', error);
        process.exit(1);
    }
}

async function loadDisallowedWords() {
    try {
        const data = await fs.readFile(path.join(__dirname, 'disallowedWords.json'), 'utf8');
        disallowedWords = JSON.parse(data);
    } catch (error) {
        console.error('Failed to load disallowedWords.json:', error);
        disallowedWords = [];
    }
}

async function loadCommands() {
    const commandsPath = path.join(__dirname, 'commands');
    const commandFolders = await fs.readdir(commandsPath, { withFileTypes: true });

    const commands = [];

    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder.name);
        if (folder.isDirectory()) {
            const commandFiles = await fs.readdir(folderPath);
            for (const file of commandFiles) {
                if (file.endsWith('.js')) {
                    const filePath = path.join(folderPath, file);
                    const command = require(filePath);
                    client.commands.set(command.data.name, command);
                    commands.push(command.data.toJSON());
                }
            }
        } else if (folder.name.endsWith('.js')) {
            const filePath = path.join(commandsPath, folder.name);
            const command = require(filePath);
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());
        }
    }

    await client.application.commands.set(commands);
    console.log(`Registered ${commands.length} slash commands on Shard ${client.shard.ids[0]}!`);
}

const requiredEnv = ['DISCORD_TOKEN', 'MONGO_URI', 'BOT_OWNER_ID'];
requiredEnv.forEach(key => {
    if (!process.env[key]) {
        console.error(`Missing environment variable: ${key}`);
        process.exit(1);
    }
});

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag} (Shard ${client.shard.ids[0]})`);
    await connectMongo();
    await loadDisallowedWords();
    await loadCommands();
    client.startTime = Date.now();
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand() && !interaction.isButton() && !interaction.isStringSelectMenu()) return;

    const trips = db.collection('trips');
    const activeTrips = db.collection('activeTrips');
    const requests = db.collection('requests');
    const blacklist = db.collection('blacklist');

    if (await blacklist.findOne({ userId: mongoSanitize(interaction.user.id) })) {
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('Error')
            .setDescription('You cannot use this bot at this time.');
        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await rateLimiter.consume(interaction.user.id);
        } catch {
            const { EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Rate Limit Exceeded')
                .setDescription('Slow down! Too many commands.');
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        await interaction.deferReply();
        try {
            await command.execute(interaction, { trips, activeTrips, requests, blacklist, disallowedWords }, client);
        } catch (error) {
            console.error(`Command ${interaction.commandName} failed:`, error);
            const { EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error')
                .setDescription(error.name === 'MongoError' ? 'Database issue, try later.' : 'Command failed.');
            await interaction.editReply({ embeds: [embed] });
        }
    } else if (interaction.isButton()) {
        const [action, type, id, page] = interaction.customId.split('_');
        const currentPage = parseInt(page);

        if (type === 'trip') {
            const trip = await trips.findOne({ tripId: mongoSanitize(id) });
            if (!trip || !trip.users.includes(interaction.user.id)) {
                const { EmbedBuilder } = require('discord.js');
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Error')
                    .setDescription('Trip not found or you don’t have permission!');
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
            const request = await requests.findOne({ requestId: mongoSanitize(id), targetUserId: interaction.user.id });
            if (!request) {
                const { EmbedBuilder } = require('discord.js');
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Error')
                    .setDescription('Request not found or not for you!');
                return await interaction.update({ embeds: [embed], components: [] });
            }

            const trip = await trips.findOne({ tripId: mongoSanitize(request.tripId) });
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
            const userId = mongoSanitize(id);
            if (interaction.user.id !== userId) return;
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
        } else if (type === 'admin') {
            if (interaction.user.id !== process.env.BOT_OWNER_ID) {
                const { EmbedBuilder } = require('discord.js');
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Error')
                    .setDescription('Owner-only interaction!');
                return await interaction.update({ embeds: [embed], components: [] });
            }

            if (id === 'alltrips') {
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
                        new ButtonBuilder().setCustomId(`prev_admin_alltrips_${newPage}`).setLabel('Previous').setStyle(ButtonStyle.Primary).setDisabled(newPage === 1),
                        new ButtonBuilder().setCustomId(`next_admin_alltrips_${newPage}`).setLabel('Next').setStyle(ButtonStyle.Primary).setDisabled(newPage === totalPages)
                    );

                await interaction.update({ embeds: [embed], components: allTrips.length > tripsPerPage ? [buttons] : [] });
            } else if (id === 'blacklistview') {
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
                        new ButtonBuilder().setCustomId(`prev_admin_blacklistview_${newPage}`).setLabel('Previous').setStyle(ButtonStyle.Primary).setDisabled(newPage === 1),
                        new ButtonBuilder().setCustomId(`next_admin_blacklistview_${newPage}`).setLabel('Next').setStyle(ButtonStyle.Primary).setDisabled(newPage === totalPages)
                    );

                await interaction.update({ embeds: [embed], components: blacklistedUsers.length > usersPerPage ? [buttons] : [] });
            }
        } else if (type === 'help') {
            const userId = mongoSanitize(id);
            if (interaction.user.id !== userId) return;

            const commands = [
                { name: '/active', description: 'Set a trip as your active trip using its ID.' },
                { name: '/add', description: 'Add an item to your active trip’s checklist (max 25 items).' },
                { name: '/admin', description: 'Owner-only: Manage trips and blacklist (subcommands: alltrips, blacklist, blacklistview).' },
                { name: '/create', description: 'Create a new trip (max 10 per user) and set it as active.' },
                { name: '/japan', description: 'Get a random image of Japan from Unsplash.' },
                { name: '/list', description: 'List all your trips with pagination.' },
                { name: '/manage', description: 'Modify your active trip (subcommands: complete, remove, uncomplete, adduser, removeuser, delete).' },
                { name: '/requests', description: 'View and accept/decline trip join requests.' },
                { name: '/stats', description: 'View bot statistics (e.g., active trips, servers).' },
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
    } else if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'delete_trip_select') {
            const tripId = mongoSanitize(interaction.values[0]);
            const userId = mongoSanitize(interaction.user.id);

            const trip = await trips.findOne({ tripId, userId });
            if (!trip) {
                const { EmbedBuilder } = require('discord.js');
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('Error')
                    .setDescription('Trip not found or you’re not the creator!');
                return await interaction.update({ embeds: [embed], components: [] });
            }

            await trips.deleteOne({ tripId });
            await activeTrips.deleteMany({ tripId });

            const { EmbedBuilder } = require('discord.js');
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('Trip Deleted')
                .setDescription(`Trip **${trip.name}** (ID: ${tripId}) has been deleted!`);
            await interaction.update({ embeds: [embed], components: [] });
        } 
    } 
});

client.login(process.env.DISCORD_TOKEN);