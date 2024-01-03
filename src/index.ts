const path = require('path');

import { nanoid } from 'nanoid';

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { dynamo } = require('./apis/aws');

const { Client, Events, GatewayIntentBits, Partials } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessageReactions],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

const check_if_exists = async (params: any) => {
    const exists = await dynamo.get_item(params);

    return exists.Item ? true : false;
};

/* ====================
    When the bot joins a server
==================== */
client.on(Events.GuildCreate, async (guild: any) => {
    try {
        // Generate an invite URL
        const invite = await guild.invites.create(guild.systemChannel.id);

        // Add the guild
        await dynamo.put_item({
            TableName: 'turbot_guilds',
            Item: {
                id: guild.id,
                icon_url: guild.iconURL(),
                name: guild.name,
                active: true,
                invite_url: invite.url,
            },
        });
    } catch {}

    try {
        // Add the emoji to the server
        const exists = guild.emojis.cache.find(({ name }) => name === 'turbot');

        if (!exists) await guild.emojis.create({ attachment: './src/img/emoji.png', name: 'turbot' });
    } catch {}
});

/* ====================
    When the bot is kicked from a server
==================== */
client.on(Events.GuildDelete, async (guild: any) => {
    try {
        // Disable the guild
        await dynamo.update_item({
            TableName: 'turbot_guilds',
            Item: {
                id: guild.id,
                icon_url: guild.iconURL(),
                name: guild.name,
                active: false,
            },
            Key: {
                id: guild.id,
            },
            UpdateExpression: 'set active = :active',
            ExpressionAttributeValues: {
                ':active': false,
            },
        });
    } catch {}
});

/* ====================
    When a user adds a reaction
==================== */
client.on(Events.MessageReactionAdd, async (reaction: any) => {
    if (reaction.emoji.name !== 'turbot') return;

    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch {
            return;
        }
    }

    try {
        const turbot_count = reaction.count > reaction.message.guild.memberCount ? reaction.message.guild.memberCount : reaction.count;

        const exists = await check_if_exists({
            TableName: 'turbot_messages',
            Key: {
                id: reaction.message.id,
            },
        });

        if (exists) {
            // Update the count
            await dynamo.update_item({
                TableName: 'turbot_messages',
                Key: {
                    id: reaction.message.id,
                },
                UpdateExpression: 'set turbot_count = :turbot_count',
                ExpressionAttributeValues: {
                    ':turbot_count': turbot_count,
                },
            });

            return;
        }

        const turbot_id = nanoid();

        // Add the message
        await dynamo.put_item({
            TableName: 'turbot_messages',
            Item: {
                id: reaction.message.id,
                guild_id: reaction.message.guildId,
                created_at: reaction.message.createdTimestamp,
                content: reaction.message.content,
                author_id: reaction.message.author.id,
                turbot_count,
                turbot_id,
            },
        });

        // Add the author
        await dynamo.put_item({
            TableName: 'turbot_authors',
            Item: {
                avatar_url: reaction.message.author.avatarURL(),
                id: reaction.message.author.id,
                name: reaction.message.author.globalName || reaction.message.author.username,
            },
        });
    } catch {}
});

/* ====================
    When a user removes a reaction
==================== */
client.on(Events.MessageReactionRemove, async (reaction: any) => {
    if (reaction.emoji.name !== 'turbot') return;

    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch {
            return;
        }
    }

    const turbot_count = reaction.count > reaction.message.guild.memberCount ? reaction.message.guild.memberCount : reaction.count;

    if (turbot_count === 0) {
        try {
            await dynamo.delete_item({
                TableName: 'turbot_messages',
                Key: {
                    id: reaction.message.id,
                },
            });

            return;
        } catch {}
    }

    try {
        // Update the count
        await dynamo.update_item({
            TableName: 'turbot_messages',
            Key: {
                id: reaction.message.id,
            },
            UpdateExpression: 'set turbot_count = :turbot_count',
            ExpressionAttributeValues: {
                ':turbot_count': turbot_count,
            },
        });
    } catch {}
});

/* ====================
    When a message is updated
==================== */
client.on(Events.MessageUpdate, async (old_message: any, new_message: any) => {
    try {
        const turbot_reaction = new_message.reactions.cache.find(e => e.emoji.name === 'turbot');

        // TODO: Debug why sometimes it drops reactions (most likely caused by old messages not in the cache)
        if (!turbot_reaction) return;

        // Update the message
        await dynamo.update_item({
            TableName: 'turbot_messages',
            Key: {
                id: new_message.id,
            },
            UpdateExpression: 'set content = :content',
            ExpressionAttributeValues: {
                ':content': new_message.content,
            },
        });
    } catch {}
});

/* ====================
    When a message is deleted
==================== */
client.on(Events.MessageDelete, async (message: any) => {
    try {
        const turbot_reaction = message.reactions.cache.find(e => e.emoji.name === 'turbot');

        if (!turbot_reaction) return;

        await dynamo.delete_item({
            TableName: 'turbot_messages',
            Key: {
                id: message.id,
            },
        });
    } catch {}
});

client.login(process.env.DISCORD_TOKEN);
