
const dbConfig = require("../dbConfig");

const account = require("../Models/accountModel.js");
const medicalInformation = require("../Models/medicalInformationModel.js");
const event = require("../Models/eventModel.js");
const finance = require("../Models/financeModel.js");
const task = require("../Models/taskModel.js");
const notifications = require("../Models/notificationsModel.js");
const { get } = require("../Controllers/mapController.js");


let io = null;
let sockets = {};

function init(dependencies) {
  io = dependencies.io;
  sockets = dependencies.userSocketMap;
}




async function run() {
  try {
    await schedule80FinanceNotifications();
    await scheduleEventNotifications();
    await scheduleWeeklyNotifications();
    await scheduleMedicationNotifications();
    await scheduleTaskNotifications();
  } catch (error) {
    //console.error("Error scheduling notifications:", error);
  }
  //console.log("Notifications scheduled successfully.");
}



async function scheduleMedicationNotifications() {
  try {

    const users = await account.getAllUsers(); // get all user accounts
    const now = new Date();

    for (const user of users) {
      const { id } = user;

      const medications = await medicalInformation.getMedicationByAccountID(id);
      if (!medications || medications.length === 0) continue;

      for (const medication of medications) {
        const { name, time, frequency, dosage } = medication;
        if (!time) continue;

        // Parse stored time string (e.g. "1970-01-01T09:00:00.000Z")
        const medTimeObj = new Date(time);
        const medHour = medTimeObj.getUTCHours();     // Use UTC to avoid timezone distortion
        const medMinute = medTimeObj.getUTCMinutes();

        // Create a new date object for today with medication's hour and minute in LOCAL TIME
        const medTimeToday = new Date(now);
        medTimeToday.setHours(medHour, medMinute, 0, 0);

        const diffInMinutes = Math.round((medTimeToday - now) / (1000 * 60));

        let payload = null;

        if (frequency == "D") {

          if (diffInMinutes === 0) {
            payload = {
              type: 'medication',
              acc_id: id,
              description: `Time to take your medication: ${dosage} of ${name}`,
              time: now,
            };
          }

          if (payload) {
            console.log(`Scheduling notification for user ${id}:`, payload.description);
            console.log(medication.med_id)
            const alreadyNotified = await notifications.hasSentMedicationNotificationToday(medication.med_id);
            console.log("Already notified:", alreadyNotified);
            if (alreadyNotified) {
              continue;
            }
            payload.asso_id = medication.med_id; // Associate with medication ID
            const noti_id = await notifications.createNotification(payload);
            payload.noti_id = noti_id;
            await sendNotification(payload, id); // WebSocket or push logic
            console.log(`[Medication]: Notification sent to user ${id}: ${payload.description}`);
          }
        }
      }
    }
  } catch (err) {
    console.error("Medication Notification Engine Error:", err);
  }
}


async function scheduleWeeklyNotifications() {

  try {
    const users = await account.getAllUsers();
    const now = new Date();
    const currentDay = (now.getDay() === 0) ? 7 : now.getDay(); // JS Sunday = 0 → SQL Sunday = 7

    for (const user of users) {
      const { id: acc_id } = user;
      const weeklyTimings = await medicalInformation.getWeeklyTimingsByAccountID(acc_id);
      if (!weeklyTimings || weeklyTimings.length === 0) continue;

      for (const timing of weeklyTimings) {
        const { med_id, day, time, name, medTime_id } = timing;
        if (day !== currentDay) continue;

        // Extract hour & minute like in daily notification
        const medTimeObj = new Date(time);
        const medHour = medTimeObj.getUTCHours();     // handle MSSQL TIME field correctly
        const medMinute = medTimeObj.getUTCMinutes();

        // Create today's datetime at medHour:medMinute
        const medTimeToday = new Date(now);
        medTimeToday.setHours(medHour, medMinute, 0, 0);

        const diffInMinutes = Math.round((medTimeToday - now) / (1000 * 60));
        if (diffInMinutes !== 0) continue;

        const alreadySent = await notifications.hasSentMedicationNotificationPerTiming(medTime_id);
        if (alreadySent) {
          console.log(`[Skip] Already sent for medTime_id ${medTime_id}`);
          continue;
        }

        const payload = {
          type: 'weekly',
          acc_id,
          asso_id: medTime_id,
          description: `Time to take your medication: ${name}`,
          time: now
        };

        const noti_id = await notifications.createNotification(payload);
        payload.noti_id = noti_id;
        await sendNotification(payload, acc_id);
        console.log(`[Weekly Medication] Notification sent to user ${acc_id} for "${name}"`);
      }
    }
  } catch (err) {
    console.error("Weekly Medication Notification Error:", err);
  }
}



