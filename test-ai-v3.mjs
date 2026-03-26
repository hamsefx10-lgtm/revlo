import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GOOGLE_API_KEY;
console.log('Using Key:', apiKey?.substring(0, 10) + '...');

if (!apiKey) {
    console.error('Error: GOOGLE_API_KEY not found in .env');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function test() {
  const models = ['gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-2.0-flash-exp'];
  
  for (const m of models) {
    try {
      console.log(`Testing model: ${m}...`);
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent("Say 'Revlo AI is ready'");
      const response = await result.response;
      console.log(`Success with ${m}:`, response.text());
    } catch (e) {
      console.error(`Failed ${m}:`, e.message);
    }
  }
}

test();
