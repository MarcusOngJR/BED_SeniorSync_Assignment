const { getPool } = require('../Services/pool');

async function getMedicationByAccountID(accountId) {
  try {
    const pool = await getPool();
    const result = await pool.query(
      "SELECT * FROM MedicationList WHERE account_id = $1",
      [accountId]
    );

    return result.rows; // Return all medications for the account
  } catch (error) {
    console.error("Model error:", error);
    throw error;
  }
}

async function getMedicationByID(medicationId) {
  try {
    const pool = await getPool();
    const result = await pool.query(
      "SELECT * FROM MedicationList WHERE med_id = $1",
      [medicationId]
    );

    return result.rows[0]; // Return the specific medication
  } catch (error) {
    console.error("Model error:", error);
    throw error;
  }
}

async function getMedicalConditionByID(conditionId) {
  try {
    const pool = await getPool();
    const result = await pool.query(
      "SELECT * FROM MedicalConditionList WHERE medc_id = $1",
      [conditionId]
    );

    return result.rows[0]; // Return the specific medical condition
  } catch (error) {
    console.error("Model error:", error);
    throw error;
  }
}

async function getWeeklyTiming(med_id) {
  try {
    const pool = await getPool();
    const result = await pool.query(
      "SELECT * FROM WeeklyMedicationTiming WHERE med_id = $1",
      [med_id]
    );

    return result.rows; // Return the weekly timing for the medication
  } catch (error) {
    console.error("Model error:", error);
    throw error;
  }
}

async function saveWeeklyTiming(med_id, day, time) {
  try {
    const pool = await getPool();
    const result = await pool.query(
      "INSERT INTO WeeklyMedicationTiming (med_id, day, time) VALUES ($1, $2, $3)",
      [med_id, day, time]
    );

    return result.rowCount > 0; // Return true if insertion was successful
  } catch (error) {
    console.error("Model error:", error);
    throw error;
  }
}

async function getWeeklyTimingsByAccountID(accountId) {
  try {
    const pool = await getPool();
    const result = await pool.query(`
      SELECT w.medTime_id, w.med_id, w.day, w.time, m.name, m.frequency
      FROM WeeklyMedicationTiming w
      INNER JOIN MedicationList m ON w.med_id = m.med_id
      WHERE m.account_id = $1
    `, [accountId]);

    return result.rows;
  } catch (error) {
    console.error("Model error:", error);
    throw error;
  }
}



async function getMedicalConditionByAccountID(accountId) {
  try {
    const pool = await getPool();
    const result = await pool.query(
      "SELECT * FROM MedicalConditionList WHERE acc_id = $1",
      [accountId]
    );

    return result.rows; // Return all medical information for the account
  } catch (error) {
    console.error("Model error:", error);
    throw error;
  }
}

async function createMedicalCondition(accountId, condition) {
  try {
    const pool = await getPool();
    const result = await pool.query(
      "INSERT INTO MedicalConditionList (name, descr, acc_id, prescription_date, mod_id, updated_at) VALUES ($1, $2, $3, $4, $5, NULL)",
      [
        condition.name,
        condition.descr,
        accountId,
        condition.prescription_date,
        condition.mod_id || accountId
      ]
    );

    return result.rowCount > 0;
  } catch (error) {
    console.error("Model error:", error);
    throw error;
  }
}

async function createMedication(accountId, medication) {
  try {
    const pool = await getPool();
    const result = await pool.query(
      "INSERT INTO MedicationList (account_id, name, description, dosage, time, frequency, start_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING med_id",
      [
        accountId,
        medication.name,
        medication.description,
        medication.dosage,
        medication.time || null,
        medication.frequency,
        medication.start_date
      ]
    );

    return result.rows[0].med_id;
  } catch (error) {
    console.error("Model error:", error);
    throw error;
  }
}

async function deleteMedication(medicationId) {
  try {
    const pool = await getPool();
    const result = await pool.query(
      "DELETE FROM MedicationList WHERE med_id = $1",
      [medicationId]
    );

    return result.rowCount > 0; // Return true if deletion was successful
  } catch (error) {
    console.error("Model error:", error);
    throw error;
  }
}

