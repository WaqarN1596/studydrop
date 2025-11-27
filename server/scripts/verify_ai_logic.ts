import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const runTest = async () => {
    try {
        console.log('Testing AI Logic (Isolated)...');
        console.log('API Key present:', !!process.env.GOOGLE_AI_API_KEY);

        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

        // Mock Data
        const upload = {
            title: "Test Document",
            original_filename: "test.txt",
            mime_type: "text/plain"
        };
        const fileBuffer = Buffer.from("This is a test document about Artificial Intelligence. AI is a field of computer science.");
        const message = "What is this document about?";
        const messages: any[] = [];

        // Prepare history for Gemini
        const chatHistory = messages.map((msg: any) => ({
            role: msg.role === 'ai' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        // Construct the current prompt with the file
        const promptParts: any[] = [
            { text: `You are a helpful AI study assistant. You are analyzing the document "${upload.title || upload.original_filename}". Answer the user's question based on the document content.` },
            {
                inlineData: {
                    data: fileBuffer.toString('base64'),
                    mimeType: upload.mime_type
                }
            }
        ];

        if (chatHistory.length > 0) {
            promptParts.push({ text: "\n\nChat History:\n" + chatHistory.map((m: any) => `${m.role}: ${m.parts[0].text}`).join("\n") });
        }

        promptParts.push({ text: `\n\nUser Question: ${message}` });

        console.log('Sending request to Gemini...');
        const result = await model.generateContent(promptParts);
        const responseText = result.response.text();

        console.log('AI Response:', responseText);
        console.log('✅ AI Logic Verified');

    } catch (error: any) {
        console.error('Test Failed:', error.message);
        if (error.response) {
            console.error('Error Details:', error.response);
        }
    }
};

runTest();
