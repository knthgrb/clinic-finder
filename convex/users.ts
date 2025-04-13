import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const createUser = mutation({
  args: {
    email: v.string(),
    role: v.union(
      v.literal("admin"),
      v.literal("clinic"),
      v.literal("patient")
    ),
    status: v.union(v.literal("approved"), v.literal("pending")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    return await ctx.db.insert("users", {
      userId: identity.subject,
      email: args.email,
      role: args.role,
      status: args.role === "clinic" ? "pending" : "approved",
      createdAt: Date.now(),
    });
  },
});

export const getRejectedClinics = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Get the user to check if they're an admin
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Only admins can view rejected clinics");
    }

    return await ctx.db
      .query("users")
      .withIndex("by_role_and_status", (q) =>
        q.eq("role", "clinic").eq("status", "rejected")
      )
      .collect();
  },
});

export const getApprovedClinics = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Get the user to check if they're an admin
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Only admins can view approved clinics");
    }

    return await ctx.db
      .query("users")
      .withIndex("by_role_and_status", (q) =>
        q.eq("role", "clinic").eq("status", "approved")
      )
      .collect();
  },
});

export const getPendingClinics = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Get the user to check if they're an admin
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!user || user.role !== "admin") {
      throw new Error("Unauthorized: Only admins can view pending clinics");
    }

    return await ctx.db
      .query("users")
      .withIndex("by_role_and_status", (q) =>
        q.eq("role", "clinic").eq("status", "pending")
      )
      .collect();
  },
});

export const updateClinicStatus = mutation({
  args: {
    userId: v.string(),
    status: v.union(
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("pending")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Check if the current user is an admin
    const admin = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("Unauthorized: Only admins can update clinic status");
    }

    // Get the clinic user
    const clinic = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!clinic || clinic.role !== "clinic") {
      throw new Error("User not found or not a clinic");
    }

    // Update the clinic's status
    return await ctx.db.patch(clinic._id, {
      status: args.status,
    });
  },
});

export const deleteClinic = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Check if the current user is an admin
    const admin = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("Unauthorized: Only admins can delete clinics");
    }

    // Get the clinic user
    const clinic = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!clinic || clinic.role !== "clinic") {
      throw new Error("User not found or not a clinic");
    }

    // Delete the clinic
    await ctx.db.delete(clinic._id);
  },
});

export const getPatientProfiles = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Check if the user is a clinic
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    if (!user || user.role !== "clinic" || user.status !== "approved") {
      throw new Error(
        "Unauthorized: Only approved clinics can view patient profiles"
      );
    }

    // Return all patients
    return await ctx.db
      .query("users")
      .withIndex("by_role_and_status", (q) =>
        q.eq("role", "patient").eq("status", "approved")
      )
      .collect();
  },
});
