import { Pinecone } from '@pinecone-database/pinecone';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { v4 as uuidv4 } from 'uuid';
import { Document } from '../models/Document';
import { DocumentChunk } from '../models/DocumentChunk';
import { documentStatus } from '../types/Enum';
import { getJinaEmbeddings } from './jinaService';

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
});


const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
});

export async function embedAndStoreDocument(
    extractedText: string,
    documentId: string
): Promise<void> {

    await Document.update(
        { processing_status: documentStatus.PROCESSING },
        { where: { id: documentId } }
    );

    try {
        const docs = await textSplitter.createDocuments([extractedText]);
        console.log(`Split into ${docs.length} chunks`);

        const indexName = process.env.PINECONE_INDEX_NAME!;
        const index = pinecone.index(indexName);

        const chunkRecords: Array<{
            chunk_index: number;
            text: string;
            pinecone_vector_id: string;
        }> = [];

        const BATCH_SIZE = 5;
        const delay_ms = 1000;
        for (let i = 0; i < docs.length; i += BATCH_SIZE) {
            const batch = docs.slice(i, i + BATCH_SIZE);

            // ← Filter empty/whitespace chunks BEFORE sending to embedding API
            const texts = batch
                .map((doc) => doc.pageContent)
                .filter((text) => text && text.trim().length > 10); // min 10 chars

            if (texts.length === 0) {
                console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1} skipped — all chunks were empty`);
                continue;  // skip this batch entirely
            }

            const vectors = await getJinaEmbeddings(texts);

            // Guard: catch any remaining empty vector responses
            if (!vectors || vectors.length === 0 || vectors[0].length === 0) {
                console.warn(`Batch ${Math.floor(i / BATCH_SIZE) + 1} returned empty vectors — skipping`);
                continue;
            }

            console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1} vector dimensions: ${vectors[0].length}`);

            const pineconeVectors = vectors.map((vector, batchIdx) => {
                const globalIdx = i + batchIdx;
                const vectorId = uuidv4();

                chunkRecords.push({
                    chunk_index: globalIdx,
                    text: texts[batchIdx],
                    pinecone_vector_id: vectorId,
                });

                return {
                    id: vectorId,
                    values: vector,
                    metadata: {
                        document_id: documentId,
                        chunk_index: globalIdx,
                        text: texts[batchIdx],
                    },
                };
            });

            await index.upsert(pineconeVectors);
            console.log(`Upserted batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(docs.length / BATCH_SIZE)}`);
            await new Promise((resolve) => setTimeout(resolve, delay_ms));
        }

        const dbChunks = chunkRecords.map((chunk) => ({
            id: uuidv4(),
            document_id: documentId,
            chunk_index: chunk.chunk_index,
            text: chunk.text,
            pinecone_vector_id: chunk.pinecone_vector_id,
        }));

        await DocumentChunk.bulkCreate(dbChunks);

        await Document.update(
            {
                processing_status: documentStatus.COMPLETED,
                total_chunks: chunkRecords.length,
            },
            { where: { id: documentId } }
        );

        console.log(`Document ${documentId} embedded successfully. Chunks: ${chunkRecords.length}`);
    } catch (error) {
        await Document.update(
            { processing_status: documentStatus.FAILED },
            { where: { id: documentId } }
        );
        console.error('Embedding failed:', error);
        throw error;
    }
}