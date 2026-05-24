import { ChatGroq } from '@langchain/groq';
import { findSimilarChunks } from './SimalaritySearch';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

const llm = new ChatGroq({
    model: 'llama-3.3-70b-versatile',  // or mixtral-8x7b-32768
    apiKey: process.env.GROQ_API_KEY!,
    temperature: 0.2,
});


export interface ChatResponse {
    answer: string;
    sources: Array<{
        chunk_index: number;
        score: number;
        text_snippet: string;
    }>;
}

export async function generateChatResponse(
    query: string,
    topK: number = 10     
): Promise<ChatResponse> {

    // Step 1: Retrieve similar chunks from Pinecone
    const matches = await findSimilarChunks(query, topK);

    if (!matches || matches.length === 0) {
        return {
            answer: "I couldn't find any relevant information in the uploaded documents to answer your question.",
            sources: [],
        };
    }

    // Step 2: Build context string from retrieved chunks
    const relevantMatches = matches.filter((m) => (m.score ?? 0) >= 0.25);

    if (relevantMatches.length === 0) {
        return {
            answer: "I found some documents but nothing closely matched your question. Try rephrasing.",
            sources: [],
        };
    }

    const contextChunks = relevantMatches
        .filter((match) => match.metadata?.text)
        .map((match, idx) => `[Source ${idx + 1}]\n${match.metadata!.text}`)
        .join('\n\n---\n\n');

    // Step 3: Build the RAG prompt

    const prompt = `You are MediQ, a helpful and accurate Pharmaceutical AI assistant.

Below are excerpts from the uploaded pharmaceutical documents. Use ALL of the provided context to give a thorough, detailed answer. Do not summarise briefly — include all relevant properties, mechanisms, indications, dosages, side effects, interactions, and related compounds mentioned across the sources.

If a piece of information appears in multiple sources, synthesise it into a complete answer. Do not say "based on the context", "the document states" or "Based on the uploaded documents" — just answer directly and completely.

If a specific detail is genuinely not present in any of the sources, say: "That specific detail is not covered in the uploaded documents."

---
CONTEXT FROM UPLOADED DOCUMENTS:

${contextChunks}

---
USER QUESTION: ${query}

ANSWER:`;

    // Step 4: Call the LLM
    const response = await llm.invoke(prompt);
    const answer =
        typeof response.content === 'string'
            ? response.content
            : JSON.stringify(response.content);

    // Step 5: Build source citations
    const sources = relevantMatches
        .filter((match) => match.metadata?.text)
        .map((match) => ({
            chunk_index: Number(match.metadata!.chunk_index ?? -1),
            score: Math.round((match.score ?? 0) * 100) / 100,
            text_snippet: String(match.metadata!.text).slice(0, 200) + '...',
        }));

    return { answer, sources };
}