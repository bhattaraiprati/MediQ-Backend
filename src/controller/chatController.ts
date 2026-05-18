import { Response } from 'express';
import { AuthRequest } from '../middleware/authmiddleware';
import { generateChatResponse } from '../service/chatService';

/**
 * POST /api/chat
 * Body: { query: string, topK?: number }
 *
 * Runs the full RAG pipeline and returns an LLM-generated answer
 * grounded in the user's uploaded documents.
 */
export async function chat(req: AuthRequest, res: Response): Promise<void> {
    const { query, topK } = req.body;

    if (!query || typeof query !== 'string' || query.trim() === '') {
        res.status(400).json({ message: 'query is required and must be a non-empty string.' });
        return;
    }

    try {
        const result = await generateChatResponse(query.trim(), topK ?? 5);

        res.status(200).json({
            success: true,
            query,
            answer: result.answer,
            // sources: result.sources,
        });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ message: 'Failed to generate a response. Please try again.' });
    }
}
