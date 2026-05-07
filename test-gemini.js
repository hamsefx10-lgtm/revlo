const { GoogleGenerativeAI } = require("@google/generative-ai");

async function test() {
    const genAI = new GoogleGenerativeAI("AIzaSyAqOdTmeAet4Ix9BXZ4wBL7Ozl9QUK0k1w");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    try {
        const result = await model.generateContent("Hello, are you working?");
        const response = await result.response;
        console.log("Success:", response.text());
    } catch (error) {
        console.error("Error Detail:", error);
    }
}

test();
