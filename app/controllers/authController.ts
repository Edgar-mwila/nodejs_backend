// src/controllers/authController.ts
import type { Request, Response } from 'express';
import AuthService from '../services/authService';

class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password } = req.body;
      
      if (!username || !email || !password) {
        res.status(400).json({ message: 'All fields are required' });
        return;
      }
      
      const result = await AuthService.register(username, email, password);
      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : 'An unknown error occurred' });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        res.status(400).json({ message: 'Email and password are required' });
        return;
      }
      
      const result = await AuthService.login(email, password);
      res.status(200).json(result);
    } catch (error) {
      res.status(401).json({ message: error instanceof Error ? error.message : 'Invalid credentials' });
    }
  }

  static async verifyToken(req: Request, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        res.status(401).json({ message: 'No token provided' });
        return;
      }
      
      const isValid = await AuthService.verifyToken(token);
      res.status(200).json({ valid: isValid });
    } catch (error) {
      res.status(401).json({ message: error instanceof Error ? error.message : 'Invalid token' });
    }
  }
}

export default AuthController;