async function schedule80FinanceNotifications() {
  try {
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const users = await finance.getAllUserBudget(monthStr);

    for (const user of users) {
      const { id, monthly_goal, acc_id } = user;
      if (!monthly_goal) continue;

      const expenditure = await finance.getExpenditureForMonth(acc_id, monthStr);


      const usageRatio = expenditure.total / monthly_goal;

      const alreadyNotified = await notifications.hasSentBudgetNotificationThisMonth(acc_id);

      if (usageRatio >= 0.8 && !alreadyNotified) {
        const percentage = Math.round(usageRatio * 100);
        const message = `You've used 80% of your monthly budget. Monitor your spending!`;

        let payload = {
          type: 'finance',
          acc_id: acc_id,
          description: message,
          time: new Date(),
        }


        const noti_id = await notifications.createNotification(payload);
        payload.noti_id = noti_id;

        console.log(`[Finance]: Notification created for user ${id}: ${message}`);
        await sendNotification(payload, acc_id);
        console.log(`[Finance]: Notification Scheduled for account ${id}`);
      }
    }

  } catch (err) {
    console.error("Finance Notification Engine Error:", err);
  }
}

async function schedule80FinanceNotifications() {
  try {
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const users = await finance.getAllUserBudget(monthStr);

    for (const user of users) {
      const { id, monthly_goal, acc_id } = user;
      if (!monthly_goal) continue;

      const expenditure = await finance.getExpenditureForMonth(acc_id, monthStr);


      const usageRatio = expenditure.total / monthly_goal;

      const alreadyNotified = await notifications.hasSentBudgetNotificationThisMonth(acc_id);

      if (usageRatio >= 0.8 && !alreadyNotified) {
        const percentage = Math.round(usageRatio * 100);
        const message = `You've used ${percentage}% of your monthly budget. Monitor your spending!`;

        let payload = {
          type: 'finance',
          acc_id: acc_id,
          description: message,
          time: new Date(),
        }


        const noti_id = await notifications.createNotification(payload);
        payload.noti_id = noti_id;

        console.log(`[Finance]: Notification created for user ${id}: ${message}`);
        await sendNotification(payload, acc_id);
        console.log(`[Finance]: Notification Scheduled for account ${id}`);
      }
    }

  } catch (err) {
    console.error("Finance Notification Engine Error:", err);
  }
}




async function scheduleEventNotifications() {

  try {
    const now = new Date();

    // 1. Get all upcoming (non-cancelled) events
    const events = await event.getAllUpcomingEvents();
    if (!events || events.length === 0) {
      console.log("📭 No upcoming events found.");
      return;
    }

    for (const evt of events) {
      const { id: event_id, name, date, time, canceled } = evt;
      if (canceled) {
        continue;
      }

      // 2. Parse time properly from MSSQL TIME field
      const eventTimeObj = new Date(time);
      const eventHour = eventTimeObj.getUTCHours();
      const eventMinute = eventTimeObj.getUTCMinutes();

      // 3. Compose full datetime (local) for this event
      const eventDateTime = new Date(date); // base date
      eventDateTime.setHours(eventHour, eventMinute, 0, 0); // apply time

      // 4. Compute difference in minutes between now and event time
      const diffInMinutes = Math.round((eventDateTime - now) / (1000 * 60));

      // Only notify if it's exactly 30 minutes before the event
      if (diffInMinutes !== 30) continue;

      // 5. Get registered users
      const participants = await event.getRegisteredUsers(event_id);
      if (!participants || participants.length === 0) {
        continue;
      }

      for (const { account_id } of participants) {
        const alreadyNotified = await notifications.hasSentEventNotificationForEvent(event_id, account_id);
        if (alreadyNotified) {
          continue;
        }

        const payload = {
          type: 'event',
          acc_id: account_id,
          asso_id: event_id,
          description: `Reminder: The event "${name}" you're registered for starts in 30 minutes.`,
          time: now,
        };

        const noti_id = await notifications.createNotification(payload);
        payload.noti_id = noti_id;

        await sendNotification(payload, account_id);
        console.log(`✅ [Event] Notification sent to user ${account_id} for "${name}"`);
      }
    }

  } catch (err) {
    console.error("❌ Event Notification Engine Error:", err);
  }
}


