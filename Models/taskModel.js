const { getPool } = require('../Services/pool');

// Get all tasks
async function getTasks(userid) {
    try {
        const pool = await getPool();

        const result = await pool.query(`
            SELECT task_id, task_name, date, time FROM TaskList WHERE acc_id = $1 ORDER BY date, time;
        `, [userid]);

        return result.rows;
    } catch (error) {
        console.error("Model error:", error);
        throw error;
    }
}

// Add task
async function addTask(taskData, userid) {
    try {
        const pool = await getPool();

        // Handle time format properly
        let timeValue = null;
        if (taskData.time && taskData.time.trim() !== '') {
            const timeStr = taskData.time.trim();
            console.log('Processing time:', timeStr); // Debug log

            if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
                // If format is HH:MM, add seconds
                timeValue = timeStr + ':00';
            } else if (timeStr.match(/^\d{1,2}:\d{2}:\d{2}$/)) {
                // If format is HH:MM:SS, use as is
                timeValue = timeStr;
            } else {
                throw new Error('Invalid time format. Use HH:MM or HH:MM:SS');
            }
            console.log('Converted time:', timeValue); // Debug log
        }

        const result = await pool.query(`
            INSERT INTO TaskList (task_name, date, time, acc_id)
            VALUES ($1, $2, $3, $4)
            RETURNING task_id;
        `, [
            taskData.task_name,
            taskData.date,
            timeValue,
            userid
        ]);

        return result.rows[0].task_id;
    } catch (error) {
        console.error("Model error:", error);
        throw error;
    }
}

// Delete task
async function deleteTask(task_id) {
    try {
        const pool = await getPool();

        const result = await pool.query(`
            DELETE FROM TaskList WHERE task_id = $1;
        `, [task_id]);

        return result.rowCount > 0;
    } catch (error) {
        console.error("Model error:", error);
        throw error;
    }
}

// Update task
async function updateTask(task_id, taskData) {
    try {
        const pool = await getPool();

        // Handle time format properly
        let timeValue = null;
        if (taskData.time && taskData.time.trim() !== '') {
            const timeStr = taskData.time.trim();
            console.log('Processing time:', timeStr); // Debug log

            if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
                // If format is HH:MM, add seconds
                timeValue = timeStr + ':00';
            } else if (timeStr.match(/^\d{1,2}:\d{2}:\d{2}$/)) {
                // If format is HH:MM:SS, use as is
                timeValue = timeStr;
            } else {
                throw new Error('Invalid time format. Use HH:MM or HH:MM:SS');
            }
            console.log('Converted time:', timeValue); // Debug log
        }

        const result = await pool.query(`
            UPDATE TaskList 
            SET task_name = $1, date = $2, time = $3
            WHERE task_id = $4;
        `, [
            taskData.task_name,
            taskData.date,
            timeValue,
            task_id
        ]);

        return result.rowCount > 0;
    } catch (error) {
        console.error("Model error:", error);
        throw error;
    }
}

module.exports = {
    getTasks,
    addTask,
    deleteTask,
    updateTask,
};