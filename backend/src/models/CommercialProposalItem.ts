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

@Table({ tableName: "CommercialProposalItems" })
class CommercialProposalItem extends Model<CommercialProposalItem> {
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
  title: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description: string | null;

  @Column({ type: DataType.TEXT, allowNull: false })
  includedItems: string;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false })
  subtotal: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false })
  isIncluded: boolean;

  @CreatedAt
  @Column({ type: DataType.DATE, allowNull: false })
  createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, allowNull: false })
  updatedAt: Date;
}

export default CommercialProposalItem;
