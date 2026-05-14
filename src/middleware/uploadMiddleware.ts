
import multer from 'multer';
import { Request } from 'express';

const storage = multer.memoryStorage(); 

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = [
        'application/pdf',
        'text/csv',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
        'application/msword', // doc
        'text/plain'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF, CSV, DOC, DOCX and TXT files are allowed!'));
    }
};

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB limit
    }
});

// Multiple files support
export const uploadMultiple = upload.array('files', 5); // max 5 files at once

// Single file
export const uploadSingle = upload.single('file');