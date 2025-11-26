const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdfParse = require('pdf-parse');

console.log('--- PDF Parse Debug ---');
try {
    const lib = require('pdf-parse/lib/pdf-parse.js');
    console.log('require("pdf-parse/lib/pdf-parse.js") type:', typeof lib);
} catch (e) {
    console.log('Could not require lib/pdf-parse.js');
}

console.log('\n--- Gemini Models Debug ---');
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || 'AIzaSyAsV_u8GHZq2AwEyU0Fo5_vYnjEL6haK1w');

async function testModel(modelName) {
    console.log(`Testing model: ${modelName}`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Hello');
        console.log(`SUCCESS: ${modelName}`);
    } catch (error) {
        console.log(`FAILED: ${modelName} - ${error.message.split('\n')[0]}`);
    }
}

async function run() {
    await testModel('gemini-1.5-flash');
    await testModel('gemini-1.5-flash-latest');
    await testModel('gemini-1.5-pro');
    await testModel('gemini-pro');
    await testModel('gemini-1.0-pro');
}

run();
