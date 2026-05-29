import { Model, DataTypes } from "sequelize";
import sequelize from "../config/db";
import { roleEnum, userStatus } from "../types/Enum";

export class User extends Model {
    declare id: string;
    declare name: string;
    declare email: string;
    declare password: string;
    declare role: roleEnum;
    declare profilePicture: string;
    declare isVerified: boolean;
    declare status : userStatus.ACTIVE
    declare verificationToken: string | null;

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
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    verificationToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    profilePicture: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status:{
        type:DataTypes.STRING,
        allowNull: false
    }
}, {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"   // Better to keep updated_at
});