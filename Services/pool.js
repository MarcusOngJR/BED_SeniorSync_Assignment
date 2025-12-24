// pool.js
const sql = require("mssql");

// Change this to your actual database configuration
const dbConfig = require("../dbConfig");

console.log("CONNECTING WITH:", {
  user: dbConfig.user,
  password_set: !!dbConfig.password,
  server: dbConfig.server,
  port: dbConfig.port,
  database: dbConfig.database,
});

let pool;

/**
 * Returns a singleton MSSQL connection pool.
 */
async function getPool() {
  if (pool && pool.connected) {
    return pool;
  }

  try {
    pool = await sql.connect(dbConfig);
    console.log("✅ New pool connected");
    return pool;
  } catch (err) {
    console.error("❌ Failed to connect to SQL Server:", err);
    throw err;
  }
}

/**
 * Gracefully closes the pool — use this on shutdown only.
 */
async function closePool() {
  if (pool) {
    try {
      await pool.close();
      console.log("🛑 SQL Server pool closed");
    } catch (err) {
      console.error("❌ Failed to close SQL pool:", err);
    }
  }
}

module.exports = {
  getPool,
  closePool,
  sql
};
