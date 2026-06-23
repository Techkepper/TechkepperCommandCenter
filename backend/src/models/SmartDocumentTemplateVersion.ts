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
  Default
} from "sequelize-typescript";

import User from "./User";
import SmartDocumentTemplate from "./SmartDocumentTemplate";

@Table({
  tableName: "SmartDocumentTemplateVersions",
  paranoid: true
})
class SmartDocumentTemplateVersion extends Model<SmartDocumentTemplateVersion> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  id: number;

  @ForeignKey(() => SmartDocumentTemplate)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  templateId: number;

  @BelongsTo(() => SmartDocumentTemplate)
  template: SmartDocumentTemplate;

  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  version: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false
  })
  originalName: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false
  })
  storedName: string;

  @Column({
    type: DataType.STRING(500),
    allowNull: false
  })
  storagePath: string;

  @Column({
    type: DataType.STRING(150),
    allowNull: false
  })
  mimeType: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  size: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false
  })
  detectedVariables: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false
  })
  requiredVariables: string;

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false
  })
  isActive: boolean;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  uploadedById: number;

  @BelongsTo(() => User, "uploadedById")
  uploadedBy: User;

  @CreatedAt
  @Column({
    type: DataType.DATE,
    allowNull: false
  })
  createdAt: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    allowNull: false
  })
  updatedAt: Date;

  @DeletedAt
  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  deletedAt: Date | null;
}

export default SmartDocumentTemplateVersion;
