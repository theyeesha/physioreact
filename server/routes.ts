import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { insertUserSchema, insertScheduleSchema, insertSwapRequestSchema, insertNotificationSchema } from "@shared/schema";
import { z } from "zod";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Function to perform automatic duty transfer when swap is approved
async function performDutyTransfer(swapRequest: any) {
  try {
    
    if (swapRequest.swapType === 'shift_to_shift') {
      // Traditional shift exchange: both users swap their duties
      
      // Get both schedules
      const requesterSchedule = await storage.getSchedule(swapRequest.requesterScheduleId);
      const targetSchedule = await storage.getSchedule(swapRequest.targetScheduleId);
      
      if (!requesterSchedule || !targetSchedule) {
        throw new Error('One or both schedules not found for shift-to-shift swap');
      }
      
      // Create new schedule for target user with requester's original duty
      await storage.createSchedule({
        userId: swapRequest.targetUserId,
        date: requesterSchedule.date,
        startTime: requesterSchedule.startTime,
        endTime: requesterSchedule.endTime,
        location: requesterSchedule.location,
        notes: requesterSchedule.notes || `Swapped from ${requesterSchedule.userId}`
      });
      
      // Create new schedule for requester with target user's original duty
      await storage.createSchedule({
        userId: swapRequest.requesterId,
        date: targetSchedule.date,
        startTime: targetSchedule.startTime,
        endTime: targetSchedule.endTime,
        location: targetSchedule.location,
        notes: targetSchedule.notes || `Swapped from ${targetSchedule.userId}`
      });
      
      // Remove both original schedules
      await storage.deleteSchedule(swapRequest.requesterScheduleId);
      await storage.deleteSchedule(swapRequest.targetScheduleId);

      
    } else if (swapRequest.swapType === 'shift_to_open') {
      // Coverage request: target user takes over requester's duty
      
      // Get the requester's schedule
      const requesterSchedule = await storage.getSchedule(swapRequest.requesterScheduleId);
      
      if (!requesterSchedule) {
        throw new Error('Requester schedule not found for shift-to-open swap');
      }
      
      // Create new schedule for target user with requester's duty details
      await storage.createSchedule({
        userId: swapRequest.targetUserId,
        date: requesterSchedule.date,
        startTime: requesterSchedule.startTime,
        endTime: requesterSchedule.endTime,
        location: requesterSchedule.location,
        notes: requesterSchedule.notes || `Covering for ${requesterSchedule.userId}`
      });
      
      // Remove the original schedule from requester
      await storage.deleteSchedule(swapRequest.requesterScheduleId);

    }
    
  } catch (error) {
    console.error('Error performing duty transfer:', error);
    // Don't throw error to prevent swap request approval from failing
    // The swap is still approved, but schedules need manual adjustment
  }
}

// Extended Request interface
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

