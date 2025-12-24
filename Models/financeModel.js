const { getPool } = require('../Services/pool');

async function getExpenditureGoalByID(accountId) {
  try {
    const pool = await getPool();
    const result = await pool.query(`
          SELECT 
            month,
            SUM(monthly_goal) AS total_goal
          FROM MonthlyExpenseGoal
          WHERE acc_id = $1 AND month = TO_CHAR(NOW(), 'YYYY-MM')
          GROUP BY month
        `, [accountId]);

    return result;
  } catch (error) {
    console.error("Error fetching expenditure goal:", error);
    throw error;
  }
}

async function getTotalExpenditureByID(accountId) {
  try {
    const pool = await getPool();
    const result = await pool.query(
      "SELECT SUM(amount) AS total FROM ExpensesList WHERE acc_id = $1",
      [accountId]
    );

    return result;
  } catch (error) {
    console.error("Error fetching total expenditure:", error);
    throw error;
  }
}

async function getExpenditureGoalPerCategoryMonth(accountId, month) {
  try {
    const pool = await getPool();
    const result = await pool.query(`
        SELECT category, monthly_goal
        FROM MonthlyExpenseGoal
        WHERE acc_id = $1 AND month = $2
      `, [accountId, month]);

    return result.rows;
  } catch (error) {
    console.error("Error fetching category expenditure goals:", error);
    throw error;
  }
}


async function getMonthlyExpenditureByID(accountId) {
  try {
    const pool = await getPool();
    const result = await pool.query(`
                SELECT 
                    TO_CHAR(date, 'YYYY-MM') AS month,
                    SUM(amount) AS total
                FROM ExpensesList
                WHERE acc_id = $1
                GROUP BY TO_CHAR(date, 'YYYY-MM')
                ORDER BY month
            `, [accountId]);

    return result.rows; // Return the array of { month, total }
  } catch (error) {
    console.error("Error fetching monthly expenditure:", error);
    throw error;
  }
}

async function getExpenditureForMonth(accountId, month) {
  try {
    const pool = await getPool();

    // First: return all expenses
    const transactionsResult = await pool.query(`
                SELECT 
                    entry_id, 
                    acc_id, 
                    amount, 
                    TO_CHAR(date, 'YYYY-MM-DD') AS date,
                    description,
                    cat,
                    time
                FROM ExpensesList
                WHERE acc_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2
                ORDER BY date DESC
            `, [accountId, month]);

    // Second: return total amount
    const totalResult = await pool.query(`
                SELECT 
                    SUM(amount) AS total
                FROM ExpensesList
                WHERE acc_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2
            `, [accountId, month]);

    const transactions = transactionsResult.rows;
    const total = totalResult.rows[0].total || 0;

    return { transactions, total };
  } catch (error) {
    console.error("Error fetching expenditure for month:", error);
    throw error;
  }
}

async function getAllTransactionsByID(accountId) {
  try {
    const pool = await getPool();
    const result = await pool.query(`
                SELECT 
                    entry_id, 
                    acc_id, 
                    amount, 
                    date, 
                    description ,
                    cat
                FROM ExpensesList
                WHERE acc_id = $1
                ORDER BY time asc, date desc
            `, [accountId]);

    return result.rows; // Return the array of transactions
  } catch (error) {
    console.error("Error fetching all transactions:", error);
    throw error;
  }
}

async function getAccountBudget(accountId, month) {
  try {
    const pool = await getPool();
    const result = await pool.query(`
        SELECT 
          SUM(monthly_goal) AS monthly_goal
        FROM MonthlyExpenseGoal 
        WHERE acc_id = $1 AND month = $2
      `, [accountId, month]);

    const goal = result.rows[0]?.monthly_goal || 0;
    return { monthly_goal: goal, found: goal > 0 };
  } catch (error) {
    console.error("Error fetching account budget:", error);
    throw error;
  }
}


