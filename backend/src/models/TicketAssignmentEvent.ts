import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo
} from "sequelize-typescript";
import Ticket from "./Ticket";
import User from "./User";

@Table
class TicketAssignmentEvent extends Model<TicketAssignmentEvent> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Ticket)
  @Column
  ticketId: number;

  @BelongsTo(() => Ticket)
  ticket: Ticket;

  @ForeignKey(() => User)
  @Column
  oldUserId: number;

  @BelongsTo(() => User, "oldUserId")
  oldUser: User;

  @ForeignKey(() => User)
  @Column
  newUserId: number;

  @BelongsTo(() => User, "newUserId")
  newUser: User;

  @ForeignKey(() => User)
  @Column
  performedByUserId: number;

  @BelongsTo(() => User, "performedByUserId")
  performedByUser: User;

  @Column
  action: string;

  @Column
  autoMessageStatus: string;

  @Column(DataType.TEXT)
  autoMessageError: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default TicketAssignmentEvent;
