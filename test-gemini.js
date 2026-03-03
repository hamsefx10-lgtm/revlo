require('dotenv').config({ path: '.env.local' });

async function testGenerate() {
    const key = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY;
    if (!key) {
        console.error("No API key");
        return;
    }

    const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp', 'gemini-2.5-flash'];

    for (const model of models) {
        console.log(`Testing ${model}...`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: "Hello" }]
                    }]
                })
            });
            const text = await res.text();
            console.log(`Response ${res.status}:`, text);
        } catch (e) {
            console.error(e);
        }
    }
}

testGenerate();
