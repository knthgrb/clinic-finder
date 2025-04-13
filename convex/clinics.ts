import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get the clinic profile
export const getClinicProfile = query({
  args: { clinicId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clinicProfiles")
      .withIndex("by_clinicId", (q) => q.eq("clinicId", args.clinicId))
      .first();
  },
});

// Create initial clinic profile during registration
export const createInitialClinicProfile = mutation({
  args: {
    name: v.string(),
    address: v.string(),
    phone: v.string(),
    email: v.string(),
    description: v.optional(v.string()),
    specializations: v.array(v.string()),
    isAvailable: v.boolean(),
    availabilityNote: v.optional(v.string()),
    openingHours: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const clinicId = identity.subject;

    // Check if the user is a clinic (but don't check approval status)
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", clinicId))
      .first();

    if (!user || user.role !== "clinic") {
      throw new Error("Unauthorized: Only clinics can create profiles");
    }

    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("clinicProfiles")
      .withIndex("by_clinicId", (q) => q.eq("clinicId", clinicId))
      .first();

    if (existingProfile) {
      throw new Error("Profile already exists");
    }

    // Check if name is unique
    const nameExists = await ctx.db
      .query("clinicProfiles")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (nameExists) {
      throw new Error(
        "Clinic name already exists. Please choose a different name."
      );
    }

    const now = Date.now();

    // Create new profile
    return await ctx.db.insert("clinicProfiles", {
      clinicId,
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Create or update clinic profile
export const upsertClinicProfile = mutation({
  args: {
    name: v.string(),
    address: v.string(),
    phone: v.string(),
    email: v.string(),
    description: v.optional(v.string()),
    specializations: v.array(v.string()),
    isAvailable: v.boolean(),
    availabilityNote: v.optional(v.string()),
    openingHours: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const clinicId = identity.subject;

    // Check if the user is a clinic
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", clinicId))
      .first();

    if (!user || user.role !== "clinic" || user.status !== "approved") {
      throw new Error(
        "Unauthorized: Only approved clinics can update profiles"
      );
    }

    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("clinicProfiles")
      .withIndex("by_clinicId", (q) => q.eq("clinicId", clinicId))
      .first();

    // Check if name is unique (if not updating own profile with same name)
    const nameCheck = await ctx.db
      .query("clinicProfiles")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();

    if (
      nameCheck &&
      (!existingProfile || nameCheck._id !== existingProfile._id)
    ) {
      throw new Error(
        "Clinic name already exists. Please choose a different name."
      );
    }

    const now = Date.now();

    if (existingProfile) {
      // Update existing profile
      return await ctx.db.patch(existingProfile._id, {
        ...args,
        updatedAt: now,
      });
    } else {
      // Create new profile
      return await ctx.db.insert("clinicProfiles", {
        clinicId,
        ...args,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Update clinic availability
export const updateClinicAvailability = mutation({
  args: {
    isAvailable: v.boolean(),
    availabilityNote: v.optional(v.string()),
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
        "Unauthorized: Only approved clinics can update availability"
      );
    }

    // Get the clinic profile
    const profile = await ctx.db
      .query("clinicProfiles")
      .withIndex("by_clinicId", (q) => q.eq("clinicId", clinicId))
      .first();

    if (!profile) {
      throw new Error("Clinic profile not found");
    }

    // Update availability
    return await ctx.db.patch(profile._id, {
      isAvailable: args.isAvailable,
      availabilityNote: args.availabilityNote,
      updatedAt: Date.now(),
    });
  },
});

// Add a doctor to the clinic
export const addDoctor = mutation({
  args: {
    name: v.string(),
    specializations: v.array(v.string()),
    description: v.optional(v.string()),
    photo: v.optional(v.string()),
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
      throw new Error("Unauthorized: Only approved clinics can add doctors");
    }

    const now = Date.now();

    // Add the doctor
    return await ctx.db.insert("doctors", {
      clinicId,
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Get doctors for a clinic
export const getDoctors = query({
  args: { clinicId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("doctors")
      .withIndex("by_clinicId", (q) => q.eq("clinicId", args.clinicId))
      .collect();
  },
});

// Update a doctor
export const updateDoctor = mutation({
  args: {
    doctorId: v.id("doctors"),
    name: v.string(),
    specializations: v.array(v.string()),
    description: v.optional(v.string()),
    photo: v.optional(v.string()),
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
      throw new Error("Unauthorized: Only approved clinics can update doctors");
    }

    // Get the doctor to ensure it belongs to this clinic
    const doctor = await ctx.db.get(args.doctorId);

    if (!doctor || doctor.clinicId !== clinicId) {
      throw new Error("Doctor not found or doesn't belong to this clinic");
    }

    // Update the doctor
    const { doctorId, ...updateData } = args;
    return await ctx.db.patch(doctorId, {
      ...updateData,
      updatedAt: Date.now(),
    });
  },
});

// Delete a doctor
export const deleteDoctor = mutation({
  args: {
    doctorId: v.id("doctors"),
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
      throw new Error("Unauthorized: Only approved clinics can delete doctors");
    }

    // Get the doctor to ensure it belongs to this clinic
    const doctor = await ctx.db.get(args.doctorId);

    if (!doctor || doctor.clinicId !== clinicId) {
      throw new Error("Doctor not found or doesn't belong to this clinic");
    }

    // Delete the doctor
    await ctx.db.delete(args.doctorId);
  },
});

// Get all approved clinics
export const getAllApprovedClinics = query({
  handler: async (ctx) => {
    // Get all users who are approved clinics
    const clinicUsers = await ctx.db
      .query("users")
      .withIndex("by_role_and_status", (q) =>
        q.eq("role", "clinic").eq("status", "approved")
      )
      .collect();

    // Get profiles for all approved clinics
    const clinicProfiles = [];

    for (const user of clinicUsers) {
      const profile = await ctx.db
        .query("clinicProfiles")
        .withIndex("by_clinicId", (q) => q.eq("clinicId", user.userId))
        .first();

      if (profile) {
        clinicProfiles.push(profile);
      }
    }

    return clinicProfiles;
  },
});

// Add this function to check for name uniqueness
export const isClinicNameUnique = query({
  args: {
    name: v.string(),
    currentClinicId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const query = ctx.db
      .query("clinicProfiles")
      .withIndex("by_name", (q) => q.eq("name", args.name));

    const existingClinic = await query.first();

    // If no clinic with this name exists, the name is unique
    if (!existingClinic) return true;

    // If updating existing clinic, check if the name belongs to another clinic
    if (
      args.currentClinicId &&
      existingClinic.clinicId === args.currentClinicId
    ) {
      return true;
    }

    // Name is taken by another clinic
    return false;
  },
});
