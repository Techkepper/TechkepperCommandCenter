/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  HasMany,
  AutoIncrement,
  Default,
  DataType
} from "sequelize-typescript";

import Contact from "./Contact";
import Message from "./Message";
import Queue from "./Queue";
import User from "./User";
import Whatsapp from "./Whatsapp";
import Ecosystem from "./Ecosystem";
import TicketAssignmentEvent from "./TicketAssignmentEvent";

@Table
class Ticket extends Model<Ticket> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({ defaultValue: "pending" })
  status: string;

  @Column(DataType.VIRTUAL)
  noAvailableAgent: boolean;

  @Column
  unreadMessages: number;

  @Column
  lastMessage: string;

  @Column(DataType.STRING)
  lastCustomerMessageId: string | null;

  @Default(false)
  @Column
  isGroup: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  userId: number | null;

  @BelongsTo(() => User)
  user: User | null;

  @ForeignKey(() => Contact)
  @Column
  contactId: number;

  @BelongsTo(() => Contact)
  contact: Contact;

  @ForeignKey(() => Whatsapp)
  @Column
  whatsappId: number;

  @BelongsTo(() => Whatsapp)
  whatsapp: Whatsapp;

  @ForeignKey(() => Queue)
  @Column(DataType.INTEGER)
  queueId: number | null;

  @BelongsTo(() => Queue)
  queue: Queue | null;

  @ForeignKey(() => Ecosystem)
  @Column(DataType.INTEGER)
  ecosystemId: number | null;

  @BelongsTo(() => Ecosystem)
  ecosystem: Ecosystem | null;

  @Column
  firstResponseAt: Date;

  @Column
  closedAt: Date;

  @HasMany(() => Message)
  messages: Message[];

  @HasMany(() => TicketAssignmentEvent)
  assignmentEvents: TicketAssignmentEvent[];
}

export default Ticket;
