import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get queue status for a clinic
export const getQueueStatus = query({
  args: { clinicId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("queueStatus")
      .withIndex("by_clinicId", (q) => q.eq("clinicId", args.clinicId))
      .first();
  },
});

// Update queue status
export const updateQueueStatus = mutation({
  args: {
    estimatedWaitTime: v.number(),
    currentNumber: v.number(),
    nextNumber: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const clinicId = identity.subject;

    // Check if the user is an approved clinic
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", clinicId))
      .first();

    if (!user || user.role !== "clinic" || user.status !== "approved") {
      throw new Error(
        "Unauthorized: Only approved clinics can update queue status"
      );
    }

    // Check if queue status exists for this clinic
    const queueStatus = await ctx.db
      .query("queueStatus")
      .withIndex("by_clinicId", (q) => q.eq("clinicId", clinicId))
      .first();

    const now = Date.now();

    if (queueStatus) {
      // Update existing queue status
      return await ctx.db.patch(queueStatus._id, {
        ...args,
        updatedAt: now,
      });
    } else {
      // Create new queue status
      return await ctx.db.insert("queueStatus", {
        clinicId,
        ...args,
        updatedAt: now,
      });
    }
  },
});
