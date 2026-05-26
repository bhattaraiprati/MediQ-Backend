// src/controllers/documentController.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/authmiddleware';
import cloudinary from '../config/cloudinary';
import { Document } from '../models/Document';
import { v4 as uuidv4 } from 'uuid';
import { processDocument } from '../service/pdfParcerService';
import { addDocumentToQueue, documentQueue } from '../queues/documentQueue';

export const uploadDocuments = async (req: Request, res: Response) => {
    try {
        // req.file is populated by upload.single('file') via uploadSingle middleware
        const file = req.file;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded. Send a file under the "file" field.'
            });
        }
        console.log(req.user)

        const userId = req.user?.id;

        // Upload buffer to Cloudinary as base64 data URI
        const result = await cloudinary.uploader.upload(
            `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
            {
                folder: 'rag-documents',
                resource_type: 'auto',
                public_id: `${file.originalname}-${uuidv4()}`,
            }
        );

        // Persist metadata in DB
        const document = await Document.create({
            user_id: userId,
            title: file.originalname.split('.').slice(0, -1).join('.'),
            original_name: file.originalname,
            cloudinary_url: result.secure_url,
            file_type: file.mimetype,
            processing_status: 'pending',
            total_chunks: 0,
        });

        const jobId = await addDocumentToQueue({
            documentId: document.id,
            userId: userId!,
            originalName: file.originalname,
        });

         // 4. Get queue position so admin knows where they are in line
        const waitingCount = await documentQueue.getWaitingCount();

        
        // processDocument(document.id).catch((err) =>
        //     console.error(`Background processing failed for doc ${document.id}:`, err)
        // );

        return res.status(201).json({
            success: true,
            message: 'File uploaded successfully. Added to processing queue.',
            file: {
                id: document.id,
                filename: document.original_name,
                url: document.cloudinary_url,
                status: document.processing_status,
                jobId,
                queuePosition: waitingCount, // 0 = processing now, 1 = next, etc.
            },
        });

    } catch (error: any) {
        console.error('Upload Error:', error);
        return res.status(500).json({
            success: false,
            message: 'File upload failed',
            error: error.message,
        });
    }
};


// GET /api/documents/status/:id 
export const getDocumentStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const document = await Document.findOne({
            where: { id },
            attributes: ['id', 'original_name', 'processing_status', 'total_chunks'],
        });

        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        // Also check job progress in the queue
        const job = await documentQueue.getJob(`doc-${id}`);
        const progress = job ? await job.progress : null;
        const jobState = job ? await job.getState() : null;
        // States: waiting | active | completed | failed | delayed | paused

        return res.status(200).json({
            success: true,
            document: {
                id: document.id,
                name: document.original_name,
                status: document.processing_status,
                totalChunks: document.total_chunks,
                job: job ? { id: job.id, state: jobState, progress } : null,
            },
        });

    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getAllDocuments = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;

        const documents = await Document.findAll({
            where: { user_id: userId },
            attributes: ['id', 'original_name', 'file_type', 'created_at', 'processing_status', 'total_chunks'],
        });
        
        if (!documents) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }
        
        const mappedDocuments = documents.map(doc => ({
            id: doc.id,
            name: doc.original_name,
            file_type: doc.file_type,
            createdAt: doc.created_at,
            status: doc.processing_status,
            totalChunks: doc.total_chunks,
        }));

        return res.status(200).json({
            success: true,
            documents: mappedDocuments,
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
}
