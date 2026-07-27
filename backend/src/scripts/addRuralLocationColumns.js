import { DataTypes } from 'sequelize';
import { DoctorAvailability, Patient, sequelize } from '../models/index.js';

const LOCATION_COLUMNS = ['state', 'district', 'taluka', 'village'];

const tableLabel = (tableName) => (typeof tableName === 'string' ? tableName : tableName.tableName);

async function addMissingLocationColumns(tableName) {
  const queryInterface = sequelize.getQueryInterface();
  const description = await queryInterface.describeTable(tableName);
  const label = tableLabel(tableName);

  for (const column of LOCATION_COLUMNS) {
    if (description[column]) {
      console.log(`${label}.${column}: already exists`);
      continue;
    }

    await queryInterface.addColumn(tableName, column, {
      type: DataTypes.STRING(80),
      allowNull: true
    });
    console.log(`${label}.${column}: added`);
  }
}

async function run() {
  await sequelize.authenticate();
  await addMissingLocationColumns(Patient.getTableName());
  await addMissingLocationColumns(DoctorAvailability.getTableName());
}

run()
  .catch((err) => {
    console.error(err.message || 'Failed to add rural location columns');
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
