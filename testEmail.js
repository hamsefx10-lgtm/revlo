const { sendEmail } = require("./lib/email");
const zlib = require("zlib");

async function run() {
    const dummyBuffer = zlib.gzipSync(Buffer.from(JSON.stringify({ test: "Hello World" })));

    let html = "<h2>Testing</h2>";
    console.log("Sending email...");
    const res = await sendEmail({
        to: "xamseamiinu@gmail.com",
        subject: "Test Backup Email",
        html: html,
        attachments: [{ filename: "test.gz", content: dummyBuffer }]
    });
    console.log("SEND RES:", res);
}
run();