async function scheduleTaskNotifications() {
  try {
    const users = await account.getAllUsers();
    const now = new Date();

    for (const user of users) {
      const { id } = user;

      const tasks = await task.getTasks(id);
      if (!tasks || tasks.length === 0) continue;

      for (const task of tasks) {
        const { task_id, task_name, date, time } = task;
        if (!date || !time) continue;

        const taskDate = new Date(date);
        const [hour, minute] = time.split(":").map(Number);
        taskDate.setHours(hour, minute, 0, 0); // Construct full datetime for task

        const diffInMinutes = Math.round((taskDate - now) / (1000 * 60));

        let payload = null;

        if (diffInMinutes === 0) {
          payload = {
            type: 'task',
            acc_id: id,
            description: `You have a task now: ${task_name}`,
            time: now,
          };
        }

        if (payload) {
          const alreadyNotified = await notifications.hasSentTaskNotificationToday(task_id);
          if (alreadyNotified) continue;

          payload.asso_id = task_id;
          const noti_id = await notifications.createNotification(payload);
          payload.noti_id = noti_id;

          await sendNotification(payload, id);
          console.log(`[Task]: Notification sent to user ${id}: ${payload.description}`);
        }
      }
    }
  } catch (err) {
    console.error("Task Notification Engine Error:", err);
  }
}


async function updateEventNotification(event_id, changes) {
  try {
    const participants = await event.getRegisteredUsers(event_id);
    for (const { account_id } of participants) {

      const payload = {
        type: 'event updated',
        acc_id: account_id,
        description: `${changes}`,
        asso_id: event_id,
        time: new Date(),
      };

      const noti_id = await notifications.createNotification(payload);
      payload.noti_id = noti_id;

      await sendNotification(payload, account_id);
      console.log(`✅ [Event] Notification sent to user ${account_id}"`);
    }
  } catch (err) {
    console.error("❌ Event Notification Engine Error:", err);
  }
}

async function deleteEventNotification(event_id, changes) {
  try {
    const participants = await event.getRegisteredUsers(event_id);
    for (const { account_id } of participants) {
      const payload = {
        type: 'event deleted',
        acc_id: account_id,
        description: `Announcement: ${changes}`,
        asso_id: event_id,
        time: new Date(),
      };

      const noti_id = await notifications.createNotification(payload);
      payload.noti_id = noti_id;

      await sendNotification(payload, account_id);
      console.log(`✅ [Event] Notification sent to user ${account_id} for "${name}"`);
    }
  } catch (err) {
    console.error("❌ Event Notification Engine Error:", err);
  }
}





async function sendNotification(payload, accountId) {
  const socketId = sockets[accountId];

  if (io && socketId) {
    io.to(socketId).emit("notification", payload);
    console.log(`✅ Notification sent to user ${accountId}`);
  } else {
    console.warn(`⚠️ No socket found for user ${accountId}`);
  }
}


async function chatRefresh(accountId, payload) {
  const socketId = sockets[accountId];
  if (io && socketId) {
    io.to(socketId).emit("new_message", payload);
    console.log(`✅ Chat refresh sent to user ${accountId}`);
  }
  else {
    console.warn(`⚠️ No socket found for user ${accountId}`);
  }
}








module.exports = {
  init,
  run,
  getIO: () => io,
  chatRefresh,
  updateEventNotification,
  deleteEventNotification
};