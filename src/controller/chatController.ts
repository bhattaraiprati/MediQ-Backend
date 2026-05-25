// controller/chatController.ts
import { Response } from "express";
import { AuthRequest } from "../middleware/authmiddleware";
import { generateChatResponse } from "../service/chatService";
import { chatRepository } from "../repository/chatRepository";
import { messageRepository } from "../repository/messageRepository";

// POST /api/chat  — send a message (creates chat if no chat_id)
export async function chat(req: AuthRequest, res: Response): Promise<void> {
    const { query, topK } = req.body;
    const currentChat = req.chat!; // guaranteed by chatRoomMiddleware

    try {
        const result = await generateChatResponse(currentChat, query.trim(), topK ?? 7);

        res.status(200).json({
            success: true,
            chat_id: result.chat_id,   // frontend stores this for follow-up messages
            query,
            answer: result.answer,
        });
    } catch (error) {
        console.error("Chat error:", error);
        res.status(500).json({ message: "Failed to generate a response. Please try again." });
    }
}

// GET /api/chat  — list all chat rooms for the sidebar
export async function getAllChats(req: AuthRequest, res: Response): Promise<void> {
    try {
        const chats = await chatRepository.findAllByUser(req.user!.id);
        res.status(200).json({ success: true, chats });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch chats." });
    }
}

// GET /api/chat/:chat_id  — open a chat room, returns all messages
export async function getChatMessages(req: AuthRequest, res: Response): Promise<void> {
    const chat_id = req.params.chat_id as string;
    const user_id = req.user!.id;
    console.log("the chat is is", chat_id , "and user id is", user_id)

    try {
        // Verify ownership before returning messages
        const owned = await chatRepository.findByUserAndId(user_id, chat_id);
        if (!owned) {
            res.status(404).json({ message: "Chat not found or access denied." });
            return;
        }

        const chat = await chatRepository.findByIdWithMessages(chat_id);
        res.status(200).json({ success: true, chat });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Failed to fetch messages." });
    }
}

// DELETE /api/chat/:chat_id  — soft delete a chat room
export async function deleteChat(req: AuthRequest, res: Response): Promise<void> {
    const chat_id = req.params.chat_id as string;

    try {
        const deleted = await chatRepository.softDelete(chat_id, req.user!.id);
        if (!deleted) {
            res.status(404).json({ message: "Chat not found or access denied." });
            return;
        }
        res.status(200).json({ success: true, message: "Chat deleted." });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete chat." });
    }
}