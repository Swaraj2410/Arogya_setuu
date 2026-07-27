import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class DoctorAvailability extends Model {}

const trimNullable = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed || null;
};

DoctorAvailability.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    doctorId: { type: DataTypes.INTEGER, allowNull: false, field: 'doctor_id' },
    availableDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'available_date' },
    startTime: { type: DataTypes.STRING, allowNull: false, field: 'start_time' },
    endTime: { type: DataTypes.STRING, allowNull: false, field: 'end_time' },
    state: {
      type: DataTypes.STRING(80),
      set(value) {
        this.setDataValue('state', trimNullable(value));
      }
    },
    district: {
      type: DataTypes.STRING(80),
      set(value) {
        this.setDataValue('district', trimNullable(value));
      }
    },
    taluka: {
      type: DataTypes.STRING(80),
      set(value) {
        this.setDataValue('taluka', trimNullable(value));
      }
    },
    village: {
      type: DataTypes.STRING(80),
      set(value) {
        this.setDataValue('village', trimNullable(value));
      }
    }
  },
  {
    sequelize,
    modelName: 'DoctorAvailability',
    tableName: 'doctor_availability',
    timestamps: false
  }
);

export default DoctorAvailability;
