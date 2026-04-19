const { Client } = require('ssh2');
const conn = new Client();
const HOST = '81.0.248.108';
const USERNAME = 'root';
const PASSWORD = '172885Moalin';

conn.on('ready', () => {
    conn.exec('ls -la /root/revlo/.next/BUILD_ID && pm2 restart revlo', (err, stream) => {
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
          conn.exec('pm2 status', (e, s) => {
            s.on('data', d => process.stdout.write(d));
            s.on('close', () => conn.end());
          });
        });
    });
}).connect({ host: HOST, port: 22, username: USERNAME, password: PASSWORD });
