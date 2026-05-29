// src/routes/documentRoutes.ts
import { Router } from 'express';
import {  uploadSingle } from '../middleware/uploadMiddleware';
import { authMiddleware } from '../middleware/authmiddleware';
import { getAllDocuments,  getDocumentStatus, uploadDocuments } from '../controller/documentController';

const router = Router();

router.use(authMiddleware);

router.post('/upload',  uploadSingle, uploadDocuments);
router.get('/status/', getDocumentStatus);
router.get('/all', getAllDocuments);



export default router;