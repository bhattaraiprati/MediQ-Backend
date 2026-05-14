import { Model, DataTypes } from "sequelize";
import sequelize from "../config/db";
import { roleEnum } from "../types/Enum";

export class User extends Model {
    declare id: string;
    declare name: string;
    declare email: string;
    declare password: string;
    declare role: roleEnum;
}

User.init({
    id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
    },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { 
        type: DataTypes.STRING, 
        allowNull: false, 
        unique: true 
    },
    password: { type: DataTypes.STRING, allowNull: false },
    role: {
        type: DataTypes.STRING,
        defaultValue: roleEnum.USER
    }
}, {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"   // Better to keep updated_at
});