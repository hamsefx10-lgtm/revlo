const { Client } = require('ssh2');
const conn = new Client();
const HOST = '81.0.248.108';
const USERNAME = 'root';
const PASSWORD = '172885Moalin';

const fixScript = `
cd /root/revlo
npm install
npx prisma generate
npm run build
pm2 delete revlo || true
pm2 start npm --name "revlo" -- start
pm2 save
`;

conn.on('ready', () => {
    console.log('Fixing build...');
    conn.exec(fixScript, (err, stream) => {
        stream.on('data', data => process.stdout.write(data));
        stream.stderr.on('data', data => process.stderr.write(data));
        stream.on('close', () => {
            console.log("Build restarted.");
            conn.end();
        });
    });
}).connect({ host: HOST, port: 22, username: USERNAME, password: PASSWORD });
