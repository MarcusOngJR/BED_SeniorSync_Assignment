const express = require("express");

const dotenv = require("dotenv");
const path = require("path");
const http = require('http');
const socketIo = require('socket.io');

dotenv.config();

const { closePool } = require("./Services/pool.js");

const app = express();


app.use(express.static(path.join(__dirname, "public")));

const server = http.createServer(app); // create HTTP server manually
const io = socketIo(server);

app.set("io", io);

const port = process.env.PORT || 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const notificationEngine = require("./Services/notificationEngine.js");

// Inject socket instance and map AFTER everything is initialized
const userSocketMap = {};
notificationEngine.init({
  io: app.get("io"),
  userSocketMap
});

// Initialize event scheduler for automatic event generation
const eventScheduler = require("./Services/eventScheduler.js");
// eventScheduler.start(); // Creates random events every 5 hours


const accountController = require("./Controllers/accountController.js");
const medicalInformationController = require("./Controllers/medicalInformationController.js");
const eventController = require("./Controllers/eventController.js");
const financeController = require("./Controllers/financeController.js");
const taskController = require("./Controllers/taskController.js");
const notificationsController = require("./Controllers/notificationsController.js");
const syncingController = require("./Controllers/syncingController.js");


const mapRoutes = require('./Controllers/mapController.js');

const chatbotController = require("./Controllers/chatbotController.js");

const liveChatController = require("./Controllers/liveChatController.js");



const authorization = require("./Middlewares/authorization.js");

const {
  validateMedication,
  validateMedicalCondition,
} = require("./Middlewares/medicalInformationValidation.js");

const {
  validateTransaction,
  validateExpenditureGoal
} = require('./Middlewares/financeValidation.js');


////////////////////////////////////////////////////
/////////////API Endpoints//////////////////////////
////////////////////////////////////////////////////

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true, time: new Date().toISOString() });
  console.log("!!!!!!!!!!  Health check OK  !!!!!!!!!!");
});

//Account Profile Endpoints (By XinHui)
app.post("/authenticateUser", accountController.authenticateAccount);
app.get("/getAccountById", authorization.verifyJWT, accountController.getAccountById);
app.post("/createAccount", accountController.createAccount);
app.post("/account/forgot-password", accountController.forgotPassword);
app.post("/initializeAccountDetails/:id", accountController.initializeAccountDetails);
app.get("/getPhoneByAccountID", authorization.verifyJWT, accountController.getPhoneByAccountID);
app.put("/updateProfile", authorization.verifyJWT, accountController.updateProfile);
app.put("/updatePhoneNumber", authorization.verifyJWT, accountController.updatePhoneNumber);
app.put("/account/password", authorization.verifyJWT, authorization.authorization, accountController.updatePassword);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//Medical Information & Medication Endpoints (By Marcus)

app.get("/getMedicationByAccountID", authorization.verifyJWT, medicalInformationController.getMedicationByAccountID);
app.get("/getMedicationByID/:id", authorization.verifyJWT, medicalInformationController.getMedicationByID);
app.get("/getMedicalConditionByID/:id", authorization.verifyJWT, medicalInformationController.getMedicalConditionByID);
app.get("/getWeeklyTiming/:med_id", authorization.verifyJWT, medicalInformationController.getWeeklyTiming);
app.get("/getMedicalConditionByAccountID", authorization.verifyJWT, medicalInformationController.getMedicalConditionByAccountID);
app.get("/getMedicationAssociatedWithMedicalCondition/:id", authorization.verifyJWT, medicalInformationController.getMedicationAssociatedWithMedicalCondition);

app.post("/createMedication", authorization.verifyJWT, authorization.authorization, validateMedication, medicalInformationController.createMedication);
app.post("/createMedicalCondition", authorization.verifyJWT, authorization.authorization, validateMedicalCondition, medicalInformationController.createMedicalCondition);
app.post("/associateMedicationWithMedicalCondition", authorization.verifyJWT, medicalInformationController.associateMedicationWithMedicalCondition);
app.post("/saveWeeklyTiming", authorization.verifyJWT, medicalInformationController.saveWeeklyTiming);

