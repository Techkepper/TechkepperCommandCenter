/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt
} from "sequelize-typescript";

import Collaborator from "./Collaborator";
import SmartDocument from "./SmartDocument";
import User from "./User";

@Table({ tableName: "CollaboratorDocuments" })
class CollaboratorDocument extends Model<CollaboratorDocument> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER, allowNull: false })
  id: number;

  @ForeignKey(() => Collaborator)
  @Column({ type: DataType.INTEGER, allowNull: false })
  collaboratorId: number;

  @BelongsTo(() => Collaborator)
  collaborator: Collaborator;

  @Unique
  @ForeignKey(() => SmartDocument)
  @Column({ type: DataType.INTEGER, allowNull: false })
  documentId: number;

  @BelongsTo(() => SmartDocument)
  document: SmartDocument;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  linkedById: number;

  @BelongsTo(() => User, "linkedById")
  linkedBy: User;

  @CreatedAt
  @Column({ type: DataType.DATE, allowNull: false })
  createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, allowNull: false })
  updatedAt: Date;
}

export default CollaboratorDocument;
