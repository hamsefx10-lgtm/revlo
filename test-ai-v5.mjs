import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GOOGLE_API_KEY;
const model = 'gemini-2.5-flash';
const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

async function testScan() {
    try {
        console.log(`Testing REST with ${model} on ${url.replace(apiKey, 'REDACTED')}...`);
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: "Describe this image." },
                        { inline_data: { mime_type: "image/png", data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" } }
                    ]
                }]
            })
        });

        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Response:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

testScan();
