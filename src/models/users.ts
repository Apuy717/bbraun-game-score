import { DataTypes, Model, CreationOptional, InferAttributes, InferCreationAttributes } from "sequelize";
import sequelize from "../config/sequelize";

class Users extends Model<InferAttributes<Users>, InferCreationAttributes<Users>> {
  declare id: string;
  declare fullname: string;
  declare phone_number: string;
  declare agency: string;
  declare role: string;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
  static associate(models: any) {
    Users.belongsTo(models.scores);
  }
}

Users.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
    fullname: { type: DataTypes.STRING, allowNull: false },
    phone_number: { type: DataTypes.STRING, allowNull: false },
    agency: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.STRING, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  },
  { sequelize, modelName: "users", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);

export default Users;
