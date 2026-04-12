const { PrismaClient } = require("@prisma/client");
const { google } = require("googleapis");
const { Readable } = require("stream");
const zlib = require("zlib");

const prisma = new PrismaClient();

async function run() {
  const settingsList = await prisma.personalizationSettings.findMany();
  for (const setting of settingsList) {
    if (setting.enabledFeatures && typeof setting.enabledFeatures === "object") {
      const features = setting.enabledFeatures;
      if (features.googleClientEmail && features.googlePrivateKey) {
        
        let finalPrivateKey = features.googlePrivateKey;
        let clientEmail = features.googleClientEmail;
        if (finalPrivateKey.trim().startsWith('{')) {
             try {
                 const p = JSON.parse(finalPrivateKey);
                 finalPrivateKey = p.private_key || finalPrivateKey;
                 clientEmail = p.client_email || clientEmail;
             } catch(e) {}
        }
        
        const auth = new google.auth.GoogleAuth({
          credentials: {
            client_email: clientEmail,
            private_key: finalPrivateKey.replace(/\\n/g, "\n")
          },
          scopes: ["https://www.googleapis.com/auth/drive.file"]
        });
        const drive = google.drive({ version: "v3", auth });
        
        const dummyBuffer = zlib.gzipSync(Buffer.from(JSON.stringify({ test: "Hello World" })));
        const bufferStream = new Readable();
        bufferStream.push(dummyBuffer);
        bufferStream.push(null);
        
        console.log("Attempting to upload file to:", features.driveFolderId);
        try {
            const driveRes = await drive.files.create({
                requestBody: {
                    name: "TEST_UPLOAD.json.gz",
                    parents: [features.driveFolderId]
                },
                media: {
                    mimeType: 'application/gzip',
                    body: bufferStream
                },
                fields: 'id, webViewLink, parents'
            });
            console.log("Success! ID:", driveRes.data.id, "Parents:", driveRes.data.parents);
        } catch(e) {
            console.error("UPLOAD ERROR =>", e.message, e.response?.data);
        }
        return;
      }
    }
  }
}
run().catch(console.error).finally(() => prisma.$disconnect());
