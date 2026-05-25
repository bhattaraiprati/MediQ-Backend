import {
    Pinecone,
    type ScoredPineconeRecord,
    type RecordMetadata,
} from '@pinecone-database/pinecone';
import { getJinaEmbedding } from './jinaService';

const pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
});

export async function findSimilarChunks(
    query: string,
    topK: number = 7 
): Promise<ScoredPineconeRecord<RecordMetadata>[]> {
    try {
        const indexName = process.env.PINECONE_INDEX_NAME!;
        const index = pinecone.index(indexName);

        const queryEmbedding = await getJinaEmbedding(query);

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