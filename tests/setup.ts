import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import User from '../app/models/User';
import AuthService from '../app/services/authService';

let mongoServer: MongoMemoryServer;

// Setup test database before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

// Clear database between tests
afterEach(async () => {
  await User.deleteMany({});
});

// Close database connection after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Create test users helper function
export const createTestUsers = async (count: number = 10) => {
  const users = [];
  for (let i = 0; i < count; i++) {
    const result = await AuthService.register(
      `testuser${i}`,
      `testuser${i}@example.com`,
      'Password123!'
    );
    users.push(result);
  }
  return users;
};