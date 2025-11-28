/**
 * Security Middleware for Valifi Fintech Platform
 * Implements comprehensive security measures for production deployment
 */

import type { Express, Request, Response, NextFunction } from 'express';

/**
 * Simple rate limiter implementation
 * Tracks requests per IP and enforces limits
 */
class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Cleanup old entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    for (const [ip, data] of this.requests.entries()) {
      if (now > data.resetTime) {
        this.requests.delete(ip);
      }
    }
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const now = Date.now();

      let requestData = this.requests.get(ip);

      if (!requestData || now > requestData.resetTime) {
        requestData = { count: 0, resetTime: now + this.windowMs };
        this.requests.set(ip, requestData);
      }

      requestData.count++;

      if (requestData.count > this.maxRequests) {
        return res.status(429).json({
          message: 'Too many requests, please try again later',
          retryAfter: Math.ceil((requestData.resetTime - now) / 1000),
        });
      }

      res.setHeader('X-RateLimit-Limit', this.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', (this.maxRequests - requestData.count).toString());
      res.setHeader('X-RateLimit-Reset', new Date(requestData.resetTime).toISOString());

      next();
    };
  }
}

/**
 * Security Headers Middleware (Helmet alternative)
 * Sets essential security headers
 */
export function securityHeaders() {
  return (_req: Request, res: Response, next: NextFunction) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Strict Transport Security (HTTPS only)
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    // Content Security Policy
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.stripe.com https://*.infura.io https://*.alchemy.com wss://relay.walletconnect.com"
    );

    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    next();
  };
}

/**
 * CORS Middleware
 * Configures Cross-Origin Resource Sharing
 */
export function corsMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:5000',
    ];

    const origin = req.headers.origin;

    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (process.env.NODE_ENV === 'development') {
      // Allow all origins in development
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    next();
  };
}

/**
 * Request size limiter
 * Prevents large payloads that could cause DoS
 */
export function requestSizeLimiter(maxSize: string = '10mb') {
  const maxBytes = parseSize(maxSize);

  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');

    if (contentLength > maxBytes) {
      return res.status(413).json({
        message: `Request entity too large. Maximum size is ${maxSize}`,
      });
    }

    next();
  };
}

/**
 * Input sanitization middleware
 * Sanitizes user input to prevent XSS and injection attacks
 */
export function sanitizeInput() {
  return (req: Request, _res: Response, next: NextFunction) => {
    // Sanitize body only (query params are readonly and validated by Zod schemas)
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }

    // Note: req.query and req.params are readonly in Express
    // They are validated by Zod schemas in validation.ts instead

    next();
  };
}

/**
 * Setup all security middleware
 */
export function setupSecurity(app: Express) {
  // Rate limiting for all routes
  const rateLimiter = new RateLimiter(
    parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100')
  );

  // Strict rate limiting for auth endpoints
  const authRateLimiter = new RateLimiter(
    15 * 60 * 1000, // 15 minutes
    5 // 5 attempts
  );

  // Apply security middleware
  app.use(securityHeaders());
  app.use(corsMiddleware());
  app.use(requestSizeLimiter('10mb'));
  app.use(sanitizeInput());

  // Apply general rate limiting to all routes
  app.use(rateLimiter.middleware());

  // Apply strict rate limiting to auth routes
  app.use('/api/auth/login', authRateLimiter.middleware());
  app.use('/api/auth/register', authRateLimiter.middleware());

  console.log('Security middleware initialized');
}

// Helper functions

function parseSize(size: string): number {
  const units: Record<string, number> = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-z]+)$/);
  if (!match) return parseInt(size);

  const value = parseFloat(match[1]);
  const unit = match[2];

  return value * (units[unit] || 1);
}

function sanitizeObject(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) {
    return sanitizeValue(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeObject(value);
  }

  return sanitized;
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value !== 'string') return value;

  // Remove potential XSS vectors
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}
