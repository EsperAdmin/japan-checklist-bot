const { ShardingManager } = require('discord.js');
require('dotenv').config();

const manager = new ShardingManager('./index.js', {
    token: process.env.DISCORD_TOKEN,
    totalShards: 'auto',
});

manager.on('shardCreate', shard => {
    console.log(`Launched shard ${shard.id}`);
    shard.on('error', error => {
        console.error(`Shard ${shard.id} encountered an error:`, error);
    });
    shard.on('disconnect', () => {
        console.warn(`Shard ${shard.id} disconnected`);
    });
    shard.on('reconnecting', () => {
        console.log(`Shard ${shard.id} reconnecting`);
    });
});

manager.spawn().catch(error => {
    console.error('Failed to spawn shards:', error);
    process.exit(1);
});