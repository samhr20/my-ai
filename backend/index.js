// backend/index.js

const express = require('express');
const cors = require('cors'); // For local testing
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();

// --- Vercel will use this configuration ---
app.use(cors()); // It's safe to leave this for Vercel too
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// The serverless function handler
app.post('/api/ask', async (req, res) => {
    try {
        const { question } = req.body;
        if (!question) {
            return res.status(400).json({ error: 'Question is required' });
        }
        const result = await model.generateContent(question);
        const response = await result.response;
        const text = response.text();
        res.json({ answer: text });
    } catch (error) {
        console.error('Error with Google Gemini API:', error);
        res.status(500).json({ error: 'Failed to get response from AI' });
    }
});

// --- THIS PART IS ONLY FOR LOCAL TESTING ---
// Vercel ignores this block
const port = 3000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
        console.log(`Server is running for local testing on http://localhost:${port}`);
    });
}
// --- End of local testing block ---


// --- Vercel uses this to create the serverless function ---
module.exports = app;