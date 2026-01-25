
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        console.log("Analyze Receipt API (REST) called");

        const formData = await req.formData();
        const file = formData.get('image') as File;

        if (!file) {
            return NextResponse.json({ error: 'No image provided' }, { status: 400 });
        }

        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'GOOGLE_API_KEY not configured' }, { status: 500 });
        }

        // Convert file to base64
        const buffer = await file.arrayBuffer();
        const base64Data = Buffer.from(buffer).toString('base64');
        const mimeType = file.type || 'image/jpeg';

        // Define model options to try in order
        // gemini-2.0-flash gave 429 (limit 0). trying gemini-flash-latest
        const models = ['gemini-flash-latest', 'gemini-1.5-flash-latest', 'gemini-pro-vision'];

        // Prompt
        const promptText = `
          Analyze this receipt image deeply. It is a handwritten receipt.
          
          CRITICAL RULES (User Verification):
          1. **Corrections/Cross-outs**: This is the MOST IMPORTANT rule.
             - If a number is crossed out, scribbled over, or has a line through it, it is INVALID. 
             - You MUST find the REPLACEMENT number written near it (often above it).
             - Specific Example: If '59400' or '58400' is crossed out, and '48600' is written above/near it, output '48600'.
          
          2. **Quantities are INTEGERS ONLY**:
             - There are NO fractional quantities (e.g. 1.5, 43.9).
             - If you see "43.9" or "3.49", it is likely a handwriting artifact. Read it as an integer (e.g. "439", "349", "44", or "4").
             - Use the Unit Price and Total to guess the correct Integer Quantity (Total / Price = Qty).
             - Example: If Total is 48600 and Price is 1330, Qty is approx 36 or 37. Use that calculated integer.

          3. **Math Verification**: 
             - Always check: Qty * Unit Price ≈ Total.
             - If they don't match, trust the **Corrected/Written Total** first, then adjustment the Qty or Price to match.

          Extract structured data:
          1. List of Items (name, qty (integer), price, unit).
          2. The detailed total amount (Sum of the valid totals).
          3. The Date (YYYY-MM-DD).
          4. Vendor Name.

          Return ONLY valid JSON:
          {
            "items": [{ "name": "Item", "qty": 1, "price": 0, "unit": "pcs", "total": 0 }],
            "totalAmount": 0,
            "date": "YYYY-MM-DD",
            "vendorName": "Vendor"
          }
        `;

        let successData = null;
        let lastError = '';

        for (const model of models) {
            console.log(`Attempting model: ${model}`);
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                { text: promptText },
                                { inline_data: { mime_type: mimeType, data: base64Data } }
                            ]
                        }]
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) {
                        const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
                        try {
                            successData = JSON.parse(cleanJson);
                            console.log(`Success with ${model}`);
                            break; // Exit loop on success
                        } catch (e) {
                            console.error(`JSON Parse error for ${model}:`, e);
                        }
                    }
                } else {
                    const errText = await response.text();
                    console.error(`Failed ${model}: ${response.status} - ${errText}`);
                    lastError = `${model}: ${response.status}`;
                }
            } catch (e: any) {
                console.error(`Exception for ${model}:`, e);
                lastError = `${model} exception: ${e.message}`;
            }
        }

        if (successData) {
            return NextResponse.json(successData);
        } else {
            return NextResponse.json({
                error: `Failed to analyze with all models. Last Error: ${lastError}`,
                details: "Ensure your API Key has access to Gemini Vision models."
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('General validation error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
