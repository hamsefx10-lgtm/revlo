const fs = require('fs');

async function testScan() {
    try {
        // Create a dummy image file
        const dummyImage = Buffer.from('R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=', 'base64');
        const blob = new Blob([dummyImage], { type: 'image/gif' });
        const formData = new FormData();
        formData.append('image', blob, 'test.gif');

        const response = await fetch('http://localhost:3000/api/analyze-receipt', {
            method: 'POST',
            body: formData,
            headers: {
                // Do not set Content-Type, it will be set automatically with boundary
            }
        });

        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

testScan();
