
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error("No API KEY");
        return;
    }

    // For listing models, we might need to use the lower level API or just try to generate with a known stable model like gemini-pro
    console.log("Testing with 'gemini-pro' (stable)...");

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello");
        console.log("SUCCESS: 'gemini-pro' is working.");
        console.log("Response:", result.response.text());
    } catch (error) {
        console.error("FAIL: 'gemini-pro' failed.");
        console.error(error.message);
    }

    console.log("\nTesting with 'gemini-1.5-flash'...");
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("Hello");
        console.log("SUCCESS: 'gemini-1.5-flash' is working.");
        console.log("Response:", result.response.text());
    } catch (error) {
        console.error("FAIL: 'gemini-1.5-flash' failed.");
        console.error(error.message);
    }
}

listModels();
