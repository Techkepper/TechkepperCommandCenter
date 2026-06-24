/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  DeletedAt,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt
} from "sequelize-typescript";

import Queue from "./Queue";
import User from "./User";

@Table({ tableName: "Collaborators", paranoid: true })
class Collaborator extends Model<Collaborator> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER, allowNull: false })
  id: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  fullName: string;

  @Column({ type: DataType.STRING(80), allowNull: false })
  identificationType: string;

  @Column({ type: DataType.STRING(80), allowNull: false })
  identificationNumber: string;

  @Unique
  @Column({ type: DataType.STRING(80), allowNull: false })
  normalizedIdentificationNumber: string;

  @Column({
    type: DataType.ENUM("LA CONTRATISTA", "EL CONTRATISTA"),
    allowNull: false
  })
  contractualDenomination: "LA CONTRATISTA" | "EL CONTRATISTA";

  @Column({ type: DataType.STRING(255), allowNull: true })
  email: string | null;

  @Column({ type: DataType.STRING(80), allowNull: true })
  phone: string | null;

  @Column({ type: DataType.STRING(500), allowNull: true })
  address: string | null;

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

export default Collaborator;