app.put("/updateMedication/:id", authorization.verifyJWT, authorization.authorization, medicalInformationController.updateMedication);
app.put("/updateMedicalCondition/:id", authorization.verifyJWT, authorization.authorization, medicalInformationController.updateMedicalCondition);


app.delete("/deleteMedication/:id", authorization.verifyJWT, authorization.authorization, medicalInformationController.deleteMedication);
app.delete("/deleteMedicalCondition/:id", authorization.verifyJWT, authorization.authorization, medicalInformationController.deleteMedicalCondition);
app.delete("/deleteMedicationConditionAssociation", authorization.verifyJWT, medicalInformationController.deleteMedicationConditionAssociation);
app.delete("/resetWeeklyTiming/:med_id", authorization.verifyJWT, medicalInformationController.resetWeeklyTiming);

//Account Syncing Endpoints (By Marcus)
app.get("/getSyncedAccounts", authorization.verifyJWT, syncingController.getSyncedAccounts);
app.post("/createSyncRequest", authorization.verifyJWT, syncingController.createSyncRequest);
app.post("/linkFromCode", authorization.verifyJWT, syncingController.linkFromCode);


//Medical Information Autocomplete, Use of external API from backend (By Marcus)
app.get("/autocompleteMedication/:query", medicalInformationController.autocompleteMedication);
app.get("/autocompleteMedicalCondition/:query", medicalInformationController.autocompleteMedicalCondition);

//AI Chatbot Endpoints, Use of external API (By Marcus)
app.post("/chatbot/chat", authorization.verifyJWT, chatbotController.getChatbotResponse);
app.delete("/chatbot/clearHistory", authorization.verifyJWT, chatbotController.clearChatHistory);

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//Events Endpoints (By Ansleigh)
app.get("/getEventRegisteredByID", authorization.verifyJWT, eventController.getEventRegisteredByID);
app.get("/getEventDetailsByID/:id", authorization.verifyJWT, eventController.getEventDetailsByID);
app.get("/getAllEvents", authorization.verifyJWT, eventController.getAllEvents);
app.post("/registerEvent/:event_id", authorization.verifyJWT, eventController.registerEvent);
app.delete("/unregisterEvent/:event_id", authorization.verifyJWT, eventController.unregisterEvent);


app.post("/createEvent", authorization.verifyJWT, authorization.authorization, eventController.createEvent);
app.put("/updateEvent/:event_id", authorization.verifyJWT, authorization.authorization, eventController.updateEvent);
app.delete("/deleteEvent/:event_id", authorization.verifyJWT, authorization.authorization, eventController.deleteEvent);

app.use("/api/maps", authorization.verifyJWT, mapRoutes);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//Finance Endpoints (By Belle)

app.get("/getExpenditureGoalByID", authorization.verifyJWT, financeController.getExpenditureGoalByID);
app.get("/getTotalExpenditureByID", authorization.verifyJWT, financeController.getTotalExpenditureByID);
app.get("/getMonthlyExpenditureByID", authorization.verifyJWT, financeController.getMonthlyExpenditureByID);
app.get("/getAllTransactionsByID/", authorization.verifyJWT, financeController.getAllTransactionsByID);
app.get("/getTransactionByID/:id", authorization.verifyJWT, financeController.getTransactionByID);
app.get("/getTransactionsByMonth/:month", authorization.verifyJWT, financeController.getTransactionsByMonth);

app.post("/addTransactionToAccount", authorization.verifyJWT, authorization.authorization, validateTransaction, financeController.addTransactionToAccount);
app.put("/updateExpenditureGoal", authorization.verifyJWT, authorization.authorization, financeController.updateExpenditureGoal);

