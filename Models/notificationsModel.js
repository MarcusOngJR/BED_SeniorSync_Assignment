const { getPool } = require('../Services/pool');

async function getAllNotificationsByAccountId(accountId) {
  try {
    const pool = await getPool();
    const result = await pool.query(
      "SELECT * FROM notificationList WHERE acc_id = $1 ORDER BY time desc",
      [accountId]
    );

    return result.rows; // Return the array of notifications
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
}

async function getUnnotifiedByAccountId(accountId) {
  try {
    const pool = await getPool();
    const result = await pool.query(
      "SELECT * FROM notificationList WHERE acc_id = $1 AND notified = false ORDER BY time desc",
      [accountId]
    );

    return result.rows; // Return the array of unnotified notifications
  }
  catch (error) {
    console.error("Error fetching unnotified notifications:", error);
    throw error;
  }
}

async function markNotificationAsNotified(notiId, accountId) {
  try {
    console.log(notiId)
    const pool = await getPool();
    const result = await pool.query(
      "UPDATE notificationList SET notified = true WHERE noti_id = $1 AND acc_id = $2",
      [notiId, accountId]
    );
    console.log("Notification marked as notified:", result.rowCount);
    return result;
  } catch (error) {
    console.error("Error marking notification as notified:", error);
    throw error;
  }
}

async function createNotification(payload) {
  if (!payload.type || !payload.acc_id || !payload.description || !payload.time) {
    throw new Error("Missing required fields in notification payload.");
  }

  try {
    const pool = await getPool();

    let query;
    let values;

    if (payload.asso_id !== undefined) {
      query = `
        INSERT INTO notificationList (type, acc_id, description, time, asso_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING noti_id
      `;
      values = [payload.type, payload.acc_id, payload.description, payload.time, payload.asso_id];
    } else {
      query = `
        INSERT INTO notificationList (type, acc_id, description, time)
        VALUES ($1, $2, $3, $4)
        RETURNING noti_id
      `;
      values = [payload.type, payload.acc_id, payload.description, payload.time];
    }

    const result = await pool.query(query, values);
    const noti_id = result.rows[0]?.noti_id;

    console.log("Notification created with noti_id:", noti_id);
    return noti_id;

  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

async function hasSentBudgetNotificationThisMonth(accountId) {
  const pool = await getPool();
  const result = await pool.query(`
            SELECT COUNT(*) AS count
            FROM NotificationList
            WHERE acc_id = $1
              AND type = 'finance'
        `, [accountId]);
  return parseInt(result.rows[0].count) > 0;
}

async function hasSentMedicationNotificationToday(med_id) {
  try {
    const pool = await getPool();
    const result = await pool.query(`
      SELECT 1
      FROM notificationList
      WHERE type = 'medication'
        AND asso_id = $1
        AND (time + interval '8 hours')::date = CURRENT_DATE
    `, [med_id]);

    const alreadySent = result.rows.length > 0;
    return alreadySent;
  } catch (err) {
    console.error("Error checking medication notification:", err);
    throw err;
  }
}


async function hasSentMedicationNotificationPerTiming(medTime_id) {
  try {
    const pool = await getPool();
    const result = await pool.query(`
      SELECT 1
      FROM notificationList
      WHERE type = 'weekly'
        AND asso_id = $1
        AND (time + interval '8 hours')::date = CURRENT_DATE
    `, [medTime_id]);

    return result.rows.length > 0;
  } catch (error) {
    console.error("Error checking weekly medication notification:", error);
    throw error;
  }
}

async function hasSentEventNotificationForEvent(eventId, accountId) {
  try {
    const pool = await getPool();
    const result = await pool.query(`
      SELECT 1
      FROM notificationList
      WHERE type = 'event'
        AND asso_id = $1
        AND acc_id = $2
        AND (time + interval '8 hours')::date = CURRENT_DATE
    `, [eventId, accountId]);

    return result.rows.length > 0;
  } catch (err) {
    console.error("Error checking event notification:", err);
    throw err;
  }
}

async function hasSentTaskNotificationToday(taskId) {
  try {
    const pool = await getPool();
    const result = await pool.query(`
      SELECT 1
      FROM notificationList
      WHERE type = 'task'
        AND asso_id = $1
        AND (time + interval '8 hours')::date = CURRENT_DATE
    `, [taskId]);
    return result.rows.length > 0;
  } catch (err) {
    console.error("Error checking task notification:", err);
    throw err;
  }
}

async function clearNotificationsByAccountId(accountId) {
  try {
    const pool = await getPool();
    const result = await pool.query(
      "DELETE FROM notificationList WHERE acc_id = $1",
      [accountId]
    );
    console.log("Notifications cleared:", result.rowCount);
    return result;
  } catch (error) {
    console.error("Error clearing notifications:", error);
    throw error;
  }
}

module.exports = {
  getAllNotificationsByAccountId,
  getUnnotifiedByAccountId,
  markNotificationAsNotified,
  createNotification,
  hasSentBudgetNotificationThisMonth,
  hasSentMedicationNotificationToday,
  hasSentMedicationNotificationPerTiming,
  hasSentEventNotificationForEvent,
  hasSentTaskNotificationToday,
  clearNotificationsByAccountId
};