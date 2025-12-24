const eventModel = require('../Models/eventModel');
const fs = require('fs');
const path = require('path');

class EventScheduler {
    constructor() {
        this.intervalId = null;
        this.eventData = null;
        this.configPath = path.join(__dirname, '../Config/eventData.json');
    }

    loadEventData() {
        try {
            const data = fs.readFileSync(this.configPath, 'utf8');
            this.eventData = JSON.parse(data);
            console.log('✅ Event data loaded successfully');
        } catch (error) {
            console.error('❌ Failed to load event data:', error);
            throw error;
        }
    }

    getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    getRandomFutureDate() {
        // Generate a date between 1 and 30 days in the future
        const daysInFuture = Math.floor(Math.random() * 30) + 1;
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysInFuture);
        return futureDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    }

    async createRandomEvent() {
        try {
            if (!this.eventData) {
                this.loadEventData();
            }

            const eventData = {
                name: this.getRandomElement(this.eventData.eventNames),
                description: this.getRandomElement(this.eventData.descriptions),
                date: this.getRandomFutureDate(),
                time: this.getRandomElement(this.eventData.eventTimes),
                location: this.getRandomElement(this.eventData.locations),
                org_id: this.eventData.defaultOrgId,
                weekly: Math.random() > 0.7, // 30% chance of being weekly
                equipment_required: null,
                banner_image: this.getRandomElement(this.eventData.bannerImages)
            };

            const result = await eventModel.createEvent(eventData);

            if (result) {
                console.log(`✅ Random event created: "${eventData.name}" on ${eventData.date} at ${eventData.time}`);
            } else {
                console.error('❌ Failed to create random event');
            }
        } catch (error) {
            console.error('❌ Error creating random event:', error);
        }
    }

    start() {
        console.log('🚀 Event scheduler started - creating events every 5 hours');

        // Create an event immediately on startup
        this.createRandomEvent();

        // Schedule event creation every 5 hours (5 * 60 * 60 * 1000 milliseconds)
        const fiveHours = 5 * 60 * 60 * 1000;
        this.intervalId = setInterval(() => {
            this.createRandomEvent();
        }, fiveHours);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            console.log('🛑 Event scheduler stopped');
        }
    }

    // For testing: create event with custom interval (in minutes)
    startWithCustomInterval(minutes) {
        console.log(`🚀 Event scheduler started - creating events every ${minutes} minute(s)`);

        this.createRandomEvent();

        const interval = minutes * 60 * 1000;
        this.intervalId = setInterval(() => {
            this.createRandomEvent();
        }, interval);
    }
}

module.exports = new EventScheduler();
