const { Client } = require('ssh2');
const conn = new Client();
const HOST = '81.0.248.108';
const USERNAME = 'root';
const PASSWORD = '172885Moalin';

conn.on('ready', () => {
    conn.exec('ls -la /root/revlo/.next', (err, stream) => {
        stream.on('data', data => process.stdout.write(data));
        stream.stderr.on('data', data => process.stderr.write(data));
        stream.on('close', () => conn.end());
    });
}).connect({ host: HOST, port: 22, username: USERNAME, password: PASSWORD });
