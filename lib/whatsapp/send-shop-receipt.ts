import prisma from '@/lib/db';
import { whatsappManager, logToFile } from './manager';
import puppeteer from 'puppeteer';
import { format } from 'date-fns';
import fs from 'fs';
import path from 'path';
import { MessageMedia } from 'whatsapp-web.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generateShopReceiptPDF(sale: any, company: any): Promise<Buffer | null> {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    const companyName = (typeof company === 'string' ? company : company?.name) || 'Revlo Shop';
    const logoUrl = company?.logoUrl || '';

    // Detailed payment logic
    const total = Number(sale.total);
    const paid = Number(sale.paidAmount || 0);
    const balance = Math.max(0, total - paid);
    const isFullyPaid = balance <= 0;

    const statusText = isFullyPaid ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'UNPAID');
    const statusColor = isFullyPaid ? '#059669' : (paid > 0 ? '#d97706' : '#dc2626');
    const statusBg = isFullyPaid ? '#ecfdf5' : (paid > 0 ? '#fffbeb' : '#fef2f2');

    const htmlContent = `
      <html>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,700;1,700&display=swap" rel="stylesheet">
          <style>
            :root {
              --brand-primary: #0f172a;
              --brand-accent: #10b981;
              --text-main: #1e293b;
              --text-muted: #64748b;
              --border-color: #f1f5f9;
              --bg-light: #f8fafc;
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Outfit', sans-serif; 
              color: var(--text-main); 
              background: #f1f5f9;
              padding: 40px;
            }
            .page {
              background: white;
              padding: 60px;
              border-radius: 40px;
              box-shadow: 0 40px 100px rgba(0,0,0,0.06);
              position: relative;
              overflow: hidden;
              min-height: 1000px;
            }
            
            /* Header */
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 20px;
              position: relative;
              z-index: 1;
            }
            .brand {
              display: flex;
              align-items: center;
              gap: 15px;
            }
            .logo-box {
              width: 45px; height: 45px;
              background: var(--brand-primary);
              border-radius: 12px;
              display: flex; align-items: center; justify-content: center;
              color: white; font-weight: 800; font-size: 22px;
            }
            .logo-img {
              width: 45px; height: 45px;
              object-fit: cover; border-radius: 12px;
            }
            .company-name {
              font-family: 'Playfair Display', serif;
              font-size: 28px; font-weight: 700; color: var(--brand-primary);
            }

            .status-tag {
              background: #fffbeb;
              color: #b45309;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 10px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1px;
            }

            .main-invoice-header {
              text-align: right;
              margin-bottom: 40px;
            }
            .inv-large-label {
              font-size: 52px;
              font-weight: 900;
              color: var(--brand-primary);
              letter-spacing: -2px;
            }

            /* Info Card */
            .info-card {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 40px;
              padding: 30px;
              background: #f8fafc;
              border-radius: 25px;
            }
            .info-col-label {
              font-size: 10px;
              font-weight: 700;
              text-transform: uppercase;
              color: var(--text-muted);
              letter-spacing: 1px;
              margin-bottom: 5px;
              display: block;
            }
            .info-col-value {
              font-size: 16px;
              font-weight: 800;
              color: var(--brand-primary);
            }
            .info-col-sub {
              font-size: 12px;
              color: var(--text-muted);
              margin-top: 2px;
            }

            /* Table */
            .table-container { margin-bottom: 40px; }
            table { width: 100%; border-collapse: collapse; }
            th { 
              text-align: left; padding: 12px 10px; 
              font-size: 10px; color: var(--text-muted); 
              text-transform: uppercase; letter-spacing: 1px; 
              border-bottom: 1px dashed #e2e8f0;
            }
            td { padding: 20px 10px; border-bottom: 1px dashed #f1f5f9; }
            .item-desc { font-size: 14px; font-weight: 800; color: var(--brand-primary); }
            .qty-cell { text-align: center; font-weight: 600; font-size: 13px; }
            .price-cell { text-align: right; font-weight: 600; font-size: 13px; }
            .total-cell { text-align: right; font-weight: 800; font-size: 14px; color: var(--brand-primary); }
            .sup-currency { font-size: 8px; vertical-align: super; margin-left: 2px; color: var(--text-muted); opacity: 0.7; }

            /* Summary */
            .summary-card {
              position: absolute;
              bottom: 80px;
              right: 80px;
              background: #0f172a;
              width: 380px;
              padding: 35px;
              border-radius: 30px;
              color: white;
              box-shadow: 0 40px 80px rgba(15, 23, 42, 0.3);
            }
            .summary-line { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
            .summary-line.small { font-size: 12px; color: rgba(255,255,255,0.5); }
            .summary-line.divider { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px; margin-top: 15px; }
            .grand-total-label { font-size: 26px; font-weight: 800; }
            .grand-total-value { font-size: 26px; font-weight: 800; }
            .summary-paid { color: #10b981; font-weight: 700; margin-top: 15px; font-size: 12px; }

            /* Footer */
            .footer {
              position: absolute;
              bottom: 40px; left: 60px; right: 60px;
              display: flex; justify-content: space-between; align-items: flex-end;
              padding-top: 20px;
            }
            .footer-info { font-size: 10px; color: var(--text-muted); line-height: 1.5; }
            .footer-msg { font-size: 12px; font-weight: 700; color: var(--brand-primary); margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="page">
            <header class="header">
              <div class="brand">
                <div class="logo-box">R</div>
                <span class="company-name">${companyName}</span>
              </div>
              <div class="status-tag">${statusText}</div>
            </header>

            <div class="main-invoice-header">
              <div class="inv-large-label">#${sale.invoiceNumber}</div>
            </div>

            <div class="info-card">
              <div>
                <span class="info-col-label">Client Information</span>
                <div class="info-col-value">${sale.customer?.name || 'Walk-in Customer'}</div>
                <div class="info-col-sub">${sale.customer?.phone || '+251929475332'}</div>
              </div>
              <div style="text-align: right;">
                <span class="info-col-label">Transaction Details</span>
                <div class="info-col-value">${format(new Date(sale.createdAt || Date.now()), 'MMMM d, yyyy')}</div>
                <div class="info-col-sub">Payment: ${sale.paymentMethod || 'Credit'}</div>
              </div>
            </div>

            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th style="text-align: center;">Qty</th>
                    <th style="text-align: right;">Unit Price</th>
                    <th style="text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${sale.items && sale.items.length > 0 ? sale.items.map((item: any) => `
                    <tr>
                      <td class="item-desc">${item.productName || 'General Item'}</td>
                      <td class="qty-cell">${item.quantity || 1}</td>
                      <td class="price-cell">${Number(item.unitPrice || 0).toLocaleString()}<span class="sup-currency">ETB</span></td>
                      <td class="total-cell">${(Number(item.quantity || 1) * Number(item.unitPrice || 0)).toLocaleString()}<span class="sup-currency">ETB</span></td>
                    </tr>
                  `).join('') : `<tr><td colspan="4" style="text-align: center; padding: 40px;">No items listed</td></tr>`}
                </tbody>
              </table>
            </div>

            <div class="summary-card">
              <div class="summary-line small">
                <span>Subtotal Amount</span>
                <span>${Number(sale.subtotal || sale.total).toLocaleString()} ETB</span>
              </div>
              <div class="summary-line divider">
                <span class="grand-total-label">Grand Total</span>
                <span class="grand-total-value">${total.toLocaleString()} ETB</span>
              </div>
              <div class="summary-line summary-paid">
                <span>Amount Received</span>
                <span>${paid.toLocaleString()} ETB</span>
              </div>
            </div>

            <footer class="footer">
              <div class="footer-left">
                <div class="footer-info">
                  Generated via Revlo Premium<br>
                  System Ref: ${sale.id.substring(sale.id.length - 12).toUpperCase()}
                </div>
                <div class="footer-msg">Thank you for your business!</div>
              </div>
              <div class="footer-right">
                <div style="font-size: 8px; text-transform: uppercase; color: #94a3b8; font-weight: 800; letter-spacing: 1px;">Authorized Signature</div>
              </div>
            </footer>
          </div>
        </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    });

    return Buffer.from(pdfBuffer);
  } catch (error) {
    logToFile(`[WhatsApp ERROR] Failed to generate PDF: ${error} `);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}



/**
 * Uses Gemini AI to generate a professional, context-aware Somali message for the customer.
 */
async function generateAISomaliMessage(sale: any, companyName: string, type: 'SALE' | 'PAYMENT', paymentAmount?: number): Promise<string> {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("Missing GOOGLE_API_KEY in environment");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Standard model name for best compatibility
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const customerName = sale.customer?.name || 'Macaamiil';
    const total = Number(sale.total);
    const paidSoFar = Number(sale.paidAmount || 0);
    const balance = Math.max(0, total - paidSoFar);
    const isPaid = balance <= 0;

    const prompt = `
      You are a premium AI assistant for "${companyName}". 
      Generate a professional, warm Somali WhatsApp message for a customer named "${customerName}".
      
      Transaction Details:
    - Action: ${type === 'SALE' ? 'New Sale/Invoice' : 'Payment Received'}
    - Invoice: #${sale.invoiceNumber}
    - Grand Total: ${total.toLocaleString()} ETB
      ${type === 'PAYMENT' ? `- Just Paid Now: ${Number(paymentAmount).toLocaleString()} ETB` : `- Paid Amount: ${paidSoFar.toLocaleString()} ETB`}
    - Total Paid So Far: ${paidSoFar.toLocaleString()} ETB
      - Remaining Balance: ${balance.toLocaleString()} ETB
        - Status: ${isPaid ? 'Fully Paid (Shubay)' : 'Partial Payment (Baqi)'}

    Rules:
    1. Use modern, beautiful Somali(Af - Soomaali suuban).
      2. Mention the specific amount paid and the remaining balance very clearly.
      3. If it is a partial payment, encourage them and mention the balance.
      4. If it is fully paid, congratulate them and thank them warmly.
      5. Mention that their professional PDF receipt is attached below.
      6. Include a warm closing from "${companyName}".
      7. Return ONLY the message.No English, no explanations.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    logToFile(`[WhatsApp AI ERROR] Failed to generate message: ${error}`);
    const customerName = sale.customer?.name || 'Macaamiil';
    const total = Number(sale.total);
    const paidSoFar = Number(sale.paidAmount || 0);
    const balance = Math.max(0, total - paidSoFar);

    const finalFallback = type === 'SALE'
      ? `Salaamu Calaykum *${customerName}*.\n\nWaxaan halkaan kuugu soo lifaaqnay rasiidka rasmiga ah ee shirkadda *${companyName}*.\n\n*Invoice:* #${sale.invoiceNumber}\n*Wadarta:* ${total.toLocaleString()} ETB\n*Lacagta:* ${paidSoFar.toLocaleString()} ETB\n*Haraaga:* ${balance.toLocaleString()} ETB\n\nWaad ku mahadsan tahay.`
      : `Salaamu Calaykum *${customerName}*.\n\nWaad ku mahadsan tahay lacag bixintaada shirkadda *${companyName}*.\n\n*Rasiidka:* #${sale.invoiceNumber}\n*Lacag bixinta hadda:* ${Number(paymentAmount).toLocaleString()} ETB\n*Haraaga cusub:* ${balance.toLocaleString()} ETB\n\nWaad ku mahadsan tahay.`;
    return finalFallback;
  }
}

