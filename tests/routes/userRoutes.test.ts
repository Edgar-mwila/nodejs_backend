// tests/routes/userRoutes.test.ts
import request from 'supertest';
import express from 'express';
import userRoutes from '../../app/routes/userRoutes';
import { createTestUsers } from '../setup';
import jwt from 'jsonwebtoken';
import authRoutes from '../../app/routes/authRoutes';

// Mock the auth middleware
jest.mock('../../src/middleware/authMiddleware', () => ({
  authenticate: jest.fn((req, res, next) => {
    req.userId = req.headers['x-test-user-id'];
    next();
  })
}));

// Setup test app
const app = express();
app.use(express.json());
app.use((req, res, next) => {
  // Add header support for testing
  if (req.headers['authorization']) {
    const token = req.headers['authorization'].split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET ?? 'your_jwt_secret');
      if (typeof decoded !== 'string' && 'userId' in decoded) {
        req.headers['x-test-user-id'] = decoded.userId;
      }
    } catch (error) {
      // Token invalid, let the actual middleware handle it
    }
  }
  next();
});
app.use('/api/users', userRoutes);

describe('User Routes', () => {
  let testUsers: any[];
  let adminToken: string;
  let adminUserId: string;

  beforeEach(async () => {
    // Create multiple test users
    testUsers = await createTestUsers(10);
    adminToken = testUsers[0].token;
  });

  describe('GET /api/users', () => {
    it('should get all users when authenticated', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(10);
      expect(response.body[0]).toHaveProperty('username');
      expect(response.body[0]).toHaveProperty('email');
      expect(response.body[0]).not.toHaveProperty('password');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/users');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get a specific user by ID when authenticated', async () => {
      const userId = testUsers[1].user._id;
      
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('username', testUsers[1].user.username);
      expect(response.body).toHaveProperty('email', testUsers[1].user.email);
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 404 for non-existent user ID', async () => {
      const response = await request(app)
        .get('/api/users/60f7b1c8e60e6d3a8c6b7a1b') // Non-existent ID
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });

    it('should return 401 when not authenticated', async () => {
      const userId = testUsers[1].user._id;
      
      const response = await request(app)
        .get(`/api/users/${userId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update a user successfully when authenticated', async () => {
      const userId = testUsers[2].user._id;
      const updateData = {
        username: 'updateduser'
      };
      
      const response = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('username', 'updateduser');
      expect(response.body).toHaveProperty('email', testUsers[2].user.email);
    });

    it('should not update password field directly', async () => {
      const userId = testUsers[3].user._id;
      const updateData = {
        username: 'secureuser',
        password: 'NewPassword123!'
      };
      
      const response = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('username', 'secureuser');
      
      // Verify password wasn't changed by trying to login with old password
      const loginResponse = await request(express().use(express.json()).use('/api/auth', authRoutes))
        .post('/api/auth/login')
        .send({
          email: testUsers[3].user.email,
          password: 'Password123!' // Original password
        });
      
      expect(loginResponse.status).toBe(200);
    });

    it('should return 404 for non-existent user ID', async () => {
      const updateData = {
        username: 'nonexistent'
      };
      
      const response = await request(app)
        .put('/api/users/60f7b1c8e60e6d3a8c6b7a1b')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });

    it('should return 401 when not authenticated', async () => {
      const userId = testUsers[2].user._id;
      const updateData = {
        username: 'failedupdate'
      };
      
      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send(updateData);

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete a user successfully when authenticated', async () => {
      const userId = testUsers[4].user._id;
      
      const response = await request(app)
        .delete(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(204);
      
      // Verify user is deleted
      const checkResponse = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(checkResponse.status).toBe(404);
    });

    it('should return 404 for non-existent user ID', async () => {
      const response = await request(app)
        .delete('/api/users/60f7b1c8e60e6d3a8c6b7a1b')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'User not found');
    });

    it('should return 401 when not authenticated', async () => {
      const userId = testUsers[5].user._id;
      
      const response = await request(app)
        .delete(`/api/users/${userId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('Multiple users scenario', () => {
    it('should handle operations on multiple users correctly', async () => {
      // 1. Verify all 10 test users exist
      const allUsersResponse = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(allUsersResponse.status).toBe(200);
      expect(allUsersResponse.body.length).toBeGreaterThanOrEqual(10);
      
      // 2. Update multiple users
      for (let i = 6; i < 9; i++) {
        const userId = testUsers[i].user._id;
        const updateResponse = await request(app)
          .put(`/api/users/${userId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ username: `bulk-updated-user${i}` });
        
        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body).toHaveProperty('username', `bulk-updated-user${i}`);
      }
      
      // 3. Delete a user
      const deleteResponse = await request(app)
        .delete(`/api/users/${testUsers[9].user._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(deleteResponse.status).toBe(204);
      
      // 4. Verify correct number of users remain
      const finalUsersResponse = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(finalUsersResponse.status).toBe(200);
      expect(finalUsersResponse.body.length).toBe(9); // One was deleted
      
      // 5. Verify updates were persisted
      const bulkUpdatedUsers = finalUsersResponse.body.filter(
        (user: any) => user.username.startsWith('bulk-updated-user')
      );
      expect(bulkUpdatedUsers.length).toBe(3);
    });
  });
});