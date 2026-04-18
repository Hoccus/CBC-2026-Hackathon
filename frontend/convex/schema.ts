import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const goals = v.object({
  calories: v.number(),
  protein: v.number(),
  carbs: v.number(),
  fat: v.number(),
});

const calendarConnections = v.object({
  google: v.boolean(),
  outlook: v.boolean(),
});

export default defineSchema({
  profiles: defineTable({
    userId: v.string(),
    name: v.string(),
    age: v.number(),
    weight: v.number(),
    height: v.number(),
    gender: v.string(),
    activity: v.string(),
    restrictions: v.array(v.string()),
    goals,
    calendarConnections,
    updatedAt: v.number(),
  }).index("userId", ["userId"]),
  meals: defineTable({
    userId: v.string(),
    description: v.string(),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
    calories: v.optional(v.number()),
    protein_g: v.optional(v.number()),
    carbs_g: v.optional(v.number()),
    fat_g: v.optional(v.number()),
    loggedAt: v.number(),
  })
    .index("userId", ["userId"])
    .index("userIdAndLoggedAt", ["userId", "loggedAt"]),
  coachMessages: defineTable({
    userId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    context: v.optional(v.string()),
    createdAt: v.number(),
  }).index("userIdAndCreatedAt", ["userId", "createdAt"]),
});