// Auth middleware
const authenticateToken = (req: AuthenticatedRequest, res: Response, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Admin middleware
const requireAdmin = (req: AuthenticatedRequest, res: Response, next: any) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: 'Account is deactivated' });
      }

      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ 
        token, 
        user: { 
          id: user.id, 
          email: user.email, 
          firstName: user.firstName, 
          lastName: user.lastName, 
          role: user.role,
          profileImageUrl: user.profileImageUrl
        } 
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });

      res.status(201).json({ 
        message: 'User created successfully',
        user: { 
          id: user.id, 
          email: user.email, 
          firstName: user.firstName, 
          lastName: user.lastName, 
          role: user.role 
        } 
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // User routes
  app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phoneNumber: user.phoneNumber,
        licenseNumber: user.licenseNumber,
        profileImageUrl: user.profileImageUrl,
        isActive: user.isActive,
        createdAt: user.createdAt
      })));
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get colleagues for swap requests (physiotherapists only)
  app.get('/api/users/colleagues', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      // Only physiotherapists can access this endpoint for swap purposes
      if (req.user?.role !== 'physiotherapist') {
        return res.status(403).json({ message: 'Physiotherapist access required' });
      }

      const allUsers = await storage.getAllUsers();
      
      // Return only other physiotherapists (excluding the current user)
      const colleagues = allUsers
        .filter(user => user.role === 'physiotherapist' && user.id !== req.user?.id && user.isActive)
        .map(user => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl
        }));
      
      res.json(colleagues);
    } catch (error) {
      console.error('Get colleagues error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword
      });

      res.status(201).json({ 
        message: 'User created successfully',
        user: { 
          id: user.id, 
          email: user.email, 
          firstName: user.firstName, 
          lastName: user.lastName, 
          role: user.role,
          phoneNumber: user.phoneNumber,
          licenseNumber: user.licenseNumber,
          profileImageUrl: user.profileImageUrl,
          isActive: user.isActive,
          createdAt: user.createdAt
        } 
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/users/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Users can only view their own profile unless they're admin
      if (req.user?.role !== 'admin' && req.user?.id !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phoneNumber: user.phoneNumber,
        licenseNumber: user.licenseNumber,
        profileImageUrl: user.profileImageUrl,
        isActive: user.isActive
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/users/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Users can only update their own profile unless they're admin
      if (req.user?.role !== 'admin' && req.user?.id !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const updateData = req.body;
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }

      const user = await storage.updateUser(userId, updateData);
      
      // If user is updating their own profile, generate new JWT token with updated data
      let token = null;
      if (req.user?.id === userId) {
        token = jwt.sign(
          { 
            id: user.id, 
            email: user.email, 
            role: user.role 
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
      }
      
      const responseData: any = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phoneNumber: user.phoneNumber,
        licenseNumber: user.licenseNumber,
        profileImageUrl: user.profileImageUrl,
        isActive: user.isActive
      };

      // Include token and complete user object if updating own profile
      if (token) {
        responseData.token = token;
        responseData.user = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          profileImageUrl: user.profileImageUrl
        };
      }

      res.json(responseData);
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      await storage.deleteUser(userId);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Schedule routes
  app.get('/api/schedules', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      let schedules;
      if (req.user?.role === 'admin') {
        schedules = await storage.getAllSchedules();
      } else {
        schedules = await storage.getSchedulesByUser(req.user?.id || 0);
      }
      res.json(schedules);
    } catch (error) {
      console.error('Get schedules error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/schedules/user/:userId', authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Users can only view their own schedules unless they're admin
      if (req.user?.role !== 'admin' && req.user?.id !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const schedules = await storage.getSchedulesByUser(userId);
      res.json(schedules);
    } catch (error) {
      console.error('Get user schedules error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/schedules', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const scheduleData = insertScheduleSchema.parse(req.body);
      const schedule = await storage.createSchedule(scheduleData);
      
      // Create notification for the assigned user
      await storage.createNotification({
        userId: schedule.userId,
        title: 'New Schedule Assigned',
        message: `You have been assigned a new schedule for ${schedule.date} from ${schedule.startTime} to ${schedule.endTime}`,
        type: 'info'
      });

      res.status(201).json(schedule);
    } catch (error) {
      console.error('Create schedule error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/schedules/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.id);
      const updateData = req.body;
      
      const schedule = await storage.updateSchedule(scheduleId, updateData);
      res.json(schedule);
    } catch (error) {
      console.error('Update schedule error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.delete('/api/schedules/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const scheduleId = parseInt(req.params.id);
      await storage.deleteSchedule(scheduleId);
      res.json({ message: 'Schedule deleted successfully' });
    } catch (error) {
      console.error('Delete schedule error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Swap request routes
  app.get('/api/swap-requests', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      let swapRequests;
      if (req.user?.role === 'admin') {
        swapRequests = await storage.getAllSwapRequests();
      } else {
        swapRequests = await storage.getSwapRequestsByUser(req.user?.id || 0);
      }
      res.json(swapRequests);
    } catch (error) {
      console.error('Get swap requests error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/swap-requests', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const swapRequestData = insertSwapRequestSchema.parse({
        ...req.body,
        requesterId: req.user?.id
      });
      
      // Validate that for shift_to_shift swaps, targetScheduleId is provided
      if (swapRequestData.swapType === 'shift_to_shift' && !swapRequestData.targetScheduleId) {
        return res.status(400).json({ 
          message: 'Target schedule is required for shift-to-shift swaps' 
        });
      }
      
      // For shift_to_open swaps, targetScheduleId should be null
      if (swapRequestData.swapType === 'shift_to_open') {
        swapRequestData.targetScheduleId = undefined;
      }
      
      const swapRequest = await storage.createSwapRequest(swapRequestData);
      
      // Create notification for admin
      await storage.createNotification({
        userId: 1, // Assuming admin user ID is 1
        title: 'New Swap Request',
        message: `A new shift swap request has been submitted and requires approval`,
        type: 'warning'
      });

      res.status(201).json(swapRequest);
    } catch (error) {
      console.error('Create swap request error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/swap-requests/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const swapRequestId = parseInt(req.params.id);
      const updateData = req.body;
      
      // Only admin can update swap requests (approve/reject)
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      // Get the current swap request to check previous status
      const currentSwapRequest = await storage.getSwapRequest(swapRequestId);
      if (!currentSwapRequest) {
        return res.status(404).json({ message: 'Swap request not found' });
      }

      const swapRequest = await storage.updateSwapRequest(swapRequestId, updateData);
      
      // Perform automatic duty transfer if status changed from pending to approved
      if (currentSwapRequest.status === 'pending' && updateData.status === 'approved') {
        await performDutyTransfer(swapRequest);
      }
      
      // Create notification for the requester
      const notificationMessage = updateData.status === 'approved' 
        ? 'Your swap request has been approved and schedules have been updated' 
        : 'Your swap request has been rejected';
      
      await storage.createNotification({
        userId: swapRequest.requesterId,
        title: 'Swap Request Update',
        message: notificationMessage,
        type: updateData.status === 'approved' ? 'success' : 'error'
      });

      // If approved, also notify the target user
      if (updateData.status === 'approved') {
        await storage.createNotification({
          userId: swapRequest.targetUserId,
          title: 'Swap Request Approved',
          message: 'A swap request involving your schedule has been approved and your schedule has been updated',
          type: 'success'
        });
      }

      res.json(swapRequest);
    } catch (error) {
      console.error('Update swap request error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Notification routes
  app.get('/api/notifications', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.user?.id || 0);
      res.json(notifications);
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.json({ message: 'Notification marked as read' });
    } catch (error) {
      console.error('Mark notification as read error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/notifications/read-all', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      await storage.markAllNotificationsAsRead(req.user?.id || 0);
      res.json({ message: 'All notifications marked as read' });
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
