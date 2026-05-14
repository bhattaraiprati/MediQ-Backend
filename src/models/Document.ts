import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";
import { documentStatus } from "../types/Enum";


export class Document extends Model {
    declare id: string;
    declare user_id: string;
    declare title: string;
    declare original_name: string;
    declare cloudinary_url: string;
    declare file_type: string;
    declare processing_status: documentStatus;
    declare total_chunks: number;
}


Document.init({
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
    original_name: { type: DataTypes.STRING, allowNull: false },
    cloudinary_url: { type: DataTypes.STRING, allowNull: false },
    file_type: { type: DataTypes.STRING, allowNull: false },
    processing_status: {
        type: DataTypes.STRING,
        defaultValue: documentStatus.PENDING
    },
    total_chunks: { type: DataTypes.INTEGER, defaultValue: 0 }

}, {
    sequelize,
    modelName: "Document",
    tableName: "documents",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
});