// src/services/authService.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/User';

class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET ?? 'your_jwt_secret';
  private static readonly JWT_EXPIRES_IN = '24h';

  static async register(username: string, email: string, password: string): Promise<{ user: any; token: string }> {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword
    });

    // Save user to database
    const savedUser = await newUser.save();
    
    // Generate JWT token
    const token = this.generateToken(savedUser._id.toString());
    
    // Return user data without password and token
    const userResponse = {
      _id: savedUser._id,
      username: savedUser.username,
      email: savedUser.email
    };
    
    return { user: userResponse, token };
  }

  static async login(email: string, password: string): Promise<{ user: any; token: string }> {
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT token
    const token = this.generateToken(user._id.toString());
    
    // Return user data without password and token
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email
    };
    
    return { user: userResponse, token };
  }

  static async verifyToken(token: string): Promise<boolean> {
    try {
      jwt.verify(token, this.JWT_SECRET);
      return true;
    } catch (error) {
      return false;
    }
  }

  static generateToken(userId: string): string {
    return jwt.sign({ userId }, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN
    });
  }
}

export default AuthService;