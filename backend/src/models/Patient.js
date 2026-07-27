import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database.js';

class Patient extends Model {}

const trimNullable = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed || null;
};

Patient.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'user_id' },
    age: { type: DataTypes.INTEGER },
    gender: { type: DataTypes.STRING(20) },
    phone: { type: DataTypes.STRING(20) },
    address: { type: DataTypes.STRING },
    bloodGroup: { type: DataTypes.STRING(5), field: 'blood_group' },
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
  { sequelize, modelName: 'Patient', tableName: 'patients', timestamps: false }
);

export default Patient;
