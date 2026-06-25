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
  Default,
  Unique
} from "sequelize-typescript";

import Queue from "./Queue";
import User from "./User";

@Table({
  tableName: "BusinessClients",
  paranoid: true
})
class BusinessClient extends Model<BusinessClient> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER, allowNull: false })
  id: number;

  @Column({ type: DataType.ENUM("physical", "legal"), allowNull: false })
  type: "physical" | "legal";

  @Column({ type: DataType.STRING(255), allowNull: false })
  displayName: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  legalName: string | null;

  @Column({ type: DataType.STRING(255), allowNull: true })
  tradeName: string | null;

  @Column({ type: DataType.STRING(80), allowNull: false })
  identificationType: string;

  @Column({ type: DataType.STRING(80), allowNull: false })
  identificationNumber: string;

  @Unique
  @Column({ type: DataType.STRING(80), allowNull: false })
  normalizedIdentificationNumber: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  legalRepresentativeName: string | null;

  @Column({ type: DataType.STRING(80), allowNull: true })
  legalRepresentativeId: string | null;

  @Column({ type: DataType.STRING(255), allowNull: true })
  legalRepresentativePosition: string | null;

  @Column({ type: DataType.STRING(255), allowNull: true })
  email: string | null;

  @Column({ type: DataType.STRING(80), allowNull: true })
  phone: string | null;

  @Column({ type: DataType.STRING(500), allowNull: true })
  address: string | null;

  @Column({ type: DataType.STRING(120), allowNull: true })
  country: string | null;

  @Column({ type: DataType.STRING(120), allowNull: true })
  province: string | null;

  @Column({ type: DataType.STRING(120), allowNull: true })
  canton: string | null;

  @Column({ type: DataType.STRING(120), allowNull: true })
  district: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  notes: string | null;

  @ForeignKey(() => Queue)
  @Column({ type: DataType.INTEGER, allowNull: true })
  queueId: number | null;

  @BelongsTo(() => Queue)
  queue: Queue | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  createdById: number;

  @BelongsTo(() => User, "createdById")
  createdBy: User;

  @Default(true)
  @Column({ type: DataType.BOOLEAN, allowNull: false })
  isActive: boolean;

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

export default BusinessClient;
