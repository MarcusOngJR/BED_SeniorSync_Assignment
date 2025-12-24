
CREATE DATABASE BED_ASGM1;
GO

USE BED_ASGM1;
GO


CREATE TABLE AccountPassword (
    id INT PRIMARY KEY IDENTITY(1,1),
    phone_number VARCHAR(15) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL
);

-- Insert users into AccountPassword
INSERT INTO AccountPassword (phone_number, password) VALUES
('11111111', '$2a$10$nF0zTxDmSHQgevJ/8IJhuepjAvPr8iEpBuMaiLjRdO7TgMiBsw.TC'),
('22222222', '$2a$10$nF0zTxDmSHQgevJ/8IJhuepjAvPr8iEpBuMaiLjRdO7TgMiBsw.TC'),
('33333333', '$2a$10$nF0zTxDmSHQgevJ/8IJhuepjAvPr8iEpBuMaiLjRdO7TgMiBsw.TC'),
('44444444', '$2a$10$nF0zTxDmSHQgevJ/8IJhuepjAvPr8iEpBuMaiLjRdO7TgMiBsw.TC'),
('90001111', '$2a$10$nF0zTxDmSHQgevJ/8IJhuepjAvPr8iEpBuMaiLjRdO7TgMiBsw.TC');

-- Create AccountProfile table
CREATE TABLE AccountProfile (
    id INT PRIMARY KEY,  -- references AccountPassword.id
    name VARCHAR(100) NOT NULL,
    account_type CHAR(1) NOT NULL CHECK (account_type IN ('e', 'c', 'o')),
    email VARCHAR(100) NULL,
    gender CHAR(1) NOT NULL CHECK (gender IN ('M', 'F', 'O')),
    date_of_birth DATE NOT NULL,
    preferred_language VARCHAR(30) NOT NULL,
    pfp_link VARCHAR(300) NULL,
	address VARCHAR(255) NULL,

    FOREIGN KEY (id) REFERENCES AccountPassword(id)
);

-- Insert profiles into AccountProfile
INSERT INTO AccountProfile (id, name, account_type, email, gender, date_of_birth, preferred_language, address, pfp_link) VALUES
(1, 'Marcus Ong', 'e', 'marcusong@gmail.com', 'M', '2007-09-02', 'English', 'Bishan', 'https://res.cloudinary.com/dmnipl0gl/image/upload/v1751283571/IMG20250601231047_mvcbjb.jpg'),
(2, 'Belle Chong', 'c', 'bellechong@gmail.com', 'F', '2007-05-14', 'Mandarin', 'Marsling', 'https://res.cloudinary.com/dmnipl0gl/image/upload/v1751284201/IMG-20250630-WA0006_jpmbkv.jpg'),
(3, 'ActiveSG.ORG', 'o', 'activeSG@connect.sg', 'O', '2014-04-01', 'English', Null, NULL),
(4, 'Ansleigh Ong', 'e', 'ansleighong@gmail.com', 'M', '2007-08-02', 'English', 'Clementi', 'https://res.cloudinary.com/dmnipl0gl/image/upload/v1751978834/Screenshot_2025-07-08_204529_nlnlmv.png'),
(5, 'Grace Koh', 'c', 'grace.koh@email.com', 'F', '1985-11-05', 'Tamil', 'Toa Payoh', NULL);

-- Create MedicationList table
CREATE TABLE MedicationList (
    med_id INT PRIMARY KEY IDENTITY(1,1),
    account_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(200) NULL,
    dosage VARCHAR(50) NOT NULL,
    time TIME NULL,
    frequency VARCHAR(2) NOT NULL CHECK (frequency IN ('D', 'W', 'WR')), -- D for daily, W for weekly, WR for When Required
    start_date DATE NOT NULL,
    FOREIGN KEY (account_id) REFERENCES AccountPassword(id)
);


-- Insert medications for account_id = 1
INSERT INTO MedicationList (account_id, name, description, dosage, time, frequency, start_date) VALUES
-- For acc_id 1
(1, 'Lisinopril', 'Used to treat high blood pressure (Hypertension)', '2 pills', '08:00', 'D', '2025-06-01'),
(1, 'Donepezil', 'Helps with memory and thinking problems in Dementia', '1 tablet', Null, 'W', '2025-06-01'),
(1, 'Paracetamol', 'Take only if fever exceeds 38°C', '1 tablet', NULL, 'WR', '2025-06-01'),

