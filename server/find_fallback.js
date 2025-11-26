const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || 'AIzaSyAsV_u8GHZq2AwEyU0Fo5_vYnjEL6haK1w');

async function listModels() {
    try {
        console.log('Fetching available models...');
        // We can't list models via the SDK easily in this version without a helper, 
        // but we can try to generate content with a few known candidates to see which one works.

        const candidates = [
            'gemini-1.5-flash',
            'gemini-1.5-flash-001',
            'gemini-1.5-flash-002',
            'gemini-1.5-pro',
            'gemini-1.5-pro-001',
            'gemini-1.5-pro-002',
            'gemini-1.0-pro',
            'gemini-pro'
        ];

        for (const modelName of candidates) {
            process.stdout.write(`Testing ${modelName}... `);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent('Hello');
                console.log('✅ SUCCESS');
            } catch (error) {
                console.log(`❌ FAILED: ${error.message.split('\n')[0]}`);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

listModels();
