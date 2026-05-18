import { Router } from 'express';
import { authMiddleware } from '../middleware/authmiddleware';
import { chat } from '../controller/chatController';

const router = Router();

// Protected chat endpoint
router.post('/', authMiddleware, chat);

export default router;
