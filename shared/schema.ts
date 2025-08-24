import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("physiotherapist"), // 'admin' or 'physiotherapist'
  phoneNumber: varchar("phone_number", { length: 20 }),
  licenseNumber: varchar("license_number", { length: 50 }),
  profileImageUrl: varchar("profile_image_url", { length: 255 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD format
  startTime: varchar("start_time", { length: 5 }).notNull(), // HH:MM format
  endTime: varchar("end_time", { length: 5 }).notNull(), // HH:MM format
  location: varchar("location", { length: 255 }).notNull(), // Required location field
  notes: text("notes"), // Optional notes field
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const swapRequests = pgTable("swap_requests", {
  id: serial("id").primaryKey(),
  requesterId: integer("requester_id").references(() => users.id).notNull(),
  targetUserId: integer("target_user_id").references(() => users.id).notNull(),
  requesterScheduleId: integer("requester_schedule_id").references(() => schedules.id).notNull(),
  targetScheduleId: integer("target_schedule_id").references(() => schedules.id), // Optional for open availability swaps
  swapType: varchar("swap_type", { length: 20 }).notNull().default("shift_to_shift"), // 'shift_to_shift' or 'shift_to_open'
  reason: text("reason").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // 'pending', 'approved', 'rejected'
  adminResponse: text("admin_response"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'info', 'success', 'warning', 'error'
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  schedules: many(schedules),
  swapRequestsAsRequester: many(swapRequests, { relationName: "requester" }),
  swapRequestsAsTarget: many(swapRequests, { relationName: "target" }),
  notifications: many(notifications)
}));

export const schedulesRelations = relations(schedules, ({ one, many }) => ({
  user: one(users, {
    fields: [schedules.userId],
    references: [users.id]
  }),
  swapRequestsAsRequester: many(swapRequests, { relationName: "requesterSchedule" }),
  swapRequestsAsTarget: many(swapRequests, { relationName: "targetSchedule" })
}));

export const swapRequestsRelations = relations(swapRequests, ({ one }) => ({
  requester: one(users, {
    fields: [swapRequests.requesterId],
    references: [users.id],
    relationName: "requester"
  }),
  targetUser: one(users, {
    fields: [swapRequests.targetUserId],
    references: [users.id],
    relationName: "target"
  }),
  requesterSchedule: one(schedules, {
    fields: [swapRequests.requesterScheduleId],
    references: [schedules.id],
    relationName: "requesterSchedule"
  }),
  targetSchedule: one(schedules, {
    fields: [swapRequests.targetScheduleId],
    references: [schedules.id],
    relationName: "targetSchedule"
  })
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id]
  })
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertScheduleSchema = createInsertSchema(schedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSwapRequestSchema = createInsertSchema(swapRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true
}).extend({
  targetScheduleId: z.number().optional(), // Make optional for open availability swaps
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type SwapRequest = typeof swapRequests.$inferSelect;
export type InsertSwapRequest = z.infer<typeof insertSwapRequestSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
