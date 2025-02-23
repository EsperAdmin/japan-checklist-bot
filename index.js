//Add required classes to the file.
const { Client, Events, GatewayIntentBits } = require('discord.js');
const { DiscordToken } = require('./config.json');

//Create a client instance.
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

//Ready client.
client.once(Events.ClientReady, readyClient => {
    console.log(`Booted up and ready! Beltalowda! ${readyClient.user.tag}`);
})

//Log in with Discord token.
client.login(DiscordToken);
