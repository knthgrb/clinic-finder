import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get appointments for a clinic by status
export const getClinicAppointmentsByStatus = query({
  args: {
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("declined"),
      v.literal("completed"),
      v.literal("canceled")
    ),
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
        "Unauthorized: Only approved clinics can view appointments"
      );
    }

    return await ctx.db
      .query("appointments")
      .withIndex("by_clinicId_and_status", (q) =>
        q.eq("clinicId", clinicId).eq("status", args.status)
      )
      .collect();
  },
});

// Get all appointments for a clinic
export const getAllClinicAppointments = query({
  handler: async (ctx) => {
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
        "Unauthorized: Only approved clinics can view appointments"
      );
    }

    return await ctx.db
      .query("appointments")
      .withIndex("by_clinicId", (q) => q.eq("clinicId", clinicId))
      .collect();
  },
});

// Update appointment status
export const updateAppointmentStatus = mutation({
  args: {
    appointmentId: v.id("appointments"),
    status: v.union(
      v.literal("approved"),
      v.literal("declined"),
      v.literal("completed"),
      v.literal("canceled")
    ),
    notes: v.optional(v.string()),
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
        "Unauthorized: Only approved clinics can update appointments"
      );
    }

    // Get the appointment to make sure it belongs to this clinic
    const appointment = await ctx.db.get(args.appointmentId);

    if (!appointment || appointment.clinicId !== clinicId) {
      throw new Error("Appointment not found or doesn't belong to this clinic");
    }

    // Update the appointment
    return await ctx.db.patch(args.appointmentId, {
      status: args.status,
      notes: args.notes,
      updatedAt: Date.now(),
    });
  },
});

// Get all appointments for a patient
export const getPatientAppointments = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const patientId = identity.subject;

    // Check if the user is a patient
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", patientId))
      .first();

    if (!user || user.role !== "patient") {
      throw new Error(
        "Unauthorized: Only patients can view their appointments"
      );
    }

    return await ctx.db
      .query("appointments")
      .withIndex("by_patientId", (q) => q.eq("patientId", patientId))
      .collect();
  },
});

// Book a new appointment
export const bookAppointment = mutation({
  args: {
    clinicId: v.string(),
    doctorId: v.optional(v.string()),
    date: v.number(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const patientId = identity.subject;

    // Check if the user is a patient
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", patientId))
      .first();

    if (!user || user.role !== "patient") {
      throw new Error("Unauthorized: Only patients can book appointments");
    }

    // Verify the clinic exists and is available
    const clinic = await ctx.db
      .query("clinicProfiles")
      .withIndex("by_clinicId", (q) => q.eq("clinicId", args.clinicId))
      .first();

    if (!clinic) {
      throw new Error("Clinic not found");
    }

    if (!clinic.isAvailable) {
      throw new Error("This clinic is currently not accepting appointments");
    }

    const now = Date.now();

    // Create the appointment
    return await ctx.db.insert("appointments", {
      patientId,
      clinicId: args.clinicId,
      doctorId: args.doctorId,
      status: "pending",
      date: args.date,
      reason: args.reason,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Cancel an appointment
export const cancelAppointment = mutation({
  args: {
    appointmentId: v.id("appointments"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const userId = identity.subject;

    // Get the appointment
    const appointment = await ctx.db.get(args.appointmentId);

    if (!appointment) {
      throw new Error("Appointment not found");
    }

    // Check if the user is the patient who booked this appointment
    if (appointment.patientId !== userId) {
      // Check if it's the clinic
      if (appointment.clinicId !== userId) {
        throw new Error("Unauthorized: You cannot cancel this appointment");
      }
    }

    // Can only cancel if not already completed or canceled
    if (
      appointment.status === "completed" ||
      appointment.status === "canceled"
    ) {
      throw new Error(
        "Cannot cancel a completed or already canceled appointment"
      );
    }

    // Update the appointment status to canceled
    return await ctx.db.patch(args.appointmentId, {
      status: "canceled",
      updatedAt: Date.now(),
    });
  },
});
