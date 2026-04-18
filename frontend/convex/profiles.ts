import { v } from "convex/values";
import { authComponent } from "./auth_component";
import { mutation, query } from "./_generated/server";

const goalsValidator = v.object({
  calories: v.number(),
  protein: v.number(),
  carbs: v.number(),
  fat: v.number(),
});

const calendarValidator = v.object({
  google: v.boolean(),
  outlook: v.boolean(),
});

const DEFAULT_PROFILE = {
  name: "",
  age: 0,
  weight: 0,
  height: 0,
  gender: "male",
  activity: "moderate",
  restrictions: [] as string[],
  goals: { calories: 2000, protein: 120, carbs: 200, fat: 67 },
  calendarConnections: { google: false, outlook: false },
};

export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await authComponent.safeGetAuthUser(ctx);
    if (!user) {
      return null;
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!profile) {
      return null;
    }

    return {
      name: profile.name,
      age: profile.age,
      weight: profile.weight,
      height: profile.height,
      gender: profile.gender,
      activity: profile.activity,
      restrictions: profile.restrictions,
      goals: profile.goals,
      calendarConnections: profile.calendarConnections,
    };
  },
});

export const upsertMine = mutation({
  args: {
    name: v.string(),
    age: v.number(),
    weight: v.number(),
    height: v.number(),
    gender: v.string(),
    activity: v.string(),
    restrictions: v.array(v.string()),
    goals: goalsValidator,
    calendarConnections: calendarValidator,
  },
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);
    const existing = await ctx.db
      .query("profiles")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .unique();

    const payload = {
      ...args,
      userId: user._id,
      updatedAt: Date.now(),
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }

    return await ctx.db.insert("profiles", payload);
  },
});
