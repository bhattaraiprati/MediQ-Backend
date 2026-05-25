import { ChatGroq } from '@langchain/groq';
import { findSimilarChunks } from './SimalaritySearch';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { Chat } from '../models/Chat';
import { ChatResponse } from '../types/interface';
import { messageRepository } from '../repository/messageRepository';
import { messageRole } from '../types/Enum';

const llm = new ChatGroq({
    model: 'llama-3.3-70b-versatile',  // or mixtral-8x7b-32768
    apiKey: process.env.GROQ_API_KEY!,
    temperature: 0.2,
});


export async function generateChatResponse(
    chat:Chat,
    query: string,
    topK: number = 7
): Promise<ChatResponse> {

    await messageRepository.create(chat.id, messageRole.USER, query);

    // Step 1: Retrieve similar chunks from Pinecone
    const matches = await findSimilarChunks(query, topK);

    if (!matches || matches.length === 0) {
        const fallback = "I couldn't find any relevant information in the uploaded documents to answer your question.";
        await messageRepository.create(chat.id, messageRole.ASSISTANT, fallback);
        return { answer: fallback, chat_id: chat.id, sources: [] };
    }

    // Step 2: Build context string from retrieved chunks
    const relevantMatches = matches.filter((m) => (m.score ?? 0) >= 0.25);

    if (relevantMatches.length === 0) {
        const fallback = "I found some documents but nothing closely matched your question. Try rephrasing.";
        await messageRepository.create(chat.id, messageRole.ASSISTANT, fallback);
        return { answer: fallback, chat_id: chat.id, sources: [] };
    }

    const contextChunks = relevantMatches
        .filter((match) => match.metadata?.text)
        .map((match, idx) => `[Source ${idx + 1}]\n${match.metadata!.text}`)
        .join('\n\n---\n\n');

    // Step 3: Build the RAG prompt

    // const prompt = `You are MediQ, a clinical pharmaceutical AI assistant used by licensed healthcare professionals.

    //     ## YOUR ONLY SOURCE OF TRUTH
    //     Everything you state MUST come directly from the CONTEXT below. You have no other knowledge.

    //     ## STRICT RULES
    //     1. ONLY use information explicitly present in the CONTEXT. Word-for-word facts only.
    //     2. NEVER infer, assume, or complete gaps with general medical knowledge — even if you're confident it's correct.
    //     3. If a detail is absent from the CONTEXT, say exactly: "Not documented in available sources." — nothing more.
    //     4. NEVER say "based on the context", "the document states", "the sources mention", or similar phrases.
    //     5. NEVER apologise or explain what you can't do. Just answer what you can.
        

    //     ## RESPONSE FORMAT
    //     Structure your response using only the sections for which you have CONTEXT data.
    //     Skip any section entirely if the CONTEXT has no data for it.

    //     Use this structure when applicable:

    //     **Overview**
    //     [1–2 sentence summary of what the drug is and its drug class]

    //     **Available Formulations & Strengths**
    //     [List each formulation with exact strengths as stated in the CONTEXT]

    //     **Indications**
    //     First-line: [list]
    //     Second-line: [list]

    //     **Mechanism of Action**
    //     [Only if explicitly in CONTEXT]

    //     **Dosage**
    //     [Exact dosages by indication/age group/weight as stated. If absent: "Not documented in available sources."]

    //     **Side Effects**
    //     [Only side effects explicitly listed in CONTEXT. If absent: "Not documented in available sources."]

    //     **Contraindications & Warnings**
    //     [Only if explicitly in CONTEXT]

    //     **Drug Interactions**
    //     [Only if explicitly in CONTEXT]

    //     **Related Compounds**
    //     [Only if explicitly mentioned in CONTEXT]

    //     ---
    //     CONTEXT FROM UPLOADED DOCUMENTS:
    //     ${contextChunks}

    //     ---
    //     USER QUESTION: ${query}

    //     ANSWER:`;
    // const prompt = `You are MediQ, a helpful and accurate Pharmaceutical AI assistant.

    //     Below are excerpts from the uploaded pharmaceutical documents. Use ALL of the provided context to give a thorough, detailed answer. 
    //     Do not summarise briefly — include all relevant properties, mechanisms, indications, 
    //     dosages, side effects, interactions, and related compounds mentioned across the sources.

    //     If a piece of information appears in multiple sources, synthesise it into a complete answer. 
    //     Do not say "based on the context", "the document states" or "Based on the uploaded documents" 
    //     — just answer directly and completely.

    //     If a specific detail is genuinely not present in any of the sources, 
    //     say: "That specific detail is not covered in the uploaded documents."

    //     ## STRICT RULES
    //         1. ONLY use information explicitly present in the CONTEXT. Word-for-word facts only.
    //         2. NEVER infer, assume, or complete gaps with general medical knowledge — even if you're confident it's correct.
    //         3. If a detail is absent from the CONTEXT, say exactly: "Not documented in available sources." — nothing more.
    //         4. NEVER say "based on the context", "the document states", "the sources mention", or similar phrases.
    //         5. NEVER apologise or explain what you can't do. Just answer what you can.
    //         6. If any details of the context is not found that "specific detail is not covered in the uploaded documents", just leave the context.
    //         7. Just answer the context you get, dont answer if you dont get the context in some fields.
    //     ---
    //     CONTEXT FROM UPLOADED DOCUMENTS:

    //     ${contextChunks}

    //     ---
    //     USER QUESTION: ${query}

    //     ANSWER:`;

    const prompt = `
        You are MediQ, a pharmaceutical reference assistant for healthcare professionals.

        Your job is to answer using ONLY the supplied context.

        IMPORTANT RULES:

        1. Never mention sources, chunks, documents, uploaded files, or context.
        2. Never say "Source 1", "Source 2", "the document states", or similar.
        3. Never infer missing medical facts from prior knowledge.
        4. If information is missing, omit it entirely.
        5. Do not write "not documented in available sources".
        6. Only include sections supported by context.
        7. If only formulations are present, return only formulations.

        Format output as a clean drug monograph.

        Use headings only when data exists.

        Example structure:

        # Drug Name

        ## Overview

        ## Available Formulations

        ## Indications

        ## Dosage

        ## Warnings

        ## Adverse Effects

        Only include sections with supporting evidence.

        CONTEXT:
        ${contextChunks}

        QUESTION:
        ${query}

        ANSWER:
        `;

    // Step 4: Call the LLM
    const response = await llm.invoke(prompt);
    const answer =
        typeof response.content === 'string'
            ? response.content
            : JSON.stringify(response.content);

    await messageRepository.create(chat.id, messageRole.ASSISTANT, answer);

    // Step 5: Build source citations
    const sources = relevantMatches
        .filter((match) => match.metadata?.text)
        .map((match) => ({
            chunk_index: Number(match.metadata!.chunk_index ?? -1),
            score: Math.round((match.score ?? 0) * 100) / 100,
            text_snippet: String(match.metadata!.text).slice(0, 200) + '...',
        }));

    return { answer, chat_id: chat.id, sources };
}