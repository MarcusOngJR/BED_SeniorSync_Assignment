const { getPool } = require('../Services/pool');

async function getSyncedAccounts(userId) {
  try {
    const pool = await getPool();
    const result = await pool.query(`
      SELECT ap.*
      FROM syncAccounts sa
      JOIN AccountProfile ap
        ON (ap.id = sa.elderly_id OR ap.id = sa.caretaker_id)
      WHERE (sa.elderly_id = $1 OR sa.caretaker_id = $1)
        AND ap.id != $1
    `, [userId]);

    return result.rows;
  } catch (error) {
    console.error("Error fetching synced accounts from database:", error);
    throw new Error("Database query failed");
  }
}

async function checkSyncCodeExists(syncCode) {
  const pool = await getPool();
  const result = await pool.query(`
        SELECT COUNT(*) AS count
        FROM syncCodes
        WHERE code = $1
    `, [syncCode.toString()]);
  return parseInt(result.rows[0].count) > 0;
}

async function createSyncRequest(accountId, syncCode) {
  const pool = await getPool();

  await pool.query(`
        INSERT INTO syncCodes (code, acc_id)
        VALUES ($1, $2)
    `, [syncCode.toString(), accountId]);
}

async function checkSyncCodeValid(syncCode) {
  const pool = await getPool();
  const result = await pool.query(`
    SELECT acc_id
    FROM syncCodes
    WHERE code = $1
  `, [syncCode.toString()]);

  return result.rows[0] || null; // return the record (with acc_id), or null
}

async function linkAccounts(elderly_id, caretaker_id) {
  try {
    const pool = await getPool();

    const result = await pool.query(`
      INSERT INTO syncAccounts (elderly_id, caretaker_id)
      VALUES ($1, $2)
    `, [elderly_id, caretaker_id]);

    return result.rowCount > 0; // returns true if insert succeeded
  } catch (error) {
    console.error("Error linking accounts in database:", error);
    throw new Error("Database query failed");
  }
}
async function deleteSyncCode(syncCode) {

  const pool = await getPool();
  await pool.query(`
        DELETE FROM syncCodes
        WHERE code = $1
    `, [syncCode.toString()]);
}

module.exports = {
  getSyncedAccounts,
  checkSyncCodeExists,
  createSyncRequest,
  linkAccounts,
  checkSyncCodeValid,
  deleteSyncCode
};