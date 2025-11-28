// Minimal Valifi API Routes - Auth endpoints for QA testing
import type { Express, Request, Response, NextFunction } from 'express';
import { createServer, type Server } from 'http';
import { authenticateToken as isAuthenticated } from './authService';
import { storage } from './storage';
import {
  validateBody,
  validateQuery,
  paginationSchema,
  updateUserSchema,
  trainBotSchema,
  broadcastSchema,
  mintEtherealElementSchema,
} from './validation';

// Extend Express Request type to include authenticated user
interface AuthenticatedRequest extends Request {
  userId?: string;
  user?: {
    claims: {
      sub: string;
    };
    [key: string]: unknown;
  };
}

// Temp admin check middleware
const isAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.claims.sub;
    console.log('isAdmin middleware, userId:', userId);
    const adminUser = await storage.getAdminUser(userId);
    console.log('isAdmin middleware, adminUser:', adminUser);

    if (!adminUser || !adminUser.isActive) {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }

    // Attach the full user object to the request for downstream use
    const user = await storage.getUser(userId);
    req.user = { ...user, admin: adminUser };
    next();
  } catch (error) {
    console.error('Error in isAdmin middleware:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // GET /api/auth/user - Get current authenticated user
  app.get('/api/auth/user', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  // GET /api/wallets - Get user's wallets
  app.get('/api/wallets', isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user.claims.sub;
      const wallets = await storage.getUserWallets(userId);
      res.json(wallets || []);
    } catch (error) {
      console.error('Error fetching wallets:', error);
      res.status(500).json({ message: 'Failed to fetch wallets' });
    }
  });

  // --- Admin Routes ---

  // GET /api/admin/analytics
  app.get('/api/admin/analytics', isAuthenticated, isAdmin, async (_req, res) => {
    try {
      const analytics = await storage.getAdminAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching admin analytics:', error);
      res.status(500).json({ message: 'Failed to fetch admin analytics' });
    }
  });

  // GET /api/admin/users - Get all users (paginated)
  app.get(
    '/api/admin/users',
    isAuthenticated,
    isAdmin,
    validateQuery(paginationSchema),
    async (req: Request, res: Response) => {
      try {
        const { limit, offset } = req.query as { limit: number; offset: number };
        const data = await storage.getUsers(limit, offset);
      res.json(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  // PATCH /api/admin/users/:id - Update a user
  app.patch(
    '/api/admin/users/:id',
    isAuthenticated,
    isAdmin,
    validateBody(updateUserSchema),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { isAdmin } = req.body;
        const updatedUser = await storage.updateUser(id, { isAdmin });
        res.json(updatedUser);
      } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Failed to update user' });
      }
    }
  );

  // GET /api/admin/bots - Get all bots (paginated)
  app.get('/api/admin/bots', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      const data = await storage.getBots(limit, offset);
      res.json(data);
    } catch (error) {
      console.error('Error fetching bots:', error);
      res.status(500).json({ message: 'Failed to fetch bots' });
    }
  });

  // GET /api/admin/bots/:id/training
  app.get(
    '/api/admin/bots/:id/training',
    isAuthenticated,
    isAdmin,
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const data = await storage.getBotTrainingData(id);
        res.json(data);
      } catch (error) {
        console.error('Error fetching bot training data:', error);
        res.status(500).json({ message: 'Failed to fetch bot training data' });
      }
    }
  );

  // POST /api/admin/bots/:id/train
  app.post(
    '/api/admin/bots/:id/train',
    isAuthenticated,
    isAdmin,
    validateBody(trainBotSchema),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { sessionType, trainingDataset } = req.body;
        const result = await storage.trainBot(id, sessionType, trainingDataset);
        res.json(result);
      } catch (error) {
        console.error('Error starting training session:', error);
        res.status(500).json({ message: 'Failed to start training session' });
      }
    }
  );

  // POST /api/admin/chat/send
  app.post(
    '/api/admin/chat/send',
    isAuthenticated,
    isAdmin,
    validateBody(broadcastSchema),
    async (req: Request, res: Response) => {
      try {
        const result = await storage.sendBroadcast(req.body);
        res.json(result);
      } catch (error) {
        console.error('Error sending broadcast:', error);
        res.status(500).json({ message: 'Failed to send broadcast' });
      }
    }
  );

  // GET /api/admin/audit-logs
  app.get(
    '/api/admin/audit-logs',
    isAuthenticated,
    isAdmin,
    async (req: Request, res: Response) => {
      try {
        const limit = parseInt(req.query.limit as string) || 20;
        const data = await storage.getAuditLogs(limit);
        res.json(data);
      } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ message: 'Failed to fetch audit logs' });
      }
    }
  );

  // POST /api/assets/ethereal/mint
  app.post(
    '/api/assets/ethereal/mint',
    isAuthenticated,
    isAdmin,
    validateBody(mintEtherealElementSchema),
    async (req: Request, res: Response) => {
      try {
        const newElement = await storage.mintEtherealElement(req.body);
        res.status(201).json(newElement);
      } catch (error) {
        console.error('Error minting ethereal element:', error);
        res.status(500).json({ message: 'Failed to mint ethereal element' });
      }
    }
  );

  // --- Dashboard Routes ---

  // GET /api/dashboard/config
  app.get('/api/dashboard/config', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const config = await storage.getDashboardConfig(userId);
      res.json(config);
    } catch (error) {
      console.error('Error fetching dashboard config:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard config' });
    }
  });

  // GET /api/dashboard/preferences
  app.get('/api/dashboard/preferences', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const preferences = await storage.getDashboardPreferences(userId);
      res.json(preferences);
    } catch (error) {
      console.error('Error fetching dashboard preferences:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard preferences' });
    }
  });

  // POST /api/dashboard/config
  app.post('/api/dashboard/config', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const newConfig = await storage.saveDashboardConfig(userId, req.body);
      res.status(201).json(newConfig);
    } catch (error) {
      console.error('Error saving dashboard config:', error);
      res.status(500).json({ message: 'Failed to save dashboard config' });
    }
  });

  // POST /api/dashboard/preferences
  app.post('/api/dashboard/preferences', isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user.claims.sub;
      const newPref = await storage.saveDashboardPreference(userId, req.body);
      res.status(201).json(newPref);
    } catch (error) {
      console.error('Error saving dashboard preference:', error);
      res.status(500).json({ message: 'Failed to save dashboard preference' });
    }
  });

  // DELETE /api/dashboard/preferences/:widgetId
  app.delete(
    '/api/dashboard/preferences/:widgetId',
    isAuthenticated,
    async (req: any, res: Response) => {
      try {
        const userId = req.user.claims.sub;
        const { widgetId } = req.params;
        await storage.deleteDashboardPreference(userId, widgetId);
        res.status(204).send();
      } catch (error) {
        console.error('Error deleting dashboard preference:', error);
        res.status(500).json({ message: 'Failed to delete dashboard preference' });
      }
    }
  );

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}
