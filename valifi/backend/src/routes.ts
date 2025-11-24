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
  // OTC (OVER-THE-COUNTER) PROCUREMENT ROUTES
  // ============================================
  
  // Admin: Create OTC task
  app.post("/api/admin/otc/tasks", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const task = await storage.createOTCTask({
        ...req.body,
        adminId,
        currentClaimers: 0
      });
      
      await storage.logActivity({
        userId: adminId,
        actorId: adminId,
        activityType: 'transaction_created',
        description: `Created OTC task for ${req.body.cryptoType}`,
        metadata: { taskId: task.id },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.json(task);
    } catch (error) {
      console.error("Error creating OTC task:", error);
      res.status(500).json({ message: "Failed to create OTC task" });
    }
  });

  // Admin: Get all OTC tasks
  app.get("/api/admin/otc/tasks", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const tasks = await storage.getAllOTCTasks(limit, offset);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching OTC tasks:", error);
      res.status(500).json({ message: "Failed to fetch OTC tasks" });
    }
  });

  // Admin: Get all OTC orders
  app.get("/api/admin/otc/orders", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const orders = await storage.getAllOTCOrders(limit, offset);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching OTC orders:", error);
      res.status(500).json({ message: "Failed to fetch OTC orders" });
    }
  });

  // Admin: Review OTC order
  app.patch("/api/admin/otc/orders/:orderId", isAuthenticated, isAdmin, async (req: any, res) => {
    try {
      const { orderId } = req.params;
      const { status, adminNotes, commissionEarned, rejectionReason } = req.body;
      const adminId = req.user.claims.sub;
      
      const order = await storage.getOTCOrder(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Validate status transitions
      const validStatuses = ['Approved', 'Rejected', 'Paid'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      // Can only approve/reject if order is under review
      if ((status === 'Approved' || status === 'Rejected') && order.status !== 'Under Review') {
        return res.status(400).json({ message: "Can only approve/reject orders under review" });
      }
      
      // Can only pay if approved
      if (status === 'Paid' && order.status !== 'Approved') {
        return res.status(400).json({ message: "Can only pay approved orders" });
      }
      
      // Require commission for approved orders
      if (status === 'Approved' && !commissionEarned) {
        return res.status(400).json({ message: "Commission amount required for approval" });
      }
      
      // If rejecting, decrement task claim count
      if (status === 'Rejected') {
        const task = await storage.getOTCTask(order.taskId);
        if (task) {
          const newClaimers = Math.max(0, task.currentClaimers - 1);
          await storage.updateOTCTask(order.taskId, {
            currentClaimers: newClaimers,
            status: newClaimers === 0 ? 'Open' : 'In Progress'
          });
        }
      }
      
      // Build update object preserving existing values
      const updateData: any = { status, adminNotes };
      
      if (status === 'Approved') {
        updateData.commissionEarned = commissionEarned;
        updateData.reviewedAt = new Date();
      } else if (status === 'Rejected') {
        updateData.rejectionReason = rejectionReason;
        updateData.reviewedAt = new Date();
      } else if (status === 'Paid') {
        // Preserve existing commission from approval
        updateData.paidAt = new Date();
      }
      
      const updatedOrder = await storage.updateOTCOrder(orderId, updateData);
      
      // Check if all orders for this task are complete
      if (status === 'Paid' || status === 'Rejected') {
        const task = await storage.getOTCTask(order.taskId);
        if (task) {
          const allOrders = await storage.getOTCOrdersByTask(order.taskId);
          const hasOutstanding = allOrders.some(o => 
            o.status === 'Claimed' || 
            o.status === 'Pending Proof' || 
            o.status === 'Under Review' || 
            o.status === 'Approved'
          );
          
          if (!hasOutstanding) {
            await storage.updateOTCTask(order.taskId, {
              status: 'Completed'
            });
          }
        }
      }
      
      await storage.logActivity({
        userId: order.userId,
        actorId: adminId,
        activityType: 'transaction_created',
        description: `OTC order ${status.toLowerCase()}`,
        metadata: { orderId, status },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
      
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error reviewing OTC order:", error);
      res.status(500).json({ message: "Failed to review OTC order" });
    }
  });

  // User: Get active OTC tasks
  app.get("/api/otc/tasks", isAuthenticated, async (req: any, res) => {
    try {
      const tasks = await storage.getActiveOTCTasks();
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching OTC tasks:", error);
      res.status(500).json({ message: "Failed to fetch OTC tasks" });
    }
  });

  // User: Claim OTC task
  app.post("/api/otc/tasks/:taskId/claim", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { taskId } = req.params;
      
      const task = await storage.getOTCTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      if (task.status !== 'Open') {
        return res.status(400).json({ message: "Task is not open" });
      }
      
      if (task.currentClaimers >= task.maxClaimers) {
        return res.status(400).json({ message: "Task is fully claimed" });
      }
      
      const order = await storage.createOTCOrder({
        taskId,
        userId,
        status: 'Claimed'
      });
      
      await storage.updateOTCTask(taskId, {
        currentClaimers: task.currentClaimers + 1,
        status: task.currentClaimers + 1 >= task.maxClaimers ? 'In Progress' : 'Open'
      });
      
      res.json(order);
    } catch (error) {
      console.error("Error claiming OTC task:", error);
      res.status(500).json({ message: "Failed to claim OTC task" });
    }
  });

  // User: Submit proof for OTC order
  app.patch("/api/otc/orders/:orderId/submit", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { orderId } = req.params;
      const { purchaseAmount, purchasePrice, proofOfPurchase, transactionHash } = req.body;
      
      const order = await storage.getOTCOrder(orderId);
      if (!order || order.userId !== userId) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Can only submit proof if order is claimed or pending proof
      if (order.status !== 'Claimed' && order.status !== 'Pending Proof') {
        return res.status(400).json({ message: "Cannot modify order after submission" });
      }
      
      const updatedOrder = await storage.updateOTCOrder(orderId, {
        purchaseAmount,
        purchasePrice,
        proofOfPurchase,
        transactionHash,
        status: 'Under Review',
        submittedAt: new Date()
      });
      
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error submitting OTC proof:", error);
      res.status(500).json({ message: "Failed to submit OTC proof" });
    }
  });

  // User: Get my OTC orders
  app.get("/api/otc/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orders = await storage.getUserOTCOrders(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching OTC orders:", error);
      res.status(500).json({ message: "Failed to fetch OTC orders" });
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
