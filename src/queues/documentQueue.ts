import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';

export interface DocumentJobData {
    documentId: string;
    userId: string;
    originalName: string;
}

export const documentQueue = new Queue<DocumentJobData>('document-processing', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,              // retry failed jobs up to 3 times
        backoff: {
            type: 'exponential',  // wait 2s, 4s, 8s between retries
            delay: 2000,
        },
        removeOnComplete: {
            count: 50,            // keep last 50 completed jobs for monitoring
        },
        removeOnFail: {
            count: 100,           // keep last 100 failed jobs for debugging
        },
    },
});

// Helper to add a document job to the queue
export async function addDocumentToQueue(data: DocumentJobData): Promise<string> {
    const jobId = `doc-${data.documentId}`;

    const job = await documentQueue.add('process-pdf', data, { jobId });

    console.log(`Job ${job.id} added to queue for document: ${data.originalName}`);
    return job.id!;
}

