require('dotenv').config();

const { Client, Events, GatewayIntentBits } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (readyClient: any) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
