import { queryAll } from '../src/db/postgres';

async function check() {
    try {
        const colleges = await queryAll('SELECT * FROM colleges');
        console.log(`Found ${colleges.length} colleges.`);
        if (colleges.length > 0) {
            console.log('First 3:', colleges.slice(0, 3));
        }
    } catch (error) {
        console.error('Error checking colleges:', error);
    }
}

check();
