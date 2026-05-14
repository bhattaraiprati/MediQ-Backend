import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";


export class MessageSource extends Model {
    declare id: string;
    declare message_id: string;
    declare document_id: string;
    declare similarity_score?: number;
}

MessageSource.init({
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    message_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'messages', key: 'id' }
    },
    document_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'documents', key: 'id' }
    },
    similarity_score: { type: DataTypes.FLOAT }
}, {
    sequelize,
    modelName: "MessageSource",
    tableName: "message_sources",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false
});