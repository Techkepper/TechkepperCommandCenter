/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  DeletedAt,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from "sequelize-typescript";

import User from "./User";

@Table({
  tableName: "ExternalStorageConnections",
  paranoid: true
})
class ExternalStorageConnection extends Model<ExternalStorageConnection> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER, allowNull: false })
  id: number;

  @Column({ type: DataType.STRING(50), allowNull: false, unique: true })
  provider: string;

  @Column({ type: DataType.STRING(50), allowNull: false })
  status: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  encryptedRefreshToken: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  accountInfo: string | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  createdById: number | null;

  @BelongsTo(() => User, "createdById")
  createdBy: User | null;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  updatedById: number | null;

  @BelongsTo(() => User, "updatedById")
  updatedBy: User | null;

  @Column({ type: DataType.DATE, allowNull: true })
  lastSyncAt: Date | null;

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

export default ExternalStorageConnection;
