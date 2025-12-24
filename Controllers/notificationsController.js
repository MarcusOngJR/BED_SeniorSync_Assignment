const notificationModel = require("../Models/notificationsModel");

async function getAllNotifications(req, res) {
    try {
        const accountId = req.user.id; // Assuming the account ID is stored in the JWT token
        const notifications = await notificationModel.getAllNotificationsByAccountId(accountId);

        if (notifications.length === 0) {
            return res.status(404).json({ message: "No notifications found." });
        }

        res.status(200).json(notifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Internal server error." });
    }
}

async function getUnnotified(req, res) {
    try {
        const accountId = req.user.id; // Assuming the account ID is stored in the JWT token
        const notifications = await notificationModel.getUnnotifiedByAccountId(accountId);

        if (notifications.length === 0) {
            return res.status(404).json({ message: "No unnotified notifications found." });
        }

        res.status(200).json(notifications);
    }
    catch (error) {
        console.error("Error fetching unnotified notifications:", error);
        res.status(500).json({ message: "Internal server error." });
    }
}

async function markNotificationAsNotified(req, res) {
    try {
        const notiId = req.params.noti_id;
        const accountId = req.user.id; // Assuming the account ID is stored in the JWT token

        const result = await notificationModel.markNotificationAsNotified(notiId, accountId);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "Notification not found or already notified." });
        }

        res.status(200).json({ message: "Notification marked as notified." });
    } catch (error) {
        console.error("Error marking notification as notified:", error);
        res.status(500).json({ message: "Internal server error." });
    }
}

async function clearNotifications(req, res) {
    try {
        const accountId = req.user.id;
        const result = await notificationModel.clearNotificationsByAccountId(accountId);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "No notifications to clear." });
        }
        res.status(200).json({ message: "All notifications cleared." });
    } catch (error) {
        console.error("Error clearing notifications:", error);
        res.status(500).json({ message: "Internal server error." });
    }
}


module.exports = {
    getAllNotifications,
    getUnnotified,
    markNotificationAsNotified,
    clearNotifications
};