const { getPool } = require('../Services/pool');

async function getAccountByPhone(phone_number) {
    try {
        const pool = await getPool();
        const result = await pool.query(
            "SELECT * FROM AccountPassword WHERE phone_number = $1",
            [phone_number]
        );
        return result.rows[0];
    } catch (error) {
        console.error("Model error:", error);
        throw error;
    }
}

async function getAccountById(id) {
    try {
        const pool = await getPool();
        const result = await pool.query(
            "SELECT * FROM AccountProfile WHERE id = $1",
            [id]
        );
        return result.rows[0];
    } catch (error) {
        console.error("Model error:", error);
        throw error;
    }
}

async function createAccount(phone_number, password) {
    try {
        const pool = await getPool();
        const result = await pool.query(
            "INSERT INTO AccountPassword (phone_number, password) VALUES ($1, $2) RETURNING id",
            [phone_number, password]
        );

        if (result.rowCount === 0) {
            throw new Error("Insert failed, no rows affected.");
        }

        return result.rows[0].id;
    } catch (error) {
        console.error("Model error:", error);
        throw error;
    }
}

async function initializeAccountDetails(accountId, details) {
    try {
        const pool = await getPool();

        const result = await pool.query(
            `INSERT INTO AccountProfile (id, name, account_type, email, gender, date_of_birth, preferred_language)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                accountId,
                details.name,
                details.account_type,
                details.email,
                details.gender,
                details.date_of_birth,
                details.preferred_language
            ]
        );

        return result.rowCount > 0;
    } catch (error) {
        console.error("Model error:", error);
        throw error;
    }
}

async function getPhoneByAccountID(accountId) {
    try {
        const pool = await getPool();
        const result = await pool.query(
            "SELECT phone_number FROM AccountPassword WHERE id = $1",
            [accountId]
        );
        return result.rows[0];
    } catch (error) {
        console.error("Model error:", error);
        throw error;
    }
}

async function updatePasswordById(accountId, hashedPassword) {
    try {
        const pool = await getPool();
        const result = await pool.query(
            "UPDATE AccountPassword SET password = $2 WHERE id = $1",
            [accountId, hashedPassword]
        );
        return result.rowCount > 0;
    } catch (error) {
        console.error("Model error:", error);
        throw error;
    }
}

async function updatePasswordByPhone(phone_number, hashedPassword) {
    try {
        const pool = await getPool();
        const result = await pool.query(
            "UPDATE AccountPassword SET password = $2 WHERE phone_number = $1",
            [phone_number, hashedPassword]
        );
        return result.rowCount > 0;
    } catch (error) {
        console.error("Model error:", error);
        throw error;
    }
}

async function updateProfile(accountId, newDetails) {
    try {
        const pool = await getPool();
        const fields = [];
        const values = [accountId];
        let paramIndex = 2;

        if (newDetails.name !== undefined) {
            fields.push(`name = $${paramIndex++}`);
            values.push(newDetails.name);
        }
        if (newDetails.email !== undefined) {
            fields.push(`email = $${paramIndex++}`);
            values.push(newDetails.email);
        }
        if (newDetails.gender !== undefined) {
            fields.push(`gender = $${paramIndex++}`);
            values.push(newDetails.gender);
        }
        if (newDetails.date_of_birth !== undefined) {
            fields.push(`date_of_birth = $${paramIndex++}`);
            values.push(newDetails.date_of_birth);
        }
        if (newDetails.preferred_language !== undefined) {
            fields.push(`preferred_language = $${paramIndex++}`);
            values.push(newDetails.preferred_language);
        }

        if (fields.length === 0) {
            return false;
        }

        const query = `UPDATE AccountProfile SET ${fields.join(", ")} WHERE id = $1`;
        const result = await pool.query(query, values);

        return result.rowCount > 0;
    } catch (error) {
        console.error("Model error:", error);
        throw error;
    }
}

async function updatePhoneNumber(accountId, newPhoneNumber) {
    try {
        const pool = await getPool();
        const result = await pool.query(
            "UPDATE AccountPassword SET phone_number = $2 WHERE id = $1",
            [accountId, newPhoneNumber]
        );
        return result.rowCount > 0;
    } catch (error) {
        console.error("Model error:", error);
        throw error;
    }
}

async function getAllUsers() {
    try {
        const pool = await getPool();
        const result = await pool.query("SELECT * FROM AccountProfile");
        return result.rows;
    } catch (error) {
        console.error("Model error:", error);
        throw error;
    }
}

module.exports = {
    getAccountByPhone,
    getAccountById,
    createAccount,
    initializeAccountDetails,
    getPhoneByAccountID,
    updatePasswordById,
    updatePasswordByPhone,
    updateProfile,
    updatePhoneNumber,
    getAllUsers,
};
