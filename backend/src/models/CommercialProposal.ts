/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  DeletedAt,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from "sequelize-typescript";

import BusinessClient from "./BusinessClient";
import CommercialProposalEvent from "./CommercialProposalEvent";
import CommercialProposalItem from "./CommercialProposalItem";
import CommercialProposalPaymentMilestone from "./CommercialProposalPaymentMilestone";
import Queue from "./Queue";
import SmartDocument from "./SmartDocument";
import User from "./User";

@Table({ tableName: "CommercialProposals", paranoid: true })
class CommercialProposal extends Model<CommercialProposal> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER, allowNull: false })
  id: number;

  @ForeignKey(() => BusinessClient)
  @Column({ type: DataType.INTEGER, allowNull: true })
  businessClientId: number | null;

  @BelongsTo(() => BusinessClient)
  businessClient: BusinessClient | null;

  @Column({ type: DataType.STRING(255), allowNull: true })
  manualClientName: string | null;

  @Column({ type: DataType.STRING(255), allowNull: true })
  manualClientEmail: string | null;

  @Column({ type: DataType.STRING(80), allowNull: true })
  manualClientPhone: string | null;

  @Column({ type: DataType.STRING(80), allowNull: true })
  manualClientIdentification: string | null;

  @Column({ type: DataType.STRING(80), allowNull: false })
  clientNumber: string;

  @Column({ type: DataType.STRING(80), allowNull: false })
  proposalNumber: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  offerDate: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  title: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  introduction: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  identifiedNeed: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  generalScope: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  investmentAnalysis: string | null;

  @Column({ type: DataType.STRING(3), allowNull: false })
  currency: "CRC" | "USD";

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false })
  desiredNetAmount: number;

  @Column({ type: DataType.DECIMAL(7, 4), allowNull: false })
  sellerCommissionRate: number;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false })
  externalCosts: number;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false })
  thirdPartyLicenses: number;

  @Column({ type: DataType.DECIMAL(7, 4), allowNull: false })
  additionalMarginRate: number;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false })
  recommendedSubtotal: number;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false })
  discountAmount: number;

  @Column({ type: DataType.DECIMAL(7, 4), allowNull: false })
  ivaRate: number;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false })
  subtotal: number;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false })
  ivaAmount: number;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false })
  total: number;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false })
  estimatedCommission: number;

  @Column({ type: DataType.DECIMAL(15, 2), allowNull: false })
  estimatedNetAmount: number;

  @Column({ type: DataType.BOOLEAN, allowNull: false })
  roundFinalPrice: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false })
  showIvi: boolean;

  @Column({ type: DataType.TEXT, allowNull: true })
  paymentTermsText: string | null;

  @Column({ type: DataType.STRING(255), allowNull: true })
  projectTimeline: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  termsText: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  futureRecommendation: string | null;

  @Column({ type: DataType.STRING(50), allowNull: false })
  status: string;

  @ForeignKey(() => Queue)
  @Column({ type: DataType.INTEGER, allowNull: true })
  queueId: number | null;

  @BelongsTo(() => Queue)
  queue: Queue | null;

  @ForeignKey(() => SmartDocument)
  @Column({ type: DataType.INTEGER, allowNull: true })
  generatedDocumentId: number | null;

  @BelongsTo(() => SmartDocument)
  generatedDocument: SmartDocument | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  createdById: number;

  @BelongsTo(() => User, "createdById")
  createdBy: User;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  updatedById: number | null;

  @BelongsTo(() => User, "updatedById")
  updatedBy: User | null;

  @HasMany(() => CommercialProposalItem)
  items: CommercialProposalItem[];

  @HasMany(() => CommercialProposalPaymentMilestone)
  milestones: CommercialProposalPaymentMilestone[];

  @HasMany(() => CommercialProposalEvent)
  events: CommercialProposalEvent[];

  @CreatedAt
  @Column({ type: DataType.DATE, allowNull: false })
  createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, allowNull: false })
  updatedAt: Date;

  @DeletedAt
  @Column({ type: DataType.DATE, allowNull: true })
  deletedAt: Date | null;
}

export default CommercialProposal;