-- For acc_id 4
(4, 'Insulin', 'Blood sugar management for Type 2 Diabetes', '10 units', '07:00', 'D', '2025-07-01'),
(4, 'Salbutamol Inhaler', 'Relief inhaler for Asthma symptoms', '2 puffs', NULL, 'WR', '2025-07-01'),
(4, 'Paracetamol', 'For joint pain associated with Osteoarthritis', '1 tablet', '13:00', 'D', '2025-07-01'),
(4, 'Losartan', 'Kidney protection for Chronic Kidney Disease', '1 tablet', '09:00', 'D', '2025-07-01');



CREATE TABLE WeeklyMedicationTiming (
	medTime_id INT PRIMARY KEY IDENTITY(1,1),
	med_id INT NOT NULL,
	day INT NOT NULL check (day <=7 ),
	time TIME NOT NULL,
)

INSERT INTO WeeklyMedicationTiming (med_id, day, time) VALUES
(2, 1, '14:00'), -- Monday at 2 PM
(2, 4, '14:00'); -- Thursday at 2 PM



-- Create EventList table
CREATE TABLE EventList (
    id INT PRIMARY KEY IDENTITY(1,1),
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    location VARCHAR(100) NOT NULL,
    org_id INT NOT NULL,
    weekly BIT NOT NULL,
    equipment_required VARCHAR(300) NULL,
	canceled BIT NOT NULL DEFAULT '0',
	banner_image VARCHAR(255) NULL

    FOREIGN KEY (org_id) REFERENCES AccountPassword(id)
);

-- Insert events by org_id = 3 (ActiveSG.ORG)
INSERT INTO EventList (name, description, date, time, location, org_id, weekly, equipment_required, banner_image) VALUES
('Morning Tai Chi', 
 'Join us for a refreshing Tai Chi session in the park to improve flexibility and balance.', 
 '2025-07-01', '07:30', 
 'Marymount Community Centre Garden', 3, 1, NULL,
 'https://res.cloudinary.com/dmnipl0gl/image/upload/v1752113567/Screenshot_2025-07-10_101147_flxjb6.png'),

('Health Talk: Managing Blood Pressure', 
 'A short seminar led by a certified nurse about controlling high blood pressure through lifestyle.', 
 '2025-07-10', '10:00', 
 'Community Hall A, Marymount CC', 3, 0, 
 'Pen & Paper (for taking notes and simple activities)',
 'https://res.cloudinary.com/dmnipl0gl/image/upload/v1752113642/Screenshot_2025-07-10_101350_ua29m4.png'),

('Creative Art Class', 
 'Weekly creative workshop with painting, drawing, and crafts. Materials provided.', 
 '2025-07-03', '14:00', 
 'Studio Room, Marymount CC', 3, 1, 
 'Art materials (eg. brushes, crayons, paint (if you have))',
 'https://res.cloudinary.com/dmnipl0gl/image/upload/v1752113812/Screenshot_2025-07-10_101646_hni1nn.png'),

('Bingo Night', 
 'Fun evening event with prizes, snacks, and socializing. All seniors welcome!', 
 '2025-07-15', '18:00', 
 'Event Hall, Marymount CC', 3, 0, NULL,
 ''),

('Chair Yoga for Seniors', 
 'Gentle seated yoga exercises to promote mobility and calm the mind. Led by a certified instructor.', 
 '2025-07-05', '09:00', 
 'Activity Room B, Marymount CC', 3, 1, 
 'Comfortable clothing and water bottle',
 '');

-- Create RegisteredList table
CREATE TABLE RegisteredList (
    reg_id INT PRIMARY KEY IDENTITY(1,1),
    account_id INT NOT NULL,
    event_id INT NOT NULL,
    FOREIGN KEY (event_id) REFERENCES EventList(id),
    FOREIGN KEY (account_id) REFERENCES AccountPassword(id)
);

