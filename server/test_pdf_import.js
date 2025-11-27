
const fs = require('fs');

async function testPdfParse() {
    console.log('Testing pdf-parse import...');
    try {
        const pdfParseModule = require('pdf-parse');
        console.log('Module:', pdfParseModule);

        // Check if it's a function
        if (typeof pdfParseModule === 'function') {
            console.log('Module is a function!');
        } else {
            console.log('Module is NOT a function.');
            // Check if default is a function
            if (pdfParseModule.default && typeof pdfParseModule.default === 'function') {
                console.log('Module.default is a function!');
            }
        }
    } catch (e) {
        console.error('Import failed:', e);
    }
}

testPdfParse();