async function deleteMedicalCondition(conditionId) {
  try {
    const pool = await getPool();
    const result = await pool.query(
      "DELETE FROM MedicalConditionList WHERE medc_id = $1",
      [conditionId]
    );

    return result.rowCount > 0; // Return true if deletion was successful
  } catch (error) {
    console.error("Model error:", error);
    throw error;
  }
}

async function getMedicationAssociatedWithMedicalCondition(conditionId) {
  try {
    const pool = await getPool();
    const result = await pool.query(
      "SELECT * FROM MedicationConditionAssociationList WHERE medc_id = $1",
      [conditionId]
    );

    return result.rows; // Return all medications associated with the medical condition
  } catch (error) {
    console.error("Model error:", error);
    throw error;
  }
}

async function updateMedication(med_id, data) {
  try {
    const pool = await getPool();
    const result = await pool.query(
      "UPDATE MedicationList SET name = $1, description = $2, dosage = $3, time = $4, frequency = $5, start_date = $6 WHERE med_id = $7",
      [
        data.name,
        data.description || '',
        data.dosage,
        data.time || '',
        data.frequency,
        data.start_date,
        med_id
      ]
    );

    return result.rowCount > 0; // Return true if update was successful
  } catch (error) {
    console.error("Model error:", error);
    throw error;
  }
}

async function updateMedicalCondition(medc_id, data) {
  try {
    const pool = await getPool();
    const result = await pool.query(
      "UPDATE MedicalConditionList SET name = $1, descr = $2, updated_at = $3, prescription_date = $4, mod_id = $5 WHERE medc_id = $6",
      [
        data.name,
        data.descr || '',
        data.updated_at,
        data.prescription_date,
        data.mod_id || medc_id,
        medc_id
      ]
    );

    return result.rowCount > 0; // Return true if update was successful
  } catch (error) {
    console.error("Model error:", error);
    throw error;
  }
}

async function associateMedicationWithMedicalCondition(med_id, medc_id) {
  try {
    const pool = await getPool();

    // Check if the association already exists
    const existingAssociation = await pool.query(
      "SELECT * FROM MedicationConditionAssociationList WHERE med_id = $1 AND medc_id = $2",
      [med_id, medc_id]
    );

    if (existingAssociation.rows.length > 0) {
      return false; // Association already exists
    }

    const result = await pool.query(
      "INSERT INTO MedicationConditionAssociationList (med_id, medc_id) VALUES ($1, $2)",
      [med_id, medc_id]
    );

    return result.rowCount > 0; // Return true if association was successful
  } catch (error) {
    console.error("Model error:", error);
    throw error;
  }
}

async function deleteMedicationConditionAssociation(med_id, medc_id) {
  try {
    const pool = await getPool();
    const result = await pool.query(
      "DELETE FROM MedicationConditionAssociationList WHERE med_id = $1 AND medc_id = $2",
      [med_id, medc_id]
    );

    return result.rowCount > 0; // Return true if deletion was successful
  } catch (error) {
    console.error("Model error:", error);
    throw error;
  }
}

async function resetWeeklyTiming(med_id) {
  try {
    const pool = await getPool();
    const result = await pool.query(
      "DELETE FROM WeeklyMedicationTiming WHERE med_id = $1",
      [med_id]
    );

    return result.rowCount > 0; // Return true if reset was successful
  } catch (error) {
    console.error("Model error:", error);
    throw error;
  }
}

module.exports = {
  getMedicationByAccountID,
  getMedicationByID,
  getMedicalConditionByAccountID,
  createMedicalCondition,
  createMedication,
  deleteMedication,
  deleteMedicalCondition,
  getMedicalConditionByID,
  getMedicationAssociatedWithMedicalCondition,
  updateMedication,
  updateMedicalCondition,
  associateMedicationWithMedicalCondition,
  deleteMedicationConditionAssociation,
  getWeeklyTiming,
  saveWeeklyTiming,
  resetWeeklyTiming,
  getWeeklyTimingsByAccountID
};