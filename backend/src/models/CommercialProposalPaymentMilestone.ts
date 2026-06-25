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

@Table({ tableName: "CommercialProposalPaymentMilestones" })
class CommercialProposalPaymentMilestone extends Model<CommercialProposalPaymentMilestone> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER, allowNull: false })
  id: number;

  @ForeignKey(() => CommercialProposal)
  @Column({ type: DataType.INTEGER, allowNull: false })
  proposalId: number;

  @BelongsTo(() => CommercialProposal)
  proposal: CommercialProposal;

  @Column({ type: DataType.INTEGER, allowNull: false })
  sortOrder: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  name: string;

  @Column({ type: DataType.DECIMAL(7, 4), allowNull: false })
  percentage: number;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false })
  amount: number;

  @Column({ type: DataType.TEXT, allowNull: true })
  description: string | null;

  @CreatedAt
  @Column({ type: DataType.DATE, allowNull: false })
  createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, allowNull: false })
  updatedAt: Date;
}

export default CommercialProposalPaymentMilestone;
