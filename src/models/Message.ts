import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";
import { messageRole } from "../types/Enum";

export class Message extends Model {
    declare id: string;
    declare chat_id: string;
    declare role: messageRole;
    declare content: string;

}

Message.init({
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    chat_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'chats', key: 'id' }
    },
    role: { type: DataTypes.STRING, defaultValue: messageRole.USER },
    content: { 
        type: DataTypes.TEXT,        // Important: Use TEXT
        allowNull: false 
    },
    
}, {
    sequelize,
    modelName: "Message",
    tableName: "messages",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false
});