// src/workers/documentWorker.ts
import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { DocumentJobData } from '../queues/documentQueue';
import { processDocument } from '../service/pdfParcerService';
import { Document } from '../models/Document';
import { documentStatus } from '../types/Enum';
import { docsProcessDocument } from '../service/docsParserService';
import { textProcessDocument } from '../service/textParserService';

let workerInstance: Worker | null = null;

export function getDocumentWorker(): Worker {
    if (workerInstance) return workerInstance;

    workerInstance = new Worker<DocumentJobData>(
        'document-processing',
        async (job: Job<DocumentJobData>) => {
            const { documentId, originalName } = job.data;
            console.log(`[Job ${job.id}] Starting: ${originalName}`);

            await job.updateProgress(10);

            const doc = await Document.findOne({ where: { id: documentId } });

            if (!doc) {
                throw new Error(`Document ${documentId} not found in DB`);
            }

            if (doc.processing_status === documentStatus.COMPLETED) {
                console.log(`[Job ${job.id}] Already completed — skipping`);
                return;
            }

            // Mark as processing
            await Document.update(
                { processing_status: documentStatus.PROCESSING },
                { where: { id: documentId } }
            );

            await job.updateProgress(20);
            
            if(doc.file_type == "application/pdf"){
            // processDocument no longer needs to check status — worker owns that
            await processDocument(documentId);
            }
            else if(doc.file_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"){
                await docsProcessDocument(documentId);
            }
            else if(doc.file_type == "text/plain"){
                await textProcessDocument(documentId);
            }
            else{
                return;
            }
            await job.updateProgress(100);
            console.log(`[Job ${job.id}] Completed: ${originalName}`);
        },
        {
            connection: redisConnection,
            concurrency: 1, // process ONE at a time
        }
    );

    workerInstance.on('completed', (job) => {
        console.log(`Job ${job.id} completed successfully`);
    });

    workerInstance.on('failed', (job, error) => {
        console.error(`Job ${job?.id} failed:`, error.message);
    });

    workerInstance.on('progress', (job, progress) => {
        console.log(`Job ${job.id} progress: ${progress}%`);
    });

    console.log('Document worker started (concurrency: 1)');
    return workerInstance;
}