import 'dotenv/config';

async function test() {
    try {
        const res = await fetch('http://localhost:3000/api/bch/inventory/qc');
        if (res.ok) {
            const data = await res.json();
            console.log('API Response Success:', data.success);
            if (data.data && data.data.length > 0) {
                console.log('First Item Keys:', Object.keys(data.data[0]));
                console.log('First Item Lot Number:', data.data[0].lot_number);
                console.log('First Item Lot Number (camelCase):', data.data[0].lotNumber);
            } else {
                console.log('No data returned');
            }
        } else {
            console.log('API Error:', res.status);
        }
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

test();
