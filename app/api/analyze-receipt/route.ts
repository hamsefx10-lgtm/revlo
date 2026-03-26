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

        // Define model options to try in order (Added 2.5-flash from user dashboard)
        const models = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];

        // Prompt
        const promptText = `
          Analyze this receipt image deeply. It is a handwritten receipt.
          
          CRITICAL RULES (User Verification):
          1. **Corrections/Cross-outs**: This is the MOST IMPORTANT rule.
             - If a number is crossed out, scribbled over, or has a line through it, it is INVALID. 
             - You MUST find the REPLACEMENT number written near it (often above it).
          
          2. **Quantities are INTEGERS ONLY**:
             - Use the Unit Price and Total to guess the correct Integer Quantity (Total / Price = Qty).

          3. **Math Verification**: 
             - Always check: Qty * Unit Price ≈ Total.
          
          4. **Receipt Number**:
             - Look for any number (e.g. "No. 008").

          Extract structured data and return ONLY valid JSON:
          {
            "items": [{ "name": "Item", "qty": 1, "price": 0, "unit": "pcs", "total": 0 }],
            "totalAmount": 0,
            "date": "YYYY-MM-DD",
            "vendorName": "Vendor",
            "receiptNumber": "008"
          }
        `;

        let successData = null;
        let lastError = '';

        for (const model of models) {
            console.log(`Attempting REST model: ${model}`);
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
                        successData = JSON.parse(cleanJson);
                        console.log(`Success with REST ${model}`);
                        break; // Exit loop on success
                    }
                } else {
                    const errText = await response.text();
                    console.error(`Failed REST ${model}: ${response.status} - ${errText}`);
                    lastError = `${model}: ${response.status} - ${errText.substring(0, 100)}`;
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
                error: `Failed to analyze with all models.`,
                details: lastError
            }, { status: 500 });
        }

    } catch (error: any) {
        console.error('General AI error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
