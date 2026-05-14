import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";


export class Chat extends Model {
    declare id: string;
    declare user_id: string;
    declare title: string;
    declare is_active: boolean;
}

Chat.init({
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' }
    },
    title: { type: DataTypes.STRING, allowNull: false },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    sequelize,
    modelName: "Chat",
    tableName: "chats",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
});