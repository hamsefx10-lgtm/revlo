const http = require('http');
const crypto = require('crypto');

const boundary = '----WebKitFormBoundary' + crypto.randomBytes(8).toString('hex');

const postData = 
`--${boundary}\r\n` +
`Content-Disposition: form-data; name="image"; filename="test.jpg"\r\n` +
`Content-Type: image/jpeg\r\n\r\n` +
`fake_image_data\r\n` +
`--${boundary}--\r\n`;

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/analyze-receipt',
    method: 'POST',
    headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', data);
    });
});

req.on('error', (e) => {
    console.error('Problem with request:', e.message);
});

req.write(postData);
req.end();
