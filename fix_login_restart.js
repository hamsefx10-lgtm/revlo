const { Client } = require('ssh2');
const conn = new Client();
const HOST = '81.0.248.108';
const USERNAME = 'root';
const PASSWORD = '172885Moalin';

const cmd = 'pm2 restart revlo --update-env';

conn.on('ready', () => {
    console.log(`Executing: ${cmd}`);
    conn.exec(cmd, (err, stream) => {
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => conn.end());
    });
}).connect({ host: HOST, port: 22, username: USERNAME, password: PASSWORD });
