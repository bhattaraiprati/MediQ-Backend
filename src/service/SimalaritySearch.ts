import { OllamaEmbeddings } from "@langchain/ollama";
import {
    Pinecone,
    type ScoredPineconeRecord,
    type RecordMetadata,
} from "@pinecone-database/pinecone";

const embedding = new OllamaEmbeddings({
    model: 'nomic-embed-text',
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
});

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
});

export async function findSimilarChunks(
    query: string,
    topK: number = 10       // ── FIX: raised from 3 — need enough chunks to cover 3 files
): Promise<ScoredPineconeRecord<RecordMetadata>[]> {
    try {
        const indexName = process.env.PINECONE_INDEX_NAME!;
        const index = pinecone.index(indexName);

        // Embed the user query using the same model used during ingestion
        const queryEmbedding = await embedding.embedQuery(query);
        console.log(`Query embedding dimensions: ${queryEmbedding.length}`);

        const pineconeQuery = await index.query({
            topK,
            vector: queryEmbedding,
            includeMetadata: true,
        });

        console.log(
            `Pinecone returned ${pineconeQuery.matches.length} matches. ` +
            `Scores: ${pineconeQuery.matches.map((m) => m.score?.toFixed(3)).join(', ')}`
        );

        return pineconeQuery.matches;
    } catch (error) {
        console.error('Error finding similar chunks:', error);
        throw error;
    }
}