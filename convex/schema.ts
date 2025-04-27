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

  clinicProfiles: defineTable({
    clinicId: v.string(),
    name: v.string(),
    address: v.string(),
    phone: v.string(),
    email: v.string(),
    description: v.optional(v.string()),
    specializations: v.array(v.string()),
    isAvailable: v.boolean(),
    availabilityNote: v.optional(v.string()),
    openingHours: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clinicId", ["clinicId"])
    .index("by_name", ["name"]),

  doctors: defineTable({
    clinicId: v.string(),
    name: v.string(),
    specializations: v.array(v.string()),
    description: v.optional(v.string()),
    photo: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_clinicId", ["clinicId"]),

  appointments: defineTable({
    patientId: v.string(),
    clinicId: v.string(),
    doctorId: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("declined"),
      v.literal("completed"),
      v.literal("canceled")
    ),
    date: v.number(),
    reason: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clinicId", ["clinicId"])
    .index("by_patientId", ["patientId"])
    .index("by_status", ["status"])
    .index("by_clinicId_and_status", ["clinicId", "status"]),

  timeSlots: defineTable({
    clinicId: v.string(),
    date: v.number(), // Start of the day (midnight)
    slots: v.array(v.number()), // Array of timestamps for available slots
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clinicId", ["clinicId"])
    .index("by_date", ["date"])
    .index("by_clinicId_and_date", ["clinicId", "date"]),

  queueStatus: defineTable({
    clinicId: v.string(),
    estimatedWaitTime: v.number(), // in minutes
    currentNumber: v.number(),
    nextNumber: v.number(),
    updatedAt: v.number(),
  }).index("by_clinicId", ["clinicId"]),

  messages: defineTable({
    senderId: v.string(),
    receiverId: v.string(),
    content: v.string(),
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_senderId", ["senderId"])
    .index("by_receiverId", ["receiverId"])
    .index("by_conversation", ["senderId", "receiverId"]),
});
