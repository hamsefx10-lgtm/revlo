import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        console.log("[Receipt AI] Scan request received");

        // --- AUTH (require to avoid compile issues) ---
        let companyId = '';
        let userId = '';
        try {
            const { getServerSession } = require('next-auth/next');
            const { authOptions } = require('@/lib/auth');
            const session = await getServerSession(authOptions);
            companyId = (session as any)?.user?.companyId || '';
            userId = (session as any)?.user?.id || '';
        } catch { }

        const prisma = require('@/lib/prisma').default;

        // --- CREDIT CHECK ---
        if (companyId) {
            try {
                const result: any[] = await prisma.$queryRawUnsafe(
                    `SELECT "scanCredits", "scanPlan" FROM "companies" WHERE "_id" = $1`, companyId
                );
                const credits = result?.[0]?.scanCredits ?? 10;
                const currentPlan = result?.[0]?.scanPlan || 'FREE_TRIAL';
                if (credits <= 0) {
                    return NextResponse.json({
                        error: 'NO_CREDITS',
                        message: 'Scan credits dhammaadeen. Fadlan upgrade samee.',
                        creditsRemaining: 0, plan: currentPlan
                    }, { status: 403 });
                }
                console.log(`[Receipt AI] Credits OK: ${credits} remaining`);
            } catch { }
        }

        // --- FILE ---
        const formData = await req.formData();
        const file = formData.get('image') as File;
        if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 });

        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) return NextResponse.json({ error: 'GOOGLE_API_KEY not configured' }, { status: 500 });

        const buffer = await file.arrayBuffer();
        const base64Data = Buffer.from(buffer).toString('base64');
        const mimeType = file.type || 'image/jpeg';

        const promptText = `You are an expert receipt/invoice OCR system. Analyze this receipt image carefully.

RULES:
1. If a number is crossed out, find the REPLACEMENT number written nearby.
2. Quantities must be INTEGERS: Use Unit Price and Total to calculate correct Qty.
3. Math Verification: Always verify Qty × Unit Price ≈ Total for each line item.
4. Receipt Number: Look for any reference number.
5. Handle both handwritten AND printed receipts.
6. Currency: Assume ETB unless clearly stated otherwise.
7. Missing fields: Use null instead of guessing.

Return ONLY this JSON:
{
  "items": [{ "name": "Item name", "qty": 1, "price": 0.00, "unit": "pcs", "total": 0.00 }],
  "totalAmount": 0.00,
  "date": "YYYY-MM-DD",
  "vendorName": "Vendor name or null",
  "receiptNumber": "Receipt number or null"
}`;

        // --- GEMINI API (primary + fallbacks with retry) ---
        const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash-lite'];
        let successData = null;
        let lastError = '';
        let successModel = '';

        for (const model of models) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            console.log(`[Receipt AI] Trying: ${model}`);

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [
                            { text: promptText },
                            { inline_data: { mime_type: mimeType, data: base64Data } }
                        ]}],
                        generationConfig: {
                            temperature: 0.1, topK: 32, topP: 0.95,
                            maxOutputTokens: 4096,
                            responseMimeType: "application/json"
                        }
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) {
                        try {
                            successData = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
                            successModel = model;
                            console.log(`[Receipt AI] ✅ ${model} — ${successData.items?.length || 0} items`);
                            break; // Success — stop trying
                        } catch {
                            lastError = `${model}: JSON parse error`;
                        }
                    }
                } else if (response.status === 429) {
                    console.log(`[Receipt AI] ⏳ ${model} rate limited (429), waiting 2s...`);
                    lastError = `${model}: Rate limited (429)`;
                    await new Promise(r => setTimeout(r, 2000)); // Wait 2s before trying next model
                    continue;
                } else {
                    const errText = await response.text();
                    console.error(`[Receipt AI] ❌ ${model}: ${response.status}`);
                    lastError = `${model}: ${response.status} - ${errText.substring(0, 100)}`;
                    continue; // Try next model
                }
            } catch (e: any) {
                console.error(`[Receipt AI] ❌ ${model}:`, e.message);
                lastError = `${model}: ${e.message}`;
                continue; // Try next model
            }
        }

        // --- LOG & DEDUCT ---
        if (companyId) {
            try {
                await prisma.$queryRawUnsafe(
                    `INSERT INTO "scan_logs" ("_id","companyId","userId","itemsFound","success","errorMsg","createdAt") VALUES (gen_random_uuid(),$1,$2,$3,$4,$5,NOW())`,
                    companyId, userId || 'unknown', successData?.items?.length || 0, !!successData,
                    successData ? null : (lastError || '').substring(0, 200)
                );
                if (successData) {
                    await prisma.$queryRawUnsafe(
                        `UPDATE "companies" SET "scanCredits"=GREATEST("scanCredits"-1,0), "scanCreditsUsed"="scanCreditsUsed"+1 WHERE "_id"=$1`,
                        companyId
                    );
                }
            } catch (e) { console.error("[Receipt AI] DB:", e); }
        }

        // --- RESPONSE ---
        if (successData) {
            let cr = null;
            try {
                const r: any[] = await prisma.$queryRawUnsafe(`SELECT "scanCredits" FROM "companies" WHERE "_id"=$1`, companyId);
                cr = r?.[0]?.scanCredits;
            } catch {}
            return NextResponse.json({ ...successData, _meta: { creditsRemaining: cr, model: successModel } });
        }

        const isRateLimited = lastError.includes('429') || lastError.includes('Rate limited');
        if (isRateLimited) {
            return NextResponse.json({
                error: 'RATE_LIMITED',
                message: 'AI busy — 30 ilbiriqsi sug oo mar kale isku day.',
                details: lastError
            }, { status: 429 });
        }
        return NextResponse.json({
            error: 'SCAN_FAILED',
            message: 'Rasiidka lama akhrin karin. Sawirka cad noqo.',
            details: lastError
        }, { status: 500 });

    } catch (error: any) {
        console.error('[Receipt AI] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
