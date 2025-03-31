import AuthService from '../../app/services/authService';
import User from '../../app/models/User';
import bcrypt from 'bcrypt';

describe('AuthService', () => {
  describe('register', () => {
    it('should register a new user and return user data with token', async () => {
      const result = await AuthService.register('testuser', 'test@example.com', 'Password123!');
      
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user).toHaveProperty('username', 'testuser');
      expect(result.user).toHaveProperty('email', 'test@example.com');
      expect(result.user).not.toHaveProperty('password');
      
      // Verify user was saved to database
      const savedUser = await User.findOne({ email: 'test@example.com' });
      expect(savedUser).not.toBeNull();
      expect(savedUser?.username).toBe('testuser');
    });
    
    it('should hash the password before saving', async () => {
      await AuthService.register('passworduser', 'password@example.com', 'Password123!');
      
      // Verify password was hashed
      const savedUser = await User.findOne({ email: 'password@example.com' });
      expect(savedUser).not.toBeNull();
      expect(savedUser?.password).not.toBe('Password123!');
      
      // Verify the hash works for comparison
      const isMatch = await bcrypt.compare('Password123!', savedUser!.password);
      expect(isMatch).toBe(true);
    });
    
    it('should throw error if user already exists', async () => {
      // Create user first
      await AuthService.register('duplicateuser', 'duplicate@example.com', 'Password123!');
      
      // Try to create same user again
      await expect(
        AuthService.register('duplicateuser', 'duplicate@example.com', 'Password123!')
      ).rejects.toThrow('User already exists');
    });
  });
  
  describe('login', () => {
    beforeEach(async () => {
      // Create a test user before each login test
      await AuthService.register('loginuser', 'login@example.com', 'Password123!');
    });
    
    it('should login successfully with correct credentials', async () => {
      const result = await AuthService.login('login@example.com', 'Password123!');
      
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user).toHaveProperty('username', 'loginuser');
      expect(result.user).toHaveProperty('email', 'login@example.com');
    });
    
    it('should throw error with incorrect password', async () => {
      await expect(
        AuthService.login('login@example.com', 'WrongPassword123!')
      ).rejects.toThrow('Invalid credentials');
    });
    
    it('should throw error with non-existent email', async () => {
      await expect(
        AuthService.login('nonexistent@example.com', 'Password123!')
      ).rejects.toThrow('Invalid credentials');
    });
  });
  
  describe('verifyToken', () => {
    it('should verify a valid token', async () => {
      // Register to get a valid token
      const { token } = await AuthService.register('verifyuser', 'verify@example.com', 'Password123!');
      
      const result = await AuthService.verifyToken(token);
      expect(result).toBe(true);
    });
    
    it('should return false for invalid token', async () => {
      const result = await AuthService.verifyToken('invalid.token.here');
      expect(result).toBe(false);
    });
  });
});