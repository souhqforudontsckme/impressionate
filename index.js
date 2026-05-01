const { definePlugin } = require("@utils/types");
const { findByPropsLazy, findStoreLazy } = require("@webpack");
const { addMessage, receiveMessage } = require("@webpack/common");
const { getCurrentChannel } = require("@webpack/common");
const { getCurrentGuild } = require("@webpack/common");

const UserStore = findStoreLazy("UserStore");
const ChannelMessages = findStoreLazy("ChannelMessages");

module.exports = definePlugin({
    name: "Impersonate",
    description: "Send messages as another user with /impersonate command",
    authors: [{ name: "HalterwoxCord User" }],
    
    commands: [
        {
            name: "impersonate",
            description: "Send a fake message as another user",
            options: [
                {
                    name: "user",
                    description: "User ID or username to impersonate",
                    type: 3,
                    required: true
                },
                {
                    name: "message",
                    description: "Message content to send",
                    type: 3,
                    required: true
                }
            ],
            execute: async (args, ctx) => {
                const userId = args.user;
                const messageContent = args.message;
                
                let targetUser = UserStore.getUser(userId);
                
                if (!targetUser) {
                    const channelMessages = ChannelMessages.getMessages(ctx.channel.id);
                    if (channelMessages) {
                        const users = Object.values(channelMessages.users || {});
                        targetUser = users.find(u => 
                            u.username.toLowerCase().includes(userId.toLowerCase()) ||
                            u.tag?.toLowerCase().includes(userId.toLowerCase())
                        );
                    }
                }
                
                if (!targetUser) {
                    return {
                        content: `User "${userId}" not found!`,
                        flags: 64
                    };
                }
                
                const fakeMessage = {
                    id: `fake-${Date.now()}`,
                    channel_id: ctx.channel.id,
                    author: targetUser,
                    content: messageContent,
                    timestamp: new Date().toISOString(),
                    edited_timestamp: null,
                    tts: false,
                    mention_everyone: false,
                    mention_roles: [],
                    mention_channels: [],
                    attachments: [],
                    embeds: [],
                    reactions: [],
                    nonce: `fake-${Date.now()}`,
                    pinned: false,
                    webhook_id: null,
                    type: 0,
                    flags: 0
                };
                
                try {
                    receiveMessage(ctx.channel.id, fakeMessage);
                    return {
                        content: `✓ Impersonated ${targetUser.username}: ${messageContent}`,
                        flags: 64
                    };
                } catch (e) {
                    return {
                        content: `Error: ${e.message}`,
                        flags: 64
                    };
                }
            }
        }
    ],
    
    start() {
        console.log("[Impersonate] Plugin loaded!");
    },
    
    stop() {
        console.log("[Impersonate] Plugin unloaded!");
    }
});
