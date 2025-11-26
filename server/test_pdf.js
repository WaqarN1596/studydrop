const pdfParse = require('pdf-parse');
const fs = require('fs');

async function testPDF() {
    try {
        const dataBuffer = fs.readFileSync('/Users/trash/Desktop/exam2 comp1 (2).pdf');
        console.log('PDF file size:', dataBuffer.length);
        
        // pdf-parse default export is the function
        const data = await pdfParse.default(dataBuffer);
        console.log('PDF text extracted successfully!');
        console.log('Number of pages:', data.numpages);
        console.log('First 500 characters:');
        console.log(data.text.slice(0, 500));
    } catch (error) {
        console.error('Error:', error);
    }
}

testPDF();
