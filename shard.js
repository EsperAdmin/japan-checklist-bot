const { ShardingManager } = require('discord.js');
require('dotenv').config();

const manager = new ShardingManager('./index.js', {
    token: process.env.DISCORD_TOKEN,
    totalShards: 'auto', // 'auto' or set a specific number
});

manager.on('shardCreate', shard => {
    console.log(`Launched shard ${shard.id}`);
});

manager.spawn().catch(console.error);