/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table
} from "sequelize-typescript";

@Table({ tableName: "AfterHoursAutoReplyEvents", updatedAt: false })
class AfterHoursAutoReplyEvent extends Model<AfterHoursAutoReplyEvent> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER, allowNull: false })
  id: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  contactId: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  ticketId: number;

  @Column({ type: DataType.STRING(80), allowNull: false })
  replyType: string;

  @Column({ type: DataType.STRING(20), allowNull: false })
  status: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  detail: string | null;

  @CreatedAt
  @Column({ type: DataType.DATE, allowNull: false })
  createdAt: Date;
}

export default AfterHoursAutoReplyEvent;
