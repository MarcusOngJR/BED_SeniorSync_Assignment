require("dotenv").config();
const sql = require("mssql");

(async () => {
    const config = {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        server: "127.0.0.1",
        database: "master",
        port: 1433,
        options: { trustServerCertificate: true, encrypt: false },
    };

    try {
        const pool = await sql.connect(config);
        const r = await pool.request().query("SELECT @@VERSION AS v");
        console.log(r.recordset[0].v);
        await pool.close();
    } catch (e) {
        console.error(e);
    }
})();
