const { Client } = require('ssh2');
const conn = new Client();
const HOST = '81.0.248.108';
const USERNAME = 'root';
const PASSWORD = '172885Moalin';

const cmd = 'sed -i "s|NEXTAUTH_URL=http://localhost:3000|NEXTAUTH_URL=https://revlo.me|g" /root/revlo/.env && pm2 restart revlo';

conn.on('ready', () => {
    console.log(`Executing: ${cmd}`);
    conn.exec(cmd, (err, stream) => {
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => conn.end());
    });
}).connect({ host: HOST, port: 22, username: USERNAME, password: PASSWORD });
