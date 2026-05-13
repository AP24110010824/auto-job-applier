require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');
const { runScraper, stopScraper } = require('./scraper');
const { sendEmail } = require('./mailer');
const Application = require('./models/Application');

const app = express();
const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/linkedin_bot';

// Connect to MongoDB
mongoose.connect(mongoUri)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

app.use(cors());
app.use(express.json());

// Set up multer for storing uploaded resumes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Basic route
app.get('/', (req, res) => {
  res.send('LinkedIn Automation API is running');
});

// Endpoint to start the automation
app.post('/api/start', upload.single('resume'), async (req, res) => {
  try {
    const { linkedinUser, linkedinPass, gmailUser, gmailPass, keywords, template } = req.body;
    
    // Resume path if uploaded
    const resumePath = req.file ? req.file.path : null;

    if (!linkedinUser || !linkedinPass || !gmailUser || !gmailPass || !keywords) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // In a real scenario, this would be a background task or job queue (like BullMQ)
    // because it takes a long time. For this assignment, we'll start it asynchronously.
    
    // We send a response immediately that the bot started
    res.json({ message: 'Automation bot started successfully' });

    console.log("Starting scraping process...");
    
    // Run the scraper
    const extractedJobs = await runScraper(linkedinUser, linkedinPass, keywords);
    
    console.log(`Found ${extractedJobs.length} potential emails.`);
    
    // Loop through the found jobs and send emails
    for (const job of extractedJobs) {
       console.log(`Checking if we already emailed ${job.email}...`);
       try {
           const existingApp = await Application.findOne({ email: job.email });
           if (existingApp) {
               console.log(`Skipping ${job.email} - already applied on ${existingApp.dateApplied}`);
               continue;
           }

           console.log(`Sending email to ${job.email}...`);
           await sendEmail(gmailUser, gmailPass, job.email, template, resumePath);
           
           // Save to database
           const newApp = new Application({ email: job.email, jobSnippet: job.textSnippet });
           await newApp.save();
           
           console.log(`Successfully sent email and saved ${job.email} to DB`);
       } catch (err) {
           console.error(`Failed to process ${job.email}:`, err);
       }
    }
    
    console.log("Automation process completed.");

  } catch (error) {
    console.error("Error in /api/start:", error);
  }
});

app.post('/api/stop', async (req, res) => {
  const stopped = await stopScraper();
  if (stopped) {
      res.json({ message: 'Automation bot stopped successfully.' });
  } else {
      res.status(400).json({ message: 'Bot is not currently running.' });
  }
});

// Create uploads dir if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
