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
  DataType,
  HasMany
} from "sequelize-typescript";

import User from "./User";
import Contact from "./Contact";
import Ticket from "./Ticket";
import Queue from "./Queue";
import Ecosystem from "./Ecosystem";
import SmartDocumentEvent from "./SmartDocumentEvent";

@Table({
  tableName: "SmartDocuments",
  paranoid: true
})
class SmartDocument extends Model<SmartDocument> {
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
  title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  description: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: false
  })
  originalName: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false
  })
  storedName: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: false
  })
  storagePath: string;

  @Column({
    type: DataType.STRING(150),
    allowNull: false
  })
  mimeType: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  size: number;

  @Column({
    type: DataType.STRING(120),
    allowNull: true
  })
  category: string | null;

  @Column({
    type: DataType.STRING(80),
    allowNull: true
  })
  purpose: string | null;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    defaultValue: "generated"
  })
  status: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  tags: string | null;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  uploadedById: number;

  @BelongsTo(() => User, "uploadedById")
  uploadedBy: User;

  @ForeignKey(() => Contact)
  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  contactId: number | null;

  @BelongsTo(() => Contact)
  contact: Contact | null;

  @ForeignKey(() => Ticket)
  @Column({
    type: DataType.INTEGER,
    allowNull: true
  })
  ticketId: number | null;

  @BelongsTo(() => Ticket)
  ticket: Ticket | null;

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

  @HasMany(() => SmartDocumentEvent)
  events: SmartDocumentEvent[];

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

export default SmartDocument;