export async function sendShopReceiptViaWhatsApp(
  companyId: string,
  companyName: string,
  vendorPhone: string | null | undefined,
  sale: any,
  type: 'SALE' | 'PAYMENT' = 'SALE',
  paymentAmount?: number
) {
  if (!vendorPhone) {
    logToFile(`[WhatsApp] No customer phone provided, skipping.`);
    return false;
  }

  try {
    const company = await (prisma as any).company.findUnique({
      where: { id: companyId },
      include: { personalizationSettings: true }
    });

    if (company?.whatsappSessionStatus !== 'CONNECTED') return false;

    let session = await whatsappManager.getSession(companyId);

    if (session.status === 'CONNECTING') {
      for (let i = 0; i < 15; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        session = await whatsappManager.getSession(companyId);
        if (session.status === 'CONNECTED') break;
      }
    }

    if (session.status !== 'CONNECTED' || !session.client) return false;

    let formattedPhone = vendorPhone.replace(/[^\d]/g, ''); // Strictly only digits
    if (formattedPhone.startsWith('0')) formattedPhone = '251' + formattedPhone.substring(1);
    const jid = formattedPhone.endsWith('@c.us') ? formattedPhone : `${formattedPhone}@c.us`;
    logToFile(`[WhatsApp] Final target JID: ${jid}`);

    const baseUrl = process.env.NEXTAUTH_URL || 'https://revlo.me';
    const receiptLink = `${baseUrl}/receipt/shop/${sale.id}`;
    const downloadLink = `${baseUrl}/api/public/shop/receipt/${sale.id}`;

    // 1. Generate Premium PDF
    logToFile(`[WhatsApp] Generating Premium PDF for ${sale.invoiceNumber}...`);
    const pdfBuffer = await generateShopReceiptPDF(sale, sale.company);
    let media: MessageMedia | null = null;
    let tempFilePath: string | null = null;

    if (pdfBuffer) {
      const magicNumber = pdfBuffer.slice(0, 5).toString();
      logToFile(`[WhatsApp] PDF Buffer ready: ${pdfBuffer.length} bytes, Magic: ${magicNumber} `);

      try {
        const tempDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
        tempFilePath = path.join(tempDir, `Receipt_${sale.invoiceNumber}_${Date.now()}.pdf`);
        fs.writeFileSync(tempFilePath, pdfBuffer);

        // Use fromFilePath - internally more robust for many wwebjs versions
        media = MessageMedia.fromFilePath(tempFilePath);
        media.mimetype = 'application/pdf'; // Explicitly set mimetype for reliability

        logToFile(`[WhatsApp] Media object created from file: ${tempFilePath} `);
      } catch (mediaErr: any) {
        logToFile(`[WhatsApp ERROR] Failed to create media: ${mediaErr?.message || mediaErr} `);
      }
    }

    // 2. Generate Message (Fixed Template as requested by user)
    const total = Number(sale.total);
    const paidSoFar = Number(sale.paidAmount || 0);
    const balance = Math.max(0, total - paidSoFar);
    const customerName = (sale.customer?.name || 'Macaamiil').replace(/[^\w\s]/gi, ''); // Clean name

    // Sanitize string to avoid weird Unicode characters from toLocaleString in some environments
    const fmtTotal = total.toLocaleString().replace(/[^\d\.,]/g, '');
    const fmtPaid = paidSoFar.toLocaleString().replace(/[^\d\.,]/g, '');
    const fmtBalance = balance.toLocaleString().replace(/[^\d\.,]/g, '');

    let fixedMessage = type === 'SALE'
      ? `Salaamu Calaykum *${customerName}*.\n\nKu soo dhawaada *${companyName}*.\n\n*Faahfaahinta Lacagta:*\n- Wadarta Guud: ${fmtTotal} ETB\n- Lacagta: ${fmtPaid} ETB\n- Haraaga: ${fmtBalance} ETB\n\n*Link-ka:* ${receiptLink}\n*PDF:* ${downloadLink}\n\nMahadsanid.`
      : `Salaamu Calaykum *${customerName}*.\n\nWaad ku mahadsan tahay lacag bixintaada *${companyName}*.\n\n*Faahfaahinta Lacagta:*\n- Lacagta aad bixisay: ${Number(paymentAmount).toLocaleString()} ETB\n- Haraagaaga cusub: ${fmtBalance} ETB\n\n*Link-ka Rasiidka:* ${receiptLink}\n*PDF:* ${downloadLink}\n\nMahadsanid.`;

    // Explicitly clean message of any potential non-printable characters
    fixedMessage = fixedMessage.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, "");
    logToFile(`[WhatsApp] Message length: ${fixedMessage.length}`);

    const captionLimit = 1000;
    let finalMessage = fixedMessage;
    if (finalMessage.length > captionLimit) {
      finalMessage = finalMessage.substring(0, captionLimit - 20) + '... (cont.)';
    }

    // 3. Send
    try {
      // Get the chat object first
      logToFile(`[WhatsApp] Getting chat for ${jid}...`);
      const chat = await session.client.getChatById(jid);

      if (media && media.data) {
        logToFile(`[WhatsApp] Sending PDF as document to ${jid} `);

        // Final sanity check for media
        if (!media.data || media.data.length < 100) {
          throw new Error("Media data corrupted or too short");
        }

        // Wait slightly more to ensure the chat is fully loaded in the browser
        await new Promise(resolve => setTimeout(resolve, 6000));

        // Use the most compatible send options for 1.34.6
        // Some versions prefer sending media WITHOUT a caption if it's a document to avoid "Invalid value"
        await chat.sendMessage(media, {
          sendMediaAsDocument: true,
          caption: finalMessage
        });

        logToFile(`[WhatsApp] Premium PDF sent successfully to ${jid} `);
      } else {
        logToFile(`[WhatsApp] No media, sending text - only fariin.`);
        await chat.sendMessage(finalMessage);
      }
    } catch (sendError: any) {
      logToFile(`[WhatsApp Warning] Primary send failed: ${sendError?.message || sendError} `);

      // Fallback: Send text THEN media separately
      logToFile(`[WhatsApp] Falling back to split delivery for ${jid}...`);
      try {
        const chat = await session.client.getChatById(jid);

        // 1. Send the text first
        await chat.sendMessage(finalMessage);
        logToFile(`[WhatsApp] Fallback text sent.`);

        if (media && media.data) {
          await new Promise(resolve => setTimeout(resolve, 4000));
          // Use sendMessage on chat object directly if possible, or through client with jid
          await session.client.sendMessage(jid, media, { sendMediaAsDocument: true });
          logToFile(`[WhatsApp] Fallback media sent separately.`);
        }
      } catch (innerErr: any) {
        logToFile(`[WhatsApp Fallback ERROR] ${innerErr?.message || innerErr} `);
        throw innerErr;
      }
    }
    finally {
      // Clean up temp file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try { fs.unlinkSync(tempFilePath); } catch (e) { }
      }
    }

    logToFile(`[WhatsApp] Premium receipt workflow completed for ${sale.invoiceNumber}`);
    return true;
  } catch (error: any) {
    logToFile(`[WhatsApp FATAL] sendShopReceiptViaWhatsApp failed: ${error?.message || error} `);
    return false;
  }
}
