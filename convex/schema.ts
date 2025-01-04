import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    userId: v.string(),
    email: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("clinic"),
      v.literal("patient")
    ),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected")
      )
    ),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_role_and_status", ["role", "status"]),
});
