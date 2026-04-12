const { PrismaClient } = require("@prisma/client");
const { google } = require("googleapis");
const fs = require("fs");

const prisma = new PrismaClient();

async function run() {
  const settingsList = await prisma.personalizationSettings.findMany();
  for (const setting of settingsList) {
    if (setting.enabledFeatures && typeof setting.enabledFeatures === "object") {
      const features = setting.enabledFeatures;
      if (features.googleClientEmail && features.googlePrivateKey) {
        console.log("Found Service Account:", features.googleClientEmail);
        console.log("Folder ID:", features.driveFolderId);
        
        let finalPrivateKey = features.googlePrivateKey;
        let clientEmail = features.googleClientEmail;
        
        if (finalPrivateKey.trim().startsWith('{')) {
             try {
                 const p = JSON.parse(finalPrivateKey);
                 finalPrivateKey = p.private_key || finalPrivateKey;
                 clientEmail = p.client_email || clientEmail;
                 console.log("Parsed JSON key successfully!");
             } catch(e) {
                 console.error("Failed to parse JSON", e.message);
             }
        }
        
        try {
            const auth = new google.auth.GoogleAuth({
              credentials: {
                client_email: clientEmail,
                private_key: finalPrivateKey.replace(/\\n/g, "\n")
              },
              scopes: ["https://www.googleapis.com/auth/drive"]
            });
            const drive = google.drive({ version: "v3", auth });
            console.log("Testing drive auth by listing files...");
            const res = await drive.files.list({
              q: `'${features.driveFolderId}' in parents`,
              fields: "files(id, name, webViewLink, owners)"
            });
            console.log("FILES IN DRIVE:", JSON.stringify(res.data.files, null, 2));
            return;
        } catch(e) {
            console.error("DRIVE ERROR:", e.message);
            return;
        }
      }
    }
  }
  console.log("No creds found");
}

run().catch(console.error).finally(() => prisma.$disconnect());
