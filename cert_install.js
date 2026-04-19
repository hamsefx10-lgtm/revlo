const { Client } = require('ssh2');
const conn = new Client();
const HOST = '81.0.248.108';
const USERNAME = 'root';
const PASSWORD = '172885Moalin';

const cmd = 'certbot --nginx -d revlo.me -d www.revlo.me --non-interactive --agree-tos -m hamsemoalin@gmail.com';

conn.on('ready', () => {
    console.log(`Executing SSL installation...`);
    conn.exec(cmd, (err, stream) => {
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => conn.end());
    });
}).connect({ host: HOST, port: 22, username: USERNAME, password: PASSWORD });
