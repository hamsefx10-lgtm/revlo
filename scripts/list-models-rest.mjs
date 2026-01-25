
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GOOGLE_API_KEY;

async function listModels() {
    console.log("Listing models via REST...");
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("\nAVAILABLE MODELS:");
            data.models.forEach(m => {
                // Only show models that support generateContent
                if (m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name}`);
                }
            });
        } else {
            console.error("No models found or error:", data);
        }
    } catch (e) {
        console.error("Fetch error:", e.message);
    }
}

listModels();
