
async function testFetch() {
    try {
        const response = await fetch('http://localhost:3000/api/projects/accounting/reports/projects?startDate=2026-02-01&endDate=2026-03-02', {
            headers: {
                // Mock cookie if needed, but the route might fail auth. Let's see.
            }
        });
        const text = await response.text();
        console.log("Status:", response.status);
        console.log("Response:", text.substring(0, 500)); // Print just the start to check for 401
    } catch (e) {
        console.error(e);
    }
}
testFetch();
