import UserService from '../../app/services/userService';
import User from '../../app/models/User';
import { createTestUsers } from '../setup';
import mongoose from 'mongoose';

describe('UserService', () => {
  let testUsers: any[];
  
  beforeEach(async () => {
    // Create multiple test users
    testUsers = await createTestUsers(5);
  });
  
  describe('getAllUsers', () => {
    it('should return all users without passwords', async () => {
      const users = await UserService.getAllUsers();
      
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThanOrEqual(5);
      
      // Check first user
      expect(users[0]).toHaveProperty('username');
      expect(users[0]).toHaveProperty('email');
      expect(users[0]).not.toHaveProperty('password');
    });
  });
  
  describe('getUserById', () => {
    it('should return a specific user by ID without password', async () => {
      const userId = testUsers[0].user._id.toString();
      const user = await UserService.getUserById(userId);
      
      expect(user).not.toBeNull();
      expect(user).toHaveProperty('username', testUsers[0].user.username);
      expect(user).toHaveProperty('email', testUsers[0].user.email);
      expect(user).not.toHaveProperty('password');
    });
    
    it('should return null for non-existent user ID', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const user = await UserService.getUserById(fakeId);
      
      expect(user).toBeNull();
    });
  });
  
  describe('updateUser', () => {
    it('should update user and return updated data without password', async () => {
      const userId = testUsers[1].user._id.toString();
      const updateData = { username: 'updatedname' };
      
      const updatedUser = await UserService.updateUser(userId, updateData);
      
      expect(updatedUser).not.toBeNull();
      expect(updatedUser).toHaveProperty('username', 'updatedname');
      expect(updatedUser).toHaveProperty('email', testUsers[1].user.email);
      expect(updatedUser).not.toHaveProperty('password');
      
      // Verify changes were persisted
      const dbUser = await User.findById(userId);
      expect(dbUser?.username).toBe('updatedname');
    });
    
    it('should ignore password field in update data', async () => {
      const userId = testUsers[2].user._id.toString();
      const originalUser = await User.findById(userId);
      const originalPassword = originalUser?.password;
      
      const updateData = { 
        username: 'secureuser',
        password: 'NewPassword123!'
      };
      
      await UserService.updateUser(userId, updateData);
      
      // Verify password wasn't changed
      const updatedUser = await User.findById(userId);
      expect(updatedUser?.password).toBe(originalPassword);
    });
    
    it('should return null for non-existent user ID', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const updateData = { username: 'nonexistent' };
      
      const updatedUser = await UserService.updateUser(fakeId, updateData);
      
      expect(updatedUser).toBeNull();
    });
  });
  
  describe('deleteUser', () => {
    it('should delete user and return true', async () => {
      const userId = testUsers[3].user._id.toString();
      
      const result = await UserService.deleteUser(userId);
      
      expect(result).toBe(true);
      
      // Verify user was deleted
      const deletedUser = await User.findById(userId);
      expect(deletedUser).toBeNull();
    });
    
    it('should return false for non-existent user ID', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      
      const result = await UserService.deleteUser(fakeId);
      
      expect(result).toBe(false);
    });
  });
});