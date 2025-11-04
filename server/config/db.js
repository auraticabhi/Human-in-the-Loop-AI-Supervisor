const mongoose = require('mongoose');
const Knowledge = require('../models/Knowledge');

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('DB connected');
        
        // Call the seeding function after connection is successful
        await seedInitialData();

    } catch (error) {
        console.error('DB connection failed:', error.message);
        process.exit(1); 
    }
}

async function seedInitialData() {
    // Check if initial data already exists
    if ((await Knowledge.countDocuments({ source: 'initial' })) === 0) {
        console.log('Seeding initial knowledge base...');
        const Knowledge = mongoose.model('Knowledge'); 
        
        await Knowledge.insertMany([
            { question: "Business hours?", answer: "Mon-Sat 9AM-7PM, Sun 10AM-5PM", category: 'hours', normalizedQuestion: Knowledge.normalizeQuestion("Business hours?"), source: 'initial' },
            { question: "Haircuts?", answer: "$25+ for basic", category: 'services', normalizedQuestion: Knowledge.normalizeQuestion("Haircuts?"), source: 'initial' },
        ]);
        console.log('KB seeded successfully');
    } else {
        console.log('KB already seeded. Skipping.');
    }
}

module.exports = connectDB;