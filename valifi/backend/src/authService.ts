import { Express, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { storage } from './storage';
import { insertUserSchema, users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { validateBody, loginSchema, registerSchema } from './validation';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET environment variable must be set and at least 32 characters long');
}

export const generateToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
};

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401); // No token

  jwt.verify(token, JWT_SECRET, (err: jwt.VerifyErrors | null, decoded: unknown) => {
    if (err) return res.sendStatus(403); // Invalid token

    // Type guard for decoded JWT payload
    const user = decoded as { userId: string };
    if (!user || !user.userId) {
      return res.sendStatus(403);
    }

    // Extend Request type with userId and user
    interface AuthRequest extends Request {
      userId?: string;
      user?: { claims: { sub: string } };
    }

    // Set both formats for compatibility
    (req as AuthRequest).userId = user.userId;
    // Set Replit Auth compatible format for existing routes
    (req as AuthRequest).user = {
      claims: {
        sub: user.userId,
      },
    };
    next();
  });
};

export async function setupAuth(app: Express) {
  app.post('/api/auth/register', validateBody(registerSchema), async (req, res) => {
    try {
      const validation = insertUserSchema.safeParse(req.body);
      if (!validation.success) {
        return res
          .status(400)
          .json({ message: 'Invalid user data', error: validation.error.toString() });
      }

      const { email, password, firstName, lastName } = validation.data;

      if (!password) {
        return res.status(400).json({ message: 'Password is required' });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: 'User with this email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await storage.upsertUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        profileImageUrl: '', // Default empty
        isAdmin: false,
      });

      const token = generateToken(newUser.id);
      const { password: _, ...userWithoutPassword } = newUser;
      res
        .status(201)
        .json({ message: 'User registered successfully', token, user: userWithoutPassword });
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', validateBody(loginSchema), async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await storage.getUserByEmail(email);
      if (!user || !user.password) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }

      const token = generateToken(user.id);
      const { password: _, ...userWithoutPassword } = user;
      res.json({ message: 'Logged in successfully', token, user: userWithoutPassword });
    } catch (error) {
      console.error('Error logging in user:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  app.post('/api/auth/logout', (_req, res) => {
    // On the client side, the token should be removed from localStorage.
    // This endpoint is mostly for acknowledging the logout action.
    res.json({ message: 'Logged out successfully' });
  });
}
