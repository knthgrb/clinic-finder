import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get available time slots for a specific clinic and date
export const getAvailableSlotsForDate = query({
  args: {
    clinicId: v.string(),
    date: v.number(), // timestamp for the beginning of the day
  },
  handler: async (ctx, args) => {
    // Get the time slots for this date
    const timeSlot = await ctx.db
      .query("timeSlots")
      .withIndex("by_clinicId_and_date", (q) =>
        q.eq("clinicId", args.clinicId).eq("date", args.date)
      )
      .first();

    if (!timeSlot) {
      return []; // No slots defined for this date
    }

    // Get all approved appointments for this clinic on this date
    const startOfDay = args.date;
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000; // Add 24 hours

    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_clinicId", (q) => q.eq("clinicId", args.clinicId))
      .filter((q) =>
        q.and(
          q.gte(q.field("date"), startOfDay),
          q.lt(q.field("date"), endOfDay),
          q.eq(q.field("status"), "approved")
        )
      )
      .collect();

    // Filter out time slots that are already booked
    const bookedTimes = appointments.map((appointment) => appointment.date);
    const availableSlots = timeSlot.slots.filter(
      (slot) => !bookedTimes.includes(slot)
    );

    return availableSlots;
  },
});

// Get all time slots for a clinic
export const getClinicTimeSlots = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
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
        "Unauthorized: Only approved clinics can manage time slots"
      );
    }

    let query = ctx.db
      .query("timeSlots")
      .withIndex("by_clinicId", (q) => q.eq("clinicId", clinicId));

    if (args.startDate && args.endDate) {
      query = query.filter((q) =>
        q.and(
          q.gte(q.field("date"), args.startDate as number),
          q.lt(q.field("date"), args.endDate as number)
        )
      );
    }

    return await query.collect();
  },
});

// Set time slots for a specific date
export const setTimeSlotsForDate = mutation({
  args: {
    date: v.number(), // timestamp for the beginning of the day
    slots: v.array(v.number()), // Array of timestamps for available slots
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
        "Unauthorized: Only approved clinics can manage time slots"
      );
    }

    // Check if there are existing time slots for this date
    const existingTimeSlot = await ctx.db
      .query("timeSlots")
      .withIndex("by_clinicId_and_date", (q) =>
        q.eq("clinicId", clinicId).eq("date", args.date)
      )
      .first();

    const now = Date.now();

    if (existingTimeSlot) {
      // Update existing time slots
      return await ctx.db.patch(existingTimeSlot._id, {
        slots: args.slots,
        updatedAt: now,
      });
    } else {
      // Create new time slots
      return await ctx.db.insert("timeSlots", {
        clinicId,
        date: args.date,
        slots: args.slots,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

// Generate default time slots for a specific date (e.g., every 30 minutes from 9am to 5pm)
export const generateDefaultTimeSlots = mutation({
  args: {
    date: v.number(), // timestamp for the beginning of the day
    startHour: v.number(), // e.g., 9 for 9am
    endHour: v.number(), // e.g., 17 for 5pm
    intervalMinutes: v.number(), // e.g., 30 for 30-minute slots
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
        "Unauthorized: Only approved clinics can manage time slots"
      );
    }

    // Generate time slots
    const slots = [];
    const date = new Date(args.date);

    for (let hour = args.startHour; hour < args.endHour; hour++) {
      for (let minute = 0; minute < 60; minute += args.intervalMinutes) {
        date.setHours(hour, minute, 0, 0);
        slots.push(date.getTime());
      }
    }

    // Check if there are existing time slots for this date
    const existingTimeSlot = await ctx.db
      .query("timeSlots")
      .withIndex("by_clinicId_and_date", (q) =>
        q.eq("clinicId", clinicId).eq("date", args.date)
      )
      .first();

    const now = Date.now();

    if (existingTimeSlot) {
      // Update existing time slots
      return await ctx.db.patch(existingTimeSlot._id, {
        slots,
        updatedAt: now,
      });
    } else {
      // Create new time slots
      return await ctx.db.insert("timeSlots", {
        clinicId,
        date: args.date,
        slots,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});