-- Insert registrations for account_id = 1
INSERT INTO RegisteredList (account_id, event_id) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 5);

Create table MedicalConditionList(
	medc_id INT PRIMARY KEY IDENTITY(1,1),
	name VARCHAR(50) NOT NULL,
	descr VARCHAR(255) NULL,
	acc_id INT NOT NULL,
	prescription_date DATE NOT NULL,
	created_at DATETIME DEFAULT GETDATE(),
	updated_at DATETIME NULL,
	mod_id INT NOT NULL

	FOREIGN KEY (acc_id) REFERENCES AccountPassword(id),
	FOREIGN KEY (mod_id) REFERENCES AccountPassword(id)
)

INSERT INTO MedicalConditionList (name, descr, acc_id, prescription_date, updated_at, mod_id) VALUES 
-- For acc_id 1
('Hypertension', 'High blood pressure requiring daily monitoring and medication.', 1, '2025-06-01', GETDATE(), 2),
('Dementia', 'Progressive memory loss; requires supervision and memory-supporting medication.', 1, '2024-10-15', GETDATE(), 2),

-- For acc_id 4
('Type 2 Diabetes', 'Requires insulin and blood sugar monitoring. Diagnosed in 2023.', 4, '2023-11-12', GETDATE(), 2),
('Asthma', 'Chronic condition affecting breathing; uses inhaler as needed.', 4, '2022-05-20', GETDATE(), 2),
('Osteoarthritis', 'Joint pain and stiffness, especially in knees. Requires physio and pain relief meds.', 4, '2021-08-10', GETDATE(), 2),
('Chronic Kidney Disease', 'Stage 2; requires dietary control and kidney-protective medication.', 4, '2024-03-18', GETDATE(), 2);


Create table MedicationConditionAssociationList(
	id INT PRIMARY KEY IDENTITY(1,1),
	med_id INT NOT NULL,
	medc_id INT NOT NULL,

)

INSERT INTO MedicationConditionAssociationList (med_id, medc_id) VALUES 
(1, 1),
(2, 2),
(4, 3),
(5, 4)




Create table MonthlyExpenseGoal(
	id INT IDENTITY(1,1) PRIMARY KEY,
	acc_id INT,
	monthly_goal DECIMAL(10, 2),
	category varchar(20) not null,
	month varchar(7) Not Null

	FOREIGN KEY (acc_id) REFERENCES AccountPassword(id)
)


INSERT INTO MonthlyExpenseGoal (acc_id, monthly_goal, category, month) VALUES
(1, 300.00, 'Food',      '2025-06'),
(1, 100.00, 'Utilities', '2025-06'),
(1, 80.00,  'Transport', '2025-06'),
(1, 300.00, 'Others', '2025-06'),

(1, 320.00, 'Food',      '2025-07'),
(1, 110.00, 'Utilities', '2025-07'),
(1, 90.00,  'Transport', '2025-07'),
(1, 200.00, 'Others', '2025-07'),

(1, 310.00, 'Food',      '2025-08'),
(1, 105.00, 'Utilities', '2025-08'),
(1, 85.00,  'Transport', '2025-08'),
(1, 200.00, 'Others', '2025-08');



CREATE TABLE ExpensesList (
    entry_id INT PRIMARY KEY IDENTITY(1,1),
    cat VARCHAR(50) NOT NULL,
    description VARCHAR(500) NULL,
    amount DECIMAL(10,2) NOT NULL,
    acc_id INT NOT NULL,
    date DATE NOT NULL,
	time TIME NOT NULL,
    FOREIGN KEY (acc_id) REFERENCES AccountPassword(id)
);

-- Expenses for Account ID 1
INSERT INTO ExpensesList (cat, description, amount, acc_id, date, time) VALUES
('food', 'Tesco weekly groceries', 150.00, 1, '2025-01-05', '10:30:00'),
('utilities', 'January electric bill', 70.25, 1, '2025-01-10', '08:45:00'),
('transport', 'Petrol refill', 60.00, 1, '2025-01-18', '18:10:00'),

('food', 'Monthly groceries', 140.00, 1, '2025-02-03', '11:20:00'),
('food', 'Dinner at KFC', 50.00, 1, '2025-02-10', '19:00:00'),
('utilities', 'Unifi monthly', 89.99, 1, '2025-02-11', '09:00:00'),

