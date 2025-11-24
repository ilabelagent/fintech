// Valifi API Routes - Complete fintech endpoints
import type { Express } from "express";
import { createServer, type Server } from "http";
import { authenticateToken as isAuthenticated } from "./authService";
import { storage } from "./storage";

// Middleware to check if user is admin
async function isAdmin(req: any, res: any, next: any) {
  try {
    const userId = req.user.claims.sub;
    const isUserAdmin = await storage.isUserAdmin(userId);
    
    if (!isUserAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    next();
  } catch (error) {
    console.error("Error checking admin status:", error);
    res.status(500).json({ message: "Failed to verify admin status" });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // ============================================
  // AUTH ROUTES
  // ============================================
  
  // GET /api/auth/user - Get current authenticated user
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ============================================
  // ADMIN ROUTES
  // ============================================
  
  // GET /api/admin/users - List all users (admin only)
  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const result = await storage.getAllUsers(limit, offset);
      res.json(result);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // PATCH /api/admin/users/:userId - Update user (admin only)
  app.patch("/api/admin/users/:userId", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;
      const actorId = req.user.claims.sub;
      
      const updatedUser = await storage.updateUser(userId, updates);
      
      // Log the activity
      await storage.logActivity({
        userId,
        actorId,
        activityType: 'user_updated',
        description: `User updated by admin`,
        metadata: { updates },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // PATCH /api/admin/users/:userId/role - Change user role (admin only)
  app.patch("/api/admin/users/:userId/role", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      const actorId = req.user.claims.sub;
      
      if (!['user', 'admin', 'superadmin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const updatedUser = await storage.updateUserRole(userId, role);
      
      // Log the activity
      await storage.logActivity({
        userId,
        actorId,
        activityType: 'role_changed',
        description: `User role changed to ${role}`,
        metadata: { newRole: role },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // PATCH /api/admin/users/:userId/kyc - Update KYC status (admin only)
  app.patch("/api/admin/users/:userId/kyc", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { kycStatus, rejectionReason } = req.body;
      const actorId = req.user.claims.sub;
      
      const updatedUser = await storage.updateUserKYCStatus(userId, kycStatus, rejectionReason);
      
      // Log the activity
      await storage.logActivity({
        userId,
        actorId,
        activityType: kycStatus === 'Approved' ? 'kyc_approved' : 'kyc_rejected',
        description: `KYC ${kycStatus.toLowerCase()} by admin`,
        metadata: { kycStatus, rejectionReason },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating KYC status:", error);
      res.status(500).json({ message: "Failed to update KYC status" });
    }
  });

  // DELETE /api/admin/users/:userId - Delete user (admin only)
  app.delete("/api/admin/users/:userId", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const actorId = req.user.claims.sub;
      
      await storage.deleteUser(userId);
      
      // Log the activity
      await storage.logActivity({
        userId,
        actorId,
        activityType: 'user_deleted',
        description: `User deleted by admin`,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // GET /api/admin/analytics - Get admin analytics (admin only)
  app.get("/api/admin/analytics", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { users: allUsers } = await storage.getAllUsers(1000, 0);
      
      const analytics = {
        totalUsers: allUsers.length,
        activeBots: 0,
        totalLearningSessions: 0,
        avgWinRate: 0
      };
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // GET /api/admin/audit-logs - Get activity logs (admin only)
  app.get("/api/admin/audit-logs", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const logs = await storage.getActivityLogs(limit, offset);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // ============================================
  // WALLET ROUTES
  // ============================================
  
  // GET /api/wallets - Get user's wallets
  app.get("/api/wallets", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const wallets = await storage.getUserWallets(userId);
      res.json(wallets || []);
    } catch (error) {
      console.error("Error fetching wallets:", error);
      res.status(500).json({ message: "Failed to fetch wallets" });
    }
  });

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}
