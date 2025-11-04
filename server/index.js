require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const requestsRouter = require('./routes/requests');
const knowledgeRouter = require('./routes/knowledge');
const timeoutService = require('./services/timeoutService');

const app = express();
app.use(cors()); app.use(express.json());

// Routes
app.use('/api/requests', requestsRouter);
app.use('/api/knowledge', knowledgeRouter);

// Health
app.get('/health', (req, res) => res.json({ status: 'healthy', timeout: timeoutService.getStatus() }));

// Connect to database & Seed
async function start() {
  await connectDB();

  timeoutService.start();

  app.listen(process.env.PORT || 5000, () => console.log('Server running on port 5000'));
}

start();