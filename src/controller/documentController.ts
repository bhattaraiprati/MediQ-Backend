// src/controllers/documentController.ts
import { Request, Response } from 'express';
import cloudinary from '../config/cloudinary';
import { Document } from '../models/Document';
import { v4 as uuidv4 } from 'uuid';
import { processDocument } from '../service/pdfParcerService';

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

        // Trigger PDF processing in the background.
        // We do NOT await this — the response is returned immediately,
        // and the embedding happens asynchronously.
        processDocument(document.id).catch((err) =>
            console.error(`Background processing failed for doc ${document.id}:`, err)
        );

        return res.status(201).json({
            success: true,
            message: 'File uploaded successfully. Processing started in background.',
            file: {
                id: document.id,
                filename: document.original_name,
                url: document.cloudinary_url,
                status: document.processing_status,
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