// src/routes/authRoutes.ts
import express from 'express';
import AuthController from '../controllers/authController';

const router = express.Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/verify', AuthController.verifyToken);

export default router;

