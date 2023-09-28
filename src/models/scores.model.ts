import { DataTypes, Model, CreationOptional, InferAttributes, InferCreationAttributes } from "sequelize";
import sequelize from "../config/sequelize";
import Users from "./users";

class Scores extends Model<InferAttributes<Scores>, InferCreationAttributes<Scores>> {
  declare id: string;
  declare user_id: string;
  declare score: number;
  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

Scores.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, allowNull: false },
    user_id: { type: DataTypes.UUID, allowNull: false },
    score: { type: DataTypes.STRING, allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  },
  { sequelize, modelName: "scores", timestamps: true, createdAt: "created_at", updatedAt: "updated_at" }
);

Scores.hasOne(Users, { as: "player", sourceKey: "user_id", foreignKey: "id", foreignKeyConstraint: true });

export default Scores;
