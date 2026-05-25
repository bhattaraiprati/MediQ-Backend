// repository/messageRepository.ts
import { Message } from "../models/Message";
import { messageRole } from "../types/Enum";

export class MessageRepository {

    async create(
        chat_id: string,
        role: messageRole,
        content: string
    ): Promise<Message> {
        return await Message.create({ chat_id, role, content });
    }

    async findAllByChat(chat_id: string): Promise<Message[]> {
        return await Message.findAll({
            where: { chat_id },
            order: [["created_at", "ASC"]],
        });
    }
}

export const messageRepository = new MessageRepository();