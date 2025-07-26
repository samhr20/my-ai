const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const multer = require('multer');
const cors = require('cors');

const app = express();

// Use CORS for local development and to allow cross-origin requests
app.use(cors());

// Multer setup for handling file uploads in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// This model is specifically for multimodal (text and image) inputs
const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

// Helper function to convert buffer to a Gemini-compatible part
function fileToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType
    },
  };
}

// The API endpoint is now configured to handle multipart/form-data
app.post('/api/ask', upload.single('image'), async (req, res) => {
    try {
        const question = req.body.question || "What do you see in the image?";
        const imageFile = req.file;

        if (!question && !imageFile) {
            return res.status(400).json({ error: 'A question or an image is required.' });
        }

        const prompt = question;
        const imageParts = imageFile ? [fileToGenerativePart(imageFile.buffer, imageFile.mimetype)] : [];

        // Generate content with both text and image if available
        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        const text = response.text();
        
        res.json({ answer: text });

    } catch (error) {
        console.error('Error with Google Gemini API:', error);
        res.status(500).json({ error: 'Failed to get response from AI' });
    }
});

// Vercel exports the app instance
module.exports = app;