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

@Table({ tableName: "InternalNotifications" })
class InternalNotification extends Model<InternalNotification> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER, allowNull: false })
  id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  userId: number;

  @BelongsTo(() => User, "userId")
  user: User;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  createdById: number | null;

  @BelongsTo(() => User, "createdById")
  createdBy: User | null;

  @Column({ type: DataType.STRING(80), allowNull: false })
  type: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  title: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  message: string;

  @ForeignKey(() => SmartDocument)
  @Column({ type: DataType.INTEGER, allowNull: false })
  documentId: number;

  @BelongsTo(() => SmartDocument)
  document: SmartDocument;

  @Column({ type: DataType.STRING(50), allowNull: false })
  status: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  comment: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  readAt: Date | null;

  @CreatedAt
  @Column({ type: DataType.DATE, allowNull: false })
  createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, allowNull: false })
  updatedAt: Date;
}

export default InternalNotification;
