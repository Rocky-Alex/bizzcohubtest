import { GET } from '../src/app/api/bch/sales/returns/qc/route';
import { NextRequest } from 'next/server';

async function testApiDirectly() {
    try {
        console.log("--- TESTING API HANDLER DIRECTLY ---");
        
        // Mock a NextRequest
        const req = new NextRequest("http://localhost:3000/api/bch/sales/returns/qc");
        
        // Call the GET handler
        const response = await GET(req);
        const data = await response.json();
        
        console.log("API Success:", data.success);
        console.log("Number of returns found:", data.returns ? data.returns.length : 'N/A');
        
        if (data.returns && data.returns.length > 0) {
            console.log("First Return Sample:", JSON.stringify(data.returns[0], null, 2));
        } else {
            console.log("No returns returned by API.");
        }

    } catch (e) {
        console.error("Test Failed:", e);
    }
}

testApiDirectly();
