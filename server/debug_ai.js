const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdfParse = require('pdf-parse');

console.log('--- PDF Parse Debug ---');
console.log('Type of pdfParse:', typeof pdfParse);
console.log('Is pdfParse a function?', typeof pdfParse === 'function');
if (typeof pdfParse === 'object') {
    console.log('Keys:', Object.keys(pdfParse));
    if (pdfParse.default) {
        console.log('Type of pdfParse.default:', typeof pdfParse.default);
    }
}

console.log('\n--- Gemini Models Debug ---');
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || 'AIzaSyAsV_u8GHZq2AwEyU0Fo5_vYnjEL6haK1w');

async function listModels() {
    try {
        // Access the model directly to check if it exists
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        console.log('Successfully got model instance');

        const result = await model.generateContent('Hello');
        console.log('Generate content success:', result.response.text());
    } catch (error) {
        console.error('Error:', error.message);
    }
}

listModels();
