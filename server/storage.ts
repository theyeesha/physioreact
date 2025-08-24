import { 
  users, 
  schedules, 
  swapRequests, 
  notifications,
  type User, 
  type InsertUser,
  type Schedule,
  type InsertSchedule,
  type SwapRequest,
  type InsertSwapRequest,
  type Notification,
  type InsertNotification
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, or } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  deleteUser(id: number): Promise<void>;
  getAllUsers(): Promise<User[]>;
  
  // Schedule operations
  getSchedule(id: number): Promise<Schedule | undefined>;
  getSchedulesByUser(userId: number): Promise<Schedule[]>;
  getAllSchedules(): Promise<Schedule[]>;
  createSchedule(schedule: InsertSchedule): Promise<Schedule>;
  updateSchedule(id: number, schedule: Partial<InsertSchedule>): Promise<Schedule>;
  deleteSchedule(id: number): Promise<void>;
  
  // Swap request operations
  getSwapRequest(id: number): Promise<SwapRequest | undefined>;
  getSwapRequestsByUser(userId: number): Promise<SwapRequest[]>;
  getAllSwapRequests(): Promise<SwapRequest[]>;
  createSwapRequest(swapRequest: InsertSwapRequest): Promise<SwapRequest>;
  updateSwapRequest(id: number, swapRequest: Partial<InsertSwapRequest>): Promise<SwapRequest>;
  
  // Notification operations
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<void>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.firstName);
  }

  // Schedule operations
  async getSchedule(id: number): Promise<Schedule | undefined> {
    const [schedule] = await db.select().from(schedules).where(eq(schedules.id, id));
    return schedule || undefined;
  }

  async getSchedulesByUser(userId: number): Promise<Schedule[]> {
    return await db
      .select()
      .from(schedules)
      .where(and(eq(schedules.userId, userId), eq(schedules.isActive, true)))
      .orderBy(schedules.date);
  }

  async getAllSchedules(): Promise<Schedule[]> {
    return await db
      .select()
      .from(schedules)
      .where(eq(schedules.isActive, true))
      .orderBy(schedules.date);
  }

  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const [schedule] = await db
      .insert(schedules)
      .values(insertSchedule)
      .returning();
    return schedule;
  }

  async updateSchedule(id: number, updateData: Partial<InsertSchedule>): Promise<Schedule> {
    const [schedule] = await db
      .update(schedules)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(schedules.id, id))
      .returning();
    return schedule;
  }

  async deleteSchedule(id: number): Promise<void> {
    await db
      .update(schedules)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schedules.id, id));
  }

  // Swap request operations
  async getSwapRequest(id: number): Promise<SwapRequest | undefined> {
    const [swapRequest] = await db.select().from(swapRequests).where(eq(swapRequests.id, id));
    return swapRequest || undefined;
  }

  async getSwapRequestsByUser(userId: number): Promise<SwapRequest[]> {
    return await db
      .select()
      .from(swapRequests)
      .where(or(eq(swapRequests.requesterId, userId), eq(swapRequests.targetUserId, userId)))
      .orderBy(desc(swapRequests.createdAt));
  }

  async getAllSwapRequests(): Promise<SwapRequest[]> {
    return await db
      .select()
      .from(swapRequests)
      .orderBy(desc(swapRequests.createdAt));
  }

  async createSwapRequest(insertSwapRequest: InsertSwapRequest): Promise<SwapRequest> {
    const [swapRequest] = await db
      .insert(swapRequests)
      .values(insertSwapRequest)
      .returning();
    return swapRequest;
  }

  async updateSwapRequest(id: number, updateData: Partial<InsertSwapRequest>): Promise<SwapRequest> {
    const [swapRequest] = await db
      .update(swapRequests)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(swapRequests.id, id))
      .returning();
    return swapRequest;
  }

  // Notification operations
  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }
}

export const storage = new DatabaseStorage();
