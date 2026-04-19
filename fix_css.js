const { Client } = require('ssh2');
const conn = new Client();
const HOST = '81.0.248.108';
const USERNAME = 'root';
const PASSWORD = '172885Moalin';

const fixScript = `
cd /root/revlo
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static
pm2 delete revlo || true
cd .next/standalone
pm2 start server.js --name "revlo" --env PORT=3000
pm2 save
`;

conn.on('ready', () => {
    console.log('Applying standalone fix...');
    conn.exec(fixScript, (err, stream) => {
        stream.on('data', data => process.stdout.write(data));
        stream.stderr.on('data', data => process.stderr.write(data));
        stream.on('close', () => {
            console.log("Fix completed.");
            conn.end();
        });
    });
}).connect({ host: HOST, port: 22, username: USERNAME, password: PASSWORD });
