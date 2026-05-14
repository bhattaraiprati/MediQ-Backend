// associations.ts
import { User } from "./User";
import { Chat } from "./Chat";
import { Message } from "./Message";
import { Document } from "./Document";
import { DocumentChunk } from "./DocumentChunk";
import { MessageSource } from "./MessageSource";

export const setupAssociations = () => {

    // User ↔ Chat
    User.hasMany(Chat, { foreignKey: 'user_id', as: 'chats' });
    Chat.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

    // Chat ↔ Message
    Chat.hasMany(Message, { foreignKey: 'chat_id', as: 'messages' });
    Message.belongsTo(Chat, { foreignKey: 'chat_id', as: 'chat' });

    // User ↔ Document
    User.hasMany(Document, { foreignKey: 'user_id', as: 'documents' });
    Document.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

    // Document ↔ DocumentChunk
    Document.hasMany(DocumentChunk, { foreignKey: 'document_id', as: 'chunks' });
    DocumentChunk.belongsTo(Document, { foreignKey: 'document_id', as: 'document' });

    // Message ↔ MessageSource
    Message.hasMany(MessageSource, { foreignKey: 'message_id', as: 'sources' });
    MessageSource.belongsTo(Message, { foreignKey: 'message_id', as: 'message' });

    // Document ↔ MessageSource
    Document.hasMany(MessageSource, { foreignKey: 'document_id', as: 'messageSources' });
    MessageSource.belongsTo(Document, { foreignKey: 'document_id', as: 'document' });
};