

async function testSubmit() {
    const payload = {
        lotId: 1,
        purchaseLotItemId: 1,
        sku: 'TEST-SKU-AUTO-' + Date.now(),
        productName: 'Test Laptop',
        brand: 'Dell',
        model: 'XPS 13',
        processor: 'i7',
        ram: '16GB',
        storage: '512GB',
        graphics: 'Integrated',
        screen_size: '13.3',
        keyboard_type: 'US',
        keyboard_backlit: 'Yes',
        condition_status: 'Grade A',
        notes: 'Automated test submission'
    };

    console.log('Submitting payload:', payload);

    try {
        const response = await fetch('http://localhost:3000/api/admin/inventory/qc', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const status = response.status;
        const text = await response.text();

        console.log(`Status: ${status}`);
        console.log('Response:', text);

    } catch (err) {
        console.error('Fetch failed:', err);
    }
}

testSubmit();
