const { getPool } = require('../Services/pool');

async function getEventRegisteredByID(id) {
    try {
        const pool = await getPool();
        const result = await pool.query(`
                SELECT 
                    e.banner_image,
                    e.id,
                    e.name,
                    e.description,
                    e.date,
                    e.time,
                    e.location,
                    e.org_id,
                    e.weekly,
                    e.equipment_required
                FROM RegisteredList r
                JOIN EventList e ON r.event_id = e.id
                WHERE r.account_id = $1 AND e.date >= CURRENT_DATE
                ORDER BY e.date ASC
            `, [id]);

        return result.rows;

    } catch (error) {
        console.error("Model error:", error);
        throw error;
    }
}

async function getEventDetailsByID(id) {
    try {
        const pool = await getPool();
        const result = await pool.query(
            "SELECT * FROM EventList WHERE id = $1",
            [id]
        );

        return result.rows[0]; // Return first match or undefined
    } catch (error) {
        console.error("Model error:", error);
        throw error;
    }
}

async function getAllEvents() {
    try {
        const pool = await getPool();
        const result = await pool.query("SELECT * FROM EventList where date >= CURRENT_DATE ORDER BY date asc");
        return result.rows; // Return all events
    } catch (error) {
        console.error("Model error:", error);
        throw error;
    }
}

async function registerEvent(accountId, eventId) {
    try {
        const pool = await getPool();

        const existing = await pool.query(`
            SELECT 1 FROM RegisteredList
            WHERE account_id = $1 AND event_id = $2
        `, [accountId, eventId]);

        if (existing.rows.length > 0) {
            return false;
        }

        const result = await pool.query(`
            INSERT INTO RegisteredList (account_id, event_id)
            VALUES ($1, $2)
        `, [accountId, eventId]);

        return result.rowCount > 0;
    } catch (error) {
        console.error("Model error:", error);
        throw error;
    }
}

async function unregisterEvent(accountId, eventId) {
    try {
        const pool = await getPool();
        const result = await pool.query(`
            DELETE FROM RegisteredList
            WHERE account_id = $1 AND event_id = $2
        `, [accountId, eventId]);

        return result.rowCount > 0;
    } catch (error) {
        console.error("Model error:", error);
        throw error;
    }
}

async function createEvent(eventData) {
    try {
        const pool = await getPool();

        console.log(eventData);

        const result = await pool.query(`
            INSERT INTO EventList (name, description, date, time, location, org_id, weekly, equipment_required, banner_image)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
            eventData.name,
            eventData.description,
            eventData.date,
            eventData.time,
            eventData.location,
            parseInt(eventData.org_id),
            eventData.weekly ? 1 : 0,
            eventData.equipment_required || null,
            eventData.banner_image || ""
        ]);

        return result.rowCount > 0;
    } catch (error) {
        console.error("Model error:", error);
        throw error;
    }
}

async function updateEvent(eventId, eventData, accountId) {
    try {
        const pool = await getPool();

        const result = await pool.query(`
            UPDATE EventList
            SET name = $1,
                description = $2,
                date = $3,
                time = $4,
                location = $5,
                weekly = $6,
                equipment_required = $7,
                banner_image = $8
            WHERE id = $9 AND org_id = $10
        `, [
            eventData.name,
            eventData.description,
            new Date(eventData.date),
            eventData.time,
            eventData.location,
            eventData.weekly ? 1 : 0,
            eventData.equipment_required,
            eventData.banner_image || "",
            eventId,
            accountId
        ]);

        console.log("Rows affected:", result.rowCount);

        return result.rowCount > 0;
    } catch (error) {
        console.error("Model error:", error);
        throw error;
    }
}

async function deleteEvent(eventId, accountId) {
    try {
        const pool = await getPool();

        //delete from reference table
        await pool.query(`
            DELETE FROM RegisteredList
            WHERE event_id = $1
        `, [eventId]);

        //delete from event list
        const result = await pool.query(`
            DELETE FROM EventList
            WHERE id = $1 AND org_id = $2
        `, [eventId, accountId]);


        return result.rowCount > 0;

    } catch (error) {
        console.error("Model error:", error);
        throw error;
    }
}

async function getAllUpcomingEvents() {
    try {
        const pool = await getPool();
        const result = await pool.query(`
      SELECT *
      FROM EventList
      WHERE canceled = 0
    `);
        return result.rows;
    } catch (err) {
        console.error("Error fetching events:", err);
        throw err;
    }
}

async function getRegisteredUsers(eventId) {
    try {
        const pool = await getPool();
        const result = await pool.query(`
      SELECT account_id
      FROM RegisteredList
      WHERE event_id = $1
    `, [eventId]);
        return result.rows;
    } catch (err) {
        console.error("Error fetching registered users:", err);
        throw err;
    }
}

module.exports = {
    getEventRegisteredByID,
    getEventDetailsByID,
    getAllEvents,
    deleteEvent,
    createEvent,
    updateEvent,
    registerEvent,
    unregisterEvent,
    getAllUpcomingEvents,
    getRegisteredUsers
};