('food', 'Groceries at AEON', 160.00, 1, '2025-03-02', '13:00:00'),
('utilities', 'March TNB bill', 72.00, 1, '2025-03-12', '08:15:00'),
('entertainment', 'Netflix', 55.00, 1, '2025-03-20', '21:30:00'),

('transport', 'Petrol refuel', 70.00, 1, '2025-04-01', '17:45:00'),
('food', 'Birthday dinner', 90.00, 1, '2025-04-15', '20:00:00'),
('utilities', 'April internet bill', 89.99, 1, '2025-04-11', '08:00:00'),

('food', 'Groceries at Giant', 130.00, 1, '2025-05-05', '12:30:00'),
('entertainment', 'Gym subscription', 110.00, 1, '2025-05-07', '07:50:00'),
('other', 'Bought office supplies', 40.00, 1, '2025-05-15', '15:30:00'),

('transport', 'Fuel top-up', 65.00, 1, '2025-06-06', '18:00:00'),
('food', 'Cafe with friends', 85.00, 1, '2025-06-10', '14:45:00'),
('utilities', 'June bill', 75.20, 1, '2025-06-15', '09:10:00'),

('food', 'Groceries at Lotus', 145.00, 1, '2025-07-01', '11:10:00'),
('entertainment', 'July Netflix', 55.00, 1, '2025-07-03', '22:00:00'),
('utilities', 'Unifi July', 89.99, 1, '2025-07-05', '08:05:00');

-- Expenses for Account ID 4
INSERT INTO ExpensesList (cat, description, amount, acc_id, date, time) VALUES
('food', 'Fast food', 25.00, 4, '2025-01-15', '13:15:00'),
('utilities', 'Low usage', 30.00, 4, '2025-01-20', '09:20:00'),

('entertainment', 'Flight tickets', 450.00, 4, '2025-03-10', '16:00:00'),
('entertainment', 'Hotel booking', 300.00, 4, '2025-03-12', '14:30:00'),
('food', 'Buffet dinner', 120.00, 4, '2025-03-13', '19:00:00'),

('food', 'Monthly groceries', 180.00, 4, '2025-04-05', '10:45:00'),
('transport', 'Car petrol', 90.00, 4, '2025-04-10', '17:30:00'),

('utilities', 'May bill', 89.99, 4, '2025-05-03', '08:10:00'),

('other', 'New phone', 1200.00, 4, '2025-06-01', '13:25:00'),
('food', 'Anniversary dinner', 200.00, 4, '2025-06-06', '20:15:00'),

('transport', 'Top-up petrol', 70.00, 4, '2025-07-04', '17:40:00'),
('entertainment', 'Disney+', 49.99, 4, '2025-07-07', '21:45:00');



create table notificationList(
	noti_id INT PRIMARY KEY IDENTITY(1,1),
	type varchar(25) NOT NULL check (type in ('event', 'event deleted', 'finance', 'budget finance', 'event updated', 'medication', 'announcement', 'calendar', 'social', 'profile', 'weekly', 'task')),
	time DATETIME NOT NULL,
	description VARCHAR(255) NOT NULL,
	acc_id INT NOT NULL,
	notified BIT DEFAULT 0,
	seen BIT Default 0,
	asso_id INT NULL,


	FOREIGN KEY (acc_id) REFERENCES AccountPassword(id)
)

DROP TABLE IF EXISTS TaskList;
CREATE TABLE TaskList(
    task_id INT PRIMARY KEY IDENTITY(1,1),
	acc_id INT NOT NULL,
    task_name VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    time VARCHAR(10) NULL
);




CREATE TABLE syncCodes (
  code_id INT PRIMARY KEY IDENTITY(1,1),
  acc_id INT,
  code VARCHAR(6) NOT NULL,
);




Create Table syncAccounts (
	sync_id INT PRIMARY KEY IDENTITY(1,1),
	elderly_id INT,
	caretaker_id INT,
)


INSERT INTO syncAccounts(elderly_id, caretaker_id) values
(1, 2),
(4, 2)

