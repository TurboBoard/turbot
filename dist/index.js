var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
require('dotenv').config();
const { dynamo } = require('./apis/aws');
const { Client, Events, GatewayIntentBits, Partials } = require('discord.js');
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessageReactions],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});
/* ====================
    When the bot joins a server
==================== */
client.on(Events.GuildCreate, (guild) => __awaiter(this, void 0, void 0, function* () {
    try {
        // Add the guild
        yield dynamo.put_item({
            TableName: 'turbot_guilds',
            Item: {
                id: guild.id,
                icon_url: guild.iconURL(),
                name: guild.name,
                active: true,
            },
        });
    }
    catch (_a) { }
    try {
        // Add the emoji to the server
        const exists = guild.emojis.cache.find(({ name }) => name === 'turbot');
        if (!exists)
            yield guild.emojis.create({ attachment: './src/img/emoji.png', name: 'turbot' });
    }
    catch (_b) { }
}));
/* ====================
    When the bot is kicked from a server
==================== */
client.on(Events.GuildDelete, (guild) => __awaiter(this, void 0, void 0, function* () {
    try {
        // Disable the guild
        yield dynamo.update_item({
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
    }
    catch (_c) { }
}));
/* ====================
    When a user adds a reaction
==================== */
client.on(Events.MessageReactionAdd, (reaction) => __awaiter(this, void 0, void 0, function* () {
    if (reaction.emoji.name !== 'turbot')
        return;
    if (reaction.partial) {
        try {
            yield reaction.fetch();
        }
        catch (_d) {
            return;
        }
    }
    try {
        // Add the post
        yield dynamo.put_item({
            TableName: 'turbot_posts',
            Item: {
                id: reaction.message.id,
                guild_id: reaction.message.guildId,
                created_at: reaction.message.createdTimestamp,
                content: reaction.message.content,
                author_id: reaction.message.author.id,
                turbot_count: reaction.count,
            },
        });
        // Add the author
        yield dynamo.put_item({
            TableName: 'turbot_authors',
            Item: {
                avatar_url: reaction.message.author.avatarURL(),
                id: reaction.message.author.id,
                name: reaction.message.author.globalName || reaction.message.author.username,
            },
        });
    }
    catch (_e) { }
}));
/* ====================
    When a user removes a reaction
==================== */
client.on(Events.MessageReactionRemove, (reaction) => __awaiter(this, void 0, void 0, function* () {
    if (reaction.emoji.name !== 'turbot')
        return;
    if (reaction.partial) {
        try {
            yield reaction.fetch();
        }
        catch (_f) {
            return;
        }
    }
    const id = reaction.message.id;
    const turbot_count = reaction.count;
    if (turbot_count === 0) {
        try {
            yield dynamo.delete_item({
                TableName: 'turbot_posts',
                Key: {
                    id,
                },
            });
            return;
        }
        catch (_g) { }
    }
    try {
        yield dynamo.put_item({
            TableName: 'turbot_posts',
            Item: {
                id,
                guild_id: reaction.message.guildId,
                created_at: reaction.message.createdTimestamp,
                content: reaction.message.content,
                author_id: reaction.message.author.id,
                turbot_count,
            },
        });
    }
    catch (_h) { }
}));
/* ====================
    When a message is updated
==================== */
client.on(Events.MessageUpdate, (old_message, new_message) => __awaiter(this, void 0, void 0, function* () {
    try {
        const turbot_reaction = new_message.reactions.cache.find(e => e.emoji.name === 'turbot');
        // TODO: Debug why sometimes it drops reactions (most likely caused by old messages not in the cache)
        if (!turbot_reaction)
            return;
        // Update the post
        yield dynamo.update_item({
            TableName: 'turbot_posts',
            Key: {
                id: new_message.id,
            },
            UpdateExpression: 'set content = :content',
            ExpressionAttributeValues: {
                ':content': new_message.content,
            },
        });
    }
    catch (err) {
        console.log(err);
    }
}));
/* ====================
    When a message is deleted
==================== */
client.on(Events.MessageDelete, (message) => __awaiter(this, void 0, void 0, function* () {
    try {
        const turbot_reaction = message.reactions.cache.find(e => e.emoji.name === 'turbot');
        if (!turbot_reaction)
            return;
        yield dynamo.delete_item({
            TableName: 'turbot_posts',
            Key: {
                id: message.id,
            },
        });
    }
    catch (_j) { }
}));
client.login(process.env.DISCORD_TOKEN);
//# sourceMappingURL=index.js.map