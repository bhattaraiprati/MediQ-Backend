// middleware/chatRoomMiddleware.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "./authmiddleware";
import { chatRepository } from "../repository/chatRepository";

// Attaches chat to req so the controller can use it
const chatRoomMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { query, chat_id } = req.body;
    const user_id = req.user!.id;

    if (!query || typeof query !== "string" || query.trim() === "") {
        res.status(400).json({ message: "query is required and must be a non-empty string." });
        return;
    }

    try {
        if (chat_id) {
            // Continuing an existing chat — verify ownership
            const existingChat = await chatRepository.findByUserAndId(user_id, chat_id);
            if (!existingChat) {
                res.status(404).json({ message: "Chat not found or access denied." });
                return;
            }
            req.chat = existingChat;
        } else {
            // No chat_id → create a new chat room with the query as the title
            const newChat = await chatRepository.createChatRoom(user_id, query.trim());
            req.chat = newChat;
        }

        next();
    } catch (error) {
        console.error("chatRoomMiddleware error:", error);
        res.status(500).json({ message: "Failed to resolve chat room." });
    }
};

export default chatRoomMiddleware;