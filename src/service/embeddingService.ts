import { OllamaEmbeddings } from '@langchain/ollama';
import { Pinecone } from '@pinecone-database/pinecone';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { v4 as uuidv4 } from 'uuid';
import { Document } from '../models/Document';
import { DocumentChunk } from '../models/DocumentChunk';
import { documentStatus } from '../types/Enum';

// Setup Ollama Embeddings 
// Connects to Ollama (running in Docker) to generate embeddings.
// OLLAMA_BASE_URL = 'http://ollama:11434' inside Docker
// OLLAMA_BASE_URL = 'http://localhost:11434' when running locally
const embeddings = new OllamaEmbeddings({
    model: 'nomic-embed-text', // lightweight embedding model, outputs 768 numbers
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
});

//  Setup Pinecone Client
const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
});

//  Text Splitter
// Splits a large text into smaller overlapping chunks
const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,    // each chunk is ~500 characters
    chunkOverlap: 50,  // 50-char overlap to preserve context at boundaries
});

//  Main Export Function
/**
 * Takes extracted text and a document DB record ID.
 * Splits into chunks → embeds each via Ollama → stores vectors in Pinecone
 * → saves chunk metadata to PostgreSQL.
 */
export async function embedAndStoreDocument(
    extractedText: string,
    documentId: string
): Promise<void> {
    // Mark document as 'processing' in DB
    await Document.update(
        { processing_status: documentStatus.PROCESSING },
        { where: { id: documentId } }
    );

    try {
        //  Split text into chunks
        const docs = await textSplitter.createDocuments([extractedText]);
        console.log(`Split into ${docs.length} chunks`);

        //  Get the Pinecone index
        // This index must already exist in your Pinecone dashboard with 768 dimensions
        const indexName = process.env.PINECONE_INDEX_NAME!;
        const index = pinecone.index(indexName);

        //  Embed each chunk and upsert to Pinecone
        const chunkRecords: Array<{
            chunk_index: number;
            text: string;
            pinecone_vector_id: string;
        }> = [];

        // Process in batches to avoid overwhelming Ollama
        const BATCH_SIZE = 10;
        for (let i = 0; i < docs.length; i += BATCH_SIZE) {
            const batch = docs.slice(i, i + BATCH_SIZE);
            const texts = batch.map((doc) => doc.pageContent);

            // Send texts to Ollama → get back array of vectors
            // e.g. [[0.12, 0.87, ...], [0.34, -0.22, ...], ...]
            const vectors = await embeddings.embedDocuments(texts);

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
                    values: vector,             // the actual 768 numbers
                    metadata: {
                        document_id: documentId,
                        chunk_index: globalIdx,
                        text: texts[batchIdx],  // stored for easy retrieval during search
                    },
                };
            });

            // Upload this batch to Pinecone
            await index.upsert(pineconeVectors);
            console.log(`Upserted batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(docs.length / BATCH_SIZE)}`);
        }

        //  Save chunk records to PostgreSQL
        const dbChunks = chunkRecords.map((chunk) => ({
            id: uuidv4(),
            document_id: documentId,
            chunk_index: chunk.chunk_index,
            text: chunk.text,
            pinecone_vector_id: chunk.pinecone_vector_id,
        }));

        await DocumentChunk.bulkCreate(dbChunks);

        //  Mark document as completed
        await Document.update(
            {
                processing_status: documentStatus.COMPLETED,
                total_chunks: chunkRecords.length,
            },
            { where: { id: documentId } }
        );

        console.log(`Document ${documentId} embedded successfully. Chunks: ${chunkRecords.length}`);
    } catch (error) {
        // If anything fails, mark document as 'failed'
        await Document.update(
            { processing_status: documentStatus.FAILED },
            { where: { id: documentId } }
        );
        console.error('Embedding failed:', error);
        throw error;
    }
}
