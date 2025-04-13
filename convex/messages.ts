import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Send a message
export const sendMessage = mutation({
  args: {
    receiverId: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const senderId = identity.subject;

    // Verify the sender exists
    const sender = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", senderId))
      .first();

    if (!sender) {
      throw new Error("Sender not found");
    }

    // Verify the receiver exists
    const receiver = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.receiverId))
      .first();

    if (!receiver) {
      throw new Error("Receiver not found");
    }

    // Create the message
    return await ctx.db.insert("messages", {
      senderId,
      receiverId: args.receiverId,
      content: args.content,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

// Get conversation between two users
export const getConversation = query({
  args: {
    otherUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const userId = identity.subject;

    // Get messages where current user is sender and otherUser is receiver
    const sentMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("senderId", userId).eq("receiverId", args.otherUserId)
      )
      .collect();

    // Get messages where current user is receiver and otherUser is sender
    const receivedMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("senderId", args.otherUserId).eq("receiverId", userId)
      )
      .collect();

    // Combine and sort by timestamp
    const allMessages = [...sentMessages, ...receivedMessages].sort(
      (a, b) => a.createdAt - b.createdAt
    );

    return allMessages;
  },
});

// Mark messages as read
export const markMessagesAsRead = mutation({
  args: {
    senderId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const receiverId = identity.subject;

    // Get all unread messages from the sender to the current user
    const unreadMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("senderId", args.senderId).eq("receiverId", receiverId)
      )
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();

    // Mark each message as read
    for (const message of unreadMessages) {
      await ctx.db.patch(message._id, {
        isRead: true,
      });
    }

    return unreadMessages.length;
  },
});

// Get all chat partners (users who have exchanged messages with the current user)
export const getChatPartners = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const userId = identity.subject;

    // Get distinct users who have sent messages to the current user
    const senders = await ctx.db
      .query("messages")
      .withIndex("by_receiverId", (q) => q.eq("receiverId", userId))
      .collect();

    // Get distinct users who have received messages from the current user
    const receivers = await ctx.db
      .query("messages")
      .withIndex("by_senderId", (q) => q.eq("senderId", userId))
      .collect();

    // Extract unique user IDs
    const senderIds = [...new Set(senders.map((msg) => msg.senderId))];
    const receiverIds = [...new Set(receivers.map((msg) => msg.receiverId))];

    // Combine unique IDs
    const partnerIds = [...new Set([...senderIds, ...receiverIds])];

    // Get user information for each partner
    const partners = [];
    for (const partnerId of partnerIds) {
      const partner = await ctx.db
        .query("users")
        .withIndex("by_userId", (q) => q.eq("userId", partnerId))
        .first();

      if (partner) {
        partners.push(partner);
      }
    }

    return partners;
  },
});

// Get unread message count
export const getUnreadMessageCount = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const userId = identity.subject;

    // Get all unread messages
    const unreadMessages = await ctx.db
      .query("messages")
      .withIndex("by_receiverId", (q) => q.eq("receiverId", userId))
      .filter((q) => q.eq(q.field("isRead"), false))
      .collect();

    return unreadMessages.length;
  },
});
