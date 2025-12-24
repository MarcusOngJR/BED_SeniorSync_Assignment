// pool.js
const { Pool } = require("pg");
const dbConfig = require("../dbConfig");

let pool;

console.log("CONNECTING WITH:", {
  connectionString: dbConfig.connectionString ? "Set" : "Not Set",
  ssl: dbConfig.ssl
});

/**
 * Returns a singleton Postgres connection pool.
 */
async function getPool() {
  if (pool) {
    return pool;
  }

  try {
    pool = new Pool(dbConfig);

    // Test connection
    const client = await pool.connect();
    console.log("✅ New pool connected");
    client.release();

    return pool;
  } catch (err) {
    console.error("❌ Failed to connect to Postgres:", err);
    throw err;
  }
}

/**
 * Gracefully closes the pool — use this on shutdown only.
 */
async function closePool() {
  if (pool) {
    try {
      await pool.end();
      console.log("🛑 Postgres pool closed");
    } catch (err) {
      console.error("❌ Failed to close Postgres pool:", err);
    }
  }
}

module.exports = {
  getPool,
  closePool,
};
