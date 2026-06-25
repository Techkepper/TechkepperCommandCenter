/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  HasMany,
  DataType,
  Default
} from "sequelize-typescript";

import User from "./User";
import Queue from "./Queue";
import Ecosystem from "./Ecosystem";
import SmartDocumentTemplateVersion from "./SmartDocumentTemplateVersion";

@Table({
  tableName: "SmartDocumentTemplates",
  paranoid: true
})
class SmartDocumentTemplate extends Model<SmartDocumentTemplate> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  id: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false
  })
  name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  description: string | null;

  @Column({
    type: DataType.STRING(120),
    allowNull: true
  })
  category: string | null;

  @Column({
    type: DataType.STRING(120),
    allowNull: true
  })
  documentType: string | null;

  @Column({
    type: DataType.STRING(80),
    allowNull: true
  })
  purpose: string | null;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false
  })
  requiresClient: boolean;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false
  })
  allowGenericRecipient: boolean;

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false
  })
  isActive: boolean;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  createdById: number;

  @BelongsTo(() => User, "createdById")
  createdBy: User;

  @ForeignKey(() => Queue)
  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  queueId: number | null;

  @BelongsTo(() => Queue)
  queue: Queue | null;

  @ForeignKey(() => Ecosystem)
  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  ecosystemId: number | null;

  @BelongsTo(() => Ecosystem)
  ecosystem: Ecosystem | null;

  @HasMany(() => SmartDocumentTemplateVersion)
  versions: SmartDocumentTemplateVersion[];

  @CreatedAt
  @Column({
    type: DataType.DATE,
    allowNull: false
  })
  createdAt: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    allowNull: false
  })
  updatedAt: Date;

  @DeletedAt
  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  deletedAt: Date | null;
}

export default SmartDocumentTemplate;
