const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('View bot statistics'),
    async execute(interaction, { trips, activeTrips }, client) {
        const totalTripsCount = await trips.countDocuments();
        const activeTripsCount = await activeTrips.countDocuments();
        const uniqueUsers = (await trips.distinct('userId')).length;
        const guildCount = await client.shard.fetchClientValues('guilds.cache.size').then(results => results.reduce((acc, val) => acc + val, 0));
        const shardCount = client.shard.count;
        const currentShard = client.shard.ids[0];
        const latency = client.ws.ping;
        const uptime = Math.floor((Date.now() - client.startTime) / 1000); // Seconds

        const formatUptime = (seconds) => {
            const days = Math.floor(seconds / (3600 * 24));
            const hours = Math.floor((seconds % (3600 * 24)) / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            return `${days}d ${hours}h ${minutes}m`;
        };

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('Bot Statistics')
            .setThumbnail(client.user.displayAvatarURL())
            .addFields(
                { name: 'Total Trips', value: `${totalTripsCount}`, inline: true },
                { name: 'Active Trips', value: `${activeTripsCount}`, inline: true },
                { name: 'Unique Trip Creators', value: `${uniqueUsers}`, inline: true },
                { name: 'Servers', value: `${guildCount}`, inline: true },
                { name: 'Shards', value: `${shardCount}`, inline: true },
                { name: 'Current Shard', value: `${currentShard}`, inline: true },
                { name: 'Latency', value: `${latency}ms`, inline: true },
                { name: 'Uptime', value: formatUptime(uptime), inline: true }
            )
            .setTimestamp();
        await interaction.editReply({ embeds: [embed] });
    },
};