module.exports = {
  connectionString: process.env.DB_CONNECTION_STRING,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};