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

import CommercialProposal from "./CommercialProposal";
import User from "./User";

@Table({ tableName: "CommercialProposalEvents" })
class CommercialProposalEvent extends Model<CommercialProposalEvent> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER, allowNull: false })
  id: number;

  @ForeignKey(() => CommercialProposal)
  @Column({ type: DataType.INTEGER, allowNull: false })
  proposalId: number;

  @BelongsTo(() => CommercialProposal)
  proposal: CommercialProposal;

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

export default CommercialProposalEvent;
