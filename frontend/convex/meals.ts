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

    const meals = await ctx.db
      .query("meals")
      .withIndex("userIdAndLoggedAt", (q) => q.eq("userId", user._id))
      .collect();

    return meals
      .sort((a, b) => b.loggedAt - a.loggedAt)
      .map((meal) => ({
        id: meal._id,
        description: meal.description,
        location: meal.location,
        notes: meal.notes,
        calories: meal.calories,
        protein_g: meal.protein_g,
        carbs_g: meal.carbs_g,
        fat_g: meal.fat_g,
        loggedAt: meal.loggedAt,
      }));
  },
});

export const addManual = mutation({
  args: {
    description: v.string(),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    return await ctx.db.insert("meals", {
      userId: user._id,
      description: args.description,
      location: args.location,
      notes: args.notes,
      loggedAt: Date.now(),
    });
  },
});

export const addAnalyzed = mutation({
  args: {
    description: v.string(),
    notes: v.optional(v.string()),
    location: v.optional(v.string()),
    calories: v.number(),
    protein_g: v.number(),
    carbs_g: v.number(),
    fat_g: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    return await ctx.db.insert("meals", {
      userId: user._id,
      description: args.description,
      location: args.location,
      notes: args.notes,
      calories: args.calories,
      protein_g: args.protein_g,
      carbs_g: args.carbs_g,
      fat_g: args.fat_g,
      loggedAt: Date.now(),
    });
  },
});
