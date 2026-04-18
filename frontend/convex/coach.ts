import { v } from "convex/values";
import { authComponent } from "./auth_component";
import { mutation, query } from "./_generated/server";

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return [];
    }

    const messages = await ctx.db
      .query("coachMessages")
      .withIndex("userIdAndCreatedAt", (q) => q.eq("userId", user._id))
      .collect();

    return messages
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((message) => ({
        id: message._id,
        role: message.role,
        content: message.content,
        context: message.context,
        createdAt: message.createdAt,
      }));
  },
});

export const addMessage = mutation({
  args: {
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    context: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    return await ctx.db.insert("coachMessages", {
      userId: user._id,
      role: args.role,
      content: args.content,
      context: args.context,
      createdAt: Date.now(),
    });
  },
});

export const clearMine = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.getAuthUser(ctx);
    const messages = await ctx.db
      .query("coachMessages")
      .withIndex("userIdAndCreatedAt", (q) => q.eq("userId", user._id))
      .collect();

    await Promise.all(messages.map((message) => ctx.db.delete(message._id)));
  },
});
