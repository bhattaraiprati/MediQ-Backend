// src/routes/documentRoutes.ts
import { Router } from 'express';
import { uploadMultiple, uploadSingle } from '../middleware/uploadMiddleware';
import { authMiddleware } from '../middleware/authmiddleware';
import { uploadDocuments } from '../controller/documentController';

const router = Router();

router.post('/upload', 
    authMiddleware, 
    uploadSingle, 
    uploadDocuments
);

export default router;