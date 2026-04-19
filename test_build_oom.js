const { Client } = require('ssh2');
const conn = new Client();
const HOST = '81.0.248.108';
const USERNAME = 'root';
const PASSWORD = '172885Moalin';

const cmd = 'cd /root/revlo && export NODE_OPTIONS=--max-old-space-size=8192 && npm run build';

conn.on('ready', () => {
    console.log(`Executing: ${cmd}`);
    conn.exec(cmd, (err, stream) => {
        stream.on('data', d => process.stdout.write(d));
        stream.stderr.on('data', d => process.stderr.write(d));
        stream.on('close', () => {
          console.log('Build completed, restarting PM2...');
          conn.exec('cd /root/revlo && pm2 delete revlo || true && pm2 start npm --name "revlo" --cwd /root/revlo -- start', (err2, stream2) => {
            stream2.on('data', d => process.stdout.write(d));
            stream2.on('close', () => conn.end());
          });
        });
    });
}).connect({ host: HOST, port: 22, username: USERNAME, password: PASSWORD });
