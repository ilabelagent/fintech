import express from 'express';
import supertest from 'supertest';
import { registerRoutes } from '../routes';
import http from 'http';
import { storage } from '../storage';
import { generateToken } from '../authService';

let app: express.Express;
let server: http.Server;

// Mock the storage module
jest.mock('../storage');

const mockUsers = [
  { id: '1', email: 'test1@example.com', firstName: 'Test', lastName: 'User1', isAdmin: false },
  { id: '2', email: 'test2@example.com', firstName: 'Test', lastName: 'User2', isAdmin: false },
];

beforeAll((done) => {
  app = express();
  app.use(express.json());
  registerRoutes(app);
  server = http.createServer(app);
  server.listen(done);
});

afterAll((done) => {
  server.close(done);
});

describe('Admin API', () => {
  describe('GET /api/admin/users', () => {
    it('should return a list of users for an admin', async () => {
      const adminUser = { id: 'admin-user-id', isAdmin: true, isActive: true };
      const token = generateToken(adminUser.id);

      // Mock the storage functions
      (storage.getAdminUser as jest.Mock).mockResolvedValue(adminUser);
      (storage.getUsers as jest.Mock).mockResolvedValue({
        users: mockUsers,
        total: mockUsers.length,
      });

      const response = await supertest(server)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.users).toEqual(mockUsers);
      expect(response.body.total).toBe(mockUsers.length);
    });

    it('should return 403 for a non-admin user', async () => {
      const regularUser = { id: 'regular-user-id', isAdmin: false };
      const token = generateToken(regularUser.id);

      (storage.getAdminUser as jest.Mock).mockResolvedValue(null);

      const response = await supertest(server)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /api/admin/users/:id', () => {
    it("should update a user's admin status for an admin", async () => {
      const adminUser = { id: 'admin-user-id', isAdmin: true, isActive: true };
      const token = generateToken(adminUser.id);
      const userToUpdate = { id: 'user-to-update', isAdmin: false };
      const updatedUser = { ...userToUpdate, isAdmin: true };

      (storage.getAdminUser as jest.Mock).mockResolvedValue(adminUser);
      (storage.updateUser as jest.Mock).mockResolvedValue(updatedUser);

      const response = await supertest(server)
        .patch(`/api/admin/users/${userToUpdate.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ isAdmin: true });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedUser);
    });

    it('should return 403 for a non-admin user', async () => {
      const regularUser = { id: 'regular-user-id', isAdmin: false };
      const token = generateToken(regularUser.id);
      const userToUpdate = { id: 'user-to-update', isAdmin: false };

      (storage.getAdminUser as jest.Mock).mockResolvedValue(null);

      const response = await supertest(server)
        .patch(`/api/admin/users/${userToUpdate.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ isAdmin: true });

      expect(response.status).toBe(403);
    });
  });
});
