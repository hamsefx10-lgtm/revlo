const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
    const key = "AIzaSyAqOdTmeAet4Ix9BXZ4wBL7Ozl9QUK0k1w";
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("Available Models:", JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error Listing:", error);
    }
}

test();
