import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";


export class DocumentChunk extends Model {
    declare id: string;
    declare document_id: string;
    declare chunk_index: number;
    declare text: string;
    declare pinecone_vector_id: string;
}

DocumentChunk.init({
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    document_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'documents', key: 'id' }
    },
    chunk_index: { type: DataTypes.INTEGER, allowNull: false },
    text: { 
        type: DataTypes.TEXT, 
        allowNull: false 
    },
    pinecone_vector_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
}, {
    sequelize,
    modelName: "DocumentChunk",
    tableName: "document_chunks",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false
});