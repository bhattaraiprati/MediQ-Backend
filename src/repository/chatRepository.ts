import { UUID } from "node:crypto";
import { Chat } from "../models/Chat";
import { Message } from "../models/Message";


export class ChatRepository{

    async createChatRoom(user_id: string, query: string): Promise<Chat> {
        // Truncate query to 100 chars for the title
        const title = query.length > 100 ? query.substring(0, 100).trimEnd() + "..." : query;
        return await Chat.create({ user_id, title });
    }

    async findById(id: string): Promise<Chat | null> {
        return await Chat.findOne({ where: { id, is_active: true } });
    }

    async findByUserAndId(user_id: string, id: string): Promise<Chat | null> {
        return await Chat.findOne({ where: { id, user_id, is_active: true } });
    }

    async findAllByUser(user_id: string): Promise<Chat[]> {
        return await Chat.findAll({
            where: { user_id, is_active: true },
            order: [["created_at", "DESC"]],
            // No messages here — sidebar only needs titles + timestamps
        });
    }

    async findByIdWithMessages(id: string): Promise<Chat | null> {
        return await Chat.findOne({
            where: { id, is_active: true },
            include: [{ model: Message, as: "messages", order: [["created_at", "ASC"]] }]
        });
    }

    async softDelete(id: string, user_id: string): Promise<boolean> {
        const [affected] = await Chat.update(
            { is_active: false },
            { where: { id, user_id } }
        );
        return affected > 0;
    }
}

export const chatRepository = new ChatRepository();