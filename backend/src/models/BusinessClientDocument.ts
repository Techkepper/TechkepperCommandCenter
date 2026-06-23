/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  DataType,
  Unique
} from "sequelize-typescript";

import BusinessClient from "./BusinessClient";
import SmartDocument from "./SmartDocument";
import User from "./User";

@Table({ tableName: "BusinessClientDocuments" })
class BusinessClientDocument extends Model<BusinessClientDocument> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER, allowNull: false })
  id: number;

  @ForeignKey(() => BusinessClient)
  @Column({ type: DataType.INTEGER, allowNull: false })
  businessClientId: number;

  @BelongsTo(() => BusinessClient)
  businessClient: BusinessClient;

  @Unique
  @ForeignKey(() => SmartDocument)
  @Column({ type: DataType.INTEGER, allowNull: false })
  documentId: number;

  @BelongsTo(() => SmartDocument)
  document: SmartDocument;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  linkedById: number;

  @BelongsTo(() => User, "linkedById")
  linkedBy: User;

  @CreatedAt
  @Column({ type: DataType.DATE, allowNull: false })
  createdAt: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE, allowNull: false })
  updatedAt: Date;
}

export default BusinessClientDocument;