app.put("/updateTransaction/:id", authorization.verifyJWT, authorization.authorization, financeController.updateTransaction);
app.delete("/deleteTransaction/:id", authorization.verifyJWT, authorization.authorization, financeController.deleteTransaction);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Displaying data as graphs/charts, use of external API from backend (By Belle) ////////////////////////////////////////////////////////////////
app.get("/getExpenditureByMonthBarChart/:id", authorization.verifyJWT, financeController.getExpenditureByMonthBarChart);
app.get("/getBudgetExpenditureDoughnutChart/:month", authorization.verifyJWT, financeController.getBudgetExpenditureDoughnutChart);
app.get('/transportBarChart/:month', authorization.verifyJWT, financeController.getTransportationBarChart);
app.get('/getFoodBarChart/:month', authorization.verifyJWT, financeController.getFoodBarChart);
app.get('/getUtilityBarChart/:month', authorization.verifyJWT, financeController.getUtilityBarChart);
app.get('/getOtherBarChart/:month', authorization.verifyJWT, financeController.getOtherBarChart);

app.get('/getExpenditurePerCategoryMonth/:month', authorization.verifyJWT, financeController.getExpenditureGoalPerCategoryMonth);


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Notification Feature API Endpoints (By Belle)
app.get("/getAllNotifications", authorization.verifyJWT, notificationsController.getAllNotifications);
app.get("/getUnnotified", authorization.verifyJWT, notificationsController.getUnnotified);


app.put("/markNotificationAsNotified/:noti_id", authorization.verifyJWT, notificationsController.markNotificationAsNotified);

//app.delete("/deleteNotification/:id", authorization.verifyJWT, notificationsController.deleteNotification);
app.delete("/clearNotifications", authorization.verifyJWT, notificationsController.clearNotifications);


//Live Chat API Endpoints (By Belle)
app.post("/sendMessage", authorization.verifyJWT, liveChatController.sendMessage);
app.get("/messages/:with_id", authorization.verifyJWT, liveChatController.getMessages);


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



app.post("/postImage", authorization.verifyJWT); //WIP




// Task management API endpoints (By Yuxuan)
app.get("/tasks", authorization.verifyJWT, taskController.getTasks);
app.post("/tasks", authorization.verifyJWT, taskController.addTask);
app.put("/tasks/:task_id", authorization.verifyJWT, taskController.updateTask);
app.delete("/tasks/:task_id", authorization.verifyJWT, taskController.deleteTask);



////////////////////////////////////////////////////
///////////////WebSocket API (Belle)////////////////////
////////////////////////////////////////////////////
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Prompt the client to register
  if (!Object.keys(userSocketMap).includes(socket.id)) {
    socket.emit('requestRegistration');
  }

  socket.on('register', (accountId) => {
    userSocketMap[accountId] = socket.id;
    console.log(`User ${accountId} registered with socket ID ${socket.id}`);
  });

  socket.on('disconnect', () => {
    for (const [accountId, sockId] of Object.entries(userSocketMap)) {
      if (sockId === socket.id) {
        delete userSocketMap[accountId];
        break;
      }
    }
    console.log('Client disconnected:', socket.id);
  });
});


////////////////////////////////////////////////////
/////////////Create Express app////////////////
////////////////////////////////////////////////////

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`API documentation: http://localhost:${port}/api-docs`);
  console.log(`Index page: http://localhost:${port}/index.html`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Server is gracefully shutting down");
  // eventScheduler.stop(); // Stop event scheduler
  await closePool(); // Close the database connection pool
  console.log("Database connections closed");
  process.exit(0);
});


app.use(express.static(path.join(__dirname, "Public")));


////////////////////////////////////////////////////
/////////////Swagger Documentation////////////////
////////////////////////////////////////////////////

const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger-output.json"); // Import generated spec

// Serve the Swagger UI at a specific route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));


/////////////Exports Websocket io for controller use /////////////////////////////
// setInterval(() => {
//   notificationEngine.run().catch(err => console.error("notificationEngine.run() error:", err));
// }, 5000);




module.exports = { app, server, userSocketMap };