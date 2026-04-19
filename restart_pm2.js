const { Client } = require('ssh2');
const conn = new Client();
const HOST = '81.0.248.108';
const USERNAME = 'root';
const PASSWORD = '172885Moalin';

const commands = [
  'ls /root/revlo/.next/BUILD_ID',
  'pm2 delete revlo || true',
  'cd /root/revlo && pm2 start npm --name "revlo" -- start --cwd /root/revlo',
  'sleep 3',
  'pm2 status',
];

conn.on('ready', () => {
  console.log('🟢 Connected to server!');
  let i = 0;
  function next() {
    if (i >= commands.length) { conn.end(); return; }
    const cmd = commands[i++];
    console.log(`\n▶ Running: ${cmd}`);
    conn.exec(cmd, (err, stream) => {
      if (err) throw err;
      stream.on('data', d => process.stdout.write(d));
      stream.stderr.on('data', d => process.stderr.write(d));
      stream.on('close', next);
    });
  }
  next();
}).connect({ host: HOST, port: 22, username: USERNAME, password: PASSWORD });
