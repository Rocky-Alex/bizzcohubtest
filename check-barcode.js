const http = require('http');

const barcode = 'BCH-1018';
const url = `http://localhost:3000/api/admin/inventory/barcode?barcode=${barcode}`;

console.log(`Checking barcode: ${barcode}`);

http.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        try {
            const json = JSON.parse(data);
            console.log('Response:', JSON.stringify(json, null, 2));
        } catch (e) {
            console.log('Raw body:', data);
        }
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