async function addTransactionToAccount(accountId, transaction) {
  try {
    const pool = await getPool();

    const now = new Date();
    const dateOnly = new Date(transaction.date);
    // Postgres TIME type works with string 'HH:MM:SS' or Date object
    const currentTime = now.toTimeString().split(' ')[0];

    await pool.query(`
                INSERT INTO ExpensesList (acc_id, amount, date, time, description, cat)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [
      accountId,
      transaction.amount,
      dateOnly,
      currentTime,
      transaction.description,
      transaction.category
    ]);

    return { message: "Transaction added successfully" };
  } catch (error) {
    console.error("Error adding transaction:", error);
    return { message: "Internal server error" };
  }
}

async function addExpenditureGoal(accountId, goals, month) {
  try {
    const pool = await getPool();

    for (const [category, value] of Object.entries(goals)) {
      const formattedCategory = category.trim().toLowerCase();
      const capitalizedCategory = formattedCategory.charAt(0).toUpperCase() + formattedCategory.slice(1);

      const check = await pool.query(`
          SELECT COUNT(*) AS count
          FROM MonthlyExpenseGoal
          WHERE acc_id = $1 AND category = $2 AND month = $3
        `, [accountId, capitalizedCategory, month]);

      if (parseInt(check.rows[0].count) === 0) {
        await pool.query(`
            INSERT INTO MonthlyExpenseGoal (acc_id, monthly_goal, category, month)
            VALUES ($1, $2, $3, $4)
          `, [accountId, value, capitalizedCategory, month]);
      }
    }

    return { message: "Expenditure goals added successfully." };
  } catch (error) {
    console.error("Error adding expenditure goals:", error);
    throw error;
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Modify an existing expenditure goal
async function modifyExpenditureGoal(accountId, newGoals, month) {
  try {
    const pool = await getPool();

    for (const [category, value] of Object.entries(newGoals)) {
      const formattedCategory = category.trim().toLowerCase();
      const capitalizedCategory = formattedCategory.charAt(0).toUpperCase() + formattedCategory.slice(1);

      await pool.query(`
          UPDATE MonthlyExpenseGoal
          SET monthly_goal = $1
          WHERE acc_id = $2 AND category = $3 AND month = $4
        `, [value, accountId, capitalizedCategory, month]);
    }

    return { message: "Expenditure goals updated successfully." };
  } catch (error) {
    console.error("Error modifying expenditure goals:", error);
    throw error;
  }
}



async function getTransactionByID(accountId, transactionId) {
  try {
    const pool = await getPool();
    const result = await pool.query(`
                SELECT 
                    entry_id, 
                    acc_id, 
                    amount, 
                    date, 
                    description,
                    cat,
                    time
                FROM ExpensesList
                WHERE acc_id = $1 AND entry_id = $2
            `, [accountId, transactionId]);

    if (result.rows.length === 0) {
      return []; // Return an empty array if no records found
    }

    return result.rows[0]; // Return the transaction object
  } catch (error) {
    console.error("Error fetching transaction by ID:", error);
    throw error; // Ensure to propagate the error to the controller
  }
}

async function updateTransaction(accountId, transactionId, updatedTransaction) {
  try {
    const pool = await getPool();

    const now = new Date();
    const currentTime = now.toTimeString().split(' ')[0];

    const result = await pool.query(`
                UPDATE ExpensesList
                SET amount = $1,
                    date = $2,
                    time = $3,
                    description = $4,
                    cat = $5
                WHERE acc_id = $6 AND entry_id = $7
            `, [
      updatedTransaction.amount,
      new Date(updatedTransaction.date),
      currentTime,
      updatedTransaction.description,
      updatedTransaction.cat,
      accountId,
      transactionId
    ]);

    if (result.rowCount === 0) {
      return { message: "No transaction found to update" };
    }

    return { message: "Transaction updated successfully" };
  } catch (error) {
    console.error("Error updating transaction:", error);
    throw error;
  }
}

async function deleteTransaction(accountId, transactionId) {
  try {
    const pool = await getPool();
    const result = await pool.query(`
                DELETE FROM ExpensesList
                WHERE acc_id = $1 AND entry_id = $2
            `, [accountId, transactionId]);

    if (result.rowCount === 0) {
      return { message: "No transaction found to delete" };
    }

    return { message: "Transaction deleted successfully" };
  } catch (error) {
    console.error("Error deleting transaction:", error);
    throw error; // Propagate the error to the controller
  }
}

async function getAllUserBudget(month) {
  try {
    const pool = await getPool();
    const result = await pool.query(`
        SELECT 
          acc_id, 
          month, 
          SUM(monthly_goal) AS monthly_goal
        FROM MonthlyExpenseGoal
        WHERE month = $1
        GROUP BY acc_id, month
        ORDER BY acc_id
      `, [month]);

    return result.rows; // [{ acc_id, month, total_budget }]
  } catch (error) {
    console.error("Error fetching total user budget for month:", error);
    throw error;
  }
}
async function getTransportationExpenditure(accountId, month) {
  try {
    const pool = await getPool();
    const result = await pool.query(`
        SELECT SUM(amount) AS total
        FROM ExpensesList
        WHERE acc_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2 AND cat = 'transport'
      `, [accountId, month]);

    return result.rows[0].total || 0;
  } catch (error) {
    console.error("Error fetching transport expenditure:", error);
    throw error;
  }
}

async function getTransportationGoal(accountId, month) {
  try {
    const pool = await getPool();
    const result = await pool.query(`
        SELECT monthly_goal
        FROM MonthlyExpenseGoal
        WHERE acc_id = $1 AND month = $2 AND category = 'Transport'
      `, [accountId, month]);

    return result.rows[0]?.monthly_goal || 0;
  } catch (error) {
    console.error("Error fetching transport goal:", error);
    throw error;
  }
}

async function getFoodExpenditure(accountId, month) {
  try {
    const pool = await getPool();
    const result = await pool.query(`
        SELECT SUM(amount) AS total
        FROM ExpensesList
        WHERE acc_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2 AND cat = 'food'
      `, [accountId, month]);

    return result.rows[0].total || 0;
  } catch (error) {
    console.error("Error fetching food expenditure:", error);
    throw error;
  }
}

async function getFoodGoal(accountId, month) {
  try {
    const pool = await getPool();
    const result = await pool.query(`
        SELECT monthly_goal
        FROM MonthlyExpenseGoal
        WHERE acc_id = $1 AND month = $2 AND category = 'Food'
      `, [accountId, month]);

    return result.rows[0]?.monthly_goal || 0;
  } catch (error) {
    console.error("Error fetching food goal:", error);
    throw error;
  }
}


async function getUtilityExpenditure(accountId, month) {
  try {
    const pool = await getPool();
    const result = await pool.query(`
        SELECT SUM(amount) AS total
        FROM ExpensesList
        WHERE acc_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2 AND cat = 'utilities'
      `, [accountId, month]);

    return result.rows[0].total || 0;
  } catch (error) {
    console.error("Error fetching utilities expenditure:", error);
    throw error;
  }
}

async function getUtilityGoal(accountId, month) {
  try {
    const pool = await getPool();
    const result = await pool.query(`
        SELECT monthly_goal
        FROM MonthlyExpenseGoal
        WHERE acc_id = $1 AND month = $2 AND category = 'Utilities'
      `, [accountId, month]);

    return result.rows[0]?.monthly_goal || 0;
  } catch (error) {
    console.error("Error fetching utilities goal:", error);
    throw error;
  }
}

async function getOtherExpenditure(accountId, month) {
  try {
    const pool = await getPool();
    const result = await pool.query(`
        SELECT SUM(amount) AS total
        FROM ExpensesList
        WHERE acc_id = $1 AND TO_CHAR(date, 'YYYY-MM') = $2 AND cat = 'other'
      `, [accountId, month]);

    return result.rows[0].total || 0;
  } catch (error) {
    console.error("Error fetching utilities expenditure:", error);
    throw error;
  }
}

async function getOtherGoal(accountId, month) {
  try {
    const pool = await getPool();
    const result = await pool.query(`
        SELECT monthly_goal
        FROM MonthlyExpenseGoal
        WHERE acc_id = $1 AND month = $2 AND category = 'Others'
      `, [accountId, month]);

    return result.rows[0]?.monthly_goal || 0;
  } catch (error) {
    console.error("Error fetching utilities goal:", error);
    throw error;
  }
}


module.exports = {
  getExpenditureGoalByID,
  getTotalExpenditureByID,
  getMonthlyExpenditureByID,
  getAllTransactionsByID,
  getAccountBudget,
  getExpenditureForMonth,
  addTransactionToAccount,
  addExpenditureGoal,
  modifyExpenditureGoal,
  getTransactionByID,
  updateTransaction,
  deleteTransaction,
  getAllUserBudget,
  getTransportationExpenditure,
  getTransportationGoal,
  getFoodExpenditure,
  getFoodGoal,
  getUtilityExpenditure,
  getUtilityGoal,
  getExpenditureGoalPerCategoryMonth,
  getOtherExpenditure,
  getOtherGoal
};