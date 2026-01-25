
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GOOGLE_API_KEY;

async function testRest() {
    if (!API_KEY) {
        console.error("No API Key");
        return;
    }

    const models = ['gemini-2.0-flash'];

    for (const model of models) {
        console.log(`\nTesting REST API for: ${model}...`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: "Hello, reply in one word." }]
                    }]
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`SUCCESS [${model}]:`, data?.candidates?.[0]?.content?.parts?.[0]?.text);
                return; // Stop after first success
            } else {
                console.error(`FAILED [${model}]:`, response.status, response.statusText);
                const errText = await response.text();
                console.error("Error details:", errText);
            }
        } catch (e) {
            console.error(`EXCEPTION [${model}]:`, e.message);
        }
    }
}

testRest();
