import axios from 'axios';

const url = 'https://res.cloudinary.com/dmc4238do/image/upload/v1764100201/classuploads/1764100201649-Comp%201.pdf';

async function testFetch() {
    try {
        console.log(`Fetching ${url}...`);
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream'
        });

        console.log('Status:', response.status);
        console.log('Headers:', response.headers);

        // Consume stream to ensure it works
        response.data.on('data', (chunk: any) => {
            // console.log(`Received ${chunk.length} bytes`);
        });

        response.data.on('end', () => {
            console.log('Stream finished successfully');
        });

        response.data.on('error', (err: any) => {
            console.error('Stream error:', err);
        });

    } catch (error: any) {
        console.error('Fetch error:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
        }
    }
}

testFetch();
