/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  Default,
  DeletedAt,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt
} from "sequelize-typescript";

@Table({ tableName: "BusinessHoursSpecialDates", paranoid: true })
class BusinessHoursSpecialDate extends Model<BusinessHoursSpecialDate> {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER, allowNull: false })
  id: number;

  @Column({ type: DataType.STRING(160), allowNull: false })
  name: string;

  @Column({ type: DataType.STRING(30), allowNull: false })
  type: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  startDate: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  endDate: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  message: string;

  @Default(true)
  @Column({ type: DataType.BOOLEAN, allowNull: false })
  active: boolean;

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

export default BusinessHoursSpecialDate;
