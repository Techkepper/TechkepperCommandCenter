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
  UpdatedAt
} from "sequelize-typescript";

import SmartDocument from "./SmartDocument";
import User from "./User";

@Table({ tableName: "SmartDocumentEvents" })
class SmartDocumentEvent extends Model<SmartDocumentEvent> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER, allowNull: false })
  id: number;

  @ForeignKey(() => SmartDocument)
  @Column({ type: DataType.INTEGER, allowNull: false })
  documentId: number;

  @BelongsTo(() => SmartDocument)
  document: SmartDocument;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  userId: number | null;

  @BelongsTo(() => User)
  user: User | null;

  @Column({ type: DataType.STRING(80), allowNull: false })
  eventType: string;

  @Column({ type: DataType.STRING(50), allowNull: true })
  previousStatus: string | null;

  @Column({ type: DataType.STRING(50), allowNull: true })
  newStatus: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  comment: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  metadata: string | null;

  @CreatedAt
  @Column({ type: DataType.DATE, allowNull: false })
  createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, allowNull: false })
  updatedAt: Date;
}

export default SmartDocumentEvent;
