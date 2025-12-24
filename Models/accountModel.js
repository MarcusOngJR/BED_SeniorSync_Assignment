const sql = require("mssql");
const dbConfig = require("../dbConfig");

const { getPool } = require('../Services/pool');
const { get } = require("../Controllers/mapController");


async function getAccountByPhone(phone_number) {
  let connection;

  try {
    connection = await getPool();
    const request = connection.request();
    request.input("phone_number", sql.VarChar, phone_number);

    const result = await request.query(
      "SELECT * FROM AccountPassword WHERE phone_number = @phone_number"
    );

    return result.recordset[0]; // Return first match or undefined
  } catch (error) {
    console.error("Model error:", error);
    throw error;
  }
}

async function getAccountById(id) {
  let connection;

  try {
    connection = await getPool();
    const request = connection.request();
    request.input("id", sql.Int, id);

    const result = await request.query(
      "SELECT * FROM AccountProfile WHERE id = @id"
    );

    return result.recordset[0]; // Return first match or undefined
  } catch (error) {
    console.error("Model error:", error);
    throw error;
  }
}

async function createAccount(phone_number, password) {
  let connection;

  try {
    connection = await getPool();
    const request = connection.request();
    request.input("phone_number", sql.VarChar, phone_number);

    request.input("password", sql.VarChar, password);

    const result = await request.query(
      "INSERT INTO AccountPassword (phone_number, password) VALUES (@phone_number, @password); SELECT SCOPE_IDENTITY() AS id"
    );
    if (result.rowsAffected.length === 0) {
      throw new Error("Insert failed, no rows affected.");
    }

    const accountId = result.recordset[0].id;
    return accountId;
  } catch (error) {
    console.error("Model error:", error);
    throw error;
  }
}

async function initializeAccountDetails(accountId, details) {
  let connection;

  try {
    connection = await getPool();
    const request = connection.request();

    request.input("id", sql.Int, accountId);
    request.input("name", sql.VarChar, details.name);
    request.input("account_type", sql.VarChar, details.account_type);
    request.input("email", sql.VarChar, details.email);
    request.input("gender", sql.VarChar, details.gender); 
    request.input("date_of_birth", sql.Date, details.date_of_birth);
    request.input("preferred_language", sql.VarChar, details.preferred_language);

    const result = await request.query(`
      INSERT INTO AccountProfile (id, name, account_type, email, gender, date_of_birth, preferred_language)
      VALUES (@id, @name, @account_type, @email, @gender, @date_of_birth, @preferred_language)
    `);

    return result.rowsAffected[0] > 0; // ensure boolean return
  } catch (error) {
    console.error("Model error:", error);
    throw error;
  }
}

async function getPhoneByAccountID(accountId) {
  let connection;

  try {
    connection = await getPool();
    const request = connection.request();
    request.input("accountId", sql.Int, accountId);

    const result = await request.query(
      "SELECT phone_number FROM AccountPassword WHERE id = @accountId"
    );

    return result.recordset[0]; // Return first match or undefined
  } catch (error) {
    console.error("Model error:", error);
    throw error;
  }
}

async function updatePasswordById(accountId, hashedPassword) {
  let connection;
  try {
    connection = await getPool();
    const request = connection.request();
    request.input("id", sql.Int, accountId);
    request.input("password", sql.VarChar, hashedPassword);

    const result = await request.query(`
      UPDATE AccountPassword SET password = @password WHERE id = @id
    `);

    return result.rowsAffected[0] > 0;
  } catch (error) {
    console.error("Model error:", error);
    throw error;
  }
}

async function updatePasswordByPhone(phone_number, hashedPassword) {
  let connection;
  try {
    connection = await getPool();
    const request = connection.request();
    request.input("phone_number", sql.VarChar, phone_number);
    request.input("password", sql.VarChar, hashedPassword);

    const result = await request.query(`
      UPDATE AccountPassword SET password = @password WHERE phone_number = @phone_number
    `);

    return result.rowsAffected[0] > 0;
  } catch (error) {
    console.error("Model error:", error);
    throw error;
  }
}

async function updateProfile(accountId, newDetails) {
  let connection;

  try {
    connection = await getPool();
    const request = connection.request();

    request.input("id", sql.Int, accountId);

    const fields = [];
    if (newDetails.name !== undefined) {
      fields.push("name = @name");
      request.input("name", sql.VarChar, newDetails.name);
    }
    if (newDetails.email !== undefined) {
      fields.push("email = @email");
      request.input("email", sql.VarChar, newDetails.email);
    }
    if (newDetails.gender !== undefined) {
      fields.push("gender = @gender");
      request.input("gender", sql.VarChar, newDetails.gender);
    }
    if (newDetails.date_of_birth !== undefined) {
      fields.push("date_of_birth = @date_of_birth");
      request.input("date_of_birth", sql.Date, newDetails.date_of_birth);
    }
    if (newDetails.preferred_language !== undefined) {
      fields.push("preferred_language = @preferred_language");
      request.input("preferred_language", sql.VarChar, newDetails.preferred_language);
    }

    if (fields.length === 0) {
      console.warn("No fields to update");
      return false; // Nothing to update
    }

    const query = `
      UPDATE AccountProfile
      SET ${fields.join(", ")}
      WHERE id = @id
    `;

    const result = await request.query(query);
    return result.rowsAffected[0] > 0;

  } catch (error) {
    console.error("Model error:", error);
    throw error;
  }
}

async function updatePhoneNumber(accountId, newPhoneNumber) {
  let connection;

  try {
    connection = await getPool();
    const request = connection.request();
    request.input("id", sql.Int, accountId);
    request.input("phone_number", sql.VarChar, newPhoneNumber);

    const result = await request.query(`
      UPDATE AccountPassword SET phone_number = @phone_number WHERE id = @id
    `);

    return result.rowsAffected[0] > 0;
  } catch (error) {
    console.error("Model error:", error);
    throw error;
  }
}


async function getAllUsers() {
  let connection;

  try {
    connection = await getPool();
    const request = connection.request();

    const result = await request.query("SELECT * FROM AccountProfile");

    return result.recordset; // Return all users
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