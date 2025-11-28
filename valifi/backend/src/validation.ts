/**
 * Input Validation Schemas for Valifi API
 * Uses Zod for runtime type checking and validation
 */

import { z } from 'zod';

// Auth Validation Schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
});

// Admin Validation Schemas
export const updateUserSchema = z.object({
  isAdmin: z.boolean(),
});

export const trainBotSchema = z.object({
  sessionType: z.enum(['supervised', 'reinforcement', 'transfer']),
  trainingDataset: z.string().min(1, 'Training dataset is required'),
});

export const broadcastSchema = z.object({
  message: z.string().min(1, 'Message is required').max(1000),
  targetUserIds: z.array(z.string()).optional(),
});

export const mintEtherealElementSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  rarity: z.enum(['common', 'uncommon', 'rare', 'epic', 'legendary']),
  metadata: z.record(z.unknown()),
});

// Query Parameter Validation
export const paginationSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(10),
  offset: z.coerce.number().int().min(0).default(0),
});

// Dashboard Validation Schemas
export const saveDashboardConfigSchema = z.object({
  layout: z.array(z.unknown()),
});

export const saveDashboardPreferenceSchema = z.object({
  widgetId: z.string().min(1, 'Widget ID is required'),
  settings: z.record(z.unknown()),
});

// Validation Middleware Factory
export function validateBody<T extends z.ZodSchema>(schema: T) {
  return async (req: any, res: any, next: any) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
}

export function validateQuery<T extends z.ZodSchema>(schema: T) {
  return async (req: any, res: any, next: any) => {
    try {
      req.query = await schema.parseAsync(req.query);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
}

export function validateParams<T extends z.ZodSchema>(schema: T) {
  return async (req: any, res: any, next: any) => {
    try {
      req.params = await schema.parseAsync(req.params);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
}
